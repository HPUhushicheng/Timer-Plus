/**
 * BehaviorAnalyzer - 跨用户行为基线分析服务
 * =============================================
 *
 * 专利点 #5: 群体行为基线交叉验证
 *
 * 核心创新：利用群体行为统计来发现个体异常。
 * 原理：在一个真实的集体学习环境中（如实验室/社团），
 * 所有成员的行为模式在统计上具有一定的一致性。
 * 如果某个用户的行为显著偏离群体基线（3σ 原则），
 * 则其时长数据不可信。
 *
 * 分析方法：
 * 1. 按小时计算群体行为基线 (均值、标准差)
 * 2. 对每个用户计算其与基线的偏离度 (Z-Score)
 * 3. 对偏离度 > 3σ 的用户标记并打折
 * 4. 维护长期行为档案（30 天滚动窗口）
 */

const db = require('../db/index')

// 基线计算间隔 (毫秒)
const BASELINE_UPDATE_INTERVAL = 3600000  // 1 小时

class BehaviorAnalyzer {
  constructor() {
    this._baselines = {
      hourly: {},         // { '2024-01-15_14': { avgScore, avgFractalDim, ... } }
      dailyUser: {}       // { 'userId_2024-01-15': { avgScore, ... } }
    }
    this._lastBaselineUpdate = 0
    this._updateTimer = null
    this._running = false
  }

  /**
   * 启动基线分析服务
   */
  start() {
    if (this._running) return
    this._running = true
    this._updateBaselines()
    // 每小时更新一次基线
    this._updateTimer = setInterval(() => {
      this._updateBaselines()
    }, BASELINE_UPDATE_INTERVAL)
    console.log('[BehaviorAnalyzer] 行为基线分析服务已启动')
  }

  /**
   * 停止服务
   */
  stop() {
    this._running = false
    if (this._updateTimer) {
      clearInterval(this._updateTimer)
      this._updateTimer = null
    }
  }

  /**
   * 获取当前基线（用于 TimeValidator）
   * @param {number} userId
   * @returns {Object} { avgScore, scoreStdDev, avgFractalDim, fractalDimStdDev }
   */
  getUserBaseline(userId) {
    const now = new Date()
    const hourKey = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}_${now.getHours()}`

    const hourly = this._baselines.hourly[hourKey]

    // 如果当前小时没有基线，用最近的有效基线
    if (!hourly) {
      return this._getFallbackBaseline()
    }

    return {
      avgScore: hourly.avgScore,
      scoreStdDev: hourly.scoreStdDev,
      avgFractalDim: hourly.avgFractalDim,
      fractalDimStdDev: hourly.fractalDimStdDev,
      sampleCount: hourly.sampleCount,
      baselineHour: hourKey
    }
  }

  /**
   * 记录一条行为数据（实时更新基线缓冲）
   * @param {Object} record - 包含用户行为指纹的数据
   */
  async recordBehavior(record) {
    try {
      const now = new Date()
      const hourKey = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}_${now.getHours()}`

      // 更新内存中的基线缓冲
      if (!this._baselines.hourly[hourKey]) {
        this._baselines.hourly[hourKey] = {
          scores: [],
          fractalDims: [],
          mouseNaturalness: [],
          focusRatios: [],
          sampleCount: 0
        }
      }

      const buf = this._baselines.hourly[hourKey]
      if (record._activityScore !== undefined) {
        buf.scores.push(record._activityScore)
      }
      if (record._mouseFractal !== undefined) {
        buf.fractalDims.push(record._mouseFractal)
      }
      if (record._mouseNaturalness !== undefined) {
        buf.mouseNaturalness.push(record._mouseNaturalness)
      }
      if (record._focusedRatio !== undefined) {
        buf.focusRatios.push(record._focusedRatio)
      }
      buf.sampleCount++

