// 資料庫服務 - 在 renderer process 中使用

import type { Task, CreateTaskInput, UpdateTaskInput, WorkRecord, CreateWorkRecordInput, UpdateWorkRecordInput } from '../types/database'

// 任務服務
export const taskService = {
  async getAll(): Promise<Task[]> {
    return window.electronAPI.tasks.getAll()
  },

  async getById(id: number): Promise<Task | null> {
    return window.electronAPI.tasks.getById(id)
  },

  async getByCategory(category: string): Promise<Task[]> {
    return window.electronAPI.tasks.getByCategory(category)
  },

  async create(task: CreateTaskInput): Promise<any> {
    return window.electronAPI.tasks.create(task)
  },

  async update(id: number, updates: UpdateTaskInput): Promise<any> {
    return window.electronAPI.tasks.update(id, updates)
  },

  async delete(id: number): Promise<any> {
    return window.electronAPI.tasks.delete(id)
  },

  async toggleComplete(id: number): Promise<any> {
    return window.electronAPI.tasks.toggleComplete(id)
  }
}

// 上下班記錄服務
export const workRecordService = {
  async getAll(): Promise<WorkRecord[]> {
    return window.electronAPI.workRecords.getAll()
  },

  async getByDate(date: string): Promise<WorkRecord | null> {
    return window.electronAPI.workRecords.getByDate(date)
  },

  async getByDateRange(startDate: string, endDate: string): Promise<WorkRecord[]> {
    return window.electronAPI.workRecords.getByDateRange(startDate, endDate)
  },

  async create(record: CreateWorkRecordInput): Promise<any> {
    return window.electronAPI.workRecords.create(record)
  },

  async update(date: string, updates: UpdateWorkRecordInput): Promise<any> {
    return window.electronAPI.workRecords.update(date, updates)
  },

  async delete(id: number): Promise<any> {
    return window.electronAPI.workRecords.delete(id)
  }
}

// 設定服務
export const settingService = {
  async get(key: string): Promise<string | null> {
    return window.electronAPI.settings.get(key)
  },

  async set(key: string, value: string): Promise<any> {
    return window.electronAPI.settings.set(key, value)
  },

  async delete(key: string): Promise<any> {
    return window.electronAPI.settings.delete(key)
  }
}

// 提醒記錄服務
export const reminderService = {
  async getRecent(limit?: number): Promise<any[]> {
    return window.electronAPI.reminders.getRecent(limit)
  },

  async create(reminder: { type: string; title: string; message: string }): Promise<any> {
    return window.electronAPI.reminders.create(reminder)
  },

  async dismiss(id: number): Promise<any> {
    return window.electronAPI.reminders.dismiss(id)
  },

  async clearOld(daysAgo?: number): Promise<any> {
    return window.electronAPI.reminders.clearOld(daysAgo)
  }
}
