/**
 * 全局快捷鍵管理
 * 基於 Electron Keyboard Shortcuts 最佳實踐
 */

import { BrowserWindow, globalShortcut } from 'electron'
import { log } from './logger'

export function registerShortcuts(mainWindow: BrowserWindow) {
  try {
    // 顯示/隱藏窗口 (全局快捷鍵)
    globalShortcut.register('CommandOrControl+Shift+W', () => {
      log.debug('Global shortcut: toggle window')
      if (mainWindow.isVisible()) {
        mainWindow.hide()
      } else {
        mainWindow.show()
        mainWindow.focus()
      }
    })

    // 新增任務
    globalShortcut.register('CommandOrControl+N', () => {
      log.debug('Global shortcut: new task')
      mainWindow.show()
      mainWindow.focus()
      mainWindow.webContents.send('shortcut:newTask')
    })

    // 打開設置
    globalShortcut.register('CommandOrControl+,', () => {
      log.debug('Global shortcut: open settings')
      mainWindow.show()
      mainWindow.focus()
      mainWindow.webContents.send('navigate', '/settings')
    })

    log.info('Global shortcuts registered successfully')
  } catch (error) {
    log.error('Failed to register shortcuts', error)
  }
}

export function unregisterShortcuts() {
  globalShortcut.unregisterAll()
  log.info('All shortcuts unregistered')
}

// 應用內快捷鍵（在渲染進程中使用）
export const APP_SHORTCUTS = {
  NEW_TASK: 'CommandOrControl+N',
  SETTINGS: 'CommandOrControl+,',
  CLOSE_WINDOW: 'CommandOrControl+W',
  MINIMIZE: 'CommandOrControl+M',
  REFRESH: 'F5',
  TOGGLE_THEME: 'CommandOrControl+Shift+T',
  QUIT: 'CommandOrControl+Q'
}
