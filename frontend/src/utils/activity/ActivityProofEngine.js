/**
 * ActivityProofEngine - 活性证明引擎（核心协调器）
 * =============================================
 *
 * 专利点 #3: 加密活性证明协议 (Cryptographic Proof-of-Activity Protocol)
 *
 * 职责：
 * 1. 协调 ActivitySampler 和 BehavioralFingerprint 工作
 * 2. 管理上报周期（每 60 秒一次）
 * 3. 构建带有活性证据的 TimeRecordReport
 * 4. 处理服务端下发的挑战-响应验证
 * 5. 防止网络层面的重放攻击
 *
 * 上报协议安全设计：
 * - 每个报告包含不重叠的时间窗口 [startTime, endTime]
 * - 使用 sessionId + 序列号防止重放
 * - 附时间戳对 (wallClock + monotonic) 防时钟篡改
 * - 附时钟漂移检测数据
 */

// 上报间隔
const REPORT_INTERVAL = 60000      // 60 秒上报一次
const MIN_REPORT_SECONDS = 5       // 最短上报时长（少于 5 秒不报）
const MAX_REPORT_SECONDS = 3600    // 单次上报上限（60 分钟）
const CHALLENGE_CHECK_INTERVAL = 30000  // 挑战检查间隔

export class ActivityProofEngine {
  constructor(options = {}) {
    this.options = {
      reportInterval: options.reportInterval || REPORT_INTERVAL,
      minReportSeconds: options.minReportSeconds || MIN_REPORT_SECONDS,
      maxReportSeconds: options.maxReportSeconds || MAX_REPORT_SECONDS,
      apiEndpoint: options.apiEndpoint || '/api/time/record',
      ...options
    }

    // ── 外部依赖注入 ──
    this._sampler = null           // ActivitySampler 实例
    this._clockDetector = null     // ClockDriftDetector 实例

    // ── 内部状态 ──
    this._running = false
    this._sessionId = null
    this._sequenceNumber = 0
    this._lastReportSequence = 0

    // 时间窗口管理
    this._windowStartTime = 0       // 当前上报窗口起始 (performance.now)
    this._windowWallClockStart = 0  // 当前上报窗口起始 (Date.now)
    this._accumulatedMs = 0         // 本窗口累计毫秒数

    // 定时器
    this._reportTimer = null
    this._challengeCheckTimer = null

    // 上报回调
    this._onReport = null          // 上报前回调
    this._onError = null           // 错误回调

    // 未完成的挑战
    this._pendingChallenge = null

    // 上次上报数据（用于连续性校验）
    this._lastReport = null

    console.log('[ActivityProofEngine] 初始化完成')
  }

  /**
   * 设置依赖
   */
  setDependencies(sampler, clockDetector) {
    this._sampler = sampler
    this._clockDetector = clockDetector
  }

  /**
   * 设置回调
   */
  setCallbacks({ onReport, onError } = {}) {
    if (onReport) this._onReport = onReport
    if (onError) this._onError = onError
  }

