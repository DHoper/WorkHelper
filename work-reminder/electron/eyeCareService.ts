import { BrowserWindow, Notification, app } from 'electron'

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

      // 每秒發送狀態更新
      this.sendStateUpdate()

      if (this.remainingSeconds <= 0) {
        this.onComplete()
      }
    }, 1000)
  }

  private sendStateUpdate() {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
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
      const notification = new Notification({
        title: '👁️ 護眼時間到了',
        body: '該讓眼睛休息了！\n請看向 20 英尺外的物體 20 秒',
        icon: undefined, // 可以設置應用圖標路徑
        timeoutType: 'never', // 通知不自動消失
        urgency: 'normal',
        silent: false // 系統提示音
      })

      notification.on('click', () => {
        // 點擊通知時顯示應用程式
        if (this.mainWindow) {
          if (this.mainWindow.isMinimized()) {
            this.mainWindow.restore()
          }
          this.mainWindow.show()
          this.mainWindow.focus()
        }
      })

      notification.show()
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
  }
}

export const eyeCareService = new EyeCareService()