import { AlertTriangle, X } from 'lucide-react'

interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onCancel: () => void
  type?: 'warning' | 'danger' | 'info'
}

const ConfirmDialog = ({
  isOpen,
  title,
  message,
  confirmText = '確定',
  cancelText = '取消',
  onConfirm,
  onCancel,
  type = 'warning'
}: ConfirmDialogProps) => {
  if (!isOpen) return null

  const colors = {
    warning: 'text-warning',
    danger: 'text-error',
    info: 'text-info'
  }

  const buttonColors = {
    warning: 'btn-warning',
    danger: 'btn-error',
    info: 'btn-info'
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in" onClick={onCancel}>
      <div className="card bg-base-100 w-96 min-w-[320px] shadow-2xl border border-base-300/30 animate-scale-up" onClick={(e) => e.stopPropagation()}>
        <div className="card-body p-6">
          <button
            className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
            onClick={onCancel}
          >
            <X size={16} strokeWidth={1.5} />
          </button>

          <div className="flex items-start gap-4 mb-4">
            <div className={`w-12 h-12 rounded-full bg-${type}/10 flex items-center justify-center flex-shrink-0`}>
              <AlertTriangle size={24} strokeWidth={1.5} className={colors[type]} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold mb-2">{title}</h3>
              <p className="text-sm text-base-content/70">{message}</p>
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <button
              className="btn btn-ghost btn-sm"
              onClick={onCancel}
            >
              {cancelText}
            </button>
            <button
              className={`btn ${buttonColors[type]} btn-sm`}
              onClick={onConfirm}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ConfirmDialog