  /**
   * 启动证明引擎
   * @param {string} sessionId
   */
  start(sessionId) {
    if (this._running) {
      console.warn('[ActivityProofEngine] 引擎已在运行中')
      return
    }

    this._sessionId = sessionId || `proof_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    this._running = true
    this._sequenceNumber = 0
    this._lastReportSequence = 0

    // 初始化时间窗口
    const now = performance.now()
    this._windowStartTime = now
    this._windowWallClockStart = Date.now()
    this._accumulatedMs = 0

    // 启动采样器和漂移检测
    if (this._sampler) {
      this._sampler.start(this._sessionId)
    }
    if (this._clockDetector) {
      this._clockDetector.start()
    }

    // 启动上报定时器
    this._startReportLoop()

    console.log(`[ActivityProofEngine] 引擎已启动 (sessionId: ${this._sessionId})`)
    return this._sessionId
  }

  /**
   * 停止证明引擎
   */
  stop() {
    if (!this._running) return

    this._running = false
    this._stopReportLoop()

    // 停止采样器和漂移检测
    if (this._sampler) {
      this._sampler.stop()
    }
    if (this._clockDetector) {
      this._clockDetector.stop()
    }

    this._pendingChallenge = null
    this._lastReport = null

    console.log('[ActivityProofEngine] 引擎已停止')
  }

  /**
   * 获取引擎状态
   */
  getStatus() {
    return {
      running: this._running,
      sessionId: this._sessionId,
      sequenceNumber: this._sequenceNumber,
      windowDuration: Math.round(performance.now() - this._windowStartTime),
      accumulatedSeconds: Math.floor(this._accumulatedMs / 1000),
      samplerStatus: this._sampler ? this._sampler.getStatus() : null,
      clockStatus: this._clockDetector ? this._clockDetector.getStatus() : null,
      pendingChallenge: !!this._pendingChallenge
    }
  }

  /**
   * 处理服务端下发的挑战
   * @param {Object} challenge
   */
  handleChallenge(challenge) {
    this._pendingChallenge = challenge
    console.log('[ActivityProofEngine] 收到挑战:', challenge.type)
  }

  // ──────────────────────────────────────────────
  //  上报核心逻辑
  // ──────────────────────────────────────────────

  _startReportLoop() {
    // 首次上报在第一个 REPORT_INTERVAL 后
    this._reportTimer = setTimeout(() => this._doReport(), this.options.reportInterval)

    // 挑战检查定时器（每 30 秒检查是否有未完成的挑战）
    this._challengeCheckTimer = setInterval(() => {
      this._checkPendingChallenge()
    }, CHALLENGE_CHECK_INTERVAL)
  }

  _stopReportLoop() {
    if (this._reportTimer) {
      clearTimeout(this._reportTimer)
      this._reportTimer = null
    }
    if (this._challengeCheckTimer) {
      clearInterval(this._challengeCheckTimer)
      this._challengeCheckTimer = null
    }
  }

  /**
   * 执行上报
   *
   * 核心流程：
   * 1. 确定时间窗口 [startTime, endTime]
   * 2. 从采样器获取窗口内的原始数据
   * 3. 计算行为指纹和有效时长
   * 4. 构造 TimeRecordReport
   * 5. 回调调用方进行实际 HTTP 上报
   * 6. 更新状态
   */
  async _doReport() {
    if (!this._running) return

    const now = performance.now()
    const wallClockNow = Date.now()

    // 计算本窗口的原始流逝时间
    const elapsedMs = Math.min(now - this._windowStartTime, MAX_REPORT_SECONDS * 1000)
    const rawSeconds = Math.floor(elapsedMs / 1000)

    // 更新累计时间
    this._accumulatedMs += elapsedMs

    // 重置新窗口
    const oldWindowStart = this._windowStartTime
    const oldWallClockStart = this._windowWallClockStart
    this._windowStartTime = now
    this._windowWallClockStart = wallClockNow

    // 如果不足最小上报时长则跳过
    if (rawSeconds < this.options.minReportSeconds) {
      this._scheduleNext()
      return
    }

    // 生成序列号
    this._sequenceNumber++
    const seq = this._sequenceNumber

    try {
      // ── 步骤 1: 获取采样数据 ──
      const samples = this._sampler ? this._sampler.getSamples(elapsedMs + 1000) : null

      // ── 步骤 2: 计算行为指纹 ──
      const fingerprint = samples
        ? BehavioralFingerprint.compute(samples, rawSeconds)
        : this._getDefaultFingerprint(rawSeconds)

      // ── 步骤 3: 获取时间戳 ──
      const timePair = this._clockDetector
        ? this._clockDetector.getTimestampPair()
        : { wallClock: wallClockNow, monotonic: now }

      // ── 步骤 4: 构造报告 ──
      const report = this._buildReport({
        seq,
        rawSeconds,
        fingerprint,
        windowStart: oldWindowStart,
        windowEnd: now,
        wallClockStart: oldWallClockStart,
        wallClockEnd: wallClockNow,
        timePair,
        activeSeconds: fingerprint.effectiveSeconds
      })

      // ── 步骤 5: 保存为上次报告 ──
      this._lastReport = {
        seq,
        wallClockEnd: wallClockNow,
        monotonicEnd: now,
        effectiveSeconds: fingerprint.effectiveSeconds
      }

      // ── 步骤 6: 回调上报 ──
      if (this._onReport) {
        await this._onReport(report)
      }

      // ── 步骤 7: 采样器清理（可选） ──
      if (this._sampler) {
        // 清理已处理过的旧数据，只保留最近 5 秒的尾巴用于连续性计算
        const keepFrom = now - 5000
        // 不需要手动清理，采样器有自动修剪机制
      }

    } catch (err) {
      console.error('[ActivityProofEngine] 上报失败:', err)
      if (this._onError) {
        this._onError(err)
      }
      // 失败后仍然推进窗口，避免卡死
    }

    // ── 步骤 8: 调度下次上报 ──
    this._scheduleNext()
  }

  _scheduleNext() {
    if (!this._running) return
    this._reportTimer = setTimeout(() => this._doReport(), this.options.reportInterval)
  }

  /**
   * 构建完整的 TimeRecordReport
   */
  _buildReport({ seq, rawSeconds, fingerprint, windowStart, windowEnd,
                  wallClockStart, wallClockEnd, timePair, activeSeconds }) {

    // 获取时钟同步数据
    const timeSyncData = this._clockDetector
      ? this._clockDetector.getTimeSyncData()
      : null

    return {
      // ── 协议头 ──
      version: '1.0',
      sessionId: this._sessionId,
      sequenceNumber: seq,

      // ── 时间窗口 ──
      reportWindow: {
        startMonotonic: windowStart,
        endMonotonic: windowEnd,
        startWallClock: wallClockStart,
        endWallClock: wallClockEnd,
        durationMs: windowEnd - windowStart
      },

      // ── 时长数据 ──
      rawSeconds,
      claimSeconds: activeSeconds,  // 经行为验证后的有效时长

      // ── 行为指纹 ──
      activityProof: {
        hasActivity: fingerprint.mouse.hasActivity || fingerprint.keystroke.hasActivity,
        overallScore: fingerprint.overallScore,
        mouseEntropy: fingerprint.mouse.entropy,
        mouseFractalDimension: fingerprint.mouse.fractalDimension,
        mouseNaturalness: fingerprint.mouse.naturalnessScore,
        keystrokePresent: fingerprint.keystroke.hasActivity,
        keystrokeCV: fingerprint.keystroke.flightTimeCV,
        windowFocusedRatio: fingerprint.focus.focusedRatio,
        documentVisibleRatio: fingerprint.focus.visibleRatio,
        focusStabilityScore: fingerprint.focus.stabilityScore,
        systemIdleTime: fingerprint.system.avgIdleTime,
        activityRegularity: fingerprint.rhythm.regularityScore,
        suspiciousFlags: fingerprint.suspiciousFlags
      },

      // ── 时间同步数据 ──
      timeSync: timeSyncData,

      // ── 挑战响应 ──
      challengeResponse: this._pendingChallenge
        ? {
            challengeId: this._pendingChallenge.id,
            responseTimestamp: Date.now()
          }
        : null,

      // ── 连续性验证 ──
      continuity: this._lastReport
        ? {
            prevSeq: this._lastReport.seq,
            gapWallClock: wallClockStart - this._lastReport.wallClockEnd,
            // 连续性是否有效：两个窗口不应有重叠或过大间隙
            isValid: (wallClockStart >= this._lastReport.wallClockEnd) &&
                     (wallClockStart - this._lastReport.wallClockEnd < 120000)
          }
        : null
    }
  }

  _getDefaultFingerprint(rawSeconds) {
    // 没有采样器时的降级指纹
    return {
      mouse: { hasActivity: false, entropy: 0, fractalDimension: 1.0,
               naturalnessScore: 0, totalMoves: 0, totalClicks: 0 },
      keystroke: { hasActivity: false, keystrokeScore: 0, flightTimeCV: 0 },
      focus: { focusedRatio: 0.5, visibleRatio: 0.5, stabilityScore: 50 },
      rhythm: { regularityScore: 50 },
      system: { avgIdleTime: 0, naturalnessScore: 50 },
      overallScore: 30,
      suspiciousFlags: ['no_sampler_available'],
      effectiveSeconds: Math.round(rawSeconds * 0.3)
    }
  }

  _checkPendingChallenge() {
    if (this._pendingChallenge) {
      // 检查挑战是否超时
      const elapsed = Date.now() - this._pendingChallenge.issuedAt
      if (elapsed > 120000) {
        // 挑战超时，清除
        console.warn('[ActivityProofEngine] 挑战已超时')
        this._pendingChallenge = null
      }
    }
  }
}

// ── 单例导出 ──
export const activityProofEngine = new ActivityProofEngine()
export default ActivityProofEngine
