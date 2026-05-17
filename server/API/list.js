const db = require('../db/index.js')
const { ok, fail } = require('../middleware')

const ONLINE_THRESHOLD = 5 * 60 * 1000 // 5分钟内有活动视为在线

// 获取所有用户（不含密码，含在线状态和座次）
exports.all = (req, res) => {
    const sql = `
        SELECT id, name, studentid, major, tel, qq, role,
               \`seat-room\` AS seatRoom, \`seat-number\` AS seatNumber, last_active, visible,
               (UNIX_TIMESTAMP()*1000 - last_active) < ? AS online
        FROM info
    `
    db.query(sql, [ONLINE_THRESHOLD], (err, data) => {
        if (err) {
            console.error('数据库错误:', err)
            return fail(res, 500, '服务器内部错误')
        }
        // Convert online from 0/1 to boolean
        const result = data.map(row => ({ ...row, online: !!row.online }))
        ok(res, result)
    })
}

// 通过 id 查询单个用户（不含密码）
exports.get = (req, res) => {
    const { id } = req.query
    if (!id) return fail(res, 400, '缺少 id 参数')
    const sql = `
        SELECT id, name, studentid, major, tel, qq, role,
               \`seat-room\` AS seatRoom, \`seat-number\` AS seatNumber, last_active, visible,
               (UNIX_TIMESTAMP()*1000 - last_active) < ? AS online
        FROM info WHERE id = ?
    `
    db.query(sql, [ONLINE_THRESHOLD, id], (err, data) => {
        if (err) {
            console.error('数据库错误:', err)
            return fail(res, 500, '服务器内部错误')
        }
        if (data.length > 0) {
            const row = data[0]
            ok(res, { ...row, online: !!row.online })
        } else {
            ok(res, data)
        }
    })
}

// 删除用户
exports.del = (req, res) => {
    const { id } = req.body
    if (!id) return fail(res, 400, '缺少 id 参数')
    db.query('DELETE FROM info WHERE id = ?', [id], (err, data) => {
        if (err) {
            console.error('数据库错误:', err)
            return fail(res, 500, '服务器内部错误')
        }
        if (data.affectedRows > 0) {
            return ok(res, { id }, '删除成功')
        }
        fail(res, 404, '用户不存在')
    })
}
