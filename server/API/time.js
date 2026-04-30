const db = require('../db/index.js')
const jwt = require('jsonwebtoken')
const { ok, fail, JWT_SECRET } = require('../middleware')

/**
 * 直接从请求头中的 JWT token 提取用户 id
 * 不依赖 req.user（避免中间件兼容性问题）
 */
function getUserId(req) {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null
    try {
        const token = authHeader.split(' ')[1]
        const decoded = jwt.verify(token, JWT_SECRET)
        return decoded.id || null
    } catch {
        return null
    }
}

// 通过 id 和 date 查询当天时长数据
exports.get = (req, res) => {
    const { date } = req.query
    const id = getUserId(req)
    if (!id || !date) return fail(res, 400, '缺少 id 或 date 参数')
    const sql = 'SELECT daytime, hourtime FROM time WHERE id = ? AND date = ? ORDER BY daytime'
    db.query(sql, [id, date], (err, data) => {
        if (err) {
            console.error('数据库错误:', err)
            return fail(res, 500, '服务器内部错误')
        }
        ok(res, data)
    })
}

// 获取所有时间记录（分页）
exports.getall = (req, res) => {
    const page = parseInt(req.query.page) || 1
    const pageSize = parseInt(req.query.pageSize) || 100
    const offset = (page - 1) * pageSize
    const sql = 'SELECT * FROM time LIMIT ? OFFSET ?'
    db.query(sql, [pageSize, offset], (err, data) => {
        if (err) {
            console.error('数据库错误:', err)
            return fail(res, 500, '服务器内部错误')
        }
        ok(res, data)
    })
}

// 删除时间记录
exports.del = (req, res) => {
    const { date } = req.body
    const id = getUserId(req)
    if (!id || !date) return fail(res, 400, '缺少 id 或 date 参数')
    db.query('DELETE FROM time WHERE id = ? AND date = ?', [id, date], (err, data) => {
        if (err) {
            console.error('数据库错误:', err)
            return fail(res, 500, '服务器内部错误')
        }
        if (data.affectedRows > 0) {
            return ok(res, { id, date }, '删除成功')
        }
        fail(res, 404, '记录不存在')
    })
}

// 记录在线时长（每分钟增量上报）
exports.recordTime = (req, res) => {
    const { date, hourtime } = req.body
    const id = getUserId(req)
    if (!id || !date || hourtime === undefined) return fail(res, 400, '缺少参数')
    const hourtimeNum = Number(hourtime)
    if (isNaN(hourtimeNum) || hourtimeNum <= 0) return fail(res, 400, '时长参数无效')

    const daytime = new Date().getHours()
    const sql = 'INSERT INTO time (id, date, daytime, hourtime) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE hourtime = hourtime + ?'
    db.query(sql, [id, date, daytime, hourtimeNum, hourtimeNum], (err) => {
        if (err) {
            console.error('数据库错误:', err)
            return fail(res, 500, '服务器内部错误')
        }
        ok(res, { id, date, daytime, hourtime: hourtimeNum }, '记录成功')
    })
}
