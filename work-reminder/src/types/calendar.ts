// Google Calendar 相關類型定義

export interface CalendarEvent {
  id: string
  summary: string
  description?: string
  location?: string
  startTime: string
  endTime: string
  attendees?: string[]
  isAllDay: boolean
  calendarId: string
  calendarName: string
  organizer?: string
  status: 'confirmed' | 'tentative' | 'cancelled'
}

export interface CalendarInfo {
  id: string
  summary: string
  description?: string
  primary: boolean
  accessRole: string
  backgroundColor?: string
}

export interface EventFilter {
  keywords: string[]
  calendars: string[]
  includeDeclined: boolean
  lookAheadHours: number
}

export interface CalendarAuth {
  accessToken: string
  refreshToken: string
  expiryDate: number
  tokenType: string
  scope: string
}

export interface EventReminder {
  eventId: string
  eventSummary: string
  reminderTime: string
  notified: boolean
  matchedKeyword?: string
}
