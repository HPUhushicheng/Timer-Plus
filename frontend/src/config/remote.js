// 远程配置模块
// 应用启动时从远程 URL 拉取最新配置，并缓存到本地
// 如果远程拉取失败，使用本地缓存的配置兜底

const REMOTE_CONFIG_URL = import.meta.env.VITE_REMOTE_CONFIG_URL
const CACHE_KEY = 'remote_config'

// 从远程 URL 拉取配置
export async function fetchRemoteConfig() {
  if (!REMOTE_CONFIG_URL) {
    console.log('未配置远程配置 URL，使用本地配置')
    return null
  }

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    const response = await fetch(REMOTE_CONFIG_URL, {
      signal: controller.signal,
      cache: 'no-cache'  // 确保拿到最新版本
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const config = await response.json()
    // 校验必需字段
    if (!config.apiBaseUrl) {
      throw new Error('远程配置缺少 apiBaseUrl 字段')
    }

    console.log('远程配置拉取成功:', config)
    return config
  } catch (err) {
    console.warn('远程配置拉取失败，使用本地缓存:', err.message)
    return null
  }
}

// 从 localStorage 读取缓存的配置
export function getCachedConfig() {
  try {
    const cached = localStorage.getItem(CACHE_KEY)
    if (cached) return JSON.parse(cached)
  } catch { /* ignore */ }
  return null
}

// 缓存配置到 localStorage
export function cacheConfig(config) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(config))
  } catch { /* ignore */ }
}
