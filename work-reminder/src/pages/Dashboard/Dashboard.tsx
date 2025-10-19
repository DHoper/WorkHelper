import { useEffect, useMemo, useState } from 'react'
import { Eye, CheckSquare, Clock, Mic, Calendar, TrendingUp, AlertCircle, ArrowRight } from 'lucide-react'
import { useAppStore } from '../../stores/useAppStore'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { zhTW } from 'date-fns/locale'

const Dashboard = () => {
  const navigate = useNavigate()
  const {
    tasks,
    workTime,
    recordingCount,
    eyeCare,
    loadTasks,
    initializeWorkTime,
    loadRecordingCount,
    initializeEyeCare
  } = useAppStore()

  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    loadTasks()
    initializeWorkTime()
    loadRecordingCount()
    initializeEyeCare()

    // 更新時鐘
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [loadTasks, initializeWorkTime, loadRecordingCount, initializeEyeCare])

  // 計算任務統計（使用 useMemo 避免重複計算）
  const taskStats = useMemo(() => {
    const total = tasks.length
    const completed = tasks.filter((t) => t.is_completed === 1).length
    const pending = total - completed
    const todayTasks = tasks.filter(t => t.is_completed === 0 && t.category === 'daily')
    const highPriority = tasks.filter(t => t.is_completed === 0 && t.priority === 'high')

    return { total, completed, pending, todayTasks: todayTasks.length, highPriority: highPriority.length }
  }, [tasks])

  const completionRate = taskStats.total > 0
    ? Math.round((taskStats.completed / taskStats.total) * 100)
    : 0

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="p-6 bg-gradient-to-br from-gray-50 to-white h-full overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header with Time */}
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">工作台</h1>
            <p className="text-sm text-gray-500 mt-1">
              {format(currentTime, 'yyyy年MM月dd日 EEEE', { locale: zhTW })}
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-light text-gray-900 tabular-nums">
              {format(currentTime, 'HH:mm:ss')}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {format(currentTime, 'a', { locale: zhTW })}
            </div>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Eye Care Card */}
          <div
            className="group p-5 border border-gray-200 rounded-xl hover:border-gray-400 hover:shadow-lg transition-all duration-300 bg-white cursor-pointer"
            onClick={() => navigate('/eyecare')}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-900 to-gray-700 flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300">
                <Eye size={18} strokeWidth={2} className="text-white" />
              </div>
              <div className={`w-2.5 h-2.5 rounded-full ${eyeCare.config.enabled ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}></div>
            </div>
            <p className="text-xs font-medium text-gray-500 mb-1">護眼提醒</p>
            {eyeCare.config.enabled ? (
              <p className="text-sm font-semibold text-gray-900">{formatTime(eyeCare.remainingSeconds)}</p>
            ) : (
              <p className="text-sm font-semibold text-gray-400">已停止</p>
            )}
          </div>

          {/* Tasks Card */}
          <div
            className="group p-5 border border-gray-200 rounded-xl hover:border-gray-400 hover:shadow-lg transition-all duration-300 bg-white cursor-pointer"
            onClick={() => navigate('/tasks')}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-900 to-gray-700 flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300">
                <CheckSquare size={18} strokeWidth={2} className="text-white" />
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-bold text-gray-900">{taskStats.completed}</span>
                <span className="text-xs text-gray-500">/ {taskStats.total}</span>
              </div>
            </div>
            <p className="text-xs font-medium text-gray-500 mb-2">任務完成率</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-gray-900 to-gray-700 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${completionRate}%` }}
                ></div>
              </div>
              <span className="text-xs font-semibold text-gray-900">{completionRate}%</span>
            </div>
          </div>

          {/* Work Time Card */}
          <div
            className="group p-5 border border-gray-200 rounded-xl hover:border-gray-400 hover:shadow-lg transition-all duration-300 bg-white cursor-pointer"
            onClick={() => navigate('/worktime')}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-900 to-gray-700 flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300">
                <Clock size={18} strokeWidth={2} className="text-white" />
              </div>
              {workTime.isClockedIn ? (
                <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></div>
              ) : (
                <div className="w-2.5 h-2.5 rounded-full bg-gray-300"></div>
              )}
            </div>
            <p className="text-xs font-medium text-gray-500 mb-1">預計下班</p>
            {workTime.isClockedIn ? (
              <p className="text-sm font-semibold text-gray-900">{workTime.estimatedOffTime}</p>
            ) : (
              <p className="text-sm font-semibold text-gray-400">未打卡</p>
            )}
          </div>

          {/* Recording Card */}
          <div
            className="group p-5 border border-gray-200 rounded-xl hover:border-gray-400 hover:shadow-lg transition-all duration-300 bg-white cursor-pointer"
            onClick={() => navigate('/recording')}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-900 to-gray-700 flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300">
                <Mic size={18} strokeWidth={2} className="text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">{recordingCount}</span>
            </div>
            <p className="text-xs font-medium text-gray-500 mb-1">會議錄音</p>
            <p className="text-sm font-semibold text-gray-900">{recordingCount} 個錄音</p>
          </div>
        </div>

        {/* Task Overview Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Today's Tasks */}
          <div className="p-5 border border-gray-200 rounded-xl bg-white hover:shadow-md transition-shadow duration-300">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <TrendingUp size={16} className="text-gray-600" />
                任務概覽
              </h3>
              <button
                onClick={() => navigate('/tasks')}
                className="text-xs text-gray-600 hover:text-gray-900 flex items-center gap-1 transition-colors"
              >
                查看全部 <ArrowRight size={12} />
              </button>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">待辦事項</span>
                <span className="text-lg font-bold text-gray-900">{taskStats.pending}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">今日任務</span>
                <span className="text-lg font-bold text-gray-900">{taskStats.todayTasks}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <span className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle size={14} />
                  高優先級
                </span>
                <span className="text-lg font-bold text-red-600">{taskStats.highPriority}</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="p-5 border border-gray-200 rounded-xl bg-white hover:shadow-md transition-shadow duration-300">
            <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar size={16} className="text-gray-600" />
              快速操作
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => navigate('/tasks')}
                className="p-4 bg-gray-900 hover:bg-gray-800 text-white rounded-lg transition-colors duration-300 text-sm font-medium"
              >
                新增任務
              </button>
              <button
                onClick={() => navigate('/recording')}
                className="p-4 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-lg transition-colors duration-300 text-sm font-medium"
              >
                開始錄音
              </button>
              <button
                onClick={() => navigate('/calendar')}
                className="p-4 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-lg transition-colors duration-300 text-sm font-medium"
              >
                查看日曆
              </button>
              {!workTime.isClockedIn ? (
                <button
                  onClick={() => navigate('/worktime')}
                  className="p-4 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors duration-300 text-sm font-medium"
                >
                  上班打卡
                </button>
              ) : (
                <button
                  onClick={() => navigate('/worktime')}
                  className="p-4 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors duration-300 text-sm font-medium"
                >
                  下班打卡
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Recent Tasks Preview */}
        {tasks.length > 0 && (
          <div className="p-5 border border-gray-200 rounded-xl bg-white hover:shadow-md transition-shadow duration-300">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-900">最近任務</h3>
              <button
                onClick={() => navigate('/tasks')}
                className="text-xs text-gray-600 hover:text-gray-900 flex items-center gap-1 transition-colors"
              >
                查看全部 <ArrowRight size={12} />
              </button>
            </div>
            <div className="space-y-2">
              {tasks.slice(0, 3).map(task => (
                <div
                  key={task.id}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                  onClick={() => navigate('/tasks')}
                >
                  <div className={`w-2 h-2 rounded-full ${task.is_completed === 1 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  <span className={`flex-1 text-sm ${task.is_completed === 1 ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                    {task.title}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    task.priority === 'high' ? 'bg-red-100 text-red-700' :
                    task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-200 text-gray-600'
                  }`}>
                    {task.priority === 'high' ? '高' : task.priority === 'medium' ? '中' : '低'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard