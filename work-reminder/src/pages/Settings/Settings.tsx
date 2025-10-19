import { Info, Settings as SettingsIcon, Palette, Bell, Globe } from 'lucide-react'

const Settings = () => {
  return (
    <div className="h-full p-6 bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-3xl mx-auto h-full flex flex-col">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-900 to-gray-700 flex items-center justify-center shadow-lg">
            <SettingsIcon size={20} className="text-white" strokeWidth={2} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">設定</h2>
            <p className="text-sm text-gray-500">自訂您的工作助手</p>
          </div>
        </div>

        {/* Settings Content */}
        <div className="flex-1 overflow-y-auto space-y-4">
          {/* Appearance */}
          <div className="p-5 border border-gray-200 rounded-xl bg-white hover:shadow-md transition-shadow duration-300">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center">
                <Palette size={18} className="text-white" strokeWidth={2} />
              </div>
              <h3 className="text-base font-semibold text-gray-900">外觀</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-700">主題</span>
                <span className="text-sm font-semibold text-gray-900">淺色模式</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-700">語言</span>
                <span className="text-sm font-semibold text-gray-900">繁體中文</span>
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div className="p-5 border border-gray-200 rounded-xl bg-white hover:shadow-md transition-shadow duration-300">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                <Bell size={18} className="text-white" strokeWidth={2} />
              </div>
              <h3 className="text-base font-semibold text-gray-900">通知</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-700">桌面通知</span>
                <input type="checkbox" className="toggle toggle-md bg-gray-900 border-gray-900" defaultChecked />
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-700">聲音提醒</span>
                <input type="checkbox" className="toggle toggle-md bg-gray-900 border-gray-900" defaultChecked />
              </div>
            </div>
          </div>

          {/* About */}
          <div className="p-5 border border-gray-200 rounded-xl bg-white hover:shadow-md transition-shadow duration-300">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-900 to-gray-700 flex items-center justify-center">
                <Info size={18} className="text-white" strokeWidth={2} />
              </div>
              <h3 className="text-base font-semibold text-gray-900">關於</h3>
            </div>
            <div className="space-y-3">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">應用程式名稱</p>
                <p className="text-sm font-semibold text-gray-900">WorkHelper - 工作助手</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">版本</p>
                <p className="text-sm font-semibold text-gray-900">v1.0.0</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">框架</p>
                <p className="text-sm font-semibold text-gray-900">Electron + React + TypeScript</p>
              </div>
            </div>
          </div>

          {/* System Info */}
          <div className="p-5 border border-gray-200 rounded-xl bg-white hover:shadow-md transition-shadow duration-300">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                <Globe size={18} className="text-white" strokeWidth={2} />
              </div>
              <h3 className="text-base font-semibold text-gray-900">系統資訊</h3>
            </div>
            <div className="space-y-3">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">作業系統</p>
                <p className="text-sm font-semibold text-gray-900">Windows 10</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">資料儲存位置</p>
                <p className="text-xs text-gray-600 font-mono">C:\Users\AppData\Roaming\work-helper</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Settings
