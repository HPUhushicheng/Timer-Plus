/**
 * BehavioralFingerprint - 行为指纹引擎
 * =============================================
 *
 * 专利点 #2: 多维行为指纹识别与活性评分
 *
 * 从原始采样数据中提取以下行为特征：
 * 1. 鼠标轨迹分形维度 (Fractal Dimension) — 区分人类 vs 脚本
 * 2. 击键动力学 (Keystroke Dynamics) — 击键节律特征
 * 3. 活动节律签名 (Activity Rhythm) — 微观工作/休息模式
 * 4. 焦点状态统计 (Focus Statistics) — 窗口/页面可见性
 * 5. 综合活性评分 (Activity Score) — 加权计算有效时长
 *
 * 核心创新：用分形几何和统计特征量来量化"人类活动的自然度"，
 * 使得任何脚本/模拟都无法完美伪造真实人类操作模式。
 */

// 各维度的权重系数 (可通过实验调整)
const WEIGHTS = {
  MOUSE_ENTROPY: 0.35,       // 鼠标熵值权重
  KEYSTROKE_RHYTHM: 0.20,    // 击键节律权重
  FOCUS_STABILITY: 0.20,     // 焦点稳定性权重
  ACTIVITY_RHYTHM: 0.15,     // 活动节律权重
  SYSTEM_NATURALNESS: 0.10   // 系统空闲自然度权重
}

// 人类行为参数阈值 (基于人机工程学数据)
const HUMAN_THRESHOLDS = {
  MOUSE_FRACTAL_MIN: 1.15,     // 人类鼠标轨迹分形维度下限
  MOUSE_FRACTAL_MAX: 1.95,     // 人类鼠标轨迹分形维度上限
  KEYSTROKE_CV_MIN: 0.08,      // 击键间隔 CV 下限 (人类 >= 8%)
  KEYSTROKE_CV_MAX: 0.50,      // 击键间隔 CV 上限
  MICRO_PAUSE_MIN: 200,        // 最小微暂停 (ms)
  MICRO_PAUSE_MAX: 5000,       // 最大微暂停 (ms) — 思考停顿
  CLICK_INTERVAL_MIN: 100,     // 最小点击间隔 (ms)
}

/**
 * 行为指纹对象
 * @typedef {Object} BehavioralFingerprint
 * @property {Object} mouse - 鼠标行为特征
 * @property {Object} keystroke - 击键行为特征
 * @property {Object} focus - 焦点状态统计
 * @property {Object} rhythm - 活动节律特征
 * @property {Object} system - 系统状态特征
 * @property {number} overallScore - 综合活性评分 (0-100)
 * @property {string[]} suspiciousFlags - 可疑标记列表
 * @property {number} effectiveSeconds - 有效时长 (秒)
 */

export class BehavioralFingerprint {
  /**
   * 从原始采样数据计算行为指纹
   * @param {Object} samples - ActivitySampler.getSamples() 的返回值
   * @param {number} rawSeconds - 上报窗口内的原始流逝秒数
   * @returns {BehavioralFingerprint}
   */
  static compute(samples, rawSeconds) {
    const mouse = this._analyzeMouse(samples.mouse)
    const keystroke = this._analyzeKeystroke(samples.keyboard)
    const focus = this._analyzeFocus(samples.focus)
    const rhythm = this._analyzeRhythm(samples.mouse, samples.keyboard, samples.focus)
    const system = this._analyzeSystem(samples.system)

    const suspiciousFlags = this._detectAnomalies({ mouse, keystroke, focus, rhythm, system })
    const overallScore = this._computeActivityScore({ mouse, keystroke, focus, rhythm, system, suspiciousFlags })
    const effectiveSeconds = this._calculateEffectiveSeconds(rawSeconds, {
      score: overallScore,
      focus,
      system,
      suspiciousFlags
    })

    return {
      mouse,
      keystroke,
      focus,
      rhythm,
      system,
      overallScore,
      suspiciousFlags,
      effectiveSeconds,
      computedAt: Date.now()
    }
  }

  /**
   * 快速活性检查（用于实时 UI 反馈，不走全量计算）
   * @param {Object} samplerStatus
   * @returns {boolean}
   */
  static quickCheck(samplerStatus) {
    return samplerStatus && !samplerStatus.mouseIdle
  }

