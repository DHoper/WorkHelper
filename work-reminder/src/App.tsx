import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard/Dashboard'
import EyeCare from './pages/EyeCare/EyeCare'
import Tasks from './pages/Tasks/Tasks'
import WorkTime from './pages/WorkTime/WorkTime'
import Recording from './pages/Recording/Recording'
import Settings from './pages/Settings/Settings'
import './index.css'

function App() {
  return (
    <BrowserRouter>
      <div className="flex h-screen overflow-hidden" data-theme="light">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-base-200">
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
    </BrowserRouter>
  )
}

export default App
