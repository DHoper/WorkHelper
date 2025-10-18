/**
 * 多開防護 (Single Instance Lock)
 * 確保只有一個應用實例運行
 */

import { app, BrowserWindow } from 'electron'
import { log } from './logger'

export function setupSingleInstance(mainWindow: BrowserWindow): boolean {
  const gotTheLock = app.requestSingleInstanceLock()

  if (!gotTheLock) {
    log.info('Another instance is already running, quitting...')
    return false // 返回 false 表示應該退出
  }

  // 當嘗試啟動第二個實例時
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    log.info('Second instance attempted', { commandLine, workingDirectory })

    // 聚焦現有窗口
    if (mainWindow) {
      if (mainWindow.isMinimized()) {
        mainWindow.restore()
      }
      if (!mainWindow.isVisible()) {
        mainWindow.show()
      }
      mainWindow.focus()
    }
  })

  log.info('Single instance lock acquired')
  return true // 返回 true 表示可以繼續
}
