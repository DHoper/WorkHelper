import { Settings as SettingsIcon } from 'lucide-react'

const Settings = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 p-8">
      <SettingsIcon size={80} strokeWidth={1} className="text-base-content/20" />
      <div className="text-lg text-base-content/40">即將開發</div>
    </div>
  )
}

export default Settings
