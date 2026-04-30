// 认证中间件 + 统一响应工具
const jwt = require('jsonwebtoken')

const JWT_SECRET = process.env.JWT_SECRET || 'timer_plus_secret_key_change_in_production'

// JWT 认证中间件
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ status: 401, message: '未提供认证令牌' })
  }
  try {
    const token = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, JWT_SECRET)
    req.user = decoded
    next()
  } catch {
    return res.status(401).json({ status: 401, message: '认证令牌无效或已过期' })
  }
}

// 统一成功响应
function ok(res, data = null, message = 'success') {
  return res.status(200).json({ status: 200, message, data })
}

// 统一错误响应
function fail(res, status, message) {
  return res.status(status).json({ status, message })
}

// 管理员权限中间件（需在 authenticate 之后使用）
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ status: 403, message: '需要管理员权限' })
  }
  next()
}

module.exports = { authenticate, requireAdmin, ok, fail, JWT_SECRET }
