// 配置文件
// 优先级：远程配置缓存 > 环境变量 > 硬编码兜底
// 应用启动时 main.js 会拉取远程配置并缓存到 localStorage

import { getCachedConfig } from './remote'

function getApiBaseUrl() {
  const cached = getCachedConfig()
  if (cached?.apiBaseUrl) return cached.apiBaseUrl
  return import.meta.env.VITE_API_BASE_URL || 'http://47.120.68.44:666'
}

function getStaticBaseUrl() {
  const cached = getCachedConfig()
  if (cached?.staticBaseUrl) return cached.staticBaseUrl
  return import.meta.env.VITE_STATIC_BASE_URL || 'http://111.170.163.14'
}

export { getApiBaseUrl, getStaticBaseUrl }
