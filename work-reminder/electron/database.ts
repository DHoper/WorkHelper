import Database from 'better-sqlite3'
import { app } from 'electron'
import path from 'path'
import fs from 'fs'
import { log } from './logger'

let db: Database.Database | null = null

// 取得資料庫路徑
export function getDatabasePath(): string {
  const userDataPath = app.getPath('userData')
  const dbDir = path.join(userDataPath, 'database')

  // 確保目錄存在
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true })
  }

  return path.join(dbDir, 'work-reminder.db')
}

// 初始化資料庫
export function initDatabase(): Database.Database {
  if (db) return db

  const dbPath = getDatabasePath()

  try {
    db = new Database(dbPath)

    // 啟用 WAL 模式以提升性能（重要！）
    db.pragma('journal_mode = WAL')

    // 啟用外鍵約束
    db.pragma('foreign_keys = ON')

    // 建立表格
    createTables()

    log.info('Database initialized', { path: dbPath })
    return db
  } catch (error) {
    log.error('Database initialization failed', error)
    throw error
  }
}

// 建立所有表格
function createTables() {
  if (!db) return

  // 任務表
  db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      category TEXT CHECK(category IN ('daily', 'weekly', 'monthly', 'temporary')) NOT NULL,
      priority INTEGER DEFAULT 0,
      is_completed INTEGER DEFAULT 0,
      due_date TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_tasks_category ON tasks(category);
    CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at);
    CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks(is_completed);
  `)

  // 上下班記錄表
  db.exec(`
    CREATE TABLE IF NOT EXISTS work_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      clock_in_time TEXT NOT NULL,
      clock_out_time TEXT,
      work_hours REAL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(date)
    );

    CREATE INDEX IF NOT EXISTS idx_work_records_date ON work_records(date);
  `)

  // 設定表
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // 提醒記錄表
  db.exec(`
    CREATE TABLE IF NOT EXISTS reminders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT CHECK(type IN ('eyecare', 'task', 'worktime')) NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      triggered_at TEXT DEFAULT CURRENT_TIMESTAMP,
      dismissed_at TEXT
    )
  `)

  // 未來擴展：錄音表
  db.exec(`
    CREATE TABLE IF NOT EXISTS recordings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      file_path TEXT NOT NULL,
      duration INTEGER NOT NULL,
      size INTEGER NOT NULL,
      format TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      tags TEXT
    )
  `)

  // 未來擴展：轉錄表
  db.exec(`
    CREATE TABLE IF NOT EXISTS transcriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      recording_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      language TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (recording_id) REFERENCES recordings(id) ON DELETE CASCADE
    )
  `)

  console.log('Database tables created')
}

// 取得資料庫實例
export function getDatabase(): Database.Database {
  if (!db) {
    return initDatabase()
  }
  return db
}

// 關閉資料庫
export function closeDatabase() {
  if (db) {
    db.close()
    db = null
    console.log('Database closed')
  }
}

// 任務相關操作
export const TaskDB = {
  // 取得所有任務
  getAll: () => {
    return getDatabase().prepare('SELECT * FROM tasks ORDER BY created_at DESC').all()
  },

  // 根據 ID 取得任務
  getById: (id: number) => {
    return getDatabase().prepare('SELECT * FROM tasks WHERE id = ?').get(id)
  },

  // 根據分類取得任務
  getByCategory: (category: string) => {
    return getDatabase().prepare('SELECT * FROM tasks WHERE category = ? ORDER BY created_at DESC').all(category)
  },

  // 新增任務
  create: (task: any) => {
    const stmt = getDatabase().prepare(`
      INSERT INTO tasks (title, description, category, priority, due_date)
      VALUES (@title, @description, @category, @priority, @due_date)
    `)
    return stmt.run(task)
  },

  // 更新任務
  update: (id: number, updates: any) => {
    try {
      // 白名單驗證：只允許特定欄位更新
      const allowedFields = ['title', 'description', 'category', 'priority', 'is_completed', 'due_date']
      const sanitizedUpdates: any = {}

      for (const key of Object.keys(updates)) {
        if (allowedFields.includes(key)) {
          sanitizedUpdates[key] = updates[key]
        } else {
          log.warn('Attempted to update disallowed field', { field: key })
        }
      }

      const fields = Object.keys(sanitizedUpdates).map(key => `${key} = @${key}`).join(', ')
      if (!fields) {
        log.warn('No valid fields to update')
        return { changes: 0 }
      }

      const stmt = getDatabase().prepare(`
        UPDATE tasks SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = @id
      `)
      return stmt.run({ ...sanitizedUpdates, id })
    } catch (error) {
      log.error('Task update failed', { id, error })
      throw error
    }
  },

  // 刪除任務
  delete: (id: number) => {
    return getDatabase().prepare('DELETE FROM tasks WHERE id = ?').run(id)
  },

  // 切換完成狀態
  toggleComplete: (id: number) => {
    return getDatabase().prepare(`
      UPDATE tasks SET is_completed = NOT is_completed, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(id)
  }
}

