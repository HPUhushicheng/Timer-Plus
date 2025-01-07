// let express = require('express')
// let app = express()
// let cors = require('cors')
// let bodyParser = require('body-parser')
// let router = require('./router')

let express = require('express');
let bodyParser = require('body-parser');
let cors = require('cors');
let router = require('./router');
let app = express();


app.use(bodyParser.json());  //配置解析，用于解析json和urlencoded格式的数据
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors())              //配置跨域
app.use(router)              //配置路由

app.get('/api/stream', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // 模拟数据推送
    setInterval(() => {
        const data = JSON.stringify({ time: new Date().toISOString() });
        res.write(`data: ${data}\n\n`);
    }, 1000 * 60 * 60); // 每小时推送一次
});

app.listen(666, () => {
    console.log('服务器启动成功');
})
