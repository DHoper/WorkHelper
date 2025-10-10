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
    { path: '/recording', icon: Mic, disabled: true, tooltip: '會議錄音' },
    { path: '/settings', icon: Settings, tooltip: '設定' },
  ]

  return (
    <aside className="w-14 bg-base-100 flex flex-col items-center py-4 gap-2 border-r border-base-200">
      {navItems.map(item => (
        <div key={item.path} className="tooltip tooltip-right" data-tip={item.tooltip}>
          <NavLink
            to={item.path}
            className={({ isActive }) =>
              `w-10 h-10 rounded-lg flex items-center justify-center transition-all
              ${isActive
                ? 'bg-primary text-primary-content'
                : 'hover:bg-base-200 text-base-content/70 hover:text-base-content'}
              ${item.disabled ? 'opacity-30 pointer-events-none' : ''}`
            }
          >
            <item.icon size={18} strokeWidth={1.5} />
          </NavLink>
        </div>
      ))}
    </aside>
  )
}

export default Sidebar