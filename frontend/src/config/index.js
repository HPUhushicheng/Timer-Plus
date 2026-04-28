// 配置文件
// 优先级：远程配置缓存 > 环境变量 > 硬编码兜底

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

// 获取认证 token
function getToken() {
  return localStorage.getItem('auth_token') || ''
}

// 带认证头的 fetch 封装
async function authFetch(url, options = {}) {
  const token = getToken()
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers
  }
  return fetch(`${getApiBaseUrl()}${url}`, { ...options, headers })
}

export { getApiBaseUrl, getStaticBaseUrl, getToken, authFetch }