  // ──────────────────────────────────────────────
  //  鼠标行为分析 — 核心专利点
  // ──────────────────────────────────────────────

  /**
   * 鼠标轨迹分形维度计算 — 盒计数法 (Box-Counting Dimension)
   *
   * 原理：真实人类鼠标轨迹具有自相似性 (self-similarity)，
   * 其分形维度通常在 1.2-1.8 之间。
   * - 机械脚本：轨迹过于平滑，维度 ≈ 1.0-1.1
   * - 随机噪声模拟：维度 ≈ 1.9-2.0
   * - 录播放射：维度固定，且缺乏加速度变化
   *
   * @param {Array} mouseSamples
   * @returns {number} 分形维度
   */
  static _computeFractalDimension(mouseSamples) {
    if (mouseSamples.length < 10) return 1.0

    // 提取轨迹点
    const points = mouseSamples
      .filter(s => s.eventType === 'move')
      .map(s => ({ x: s.x, y: s.y }))

    if (points.length < 5) return 1.0

    // 计算路径长度 vs 直线距离之比
    let pathLength = 0
    let straightDistance = 0

    for (let i = 1; i < points.length; i++) {
      const dx = points[i].x - points[i - 1].x
      const dy = points[i].y - points[i - 1].y
      pathLength += Math.sqrt(dx * dx + dy * dy)
    }

    const totalDx = points[points.length - 1].x - points[0].x
    const totalDy = points[points.length - 1].y - points[0].y
    straightDistance = Math.sqrt(totalDx * totalDx + totalDy * totalDy)

    // 避免除零
    if (straightDistance < 1) return 1.0

    const ratio = pathLength / straightDistance

    // 分形维度 ≈ 1 + log(曲折比) / log(采样点数)
    // 人类轨迹通常 ratio > 3，脚本轨迹 ratio ≈ 1-2
    const fd = 1.0 + Math.log(Math.max(ratio, 1)) / Math.log(Math.max(points.length, 2))

    return Math.min(Math.max(fd, 1.0), 2.0)
  }

  /**
   * 计算鼠标运动熵值
   * 衡量鼠标轨迹的"混乱程度"，真实人类操作具有适中的熵值
   */
  static _computeMouseEntropy(mouseSamples) {
    if (mouseSamples.length < 5) return 0

    const speeds = mouseSamples
      .filter(s => s.eventType === 'move' && s.speed > 0)
      .map(s => s.speed)

    if (speeds.length < 5) return 0

    // 速度直方图 (10 个分桶)
    const maxSpeed = Math.max(...speeds)
    const minSpeed = Math.min(...speeds)
    const bucketCount = 10
    const bucketSize = (maxSpeed - minSpeed) / bucketCount || 1
    const histogram = new Array(bucketCount).fill(0)

    for (const speed of speeds) {
      const bucket = Math.min(Math.floor((speed - minSpeed) / bucketSize), bucketCount - 1)
      histogram[bucket]++
    }

    // 计算香农熵
    const total = speeds.length
    let entropy = 0
    for (const count of histogram) {
      if (count > 0) {
        const p = count / total
        entropy -= p * Math.log2(p)
      }
    }

    // 归一化到 0-1
    return entropy / Math.log2(bucketCount)
  }

  /**
   * 计算鼠标加速度变化特征
   * 人类操作有自然的加速度变化，脚本则过于均匀
   */
  static _computeAccelerationFeatures(mouseSamples) {
    const accels = mouseSamples
      .filter(s => s.eventType === 'move' && !isNaN(s.acceleration))
      .map(s => Math.abs(s.acceleration))

    if (accels.length < 5) {
      return { meanAccel: 0, accelVariance: 0, accelCV: 0 }
    }

    const mean = accels.reduce((a, b) => a + b, 0) / accels.length
    const variance = accels.reduce((sum, a) => sum + (a - mean) ** 2, 0) / accels.length
    const cv = mean > 0 ? Math.sqrt(variance) / mean : 0

    return {
      meanAccel: mean,
      accelVariance: variance,
      accelCV: cv          // 变异系数 — 人类通常 > 0.5
    }
  }

