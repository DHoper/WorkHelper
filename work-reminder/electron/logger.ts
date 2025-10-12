import log from 'electron-log'
import { app } from 'electron'
import path from 'path'

// 配置日誌系統
function setupLogger() {
  const isDevelopment = !app.isPackaged

  // 設置日誌文件路徑
  log.transports.file.resolvePathFn = () =>
    path.join(app.getPath('userData'), 'logs', 'main.log')

  // 生產環境配置
  if (!isDevelopment) {
    log.transports.console.level = 'warn'
    log.transports.file.level = 'info'
    log.transports.file.maxSize = 5 * 1024 * 1024 // 5MB
  } else {
    // 開發環境配置
    log.transports.console.level = 'debug'
    log.transports.file.level = 'debug'
  }

  // 捕獲未處理的錯誤
  log.errorHandler.startCatching({
    showDialog: isDevelopment,
    onError: (error, versions, submitIssue) => {
      log.error('Unhandled error:', error)
      log.error('Versions:', versions)
    }
  })

  log.info('Logger initialized', {
    environment: isDevelopment ? 'development' : 'production',
    logPath: log.transports.file.getFile().path
  })
}

export { log, setupLogger }
