import { Bell, Moon, Eye, Info } from 'lucide-react'

const Settings = () => {
  return (
    <div className="h-full p-6 bg-white">
      <div className="max-w-2xl mx-auto h-full flex flex-col">
        {/* Header */}
        <div className="mb-5">
          <h2 className="text-xl font-bold text-gray-900">設定</h2>
        </div>

        {/* Settings Content */}
        <div className="flex-1 overflow-y-auto space-y-3">
          {/* Notification Settings */}
          <div className="p-4 border border-gray-200 rounded-lg bg-white">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg bg-gray-900 flex items-center justify-center">
                <Bell size={16} className="text-white" strokeWidth={2} />
              </div>
              <h3 className="text-sm font-semibold text-gray-900">通知</h3>
            </div>
            <div className="space-y-2">
              <label className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-all">
                <p className="text-sm text-gray-700">桌面通知</p>
                <input type="checkbox" className="toggle toggle-sm" defaultChecked />
              </label>
              <label className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-all">
                <p className="text-sm text-gray-700">聲音提醒</p>
                <input type="checkbox" className="toggle toggle-sm" defaultChecked />
              </label>
            </div>
          </div>

          {/* Eye Care Settings */}
          <div className="p-4 border border-gray-200 rounded-lg bg-white">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg bg-gray-900 flex items-center justify-center">
                <Eye size={16} className="text-white" strokeWidth={2} />
              </div>
              <h3 className="text-sm font-semibold text-gray-900">護眼</h3>
            </div>
            <div>
              <label className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-700">間隔</p>
                <span className="text-sm font-semibold text-gray-900">60分鐘</span>
              </label>
            </div>
          </div>

          {/* Appearance Settings */}
          <div className="p-4 border border-gray-200 rounded-lg bg-white">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg bg-gray-900 flex items-center justify-center">
                <Moon size={16} className="text-white" strokeWidth={2} />
              </div>
              <h3 className="text-sm font-semibold text-gray-900">外觀</h3>
            </div>
            <div>
              <label className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-all">
                <p className="text-sm text-gray-700">深色模式</p>
                <input type="checkbox" className="toggle toggle-sm" />
              </label>
            </div>
          </div>

          {/* About */}
          <div className="p-4 border border-gray-200 rounded-lg bg-white">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg bg-gray-900 flex items-center justify-center">
                <Info size={16} className="text-white" strokeWidth={2} />
              </div>
              <h3 className="text-sm font-semibold text-gray-900">關於</h3>
            </div>
            <div className="space-y-2">
              <div className="p-2.5 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500">版本</p>
                <p className="text-sm font-semibold text-gray-900 mt-0.5">1.0.0</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Settings
