// 上下班相關類型定義

export interface WorkTimeState {
  isClockedIn: boolean
  clockInTime: string | null
  clockOutTime: string | null
  estimatedOffTime: string | null
  hasNotified: boolean
  isInitialized: boolean
}

export interface WorkRecord {
  id: number
  date: string
  clock_in_time: string
  clock_out_time: string | null
  work_hours: number | null
  created_at: string
  updated_at: string
}
