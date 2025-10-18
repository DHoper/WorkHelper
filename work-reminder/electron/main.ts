import { app, BrowserWindow, Menu, ipcMain } from 'electron'
import path from 'path'
import { menubar } from 'menubar'
import { initDatabase, closeDatabase, TaskDB, WorkRecordDB, SettingDB, ReminderDB, RecordingDB, TranscriptionDB } from './utils/database'
import { eyeCareService } from './services/eyeCareService'
import { workTimeService } from './services/workTimeService'
import { recordingService } from './services/recordingService'
import { calendarService } from './services/calendarService'
import { log, setupLogger } from './utils/logger'
import { registerShortcuts, unregisterShortcuts } from './utils/shortcuts'
import { setupSingleInstance } from './utils/singleInstance'
import { createAppMenu } from './config/menu'

let isQuitting = false
let shouldHideWindow = false // 控制窗口是否應該隱藏

// 初始化日誌系統（最優先）
setupLogger()

// 確定托盤圖標路徑
const getTrayIconPath = (): string => {
  // 在開發環境和打包後都使用相同的相對路徑
  // __dirname 在開發環境指向 electron 目錄，打包後指向 app.asar/dist-electron
  const basePath = app.isPackaged
    ? path.join(process.resourcesPath, 'resources')
    : path.join(__dirname, '../resources')

  if (process.platform === 'win32') {
    return path.join(basePath, 'tray-icon.ico')
  } else if (process.platform === 'darwin') {
    return path.join(basePath, 'tray-iconTemplate.png')
  } else {
    return path.join(basePath, 'tray-icon.png')
  }
}

// 使用 menubar 創建托盤應用
// menubar 自動處理所有托盤相關的跨平台問題
const getIndexPath = (): string => {
  if (process.env.VITE_DEV_SERVER_URL) {
    return process.env.VITE_DEV_SERVER_URL
  }

  // 在打包後，HTML 檔案位於 resources/app.asar/dist/index.html
  // __dirname 在打包後指向 resources/app.asar/dist-electron
  const indexPath = path.join(__dirname, '../dist/index.html')
  return `file://${indexPath.replace(/\\/g, '/')}`
}

const mb = menubar({
  icon: getTrayIconPath(),
  index: getIndexPath(),
  tooltip: '工作助手',
  browserWindow: {
    width: 520,
    height: 600,
    minWidth: 520,
    minHeight: 600,
    maxWidth: 520,
    maxHeight: 600,
    resizable: false,
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    backgroundColor: '#ffffff',
    show: false
  },
  preloadWindow: true,
  showDockIcon: false,
  windowPosition: 'center' as any, // 設置視窗居中顯示
  showOnAllWorkspaces: false,
  showOnRightClick: false
})

// menubar ready 事件：應用和托盤已準備就緒
mb.on('ready', () => {
  log.info('Menubar app ready', {
    version: app.getVersion(),
    platform: process.platform,
    isPackaged: app.isPackaged
  })

  // 初始化資料庫
  initDatabase()

  // 設置 IPC handlers
  setupIpcHandlers()
  handleWindowControl()

  // 多開防護
  if (!setupSingleInstance(mb.window!)) {
    app.quit()
    return
  }

  // 註冊快捷鍵
  if (mb.window) {
    registerShortcuts(mb.window)
    createAppMenu(mb.window)

    // 禁用窗口的自動隱藏行為
    mb.window.setSkipTaskbar(false) // 顯示在任務欄
  }

  // 完全移除 menubar 的默認點擊行為
  mb.removeAllListeners('focus-lost')
  mb.removeAllListeners('blur')

  // 修改托盤圖標點擊行為：只切換顯示/隱藏
  mb.tray.removeAllListeners('click')
  mb.tray.on('click', () => {
    if (mb.window?.isVisible()) {
      shouldHideWindow = true
      mb.hideWindow()
    } else {
      mb.showWindow()
    }
  })

  // 創建右鍵選單
  const contextMenu = Menu.buildFromTemplate([
    {
      label: '顯示窗口',
      click: () => {
        mb.showWindow()
      }
    },
    { type: 'separator' },
    {
      label: '退出',
      click: () => {
        isQuitting = true
        app.quit()
      }
    }
  ])

  mb.tray.setContextMenu(contextMenu)
  log.info('Tray context menu configured')
})

