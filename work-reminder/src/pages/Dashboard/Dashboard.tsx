import { useEffect, useMemo } from 'react'
import { Eye, CheckSquare, Clock, Mic } from 'lucide-react'
import { useAppStore } from '../../stores/useAppStore'

const Dashboard = () => {
  const { 
    tasks, 
    workTime, 
    recordingCount,
    loadTasks, 
    initializeWorkTime,
    loadRecordingCount
  } = useAppStore()

  useEffect(() => {
    loadTasks()
    initializeWorkTime()
    loadRecordingCount()
  }, [loadTasks, initializeWorkTime, loadRecordingCount])

  // 計算任務統計（使用 useMemo 避免重複計算）
  const taskStats = useMemo(() => ({
    total: tasks.length,
    completed: tasks.filter((t) => t.is_completed).length
  }), [tasks])

  return (
    <div className="p-6 bg-white h-full">
      {/* Header */}
      <div className="mb-5">
        <h1 className="text-xl font-bold text-gray-900">工作台</h1>
      </div>

      {/* Status Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Eye Care Card */}
        <div className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-all bg-white">
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-lg bg-gray-900 flex items-center justify-center">
              <Eye size={18} strokeWidth={2} className="text-white" />
            </div>
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
          </div>
          <p className="text-xs text-gray-500">護眼提醒</p>
          <p className="text-sm font-semibold text-gray-900 mt-0.5">運行中</p>
        </div>

        {/* Tasks Card */}
        <div className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-all bg-white">
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-lg bg-gray-900 flex items-center justify-center">
              <CheckSquare size={18} strokeWidth={2} className="text-white" />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-lg font-bold text-gray-900">{taskStats.completed}</span>
              <span className="text-xs text-gray-500">/ {taskStats.total}</span>
            </div>
          </div>
          <p className="text-xs text-gray-500">任務</p>
          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
            <div
              className="bg-gray-900 h-1.5 rounded-full transition-all"
              style={{ width: `${taskStats.total > 0 ? (taskStats.completed / taskStats.total) * 100 : 0}%` }}
            ></div>
          </div>
        </div>

        {/* Work Time Card */}
        <div className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-all bg-white">
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-lg bg-gray-900 flex items-center justify-center">
              <Clock size={18} strokeWidth={2} className="text-white" />
            </div>
            {workTime.isClockedIn ? (
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
            ) : (
              <div className="w-2 h-2 rounded-full bg-gray-300"></div>
            )}
          </div>
          <p className="text-xs text-gray-500">下班時間</p>
          {workTime.isClockedIn ? (
            <p className="text-sm font-semibold text-gray-900 mt-0.5">{workTime.estimatedOffTime}</p>
          ) : (
            <p className="text-sm font-semibold text-gray-400 mt-0.5">未打卡</p>
          )}
        </div>

        {/* Recording Card */}
        <div className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-all bg-white">
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-lg bg-gray-900 flex items-center justify-center">
              <Mic size={18} strokeWidth={2} className="text-white" />
            </div>
            <span className="text-lg font-bold text-gray-900">{recordingCount}</span>
          </div>
          <p className="text-xs text-gray-500">錄音</p>
        </div>
      </div>
    </div>
  )
}

export default Dashboard