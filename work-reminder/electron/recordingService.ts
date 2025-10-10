import { app } from 'electron'
import path from 'path'
import fs from 'fs'
import { RecordingDB, TranscriptionDB } from './database'

interface RecordingMetadata {
  title: string
  duration: number
  size: number
  format: string
  tags?: string
}

class RecordingService {
  private recordingsDir: string

  constructor() {
    // 設置錄音文件存儲目錄
    const userDataPath = app.getPath('userData')
    this.recordingsDir = path.join(userDataPath, 'recordings')
    this.ensureRecordingsDir()
  }

  // 確保錄音目錄存在
  private ensureRecordingsDir() {
    if (!fs.existsSync(this.recordingsDir)) {
      fs.mkdirSync(this.recordingsDir, { recursive: true })
    }
  }

  // 取得錄音目錄路徑
  getRecordingsDir(): string {
    return this.recordingsDir
  }

  // 生成錄音文件路徑
  generateFilePath(format: string = 'webm'): string {
    const timestamp = Date.now()
    const filename = `recording-${timestamp}.${format}`
    return path.join(this.recordingsDir, filename)
  }

  // 保存錄音記錄到資料庫
  async saveRecording(metadata: RecordingMetadata, filePath: string) {
    try {
      const result = RecordingDB.create({
        title: metadata.title,
        file_path: filePath,
        duration: metadata.duration,
        size: metadata.size,
        format: metadata.format,
        tags: metadata.tags || null
      })
      return result.lastInsertRowid as number
    } catch (error) {
      console.error('Save recording error:', error)
      throw error
    }
  }

  // 取得所有錄音
  getAllRecordings() {
    return RecordingDB.getAll()
  }

  // 取得單個錄音
  getRecording(id: number) {
    return RecordingDB.getById(id)
  }

  // 刪除錄音（包括文件和資料庫記錄）
  async deleteRecording(id: number) {
    try {
      const recording = RecordingDB.getById(id) as any
      if (!recording) {
        throw new Error('錄音不存在')
      }

      // 刪除文件
      if (fs.existsSync(recording.file_path)) {
        fs.unlinkSync(recording.file_path)
      }

      // 刪除轉錄
      TranscriptionDB.deleteByRecordingId(id)

      // 刪除資料庫記錄
      RecordingDB.delete(id)

      return { success: true }
    } catch (error) {
      console.error('Delete recording error:', error)
      throw error
    }
  }

  // 更新錄音資訊
  updateRecording(id: number, updates: Partial<RecordingMetadata>) {
    return RecordingDB.update(id, updates)
  }

  // 保存轉錄文本
  async saveTranscription(recordingId: number, content: string, language: string = 'zh') {
    try {
      // 檢查是否已存在轉錄
      const existing = TranscriptionDB.getByRecordingId(recordingId)

      if (existing) {
        // 更新現有轉錄
        return TranscriptionDB.update((existing as any).id, content)
      } else {
        // 創建新轉錄
        return TranscriptionDB.create({
          recording_id: recordingId,
          content,
          language
        })
      }
    } catch (error) {
      console.error('Save transcription error:', error)
      throw error
    }
  }

  // 取得轉錄文本
  getTranscription(recordingId: number) {
    return TranscriptionDB.getByRecordingId(recordingId)
  }

  // 調用 Whisper API 進行轉錄（預留功能）
  async transcribeWithWhisper(filePath: string, apiKey?: string): Promise<string> {
    // 檢查是否有 API Key
    if (!apiKey) {
      throw new Error('未設置 Whisper API Key')
    }

    // TODO: 實現 Whisper API 調用
    // 這裡暫時返回占位文本
    return '此功能需要配置 Whisper API Key\n請在設置中添加您的 OpenAI API Key'
  }

  // 檢查文件是否存在
  fileExists(filePath: string): boolean {
    return fs.existsSync(filePath)
  }

  // 取得文件大小
  getFileSize(filePath: string): number {
    try {
      const stats = fs.statSync(filePath)
      return stats.size
    } catch (error) {
      return 0
    }
  }
}

export const recordingService = new RecordingService()
