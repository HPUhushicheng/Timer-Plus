let express = require('express');
let cors = require('cors');
let router = require('./router');
let app = express();

// ── 初始化验证服务 ──
const { behaviorAnalyzer, challengeManager } = require('./services')
const timeApi = require('./API/time')
const { runMigrations } = require('./db/migrate')

behaviorAnalyzer.start()
challengeManager.start()
timeApi.init()
console.log('[启动] 活性证明验证服务已初始化')

// ── 迁移数据库（新增列、新表） ──
runMigrations().catch(err => {
  console.error('[启动] 数据库迁移失败（不阻塞启动）:', err.message)
})

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors())
app.use(router)

// SSE 推送端点（带连接清理）
app.get('/api/stream', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const interval = setInterval(() => {
        const data = JSON.stringify({ time: new Date().toISOString() });
        res.write(`data: ${data}\n\n`);
    }, 1000 * 60 * 60);

    req.on('close', () => {
        clearInterval(interval)
    })
});

// AI 代理接口（将 API Key 保留在服务端）
app.post('/api/chat/proxy', async (req, res) => {
    try {
        const { messages, userMessage } = req.body
        // 请将 AI_API_KEY 设置到环境变量中，或创建 .env 文件
        // AI API Key 不应硬编码在源代码中
        const apiKey = process.env.AI_API_KEY
        const fetch = (await import('node-fetch')).default

        const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'glm-4-flash',
                messages: messages || [{ role: 'user', content: userMessage || '你好' }],
                stream: false
            })
        })

        if (!response.ok) {
            return res.status(response.status).json({
                status: response.status,
                message: 'AI 服务暂时不可用'
            })
        }
        const data = await response.json()
        res.json({ status: 200, data })
    } catch (err) {
        console.error('AI 代理错误:', err.message)
        res.status(500).json({ status: 500, message: 'AI 服务错误' })
    }
})

// 健康检查
app.get('/api/health', (req, res) => {
    const db = require('./db/index')
    db.query('SELECT 1', (err) => {
        if (err) return res.status(500).json({ status: 500, db: '离线', error: err.code + ': ' + err.sqlMessage })
        res.json({ status: 200, server: '在线', db: '在线' })
    })
})

app.listen(666, () => {
    console.log('服务器启动成功');
})
