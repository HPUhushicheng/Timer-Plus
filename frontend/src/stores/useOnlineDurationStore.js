import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authFetch, getToken } from '../config/index'
import { activityProofEngine, activitySampler, clockDriftDetector } from '../utils/activity'

export const useOnlineDurationStore = defineStore('onlineDuration', () => {
  const dbId = ref(localStorage.getItem('dbId') || '')
  const onlineDuration = ref(0)          // UI 显示的原始流逝时间（秒）
  const effectiveDuration = ref(0)       // UI 显示的有效时长（秒），经过活性验证
  const activityScore = ref(100)         // 当前活性评分 (0-100)
  const suspiciousFlags = ref([])        // 当前可疑标记
  const isActive = ref(true)             // 是否有用户活动
  const engineReady = ref(false)         // 证明引擎是否就绪

  let timer = null
  let sendTimer = null
  let lastSentTime = Date.now()
  let lastEffectiveSent = Date.now()

  const logToLocalStorage = (message) => {
    const logMessage = `${new Date().toISOString()} - ${message}`
    const logs = JSON.parse(localStorage.getItem('logs') || '[]')
    logs.push(logMessage)
    if (logs.length > 500) logs.splice(0, logs.length - 500)
    localStorage.setItem('logs', JSON.stringify(logs))
  }

  // ── 证明引擎已就绪 ──
  const proofEngineReady = computed(() => engineReady.value)

  const setStudentId = (id) => {
    dbId.value = id
    localStorage.setItem('dbId', id)
    onlineDuration.value = 0
    effectiveDuration.value = 0
    lastSentTime = Date.now()
    lastEffectiveSent = Date.now()
  }

  /**
   * 启动计时器（增强版）
   *
   * 同时运行两套机制：
   * 1. 原有每秒 UI 更新 (保持向后兼容)
   * 2. 活性证明引擎 (防挂机核心)
   */
  const startTimer = () => {
    const currentDbId = localStorage.getItem('dbId')
    if (!currentDbId) return
    if (timer || sendTimer) return

    lastSentTime = Math.floor(Date.now() / 1000) * 1000
    lastEffectiveSent = Date.now()

    // ── 初始化活性证明引擎 ──
    activityProofEngine.setDependencies(activitySampler, clockDriftDetector)
    activityProofEngine.setCallbacks({
      onReport: async (report) => {
        // 当证明引擎生成上报时，用此回调发送到服务端
        await sendEnhancedReport(report)
      },
      onError: (err) => {
        logToLocalStorage(`活性证明引擎错误: ${err.message}`)
      }
    })

    // 启动引擎
    const sessionId = activityProofEngine.start(`timer_${currentDbId}_${Date.now()}`)
    engineReady.value = true
    logToLocalStorage(`活性证明引擎已启动 (session: ${sessionId})`)

    // ── 每秒更新 UI ──
    timer = setInterval(() => {
      const now = Math.floor(Date.now() / 1000) * 1000
      onlineDuration.value = Math.floor((now - lastSentTime) / 1000)

      // 计算有效时长（用于 UI 展示）
      effectiveDuration.value = Math.floor((now - lastEffectiveSent) / 1000)

      // 更新活动状态
      const samplerStatus = activitySampler.getStatus()
      isActive.value = activitySampler.hasAnyActivity()

      // 更新可疑标记
      const engineStatus = activityProofEngine.getStatus()
      if (engineStatus.samplerStatus) {
        // 简单判断：空闲超过 10 秒标记
        if (samplerStatus.mouseIdle) {
          suspiciousFlags.value = ['用户可能离开']
        } else {
          suspiciousFlags.value = []
        }
      }
    }, 1000)

    // ── 传统定时器（降级/兼容方案）──
    // 保持原有的 60 秒定时器作为降级方案，
    // 引擎的输出会同时发送两份数据：
    // 1. 原有的 { id, date, hourtime } (向后兼容)
    // 2. 增强的活性证明数据 (新服务端解析)
    sendTimer = setInterval(async () => {
      const now = new Date()
      const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

      const elapsed = onlineDuration.value
      if (elapsed < 30) return

      const hourtime = Math.min(elapsed, 3600)
      const token = getToken()
      if (!token) {
        logToLocalStorage('未登录，无法发送数据')
        return
      }

      try {
        // 从引擎获取最新指纹数据
        const samples = activitySampler.getSamples(70000)
        const fingerprint = (await import('../utils/activity/BehavioralFingerprint')).default.compute(samples, elapsed)

        // 更新活动状态
        activityScore.value = fingerprint.overallScore
        suspiciousFlags.value = fingerprint.suspiciousFlags

        // 构建增强请求体
        const requestBody = {
          // ── 向后兼容字段 ──
          id: currentDbId,
          date,
          hourtime,                // 原有字段：原始秒数（服务端兼容）

          // ── 增强字段（新服务端解析） ──
          _claimSeconds: fingerprint.effectiveSeconds,  // 经活性验证后的有效秒数
          _activityScore: fingerprint.overallScore,
          _suspiciousFlags: fingerprint.suspiciousFlags,
          _hasActivity: fingerprint.mouse.hasActivity || fingerprint.keystroke.hasActivity,
          _mouseEntropy: fingerprint.mouse.entropy,
          _mouseFractal: fingerprint.mouse.fractalDimension,
          _mouseNaturalness: fingerprint.mouse.naturalnessScore,
          _keystrokeCV: fingerprint.keystroke.flightTimeCV,
          _focusedRatio: fingerprint.focus.focusedRatio,
          _visibleRatio: fingerprint.focus.visibleRatio,
          _regularity: fingerprint.rhythm.regularityScore,
          _sessionId: activityProofEngine.getStatus().sessionId,
          _sequenceNumber: activityProofEngine.getStatus().sequenceNumber,
          _clockHealthy: clockDriftDetector.isHealthy()
        }

        const res = await authFetch('/api/time/record', {
          method: 'POST',
          body: JSON.stringify(requestBody)
        })

        const data = await res.json()
        if (data.status === 200) {
          logToLocalStorage(
            `上报成功: ${hourtime}秒原始 → ${fingerprint.effectiveSeconds}秒有效 ` +
            `(评分: ${fingerprint.overallScore}, 标记: ${fingerprint.suspiciousFlags.join(', ') || '无'})`
          )
          // 重置计数器
          lastSentTime = Math.floor(Date.now() / 1000) * 1000
          lastEffectiveSent = Date.now()
          onlineDuration.value = 0
          effectiveDuration.value = 0
        } else {
          logToLocalStorage(`发送失败: ${data.message}`)
          const nowMs = Math.floor(Date.now() / 1000) * 1000
          if (nowMs - lastSentTime > 120000) {
            lastSentTime = nowMs
            onlineDuration.value = 0
          }
        }
      } catch (error) {
        logToLocalStorage(`发送在线时长失败: ${error}`)
        const nowMs = Math.floor(Date.now() / 1000) * 1000
        if (nowMs - lastSentTime > 120000) {
          lastSentTime = nowMs
          onlineDuration.value = 0
        }
      }
    }, 60000)
  }

  /**
   * 证明引擎回调：发送增强版上报
   */
  const sendEnhancedReport = async (report) => {
    const currentDbId = localStorage.getItem('dbId')
    const token = getToken()
    if (!token || !currentDbId) return

    const now = new Date()
    const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

    try {
      // 引擎报告的数据已经是完整的，但需要包装成 API 兼容格式
      const requestBody = {
        id: currentDbId,
        date,
        hourtime: report.rawSeconds,        // 原始秒数（兼容旧字段）
        _claimSeconds: report.claimSeconds, // 活性验证后有效秒数
        _activityProof: report.activityProof,
        _sessionId: report.sessionId,
        _sequenceNumber: report.sequenceNumber,
        _timeSync: report.timeSync,
        _continuity: report.continuity
      }

      const res = await authFetch('/api/time/record', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      })

      const data = await res.json()
      if (data.status === 200) {
        logToLocalStorage(
          `[引擎] 上报成功: ${report.rawSeconds}s → ${report.claimSeconds}s (评分: ${report.activityProof.overallScore})`
        )
      }
    } catch (error) {
      logToLocalStorage(`[引擎] 上报失败: ${error.message}`)
    }
  }

  const stopTimer = () => {
    // 停止活性证明引擎
    if (engineReady.value) {
      activityProofEngine.stop()
      engineReady.value = false
    }

    if (timer) { clearInterval(timer); timer = null }
    if (sendTimer) { clearInterval(sendTimer); sendTimer = null }
    localStorage.removeItem('logs')
    localStorage.removeItem('onlineDuration')

    onlineDuration.value = 0
    effectiveDuration.value = 0
    activityScore.value = 100
    suspiciousFlags.value = []
    isActive.value = true
  }

  const resetTimer = () => {
    onlineDuration.value = 0
    effectiveDuration.value = 0
    lastSentTime = Math.floor(Date.now() / 1000) * 1000
    lastEffectiveSent = Date.now()
    activityScore.value = 100
    suspiciousFlags.value = []
  }

  return {
    dbId,
    onlineDuration,
    effectiveDuration,
    activityScore,
    suspiciousFlags,
    isActive,
    engineReady,
    proofEngineReady,
    setStudentId,
    startTimer,
    stopTimer,
    resetTimer,
    logToLocalStorage
  }
})
