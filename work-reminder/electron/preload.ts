import { contextBridge, ipcRenderer } from 'electron'

// 暴露安全的 API 給 renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,

  // 視窗控制 API
  window: {
    minimize: () => ipcRenderer.invoke('window:minimize'),
    close: () => ipcRenderer.invoke('window:close')
  },

  // 資料庫 API - 任務
  tasks: {
    getAll: () => ipcRenderer.invoke('db:tasks:getAll'),
    getById: (id: number) => ipcRenderer.invoke('db:tasks:getById', id),
    getByCategory: (category: string) => ipcRenderer.invoke('db:tasks:getByCategory', category),
    create: (task: any) => ipcRenderer.invoke('db:tasks:create', task),
    update: (id: number, updates: any) => ipcRenderer.invoke('db:tasks:update', id, updates),
    delete: (id: number) => ipcRenderer.invoke('db:tasks:delete', id),
    toggleComplete: (id: number) => ipcRenderer.invoke('db:tasks:toggleComplete', id)
  },

  // 資料庫 API - 上下班記錄
  workRecords: {
    getAll: () => ipcRenderer.invoke('db:workRecords:getAll'),
    getByDate: (date: string) => ipcRenderer.invoke('db:workRecords:getByDate', date),
    getByDateRange: (startDate: string, endDate: string) =>
      ipcRenderer.invoke('db:workRecords:getByDateRange', startDate, endDate),
    create: (record: any) => ipcRenderer.invoke('db:workRecords:create', record),
    update: (date: string, updates: any) => ipcRenderer.invoke('db:workRecords:update', date, updates),
    delete: (id: number) => ipcRenderer.invoke('db:workRecords:delete', id)
  },

  // 資料庫 API - 設定
  settings: {
    get: (key: string) => ipcRenderer.invoke('db:settings:get', key),
    set: (key: string, value: string) => ipcRenderer.invoke('db:settings:set', key, value),
    delete: (key: string) => ipcRenderer.invoke('db:settings:delete', key)
  },

  // 資料庫 API - 提醒記錄
  reminders: {
    getRecent: (limit?: number) => ipcRenderer.invoke('db:reminders:getRecent', limit),
    create: (reminder: any) => ipcRenderer.invoke('db:reminders:create', reminder),
    dismiss: (id: number) => ipcRenderer.invoke('db:reminders:dismiss', id),
    clearOld: (daysAgo?: number) => ipcRenderer.invoke('db:reminders:clearOld', daysAgo)
  },

  // 護眼服務 API
  eyeCare: {
    getState: () => ipcRenderer.invoke('eyecare:getState'),
    setConfig: (config: any) => ipcRenderer.invoke('eyecare:setConfig', config),
    start: () => ipcRenderer.invoke('eyecare:start'),
    stop: () => ipcRenderer.invoke('eyecare:stop'),
    pause: () => ipcRenderer.invoke('eyecare:pause'),
    resume: () => ipcRenderer.invoke('eyecare:resume'),
    postpone: (minutes: number) => ipcRenderer.invoke('eyecare:postpone', minutes),
    restart: () => ipcRenderer.invoke('eyecare:restart'),
    // ✅ 正確：過濾事件物件，只傳遞 value
    onTick: (callback: (state: any) => void) => {
      ipcRenderer.on('eyecare:tick', (_event, state) => callback(state))
    },
    // ✅ 正確：過濾事件物件
    onComplete: (callback: () => void) => {
      ipcRenderer.on('eyecare:complete', (_event) => callback())
    }
  },

  // 上下班服務 API
  workTime: {
    getState: () => ipcRenderer.invoke('worktime:getState'),
    clockIn: () => ipcRenderer.invoke('worktime:clockIn'),
    clockOut: () => ipcRenderer.invoke('worktime:clockOut'),
    // ✅ 正確：過濾事件物件，只傳遞 value
    onStateUpdate: (callback: (state: any) => void) => {
      ipcRenderer.on('worktime:stateUpdate', (_event, state) => callback(state))
    },
    // ✅ 正確：過濾事件物件
    onOffTimeReached: (callback: () => void) => {
      ipcRenderer.on('worktime:offTimeReached', (_event) => callback())
    }
  },

  // 錄音服務 API
  recording: {
    getAll: () => ipcRenderer.invoke('recording:getAll'),
    getById: (id: number) => ipcRenderer.invoke('recording:getById', id),
    getFilePath: (format: string) => ipcRenderer.invoke('recording:getFilePath', format),
    writeFile: (filePath: string, buffer: Buffer) => ipcRenderer.invoke('recording:writeFile', filePath, buffer),
    save: (metadata: any, filePath: string) => ipcRenderer.invoke('recording:save', metadata, filePath),
    delete: (id: number) => ipcRenderer.invoke('recording:delete', id),
    update: (id: number, updates: any) => ipcRenderer.invoke('recording:update', id, updates),
    readFile: (filePath: string) => ipcRenderer.invoke('recording:readFile', filePath)
  },

  // 轉錄服務 API
  transcription: {
    get: (recordingId: number) => ipcRenderer.invoke('transcription:get', recordingId),
    save: (recordingId: number, content: string, language: string) =>
      ipcRenderer.invoke('transcription:save', recordingId, content, language),
    whisper: (filePath: string, apiKey: string) =>
      ipcRenderer.invoke('transcription:whisper', filePath, apiKey),
    generateSummary: (text: string, apiKey: string) =>
      ipcRenderer.invoke('transcription:generateSummary', text, apiKey),
    processLongRecording: (filePath: string, apiKey: string) =>
      ipcRenderer.invoke('transcription:processLongRecording', filePath, apiKey)
  }
})