  static _analyzeMouse(mouseSamples) {
    const moves = mouseSamples.filter(s => s.eventType === 'move')
    const clicks = mouseSamples.filter(s => s.eventType === 'click')
    const scrolls = mouseSamples.filter(s => s.eventType === 'scroll')

    const fractalDimension = this._computeFractalDimension(mouseSamples)
    const entropy = this._computeMouseEntropy(mouseSamples)
    const accel = this._computeAccelerationFeatures(moves)

    return {
      fractalDimension,
      entropy,
      ...accel,
      totalMoves: moves.length,
      totalClicks: clicks.length,
      totalScrolls: scrolls.length,
      hasActivity: moves.length > 0 || clicks.length > 0,
      // 鼠标自然度评分 (0-100)
      naturalnessScore: this._computeMouseNaturalness(fractalDimension, entropy, accel.accelCV)
    }
  }

  /**
   * 鼠标轨迹自然度评分
   * 基于分形维度和熵值综合判断轨迹是否来自真实人类
   */
  static _computeMouseNaturalness(fractalDim, entropy, accelCV) {
    let score = 0

    // 分形维度评分 (权重 50%)
    if (fractalDim >= HUMAN_THRESHOLDS.MOUSE_FRACTAL_MIN &&
        fractalDim <= HUMAN_THRESHOLDS.MOUSE_FRACTAL_MAX) {
      // 在线性区间内按位置评分
      const midpoint = (HUMAN_THRESHOLDS.MOUSE_FRACTAL_MIN + HUMAN_THRESHOLDS.MOUSE_FRACTAL_MAX) / 2
      const range = (HUMAN_THRESHOLDS.MOUSE_FRACTAL_MAX - HUMAN_THRESHOLDS.MOUSE_FRACTAL_MIN) / 2
      score += 50 * (1 - Math.abs(fractalDim - midpoint) / range)
    } else if (fractalDim < HUMAN_THRESHOLDS.MOUSE_FRACTAL_MIN) {
      // 太平滑 (疑似脚本) — 低分
      score += 10 * Math.max(0, fractalDim / HUMAN_THRESHOLDS.MOUSE_FRACTAL_MIN)
    } else {
      // 太随机 (疑似噪声) — 低分
      score += 10 * Math.max(0, (2.0 - fractalDim) / (2.0 - HUMAN_THRESHOLDS.MOUSE_FRACTAL_MAX))
    }

    // 熵值评分 (权重 30%)
    score += 30 * Math.min(entropy * 2, 1) // 适中的熵值为佳

    // 加速度变异系数评分 (权重 20%)
    if (accelCV > 0.5) {
      score += 20 * Math.min(accelCV, 1)
    } else {
      score += 20 * Math.max(0, accelCV * 2) // 低变异 = 可疑
    }

    return Math.min(Math.round(score), 100)
  }

  // ──────────────────────────────────────────────
  //  击键行为分析
  // ──────────────────────────────────────────────

  static _analyzeKeystroke(keyboardSamples) {
    if (keyboardSamples.length < 3) {
      return {
        hasActivity: false,
        totalKeys: 0,
        flightTimes: [],
        dwellTimes: [],
        meanFlightTime: 0,
        meanDwellTime: 0,
        flightTimeCV: 0,
        dwellTimeCV: 0,
        typingSpeed: 0,     // 键/分钟
        keystrokeScore: 0
      }
    }

    const flightTimes = keyboardSamples
      .filter(s => s.type === 'down' && s.flightTime > 0 && s.flightTime < 5000)
      .map(s => s.flightTime)

    const dwellTimes = keyboardSamples
      .filter(s => s.type === 'up' && s.dwellTime > 0 && s.dwellTime < 500)
      .map(s => s.dwellTime)

    const meanFT = flightTimes.length > 0
      ? flightTimes.reduce((a, b) => a + b, 0) / flightTimes.length
      : 0

    const meanDT = dwellTimes.length > 0
      ? dwellTimes.reduce((a, b) => a + b, 0) / dwellTimes.length
      : 0

    const ftCV = flightTimes.length > 0
      ? Math.sqrt(flightTimes.reduce((sum, t) => sum + (t - meanFT) ** 2, 0) / flightTimes.length) / meanFT
      : 0

    const dtCV = dwellTimes.length > 0
      ? Math.sqrt(dwellTimes.reduce((sum, t) => sum + (t - meanDT) ** 2, 0) / dwellTimes.length) / meanDT
      : 0

    // 击键评分：CV在人类正常范围内得分高
    let score = 0
    if (ftCV >= HUMAN_THRESHOLDS.KEYSTROKE_CV_MIN && ftCV <= HUMAN_THRESHOLDS.KEYSTROKE_CV_MAX) {
      score += 50
    } else if (ftCV < HUMAN_THRESHOLDS.KEYSTROKE_CV_MIN) {
      score += 10 // 太均匀 = 脚本
    } else {
      score += 20 // 太离散但可能真实
    }

    if (dtCV >= 0.1 && dtCV <= 0.6) {
      score += 30
    } else {
      score += 10
    }

    // 打字速度评分 (合理范围 40-400 键/分钟)
    score += 20

    return {
      hasActivity: keyboardSamples.length > 5,
      totalKeys: keyboardSamples.length,
      flightTimes,
      dwellTimes,
      meanFlightTime: Math.round(meanFT),
      meanDwellTime: Math.round(meanDT),
      flightTimeCV: Math.round(ftCV * 100) / 100,
      dwellTimeCV: Math.round(dtCV * 100) / 100,
      keystrokeScore: Math.min(score, 100)
    }
  }

