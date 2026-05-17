/**
 * 增强版时长记录 API
 * =============================================
 *
 * 在原有基础上集成活性证明验证引擎。
 * 所有新字段以 _ 开头，向后兼容原始客户端。
 *
 * 接收增强数据格式：
 * {
 *   id, date, hourtime,          ← 原始字段
 *   _claimSeconds,                ← 客户端计算的活性验证后有效秒数
 *   _activityScore,               ← 活性评分
 *   _suspiciousFlags,             ← 可疑标记
 *   _sessionId, _sequenceNumber,  ← 会话连续性
 *   _clockHealthy,                 ← 时钟健康状态
 *   _mouseEntropy, _mouseFractal, _mouseNaturalness,
 *   _keystrokeCV, _focusedRatio, _visibleRatio,
 *   _regularity
 * }
 */

const db = require('../db/index.js')
const { ok, fail } = require('../middleware')
const { timeValidator, behaviorAnalyzer, challengeManager } = require('../services')

// ── 全局上下文（由 app.js 在启动时设置）──
let _previousReports = new Map() // userId -> lastReport

/**
 * 初始化验证上下文
 */
function init() {
  _previousReports = new Map()
}

// 原有的方法保持不变 ──────────────────────────

exports.get = (req, res) => {
  const { id, date } = req.query
  if (!id || !date) return fail(res, 400, '缺少 id 或 date 参数')
  const sql = 'SELECT daytime, hourtime, effective_seconds, activity_score, suspicious_flags FROM time WHERE id = ? AND date = ? ORDER BY daytime'
  db.query(sql, [id, date], (err, data) => {
    if (err) {
      console.error('数据库错误:', err)
      return fail(res, 500, '服务器内部错误')
    }
    ok(res, data)
  })
}

exports.getall = (req, res) => {
  const page = parseInt(req.query.page) || 1
  const pageSize = parseInt(req.query.pageSize) || 100
  const offset = (page - 1) * pageSize
  const { dateFrom, dateTo, id } = req.query

  let sql = 'SELECT * FROM time'
  const params = []
  const conditions = []

  if (id) { conditions.push('id = ?'); params.push(id) }
  if (dateFrom) { conditions.push('date >= ?'); params.push(dateFrom) }
  if (dateTo) { conditions.push('date <= ?'); params.push(dateTo) }
  if (conditions.length > 0) sql += ' WHERE ' + conditions.join(' AND ')

  sql += ' ORDER BY date DESC, daytime DESC LIMIT ? OFFSET ?'
  params.push(pageSize, offset)

  db.query(sql, params, (err, data) => {
    if (err) {
      console.error('数据库错误:', err)
      return fail(res, 500, '服务器内部错误')
    }
    ok(res, data)
  })
}

exports.del = (req, res) => {
  const { id, date } = req.body
  if (!id || !date) return fail(res, 400, '缺少 id 或 date 参数')
  db.query('DELETE FROM time WHERE id = ? AND date = ?', [id, date], (err, data) => {
    if (err) {
      console.error('数据库错误:', err)
      return fail(res, 500, '服务器内部错误')
    }
    if (data.affectedRows > 0) return ok(res, { id, date }, '删除成功')
    fail(res, 404, '记录不存在')
  })
}

// ── 增强版记录方法（核心） ──────────────────────

exports.recordTime = (req, res) => {
  const { id, date, hourtime } = req.body
  if (!id || !date || hourtime === undefined) return fail(res, 400, '缺少参数')

  const hourtimeNum = Number(hourtime)
  if (isNaN(hourtimeNum) || hourtimeNum <= 0) return fail(res, 400, '时长参数无效')

  const daytime = new Date().getHours()

  // ── 判断是否为增强客户端（包含 _ 开头的新字段） ──
  const hasActivityProof = req.body._claimSeconds !== undefined
  const isClockHealthy = req.body._clockHealthy !== false

  // ── 执行多层验证 ──
  let effectiveSeconds = hourtimeNum
  let validationReasons = []
  let activityScore = req.body._activityScore !== undefined ? req.body._activityScore : null

  if (hasActivityProof) {
    // 获取该用户的上次上报记录
    const previousReport = _previousReports.get(id)

    // 获取用户行为基线
    const userBaseline = behaviorAnalyzer.getUserBaseline(id)

    // 执行验证
    const validationResult = timeValidator.validate(req.body, {
      previousReport,
      userBaseline
    })

    effectiveSeconds = validationResult.adjustedSeconds
    validationReasons = validationResult.reasons

    // 更新上下文
    _previousReports.set(id, {
      _sequenceNumber: req.body._sequenceNumber,
      _sessionId: req.body._sessionId,
      _claimSeconds: req.body._claimSeconds,
      wallClockEnd: Date.now()
    })

    // 记录行为数据到基线分析器
    behaviorAnalyzer.recordBehavior(req.body)

    // 检查是否需要下发挑战
    const suspicionLevel = validationReasons.length > 0
      ? Math.min(validationReasons.length * 0.2, 1.0)
      : 0

    if (challengeManager.shouldChallenge(suspicionLevel) && req.body._sessionId) {
      const challenge = challengeManager.generateChallenge(req.body._sessionId, 'SIMPLE', 1)
      if (challenge) {
        // 通过响应头返回挑战信息（下次请求需附带）
        res.set('X-Challenge-Id', challenge.id)
        res.set('X-Challenge-Type', challenge.type)
      }
    }
  }

  // 如果验证后有可疑标记，记录到日志
  if (validationReasons.length > 0) {
    console.log(`[验证] 用户 ${id} 上报 ${hourtimeNum}s，有效 ${effectiveSeconds}s，原因: ${validationReasons.join(', ')}`)
  }

  // ── 写入数据库 ──
  // 使用 ON DUPLICATE KEY UPDATE 累加 "原始时长"，
  // 同时用单独的字段记录"有效时长"和行为数据

  // 检查 effective_seconds 列是否存在（向下兼容）
  const sql = hasActivityProof
    ? `INSERT INTO time (id, date, daytime, hourtime, effective_seconds, activity_score, suspicious_flags)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         hourtime = hourtime + ?,
         effective_seconds = effective_seconds + ?,
         activity_score = COALESCE(?, activity_score),
         suspicious_flags = COALESCE(?, suspicious_flags)`
    : `INSERT INTO time (id, date, daytime, hourtime)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE hourtime = hourtime + ?`

  const params = hasActivityProof
    ? [id, date, daytime, hourtimeNum, effectiveSeconds, activityScore,
       JSON.stringify(validationReasons), hourtimeNum, effectiveSeconds,
       activityScore, JSON.stringify(validationReasons)]
    : [id, date, daytime, hourtimeNum, hourtimeNum]

  db.query(sql, params, (err) => {
    if (err) {
      // 如果 effective_seconds 列不存在（旧数据库），降级使用基本 SQL
      if (err.code === 'ER_BAD_FIELD_ERROR') {
        return _fallbackRecord(req, res, id, date, daytime, hourtimeNum, effectiveSeconds)
      }
      console.error('数据库错误:', err)
      return fail(res, 500, '服务器内部错误')
    }

    // 更新 last_active
    db.query('UPDATE info SET last_active = UNIX_TIMESTAMP()*1000 WHERE id = ?', [id], (updateErr) => {
      if (updateErr) console.error('更新 last_active 失败:', updateErr)
    })

    // 返回增强响应
    const response = {
      id, date, daytime,
      hourtime: hourtimeNum,
      effectiveSeconds,
      activityScore,
      validated: hasActivityProof,
      discountRatio: hourtimeNum > 0 ? (effectiveSeconds / hourtimeNum).toFixed(2) : 1.0,
      flags: validationReasons.length > 0 ? validationReasons : undefined
    }
    ok(res, response, '记录成功')
  })
}

