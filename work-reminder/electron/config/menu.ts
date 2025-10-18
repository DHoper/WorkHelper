/**
 * 應用菜單
 * 基於平台規範的標準菜單
 */

import { Menu, shell, app, BrowserWindow, dialog } from 'electron'
import { log } from '../utils/logger'

export function createAppMenu(mainWindow: BrowserWindow) {
  const isMac = process.platform === 'darwin'

  const template: Electron.MenuItemConstructorOptions[] = [
    // macOS 應用菜單
    ...(isMac ? [{
      label: app.name,
      submenu: [
        {
          label: `關於 ${app.name}`,
          click: () => showAboutDialog()
        },
        { type: 'separator' as const },
        {
          label: '偏好設定...',
          accelerator: 'Cmd+,',
          click: () => {
            mainWindow.webContents.send('navigate', '/settings')
          }
        },
        { type: 'separator' as const },
        { role: 'hide' as const },
        { role: 'hideOthers' as const },
        { role: 'unhide' as const },
        { type: 'separator' as const },
        { role: 'quit' as const }
      ]
    }] : []),

    // 檔案菜單
    {
      label: '檔案',
      submenu: [
        {
          label: '新增任務',
          accelerator: 'CommandOrControl+N',
          click: () => {
            mainWindow.webContents.send('shortcut:newTask')
          }
        },
        { type: 'separator' as const },
        ...(!isMac ? [{
          label: '設定',
          accelerator: 'Ctrl+,',
          click: () => {
            mainWindow.webContents.send('navigate', '/settings')
          }
        },
        { type: 'separator' as const }] : []),
        {
          label: '退出',
          accelerator: isMac ? 'Cmd+Q' : 'Alt+F4',
          click: () => {
            app.quit()
          }
        }
      ]
    },

    // 編輯菜單
    {
      label: '編輯',
      submenu: [
        { role: 'undo' as const, label: '撤銷' },
        { role: 'redo' as const, label: '重做' },
        { type: 'separator' as const },
        { role: 'cut' as const, label: '剪下' },
        { role: 'copy' as const, label: '複製' },
        { role: 'paste' as const, label: '貼上' },
        { role: 'selectAll' as const, label: '全選' }
      ]
    },

    // 視窗菜單
    {
      label: '視窗',
      submenu: [
        { role: 'minimize' as const, label: '最小化' },
        { role: 'zoom' as const, label: '縮放' },
        ...(isMac ? [
          { type: 'separator' as const },
          { role: 'front' as const }
        ] : [
          { role: 'close' as const, label: '關閉' }
        ])
      ]
    },

    // 說明菜單
    {
      label: '說明',
      submenu: [
        {
          label: '鍵盤快捷鍵',
          click: () => {
            showShortcutsDialog()
          }
        },
        { type: 'separator' as const },
        ...(!isMac ? [{
          label: `關於 ${app.name}`,
          click: () => showAboutDialog()
        }] : [])
      ]
    }
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)

  log.info('Application menu created')
}

function showAboutDialog() {
  dialog.showMessageBox({
    type: 'info',
    title: '關於工作助手',
    message: '工作助手',
    detail: `版本: ${app.getVersion()}
平台: ${process.platform}
Electron: ${process.versions.electron}
Chrome: ${process.versions.chrome}
Node: ${process.versions.node}

一個輕便的桌面提醒應用
功能：
• 護眼提醒
• 工作時間追蹤
• 任務管理
• 錄音轉錄`,
    buttons: ['確定']
  })
}

function showShortcutsDialog() {
  const isMac = process.platform === 'darwin'
  const mod = isMac ? 'Cmd' : 'Ctrl'

  dialog.showMessageBox({
    type: 'info',
    title: '鍵盤快捷鍵',
    message: '可用的快捷鍵',
    detail: `全局快捷鍵：
${mod}+Shift+W - 顯示/隱藏窗口
${mod}+N - 新增任務

應用內快捷鍵：
${mod}+, - 打開設定
${mod}+W - 關閉窗口
${mod}+M - 最小化
${mod}+Q - 退出應用
F5 - 重新整理`,
    buttons: ['確定']
  })
}