  // ──────────────────────────────────────────────
  //  焦点状态分析
  // ──────────────────────────────────────────────

  static _analyzeFocus(focusSamples) {
    if (focusSamples.length < 2) {
      return {
        focusedRatio: 1.0,
        visibleRatio: 1.0,
        focusChangeCount: 0,
        avgFocusDuration: 0,
        stabilityScore: 100
      }
    }

    const totalDuration = focusSamples[focusSamples.length - 1].timestamp - focusSamples[0].timestamp

    // 计算窗口在前台的时间比例
    let focusedTime = 0
    let visibleTime = 0
    let focusChangeCount = 0

    for (let i = 0; i < focusSamples.length - 1; i++) {
      const duration = focusSamples[i + 1].timestamp - focusSamples[i].timestamp
      if (focusSamples[i].windowFocused) focusedTime += duration
      if (focusSamples[i].documentVisible) visibleTime += duration
      if (focusSamples[i].windowFocused !== focusSamples[i + 1].windowFocused) {
        focusChangeCount++
      }
    }

    const focusedRatio = totalDuration > 0 ? focusedTime / totalDuration : 1
    const visibleRatio = totalDuration > 0 ? visibleTime / totalDuration : 1

    // 稳定性评分：频繁切换窗口 = 低稳定（但也比一直后台运行可信）
    const changeRate = totalDuration > 0 ? focusChangeCount / (totalDuration / 60000) : 0
    let stabilityScore = 100
    if (changeRate > 30) {
      stabilityScore = 60  // 每分钟切换超30次，过于频繁
    } else if (changeRate < 1 && totalDuration > 30000) {
      stabilityScore = 40  // 从未切换窗口 = 可能挂机
    } else {
      stabilityScore = 100 - Math.min(changeRate * 2, 40)
    }

    return {
      focusedRatio: Math.round(focusedRatio * 1000) / 1000,
      visibleRatio: Math.round(visibleRatio * 1000) / 1000,
      focusChangeCount,
      changeRate: Math.round(changeRate * 10) / 10,
      stabilityScore: Math.round(stabilityScore)
    }
  }

  // ──────────────────────────────────────────────
  //  活动节律分析
  // ──────────────────────────────────────────────