// 窗口顯示後的處理
mb.on('after-show', async () => {
  log.debug('Window shown')

  // 設置服務的主視窗引用
  if (mb.window) {
    eyeCareService.setMainWindow(mb.window)
    workTimeService.setMainWindow(mb.window)
    calendarService.setMainWindow(mb.window)

    // 初始化上下班服務（只在第一次顯示時初始化）
    if (!workTimeService.getState().isInitialized) {
      await workTimeService.initialize()
    }

    // 開發環境開啟 DevTools
    if (process.env.VITE_DEV_SERVER_URL) {
      mb.window.webContents.openDevTools({ mode: 'detach' })
    }
  }
})

// 窗口隱藏後的處理
mb.on('after-hide', () => {
  log.debug('Window hidden', { shouldHide: shouldHideWindow })
  // 重置標誌
  shouldHideWindow = false
})

// 防止窗口完全關閉
app.on('before-quit', () => {
  isQuitting = true

  log.info('Application quitting, cleaning up...')

  // 註銷快捷鍵
  unregisterShortcuts()

  // 清理服務資源
  eyeCareService.cleanup()
  workTimeService.cleanup()
  calendarService.cleanup()

  // 關閉資料庫
  closeDatabase()
})

// Windows/Linux：不在關閉所有窗口時退出
app.on('window-all-closed', (e: Event) => {
  e.preventDefault()
})

// IPC handler: 處理窗口控制
function handleWindowControl() {
  // 縮小按鈕：隱藏到托盤
  ipcMain.handle('window:minimize', () => {
    shouldHideWindow = true
    mb.hideWindow()
  })

  // 關閉按鈕：隱藏到托盤
  ipcMain.handle('window:close', () => {
    shouldHideWindow = true
    mb.hideWindow()
  })
}

/**
 * IPC handler 錯誤處理包裝器
 * 自動記錄錯誤並統一錯誤回應格式
 */
function handleIPC(channel: string, handler: (...args: any[]) => any) {
  ipcMain.handle(channel, async (event, ...args) => {
    try {
      log.debug(`IPC call: ${channel}`, { args })
      const result = await handler(...args)
      return result
    } catch (error) {
      log.error(`IPC error: ${channel}`, { error, args })
      throw error
    }
  })
}

