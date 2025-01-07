let db = require('../db/index.js');

//以下是时长的增删改查操作
exports.get = (req, res) => { // 通过 id 和 date 查询当天时长数据
    var sql = 'select daytime, hourtime from time where id = ? and date = ? group by daytime;';
    db.query(sql, [req.query.id, req.query.date], (err, data) => {
        if (err) {
            return res.send('错误：' + err.message);
        }
        res.send(data);
    });
}

exports.getall =(req,res) =>{
    var sql = 'select * from time ';
    db .query(sql,(err,data) =>{
        if (err) {
            return res.send('错误：' + err.message);
        }
        res.send(data);
    });
}

exports.del = (req, res) => {        //通过id和date删除当天时长数据
    var sql = 'delete from time where id = ? and date = ?'
    db.query(sql, [req.query.id, req.query.date], (err, data) => {
        if (err) {
            return res.send('错误：' + err.message)
        }
        if (data.affectedRows > 0) {
            res.send({
                status: 200,
                data: {
                    id: req.query.id,
                    date: req.query.date
                },
                message: '删除成功'
            })
        } else {
            res.send({
                status: 202,
                message: '删除失败'
            })
        }
    })
}

exports.add = (req, res) => {        //向time表添加数据
    var sql = 'insert into time (id,date, daytime, hourtime) values (?,?,?,?)'
    db.query(sql, [req.query.id, req.query.date, req.query.daytime, req.query.hourtime], (err, data) => {
        if (err) {
            return res.send('错误：' + err.message)
        }
        if (data.affectedRows > 0) {
            res.send({
                status: 200,
                message: 'success',
                data: {
                    id: req.query.id,
                    date: req.query.date,
                    daytime: req.query.daytime,
                    hourtime: req.query.hourtime
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
exports.update = (req, res) => {        //通过id、date和daytime更新数据
    const { id, date, daytime, hourtime } = req.body;
    var sql = 'UPDATE time SET hourtime = ? WHERE id = ? AND date = ? AND daytime = ?';
    db.query(sql, [hourtime, id, date, daytime], (err, data) => {
        if (err) {
            return res.send('错误：' + err.message);
        }
        if (data.changedRows > 0) {
            res.send({
                status: 200,
                message: 'success',
                data: {
                    id: id,
                    date: date,
                    daytime: daytime,
                    hourtime: hourtime
                }
            });
        } else {
            res.send({
                status: 202,
                message: 'error'
            });
        }
    });
}

//记录在线时长
exports.recordTime = (req, res) => {
    const { id, date, hourtime } = req.body;
    const daytime = new Date().getHours();

    // 直接更新当前小时的时长，不需要累加
    const sql = 'INSERT INTO time (id, date, daytime, hourtime) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE hourtime = ?';
    db.query(sql, [id, date, daytime, hourtime, hourtime], (err, data) => {
        if (err) {
            console.error(`数据库错误: ${err.code} - ${err.message}`);
            return res.status(500).send({ status: 500, message: `错误：${err.code} - ${err.message}` });
        }
        res.send({ 
            status: 200, 
            message: 'success',
            data: {
                id: id,
                date: date,
                daytime: daytime,
                hourtime: hourtime
            }   
        });
    });
}


