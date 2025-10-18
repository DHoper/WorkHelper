// 應用常量定義

// 任務優先級
export const TASK_PRIORITIES = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
} as const

// 任務分類
export const TASK_CATEGORIES = {
  WORK: 'work',
  PERSONAL: 'personal',
  URGENT: 'urgent',
  OTHER: 'other',
} as const

// 護眼提醒間隔選項（分鐘）
export const EYE_CARE_INTERVALS = [20, 30, 45, 60, 90, 120] as const

// 播放速度選項
export const PLAYBACK_SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2] as const

// 音頻格式
export const AUDIO_FORMATS = {
  WEBM: 'webm',
  MP3: 'mp3',
  WAV: 'wav',
} as const

// 文件大小限制
export const FILE_SIZE_LIMITS = {
  MAX_RECORDING_SIZE: 100 * 1024 * 1024, // 100MB
  MAX_WHISPER_SIZE: 25 * 1024 * 1024,    // 25MB
} as const

// 路由路徑
export const ROUTES = {
  DASHBOARD: '/',
  TASKS: '/tasks',
  WORK_TIME: '/work-time',
  EYE_CARE: '/eye-care',
  RECORDING: '/recording',
  SETTINGS: '/settings',
} as const

// Toast 持續時間（毫秒）
export const TOAST_DURATION = 3000

// 本地存儲鍵名
export const STORAGE_KEYS = {
  OPENAI_API_KEY: 'openai_api_key',
  THEME: 'theme',
  LANGUAGE: 'language',
} as const
