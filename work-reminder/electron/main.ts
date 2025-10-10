import { app, BrowserWindow, Tray, Menu, nativeImage, ipcMain } from 'electron'
import path from 'path'
import { initDatabase, closeDatabase, TaskDB, WorkRecordDB, SettingDB, ReminderDB, RecordingDB, TranscriptionDB } from './database'
import { eyeCareService } from './eyeCareService'
import { workTimeService } from './workTimeService'
import { recordingService } from './recordingService'

let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 600,
    height: 500,
    minWidth: 500,
    minHeight: 450,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    autoHideMenuBar: true,
    show: false
  })

  mainWindow.once('ready-to-show', async () => {
    mainWindow?.show()
    // 設置護眼服務的主視窗引用
    eyeCareService.setMainWindow(mainWindow!)
    // 設置上下班服務的主視窗引用
    workTimeService.setMainWindow(mainWindow!)
    // 初始化上下班服務（檢查今天是否已打卡）
    await workTimeService.initialize()
  })

  // 開發環境載入 Vite 伺服器，生產環境載入打包後的檔案
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  // 點擊關閉時隱藏到系統托盤
  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault()
      mainWindow?.hide()
    }
  })
}

const createTray = () => {
  // 創建托盤圖標（暫時使用空圖標，之後需要添加實際圖標）
  const icon = nativeImage.createEmpty()
  tray = new Tray(icon)

  const contextMenu = Menu.buildFromTemplate([
    {
      label: '顯示主視窗',
      click: () => {
        mainWindow?.show()
      }
    },
    { type: 'separator' },
    {
      label: '退出',
      click: () => {
        app.isQuitting = true
        app.quit()
      }
    }
  ])

  tray.setToolTip('工作提醒小幫手')
  tray.setContextMenu(contextMenu)

  // 點擊托盤圖標顯示主視窗
  tray.on('click', () => {
    mainWindow?.show()
  })
}

app.whenReady().then(() => {
  // 初始化資料庫
  initDatabase()

  // 設置 IPC handlers
  setupIpcHandlers()

  createWindow()
  createTray()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    // Windows 和 Linux 下不完全退出，保持在托盤
    // app.quit()
  }
})

// 防止應用被完全關閉
app.on('before-quit', () => {
  app.isQuitting = true

  // 清理服務資源
  eyeCareService.cleanup()
  workTimeService.cleanup()

  closeDatabase()
})

// 設置 IPC handlers
function setupIpcHandlers() {
  // 任務相關
  ipcMain.handle('db:tasks:getAll', () => TaskDB.getAll())
  ipcMain.handle('db:tasks:getById', (_, id: number) => TaskDB.getById(id))
  ipcMain.handle('db:tasks:getByCategory', (_, category: string) => TaskDB.getByCategory(category))
  ipcMain.handle('db:tasks:create', (_, task: any) => TaskDB.create(task))
  ipcMain.handle('db:tasks:update', (_, id: number, updates: any) => TaskDB.update(id, updates))
  ipcMain.handle('db:tasks:delete', (_, id: number) => TaskDB.delete(id))
  ipcMain.handle('db:tasks:toggleComplete', (_, id: number) => TaskDB.toggleComplete(id))

  // 上下班記錄相關
  ipcMain.handle('db:workRecords:getAll', () => WorkRecordDB.getAll())
  ipcMain.handle('db:workRecords:getByDate', (_, date: string) => WorkRecordDB.getByDate(date))
  ipcMain.handle('db:workRecords:getByDateRange', (_, startDate: string, endDate: string) =>
    WorkRecordDB.getByDateRange(startDate, endDate))
  ipcMain.handle('db:workRecords:create', (_, record: any) => WorkRecordDB.create(record))
  ipcMain.handle('db:workRecords:update', (_, date: string, updates: any) => WorkRecordDB.update(date, updates))
  ipcMain.handle('db:workRecords:delete', (_, id: number) => WorkRecordDB.delete(id))

  // 設定相關
  ipcMain.handle('db:settings:get', (_, key: string) => SettingDB.get(key))
  ipcMain.handle('db:settings:set', (_, key: string, value: string) => SettingDB.set(key, value))
  ipcMain.handle('db:settings:delete', (_, key: string) => SettingDB.delete(key))

  // 提醒記錄相關
  ipcMain.handle('db:reminders:getRecent', (_, limit?: number) => ReminderDB.getRecent(limit))
  ipcMain.handle('db:reminders:create', (_, reminder: any) => ReminderDB.create(reminder))
  ipcMain.handle('db:reminders:dismiss', (_, id: number) => ReminderDB.dismiss(id))
  ipcMain.handle('db:reminders:clearOld', (_, daysAgo?: number) => ReminderDB.clearOld(daysAgo))

  // 護眼服務相關
  ipcMain.handle('eyecare:getState', () => eyeCareService.getState())
  ipcMain.handle('eyecare:setConfig', (_, config: any) => {
    eyeCareService.setConfig(config)
    return eyeCareService.getState()
  })
  ipcMain.handle('eyecare:start', () => {
    eyeCareService.start()
    return eyeCareService.getState()
  })
  ipcMain.handle('eyecare:stop', () => {
    eyeCareService.stop()
    return eyeCareService.getState()
  })
  ipcMain.handle('eyecare:pause', () => {
    eyeCareService.pause()
    return eyeCareService.getState()
  })
  ipcMain.handle('eyecare:resume', () => {
    eyeCareService.resume()
    return eyeCareService.getState()
  })
  ipcMain.handle('eyecare:postpone', (_, minutes: number) => {
    eyeCareService.postpone(minutes)
    return eyeCareService.getState()
  })
  ipcMain.handle('eyecare:restart', () => {
    eyeCareService.restart()
    return eyeCareService.getState()
  })

  // 上下班服務相關
  ipcMain.handle('worktime:getState', () => workTimeService.getState())
  ipcMain.handle('worktime:clockIn', async () => {
    return await workTimeService.clockIn()
  })
  ipcMain.handle('worktime:clockOut', async () => {
    return await workTimeService.clockOut()
  })

  // 錄音相關
  ipcMain.handle('recording:getAll', () => recordingService.getAllRecordings())
  ipcMain.handle('recording:getById', (_, id: number) => recordingService.getRecording(id))
  ipcMain.handle('recording:getFilePath', (_, format: string) => recordingService.generateFilePath(format))
  ipcMain.handle('recording:writeFile', async (_, filePath: string, data: Uint8Array | Buffer) => {
    // 寫入錄音文件
    const fs = require('fs')
    try {
      // Uint8Array 可以直接寫入
      fs.writeFileSync(filePath, Buffer.from(data))
      return { success: true }
    } catch (error) {
      console.error('Write file error:', error)
      throw error
    }
  })
  ipcMain.handle('recording:save', async (_, metadata: any, filePath: string) => {
    return await recordingService.saveRecording(metadata, filePath)
  })
  ipcMain.handle('recording:delete', async (_, id: number) => {
    return await recordingService.deleteRecording(id)
  })
  ipcMain.handle('recording:update', (_, id: number, updates: any) => {
    return recordingService.updateRecording(id, updates)
  })

  // 轉錄相關
  ipcMain.handle('transcription:get', (_, recordingId: number) => {
    return recordingService.getTranscription(recordingId)
  })
  ipcMain.handle('transcription:save', async (_, recordingId: number, content: string, language: string) => {
    return await recordingService.saveTranscription(recordingId, content, language)
  })
  ipcMain.handle('transcription:whisper', async (_, filePath: string, apiKey: string) => {
    return await recordingService.transcribeWithWhisper(filePath, apiKey)
  })
}
