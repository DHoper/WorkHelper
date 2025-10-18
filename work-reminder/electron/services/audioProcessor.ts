import ffmpeg from 'fluent-ffmpeg'
import path from 'path'
import fs from 'fs'
import { app } from 'electron'
import { log } from '../utils/logger'

interface AudioSegment {
  path: string
  duration: number
  index: number
}

class AudioProcessor {
  private tempDir: string

  constructor() {
    const userDataPath = app.getPath('userData')
    this.tempDir = path.join(userDataPath, 'temp_audio')
    this.ensureTempDir()
  }

  private ensureTempDir() {
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true })
    }
  }

  // 清理臨時檔案
  cleanupTempFiles() {
    try {
      const files = fs.readdirSync(this.tempDir)
      files.forEach(file => {
        const filePath = path.join(this.tempDir, file)
        fs.unlinkSync(filePath)
      })
      log.info('Temp files cleaned up')
    } catch (error) {
      log.error('Failed to cleanup temp files', { error })
    }
  }

  // 獲取音訊檔案資訊
  async getAudioInfo(filePath: string): Promise<any> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (err, metadata) => {
        if (err) {
          reject(err)
        } else {
          resolve(metadata)
        }
      })
    })
  }

  // 壓縮音訊檔案
  async compressAudio(inputPath: string, targetSizeMB: number = 24): Promise<string> {
    const outputPath = path.join(this.tempDir, `compressed_${Date.now()}.mp3`)

    try {
      const fileInfo = await this.getAudioInfo(inputPath)
      const duration = fileInfo.format.duration || 0
      const currentSizeMB = fileInfo.format.size / (1024 * 1024)

      if (currentSizeMB <= targetSizeMB) {
        log.info('File already within size limit', { currentSizeMB, targetSizeMB })
        return inputPath
      }

      // 計算目標比特率
      const targetBitrate = Math.floor((targetSizeMB * 8 * 1024) / duration)
      const maxBitrate = Math.min(targetBitrate, 64) // 最高 64kbps 以保持合理品質

      log.info('Compressing audio', {
        inputPath,
        outputPath,
        currentSizeMB: currentSizeMB.toFixed(2),
        targetSizeMB,
        targetBitrate: `${maxBitrate}k`
      })

      return new Promise((resolve, reject) => {
        ffmpeg(inputPath)
          .audioBitrate(maxBitrate)
          .audioChannels(1) // 單聲道以減少檔案大小
          .audioFrequency(16000) // 降低採樣率（Whisper 支援 16kHz）
          .toFormat('mp3')
          .on('progress', (progress) => {
            log.info('Compression progress', { percent: progress.percent?.toFixed(2) })
          })
          .on('end', () => {
            const newSize = fs.statSync(outputPath).size / (1024 * 1024)
            log.info('Audio compressed successfully', {
              originalSize: `${currentSizeMB.toFixed(2)}MB`,
              compressedSize: `${newSize.toFixed(2)}MB`
            })
            resolve(outputPath)
          })
          .on('error', (err) => {
            log.error('Compression failed', { error: err.message })
            reject(err)
          })
          .save(outputPath)
      })
    } catch (error: any) {
      log.error('Failed to compress audio', { error: error.message })
      throw error
    }
  }

  // 分割音訊檔案
  async splitAudio(inputPath: string, segmentDurationMinutes: number = 10): Promise<AudioSegment[]> {
    const segments: AudioSegment[] = []
    const segmentDuration = segmentDurationMinutes * 60 // 轉換為秒

    try {
      const fileInfo = await this.getAudioInfo(inputPath)
      const totalDuration = fileInfo.format.duration || 0
      const numSegments = Math.ceil(totalDuration / segmentDuration)

      log.info('Splitting audio', {
        inputPath,
        totalDuration: `${(totalDuration / 60).toFixed(2)} minutes`,
        numSegments,
        segmentDuration: `${segmentDurationMinutes} minutes`
      })

      for (let i = 0; i < numSegments; i++) {
        const startTime = i * segmentDuration
        const outputPath = path.join(this.tempDir, `segment_${i + 1}_${Date.now()}.mp3`)

        await new Promise<void>((resolve, reject) => {
          const command = ffmpeg(inputPath)
            .setStartTime(startTime)
            .setDuration(segmentDuration)
            .audioBitrate(64) // 使用較低的比特率以確保每段都在限制內
            .audioChannels(1)
            .audioFrequency(16000)
            .toFormat('mp3')
            .on('end', () => {
              const segmentSize = fs.statSync(outputPath).size / (1024 * 1024)
              log.info(`Segment ${i + 1} created`, {
                size: `${segmentSize.toFixed(2)}MB`,
                startTime: `${(startTime / 60).toFixed(2)} min`
              })
              segments.push({
                path: outputPath,
                duration: Math.min(segmentDuration, totalDuration - startTime),
                index: i
              })
              resolve()
            })
            .on('error', (err) => {
              log.error(`Failed to create segment ${i + 1}`, { error: err.message })
              reject(err)
            })
            .save(outputPath)
        })
      }

      return segments
    } catch (error: any) {
      log.error('Failed to split audio', { error: error.message })
      throw error
    }
  }

  // 處理大檔案的智慧策略
  async processLargeAudioFile(inputPath: string): Promise<{ strategy: 'compress' | 'split', files: string[] }> {
    try {
      const fileSizeMB = fs.statSync(inputPath).size / (1024 * 1024)
      const fileInfo = await this.getAudioInfo(inputPath)
      const durationMinutes = (fileInfo.format.duration || 0) / 60

      log.info('Analyzing large audio file', {
        fileSizeMB: fileSizeMB.toFixed(2),
        durationMinutes: durationMinutes.toFixed(2)
      })

      // 策略決定
      if (fileSizeMB <= 25) {
        // 檔案已經在限制內
        return { strategy: 'compress', files: [inputPath] }
      } else if (fileSizeMB <= 50 && durationMinutes <= 30) {
        // 嘗試壓縮
        const compressedPath = await this.compressAudio(inputPath, 24)
        return { strategy: 'compress', files: [compressedPath] }
      } else {
        // 需要分割
        const segments = await this.splitAudio(inputPath)
        return { strategy: 'split', files: segments.map(s => s.path) }
      }
    } catch (error: any) {
      log.error('Failed to process large audio file', { error: error.message })
      throw error
    }
  }

  // 合併轉錄結果
  mergeTranscriptions(transcriptions: string[]): string {
    return transcriptions.join('\n\n--- 段落分隔 ---\n\n')
  }
}

export const audioProcessor = new AudioProcessor()