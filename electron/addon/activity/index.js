/**
 * Electron 系统级活动监听模块
 * =============================================
 *
 * 专利辅助模块：通过 Electron 的 powerMonitor API
 * 获取操作系统级别的用户活动状态。
 *
 * 功能：
 * 1. 获取系统空闲时间 (powerMonitor.getSystemIdleTime)
 * 2. 监听屏幕锁定/解锁事件
 * 3. 定时推送空闲状态到渲染进程
 * 4. 获取当前活跃应用名称（macOS/Windows）
 *
 * 这些数据通过 IPC 注入到渲染进程的 window 对象上，
 * 供 ActivitySampler 使用。
 */

const { ipcMain, powerMonitor } = require('electron')

const IDLE_CHECK_INTERVAL = 2000     // 空闲检查间隔 (ms)
const IDLE_THRESHOLD = 60000         // 系统空闲超过此值视为"用户可能离开"

class ActivityMonitor {
  constructor() {
    this._idleCheckTimer = null
    this._screenLocked = false
    this._listening = false
    this._state = {
      systemIdleTime: 0,
      screenLocked: false,
      isIdle: false
    }

    // IPC 通道名称
    this.CHANNEL = 'activity:system-state'
  }

  /**
   * 启动系统活动监控
   * @param {BrowserWindow} mainWindow - Electron 主窗口
   */
  start(mainWindow) {
    if (this._listening) return
    this._listening = true
    this._mainWindow = mainWindow

    // ── 注册 powerMonitor 事件 ──
    this._registerPowerMonitorEvents()

    // ── 注册 IPC handlers ──
    this._registerIPC()

    // ── 启动空闲状态轮询 ──
    this._startIdlePolling()

    console.log('[ActivityMonitor] Electron 活动监控已启动')
  }

  /**
   * 停止监控
   */
  stop() {
    if (!this._listening) return
    this._listening = false

    if (this._idleCheckTimer) {
      clearInterval(this._idleCheckTimer)
      this._idleCheckTimer = null
    }

    // 移除 IPC handler
    try {
      ipcMain.removeHandler(this.CHANNEL)
    } catch (e) {
      // handler 可能未被注册
    }

    console.log('[ActivityMonitor] Electron 活动监控已停止')
  }

  /**
   * 获取当前系统活动状态
   */
  getState() {
    return { ...this._state }
  }

  // ── 私有方法 ──

  _registerPowerMonitorEvents() {
    // 屏幕锁定事件
    powerMonitor.on('lock-screen', () => {
      this._state.screenLocked = true
      this._pushState()
      console.log('[ActivityMonitor] 屏幕已锁定')
    })

    // 屏幕解锁事件
    powerMonitor.on('unlock-screen', () => {
      this._state.screenLocked = false
      this._pushState()
      console.log('[ActivityMonitor] 屏幕已解锁')
    })

    // 系统挂起/休眠
    powerMonitor.on('suspend', () => {
      console.log('[ActivityMonitor] 系统进入休眠')
      this._state.screenLocked = true
      this._pushState()
    })

    // 系统恢复
    powerMonitor.on('resume', () => {
      console.log('[ActivityMonitor] 系统已恢复')
    })

    // 交流电源事件（笔记本插拔电源）
    powerMonitor.on('on-ac', () => {})
    powerMonitor.on('on-battery', () => {})
  }

  _registerIPC() {
    ipcMain.handle(this.CHANNEL, () => {
      return this.getState()
    })
  }

  _startIdlePolling() {
    this._idleCheckTimer = setInterval(() => {
      try {
        // 获取系统空闲时间（秒），转换为毫秒
        const idleSeconds = powerMonitor.getSystemIdleTime()
        const idleMs = idleSeconds * 1000

        this._state.systemIdleTime = idleMs
        this._state.isIdle = idleMs > IDLE_THRESHOLD

        // 通过 IPC 推送到渲染进程
        this._pushState()
      } catch (err) {
        // getSystemIdleTime 在某些 Linux 环境可能不可用
        console.error('[ActivityMonitor] 获取系统空闲时间失败:', err.message)
      }
    }, IDLE_CHECK_INTERVAL)
  }

  _pushState() {
    if (this._mainWindow && !this._mainWindow.isDestroyed()) {
      try {
        this._mainWindow.webContents.executeJavaScript(`
          window.__electronSystemIdleTime = ${this._state.systemIdleTime};
          window.__electronScreenLocked = ${this._state.screenLocked};
          window.__electronIsIdle = ${this._state.isIdle};
        `).catch(() => {
          // 忽略导航期间的错误
        })
      } catch (e) {
        // 窗口已销毁
      }
    }
  }
}

// 单例导出
const activityMonitor = new ActivityMonitor()
module.exports = { ActivityMonitor, activityMonitor }
