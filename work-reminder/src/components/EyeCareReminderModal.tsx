import { X, Clock, Eye } from 'lucide-react'

interface EyeCareReminderModalProps {
  isOpen: boolean
  onClose: () => void
  onPostpone: (minutes: number) => void
  onSkip: () => void
}

const EyeCareReminderModal = ({
  isOpen,
  onClose,
  onPostpone,
  onSkip
}: EyeCareReminderModalProps) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in" onClick={onClose}>
      <div className="card bg-base-100 w-80 min-w-[280px] shadow-2xl border border-base-300/30 animate-scale-up" onClick={(e) => e.stopPropagation()}>
        <div className="card-body p-6 items-center text-center">
          <button
            className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
            onClick={onClose}
          >
            <X size={16} strokeWidth={1.5} />
          </button>

          <div className="w-16 h-16 rounded-2xl bg-violet-100 flex items-center justify-center mb-3">
            <Eye size={32} strokeWidth={1.5} className="text-violet-600" />
          </div>

          <h3 className="text-lg font-medium">休息時間到了</h3>
          <p className="text-xs text-base-content/60 mt-1">保護您的視力健康</p>

          {/* 20-20-20 Rule */}
          <div className="flex items-center gap-3 my-4 px-4 py-3 rounded-lg bg-base-200/50">
            <div className="text-center">
              <div className="text-2xl font-light text-primary">20</div>
              <div className="text-xs opacity-60">秒</div>
            </div>
            <div className="text-base opacity-30">·</div>
            <div className="text-center">
              <div className="text-2xl font-light text-primary">20</div>
              <div className="text-xs opacity-60">英尺</div>
            </div>
            <div className="text-base opacity-30">·</div>
            <div className="text-center">
              <div className="text-2xl font-light text-primary">20</div>
              <div className="text-xs opacity-60">眨眼</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="w-full space-y-2">
            <div className="flex gap-2">
              <button
                className="btn btn-sm btn-outline flex-1 gap-1"
                onClick={() => onPostpone(5)}
              >
                <Clock size={14} strokeWidth={1.5} />
                5分
              </button>
              <button
                className="btn btn-sm btn-outline flex-1 gap-1"
                onClick={() => onPostpone(10)}
              >
                <Clock size={14} strokeWidth={1.5} />
                10分
              </button>
              <button
                className="btn btn-sm btn-outline flex-1 gap-1"
                onClick={() => onPostpone(15)}
              >
                <Clock size={14} strokeWidth={1.5} />
                15分
              </button>
            </div>

            <button
              className="btn btn-primary btn-sm btn-block"
              onClick={onSkip}
            >
              已休息，開始下一輪
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EyeCareReminderModal