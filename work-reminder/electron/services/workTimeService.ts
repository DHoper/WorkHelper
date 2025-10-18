import { BrowserWindow, Notification } from 'electron'
import { WorkRecordDB } from '../utils/database'
import { log } from '../utils/logger'

interface WorkTimeState {
  isClockedIn: boolean
  clockInTime: string | null
  clockOutTime: string | null
  estimatedOffTime: string | null
  hasNotified: boolean
  isInitialized: boolean
}

class WorkTimeService {
  private state: WorkTimeState = {
    isClockedIn: false,
    clockInTime: null,
    clockOutTime: null,
    estimatedOffTime: null,
    hasNotified: false,
    isInitialized: false
  }
  private checkTimerId: NodeJS.Timeout | null = null
  private mainWindow: BrowserWindow | null = null
  // 儲存通知引用以防止被 GC 回收（重要！）
  private activeNotification: Notification | null = null

  setMainWindow(window: BrowserWindow) {
    this.mainWindow = window
  }

  async initialize() {
    // 防止重複初始化
    if (this.state.isInitialized) {
      return
    }

    // 檢查今天是否已經打卡
    const today = new Date().toISOString().split('T')[0]
    const record = await WorkRecordDB.getByDate(today)

    if (record && record.clock_in_time) {
      this.state.isClockedIn = true
      this.state.clockInTime = record.clock_in_time
      this.state.clockOutTime = record.clock_out_time
      this.state.estimatedOffTime = this.calculateOffTime(record.clock_in_time)

      // 只有在未下班打卡時才開始檢查
      if (!record.clock_out_time) {
        // 檢查是否已經過了下班時間
        const now = new Date()
        const currentTime = now.toTimeString().split(' ')[0].substring(0, 5)
        const [h1, m1] = currentTime.split(':').map(Number)
        const [h2, m2] = this.state.estimatedOffTime!.split(':').map(Number)
        if (h1 * 60 + m1 >= h2 * 60 + m2) {
          this.state.hasNotified = true // 防止重複通知
        }
        this.startChecking()
      }
    }

    this.state.isInitialized = true
    log.info('Work time service initialized', { state: this.state })
  }

  async clockIn() {
    const now = new Date()
    const today = now.toISOString().split('T')[0]
    const time = now.toTimeString().split(' ')[0].substring(0, 5) // HH:MM

    try {
      // 檢查今天是否已經打過卡
      const existingRecord = await WorkRecordDB.getByDate(today)
      if (existingRecord && existingRecord.clock_in_time) {
        throw new Error('今日已經打過卡了')
      }

      await WorkRecordDB.create({
        date: today,
        clock_in_time: time
      })

      this.state.isClockedIn = true
      this.state.clockInTime = time
      this.state.clockOutTime = null
      this.state.estimatedOffTime = this.calculateOffTime(time)
      this.state.hasNotified = false

      this.startChecking()
      this.sendStateUpdate()

      return this.state
    } catch (error) {
      console.error('Clock in error:', error)
      throw error
    }
  }

  async clockOut() {
    if (!this.state.isClockedIn) {
      throw new Error('未打卡上班')
    }

    const now = new Date()
    const today = now.toISOString().split('T')[0]
    const time = now.toTimeString().split(' ')[0].substring(0, 5) // HH:MM

    try {
      // 計算工作時數
      const workHours = this.calculateWorkHours(this.state.clockInTime!, time)

      await WorkRecordDB.update(today, {
        clock_out_time: time,
        work_hours: workHours
      })

      this.state.clockOutTime = time
      this.stopChecking()
      this.sendStateUpdate()

      return this.state
    } catch (error) {
      console.error('Clock out error:', error)
      throw error
    }
  }

  private calculateOffTime(clockInTime: string): string {
    // 打卡時間 + 9小時，但最低為 17:30
    const [hours, minutes] = clockInTime.split(':').map(Number)
    let offHours = hours + 9
    let offMinutes = minutes

    // 處理跨日
    if (offHours >= 24) {
      offHours = offHours - 24
    }

    // 最低下班時間 17:30
    const minOffTime = 17 * 60 + 30 // 分鐘
    const calculatedOffTime = offHours * 60 + offMinutes

    if (calculatedOffTime < minOffTime) {
      return '17:30'
    }

    return `${offHours.toString().padStart(2, '0')}:${offMinutes.toString().padStart(2, '0')}`
  }

