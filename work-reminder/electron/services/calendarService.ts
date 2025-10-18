import { google } from 'googleapis'
import { OAuth2Client } from 'google-auth-library'
import { BrowserWindow, Notification } from 'electron'
import { app } from 'electron'
import path from 'path'
import fs from 'fs'
import { log } from '../utils/logger'

interface CalendarEvent {
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

interface CalendarAuth {
  accessToken: string
  refreshToken: string
  expiryDate: number
  tokenType: string
  scope: string
}

class CalendarService {
  private oauth2Client: OAuth2Client | null = null
  private calendar: any = null
  private mainWindow: BrowserWindow | null = null
  private checkTimerId: NodeJS.Timeout | null = null
  private notifiedEvents: Set<string> = new Set()
  private keywords: string[] = []
  private lookAheadMinutes: number = 15 // 提前 15 分鐘提醒

  // OAuth 配置
  private readonly SCOPES = ['https://www.googleapis.com/auth/calendar.readonly']
  private readonly TOKEN_PATH = path.join(app.getPath('userData'), 'google-calendar-token.json')

  constructor() {
    this.loadKeywords()
  }

  setMainWindow(window: BrowserWindow) {
    this.mainWindow = window
  }

  /**
   * 初始化 OAuth 客戶端
   */
  async initializeAuth(clientId: string, clientSecret: string, redirectUri: string = 'http://localhost'): Promise<void> {
    this.oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri)

    // 嘗試載入已存儲的 token
    await this.loadSavedToken()

    if (this.oauth2Client.credentials.access_token) {
      this.calendar = google.calendar({ version: 'v3', auth: this.oauth2Client })
      log.info('Google Calendar API initialized with saved token')
    }
  }