// TypeScript 類型定義
export interface ElectronAPI {
  platform: string
  window: {
    minimize: () => Promise<void>
    close: () => Promise<void>
  }
  tasks: {
    getAll: () => Promise<any[]>
    getById: (id: number) => Promise<any>
    getByCategory: (category: string) => Promise<any[]>
    create: (task: any) => Promise<any>
    update: (id: number, updates: any) => Promise<any>
    delete: (id: number) => Promise<any>
    toggleComplete: (id: number) => Promise<any>
  }
  workRecords: {
    getAll: () => Promise<any[]>
    getByDate: (date: string) => Promise<any>
    getByDateRange: (startDate: string, endDate: string) => Promise<any[]>
    create: (record: any) => Promise<any>
    update: (date: string, updates: any) => Promise<any>
    delete: (id: number) => Promise<any>
  }
  settings: {
    get: (key: string) => Promise<string | null>
    set: (key: string, value: string) => Promise<any>
    delete: (key: string) => Promise<any>
  }
  reminders: {
    getRecent: (limit?: number) => Promise<any[]>
    create: (reminder: any) => Promise<any>
    dismiss: (id: number) => Promise<any>
    clearOld: (daysAgo?: number) => Promise<any>
  }
  eyeCare: {
    getState: () => Promise<any>
    setConfig: (config: any) => Promise<any>
    start: () => Promise<any>
    stop: () => Promise<any>
    pause: () => Promise<any>
    resume: () => Promise<any>
    postpone: (minutes: number) => Promise<any>
    restart: () => Promise<any>
    onTick: (callback: (state: any) => void) => void
    onComplete: (callback: () => void) => void
  }
  workTime: {
    getState: () => Promise<any>
    clockIn: () => Promise<any>
    clockOut: () => Promise<any>
    onStateUpdate: (callback: (state: any) => void) => void
    onOffTimeReached: (callback: () => void) => void
  }
  recording: {
    getAll: () => Promise<any[]>
    getById: (id: number) => Promise<any>
    getFilePath: (format: string) => Promise<string>
    writeFile: (filePath: string, buffer: Buffer) => Promise<any>
    save: (metadata: any, filePath: string) => Promise<number>
    delete: (id: number) => Promise<any>
    update: (id: number, updates: any) => Promise<any>
    readFile: (filePath: string) => Promise<Buffer>
  }
  transcription: {
    get: (recordingId: number) => Promise<any>
    save: (recordingId: number, content: string, language: string) => Promise<any>
    whisper: (filePath: string, apiKey: string) => Promise<string>
    generateSummary: (text: string, apiKey: string) => Promise<string>
    processLongRecording: (filePath: string, apiKey: string) => Promise<{ transcription: string; summary: string }>
  }
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