// 上下班記錄相關操作
export const WorkRecordDB = {
  // 取得所有記錄
  getAll: () => {
    return getDatabase().prepare('SELECT * FROM work_records ORDER BY date DESC').all()
  },

  // 根據日期取得記錄
  getByDate: (date: string) => {
    return getDatabase().prepare('SELECT * FROM work_records WHERE date = ?').get(date)
  },

  // 取得日期範圍內的記錄
  getByDateRange: (startDate: string, endDate: string) => {
    return getDatabase().prepare('SELECT * FROM work_records WHERE date BETWEEN ? AND ? ORDER BY date DESC').all(startDate, endDate)
  },

  // 新增記錄
  create: (record: any) => {
    const stmt = getDatabase().prepare(`
      INSERT INTO work_records (date, clock_in_time)
      VALUES (@date, @clock_in_time)
    `)
    return stmt.run(record)
  },

  // 更新記錄（下班打卡）
  update: (date: string, updates: any) => {
    const stmt = getDatabase().prepare(`
      UPDATE work_records SET clock_out_time = @clock_out_time, work_hours = @work_hours WHERE date = @date
    `)
    return stmt.run({ ...updates, date })
  },

  // 刪除記錄
  delete: (id: number) => {
    return getDatabase().prepare('DELETE FROM work_records WHERE id = ?').run(id)
  }
}

// 設定相關操作
export const SettingDB = {
  // 取得設定值
  get: (key: string) => {
    const result = getDatabase().prepare('SELECT value FROM settings WHERE key = ?').get(key) as any
    return result?.value || null
  },

  // 設定值
  set: (key: string, value: string) => {
    const stmt = getDatabase().prepare(`
      INSERT INTO settings (key, value) VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = CURRENT_TIMESTAMP
    `)
    return stmt.run(key, value, value)
  },

  // 刪除設定
  delete: (key: string) => {
    return getDatabase().prepare('DELETE FROM settings WHERE key = ?').run(key)
  }
}

// 提醒記錄相關操作
export const ReminderDB = {
  // 取得最近的提醒
  getRecent: (limit: number = 50) => {
    return getDatabase().prepare('SELECT * FROM reminders ORDER BY triggered_at DESC LIMIT ?').all(limit)
  },

  // 新增提醒記錄
  create: (reminder: any) => {
    const stmt = getDatabase().prepare(`
      INSERT INTO reminders (type, title, message)
      VALUES (@type, @title, @message)
    `)
    return stmt.run(reminder)
  },

  // 標記為已讀
  dismiss: (id: number) => {
    return getDatabase().prepare(`
      UPDATE reminders SET dismissed_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(id)
  },

  // 清除舊記錄
  clearOld: (daysAgo: number = 30) => {
    return getDatabase().prepare(`
      DELETE FROM reminders WHERE triggered_at < datetime('now', '-' || ? || ' days')
    `).run(daysAgo)
  }
}

// 錄音相關操作
export const RecordingDB = {
  // 取得所有錄音
  getAll: () => {
    return getDatabase().prepare('SELECT * FROM recordings ORDER BY created_at DESC').all()
  },

  // 根據 ID 取得錄音
  getById: (id: number) => {
    return getDatabase().prepare('SELECT * FROM recordings WHERE id = ?').get(id)
  },

  // 新增錄音記錄
  create: (recording: any) => {
    const stmt = getDatabase().prepare(`
      INSERT INTO recordings (title, file_path, duration, size, format, tags)
      VALUES (@title, @file_path, @duration, @size, @format, @tags)
    `)
    return stmt.run(recording)
  },

  // 更新錄音資訊
  update: (id: number, updates: any) => {
    try {
      // 白名單驗證：只允許特定欄位更新
      const allowedFields = ['title', 'tags']
      const sanitizedUpdates: any = {}

      for (const key of Object.keys(updates)) {
        if (allowedFields.includes(key)) {
          sanitizedUpdates[key] = updates[key]
        } else {
          log.warn('Attempted to update disallowed recording field', { field: key })
        }
      }

      const fields = Object.keys(sanitizedUpdates).map(key => `${key} = @${key}`).join(', ')
      if (!fields) {
        log.warn('No valid fields to update for recording')
        return { changes: 0 }
      }

      const stmt = getDatabase().prepare(`
        UPDATE recordings SET ${fields} WHERE id = @id
      `)
      return stmt.run({ ...sanitizedUpdates, id })
    } catch (error) {
      log.error('Recording update failed', { id, error })
      throw error
    }
  },

  // 刪除錄音
  delete: (id: number) => {
    return getDatabase().prepare('DELETE FROM recordings WHERE id = ?').run(id)
  }
}

// 轉錄相關操作
export const TranscriptionDB = {
  // 根據錄音 ID 取得轉錄
  getByRecordingId: (recordingId: number) => {
    return getDatabase().prepare('SELECT * FROM transcriptions WHERE recording_id = ?').get(recordingId)
  },

  // 新增轉錄
  create: (transcription: any) => {
    const stmt = getDatabase().prepare(`
      INSERT INTO transcriptions (recording_id, content, language)
      VALUES (@recording_id, @content, @language)
    `)
    return stmt.run(transcription)
  },

  // 更新轉錄內容
  update: (id: number, content: string) => {
    return getDatabase().prepare(`
      UPDATE transcriptions SET content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(content, id)
  },

  // 刪除轉錄（透過錄音 ID）
  deleteByRecordingId: (recordingId: number) => {
    return getDatabase().prepare('DELETE FROM transcriptions WHERE recording_id = ?').run(recordingId)
  }
}
