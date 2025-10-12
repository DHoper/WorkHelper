import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Eye,
  CheckSquare,
  Clock,
  Mic,
  Settings
} from 'lucide-react'

const Sidebar = () => {
  const navItems = [
    { path: '/', icon: LayoutDashboard, tooltip: '儀表板' },
    { path: '/eyecare', icon: Eye, tooltip: '護眼提醒' },
    { path: '/tasks', icon: CheckSquare, tooltip: '代辦事項' },
    { path: '/worktime', icon: Clock, tooltip: '下班提醒' },
    { path: '/recording', icon: Mic, tooltip: '會議錄音' },
    { path: '/settings', icon: Settings, tooltip: '設定' },
  ]

  return (
    <aside className="w-16 bg-white border-r border-gray-200 flex flex-col items-center py-6 gap-2">
      <div className="mb-4">
        <div className="w-10 h-10 rounded-lg bg-gray-900 flex items-center justify-center">
          <span className="text-white font-bold text-lg">W</span>
        </div>
      </div>

      {navItems.map(item => (
        <div key={item.path} className="tooltip tooltip-right" data-tip={item.tooltip}>
          <NavLink
            to={item.path}
            className={({ isActive }) =>
              `w-11 h-11 rounded-lg flex items-center justify-center transition-all
              ${isActive
                ? 'bg-gray-900 text-white'
                : 'hover:bg-gray-100 text-gray-500 hover:text-gray-900'}`
            }
          >
            <item.icon size={18} strokeWidth={2} />
          </NavLink>
        </div>
      ))}

      <div className="flex-1"></div>

      <div className="w-11 h-11 rounded-lg bg-gray-100 flex items-center justify-center">
        <div className="w-7 h-7 rounded-full bg-gray-400"></div>
      </div>
    </aside>
  )
}

export default Sidebar