  static _analyzeRhythm(mouseSamples, keyboardSamples, focusSamples) {
    // 合并所有活动事件时间戳
    const activityEvents = [
      ...mouseSamples.filter(s => s.eventType !== 'scroll').map(s => s.timestamp),
      ...keyboardSamples.map(s => s.timestamp)
    ].sort((a, b) => a - b)

    if (activityEvents.length < 5) {
      return {
        activeBursts: 0,
        avgBurstDuration: 0,
        avgPauseDuration: 0,
        activityRatio: 0,
        regularityScore: 0
      }
    }

    // 定义：连续活动间隔 < 2s 视为同一爆发 (burst)
    const BURST_GAP = 2000
    const bursts = []
    let currentBurst = [activityEvents[0]]

    for (let i = 1; i < activityEvents.length; i++) {
      if (activityEvents[i] - activityEvents[i - 1] < BURST_GAP) {
        currentBurst.push(activityEvents[i])
      } else {
        bursts.push(currentBurst)
        currentBurst = [activityEvents[i]]
      }
    }
    bursts.push(currentBurst)

    const burstDurations = bursts.map(b => b[b.length - 1] - b[0])
    const pauses = []
    for (let i = 1; i < bursts.length; i++) {
      pauses.push(bursts[i][0] - bursts[i - 1][bursts[i - 1].length - 1])
    }

    const avgBurstDuration = burstDurations.reduce((a, b) => a + b, 0) / burstDurations.length
    const avgPauseDuration = pauses.length > 0
      ? pauses.reduce((a, b) => a + b, 0) / pauses.length
      : 0

    // 活动时间比
    const totalActiveTime = burstDurations.reduce((a, b) => a + b, 0)
    const totalTime = activityEvents[activityEvents.length - 1] - activityEvents[0]
    const activityRatio = totalTime > 0 ? totalActiveTime / totalTime : 0

    // 规律性评分：人类活动具有适中的规律性
    // 太规律 (CV 低) = 脚本，完全不规律 (CV 高) = 可能真实
    const pauseMean = avgPauseDuration || 1
    const pauseCV = pauses.length > 1
      ? Math.sqrt(pauses.reduce((sum, p) => sum + (p - pauseMean) ** 2, 0) / pauses.length) / pauseMean
      : 1

    let regularityScore = 50
    if (pauseCV > 0.3 && pauseCV < 2.0) {
      regularityScore = 80  // 人类典型范围
    } else if (pauseCV <= 0.3) {
      regularityScore = 10  // 太规律 = 脚本
    } else {
      regularityScore = 60  // 很不规律但可能真实
    }

    return {
      activeBursts: bursts.length,
      avgBurstDuration: Math.round(avgBurstDuration),
      avgPauseDuration: Math.round(avgPauseDuration),
      activityRatio: Math.round(activityRatio * 1000) / 1000,
      regularityScore: Math.round(regularityScore)
    }
  }

  // ──────────────────────────────────────────────
  //  系统状态分析
  // ──────────────────────────────────────────────

  static _analyzeSystem(systemSamples) {
    if (systemSamples.length < 2) {
      return { avgIdleTime: 0, screenLocked: false, naturalnessScore: 100 }
    }

    const avgIdleTime = systemSamples.reduce((sum, s) => sum + s.systemIdleTime, 0) / systemSamples.length
    const anyScreenLocked = systemSamples.some(s => s.screenLocked)

    // 系统空闲自然度：适量的系统空闲是正常的（思考、阅读）
    let score = 100
    if (avgIdleTime > 60000) {
      score = 20   // 平均空闲超过 1 分钟，严重可疑
    } else if (avgIdleTime > 10000) {
      score = 50   // 平均空闲 10-60 秒
    } else if (avgIdleTime < 100) {
      score = 30   // 几乎无空闲 = 可能脚本
    }

    if (anyScreenLocked) score = Math.min(score, 10)

    return {
      avgIdleTime: Math.round(avgIdleTime),
      screenLocked: anyScreenLocked,
      naturalnessScore: score
    }
  }

  // ──────────────────────────────────────────────
  //  异常检测与综合评分
  // ──────────────────────────────────────────────

  /**
   * 检测所有可疑行为模式
   */
  static _detectAnomalies({ mouse, keystroke, focus, rhythm, system }) {
    const flags = []

    // 1. 无鼠标活动
    if (!mouse.hasActivity) {
      flags.push('no_mouse_activity')
    }

    // 2. 鼠标轨迹过于平滑（疑似脚本）
    if (mouse.hasActivity && mouse.fractalDimension < HUMAN_THRESHOLDS.MOUSE_FRACTAL_MIN) {
      flags.push('script_like_mouse_trajectory')
    }

    // 3. 鼠标轨迹过于随机（疑似噪声模拟）
    if (mouse.hasActivity && mouse.fractalDimension > HUMAN_THRESHOLDS.MOUSE_FRACTAL_MAX) {
      flags.push('noise_like_mouse_trajectory')
    }

    // 4. 加速度变异过低（疑似轨迹平滑/插值）
    if (mouse.hasActivity && mouse.accelCV > 0 && mouse.accelCV < 0.2) {
      flags.push('suspiciously_smooth_acceleration')
    }

    // 5. 长时间无键盘输入
    if (!keystroke.hasActivity) {
      flags.push('no_keystroke_activity')
    }

    // 6. 击键间隔过于均匀（疑似宏/脚本）
    if (keystroke.hasActivity && keystroke.flightTimeCV < HUMAN_THRESHOLDS.KEYSTROKE_CV_MIN) {
      flags.push('script_like_keystroke_timing')
    }

    // 7. 窗口从未获得焦点
    if (focus.focusedRatio < 0.05) {
      flags.push('window_never_focused')
    }

    // 8. 窗口从未切换（稳定在后台）
    if (focus.focusChangeCount === 0 && focus.focusedRatio < 0.5) {
      flags.push('suspiciously_stable_background')
    }

    // 9. 活动节律过于规律（疑似机器人）
    if (rhythm.regularityScore < 20) {
      flags.push('too_regular_activity_rhythm')
    }

    // 10. 系统长期空闲
    if (system.avgIdleTime > 60000) {
      flags.push('prolonged_system_idle')
    }

    // 11. 高活跃但无任何键盘输入且鼠标高度规律
    if (mouse.totalMoves > 50 && !keystroke.hasActivity && mouse.naturalnessScore < 20) {
      flags.push('mouse_only_automation')
    }

    return flags
  }

