import { app } from 'electron'
import path from 'path'
import fs from 'fs'
import FormData from 'form-data'
import { RecordingDB, TranscriptionDB } from './database'
import { log } from './logger'
import { audioProcessor } from './audioProcessor'

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

  // 調用 Whisper API 進行單個檔案轉錄
  private async transcribeSingleFile(filePath: string, apiKey: string): Promise<string> {
    // 創建 FormData
    const formData = new FormData()
    formData.append('file', fs.createReadStream(filePath))
    formData.append('model', 'whisper-1')
    formData.append('language', 'zh') // 設定為中文
    formData.append('response_format', 'verbose_json') // 使用詳細格式以獲得更多資訊
    formData.append('prompt', '這是一段會議錄音的轉錄。請保持準確性，包含所有說話者的內容。') // 添加提示以提高準確性

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
      } else if (response.status === 413) {
        throw new Error('檔案太大，超過 25MB 限制')
      } else {
        throw new Error(`Whisper API 錯誤: ${response.status} - ${errorText}`)
      }
    }

    const result = await response.json()
    return result.text || result
  }

  // 調用 Whisper API 進行轉錄（支援大檔案）
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
      const fileSize = fs.statSync(filePath).size
      const maxSize = 25 * 1024 * 1024 // 25MB - Whisper API 限制
      const fileSizeMB = fileSize / (1024 * 1024)

      log.info('Starting Whisper transcription', {
        filePath,
        fileSize: `${fileSizeMB.toFixed(2)}MB`,
        requiresProcessing: fileSize > maxSize
      })

      // 如果檔案小於 25MB，直接轉錄
      if (fileSize <= maxSize) {
        const transcription = await this.transcribeSingleFile(filePath, apiKey)
        log.info('Whisper transcription completed', {
          filePath,
          transcriptionLength: transcription.length
        })
        return transcription
      }

      // 大檔案處理
      log.info('Processing large file', { fileSize: `${fileSizeMB.toFixed(2)}MB` })

      const { strategy, files } = await audioProcessor.processLargeAudioFile(filePath)

      if (strategy === 'compress') {
        // 壓縮後的單一檔案
        const transcription = await this.transcribeSingleFile(files[0], apiKey)

        // 清理臨時檔案
        if (files[0] !== filePath) {
          fs.unlinkSync(files[0])
        }

        log.info('Transcription completed after compression', {
          transcriptionLength: transcription.length
        })
        return transcription

      } else {
        // 分割成多個檔案
        log.info('Transcribing split audio segments', { segments: files.length })

        const transcriptions: string[] = []
        for (let i = 0; i < files.length; i++) {
          log.info(`Transcribing segment ${i + 1}/${files.length}`)
          const segmentTranscription = await this.transcribeSingleFile(files[i], apiKey)
          transcriptions.push(segmentTranscription)

          // 清理臨時檔案
          fs.unlinkSync(files[i])
        }

        // 合併所有轉錄結果
        const fullTranscription = audioProcessor.mergeTranscriptions(transcriptions)

        log.info('All segments transcribed and merged', {
          segments: files.length,
          totalLength: fullTranscription.length
        })

        return fullTranscription
      }

    } catch (error: any) {
      log.error('Whisper transcription failed', { error: error.message, filePath })
      // 清理臨時檔案
      audioProcessor.cleanupTempFiles()
      throw error
    }
  }

  // 使用 OpenAI API 生成摘要
  async generateSummary(text: string, apiKey: string): Promise<string> {
    if (!apiKey || apiKey.trim() === '') {
      throw new Error('未設置 OpenAI API Key')
    }

    if (!text || text.trim() === '') {
      throw new Error('沒有可摘要的文本')
    }

    try {
      log.info('Generating summary', { textLength: text.length })

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: '你是一個專業的會議記錄助理。請根據提供的會議逐字稿，生成一份結構化的會議摘要。'
            },
            {
              role: 'user',
              content: `請為以下會議逐字稿生成摘要，包含以下部分：
1. 會議主題
2. 主要討論點（列點說明）
3. 重要決定事項
4. 待辦事項與負責人（如果有提及）
5. 下一步行動

逐字稿內容：
${text}`
            }
          ],
          max_tokens: 1000,
          temperature: 0.3 // 降低隨機性以獲得更一致的摘要
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        log.error('OpenAI API error', { status: response.status, error: errorText })

        if (response.status === 401) {
          throw new Error('API Key 無效，請檢查您的 OpenAI API Key')
        } else if (response.status === 429) {
          throw new Error('API 請求次數超限，請稍後再試')
        } else {
          throw new Error(`OpenAI API 錯誤: ${response.status} - ${errorText}`)
        }
      }

      const result = await response.json()
      const summary = result.choices[0]?.message?.content || '無法生成摘要'

      log.info('Summary generated successfully', {
        summaryLength: summary.length,
        tokensUsed: result.usage?.total_tokens
      })

      return summary
    } catch (error: any) {
      log.error('Summary generation failed', { error: error.message })
      throw error
    }
  }

  // 處理長時間錄音的完整轉錄和摘要流程
  async processLongRecording(filePath: string, apiKey: string): Promise<{ transcription: string; summary: string }> {
    try {
      const fileSize = fs.statSync(filePath).size
      const fileSizeMB = fileSize / (1024 * 1024)

      log.info('Processing long recording', {
        filePath,
        fileSize: `${fileSizeMB.toFixed(2)}MB`
      })

      // 檢查檔案大小和預估時長
      // 一般來說，高品質錄音約 1MB/分鐘，中等品質約 0.5MB/分鐘
      const estimatedMinutes = fileSizeMB / 0.75 // 假設中高品質

      if (estimatedMinutes > 180) { // 超過 3 小時
        log.warn('Recording exceeds 3 hours, processing may take longer', {
          estimatedMinutes: estimatedMinutes.toFixed(0)
        })
      }

      // 轉錄音訊
      const transcription = await this.transcribeWithWhisper(filePath, apiKey)

      // 生成摘要
      const summary = await this.generateSummary(transcription, apiKey)

      return { transcription, summary }
    } catch (error: any) {
      log.error('Failed to process long recording', { error: error.message, filePath })
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
