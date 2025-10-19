import { useState, useEffect, useMemo } from 'react'
import { Plus, CheckSquare, Trash2, Calendar, Search, Filter, SortAsc, TrendingUp, AlertCircle, X } from 'lucide-react'
import ConfirmDialog from '../../components/ConfirmDialog'
import Toast from '../../components/Toast'
import { Task } from '../../types/task'

const Tasks = () => {
  const [tasks, setTasks] = useState<Task[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [filter, setFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'date' | 'priority' | 'category'>('date')
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

  // 篩選和排序任務
  const filteredAndSortedTasks = useMemo(() => {
    let filtered = tasks.filter(task => {
      // 搜尋過濾
      if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false
      }
      // 類別過濾
      if (filter !== 'all' && task.category !== filter) {
        return false
      }
      // 優先級過濾
      if (priorityFilter !== 'all' && task.priority !== priorityFilter) {
        return false
      }
      // 狀態過濾
      if (statusFilter === 'completed' && task.is_completed === 0) {
        return false
      }
      if (statusFilter === 'pending' && task.is_completed === 1) {
        return false
      }
      return true
    })

    // 排序
    filtered.sort((a, b) => {
      if (sortBy === 'priority') {
        const priorityOrder = { high: 3, medium: 2, low: 1 }
        return priorityOrder[b.priority] - priorityOrder[a.priority]
      }
      if (sortBy === 'category') {
        return a.category.localeCompare(b.category)
      }
      // 預設按日期排序
      return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
    })

    return filtered
  }, [tasks, searchQuery, filter, priorityFilter, statusFilter, sortBy])

  // 統計數據
  const stats = useMemo(() => ({
    total: tasks.length,
    completed: tasks.filter(t => t.is_completed === 1).length,
    pending: tasks.filter(t => t.is_completed === 0).length,
    highPriority: tasks.filter(t => t.is_completed === 0 && t.priority === 'high').length
  }), [tasks])

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
    <div className="h-full p-6 bg-gradient-to-br from-gray-50 to-white overflow-hidden">
      <div className="max-w-6xl mx-auto h-full flex flex-col">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-900 to-gray-700 flex items-center justify-center shadow-lg">
              <CheckSquare size={20} className="text-white" strokeWidth={2} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">待辦事項</h2>
              <p className="text-sm text-gray-500">
                共 {stats.total} 個任務，已完成 {stats.completed} 個
              </p>
            </div>
          </div>
          <button
            className="px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-sm font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center gap-2"
            onClick={() => setShowAddModal(true)}
          >
            <Plus size={18} strokeWidth={2} />
            新增任務
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-3 mb-5">
          <div className="p-4 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-shadow">
            <p className="text-xs text-gray-500 mb-1">全部</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="p-4 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-shadow">
            <p className="text-xs text-gray-500 mb-1">待完成</p>
            <p className="text-2xl font-bold text-blue-600">{stats.pending}</p>
          </div>
          <div className="p-4 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-shadow">
            <p className="text-xs text-gray-500 mb-1">已完成</p>
            <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
          </div>
          <div className="p-4 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-shadow">
            <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
              <AlertCircle size={12} />
              高優先級
            </p>
            <p className="text-2xl font-bold text-red-600">{stats.highPriority}</p>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="mb-5 p-4 bg-white border border-gray-200 rounded-xl">
          <div className="flex items-center gap-3 flex-wrap">
            {/* Search */}
            <div className="flex-1 min-w-[200px] relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="搜尋任務..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>

            {/* Category Filter */}
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
            >
              <option value="all">全部類別</option>
              <option value="daily">每日</option>
              <option value="weekly">每週</option>
              <option value="monthly">每月</option>
              <option value="temporary">臨時</option>
            </select>

            {/* Priority Filter */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
            >
              <option value="all">全部優先級</option>
              <option value="high">高</option>
              <option value="medium">中</option>
              <option value="low">低</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
            >
              <option value="all">全部狀態</option>
              <option value="pending">待完成</option>
              <option value="completed">已完成</option>
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
            >
              <option value="date">按日期排序</option>
              <option value="priority">按優先級排序</option>
              <option value="category">按類別排序</option>
            </select>
          </div>
        </div>

        {/* Task List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-2">
          {filteredAndSortedTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full bg-white rounded-xl border border-gray-200">
              <CheckSquare size={48} strokeWidth={1.5} className="text-gray-300 mb-3" />
              <span className="text-sm text-gray-400">
                {searchQuery || filter !== 'all' || priorityFilter !== 'all' || statusFilter !== 'all'
                  ? '沒有符合條件的任務'
                  : '尚無待辦事項'}
              </span>
            </div>
          ) : (
            filteredAndSortedTasks.map(task => (
              <div
                key={task.id}
                className="group p-4 border border-gray-200 rounded-xl hover:border-gray-400 hover:shadow-md transition-all duration-300 bg-white"
              >
                <div className="flex items-start gap-3">
                  <button
                    className="mt-0.5"
                    onClick={() => handleToggleComplete(task.id)}
                  >
                    {task.is_completed === 1 ? (
                      <div className="w-5 h-5 rounded bg-gray-900 flex items-center justify-center">
                        <CheckSquare size={14} className="text-white" strokeWidth={3} />
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded border-2 border-gray-300 hover:border-gray-500 transition-colors"></div>
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className={`text-base font-semibold ${task.is_completed === 1 ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                        {task.title}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${priorityColors[task.priority]}`}>
                        {priorityLabels[task.priority]}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium text-purple-600 bg-purple-50">
                        {categoryNames[task.category]}
                      </span>
                    </div>
                    {task.description && (
                      <p className="text-sm text-gray-500 mb-2 leading-relaxed">{task.description}</p>
                    )}
                    {task.due_date && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-400">
                        <Calendar size={12} strokeWidth={2} />
                        {task.due_date}
                      </div>
                    )}
                  </div>

                  <button
                    className="opacity-0 group-hover:opacity-100 w-9 h-9 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 flex items-center justify-center transition-all"
                    onClick={() => handleDeleteClick(task.id)}
                  >
                    <Trash2 size={18} strokeWidth={2} />
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
          <div className="bg-white rounded-2xl w-full max-w-md mx-4 p-6 animate-scale-up shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-gray-900">新增任務</h3>
              <button
                className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 transition-all"
                onClick={() => setShowAddModal(false)}
              >
                <X size={16} strokeWidth={2} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">標題</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  placeholder="輸入任務名稱"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">描述</label>
                <textarea
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all resize-none"
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
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
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
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
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
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
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
                className="px-4 py-2 rounded-xl bg-gray-900 hover:bg-gray-800 text-white shadow-lg hover:shadow-xl transition-all text-sm font-medium"
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
