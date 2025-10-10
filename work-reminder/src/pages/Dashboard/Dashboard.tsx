import { useState, useEffect } from 'react'
import { Eye, CheckSquare, Clock, Mic } from 'lucide-react'

const Dashboard = () => {
  const [taskStats, setTaskStats] = useState({ total: 0, completed: 0 })
  const [workTimeState, setWorkTimeState] = useState<any>({
    isClockedIn: false,
    clockInTime: null,
    estimatedOffTime: null
  })
  const [recordingCount, setRecordingCount] = useState(0)

  useEffect(() => {
    loadStats()
    loadWorkTime()
    loadRecordings()
    window.electronAPI.workTime.onStateUpdate((newState) => setWorkTimeState(newState))
  }, [])

  const loadStats = async () => {
    const tasks = await window.electronAPI.tasks.getAll()
    setTaskStats({
      total: tasks.length,
      completed: tasks.filter((t: any) => t.is_completed).length
    })
  }

  const loadWorkTime = async () => {
    const state = await window.electronAPI.workTime.getState()
    setWorkTimeState(state)
  }

  const loadRecordings = async () => {
    const recordings = await window.electronAPI.recording.getAll()
    setRecordingCount(recordings.length)
  }

  return (
    <div className="p-6">
      {/* Status Grid */}
      <div className="grid grid-cols-2 gap-3 max-w-xl">
        {/* Eye Care Card */}
        <div className="card bg-base-100 border border-base-300 hover:shadow-lg transition-all cursor-pointer group">
          <div className="card-body p-5">
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center group-hover:bg-violet-200 transition-colors">
                <Eye size={24} strokeWidth={1.5} className="text-violet-600" />
              </div>
              <div className="text-center">
                <div className="text-xs text-base-content/60">護眼提醒</div>
                <div className="text-sm font-medium text-success">運行中</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tasks Card */}
        <div className="card bg-base-100 border border-base-300 hover:shadow-lg transition-all cursor-pointer group">
          <div className="card-body p-5">
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-pink-100 flex items-center justify-center group-hover:bg-pink-200 transition-colors">
                <CheckSquare size={24} strokeWidth={1.5} className="text-pink-600" />
              </div>
              <div className="text-center">
                <div className="text-xs text-base-content/60">今日任務</div>
                <div className="text-sm font-medium">
                  {taskStats.completed} / {taskStats.total}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Work Time Card */}
        <div className="card bg-base-100 border border-base-300 hover:shadow-lg transition-all cursor-pointer group">
          <div className="card-body p-5">
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                <Clock size={24} strokeWidth={1.5} className="text-blue-600" />
              </div>
              <div className="text-center">
                <div className="text-xs text-base-content/60">下班時間</div>
                {workTimeState.isClockedIn ? (
                  <div className="text-sm font-medium text-primary">
                    {workTimeState.estimatedOffTime}
                  </div>
                ) : (
                  <div className="text-sm font-medium text-warning">未打卡</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Recording Card */}
        <div className="card bg-base-100 border border-base-300 hover:shadow-lg transition-all cursor-pointer group">
          <div className="card-body p-5">
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
                <Mic size={24} strokeWidth={1.5} className="text-emerald-600" />
              </div>
              <div className="text-center">
                <div className="text-xs text-base-content/60">會議錄音</div>
                <div className="text-sm font-medium">{recordingCount} 個錄音</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard