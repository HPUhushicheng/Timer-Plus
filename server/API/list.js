let db = require('../db/index.js')

exports.all = (req, res) => {        //获取info表全部数据
    var sql = 'select * from info'
    db.query(sql, (err, data) => {
        if(err) {
            return res.send('错误：' + err.message)
        }
        res.send(data)
    })
}
exports.get = (req, res) => {        //通过id查询数据
    var sql = 'select * from info where id = ?'    //？用于占位
    db.query(sql, [req.query.id], (err, data) => {
        if(err) {
            return res.send('错误：' + err.message)
        }
        res.send(data)
    })
}

exports.del = (req, res) => {        //通过id删除数据
    var sql = 'delete from info where id = ?'
    db.query(sql, [req.query.id], (err, data) => {
        if(err) {
            return res.send('错误：' + err.message)
        }
        if(data.affectedRows > 0) {
            res.send({
              status: 200,
                message: '删除成功',
                data: {
                  id: req.query.id
              }
            })
        }else{
            res.send({
              status: 202,
              message: '删除失败'
            })
        }
    })
}

exports.add = (req, res) => {        //向info表添加数据，这里使用studentid作为id，这里发现虽然做了not null处理，但是还是会出现某些字段为空的情况下还是注册，加入非空校验
    const { studentid, name, password, major, tel, qq } = req.query;
    // 检查必需的参数是否存在且不为空
    if (!studentid || !name || !password || !major || !tel || !qq) {
        return res.send({
            status: 400,
            message: '缺少必需的参数'
        });
    }
    var sql = 'insert into info (id,name,password,studentid,major,tel,qq) values (?,?,?,?,?,?,?)'
    db.query(sql, [req.query.studentid, req.query.name, req.query.password, req.query.studentid, req.query.major, req.query.tel, req.query.qq], (err, data) => {
        if(err) {
            return res.send('错误：' + err.message)
        }
        if(data.affectedRows > 0) {
            res.send({
              status: 200,
                message: 'success',
              data: {
                id: req.query.studentid,
                name: req.query.name,
                password: req.query.password,
                studentid: req.query.studentid,
                major: req.query.major,
                tel: req.query.tel,
                qq: req.query.qq
              }
            })
        }else{
            res.send({
              status: 202,
              message: 'error'
            })
        }
    })
}

exports.update = (req, res) => {        //通过id更新数据
    var sql = 'update info set name = ?, password = ?,studentid = ?, major = ?,tel = ? ,qq = ?where id = ?'
    db.query(sql, [req.query.name,req.query.password, req.query.studentid, req.query.major,req.query.tel, req.query.qq,req.query.id], (err, data) => {
        if(err) {
            return res.send('错误：' + err.message)
        }
        if(data.changedRows > 0) {
          res.send({
            status: 200,
              message: 'success',
            data: {
              id: req.query.id,
              name: req.query.name,
              password: req.query.password,
              studentid: req.query.studentid,
              major: req.query.major,
              tel: req.query.tel,
              qq: req.query.qq
            }
          })
        }else{
          res.send({
            status: 202,
            message: 'error'
          })
        }
    })
}

exports.zhuce = (req, res) => { //新增注册接口
    var sql = 'insert into info (id,name,major,studentid,tel,password) values (?,?,?,?,?,?)'
    db.query(sql, [req.query.id,req.query.name,req.query.major,req.query.studentid,req.query.tel,req.query.password], (err, data) => {
        if(err) {
            return res.send('错误：' + err.message)
        }
        if (data.affectedRows > 0) {
            res.send({
                status: 200,
                message: 'success',
                data: {
                    id: req.query.id,
                    name: req.query.name,
                    major: req.query.major,
                    studentid: req.query.studentid,
                    tel: req.query.tel,
                    password: req.query.password
                }
            })
        } else {
            res.send({
                status: 202,
                message: 'error'
            })
        }
        })
}
