import { HashRouter, Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import TitleBar from './components/TitleBar'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard/Dashboard'
import EyeCare from './pages/EyeCare/EyeCare'
import Tasks from './pages/Tasks/Tasks'
import WorkTime from './pages/WorkTime/WorkTime'
import Recording from './pages/Recording/Recording'
import Settings from './pages/Settings/Settings'
import { useAppStore } from './stores/useAppStore'
import './index.css'

function App() {
  const cleanup = useAppStore((state) => state.cleanup)

  // 清理所有訂閱當應用卸載時
  useEffect(() => {
    return () => {
      cleanup()
    }
  }, [cleanup])

  return (
    <HashRouter>
      <div className="flex flex-col h-screen overflow-hidden min-w-[520px]" data-theme="light">
        <TitleBar />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-y-auto bg-gray-50 min-w-0">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/eyecare" element={<EyeCare />} />
              <Route path="/tasks" element={<Tasks />} />
              <Route path="/worktime" element={<WorkTime />} />
              <Route path="/recording" element={<Recording />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </main>
        </div>
      </div>
    </HashRouter>
  )
}

export default App
