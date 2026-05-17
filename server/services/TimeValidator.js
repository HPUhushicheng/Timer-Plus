/**
 * TimeValidator - 服务端时长验证服务
 * =============================================
 *
 * 专利点 #4: 服务端多层验证引擎
 *
 * 对客户端上报的 TimeRecordReport 进行多层验证：
 * 1. 数据完整性验证 — 检查必填字段
 * 2. 时间连续性验证 — 前后上报窗口不能重叠、不能有异常间隙
 * 3. 行为指纹验证 — 检查活性证据的合理性
 * 4. 时钟健康验证 — 检查是否有时钟篡改痕迹
 * 5. 会话连续性验证 — sessionId 和 sequenceNumber 不能跳变
 */

const crypto = require('crypto')

// 验证阈值
const THRESHOLDS = {
  MAX_WALL_CLOCK_GAP: 120000,       // 两次上报最大允许间隔 (ms)
  MIN_WALL_CLOCK_GAP: -5000,        // 最小间隔（负值表示允许 5s 以内的时钟偏差）
  MAX_REPORT_DURATION: 7200000,     // 单次上报最大时长 (2小时)
  MIN_SEQUENCE_GAP: 0,              // sequenceNumber 必须严格递增
  MAX_SEQUENCE_RESET: 100,          // 允许的最大 sequenceNumber gap (网络丢包)
  MIN_ACTIVITY_SCORE: 0,            // 活性评分下限
  MAX_ACTIVITY_SCORE: 100,          // 活性评分上限
  SUSPICIOUS_CLAIM_RATIO: 0.95,     // 有效时长/原始时长比率上限（防止欺诈）
}

class TimeValidator {
  /**
   * 验证上报数据的完整性和合法性
   * @param {Object} report - 客户端上报数据
   * @param {Object} context - 验证上下文 { previousReport, userBaseline }
   * @returns {Object} { valid: boolean, reasons: string[], adjustedSeconds: number }
   */
  validate(report, context = {}) {
    const reasons = []
    let adjustedSeconds = report._claimSeconds || report.hourtime || 0

    // ── 1. 基本字段验证 ──
    if (!report.id || !report.date) {
      return { valid: false, reasons: ['missing_required_fields'], adjustedSeconds: 0 }
    }

    const rawSeconds = report.hourtime || 0
    if (rawSeconds <= 0 || rawSeconds > 3600) {
      reasons.push('invalid_raw_seconds')
      adjustedSeconds = 0
    }

    // ── 2. 活性评分验证 ──
    const score = report._activityScore !== undefined ? report._activityScore : 100
    if (score < 0 || score > 100) {
      reasons.push('invalid_activity_score')
    }

    // ── 3. 有效时长不能超过原始时长 ──
    if (adjustedSeconds > rawSeconds) {
      reasons.push('claim_exceeds_raw')
      adjustedSeconds = rawSeconds
    }

    // ── 4. 有效时长不能超过原始时长的 95%（防止欺诈性上报） ──
    if (rawSeconds > 0 && adjustedSeconds > rawSeconds * THRESHOLDS.SUSPICIOUS_CLAIM_RATIO) {
      // 有异常，但仍然接收，标记
      reasons.push('suspiciously_high_claim_ratio')
    }

    // ── 5. 时间连续性验证 ──
    if (context.previousReport) {
      const continuityResult = this._validateContinuity(report, context.previousReport)
      reasons.push(...continuityResult.reasons)
      if (continuityResult.timeDiscountFactor < 1) {
        adjustedSeconds = Math.round(adjustedSeconds * continuityResult.timeDiscountFactor)
      }
    }

    // ── 6. 行为指纹验证 ──
    if (context.userBaseline) {
      const behaviorResult = this._validateBehavior(report, context.userBaseline)
      reasons.push(...behaviorResult.reasons)
      if (behaviorResult.behaviorDiscountFactor < 1) {
        adjustedSeconds = Math.round(adjustedSeconds * behaviorResult.behaviorDiscountFactor)
      }
    }

    // ── 7. 可疑标记验证 ──
    const flags = report._suspiciousFlags || []
    if (flags.includes('script_like_mouse_trajectory') ||
        flags.includes('noise_like_mouse_trajectory') ||
        flags.includes('window_never_focused') ||
        flags.includes('mouse_only_automation')) {
      reasons.push('severe_suspicious_flag:' + flags.filter(f =>
        ['script_like_mouse_trajectory','noise_like_mouse_trajectory',
         'window_never_focused','mouse_only_automation'].includes(f)
      ).join(','))
      // 服务端额外扣除
      adjustedSeconds = Math.round(adjustedSeconds * 0.5)
    }

    // ── 8. 时钟健康验证 ──
    if (report._clockHealthy === false) {
      reasons.push('clock_tampering_detected')
      adjustedSeconds = Math.round(adjustedSeconds * 0.3)
    }

    // 保底：不少于 1 秒（防止争议）
    if (adjustedSeconds <= 0 && rawSeconds > 30) {
      adjustedSeconds = 1
    }

    return {
      valid: reasons.length === 0,
      reasons,
      adjustedSeconds,
      discountRatio: rawSeconds > 0 ? adjustedSeconds / rawSeconds : 0
    }
  }

