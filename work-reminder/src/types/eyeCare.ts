// 護眼提醒相關類型定義

export interface EyeCareState {
  remainingSeconds: number
  config: EyeCareConfig
  isPaused: boolean
}

export interface EyeCareConfig {
  interval: number // 分鐘
  enabled: boolean
}

export interface Reminder {
  id: number
  type: string
  message: string
  dismissed: boolean
  created_at: string
}