      // 异步写入数据库 (不阻塞)
      this._persistBehaviorRecord(record).catch(err => {
        console.error('[BehaviorAnalyzer] 持久化行为记录失败:', err.message)
      })

    } catch (err) {
      console.error('[BehaviorAnalyzer] 记录行为数据失败:', err.message)
    }
  }

  /**
   * 计算某个用户的 Z-Score（偏离度）
   * Z > 3 表示显著异常
   */
  calculateUserZScore(userId, baseline) {
    if (!baseline) return 0

    // 从数据库加载用户历史数据
    return this._loadUserRecentBehavior(userId).then(userData => {
      if (!userData) return 0

      const { avgScore } = baseline
      const userAvgScore = userData.length > 0
        ? userData.reduce((s, r) => s + (r.activity_score || 0), 0) / userData.length
        : avgScore

      const stdDev = baseline.scoreStdDev || 15
      return stdDev > 0 ? Math.abs(userAvgScore - avgScore) / stdDev : 0
    })
  }

  // ── 私有方法 ──

  _updateBaselines() {
    const now = new Date()
    const hourKey = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}_${now.getHours()}`

    const buf = this._baselines.hourly[hourKey]
    if (!buf || buf.sampleCount < 5) {
      // 样本不足，用上一小时的基线
      return
    }

    // 计算基线统计
    this._baselines.hourly[hourKey] = {
      avgScore: this._average(buf.scores),
      scoreStdDev: this._stdDev(buf.scores),
      avgFractalDim: this._average(buf.fractalDims),
      fractalDimStdDev: this._stdDev(buf.fractalDims),
      avgMouseNaturalness: this._average(buf.mouseNaturalness),
      avgFocusRatio: this._average(buf.focusRatios),
      sampleCount: buf.sampleCount
    }
  }

  _persistBehaviorRecord(record) {
    // 异步写入 behavior_records 表
    return new Promise((resolve, reject) => {
      const sql = `INSERT INTO behavior_records
        (user_id, date, daytime, session_id, sequence_number, raw_seconds, claim_seconds,
         activity_score, mouse_fractal_dim, mouse_entropy, mouse_naturalness,
         keystroke_cv, focused_ratio, visible_ratio, regularity_score,
         suspicious_flags, clock_healthy, created_at)
        VALUES (?, CURDATE(), ?, ?, ?, ?, ?,
         ?, ?, ?, ?,
         ?, ?, ?, ?,
         ?, ?, NOW())`

      db.query(sql, [
        record.id,
        new Date().getHours(),
        record._sessionId || null,
        record._sequenceNumber || 0,
        record.hourtime || 0,
        record._claimSeconds || 0,
        record._activityScore || null,
        record._mouseFractal || null,
        record._mouseEntropy || null,
        record._mouseNaturalness || null,
        record._keystrokeCV || null,
        record._focusedRatio || null,
        record._visibleRatio || null,
        record._regularity || null,
        JSON.stringify(record._suspiciousFlags || []),
        record._clockHealthy !== false ? 1 : 0
      ], (err, result) => {
        if (err) reject(err)
        else resolve(result)
      })
    })
  }

  _loadUserRecentBehavior(userId) {
    return new Promise((resolve) => {
      const sql = `SELECT activity_score, mouse_fractal_dim, created_at
                   FROM behavior_records
                   WHERE user_id = ? AND created_at > DATE_SUB(NOW(), INTERVAL 7 DAY)
                   ORDER BY created_at DESC LIMIT 100`

      db.query(sql, [userId], (err, results) => {
        if (err) {
          console.error('[BehaviorAnalyzer] 加载用户历史行为失败:', err.message)
          resolve(null)
        } else {
          resolve(results || [])
        }
      })
    })
  }

  _getFallbackBaseline() {
    // 寻找最近的有效基线
    const hourKeys = Object.keys(this._baselines.hourly).sort().reverse()
    for (const key of hourKeys) {
      const bl = this._baselines.hourly[key]
      if (bl.avgScore !== undefined) {
        return {
          avgScore: bl.avgScore,
          scoreStdDev: bl.scoreStdDev || 15,
          avgFractalDim: bl.avgFractalDim || 1.5,
          fractalDimStdDev: bl.fractalDimStdDev || 0.15,
          sampleCount: bl.sampleCount || 0,
          baselineHour: key
        }
      }
    }

    // 完全没有基线数据，使用默认值
    return {
      avgScore: 70,
      scoreStdDev: 15,
      avgFractalDim: 1.5,
      fractalDimStdDev: 0.15,
      sampleCount: 0
    }
  }

  _average(arr) {
    if (!arr || arr.length === 0) return 0
    return arr.reduce((a, b) => a + b, 0) / arr.length
  }

  _stdDev(arr) {
    if (!arr || arr.length < 2) return 0
    const mean = this._average(arr)
    const squaredDiffs = arr.map(v => (v - mean) ** 2)
    return Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / (arr.length - 1))
  }
}

module.exports = { BehaviorAnalyzer }
