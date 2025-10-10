// 任務類型
export type TaskCategory = 'daily' | 'weekly' | 'monthly' | 'temporary'

export interface Task {
  id: number
  title: string
  description: string | null
  category: TaskCategory
  priority: number
  is_completed: number // SQLite 使用 0/1 表示 boolean
  due_date: string | null // ISO 8601 格式
  created_at: string
  updated_at: string
}

export interface CreateTaskInput {
  title: string
  description?: string
  category: TaskCategory
  priority?: number
  due_date?: string
}

export interface UpdateTaskInput {
  title?: string
  description?: string
  category?: TaskCategory
  priority?: number
  is_completed?: boolean
  due_date?: string
}

// 上下班記錄
export interface WorkRecord {
  id: number
  date: string // YYYY-MM-DD
  clock_in_time: string // HH:mm:ss
  clock_out_time: string | null
  work_hours: number | null
  created_at: string
}

export interface CreateWorkRecordInput {
  date: string
  clock_in_time: string
}

export interface UpdateWorkRecordInput {
  clock_out_time?: string
  work_hours?: number
}

// 設定
export interface Setting {
  key: string
  value: string
  updated_at: string
}

// 提醒記錄
export interface Reminder {
  id: number
  type: 'eyecare' | 'task' | 'worktime'
  title: string
  message: string
  triggered_at: string
  dismissed_at: string | null
}

// 未來擴展：錄音
export interface Recording {
  id: number
  title: string
  file_path: string
  duration: number // 秒
  size: number // bytes
  format: string // 'wav' | 'mp3' | 'm4a'
  created_at: string
  tags: string | null // JSON array
}

// 未來擴展：轉錄
export interface Transcription {
  id: number
  recording_id: number
  content: string
  language: string
  created_at: string
  updated_at: string
}