/**
 * 降级方案：旧数据库无 effective_seconds 列
 */
function _fallbackRecord(req, res, id, date, daytime, hourtimeNum, effectiveSeconds) {
  const sql = 'INSERT INTO time (id, date, daytime, hourtime) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE hourtime = hourtime + ?'
  db.query(sql, [id, date, daytime, hourtimeNum, hourtimeNum], (err) => {
    if (err) {
      console.error('数据库错误:', err)
      return fail(res, 500, '服务器内部错误')
    }
    db.query('UPDATE info SET last_active = UNIX_TIMESTAMP()*1000 WHERE id = ?', [id], (e) => {
      if (e) console.error('更新 last_active 失败:', e)
    })
    ok(res, {
      id, date, daytime, hourtime: hourtimeNum,
      note: '旧数据库模式，已验证时长未持久化'
    }, '记录成功（降级模式）')
  })
}

// ── 新 API: 获取用户活性摘要 ──

exports.getActivitySummary = (req, res) => {
  const { id, date } = req.query
  if (!id) return fail(res, 400, '缺少 id 参数')

  const dateFilter = date || new Date().toISOString().slice(0, 10)

  const sql = `SELECT
    SUM(hourtime) as total_raw_seconds,
    COALESCE(SUM(effective_seconds), SUM(hourtime)) as total_effective_seconds,
    AVG(activity_score) as avg_activity_score,
    COUNT(DISTINCT daytime) as active_hours
    FROM time WHERE id = ? AND date = ?`

  db.query(sql, [id, dateFilter], (err, data) => {
    if (err) return fail(res, 500, '服务器内部错误')
    const row = data[0] || {}
    ok(res, {
      totalRawSeconds: row.total_raw_seconds || 0,
      totalEffectiveSeconds: row.total_effective_seconds || 0,
      avgActivityScore: row.avg_activity_score ? Math.round(row.avg_activity_score) : null,
      activeHours: row.active_hours || 0,
      discountRate: row.total_raw_seconds > 0
        ? ((row.total_effective_seconds || 0) / row.total_raw_seconds).toFixed(2)
        : 1.0
    })
  })
}

// ── 新 API: 批量获取用户活性状态 ──

exports.getBatchActivityStatus = (req, res) => {
  const { ids } = req.body
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return fail(res, 400, '缺少 ids 参数')
  }

  const placeholders = ids.map(() => '?').join(',')
  const today = new Date().toISOString().slice(0, 10)

  const sql = `SELECT
    id,
    SUM(hourtime) as total_raw,
    COALESCE(SUM(effective_seconds), SUM(hourtime)) as total_effective,
    AVG(activity_score) as avg_score
    FROM time WHERE id IN (${placeholders}) AND date = ?
    GROUP BY id`

  db.query(sql, [...ids, today], (err, data) => {
    if (err) return fail(res, 500, '服务器内部错误')
    const result = {}
    for (const row of data) {
      result[row.id] = {
        totalRaw: row.total_raw || 0,
        totalEffective: row.total_effective || 0,
        avgScore: row.avg_score ? Math.round(row.avg_score) : null
      }
    }
    ok(res, result)
  })
}

// 重置上下文（管理用）
exports.resetValidationContext = (req, res) => {
  _previousReports.clear()
  ok(res, null, '验证上下文已重置')
}

module.exports.init = init
