import { useState, useEffect } from 'react'
import { Clock, LogIn, LogOut } from 'lucide-react'

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

  useEffect(() => {
    loadState()
    window.electronAPI.workTime.onStateUpdate((newState) => setState(newState))
    window.electronAPI.workTime.onOffTimeReached(() => {
      // 下班時間到了的提示已由系統通知處理
    })
  }, [])

  const loadState = async () => {
    const currentState = await window.electronAPI.workTime.getState()
    setState(currentState)
  }

  const handleClockIn = async () => {
    const newState = await window.electronAPI.workTime.clockIn()
    setState(newState)
  }

  const handleClockOut = async () => {
    try {
      const newState = await window.electronAPI.workTime.clockOut()
      setState(newState)
    } catch (error: any) {
      alert(error.message || '打卡失敗')
    }
  }

  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-2 text-base-content/60">
        <Clock size={20} strokeWidth={1.5} />
        <span className="text-sm">上下班打卡</span>
      </div>

      {/* Status Display */}
      <div className="card bg-base-100 border border-base-300 w-full max-w-sm">
        <div className="card-body p-6">
          {state.isClockedIn ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-base-content/60">上班時間</span>
                <span className="text-2xl font-light tabular-nums">{state.clockInTime}</span>
              </div>

              <div className="divider my-0"></div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-base-content/60">預計下班</span>
                <span className="text-2xl font-light tabular-nums text-primary">
                  {state.estimatedOffTime}
                </span>
              </div>

              {state.clockOutTime && (
                <>
                  <div className="divider my-0"></div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-base-content/60">下班時間</span>
                    <span className="text-2xl font-light tabular-nums text-success">
                      {state.clockOutTime}
                    </span>
                  </div>
                </>
              )}

              <div className="badge badge-success badge-sm w-full">已打卡上班</div>
            </div>
          ) : (
            <div className="text-center py-4">
              <div className="text-base-content/40 text-sm mb-2">尚未打卡</div>
              <div className="badge badge-ghost badge-sm">未上班</div>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        {!state.isClockedIn ? (
          <button
            className="btn btn-primary gap-2"
            onClick={handleClockIn}
          >
            <LogIn size={18} strokeWidth={1.5} />
            上班打卡
          </button>
        ) : !state.clockOutTime ? (
          <button
            className="btn btn-error gap-2"
            onClick={handleClockOut}
          >
            <LogOut size={18} strokeWidth={1.5} />
            下班打卡
          </button>
        ) : (
          <div className="text-sm text-base-content/40">今日已完成打卡</div>
        )}
      </div>
    </div>
  )
}

export default WorkTime
