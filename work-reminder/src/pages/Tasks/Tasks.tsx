import { useState, useEffect } from 'react'
import { Plus, CheckSquare, Trash2, Calendar } from 'lucide-react'
import ConfirmDialog from '../../components/ConfirmDialog'
import Toast from '../../components/Toast'

interface Task {
  id: number
  title: string
  description: string | null
  category: 'daily' | 'weekly' | 'monthly' | 'temporary'
  priority: 'low' | 'medium' | 'high'
  is_completed: number
  due_date: string | null
  created_at: string
}

const Tasks = () => {
  const [tasks, setTasks] = useState<Task[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [filter, setFilter] = useState<string>('all')
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; id: number | null }>({ show: false, id: null })
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' | 'warning' | 'info' }>({ show: false, message: '', type: 'info' })
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    category: 'daily' as Task['category'],
    priority: 'medium' as Task['priority'],
    due_date: ''
  })

  useEffect(() => {
    loadTasks()
  }, [])

  const loadTasks = async () => {
    const allTasks = await window.electronAPI.tasks.getAll()
    setTasks(allTasks)
  }

  const handleAdd = async () => {
    if (!newTask.title.trim()) {
      setToast({ show: true, message: '請輸入任務標題', type: 'warning' })
      return
    }
    await window.electronAPI.tasks.create(newTask)
    setNewTask({
      title: '',
      description: '',
      category: 'daily',
      priority: 'medium',
      due_date: ''
    })
    setShowAddModal(false)
    loadTasks()
    setToast({ show: true, message: '任務已新增', type: 'success' })
  }

  const handleToggleComplete = async (id: number) => {
    await window.electronAPI.tasks.toggleComplete(id)
    loadTasks()
  }

  const handleDeleteClick = (id: number) => {
    setDeleteConfirm({ show: true, id })
  }

  const handleDelete = async () => {
    const id = deleteConfirm.id
    if (!id) return

    try {
      await window.electronAPI.tasks.delete(id)
      loadTasks()
      setToast({ show: true, message: '任務已刪除', type: 'success' })
    } catch (error) {
      setToast({ show: true, message: '刪除任務失敗', type: 'error' })
    } finally {
      setDeleteConfirm({ show: false, id: null })
    }
  }

  const filteredTasks = filter === 'all'
    ? tasks
    : tasks.filter(t => t.category === filter)

  const categoryNames = {
    daily: '每日',
    weekly: '每週',
    monthly: '每月',
    temporary: '臨時'
  }

  const priorityColors = {
    low: 'text-green-600 bg-green-50',
    medium: 'text-amber-600 bg-amber-50',
    high: 'text-red-600 bg-red-50'
  }

  const priorityLabels = {
    low: '低',
    medium: '中',
    high: '高'
  }

  return (
    <div className="h-full p-6 bg-white">
      <div className="max-w-3xl mx-auto h-full flex flex-col">
        {/* Header */}
        <div className="mb-5">
          <h2 className="text-xl font-bold text-gray-900">代辦事項</h2>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 mb-4 p-1 bg-gray-100 rounded-xl">
          <button
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all
              ${filter === 'all'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'}`}
            onClick={() => setFilter('all')}
          >
            全部 ({tasks.length})
          </button>
          {Object.entries(categoryNames).map(([key, name]) => (
            <button
              key={key}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                ${filter === key
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'}`}
              onClick={() => setFilter(key)}
            >
              {name} ({tasks.filter(t => t.category === key).length})
            </button>
          ))}
          <div className="flex-1"></div>
          <button
            className="flex items-center gap-1.5 p-3 rounded-lg bg-gray-900 text-white hover:bg-gray-800 transition-all text-xs font-medium"
            onClick={() => setShowAddModal(true)}
          >
            <Plus size={14} strokeWidth={2} />
          </button>
        </div>

        {/* Task List */}
        <div className="flex-1 overflow-y-auto space-y-2">
          {filteredTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <CheckSquare size={40} strokeWidth={1.5} />
              <span className="text-sm mt-3">尚無任務</span>
            </div>
          ) : (
            filteredTasks.map(task => (
              <div
                key={task.id}
                className="p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition-all group bg-white"
              >
                <div className="flex items-start gap-2.5">
                  <button
                    className="mt-0.5"
                    onClick={() => handleToggleComplete(task.id)}
                  >
                    {task.is_completed ? (
                      <div className="w-4 h-4 rounded bg-gray-900 flex items-center justify-center">
                        <CheckSquare size={12} className="text-white" strokeWidth={3} />
                      </div>
                    ) : (
                      <div className="w-4 h-4 rounded border-2 border-gray-300 hover:border-gray-500 transition-colors"></div>
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <h3 className={`text-sm font-semibold ${task.is_completed ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                        {task.title}
                      </h3>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium ${priorityColors[task.priority]}`}>
                        {priorityLabels[task.priority]}
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-medium text-purple-600 bg-purple-50">
                        {categoryNames[task.category]}
                      </span>
                    </div>
                    {task.description && (
                      <p className="text-xs text-gray-500 mb-2 leading-relaxed">{task.description}</p>
                    )}
                    {task.due_date && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-400">
                        <Calendar size={12} strokeWidth={2} />
                        {task.due_date}
                      </div>
                    )}
                  </div>

                  <button
                    className="w-8 h-8 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                    onClick={() => handleDeleteClick(task.id)}
                  >
                    <Trash2 size={16} strokeWidth={2} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in" onClick={() => setShowAddModal(false)}>
          <div className="premium-card w-full max-w-md mx-4 p-6 animate-scale-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-gray-900">新增任務</h3>
              <button
                className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 transition-all"
                onClick={() => setShowAddModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">標題</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  placeholder="輸入任務名稱"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">描述</label>
                <textarea
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  placeholder="詳細說明（選填）"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">分類</label>
                  <select
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    value={newTask.category}
                    onChange={(e) => setNewTask({ ...newTask, category: e.target.value as Task['category'] })}
                  >
                    <option value="daily">每日</option>
                    <option value="weekly">每週</option>
                    <option value="monthly">每月</option>
                    <option value="temporary">臨時</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">優先級</label>
                  <select
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    value={newTask.priority}
                    onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as Task['priority'] })}
                  >
                    <option value="low">低</option>
                    <option value="medium">中</option>
                    <option value="high">高</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">截止日期</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  value={newTask.due_date}
                  onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 mt-6">
              <button
                className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition-all"
                onClick={() => setShowAddModal(false)}
              >
                取消
              </button>
              <button
                className="px-4 py-2 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 text-white shadow-lg hover:shadow-xl transition-all text-sm font-medium"
                onClick={handleAdd}
              >
                新增任務
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm.show}
        title="刪除任務"
        message="確定要刪除此任務嗎？"
        confirmText="刪除"
        cancelText="取消"
        type="warning"
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm({ show: false, id: null })}
      />

      {/* Toast */}
      <Toast
        isOpen={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, show: false })}
      />
    </div>
  )
}

export default Tasks
