let mysql = require('mysql2')
let path = require('path')
let fs = require('fs')
let { fetchRemoteConfig } = require('./remote-config')

// 默认配置兜底
const defaultConfig = {
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'test',
    port: 3306
}

// 读取本地 config.json
let config = { ...defaultConfig }
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

// 创建连接池
let db = mysql.createPool(config)

// 启动后异步拉取远程配置，成功后替换连接池
async function loadRemoteConfig() {
    if (!localConfig.remoteConfigUrl) return
    try {
        console.log('正在从远程拉取数据库配置...')
        const remoteConfig = await fetchRemoteConfig(localConfig.remoteConfigUrl)
        // 用远程配置更新
        const newConfig = { ...config, ...remoteConfig }
        const newPool = mysql.createPool(newConfig)
        const oldPool = db
        db = newPool
        console.log('远程数据库配置已加载，连接池已更新')
        // 延迟关闭旧连接池，避免中断进行中的查询
        setTimeout(() => { try { oldPool.end() } catch {} }, 5000)
    } catch (err) {
        console.warn('远程配置拉取失败，使用本地配置:', err.message)
    }
}

loadRemoteConfig()

module.exports = db
