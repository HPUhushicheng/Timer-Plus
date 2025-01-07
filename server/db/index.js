let mysql = require('mysql')

let db = mysql.createPool({
    host: '111.170.163.14',     //数据库IP地址
    user: 'root',          //数据库登录账号
    password: 'root14171417',      //数据库登录密码
    database: 'test'       //要操作的数据库
})

module.exports = db
