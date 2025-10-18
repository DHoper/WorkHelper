// 格式化工具函數

/**
 * 格式化秒數為 MM:SS 格式
 * @param seconds - 秒數
 * @returns 格式化的時間字符串
 */
export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

/**
 * 格式化字節大小
 * @param bytes - 字節數
 * @returns 格式化的大小字符串
 */
export const formatSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/**
 * 格式化日期為本地格式
 * @param date - 日期字符串或 Date 對象
 * @param locale - 語言環境，默認為 'zh-TW'
 * @returns 格式化的日期字符串
 */
export const formatDate = (date: string | Date, locale: string = 'zh-TW'): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return dateObj.toLocaleDateString(locale)
}

/**
 * 格式化日期時間為本地格式
 * @param date - 日期字符串或 Date 對象
 * @param locale - 語言環境，默認為 'zh-TW'
 * @returns 格式化的日期時間字符串
 */
export const formatDateTime = (date: string | Date, locale: string = 'zh-TW'): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return dateObj.toLocaleString(locale)
}

/**
 * 格式化工作時數
 * @param hours - 工作時數
 * @returns 格式化的時數字符串
 */
export const formatWorkHours = (hours: number): string => {
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}
