// 服务端远程配置模块
// 启动时从远程 URL 拉取最新的数据库配置
// 拉取失败则使用本地 config.json 兜底

const https = require('https')
const http = require('http')

function fetchRemoteConfig(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http
    const req = client.get(url, { timeout: 5000 }, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}`))
        return
      }
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        try {
          const config = JSON.parse(data)
          if (!config.host) {
            reject(new Error('远程配置缺少 host 字段'))
            return
          }
          resolve(config)
        } catch (e) {
          reject(new Error('远程配置 JSON 解析失败'))
        }
      })
    })
    req.on('error', reject)
    req.on('timeout', () => {
      req.destroy()
      reject(new Error('远程配置请求超时'))
    })
  })
}

module.exports = { fetchRemoteConfig }
