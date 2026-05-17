/**
 * ActivitySampler - 原始活性数据采样器
 * =============================================
 *
 * 专利点 #1: 多维活性采样引擎
 * 以固定时间粒度并行采集鼠标轨迹、击键动力学、窗口焦点、
 * 页面可见性和系统空闲状态，生成不可伪造的原始活性数据集。
 *
 * 设计原则：
 * - 事件驱动 + 定时采样混合模式
 * - 环形缓冲区存储最近 120 秒的采样数据（内存占用 < 500KB）
 * - 采样间隔动态调整：活跃时 150ms，空闲时 500ms
 * - 所有时间戳使用 performance.now 防止系统时钟篡改
 */

const SAMPLE_INTERVAL_ACTIVE = 150   // 活跃态采样间隔 (ms)
const SAMPLE_INTERVAL_IDLE = 500     // 空闲态采样间隔 (ms)
const BUFFER_DURATION = 120000       // 环形缓冲区时长 (120 秒)
const MOUSE_IDLE_THRESHOLD = 3000    // 判定鼠标空闲阈值 (3 秒无移动)

export class ActivitySampler {
  constructor(options = {}) {
    this.options = {
      sampleIntervalActive: options.sampleIntervalActive || SAMPLE_INTERVAL_ACTIVE,
      sampleIntervalIdle: options.sampleIntervalIdle || SAMPLE_INTERVAL_IDLE,
      bufferDuration: options.bufferDuration || BUFFER_DURATION,
      ...options
    }

    // ── 内部状态 ──
    this._running = false
    this._sessionId = null
    this._samplingTimer = null

    // ── 鼠标状态 ──
    this._mouseState = {
      lastX: 0,
      lastY: 0,
      lastMoveTime: 0,
      isIdle: true,
      idleDuration: 0
    }

    // ── 键盘状态 ──
    this._keyState = {
      lastKeyUpTime: 0,
      lastKeyDownTime: 0,
      keysDown: new Set()
    }

    // ── 焦点状态 ──
    this._focusState = {
      windowFocused: document.hasFocus(),
      documentVisible: !document.hidden,
      lastFocusChange: performance.now(),
      lastVisibilityChange: performance.now()
    }

    // ── 系统空闲状态 (由 Electron bridge 或后备方案填充) ──
    this._systemIdleState = {
      idleTime: 0,
      screenLocked: false,
      lastUpdate: performance.now()
    }

    // ── 环形缓冲区 ──
    this._samples = {
      mouse: [],       // MouseSample[]
      keyboard: [],    // KeystrokeSample[]
      focus: [],       // FocusSample[]
      system: []       // SystemSample[]
    }

    // ── 事件监听器引用 (用于 removeEventListener) ──
    this._listeners = {}

    // ── UI 事件节流 ──
    this._lastMouseSampleTime = 0
    this._mouseMoveBuffer = []  // 两次采样间的中间点用于计算加速度

    console.log('[ActivitySampler] 初始化完成')
  }

