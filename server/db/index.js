let mysql = require('mysql')
let path = require('path')
let fs = require('fs')
let { fetchRemoteConfig } = require('./remote-config')

// 默认配置兜底
let config = {
    host: '111.170.163.14',
    user: 'root',
    password: 'root14171417',
    database: 'test',
    port: 3306
}

// 读取本地 config.json
let localConfig = {}
try {
    const configPath = path.join(__dirname, 'config.json')
    if (fs.existsSync(configPath)) {
        localConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'))
        config = { ...config, ...localConfig }
        console.log('本地数据库配置已加载')
    }
} catch (err) {
    console.warn('读取本地 config.json 失败:', err.message)
}

// 尝试从远程拉取最新配置，成功后覆盖本地配置
async function loadConfig() {
    if (localConfig.remoteConfigUrl) {
        try {
            console.log('正在从远程拉取数据库配置...')
            const remoteConfig = await fetchRemoteConfig(localConfig.remoteConfigUrl)
            config = { ...config, ...remoteConfig }
            console.log('远程数据库配置已加载')
        } catch (err) {
            console.warn('远程配置拉取失败，使用本地配置:', err.message)
        }
    }
    return config
}

// 先导出 db 对象（建立连接池），异步更新配置
let db = mysql.createPool(config)

// 启动后异步拉取远程配置
loadConfig().then(newConfig => {
    // 远程配置拉取完成后重新创建连接池
    // 注意：这里用新的配置重建连接池
    const oldDb = db
    db = mysql.createPool(newConfig)
    // 优雅关闭旧连接池
    try { oldDb.end() } catch {}
}).catch(err => {
    console.warn('远程配置加载异常:', err.message)
})

module.exports = db
