// 驗證工具函數

/**
 * 驗證電子郵件格式
 * @param email - 電子郵件地址
 * @returns 是否有效
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * 驗證時間格式 (HH:MM)
 * @param time - 時間字符串
 * @returns 是否有效
 */
export const isValidTime = (time: string): boolean => {
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
  return timeRegex.test(time)
}

/**
 * 驗證日期格式 (YYYY-MM-DD)
 * @param date - 日期字符串
 * @returns 是否有效
 */
export const isValidDate = (date: string): boolean => {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/
  if (!dateRegex.test(date)) return false

  const d = new Date(date)
  return d instanceof Date && !isNaN(d.getTime())
}

/**
 * 驗證非空字符串
 * @param str - 字符串
 * @returns 是否非空
 */
export const isNonEmptyString = (str: string): boolean => {
  return typeof str === 'string' && str.trim().length > 0
}
