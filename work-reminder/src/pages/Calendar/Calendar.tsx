import { useState, useEffect } from 'react'
import { Calendar as CalendarIcon, Settings, Play, Pause, LogOut, Plus, X, ExternalLink, Clock } from 'lucide-react'
import { CalendarEvent } from '../../types/calendar'
import { format, parseISO } from 'date-fns'
import { zhTW } from 'date-fns/locale'
import Toast from '../../components/Toast'

const Calendar = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [authStep, setAuthStep] = useState<'idle' | 'waiting' | 'completed'>('idle')
  const [authCode, setAuthCode] = useState('')
  const [authUrl, setAuthUrl] = useState('')

  // Settings
  const [clientId, setClientId] = useState('')
  const [clientSecret, setClientSecret] = useState('')
  const [showSettings, setShowSettings] = useState(false)

  // Events
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [keywords, setKeywords] = useState<string[]>([])
  const [newKeyword, setNewKeyword] = useState('')
  const [lookAheadMinutes, setLookAheadMinutes] = useState(15)
  const [isMonitoring, setIsMonitoring] = useState(false)

  // Toast
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' | 'warning' | 'info' }>({
    show: false,
    message: '',
    type: 'info'
  })

  const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    setToast({ show: true, message, type })
  }

  // Load authentication status and settings on mount
  useEffect(() => {
    loadSettings()
    checkAuthStatus()
  }, [])

  // Listen for event reminders
  useEffect(() => {
    const cleanup = window.electronAPI.calendar.onEventReminder((data) => {
      console.log('Event reminder received:', data)
      // The notification is already shown by the backend
      // We can refresh events here if needed
      loadEvents()
    })

    return cleanup
  }, [])

  const loadSettings = async () => {
    try {
      const savedClientId = await window.electronAPI.settings.get('calendar_client_id')
      const savedClientSecret = await window.electronAPI.settings.get('calendar_client_secret')
      const savedKeywords = await window.electronAPI.calendar.getKeywords()

      if (savedClientId) setClientId(savedClientId)
      if (savedClientSecret) setClientSecret(savedClientSecret)
      if (savedKeywords) setKeywords(savedKeywords)
    } catch (error) {
      console.error('Failed to load settings:', error)
      showToast('無法載入設定', 'error')
    }
  }

  const saveSettings = async () => {
    try {
      await window.electronAPI.settings.set('calendar_client_id', clientId)
      await window.electronAPI.settings.set('calendar_client_secret', clientSecret)
      setShowSettings(false)
      showToast('設定已儲存', 'success')
    } catch (error) {
      console.error('Failed to save settings:', error)
      showToast('設定儲存失敗', 'error')
    }
  }

  const checkAuthStatus = async () => {
    try {
      const authenticated = await window.electronAPI.calendar.isAuthenticated()
      setIsAuthenticated(authenticated)

      if (authenticated) {
        loadEvents()
      }
    } catch (error) {
      console.error('Failed to check auth status:', error)
      showToast('無法檢查認證狀態', 'error')
    }
  }

  const handleInitAuth = async () => {
    if (!clientId || !clientSecret) {
      showToast('請先在設定中輸入 Client ID 和 Client Secret', 'warning')
      setShowSettings(true)
      return
    }

    try {
      setIsLoading(true)
      await window.electronAPI.calendar.initAuth(clientId, clientSecret)
      const url = await window.electronAPI.calendar.getAuthUrl()
      setAuthUrl(url)
      setAuthStep('waiting')

      // Open the URL in the default browser
      window.open(url, '_blank')
      showToast('請在瀏覽器中完成授權', 'info')
    } catch (error) {
      console.error('Failed to init auth:', error)
      showToast('認證初始化失敗', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAuthCodeSubmit = async () => {
    if (!authCode.trim()) {
      showToast('請輸入授權碼', 'warning')
      return
    }

    try {
      setIsLoading(true)
      await window.electronAPI.calendar.authenticateWithCode(authCode.trim())
      setIsAuthenticated(true)
      setAuthStep('completed')
      setAuthCode('')
      loadEvents()
      startMonitoring()
      showToast('Google 日曆連結成功！', 'success')
    } catch (error) {
      console.error('Failed to authenticate:', error)
      showToast('認證失敗，請確認授權碼是否正確', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    if (!confirm('確定要登出嗎？')) return

    try {
      await window.electronAPI.calendar.clearAuth()
      setIsAuthenticated(false)
      setEvents([])
      setIsMonitoring(false)
      showToast('已成功登出', 'success')
    } catch (error) {
      console.error('Failed to logout:', error)
      showToast('登出失敗', 'error')
    }
  }

  const loadEvents = async () => {
    try {
      const upcomingEvents = await window.electronAPI.calendar.getUpcomingEvents(24)
      setEvents(upcomingEvents)
    } catch (error) {
      console.error('Failed to load events:', error)
      showToast('無法載入事件', 'error')
    }
  }

  const addKeyword = async () => {
    if (!newKeyword.trim()) return

    const updatedKeywords = [...keywords, newKeyword.trim()]
    setKeywords(updatedKeywords)
    setNewKeyword('')

    try {
      await window.electronAPI.calendar.setKeywords(updatedKeywords)
      showToast('關鍵字已新增', 'success')
    } catch (error) {
      console.error('Failed to save keywords:', error)
      showToast('關鍵字儲存失敗', 'error')
    }
  }

  const removeKeyword = async (keyword: string) => {
    const updatedKeywords = keywords.filter(k => k !== keyword)
    setKeywords(updatedKeywords)

    try {
      await window.electronAPI.calendar.setKeywords(updatedKeywords)
      showToast('關鍵字已移除', 'success')
    } catch (error) {
      console.error('Failed to save keywords:', error)
      showToast('關鍵字移除失敗', 'error')
    }
  }

  const updateLookAheadTime = async (minutes: number) => {
    setLookAheadMinutes(minutes)
    try {
      await window.electronAPI.calendar.setLookAheadMinutes(minutes)
      showToast(`提醒時間已更新為提前 ${minutes} 分鐘`, 'success')
    } catch (error) {
      console.error('Failed to update look ahead time:', error)
      showToast('提醒時間更新失敗', 'error')
    }
  }

  const startMonitoring = async () => {
    try {
      await window.electronAPI.calendar.startMonitoring()
      setIsMonitoring(true)
      showToast('監控已開始', 'success')
    } catch (error) {
      console.error('Failed to start monitoring:', error)
      showToast('監控啟動失敗', 'error')
    }
  }

  const stopMonitoring = async () => {
    try {
      await window.electronAPI.calendar.stopMonitoring()
      setIsMonitoring(false)
      showToast('監控已停止', 'info')
    } catch (error) {
      console.error('Failed to stop monitoring:', error)
      showToast('監控停止失敗', 'error')
    }
  }

  const getEventTimeDisplay = (event: CalendarEvent) => {
    try {
      const start = parseISO(event.startTime)
      const end = parseISO(event.endTime)

      if (event.isAllDay) {
        return '全天'
      }

      return `${format(start, 'HH:mm', { locale: zhTW })} - ${format(end, 'HH:mm', { locale: zhTW })}`
    } catch {
      return event.startTime
    }
  }

  const getEventDateDisplay = (event: CalendarEvent) => {
    try {
      const start = parseISO(event.startTime)
      return format(start, 'MM/dd (EEE)', { locale: zhTW })
    } catch {
      return event.startTime
    }
  }

  const filterEventsByKeywords = () => {
    if (keywords.length === 0) return events

    return events.filter(event => {
      const searchText = `${event.summary} ${event.description || ''}`.toLowerCase()
      return keywords.some(keyword => searchText.includes(keyword.toLowerCase()))
    })
  }

  const filteredEvents = filterEventsByKeywords()

  return (
    <div className="h-full p-6 bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-5xl mx-auto h-full flex flex-col">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-900 to-gray-700 flex items-center justify-center shadow-lg">
              <CalendarIcon size={20} className="text-white" strokeWidth={2} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">日曆提醒</h2>
              <p className="text-sm text-gray-500">Google Calendar 整合</p>
            </div>
          </div>
          <div className="flex gap-2">
            {isAuthenticated && (
              <>
                <button
                  onClick={isMonitoring ? stopMonitoring : startMonitoring}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 transform hover:scale-105 shadow-sm ${
                    isMonitoring
                      ? 'bg-red-500 text-white hover:bg-red-600 shadow-red-200'
                      : 'bg-green-500 text-white hover:bg-green-600 shadow-green-200'
                  }`}
                >
                  {isMonitoring ? (
                    <>
                      <Pause size={14} className="inline mr-1.5" />
                      停止監控
                    </>
                  ) : (
                    <>
                      <Play size={14} className="inline mr-1.5" />
                      開始監控
                    </>
                  )}
                </button>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 rounded-lg text-sm font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all duration-300 transform hover:scale-105"
                >
                  <LogOut size={14} className="inline mr-1.5" />
                  登出
                </button>
              </>
            )}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="px-4 py-2 rounded-lg text-sm font-semibold bg-gray-900 text-white hover:bg-gray-800 transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              <Settings size={14} className="inline mr-1.5" />
              設定
            </button>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="mb-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Google OAuth 設定</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Client ID</label>
                <input
                  type="text"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  placeholder="請輸入 Google OAuth Client ID"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Client Secret</label>
                <input
                  type="password"
                  value={clientSecret}
                  onChange={(e) => setClientSecret(e.target.value)}
                  placeholder="請輸入 Google OAuth Client Secret"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={saveSettings}
                  className="px-4 py-2 text-xs font-semibold bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                  儲存設定
                </button>
                <button
                  onClick={() => setShowSettings(false)}
                  className="px-4 py-2 text-xs font-semibold bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto space-y-4">
          {!isAuthenticated ? (
            /* Authentication Flow */
            <div className="p-6 border border-gray-200 rounded-lg bg-white text-center">
              <CalendarIcon size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">連結 Google 日曆</h3>
              <p className="text-sm text-gray-600 mb-6">
                連結您的 Google 日曆以接收會議提醒
              </p>

              {authStep === 'idle' && (
                <button
                  onClick={handleInitAuth}
                  disabled={isLoading}
                  className="px-6 py-3 text-sm font-semibold bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
                >
                  {isLoading ? '處理中...' : '開始連結'}
                </button>
              )}

              {authStep === 'waiting' && (
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg text-left">
                    <p className="text-sm text-blue-900 mb-2">
                      1. 瀏覽器已開啟授權頁面，請完成授權流程
                    </p>
                    <p className="text-sm text-blue-900 mb-2">
                      2. 授權後，Google 會提供一組授權碼
                    </p>
                    <p className="text-sm text-blue-900">
                      3. 將授權碼貼到下方輸入框
                    </p>
                    <a
                      href={authUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 mt-2"
                    >
                      重新開啟授權頁面 <ExternalLink size={12} />
                    </a>
                  </div>
                  <input
                    type="text"
                    value={authCode}
                    onChange={(e) => setAuthCode(e.target.value)}
                    placeholder="貼上授權碼"
                    className="w-full px-4 py-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={handleAuthCodeSubmit}
                      disabled={isLoading}
                      className="px-6 py-2 text-sm font-semibold bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
                    >
                      {isLoading ? '驗證中...' : '完成連結'}
                    </button>
                    <button
                      onClick={() => {
                        setAuthStep('idle')
                        setAuthCode('')
                      }}
                      className="px-6 py-2 text-sm font-semibold bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      取消
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Authenticated View */
            <>
              {/* Keyword Settings */}
              <div className="p-4 border border-gray-200 rounded-lg bg-white">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">關鍵字過濾</h3>
                <p className="text-xs text-gray-600 mb-3">
                  只提醒包含以下關鍵字的會議（留空則提醒所有會議）
                </p>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={newKeyword}
                    onChange={(e) => setNewKeyword(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addKeyword()}
                    placeholder="輸入關鍵字"
                    className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                  <button
                    onClick={addKeyword}
                    className="px-4 py-2 text-xs font-semibold bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    <Plus size={14} />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {keywords.map((keyword) => (
                    <span
                      key={keyword}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                    >
                      {keyword}
                      <button
                        onClick={() => removeKeyword(keyword)}
                        className="hover:text-gray-900"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                  {keywords.length === 0 && (
                    <span className="text-xs text-gray-400">尚未設定關鍵字</span>
                  )}
                </div>
              </div>

              {/* Reminder Settings */}
              <div className="p-4 border border-gray-200 rounded-lg bg-white">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">提醒設定</h3>
                <div className="flex items-center gap-3">
                  <Clock size={16} className="text-gray-500" />
                  <span className="text-sm text-gray-600">提前</span>
                  <select
                    value={lookAheadMinutes}
                    onChange={(e) => updateLookAheadTime(Number(e.target.value))}
                    className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                  >
                    <option value={5}>5 分鐘</option>
                    <option value={10}>10 分鐘</option>
                    <option value={15}>15 分鐘</option>
                    <option value={30}>30 分鐘</option>
                    <option value={60}>60 分鐘</option>
                  </select>
                  <span className="text-sm text-gray-600">提醒</span>
                </div>
              </div>

              {/* Events List */}
              <div className="p-4 border border-gray-200 rounded-lg bg-white">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-900">
                    即將到來的會議 ({filteredEvents.length})
                  </h3>
                  <button
                    onClick={loadEvents}
                    className="text-xs text-gray-600 hover:text-gray-900"
                  >
                    重新整理
                  </button>
                </div>

                {filteredEvents.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-8">
                    {keywords.length > 0 ? '沒有符合關鍵字的會議' : '沒有即將到來的會議'}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {filteredEvents.map((event) => (
                      <div
                        key={event.id}
                        className="p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-semibold text-gray-500">
                                {getEventDateDisplay(event)}
                              </span>
                              <span className="text-xs text-gray-400">•</span>
                              <span className="text-xs text-gray-600">
                                {getEventTimeDisplay(event)}
                              </span>
                            </div>
                            <h4 className="text-sm font-semibold text-gray-900 mb-1 truncate">
                              {event.summary}
                            </h4>
                            {event.location && (
                              <p className="text-xs text-gray-600 mb-1 truncate">
                                📍 {event.location}
                              </p>
                            )}
                            {event.description && (
                              <p className="text-xs text-gray-500 line-clamp-2">
                                {event.description}
                              </p>
                            )}
                          </div>
                          <span
                            className={`shrink-0 ml-2 w-2 h-2 rounded-full ${
                              event.status === 'confirmed'
                                ? 'bg-green-500'
                                : event.status === 'tentative'
                                ? 'bg-yellow-500'
                                : 'bg-gray-300'
                            }`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Toast Notification */}
      <Toast
        isOpen={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, show: false })}
      />
    </div>
  )
}

export default Calendar
