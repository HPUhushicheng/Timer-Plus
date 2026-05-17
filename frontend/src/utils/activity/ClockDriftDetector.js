/**
 * ClockDriftDetector - 时钟漂移/篡改检测器
 * =============================================
 *
 * 专利辅助模块：防止用户通过修改系统时间来伪造时长。
 *
 * 检测方法：
 * 1. performance.now() vs Date.now() 的差值监控
 *    — performance.now() 基于进程启动时间，不受系统时钟影响
 *    — Date.now() 受系统时钟影响
 *    正常情况下两者的相对关系应当是单调递增的
 *
 * 2. Date.now() 的跳变检测
 *    — 正常 NTP 同步导致的时间调整通常 < 500ms
 *    — 手动改时间会导致 > 1000ms 的跳变
 *
 * 3. 上报时间戳校验
 *    — 每个上报窗口记录 wallClockStart/End 和 monotonicStart/End
 *    — 服务端对比前后上报的时间窗口是否存在重叠或巨大间隙
 */

const MAX_CLOCK_DRIFT = 1000       // 最大允许时钟漂移 (毫秒) — 超过则标记
const DRIFT_CHECK_INTERVAL = 5000  // 漂移检查间隔 (毫秒)
const MIN_SAMPLE_COUNT = 6         // 最少采样次数才开始判定
const JUMP_THRESHOLD = 2000        // 时间跳变阈值 (毫秒)

export class ClockDriftDetector {
  constructor() {
    // 基准值：记录启动时两个时钟的差值
    this._baseDrift = performance.now() - Date.now()
    this._samples = []
    this._lastCheckTime = 0
    this._jumpsDetected = 0
    this._totalJumps = 0
    this._running = false
    this._checkTimer = null
  }

  /**
   * 开始监控
   */
  start() {
    if (this._running) return
    this._running = true
    this._baseDrift = performance.now() - Date.now()
    this._samples = []
    this._jumpsDetected = 0
    this._totalJumps = 0
    this._check()
  }

  /**
   * 停止监控
   */
  stop() {
    this._running = false
    if (this._checkTimer) {
      clearTimeout(this._checkTimer)
      this._checkTimer = null
    }
  }

  /**
   * 获取时钟健康状况摘要
   * @returns {Object}
   */
  getStatus() {
    return {
      healthy: this.isHealthy(),
      currentDrift: this._samples.length > 0
        ? this._samples[this._samples.length - 1].drift
        : 0,
      jumpsDetected: this._jumpsDetected,
      totalJumps: this._totalJumps,
      sampleCount: this._samples.length,
      maxDrift: this._samples.length > 0
        ? Math.max(...this._samples.map(s => Math.abs(s.drift)))
        : 0,
      clockJumped: this._totalJumps > 0
    }
  }

  /**
   * 时钟是否健康（未被篡改）
   */
  isHealthy() {
    if (this._samples.length < MIN_SAMPLE_COUNT) return true
    const maxAbsDrift = Math.max(...this._samples.map(s => Math.abs(s.drift)))
    return maxAbsDrift < MAX_CLOCK_DRIFT && this._totalJumps === 0
  }

  /**
   * 获取时间同步数据（用于上报）
   */
  getTimeSyncData() {
    return {
      baseDrift: this._baseDrift,
      sampleCount: this._samples.length,
      maxDrift: this._samples.length > 0
        ? Math.max(...this._samples.map(s => Math.abs(s.drift)))
        : 0,
      jumpsDetected: this._totalJumps,
      clockHealthy: this.isHealthy()
    }
  }

  /**
   * 获取包装后的时间戳
   * wallClock = Date.now() (可能被篡改)
   * monotonic = performance.now() (不可篡改)
   * 服务端通过对比前后上报的 wallClock 差值 vs monotonic 差值来判断
   */
  getTimestampPair() {
    return {
      wallClock: Date.now(),
      monotonic: performance.now()
    }
  }

  // ── 内部 ──

  _check() {
    if (!this._running) return

    const perfNow = performance.now()
    const dateNow = Date.now()
    const drift = perfNow - dateNow

    this._samples.push({
      timestamp: perfNow,
      drift,
      perfNow,
      dateNow
    })

    // 限制样本数
    if (this._samples.length > 100) {
      this._samples.shift()
    }

    // 检测跳变
    if (this._samples.length >= 2) {
      const prev = this._samples[this._samples.length - 2]
      const driftChange = Math.abs(drift - prev.drift)
      if (driftChange > JUMP_THRESHOLD) {
        this._totalJumps++
        console.warn(`[ClockDriftDetector] 检测到时钟跳变! drift变化: ${Math.round(driftChange)}ms`)
      }
    }

    this._checkTimer = setTimeout(() => this._check(), DRIFT_CHECK_INTERVAL)
  }
}

export const clockDriftDetector = new ClockDriftDetector()
export default ClockDriftDetector
