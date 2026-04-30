// 认证路由：注册 + 登录
const db = require('../db/index.js')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { ok, fail, JWT_SECRET } = require('../middleware')

const SALT_ROUNDS = 10
const TOKEN_EXPIRES = '7d'

// 注册
exports.register = (req, res) => {
  const { studentid, name, password, major, tel, qq } = req.body
  if (!studentid || !name || !password || !major || !tel) {
    return fail(res, 400, '缺少必需的参数（studentid/name/password/major/tel）')
  }
  if (password.length < 6) {
    return fail(res, 400, '密码长度不能少于6位')
  }

  bcrypt.hash(password, SALT_ROUNDS, (err, hash) => {
    if (err) {
      console.error('密码哈希失败:', err)
      return fail(res, 500, '密码加密失败: ' + err.message)
    }
    // id 是自增的，不需要传入
    const sql = 'INSERT INTO info (name, password, studentid, major, tel, qq, role) VALUES (?, ?, ?, ?, ?, ?, ?)'
    db.query(sql, [name, hash, studentid, major, tel, qq || '', 'user'], (dbErr, data) => {
      if (dbErr) {
        if (dbErr.code === 'ER_DUP_ENTRY') {
          return fail(res, 409, '该学号已注册')
        }
        console.error('数据库错误:', dbErr.code, dbErr.sqlMessage)
        return fail(res, 500, '数据库错误: ' + dbErr.code + ' - ' + dbErr.sqlMessage)
      }
      ok(res, { id: data.insertId, name, major, studentid, tel, qq }, '注册成功')
    })
  })
}

// 登录
exports.login = (req, res) => {
  const { studentid, password } = req.body
  if (!studentid || !password) {
    return fail(res, 400, '请输入学号和密码')
  }

  const sql = 'SELECT * FROM info WHERE studentid = ?'
  db.query(sql, [studentid], (err, data) => {
    if (err) {
      console.error('数据库错误:', err)
      return fail(res, 500, '服务器内部错误')
    }
    if (data.length === 0) {
      return fail(res, 401, '学号或密码错误')
    }

    const user = data[0]
    bcrypt.compare(password, user.password, (bcryptErr, match) => {
      if (bcryptErr || !match) {
        return fail(res, 401, '学号或密码错误')
      }
      const token = jwt.sign(
        { id: user.studentid, name: user.name, role: user.role || 'user' },
        JWT_SECRET,
        { expiresIn: TOKEN_EXPIRES }
      )
      ok(res, {
        token,
        user: { id: user.id, name: user.name, major: user.major, studentid: user.studentid, role: user.role || 'user' }
      }, '登录成功')
    })
  })
}