  private calculateWorkHours(clockIn: string, clockOut: string): number {
    const [inHours, inMinutes] = clockIn.split(':').map(Number)
    const [outHours, outMinutes] = clockOut.split(':').map(Number)

    const inTotalMinutes = inHours * 60 + inMinutes
    let outTotalMinutes = outHours * 60 + outMinutes

    // 處理跨日情況（例如：23:00 上班，01:00 下班）
    if (outTotalMinutes < inTotalMinutes) {
      outTotalMinutes += 24 * 60 // 加一天的分鐘數
    }

    const workMinutes = outTotalMinutes - inTotalMinutes
    return Math.round((workMinutes / 60) * 100) / 100 // 保留兩位小數
  }

  private startChecking() {
    this.stopChecking()

    // 每分鐘檢查一次
    this.checkTimerId = setInterval(() => {
      this.checkOffTime()
    }, 60000) // 60秒

    // 立即檢查一次
    this.checkOffTime()
  }

  private stopChecking() {
    if (this.checkTimerId) {
      clearInterval(this.checkTimerId)
      this.checkTimerId = null
    }
  }

  private checkOffTime() {
    if (!this.state.isClockedIn || !this.state.estimatedOffTime || this.state.hasNotified) {
      return
    }

    const now = new Date()
    const currentTime = now.toTimeString().split(' ')[0].substring(0, 5)

    // 如果當前時間 >= 預計下班時間
    if (this.isTimeGreaterOrEqual(currentTime, this.state.estimatedOffTime)) {
      this.notifyOffTime()
      this.state.hasNotified = true
    }
  }

  // 輔助方法：比較時間字符串（HH:MM格式）
  private isTimeGreaterOrEqual(time1: string, time2: string): boolean {
    const [h1, m1] = time1.split(':').map(Number)
    const [h2, m2] = time2.split(':').map(Number)
    const minutes1 = h1 * 60 + m1
    const minutes2 = h2 * 60 + m2
    return minutes1 >= minutes2
  }

  private notifyOffTime() {
    // 顯示系統通知
    if (Notification.isSupported()) {
      // 清除舊的通知引用
      if (this.activeNotification) {
        this.activeNotification.close()
      }

      // 創建並儲存新通知引用（防止 GC 回收）
      this.activeNotification = new Notification({
        title: '⏰ 下班時間到了！',
        body: `您已工作滿 9 小時\n現在是 ${this.state.estimatedOffTime}，該下班了！`,
        urgency: 'normal',
        silent: false
      })

      this.activeNotification.on('click', () => {
        log.info('Work time notification clicked')
        if (this.mainWindow) {
          if (this.mainWindow.isMinimized()) {
            this.mainWindow.restore()
          }
          this.mainWindow.show()
          this.mainWindow.focus()
        }
      })

      this.activeNotification.show()
      log.info('Work time off notification triggered', { time: this.state.estimatedOffTime })
    }

    // 發送事件到 renderer
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('worktime:offTimeReached')

      // 顯示視窗
      if (this.mainWindow.isMinimized()) {
        this.mainWindow.restore()
      }
      if (!this.mainWindow.isVisible()) {
        this.mainWindow.show()
      }

      this.mainWindow.setAlwaysOnTop(true)
      setTimeout(() => {
        if (this.mainWindow && !this.mainWindow.isDestroyed()) {
          this.mainWindow.setAlwaysOnTop(false)
        }
      }, 100)
    }
  }

  private sendStateUpdate() {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('worktime:stateUpdate', this.state)
    }
  }

  getState() {
    return this.state
  }

  // 清理資源（應用退出時調用）
  cleanup() {
    this.stopChecking()
    if (this.activeNotification) {
      this.activeNotification.close()
      this.activeNotification = null
    }
    log.info('Work time service cleaned up')
  }
}

export const workTimeService = new WorkTimeService()