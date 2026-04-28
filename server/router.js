let express = require('express')
let router = express.Router()
let info = require('./API/list')
let time = require('./API/time')
let auth = require('./API/auth')
let { authenticate } = require('./middleware')

// 认证路由（无需鉴权）
router.post('/auth/register', auth.register)
router.post('/auth/login', auth.login)

// 用户接口（需要鉴权）
router.get('/list/all', authenticate, info.all)
router.get('/list/get', authenticate, info.get)
router.delete('/list/del', authenticate, info.del)

// 时长接口（需要鉴权）
router.get('/api/time/get', authenticate, time.get)
router.get('/api/time/getall', authenticate, time.getall)
router.delete('/api/time/del', authenticate, time.del)
router.post('/api/time/record', authenticate, time.recordTime)

module.exports = router
