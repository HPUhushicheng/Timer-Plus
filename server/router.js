let express = require('express')
let router = express.Router()
let info = require('./API/list')
let time = require('./API/time')

router.get('/list/all', info.all)
router.get('/list/get', info.get)
router.get('/list/add', info.add)
router.get('/list/update', info.update)
router.get('/list/del', info.del)
router.post('/api/time/update', time.update)
router.get('/api/time/get', time.get)
router.get('/api/time/getall',time.getall)
router.get('/api/time/del', time.del)
router.get('/api/time/add', time.add)
router.post('/api/time/record', time.recordTime)

module.exports = router
