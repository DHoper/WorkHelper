// Electron API 類型定義

import { WorkTimeState } from './workTime'
import { Task, TaskInput } from './task'
import { WorkRecord } from './workTime'
import { Recording, RecordingMetadata } from './recording'
import { EyeCareState, EyeCareConfig, Reminder } from './eyeCare'
import { CalendarEvent } from './calendar'

export interface ElectronAPI {
  platform: string

  window: {
    minimize: () => Promise<void>
    close: () => Promise<void>
  }

  tasks: {
    getAll: () => Promise<Task[]>
    getById: (id: number) => Promise<Task>
    getByCategory: (category: string) => Promise<Task[]>
    create: (task: TaskInput) => Promise<Task>
    update: (id: number, updates: Partial<Task>) => Promise<Task>
    delete: (id: number) => Promise<void>
    toggleComplete: (id: number) => Promise<Task>
  }

  workRecords: {
    getAll: () => Promise<WorkRecord[]>
    getByDate: (date: string) => Promise<WorkRecord>
    getByDateRange: (startDate: string, endDate: string) => Promise<WorkRecord[]>
    create: (record: Partial<WorkRecord>) => Promise<WorkRecord>
    update: (date: string, updates: Partial<WorkRecord>) => Promise<WorkRecord>
    delete: (id: number) => Promise<void>
  }

  settings: {
    get: (key: string) => Promise<string | null>
    set: (key: string, value: string) => Promise<void>
    delete: (key: string) => Promise<void>
  }

  reminders: {
    getRecent: (limit?: number) => Promise<Reminder[]>
    create: (reminder: Partial<Reminder>) => Promise<Reminder>
    dismiss: (id: number) => Promise<void>
    clearOld: (daysAgo?: number) => Promise<void>
  }

  eyeCare: {
    getState: () => Promise<EyeCareState>
    setConfig: (config: Partial<EyeCareConfig>) => Promise<EyeCareState>
    start: () => Promise<EyeCareState>
    stop: () => Promise<EyeCareState>
    pause: () => Promise<EyeCareState>
    resume: () => Promise<EyeCareState>
    postpone: (minutes: number) => Promise<EyeCareState>
    restart: () => Promise<EyeCareState>
    onTick: (callback: (state: EyeCareState) => void) => () => void
    onComplete: (callback: () => void) => () => void
  }

  workTime: {
    getState: () => Promise<WorkTimeState>
    clockIn: () => Promise<WorkTimeState>
    clockOut: () => Promise<WorkTimeState>
    onStateUpdate: (callback: (state: WorkTimeState) => void) => () => void
    onOffTimeReached: (callback: () => void) => () => void
  }

  recording: {
    getAll: () => Promise<Recording[]>
    getById: (id: number) => Promise<Recording>
    getFilePath: (format: string) => Promise<string>
    writeFile: (filePath: string, buffer: Buffer) => Promise<void>
    save: (metadata: RecordingMetadata, filePath: string) => Promise<number>
    delete: (id: number) => Promise<void>
    update: (id: number, updates: Partial<Recording>) => Promise<void>
    readFile: (filePath: string) => Promise<Buffer>
  }

  transcription: {
    get: (recordingId: number) => Promise<any>
    save: (recordingId: number, content: string, language: string) => Promise<any>
    whisper: (filePath: string, apiKey: string) => Promise<string>
    generateSummary: (text: string, apiKey: string) => Promise<string>
    processLongRecording: (filePath: string, apiKey: string) => Promise<{ transcription: string; summary: string }>
  }

  calendar: {
    initAuth: (clientId: string, clientSecret: string) => Promise<void>
    getAuthUrl: () => Promise<string>
    authenticateWithCode: (code: string) => Promise<void>
    isAuthenticated: () => Promise<boolean>
    getCalendarList: () => Promise<any[]>
    getUpcomingEvents: (hoursAhead: number) => Promise<CalendarEvent[]>
    setKeywords: (keywords: string[]) => Promise<void>
    getKeywords: () => Promise<string[]>
    setLookAheadMinutes: (minutes: number) => Promise<void>
    startMonitoring: () => Promise<void>
    stopMonitoring: () => Promise<void>
    clearAuth: () => Promise<void>
    onEventReminder: (callback: (data: { event: CalendarEvent; minutesUntil: number }) => void) => () => void
  }
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}

export {}
