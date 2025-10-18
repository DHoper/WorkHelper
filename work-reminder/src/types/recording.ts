// 錄音相關類型定義

export interface Recording {
  id: number
  title: string
  file_path: string
  duration: number
  size: number
  format: string
  created_at: string
  tags: string | null
}

export interface Transcription {
  id: number
  recording_id: number
  content: string
  language: string
  created_at: string
}

export interface Summary {
  recordingId: number
  content: string
  createdAt: string
}

export interface RecordingMetadata {
  title: string
  duration: number
  size: number
  format: string
  tags?: string | null
}
