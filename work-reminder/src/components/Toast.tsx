import { useEffect } from 'react'
import { CheckCircle2, XCircle, AlertCircle, Info, X } from 'lucide-react'

interface ToastProps {
  isOpen: boolean
  message: string
  type?: 'success' | 'error' | 'warning' | 'info'
  duration?: number
  onClose: () => void
}

const Toast = ({
  isOpen,
  message,
  type = 'info',
  duration = 3000,
  onClose
}: ToastProps) => {
  useEffect(() => {
    if (isOpen && duration > 0) {
      const timer = setTimeout(onClose, duration)
      return () => clearTimeout(timer)
    }
  }, [isOpen, duration, onClose])

  if (!isOpen) return null

  const icons = {
    success: <CheckCircle2 size={20} strokeWidth={1.5} />,
    error: <XCircle size={20} strokeWidth={1.5} />,
    warning: <AlertCircle size={20} strokeWidth={1.5} />,
    info: <Info size={20} strokeWidth={1.5} />
  }

  const colors = {
    success: 'alert-success',
    error: 'alert-error',
    warning: 'alert-warning',
    info: 'alert-info'
  }

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-in-right">
      <div className={`alert ${colors[type]} shadow-lg max-w-md`}>
        {icons[type]}
        <span className="text-sm">{message}</span>
        <button
          className="btn btn-sm btn-circle btn-ghost"
          onClick={onClose}
        >
          <X size={16} strokeWidth={1.5} />
        </button>
      </div>
    </div>
  )
}

export default Toast
