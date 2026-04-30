const db = require('../db/index.js')
const bcrypt = require('bcryptjs')
const { ok, fail } = require('../middleware')

const SALT_ROUNDS = 10

// 更新用户信息（name, major, tel, qq, role）
// 普通用户只能更新自己，管理员可以更新任何人
exports.update = (req, res) => {
    const { id, name, major, tel, qq, role } = req.body
    if (!id) return fail(res, 400, '缺少 id 参数')

    // 权限检查：普通用户只能更新自己
    const currentStudentId = req.user?.id
    if (req.user?.role !== 'admin') {
        // 查询目标用户的 studentid，确认是本人操作
        db.query('SELECT studentid FROM info WHERE id = ?', [id], (err, data) => {
            if (err) {
                console.error('数据库错误:', err)
                return fail(res, 500, '服务器内部错误')
            }
            if (data.length === 0) return fail(res, 404, '用户不存在')
            if (data[0].studentid !== currentStudentId) {
                return fail(res, 403, '无权修改其他用户信息')
            }
            doUpdate(false) // 非管理员不能改 role
        })
    } else {
        // 管理员还可以修改 role（但不能修改自己的 role）
        db.query('SELECT studentid FROM info WHERE id = ?', [id], (err, data) => {
            if (err) {
                console.error('数据库错误:', err)
                return fail(res, 500, '服务器内部错误')
            }
            if (data.length === 0) return fail(res, 404, '用户不存在')
            const isSelf = data[0].studentid === currentStudentId
            doUpdate(!isSelf) // 修改自己的时候也不能改 role，防止锁死
        })
    }

    function doUpdate(canSetRole) {
        const fields = []
        const params = []
        if (name !== undefined) { fields.push('name = ?'); params.push(name) }
        if (major !== undefined) { fields.push('major = ?'); params.push(major) }
        if (tel !== undefined) { fields.push('tel = ?'); params.push(tel) }
        if (qq !== undefined) { fields.push('qq = ?'); params.push(qq) }
        if (canSetRole && role !== undefined && (role === 'admin' || role === 'user')) {
            fields.push('role = ?'); params.push(role)
        }
        if (fields.length === 0) return fail(res, 400, '没有需要更新的字段')

        params.push(id)
        const sql = `UPDATE info SET ${fields.join(', ')} WHERE id = ?`
        db.query(sql, params, (dbErr, result) => {
            if (dbErr) {
                console.error('数据库错误:', dbErr)
                return fail(res, 500, '服务器内部错误')
            }
            if (result.affectedRows > 0) {
                return ok(res, { id, name, major, tel, qq, role }, '更新成功')
            }
            fail(res, 404, '用户不存在')
        })
    }
}

// 修改密码（不需要旧密码）
exports.changePassword = (req, res) => {
    const { newPassword, confirmPassword } = req.body
    if (!newPassword || !confirmPassword) {
        return fail(res, 400, '请输入新密码和确认密码')
    }
    if (newPassword.length < 6) {
        return fail(res, 400, '密码长度不能少于6位')
    }
    if (newPassword !== confirmPassword) {
        return fail(res, 400, '两次输入的密码不一致')
    }

    const studentid = req.user?.id
    if (!studentid) return fail(res, 401, '未认证')

    bcrypt.hash(newPassword, SALT_ROUNDS, (err, hash) => {
        if (err) {
            console.error('密码哈希失败:', err)
            return fail(res, 500, '密码加密失败')
        }
        db.query('UPDATE info SET password = ? WHERE studentid = ?', [hash, studentid], (dbErr, result) => {
            if (dbErr) {
                console.error('数据库错误:', dbErr)
                return fail(res, 500, '服务器内部错误')
            }
            if (result.affectedRows > 0) {
                return ok(res, null, '密码修改成功')
            }
            fail(res, 404, '用户不存在')
        })
    })
}

// 分配座次（管理员专属）
exports.assignSeat = (req, res) => {
    const { id, seatRoom, seatNumber } = req.body
    if (!id) return fail(res, 400, '缺少用户 id')

    const room = seatRoom ?? ''
    const number = seatNumber ?? ''

    db.query('UPDATE info SET `seat-room` = ?, `seat-number` = ? WHERE id = ?', [room, number, id], (err, result) => {
        if (err) {
            console.error('数据库错误:', err)
            return fail(res, 500, '服务器内部错误')
        }
        if (result.affectedRows > 0) {
            return ok(res, { id, seatRoom: room, seatNumber: number }, room ? '座次分配成功' : '座次已清除')
        }
        fail(res, 404, '用户不存在')
    })
}

// 管理员数据概览
exports.stats = (req, res) => {
    const now = Date.now()
    const onlineThreshold = now - 5 * 60 * 1000 // 5分钟内活跃视为在线

    const sql = `
        SELECT
            (SELECT COUNT(*) FROM info) AS totalUsers,
            (SELECT COUNT(*) FROM info WHERE last_active >= ?) AS onlineCount,
            (SELECT COALESCE(SUM(hourtime), 0) FROM time WHERE date = CURDATE()) AS todayTotalSeconds
    `
    db.query(sql, [onlineThreshold], (err, data) => {
        if (err) {
            console.error('数据库错误:', err)
            return fail(res, 500, '服务器内部错误')
        }
        const row = data[0]
        ok(res, {
            totalUsers: row.totalUsers,
            onlineCount: row.onlineCount,
            todayTotalMinutes: Math.round((row.todayTotalSeconds || 0) / 60),
        })
    })
}
