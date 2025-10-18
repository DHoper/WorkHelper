import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Eye,
  CheckSquare,
  Clock,
  Mic,
  Calendar,
  Settings
} from 'lucide-react'
import { useState, useEffect } from 'react'

const Sidebar = () => {
  const location = useLocation()
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)

  const navItems = [
    { path: '/', icon: LayoutDashboard, label: '儀表板', color: 'blue' },
    { path: '/eyecare', icon: Eye, label: '護眼提醒', color: 'green' },
    { path: '/tasks', icon: CheckSquare, label: '代辦事項', color: 'purple' },
    { path: '/worktime', icon: Clock, label: '下班提醒', color: 'orange' },
    { path: '/recording', icon: Mic, label: '會議錄音', color: 'red' },
    { path: '/calendar', icon: Calendar, label: '日曆提醒', color: 'indigo' },
    { path: '/settings', icon: Settings, label: '設定', color: 'gray' },
  ]

  return (
    <aside className="w-20 bg-white border-r border-gray-200 flex flex-col items-center py-6 gap-2 relative">
      {/* Logo */}
      <div className="mb-6 relative group">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-900 to-gray-700 flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform duration-300">
          <span className="text-white font-bold text-xl">W</span>
        </div>
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-gray-700 rounded-xl blur opacity-30 group-hover:opacity-50 transition-opacity"></div>
      </div>

      {/* Navigation Items */}
      <div className="flex flex-col gap-2 w-full px-2">
        {navItems.map((item, index) => {
          const isActive = location.pathname === item.path ||
            (item.path !== '/' && location.pathname.startsWith(item.path))

          return (
            <div key={item.path} className="relative group">
              <NavLink
                to={item.path}
                onMouseEnter={() => setHoveredItem(item.path)}
                onMouseLeave={() => setHoveredItem(null)}
                className={({ isActive }) =>
                  `relative w-full h-14 rounded-xl flex flex-col items-center justify-center transition-all duration-300 transform
                  ${isActive
                    ? 'bg-gray-900 text-white shadow-lg scale-105'
                    : 'hover:bg-gray-100 text-gray-500 hover:text-gray-900 hover:scale-105'
                  }`
                }
              >
                <item.icon
                  size={20}
                  strokeWidth={2.5}
                  className={`transition-transform duration-300 ${isActive ? 'scale-110' : ''}`}
                />
                <span className={`text-[9px] font-semibold mt-1 transition-all ${isActive ? 'opacity-100' : 'opacity-60'}`}>
                  {item.label.substring(0, 4)}
                </span>

                {/* Active Indicator */}
                {isActive && (
                  <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-1 h-8 bg-gray-900 rounded-r-full"></div>
                )}
              </NavLink>

              {/* Hover Tooltip */}
              {hoveredItem === item.path && !isActive && (
                <div className="absolute left-full ml-4 top-1/2 -translate-y-1/2 z-50 animate-fade-in">
                  <div className="bg-gray-900 text-white text-xs px-3 py-2 rounded-lg shadow-xl whitespace-nowrap">
                    {item.label}
                    <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="flex-1"></div>

      {/* Bottom Decoration */}
      <div className="w-8 h-1 bg-gradient-to-r from-gray-300 via-gray-400 to-gray-300 rounded-full"></div>
    </aside>
  )
}

export default Sidebar