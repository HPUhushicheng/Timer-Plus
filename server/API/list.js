const db = require('../db/index.js')
const { ok, fail } = require('../middleware')

// 获取所有用户（不含密码）
exports.all = (req, res) => {
    db.query('SELECT id, name, studentid, major, tel, qq FROM info', (err, data) => {
        if (err) {
            console.error('数据库错误:', err)
            return fail(res, 500, '服务器内部错误')
        }
        ok(res, data)
    })
}

// 通过 id 查询单个用户（不含密码）
exports.get = (req, res) => {
    const { id } = req.query
    if (!id) return fail(res, 400, '缺少 id 参数')
    db.query('SELECT id, name, studentid, major, tel, qq FROM info WHERE id = ?', [id], (err, data) => {
        if (err) {
            console.error('数据库错误:', err)
            return fail(res, 500, '服务器内部错误')
        }
        ok(res, data)
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