  /**
   * 验证时间连续性
   */
  _validateContinuity(report, previousReport) {
    const reasons = []
    let timeDiscountFactor = 1.0

    // 检查时间重叠
    if (report._continuity) {
      if (report._continuity.isValid === false) {
        reasons.push('time_continuity_break')
        timeDiscountFactor = 0.5
      }
      if (report._continuity.gapWallClock < -5000) {
        reasons.push('time_window_overlap')
        timeDiscountFactor = 0.3
      }
      if (report._continuity.gapWallClock > 120000) {
        reasons.push('time_window_too_large_gap')
        timeDiscountFactor = 0.7
      }
    }

    // 检查序列号连续性
    if (report._sequenceNumber !== undefined && previousReport._sequenceNumber !== undefined) {
      const seqGap = report._sequenceNumber - previousReport._sequenceNumber
      if (seqGap <= 0) {
        reasons.push('sequence_number_not_increasing')
        timeDiscountFactor = Math.min(timeDiscountFactor, 0.5)
      } else if (seqGap > THRESHOLDS.MAX_SEQUENCE_RESET) {
        reasons.push('sequence_number_jump')
        timeDiscountFactor = Math.min(timeDiscountFactor, 0.8)
      }
    }

    // 检查 sessionId 一致性
    if (report._sessionId && previousReport._sessionId &&
        report._sessionId !== previousReport._sessionId) {
      reasons.push('session_id_changed')
      timeDiscountFactor = Math.min(timeDiscountFactor, 0.5)
    }

    return { reasons, timeDiscountFactor }
  }

  /**
   * 验证行为指纹
   */
  _validateBehavior(report, baseline) {
    const reasons = []
    let behaviorDiscountFactor = 1.0

    const proof = report._activityProof || {}

    // 与基线对比：活性评分是否异常
    if (proof.overallScore !== undefined && baseline.avgScore !== undefined) {
      const sigma = baseline.scoreStdDev || 15
      const zScore = Math.abs(proof.overallScore - baseline.avgScore) / Math.max(sigma, 1)

      if (zScore > 3) {
        reasons.push(`behavior_zscore_anomaly:${zScore.toFixed(1)}`)
        behaviorDiscountFactor = Math.min(behaviorDiscountFactor, 0.6)
      }
    }

    // 鼠标分形维度异常
    if (proof.mouseFractalDimension !== undefined && baseline.avgFractalDim !== undefined) {
      const dimSigma = baseline.fractalDimStdDev || 0.1
      const dimZ = Math.abs(proof.mouseFractalDimension - baseline.avgFractalDim) / Math.max(dimSigma, 0.05)

      if (dimZ > 3) {
        reasons.push(`fractal_dimension_anomaly:${dimZ.toFixed(1)}`)
        behaviorDiscountFactor = Math.min(behaviorDiscountFactor, 0.5)
      }
    }

    return { reasons, behaviorDiscountFactor }
  }
}

module.exports = { TimeValidator }