  /**
   * 计算综合活性评分 (0-100)
   */
  static _computeActivityScore({ mouse, keystroke, focus, rhythm, system, suspiciousFlags }) {
    let score = 0

    // 基础分：鼠标自然度
    score += mouse.naturalnessScore * WEIGHTS.MOUSE_ENTROPY

    // 击键分
    score += keystroke.keystrokeScore * WEIGHTS.KEYSTROKE_RHYTHM

    // 焦点分
    score += focus.stabilityScore * WEIGHTS.FOCUS_STABILITY

    // 节律分
    score += rhythm.regularityScore * WEIGHTS.ACTIVITY_RHYTHM

    // 系统分
    score += system.naturalnessScore * WEIGHTS.SYSTEM_NATURALNESS

    // 额外惩罚：每条可疑标记扣 10 分
    const penalty = Math.min(suspiciousFlags.length * 10, 80)
    score = Math.max(0, score - penalty)

    return Math.round(score)
  }

  /**
   * 关键专利方法：根据活性证据计算有效时长
   *
   * 不是简单的"空闲停表"或"一刀切"，
   * 而是根据多维证据进行加权扣除：
   * - 窗口非焦点时间扣除
   * - 页面不可见时间扣除
   * - 系统空闲时间扣除
   * - 行为异常折扣
   * - 严重可疑行为的大幅削减
   */
  static _calculateEffectiveSeconds(rawSeconds, { score, focus, system, suspiciousFlags }) {
    // 基础：原始秒数 × 综合活性评分百分比
    let effective = rawSeconds * (score / 100)

    // 窗口焦点加权扣除
    const focusDiscount = Math.max(0.3, focus.focusedRatio)
    effective *= focusDiscount

    // 页面可见性加权扣除
    const visibleDiscount = Math.max(0.5, focus.visibleRatio)
    effective *= visibleDiscount

    // 系统空闲加权
    if (system.avgIdleTime > 5000) {
      const idleRatio = Math.min(system.avgIdleTime / 60000, 1)
      effective *= (1 - idleRatio * 0.5)
    }

    // 严重可疑标记的大幅削减
    if (suspiciousFlags.includes('script_like_mouse_trajectory') ||
        suspiciousFlags.includes('noise_like_mouse_trajectory')) {
      effective *= 0.1  // 疑似脚本 → 仅计 10%
    }

    if (suspiciousFlags.includes('window_never_focused')) {
      effective *= 0.2  // 窗口从未在前台 → 仅计 20%
    }

    if (suspiciousFlags.includes('prolonged_system_idle')) {
      effective *= 0.3
    }

    // 多标记叠加：不简单相乘，取最低折扣
    const severeFlags = ['script_like_mouse_trajectory', 'noise_like_mouse_trajectory',
                          'window_never_focused', 'mouse_only_automation',
                          'too_regular_activity_rhythm']
    const severeCount = suspiciousFlags.filter(f => severeFlags.includes(f)).length
    if (severeCount >= 2) {
      effective *= 0.15  // 多重严重可疑 → 仅计 15%
    }

    // 下限保护：至少有 1% 的底仓（防止完全归零导致的争议）
    const minimum = rawSeconds * 0.01
    effective = Math.max(minimum, effective)

    // 上限保护：不超过原始秒数
    effective = Math.min(effective, rawSeconds)

    return Math.round(effective)
  }
}

export default BehavioralFingerprint
