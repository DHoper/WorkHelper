// Global type definitions for Electron API

interface WorkTimeState {
  isClockedIn: boolean
  clockInTime: string | null
  clockOutTime: string | null
  estimatedOffTime: string | null
  hasNotified: boolean
}

interface ElectronAPI {
  platform: string
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
    getState: () => Promise<WorkTimeState>
    clockIn: () => Promise<WorkTimeState>
    clockOut: () => Promise<WorkTimeState>
    onStateUpdate: (callback: (state: WorkTimeState) => void) => void
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
  }
  transcription: {
    get: (recordingId: number) => Promise<any>
    save: (recordingId: number, content: string, language: string) => Promise<any>
    whisper: (filePath: string, apiKey: string) => Promise<string>
  }
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}

export {}