  /**
   * 生成認證 URL
   */
  getAuthUrl(): string {
    if (!this.oauth2Client) {
      throw new Error('OAuth client not initialized')
    }

    const authUrl = this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: this.SCOPES,
      prompt: 'consent' // 強制顯示同意畫面以獲取 refresh token
    })

    log.info('Generated auth URL', { url: authUrl })
    return authUrl
  }

  /**
   * 使用授權碼獲取 token
   */
  async authenticateWithCode(code: string): Promise<void> {
    if (!this.oauth2Client) {
      throw new Error('OAuth client not initialized')
    }

    try {
      const { tokens } = await this.oauth2Client.getToken(code)
      this.oauth2Client.setCredentials(tokens)

      // 保存 token
      await this.saveToken({
        accessToken: tokens.access_token!,
        refreshToken: tokens.refresh_token!,
        expiryDate: tokens.expiry_date!,
        tokenType: tokens.token_type!,
        scope: tokens.scope!
      })

      this.calendar = google.calendar({ version: 'v3', auth: this.oauth2Client })
      log.info('Successfully authenticated with Google Calendar')
    } catch (error) {
      log.error('Authentication error', { error })
      throw error
    }
  }

  /**
   * 檢查是否已認證
   */
  isAuthenticated(): boolean {
    return this.calendar !== null && this.oauth2Client?.credentials?.access_token !== undefined
  }

  /**
   * 獲取所有日曆列表
   */
  async getCalendarList(): Promise<any[]> {
    if (!this.calendar) {
      throw new Error('Not authenticated')
    }

    try {
      const response = await this.calendar.calendarList.list()
      return response.data.items || []
    } catch (error) {
      log.error('Failed to get calendar list', { error })
      throw error
    }
  }

  /**
   * 獲取即將到來的事件
   */
  async getUpcomingEvents(hoursAhead: number = 24): Promise<CalendarEvent[]> {
    if (!this.calendar) {
      throw new Error('Not authenticated')
    }

    try {
      const now = new Date()
      const timeMax = new Date(now.getTime() + hoursAhead * 60 * 60 * 1000)

      // 獲取日曆列表
      const calendars = await this.getCalendarList()
      const allEvents: CalendarEvent[] = []

      // 從每個日曆獲取事件
      for (const cal of calendars) {
        try {
          const response = await this.calendar.events.list({
            calendarId: cal.id,
            timeMin: now.toISOString(),
            timeMax: timeMax.toISOString(),
            singleEvents: true,
            orderBy: 'startTime',
            maxResults: 50
          })

          const events = response.data.items || []

          for (const event of events) {
            if (!event.start) continue

            allEvents.push({
              id: event.id,
              summary: event.summary || '(無標題)',
              description: event.description,
              location: event.location,
              startTime: event.start.dateTime || event.start.date,
              endTime: event.end.dateTime || event.end.date,
              attendees: event.attendees?.map((a: any) => a.email) || [],
              isAllDay: !event.start.dateTime,
              calendarId: cal.id,
              calendarName: cal.summary,
              organizer: event.organizer?.email,
              status: event.status as any
            })
          }
        } catch (error) {
          log.error(`Failed to get events from calendar ${cal.summary}`, { error })
        }
      }

      return allEvents.sort((a, b) =>
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      )
    } catch (error) {
      log.error('Failed to get upcoming events', { error })
      throw error
    }
  }

  /**
   * 根據關鍵字過濾事件
   */
  filterEventsByKeywords(events: CalendarEvent[]): CalendarEvent[] {
    if (this.keywords.length === 0) {
      return events
    }

    return events.filter(event => {
      const searchText = `${event.summary} ${event.description || ''}`.toLowerCase()
      return this.keywords.some(keyword => searchText.includes(keyword.toLowerCase()))
    })
  }

  /**
   * 設定關鍵字
   */
  setKeywords(keywords: string[]) {
    this.keywords = keywords
    this.saveKeywords()
    log.info('Keywords updated', { keywords })
  }

  /**
   * 獲取當前關鍵字
   */
  getKeywords(): string[] {
    return this.keywords
  }

  /**
   * 設定提前提醒時間（分鐘）
   */
  setLookAheadMinutes(minutes: number) {
    this.lookAheadMinutes = minutes
    log.info('Look ahead time updated', { minutes })
  }

  /**
   * 開始監控事件
   */
  startMonitoring() {
    this.stopMonitoring()

    // 每 5 分鐘檢查一次
    this.checkTimerId = setInterval(() => {
      this.checkUpcomingEvents()
    }, 5 * 60 * 1000)

    // 立即檢查一次
    this.checkUpcomingEvents()

    log.info('Calendar monitoring started')
  }

  /**
   * 停止監控
   */
  stopMonitoring() {
    if (this.checkTimerId) {
      clearInterval(this.checkTimerId)
      this.checkTimerId = null
    }
    log.info('Calendar monitoring stopped')
  }

  /**
   * 檢查即將到來的事件並發送通知
   */
  private async checkUpcomingEvents() {
    if (!this.isAuthenticated()) {
      return
    }

    try {
      // 獲取未來指定時間內的事件
      const events = await this.getUpcomingEvents(this.lookAheadMinutes / 60)

      // 過濾關鍵字
      const filteredEvents = this.filterEventsByKeywords(events)

      const now = new Date()
      const reminderThreshold = new Date(now.getTime() + this.lookAheadMinutes * 60 * 1000)

      for (const event of filteredEvents) {
        const eventStart = new Date(event.startTime)

        // 如果事件在提醒時間範圍內且還沒通知過
        if (eventStart <= reminderThreshold && !this.notifiedEvents.has(event.id)) {
          this.sendEventNotification(event)
          this.notifiedEvents.add(event.id)
        }
      }

      // 清理已過期的通知記錄
      for (const eventId of this.notifiedEvents) {
        const event = events.find(e => e.id === eventId)
        if (event) {
          const eventStart = new Date(event.startTime)
          if (eventStart < now) {
            this.notifiedEvents.delete(eventId)
          }
        }
      }
    } catch (error) {
      log.error('Failed to check upcoming events', { error })
    }
  }

  /**
   * 發送事件通知
   */
  private sendEventNotification(event: CalendarEvent) {
    const eventStart = new Date(event.startTime)
    const minutesUntil = Math.round((eventStart.getTime() - Date.now()) / (60 * 1000))

    if (Notification.isSupported()) {
      const notification = new Notification({
        title: '📅 會議提醒',
        body: `${event.summary}\n${minutesUntil} 分鐘後開始\n${event.location || ''}`,
        urgency: 'normal',
        silent: false
      })

      notification.on('click', () => {
        log.info('Calendar notification clicked')
        if (this.mainWindow) {
          if (this.mainWindow.isMinimized()) {
            this.mainWindow.restore()
          }
          this.mainWindow.show()
          this.mainWindow.focus()
        }
      })

      notification.show()
      log.info('Event notification sent', {
        eventId: event.id,
        summary: event.summary,
        minutesUntil
      })
    }

    // 發送到渲染進程
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('calendar:eventReminder', {
        event,
        minutesUntil
      })
    }
  }

  /**
   * 保存 token
   */
  private async saveToken(auth: CalendarAuth): Promise<void> {
    try {
      fs.writeFileSync(this.TOKEN_PATH, JSON.stringify(auth, null, 2))
      log.info('Token saved', { path: this.TOKEN_PATH })
    } catch (error) {
      log.error('Failed to save token', { error })
    }
  }

  /**
   * 載入已保存的 token
   */
  private async loadSavedToken(): Promise<void> {
    try {
      if (fs.existsSync(this.TOKEN_PATH)) {
        const tokenData = fs.readFileSync(this.TOKEN_PATH, 'utf-8')
        const auth: CalendarAuth = JSON.parse(tokenData)

        if (this.oauth2Client) {
          this.oauth2Client.setCredentials({
            access_token: auth.accessToken,
            refresh_token: auth.refreshToken,
            expiry_date: auth.expiryDate,
            token_type: auth.tokenType,
            scope: auth.scope
          })
          log.info('Token loaded from file')
        }
      }
    } catch (error) {
      log.error('Failed to load token', { error })
    }
  }

  /**
   * 載入關鍵字
   */
  private loadKeywords() {
    try {
      const keywordsPath = path.join(app.getPath('userData'), 'calendar-keywords.json')
      if (fs.existsSync(keywordsPath)) {
        const data = fs.readFileSync(keywordsPath, 'utf-8')
        this.keywords = JSON.parse(data)
        log.info('Keywords loaded', { keywords: this.keywords })
      }
    } catch (error) {
      log.error('Failed to load keywords', { error })
    }
  }

  /**
   * 保存關鍵字
   */
  private saveKeywords() {
    try {
      const keywordsPath = path.join(app.getPath('userData'), 'calendar-keywords.json')
      fs.writeFileSync(keywordsPath, JSON.stringify(this.keywords, null, 2))
      log.info('Keywords saved')
    } catch (error) {
      log.error('Failed to save keywords', { error })
    }
  }

  /**
   * 清除認證
   */
  async clearAuth(): Promise<void> {
    try {
      if (fs.existsSync(this.TOKEN_PATH)) {
        fs.unlinkSync(this.TOKEN_PATH)
      }
      this.oauth2Client = null
      this.calendar = null
      this.stopMonitoring()
      log.info('Authentication cleared')
    } catch (error) {
      log.error('Failed to clear auth', { error })
      throw error
    }
  }

  /**
   * 清理資源
   */
  cleanup() {
    this.stopMonitoring()
    log.info('Calendar service cleaned up')
  }
}

export const calendarService = new CalendarService()
