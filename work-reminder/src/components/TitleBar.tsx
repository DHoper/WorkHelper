import { Minus, X } from 'lucide-react'
import { useEffect, useState } from 'react'

const TitleBar = () => {
  const [apiReady, setApiReady] = useState(false)

  useEffect(() => {
    // 檢查 API 是否可用
    const checkAPI = () => {
      const ready = !!(window.electronAPI?.window?.minimize && window.electronAPI?.window?.close)
      setApiReady(ready)
      if (!ready) {
        console.error('ElectronAPI not ready:', {
          hasElectronAPI: !!window.electronAPI,
          hasWindow: !!window.electronAPI?.window,
          hasMinimize: !!window.electronAPI?.window?.minimize,
          hasClose: !!window.electronAPI?.window?.close
        })
      } else {
        console.log('ElectronAPI ready')
      }
    }

    checkAPI()

    // 設置定時器持續檢查（開發環境可能需要）
    const timer = setInterval(checkAPI, 1000)

    return () => clearInterval(timer)
  }, [])

  const handleMinimize = async () => {
    console.log('Minimize button clicked, apiReady:', apiReady)
    try {
      if (window.electronAPI?.window?.minimize) {
        await window.electronAPI.window.minimize()
        console.log('Minimize called successfully')
      } else {
        console.error('window.electronAPI.window.minimize is not available')
      }
    } catch (err) {
      console.error('Minimize failed:', err)
    }
  }

  const handleClose = async () => {
    console.log('Close button clicked, apiReady:', apiReady)
    try {
      if (window.electronAPI?.window?.close) {
        await window.electronAPI.window.close()
        console.log('Close called successfully')
      } else {
        console.error('window.electronAPI.window.close is not available')
      }
    } catch (err) {
      console.error('Close failed:', err)
    }
  }

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
          onClick={handleMinimize}
        >
          <Minus size={14} strokeWidth={2} />
        </button>
        <button
          className="w-8 h-8 rounded-lg hover:bg-red-500 flex items-center justify-center text-white transition-colors"
          onClick={handleClose}
        >
          <X size={14} strokeWidth={2} />
        </button>
      </div>
    </div>
  )
}

export default TitleBar
