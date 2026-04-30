let express = require('express')
let router = express.Router()
let info = require('./API/list')
let time = require('./API/time')
let auth = require('./API/auth')
let admin = require('./API/admin')
let { authenticate, requireAdmin } = require('./middleware')

// 认证路由（无需鉴权）
router.post('/auth/register', auth.register)
router.post('/auth/login', auth.login)

// 修改密码（需要鉴权）
router.post('/auth/change-password', authenticate, admin.changePassword)

// 用户接口（需要鉴权）
router.get('/list/all', authenticate, info.all)
router.get('/list/get', authenticate, info.get)
router.delete('/list/del', authenticate, requireAdmin, info.del)

// 更新用户信息（普通用户可更新自己，管理员可更新任何人）
router.put('/list/update', authenticate, admin.update)

// 座次管理（管理员专属）
router.put('/list/seat', authenticate, requireAdmin, admin.assignSeat)

// 切换用户座次表可见性（管理员专属）
router.put('/list/visible', authenticate, requireAdmin, admin.toggleVisibility)

// 管理员数据概览
router.get('/admin/stats', authenticate, requireAdmin, admin.stats)

// 时长接口（需要鉴权）
router.get('/api/time/get', authenticate, time.get)
router.get('/api/time/getall', authenticate, time.getall)
router.delete('/api/time/del', authenticate, time.del)
router.post('/api/time/record', authenticate, time.recordTime)

module.exports = router
