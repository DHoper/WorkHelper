import { Minus, X } from 'lucide-react'

const TitleBar = () => {
  return (
    <div className="titlebar h-10 bg-gradient-to-r from-slate-800 to-slate-700 flex items-center justify-between px-4">
      {/* Logo and Title */}
      <div className="flex items-center gap-2 text-white">
        <div className="w-5 h-5 rounded-lg bg-white/20 flex items-center justify-center text-xs font-bold">
          W
        </div>
        <span className="text-sm font-medium">工作助手</span>
      </div>

      {/* Window Controls */}
      <div className="flex items-center gap-1 no-drag">
        <button
          className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-white transition-colors"
          onClick={() => {
            const win = (window as any).electronAPI?.window
            if (win) win.minimize()
          }}
        >
          <Minus size={14} strokeWidth={2} />
        </button>
        <button
          className="w-8 h-8 rounded-lg hover:bg-red-500 flex items-center justify-center text-white transition-colors"
          onClick={() => {
            const win = (window as any).electronAPI?.window
            if (win) win.close()
          }}
        >
          <X size={14} strokeWidth={2} />
        </button>
      </div>
    </div>
  )
}

export default TitleBar
