import { useState, useEffect } from 'react'
import { Clock, LogIn, LogOut, Coffee } from 'lucide-react'
import Toast from '../../components/Toast'

interface WorkTimeState {
  isClockedIn: boolean
  clockInTime: string | null
  clockOutTime: string | null
  estimatedOffTime: string | null
  hasNotified: boolean
}

const WorkTime = () => {
  const [state, setState] = useState<WorkTimeState>({
    isClockedIn: false,
    clockInTime: null,
    clockOutTime: null,
    estimatedOffTime: null,
    hasNotified: false
  })
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' | 'warning' | 'info' }>({ show: false, message: '', type: 'info' })

  useEffect(() => {
    loadState()
    
    // 設置事件監聽器並獲取清理函數
    const unsubscribeStateUpdate = window.electronAPI.workTime.onStateUpdate((newState) => {
      setState(newState)
    })
    const unsubscribeOffTime = window.electronAPI.workTime.onOffTimeReached(() => {
      // 下班時間到了的提示已由系統通知處理
    })
    
    // 清理函數：移除事件監聽器
    return () => {
      unsubscribeStateUpdate()
      unsubscribeOffTime()
    }
  }, [])

  const loadState = async () => {
    const currentState = await window.electronAPI.workTime.getState()
    setState(currentState)
  }

  const handleClockIn = async () => {
    try {
      const newState = await window.electronAPI.workTime.clockIn()
      setState(newState)
      setToast({ show: true, message: '上班打卡成功', type: 'success' })
    } catch (error: any) {
      setToast({ show: true, message: error.message || '打卡失敗', type: 'error' })
    }
  }

  const handleClockOut = async () => {
    try {
      const newState = await window.electronAPI.workTime.clockOut()
      setState(newState)
      setToast({ show: true, message: '下班打卡成功，辛苦了！', type: 'success' })
    } catch (error: any) {
      setToast({ show: true, message: error.message || '打卡失敗', type: 'error' })
    }
  }

  return (
    <div className="h-full p-6 bg-white">
      <div className="max-w-lg mx-auto flex flex-col items-center justify-center h-full gap-6">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900">工時管理</h2>
        </div>

        {/* Status Card */}
        <div className="w-full p-6 border border-gray-200 rounded-lg bg-white">
          <div>
            {state.isClockedIn ? (
              <div className="space-y-3">
                {/* Clock In Time */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-gray-900 flex items-center justify-center">
                      <LogIn size={16} className="text-white" strokeWidth={2} />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">上班</p>
                      <p className="text-lg font-bold text-gray-900 tabular-nums">{state.clockInTime}</p>
                    </div>
                  </div>
                </div>

                {/* Estimated Off Time */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-gray-900 flex items-center justify-center">
                      <Clock size={16} className="text-white" strokeWidth={2} />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">預計下班</p>
                      <p className="text-lg font-bold text-gray-900 tabular-nums">
                        {state.estimatedOffTime}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Clock Out Time (if available) */}
                {state.clockOutTime && (
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-gray-900 flex items-center justify-center">
                        <LogOut size={16} className="text-white" strokeWidth={2} />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">下班</p>
                        <p className="text-lg font-bold text-gray-900 tabular-nums">
                          {state.clockOutTime}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <Coffee size={48} className="text-gray-300 mx-auto mb-3" strokeWidth={1.5} />
                <p className="text-gray-400 text-sm">尚未打卡</p>
              </div>
            )}
          </div>
        </div>

        {/* Action Button */}
        <div>
          {!state.isClockedIn ? (
            <button
              className="flex items-center gap-2 px-6 py-3 rounded-lg bg-gray-900 hover:bg-gray-800 text-white transition-all"
              onClick={handleClockIn}
            >
              <LogIn size={16} strokeWidth={2} />
              <span className="font-medium">上班打卡</span>
            </button>
          ) : !state.clockOutTime ? (
            <button
              className="flex items-center gap-2 px-6 py-3 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-all"
              onClick={handleClockOut}
            >
              <LogOut size={16} strokeWidth={2} />
              <span className="font-medium">下班打卡</span>
            </button>
          ) : (
            <div className="px-4 py-2 rounded-lg bg-gray-100 border border-gray-200">
              <span className="text-sm text-gray-600">已完成打卡</span>
            </div>
          )}
        </div>
      </div>

      {/* Toast */}
      <Toast
        isOpen={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, show: false })}
      />
    </div>
  )
}

export default WorkTime
