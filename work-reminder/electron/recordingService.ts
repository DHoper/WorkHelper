import { app } from 'electron'
import path from 'path'
import fs from 'fs'
import FormData from 'form-data'
import { RecordingDB, TranscriptionDB } from './database'
import { log } from './logger'

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
      log.info('Recording saved', { id: result.lastInsertRowid, title: metadata.title })
      return result.lastInsertRowid as number
    } catch (error) {
      log.error('Save recording error', { error, filePath })
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
        log.warn('Attempted to delete non-existent recording', { id })
        throw new Error('錄音不存在')
      }

      // 刪除文件
      if (fs.existsSync(recording.file_path)) {
        fs.unlinkSync(recording.file_path)
        log.info('Recording file deleted', { path: recording.file_path })
      }

      // 刪除轉錄
      TranscriptionDB.deleteByRecordingId(id)

      // 刪除資料庫記錄
      RecordingDB.delete(id)

      log.info('Recording deleted successfully', { id, title: recording.title })
      return { success: true }
    } catch (error) {
      log.error('Delete recording error', { error, id })
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

  // 調用 Whisper API 進行轉錄
  async transcribeWithWhisper(filePath: string, apiKey: string): Promise<string> {
    // 檢查是否有 API Key
    if (!apiKey || apiKey.trim() === '') {
      throw new Error('未設置 Whisper API Key')
    }

    // 檢查文件是否存在
    if (!fs.existsSync(filePath)) {
      throw new Error('錄音文件不存在')
    }

    try {
      log.info('Starting Whisper transcription', { filePath })

      // 創建 FormData
      const formData = new FormData()
      formData.append('file', fs.createReadStream(filePath))
      formData.append('model', 'whisper-1')
      formData.append('language', 'zh') // 設定為中文
      formData.append('response_format', 'text')

      // 調用 OpenAI Whisper API
      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          ...formData.getHeaders()
        },
        body: formData as any
      })

      if (!response.ok) {
        const errorText = await response.text()
        log.error('Whisper API error', { status: response.status, error: errorText })

        if (response.status === 401) {
          throw new Error('API Key 無效，請檢查您的 OpenAI API Key')
        } else if (response.status === 429) {
          throw new Error('API 請求次數超限，請稍後再試')
        } else {
          throw new Error(`Whisper API 錯誤: ${response.status} - ${errorText}`)
        }
      }

      const transcription = await response.text()
      log.info('Whisper transcription completed', {
        filePath,
        transcriptionLength: transcription.length
      })

      return transcription
    } catch (error: any) {
      log.error('Whisper transcription failed', { error: error.message, filePath })
      throw error
    }
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
