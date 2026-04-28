import { defineStore } from 'pinia'
import { ref } from 'vue'
import { authFetch, getToken } from '../config/index'

export const useOnlineDurationStore = defineStore('onlineDuration', () => {
  const dbId = ref(localStorage.getItem('dbId') || '')
  const onlineDuration = ref(0)
  let timer = null
  let sendTimer = null
  let lastSentTime = Date.now()

  const logToLocalStorage = (message) => {
    const logMessage = `${new Date().toISOString()} - ${message}`
    const logs = JSON.parse(localStorage.getItem('logs') || '[]')
    logs.push(logMessage)
    // 限制日志最多 500 条
    if (logs.length > 500) logs.splice(0, logs.length - 500)
    localStorage.setItem('logs', JSON.stringify(logs))
  }

  const setStudentId = (id) => {
    dbId.value = id
    localStorage.setItem('dbId', id)
    onlineDuration.value = 0
    lastSentTime = Date.now()
  }

  const startTimer = () => {
    const currentDbId = localStorage.getItem('dbId')
    if (!currentDbId) return
    if (timer || sendTimer) return

    lastSentTime = Math.floor(Date.now() / 1000) * 1000

    // 每秒更新显示
    timer = setInterval(() => {
      const now = Math.floor(Date.now() / 1000) * 1000
      onlineDuration.value = Math.floor((now - lastSentTime) / 1000)
    }, 1000)

    // 每 60 秒发送增量时长
    sendTimer = setInterval(async () => {
      const now = new Date()
      const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

      const elapsed = onlineDuration.value
      if (elapsed < 30) return // 不足30秒不发

      const hourtime = Math.min(elapsed, 3600)
      const token = getToken()
      if (!token) {
        logToLocalStorage('未登录，无法发送数据')
        return
      }

      try {
        const res = await authFetch('/api/time/record', {
          method: 'POST',
          body: JSON.stringify({ id: currentDbId, date, hourtime })
        })
        const data = await res.json()
        if (data.status === 200) {
          logToLocalStorage(`在线时长已发送: ${hourtime}秒`)
          // 重置计数器
          lastSentTime = Math.floor(Date.now() / 1000) * 1000
          onlineDuration.value = 0
        } else {
          logToLocalStorage(`发送失败: ${data.message}`)
        }
      } catch (error) {
        logToLocalStorage(`发送在线时长失败: ${error}`)
      }
    }, 60000)
  }

  const stopTimer = () => {
    if (timer) { clearInterval(timer); timer = null }
    if (sendTimer) { clearInterval(sendTimer); sendTimer = null }
    localStorage.removeItem('logs')
    localStorage.removeItem('onlineDuration')
  }

  const resetTimer = () => {
    onlineDuration.value = 0
    lastSentTime = Math.floor(Date.now() / 1000) * 1000
  }

  return { dbId, onlineDuration, setStudentId, startTimer, stopTimer, resetTimer, logToLocalStorage }
})
