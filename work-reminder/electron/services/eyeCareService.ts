import { BrowserWindow, Notification, app } from 'electron'
import { log } from '../utils/logger'

interface EyeCareConfig {
  interval: number // 分鐘
  enabled: boolean
}

class EyeCareService {
  private timerId: NodeJS.Timeout | null = null
  private remainingSeconds: number = 0
  private config: EyeCareConfig = {
    interval: 60,
    enabled: true
  }
  private isPaused: boolean = false
  private mainWindow: BrowserWindow | null = null
  // 儲存通知引用以防止被 GC 回收（重要！）
  private activeNotification: Notification | null = null

  setMainWindow(window: BrowserWindow) {
    this.mainWindow = window
  }

  setConfig(config: Partial<EyeCareConfig>) {
    this.config = { ...this.config, ...config }
    if (config.enabled !== undefined) {
      if (config.enabled) {
        this.start()
      } else {
        this.stop()
      }
    }
    if (config.interval !== undefined && this.config.enabled) {
      this.restart()
    }
  }

  getConfig() {
    return this.config
  }

  getRemainingSeconds() {
    return this.remainingSeconds
  }

  isPausedState() {
    return this.isPaused
  }

  start() {
    this.stop()
    this.remainingSeconds = this.config.interval * 60
    this.isPaused = false
    this.startTicking()
  }

  stop() {
    if (this.timerId) {
      clearInterval(this.timerId)
      this.timerId = null
    }
  }

  restart() {
    this.start()
  }

  pause() {
    this.isPaused = true
    this.stop()
  }

  resume() {
    this.isPaused = false
    this.startTicking()
  }

  postpone(minutes: number) {
    this.remainingSeconds += minutes * 60
    this.sendStateUpdate()
  }

  private startTicking() {
    this.timerId = setInterval(() => {
      this.remainingSeconds--

      // 每秒發送狀態更新（只在視窗存在且可見時）
      if (this.mainWindow && !this.mainWindow.isDestroyed()) {
        this.sendStateUpdate()
      }

      if (this.remainingSeconds <= 0) {
        this.onComplete()
      }
    }, 1000)
  }

  private sendStateUpdate() {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      // 只在視窗準備好時發送更新
      if (this.mainWindow.webContents.isLoading()) {
        return
      }
      this.mainWindow.webContents.send('eyecare:tick', {
        remainingSeconds: this.remainingSeconds,
        config: this.config,
        isPaused: this.isPaused
      })
    }
  }

  private onComplete() {
    this.stop()

    // 顯示系統通知（Windows/macOS/Linux原生通知）
    if (Notification.isSupported()) {
      // 清除舊的通知引用
      if (this.activeNotification) {
        this.activeNotification.close()
      }

      // 創建並儲存新通知引用（防止 GC 回收）
      this.activeNotification = new Notification({
        title: '👁️ 護眼時間到了',
        body: '該讓眼睛休息了！\n請看向 20 英尺外的物體 20 秒',
        icon: undefined,
        timeoutType: 'never',
        urgency: 'normal',
        silent: false
      })

      this.activeNotification.on('click', () => {
        log.info('Eye care notification clicked')
        if (this.mainWindow) {
          if (this.mainWindow.isMinimized()) {
            this.mainWindow.restore()
          }
          this.mainWindow.show()
          this.mainWindow.focus()
        }
      })

      this.activeNotification.show()
      log.info('Eye care reminder triggered')
    }

    // 發送完成事件到 renderer
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('eyecare:complete')

      // 如果窗口最小化或隱藏，恢復並顯示
      if (this.mainWindow.isMinimized()) {
        this.mainWindow.restore()
      }
      if (!this.mainWindow.isVisible()) {
        this.mainWindow.show()
      }

      // 將窗口帶到最前面（但不強制聚焦）
      this.mainWindow.setAlwaysOnTop(true)
      setTimeout(() => {
        if (this.mainWindow && !this.mainWindow.isDestroyed()) {
          this.mainWindow.setAlwaysOnTop(false)
        }
      }, 100)
    }

    // 自動重啟下一輪
    this.start()
  }

  getState() {
    return {
      remainingSeconds: this.remainingSeconds,
      config: this.config,
      isPaused: this.isPaused
    }
  }

  // 清理資源（應用退出時調用）
  cleanup() {
    this.stop()
    if (this.activeNotification) {
      this.activeNotification.close()
      this.activeNotification = null
    }
    log.info('Eye care service cleaned up')
  }
}

export const eyeCareService = new EyeCareService()