  /**
   * 启动采样
   * @param {string} sessionId - 本次会话唯一标识
   */
  start(sessionId) {
    if (this._running) {
      console.warn('[ActivitySampler] 采样器已在运行中')
      return
    }

    this._sessionId = sessionId || `session_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    this._running = true

    // 重置状态
    this._resetState()

    // 注册事件监听器
    this._registerListeners()

    // 启动定时采样循环
    this._startSamplingLoop()

    // 记录初始焦点状态
    this._recordFocusSample()

    console.log(`[ActivitySampler] 采样器已启动 (sessionId: ${this._sessionId})`)
    return this._sessionId
  }

  /**
   * 停止采样
   */
  stop() {
    if (!this._running) return

    this._running = false
    this._unregisterListeners()
    this._stopSamplingLoop()

    // 清空缓冲区
    this._clearBuffers()

    console.log('[ActivitySampler] 采样器已停止')
  }

  /**
   * 获取最近 N 毫秒内的采样数据
   * @param {number} duration - 获取的时间窗口 (ms)，默认 60 秒
   * @returns {Object} 各类采样数据的快照
   */
  getSamples(duration = 60000) {
    const cutoff = performance.now() - duration

    return {
      mouse: this._samples.mouse.filter(s => s.timestamp >= cutoff),
      keyboard: this._samples.keyboard.filter(s => s.timestamp >= cutoff),
      focus: this._samples.focus.filter(s => s.timestamp >= cutoff),
      system: this._samples.system.filter(s => s.timestamp >= cutoff),
      metadata: {
        sessionId: this._sessionId,
        windowStart: cutoff,
        windowEnd: performance.now(),
        sampleCounts: {
          mouse: this._samples.mouse.filter(s => s.timestamp >= cutoff).length,
          keyboard: this._samples.keyboard.filter(s => s.timestamp >= cutoff).length,
          focus: this._samples.focus.filter(s => s.timestamp >= cutoff).length,
          system: this._samples.system.filter(s => s.timestamp >= cutoff).length
        }
      }
    }
  }

  /**
   * 快速查询：当前会话是否有任何活性证据
   */
  hasAnyActivity() {
    const recent = performance.now() - 30000
    return (
      this._samples.mouse.some(s => s.timestamp >= recent) ||
      this._samples.keyboard.some(s => s.timestamp >= recent) ||
      this._focusState.windowFocused
    )
  }

  /**
   * 获取当前桌面空闲时间（毫秒）
   * 优先使用 Electron powerMonitor，否则用 mouse idle 估算
   */
  getSystemIdleTime() {
    // 如果有 Electron bridge 注入的系统空闲时间
    if (window.__electronSystemIdleTime !== undefined) {
      return window.__electronSystemIdleTime
    }
    // 后备：基于鼠标最后移动时间的估算
    const elapsedSinceLastMouse = performance.now() - this._mouseState.lastMoveTime
    return Math.max(0, Math.floor(elapsedSinceLastMouse))
  }

  /**
   * 获取采样器状态摘要
   */
  getStatus() {
    return {
      running: this._running,
      sessionId: this._sessionId,
      bufferSizes: {
        mouse: this._samples.mouse.length,
        keyboard: this._samples.keyboard.length,
        focus: this._samples.focus.length,
        system: this._samples.system.length
      },
      focusState: { ...this._focusState },
      mouseIdle: this._mouseState.isIdle
    }
  }

  // ──────────────────────────────────────────────
  //  私有方法
  // ──────────────────────────────────────────────

  _resetState() {
    this._mouseState = {
      lastX: 0, lastY: 0, lastMoveTime: performance.now(),
      isIdle: true, idleDuration: 0
    }
    this._keyState = {
      lastKeyUpTime: 0, lastKeyDownTime: 0,
      keysDown: new Set()
    }
    this._focusState = {
      windowFocused: document.hasFocus(),
      documentVisible: !document.hidden,
      lastFocusChange: performance.now(),
      lastVisibilityChange: performance.now()
    }
    this._systemIdleState = {
      idleTime: 0, screenLocked: false, lastUpdate: performance.now()
    }
    this._lastMouseSampleTime = 0
    this._mouseMoveBuffer = []
  }

  _clearBuffers() {
    this._samples.mouse = []
    this._samples.keyboard = []
    this._samples.focus = []
    this._samples.system = []
    this._mouseMoveBuffer = []
  }

  _pruneBuffers() {
    const cutoff = performance.now() - this.options.bufferDuration
    for (const key of Object.keys(this._samples)) {
      const arr = this._samples[key]
      while (arr.length > 0 && arr[0].timestamp < cutoff) {
        arr.shift()
      }
    }
  }

  // ── 采样子方法 ──

  _recordMouseSample(x, y, eventType) {
    const now = performance.now()
    const prev = this._mouseState

    // 速度 = 距离 / 时间差
    const dt = now - (this._lastMouseSampleTime || now)
    const dx = x - prev.lastX
    const dy = y - prev.lastY
    const dist = Math.sqrt(dx * dx + dy * dy)
    const speed = dt > 0 ? dist / dt : 0

    // 加速度 = 速度差 / 时间差 (需要至少 2 个点)
    let acceleration = 0
    if (this._mouseMoveBuffer.length >= 2) {
      const prev2 = this._mouseMoveBuffer[this._mouseMoveBuffer.length - 2]
      const prevDist = Math.sqrt(
        (prev.lastX - prev2.x) ** 2 + (prev.lastY - prev2.y) ** 2
      )
      const prevSpeed = (this._lastMouseSampleTime - prev2.t) > 0
        ? prevDist / (this._lastMouseSampleTime - prev2.t)
        : 0
      acceleration = dt > 0 ? (speed - prevSpeed) / (dt / 1000) : 0
    }

    // 加加速度 (Jerk) = 加速度变化率
    let jerk = 0
    if (this._mouseMoveBuffer.length >= 3) {
      // 简化计算：三点加速度差分
      const p2 = this._mouseMoveBuffer[this._mouseMoveBuffer.length - 2]
      const p3 = this._mouseMoveBuffer[this._mouseMoveBuffer.length - 3]
      const accelDt = (prev.lastMoveTime - p3.t) || 1

      const d1x = prev.lastX - p2.x, d1y = prev.lastY - p2.y
      const d2x = p2.x - p3.x, d2y = p2.y - p3.y
      const accel1 = Math.sqrt(d1x*d1x + d1y*d1y) / (prev.lastMoveTime - p2.t || 1)
      const accel2 = Math.sqrt(d2x*d2x + d2y*d2y) / (p2.t - p3.t || 1)
      jerk = (accel1 - accel2) / (accelDt / 1000)
    }

    const sample = {
      timestamp: now,
      x, y, speed: speed * 1000, // 转换为 像素/秒
      acceleration,
      jerk,
      eventType: eventType || 'move'
    }

    this._samples.mouse.push(sample)
    this._mouseMoveBuffer.push({ x, y, t: now, speed })

    // 更新状态
    prev.lastX = x
    prev.lastY = y
    prev.lastMoveTime = now
    prev.isIdle = false
    prev.idleDuration = 0
    this._lastMouseSampleTime = now

    // 限制 buffer 大小 (最多 2000 点，约 5 分钟 @150ms)
    if (this._mouseMoveBuffer.length > 2000) {
      this._mouseMoveBuffer.shift()
    }
  }

  _recordKeyboardSample(event) {
    const now = performance.now()
    const isKeyDown = event.type === 'keydown'

    const sample = {
      timestamp: now,
      key: event.key,
      code: event.code,
      type: isKeyDown ? 'down' : 'up',
      // 击键间隔数据
      flightTime: isKeyDown
        ? (this._keyState.lastKeyUpTime > 0 ? now - this._keyState.lastKeyUpTime : 0)
        : 0,
      dwellTime: isKeyDown
        ? 0
        : (this._keyState.lastKeyDownTime > 0 ? now - this._keyState.lastKeyDownTime : 0)
    }

    this._samples.keyboard.push(sample)

    // 更新状态
    if (isKeyDown) {
      this._keyState.keysDown.add(event.code)
      this._keyState.lastKeyDownTime = now
    } else {
      this._keyState.keysDown.delete(event.code)
      this._keyState.lastKeyUpTime = now
    }
  }

  _recordFocusSample() {
    const now = performance.now()
    const sample = {
      timestamp: now,
      windowFocused: this._focusState.windowFocused,
      documentVisible: this._focusState.documentVisible
    }
    this._samples.focus.push(sample)
  }

  _recordSystemSample() {
    const now = performance.now()
    const sample = {
      timestamp: now,
      systemIdleTime: this.getSystemIdleTime(),
      screenLocked: this._systemIdleState.screenLocked
    }
    this._samples.system.push(sample)
  }

  // ── 事件监听器管理 ──

  _registerListeners() {
    // 鼠标事件
    this._listeners.mousemove = (e) => this._onMouseMove(e)
    this._listeners.mousedown = (e) => this._onMouseDown(e)
    this._listeners.mouseup = (e) => this._onMouseUp(e)
    this._listeners.wheel = (e) => this._onWheel(e)

    document.addEventListener('mousemove', this._listeners.mousemove, { passive: true })
    document.addEventListener('mousedown', this._listeners.mousedown, { passive: true })
    document.addEventListener('mouseup', this._listeners.mouseup, { passive: true })
    document.addEventListener('wheel', this._listeners.wheel, { passive: true })

    // 键盘事件
    this._listeners.keydown = (e) => this._onKeyDown(e)
    this._listeners.keyup = (e) => this._onKeyUp(e)

    document.addEventListener('keydown', this._listeners.keydown, { passive: true })
    document.addEventListener('keyup', this._listeners.keyup, { passive: true })

    // 焦点事件
    this._listeners.focus = () => this._onWindowFocus()
    this._listeners.blur = () => this._onWindowBlur()

    window.addEventListener('focus', this._listeners.focus)
    window.addEventListener('blur', this._listeners.blur)

    // 页面可见性
    this._listeners.visibilitychange = () => this._onVisibilityChange()

    document.addEventListener('visibilitychange', this._listeners.visibilitychange)
  }

  _unregisterListeners() {
    document.removeEventListener('mousemove', this._listeners.mousemove)
    document.removeEventListener('mousedown', this._listeners.mousedown)
    document.removeEventListener('mouseup', this._listeners.mouseup)
    document.removeEventListener('wheel', this._listeners.wheel)
    document.removeEventListener('keydown', this._listeners.keydown)
    document.removeEventListener('keyup', this._listeners.keyup)
    window.removeEventListener('focus', this._listeners.focus)
    window.removeEventListener('blur', this._listeners.blur)
    document.removeEventListener('visibilitychange', this._listeners.visibilitychange)
  }

  // ── 事件处理器 ──

  _onMouseMove(e) {
    this._mouseState.isIdle = false
    this._mouseState.idleDuration = 0

    // 节流：不超过采样率频率
    const now = performance.now()
    if (now - this._lastMouseSampleTime < this.options.sampleIntervalActive) {
      // 但仍收集加速计算用的中间点
      this._mouseMoveBuffer.push({ x: e.clientX, y: e.clientY, t: now })
      if (this._mouseMoveBuffer.length > 2000) this._mouseMoveBuffer.shift()
      return
    }

    this._recordMouseSample(e.clientX, e.clientY, 'move')
  }

  _onMouseDown(e) {
    this._recordMouseSample(e.clientX, e.clientY, 'click')
    this._mouseState.isIdle = false
    this._mouseState.idleDuration = 0
  }

  _onMouseUp(e) {
    // 不额外采样，避免重复
  }

  _onWheel(e) {
    const now = performance.now()
    if (now - this._lastMouseSampleTime < this.options.sampleIntervalActive) return
    this._recordMouseSample(e.clientX, e.clientY, 'scroll')
    this._mouseState.isIdle = false
    this._mouseState.idleDuration = 0
  }

  _onKeyDown(e) {
    // 忽略修饰键单独按下
    if (['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) return

    this._recordKeyboardSample(e)
    this._mouseState.isIdle = false  // 键盘活动也重置鼠标空闲计时
    this._mouseState.idleDuration = 0
  }

  _onKeyUp(e) {
    if (['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) return
    this._recordKeyboardSample(e)
  }

  _onWindowFocus() {
    const now = performance.now()
    this._focusState.windowFocused = true
    this._focusState.lastFocusChange = now
    this._recordFocusSample()
  }

  _onWindowBlur() {
    const now = performance.now()
    this._focusState.windowFocused = false
    this._focusState.lastFocusChange = now
    this._recordFocusSample()
  }

  _onVisibilityChange() {
    const now = performance.now()
    this._focusState.documentVisible = !document.hidden
    this._focusState.lastVisibilityChange = now
    this._recordFocusSample()
  }

  // ── 采样循环 ──

  _startSamplingLoop() {
    const loop = () => {
      if (!this._running) return

      // 更新鼠标空闲状态
      const now = performance.now()
      const timeSinceLastMove = now - this._mouseState.lastMoveTime
      if (timeSinceLastMove > MOUSE_IDLE_THRESHOLD) {
        this._mouseState.isIdle = true
        this._mouseState.idleDuration = timeSinceLastMove
      }

      // 定期记录系统和焦点快照（每 1 秒）
      if (this._samples.system.length === 0 ||
          now - this._samples.system[this._samples.system.length - 1].timestamp >= 1000) {
        this._recordSystemSample()
      }

      // 修剪旧数据
      this._pruneBuffers()

      // 自适应采样间隔
      const interval = this._mouseState.isIdle
        ? this.options.sampleIntervalIdle
        : this.options.sampleIntervalActive

      this._samplingTimer = setTimeout(loop, interval)
    }

    // 启动循环
    this._samplingTimer = setTimeout(loop, this.options.sampleIntervalActive)
  }

  _stopSamplingLoop() {
    if (this._samplingTimer) {
      clearTimeout(this._samplingTimer)
      this._samplingTimer = null
    }
  }
}

// ── 单例导出 ──
export const activitySampler = new ActivitySampler()
export default ActivitySampler
