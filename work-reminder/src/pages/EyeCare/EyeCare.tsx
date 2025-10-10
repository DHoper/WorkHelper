import { useState, useEffect } from 'react'
import { Play, Pause, RotateCcw, Settings as SettingsIcon, Eye } from 'lucide-react'
import EyeCareReminderModal from '../../components/EyeCareReminderModal'

const EyeCare = () => {
  const [state, setState] = useState<any>({
    remainingSeconds: 0,
    config: { interval: 60, enabled: true },
    isPaused: false
  })
  const [showModal, setShowModal] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [tempInterval, setTempInterval] = useState(60)

  useEffect(() => {
    window.electronAPI.eyeCare.getState().then(setState)
    window.electronAPI.eyeCare.onTick((newState) => setState(newState))
    window.electronAPI.eyeCare.onComplete(() => setShowModal(true))
  }, [])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const progress = state.config.interval > 0
    ? Math.max(0, Math.min(100, (state.remainingSeconds / (state.config.interval * 60)) * 100))
    : 0
  const circumference = 377 // 2 * π * 60
  const offset = circumference * (1 - progress / 100)

  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-2 text-base-content/60">
        <Eye size={20} strokeWidth={1.5} />
        <span className="text-sm">護眼提醒</span>
      </div>

      {/* Timer Circle */}
      <div className="relative">
        <svg width="220" height="220" viewBox="0 0 140 140" className="-rotate-90">
          <circle
            cx="70"
            cy="70"
            r="60"
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
            className="text-base-300"
          />
          <circle
            cx="70"
            cy="70"
            r="60"
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="text-primary transition-all duration-300"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-4xl font-light tabular-nums">{formatTime(state.remainingSeconds)}</div>
          <div className="text-xs text-base-content/50 mt-1">
            {state.isPaused ? '已暫停' : state.config.enabled ? '運行中' : '已停止'}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-2">
        <button
          className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all
            ${state.config.enabled
              ? 'bg-error/10 hover:bg-error/20 text-error'
              : 'bg-success/10 hover:bg-success/20 text-success'}`}
          onClick={async () => {
            const newState = await window.electronAPI.eyeCare.setConfig({ enabled: !state.config.enabled })
            setState(newState)
          }}
        >
          {state.config.enabled ? <Pause size={18} strokeWidth={1.5} /> : <Play size={18} strokeWidth={1.5} />}
        </button>

        {state.config.enabled && (
          <>
            <button
              className="w-12 h-12 rounded-xl bg-base-200 hover:bg-base-300 text-base-content/70 flex items-center justify-center transition-all"
              onClick={async () => {
                const newState = state.isPaused
                  ? await window.electronAPI.eyeCare.resume()
                  : await window.electronAPI.eyeCare.pause()
                setState(newState)
              }}
            >
              {state.isPaused ? <Play size={18} strokeWidth={1.5} /> : <Pause size={18} strokeWidth={1.5} />}
            </button>
            <button
              className="w-12 h-12 rounded-xl bg-base-200 hover:bg-base-300 text-base-content/70 flex items-center justify-center transition-all"
              onClick={async () => {
                const newState = await window.electronAPI.eyeCare.restart()
                setState(newState)
              }}
            >
              <RotateCcw size={18} strokeWidth={1.5} />
            </button>
          </>
        )}

        <div className="w-px bg-base-300 mx-1" />

        <button
          className="w-12 h-12 rounded-xl bg-base-200 hover:bg-base-300 text-base-content/70 flex items-center justify-center transition-all"
          onClick={() => setShowSettings(!showSettings)}
        >
          <SettingsIcon size={18} strokeWidth={1.5} />
        </button>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="card bg-base-100 border border-base-300 shadow-sm w-full max-w-xs">
          <div className="card-body p-4">
            <div className="flex items-center gap-3">
              <span className="text-xs text-base-content/60">間隔</span>
              <input
                type="range"
                min="5"
                max="120"
                step="5"
                value={tempInterval}
                onChange={(e) => setTempInterval(Number(e.target.value))}
                className="range range-xs range-primary flex-1"
              />
              <span className="text-sm font-mono w-12 text-right">{tempInterval}m</span>
              <button
                className="btn btn-primary btn-xs btn-square"
                onClick={async () => {
                  await window.electronAPI.eyeCare.setConfig({ interval: tempInterval })
                  setShowSettings(false)
                }}
              >
                ✓
              </button>
            </div>
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
  )
}

export default EyeCare