// 設置 IPC handlers
function setupIpcHandlers() {
  // 任務相關
  handleIPC('db:tasks:getAll', () => TaskDB.getAll())
  handleIPC('db:tasks:getById', (id: number) => TaskDB.getById(id))
  handleIPC('db:tasks:getByCategory', (category: string) => TaskDB.getByCategory(category))
  handleIPC('db:tasks:create', (task: any) => TaskDB.create(task))
  handleIPC('db:tasks:update', (id: number, updates: any) => TaskDB.update(id, updates))
  handleIPC('db:tasks:delete', (id: number) => TaskDB.delete(id))
  handleIPC('db:tasks:toggleComplete', (id: number) => TaskDB.toggleComplete(id))

  // 上下班記錄相關
  handleIPC('db:workRecords:getAll', () => WorkRecordDB.getAll())
  handleIPC('db:workRecords:getByDate', (date: string) => WorkRecordDB.getByDate(date))
  handleIPC('db:workRecords:getByDateRange', (startDate: string, endDate: string) =>
    WorkRecordDB.getByDateRange(startDate, endDate))
  handleIPC('db:workRecords:create', (record: any) => WorkRecordDB.create(record))
  handleIPC('db:workRecords:update', (date: string, updates: any) => WorkRecordDB.update(date, updates))
  handleIPC('db:workRecords:delete', (id: number) => WorkRecordDB.delete(id))

  // 設定相關
  handleIPC('db:settings:get', (key: string) => SettingDB.get(key))
  handleIPC('db:settings:set', (key: string, value: string) => SettingDB.set(key, value))
  handleIPC('db:settings:delete', (key: string) => SettingDB.delete(key))

  // 提醒記錄相關
  handleIPC('db:reminders:getRecent', (limit?: number) => ReminderDB.getRecent(limit))
  handleIPC('db:reminders:create', (reminder: any) => ReminderDB.create(reminder))
  handleIPC('db:reminders:dismiss', (id: number) => ReminderDB.dismiss(id))
  handleIPC('db:reminders:clearOld', (daysAgo?: number) => ReminderDB.clearOld(daysAgo))

  // 護眼服務相關
  handleIPC('eyecare:getState', () => eyeCareService.getState())
  handleIPC('eyecare:setConfig', (config: any) => {
    eyeCareService.setConfig(config)
    return eyeCareService.getState()
  })
  handleIPC('eyecare:start', () => {
    eyeCareService.start()
    return eyeCareService.getState()
  })
  handleIPC('eyecare:stop', () => {
    eyeCareService.stop()
    return eyeCareService.getState()
  })
  handleIPC('eyecare:pause', () => {
    eyeCareService.pause()
    return eyeCareService.getState()
  })
  handleIPC('eyecare:resume', () => {
    eyeCareService.resume()
    return eyeCareService.getState()
  })
  handleIPC('eyecare:postpone', (minutes: number) => {
    eyeCareService.postpone(minutes)
    return eyeCareService.getState()
  })
  handleIPC('eyecare:restart', () => {
    eyeCareService.restart()
    return eyeCareService.getState()
  })

  // 上下班服務相關
  handleIPC('worktime:getState', () => workTimeService.getState())
  handleIPC('worktime:clockIn', async () => {
    return await workTimeService.clockIn()
  })
  handleIPC('worktime:clockOut', async () => {
    return await workTimeService.clockOut()
  })

  // 錄音相關
  handleIPC('recording:getAll', () => recordingService.getAllRecordings())
  handleIPC('recording:getById', (id: number) => recordingService.getRecording(id))
  handleIPC('recording:getFilePath', (format: string) => recordingService.generateFilePath(format))
  handleIPC('recording:writeFile', async (filePath: string, data: Uint8Array | Buffer) => {
    const fs = require('fs')
    // 驗證檔案大小（最大 100MB）
    const maxSize = 100 * 1024 * 1024
    if (data.length > maxSize) {
      throw new Error(`File size exceeds maximum allowed size of ${maxSize} bytes`)
    }
    fs.writeFileSync(filePath, Buffer.from(data))
    return { success: true }
  })
  handleIPC('recording:save', async (metadata: any, filePath: string) => {
    return await recordingService.saveRecording(metadata, filePath)
  })
  handleIPC('recording:delete', async (id: number) => {
    return await recordingService.deleteRecording(id)
  })
  handleIPC('recording:update', (id: number, updates: any) => {
    return recordingService.updateRecording(id, updates)
  })
  handleIPC('recording:readFile', async (filePath: string) => {
    const fs = require('fs')
    const buffer = fs.readFileSync(filePath)
    return buffer
  })

  // 轉錄相關
  handleIPC('transcription:get', (recordingId: number) => {
    return recordingService.getTranscription(recordingId)
  })
  handleIPC('transcription:save', async (recordingId: number, content: string, language: string) => {
    return await recordingService.saveTranscription(recordingId, content, language)
  })
  handleIPC('transcription:whisper', async (filePath: string, apiKey: string) => {
    return await recordingService.transcribeWithWhisper(filePath, apiKey)
  })
  handleIPC('transcription:generateSummary', async (text: string, apiKey: string) => {
    return await recordingService.generateSummary(text, apiKey)
  })
  handleIPC('transcription:processLongRecording', async (filePath: string, apiKey: string) => {
    return await recordingService.processLongRecording(filePath, apiKey)
  })

  // Google Calendar 相關
  handleIPC('calendar:initAuth', async (clientId: string, clientSecret: string) => {
    return await calendarService.initializeAuth(clientId, clientSecret)
  })
  handleIPC('calendar:getAuthUrl', () => {
    return calendarService.getAuthUrl()
  })
  handleIPC('calendar:authenticateWithCode', async (code: string) => {
    return await calendarService.authenticateWithCode(code)
  })
  handleIPC('calendar:isAuthenticated', () => {
    return calendarService.isAuthenticated()
  })
  handleIPC('calendar:getCalendarList', async () => {
    return await calendarService.getCalendarList()
  })
  handleIPC('calendar:getUpcomingEvents', async (hoursAhead: number) => {
    return await calendarService.getUpcomingEvents(hoursAhead)
  })
  handleIPC('calendar:setKeywords', (keywords: string[]) => {
    calendarService.setKeywords(keywords)
  })
  handleIPC('calendar:getKeywords', () => {
    return calendarService.getKeywords()
  })
  handleIPC('calendar:setLookAheadMinutes', (minutes: number) => {
    calendarService.setLookAheadMinutes(minutes)
  })
  handleIPC('calendar:startMonitoring', () => {
    calendarService.startMonitoring()
  })
  handleIPC('calendar:stopMonitoring', () => {
    calendarService.stopMonitoring()
  })
  handleIPC('calendar:clearAuth', async () => {
    return await calendarService.clearAuth()
  })
}
