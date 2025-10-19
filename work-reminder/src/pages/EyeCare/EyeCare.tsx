import { useState, useEffect } from 'react'
import { Play, Pause, RotateCcw, Settings as SettingsIcon, X, Check } from 'lucide-react'
import { useAppStore } from '../../stores/useAppStore'
import EyeCareReminderModal from '../../components/EyeCareReminderModal'

const EyeCare = () => {
  const { eyeCare, initializeEyeCare, updateEyeCareState } = useAppStore()
  const [showModal, setShowModal] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [tempInterval, setTempInterval] = useState(60)

  useEffect(() => {
    initializeEyeCare()
    
    // 監聽完成事件
    const unsubscribeComplete = window.electronAPI.eyeCare.onComplete(() => {
      setShowModal(true)
    })
    
    return () => {
      unsubscribeComplete()
      setShowModal(false)
    }
  }, [initializeEyeCare])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const progress = eyeCare.config.interval > 0
    ? Math.max(0, Math.min(100, (eyeCare.remainingSeconds / (eyeCare.config.interval * 60)) * 100))
    : 0
  const circumference = 377 // 2 * π * 60
  const offset = circumference * (1 - progress / 100)

  return (
    <div className="h-full p-6 bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-lg mx-auto flex flex-col items-center justify-center h-full gap-6">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">護眼提醒</h2>
          <p className="text-sm text-gray-500 mt-1">定時休息，保護視力</p>
        </div>

        {/* Timer Circle */}
        <div className="relative p-8 border border-gray-200 rounded-2xl bg-white shadow-lg hover:shadow-xl transition-shadow duration-300">
          <svg width="200" height="200" viewBox="0 0 140 140" className="-rotate-90">
          <circle
            cx="70"
            cy="70"
            r="60"
            fill="none"
            stroke="currentColor"
            strokeWidth="5"
            className="text-gray-200"
          />
          <circle
            cx="70"
            cy="70"
            r="60"
            fill="none"
            stroke="currentColor"
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="text-gray-900 transition-all duration-300"
          />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-4xl font-light text-gray-900">{formatTime(eyeCare.remainingSeconds)}</div>
            <div className="text-xs font-medium text-gray-500 mt-2">
              {eyeCare.isPaused ? '已暫停' : eyeCare.config.enabled ? '運行中' : '已停止'}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-2">
          <button
            className={`w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-300 transform hover:scale-110 shadow-lg ${
              eyeCare.config.enabled
                ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-200'
                : 'bg-gradient-to-br from-gray-900 to-gray-700 hover:from-gray-800 hover:to-gray-600 text-white'
            }`}
            onClick={async () => {
              const newState = await window.electronAPI.eyeCare.setConfig({ enabled: !eyeCare.config.enabled })
              updateEyeCareState(newState)
            }}
          >
            {eyeCare.config.enabled ?
              <Pause size={18} strokeWidth={2} /> :
              <Play size={18} strokeWidth={2} />
            }
          </button>

          {eyeCare.config.enabled && (
            <div className="flex items-center gap-1.5 p-1 bg-gray-100 rounded-lg">
              <button
                className={`w-9 h-9 rounded-md flex items-center justify-center transition-all ${
                  eyeCare.isPaused
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                onClick={async () => {
                  const newState = eyeCare.isPaused
                    ? await window.electronAPI.eyeCare.resume()
                    : await window.electronAPI.eyeCare.pause()
                  updateEyeCareState(newState)
                }}
              >
                {eyeCare.isPaused ? <Play size={14} strokeWidth={2} /> : <Pause size={14} strokeWidth={2} />}
              </button>
              <button
                className="w-9 h-9 rounded-md text-gray-600 hover:text-gray-900 flex items-center justify-center transition-all"
                onClick={async () => {
                  const newState = await window.electronAPI.eyeCare.restart()
                  updateEyeCareState(newState)
                }}
              >
                <RotateCcw size={14} strokeWidth={2} />
              </button>
            </div>
          )}

          <button
            className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ml-2 ${
              showSettings
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
            }`}
            onClick={() => setShowSettings(!showSettings)}
          >
            <SettingsIcon size={16} strokeWidth={2} />
          </button>
        </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="w-full max-w-sm p-5 border border-gray-200 rounded-xl bg-white shadow-lg animate-scale-up">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-900">間隔</h3>
            <button
              className="w-7 h-7 rounded hover:bg-gray-100 flex items-center justify-center text-gray-400 transition-all"
              onClick={() => setShowSettings(false)}
            >
              <X size={16} strokeWidth={2} />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min="5"
              max="120"
              step="5"
              value={tempInterval}
              onChange={(e) => setTempInterval(Number(e.target.value))}
              className="range range-sm flex-1 [&::-webkit-slider-thumb]:bg-gray-900 [&::-webkit-slider-runnable-track]:bg-gray-200"
            />
            <span className="text-sm font-mono font-semibold text-gray-900 w-10 text-right">{tempInterval}</span>
            <button
              className="w-8 h-8 rounded-lg bg-gray-900 text-white flex items-center justify-center hover:bg-gray-800 transition-all text-sm"
              onClick={async () => {
                await window.electronAPI.eyeCare.setConfig({ interval: tempInterval })
                setShowSettings(false)
              }}
            >
              <Check size={16} strokeWidth={2} />
            </button>
          </div>
        </div>
      )}

        <EyeCareReminderModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onPostpone={async (minutes) => {
            await window.electronAPI.eyeCare.postpone(minutes)
            setShowModal(false)
          }}
          onSkip={async () => {
            setShowModal(false)
            await window.electronAPI.eyeCare.restart()
          }}
        />
      </div>
    </div>
  )
}

export default EyeCare
