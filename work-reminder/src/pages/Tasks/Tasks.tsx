import { useState, useEffect } from 'react'
import { Plus, CheckSquare, Square, Trash2, Calendar } from 'lucide-react'

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
    if (!newTask.title.trim()) return
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
  }

  const handleToggleComplete = async (id: number) => {
    await window.electronAPI.tasks.toggleComplete(id)
    loadTasks()
  }

  const handleDelete = async (id: number) => {
    if (confirm('確定要刪除此任務？')) {
      await window.electronAPI.tasks.delete(id)
      loadTasks()
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
    low: 'badge-ghost',
    medium: 'badge-warning',
    high: 'badge-error'
  }

  return (
    <div className="p-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CheckSquare size={20} strokeWidth={1.5} className="text-base-content/60" />
          <span className="text-sm text-base-content/60">代辦事項</span>
        </div>
        <button
          className="btn btn-primary btn-sm gap-1"
          onClick={() => setShowAddModal(true)}
        >
          <Plus size={16} strokeWidth={1.5} />
          新增
        </button>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 mb-4">
        <button
          className={`btn btn-xs ${filter === 'all' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setFilter('all')}
        >
          全部 ({tasks.length})
        </button>
        {Object.entries(categoryNames).map(([key, name]) => (
          <button
            key={key}
            className={`btn btn-xs ${filter === key ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setFilter(key)}
          >
            {name} ({tasks.filter(t => t.category === key).length})
          </button>
        ))}
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto space-y-2">
        {filteredTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-base-content/40">
            <CheckSquare size={48} strokeWidth={1} className="mb-2" />
            <span className="text-sm">尚無任務</span>
          </div>
        ) : (
          filteredTasks.map(task => (
            <div
              key={task.id}
              className="card bg-base-100 border border-base-300 hover:shadow-sm transition-all"
            >
              <div className="card-body p-4">
                <div className="flex items-start gap-3">
                  <button
                    className="mt-1"
                    onClick={() => handleToggleComplete(task.id)}
                  >
                    {task.is_completed ? (
                      <CheckSquare size={20} className="text-primary" strokeWidth={1.5} />
                    ) : (
                      <Square size={20} className="text-base-content/40" strokeWidth={1.5} />
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className={`text-sm font-medium ${task.is_completed ? 'line-through text-base-content/40' : ''}`}>
                        {task.title}
                      </h3>
                      <span className={`badge badge-xs ${priorityColors[task.priority]}`}>
                        {task.priority}
                      </span>
                      <span className="badge badge-xs badge-ghost">
                        {categoryNames[task.category]}
                      </span>
                    </div>
                    {task.description && (
                      <p className="text-xs text-base-content/60 mb-2">{task.description}</p>
                    )}
                    {task.due_date && (
                      <div className="flex items-center gap-1 text-xs text-base-content/50">
                        <Calendar size={12} />
                        {task.due_date}
                      </div>
                    )}
                  </div>

                  <button
                    className="btn btn-ghost btn-xs btn-square"
                    onClick={() => handleDelete(task.id)}
                  >
                    <Trash2 size={14} strokeWidth={1.5} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowAddModal(false)}>
          <div className="card bg-base-100 w-96 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="card-body">
              <h3 className="card-title text-lg mb-4">新增任務</h3>

              <div className="space-y-3">
                <div>
                  <label className="label">
                    <span className="label-text text-xs">標題</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered input-sm w-full"
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    placeholder="任務名稱"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="label">
                    <span className="label-text text-xs">描述</span>
                  </label>
                  <textarea
                    className="textarea textarea-bordered textarea-sm w-full"
                    value={newTask.description}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                    placeholder="詳細說明"
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">
                      <span className="label-text text-xs">分類</span>
                    </label>
                    <select
                      className="select select-bordered select-sm w-full"
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
                    <label className="label">
                      <span className="label-text text-xs">優先級</span>
                    </label>
                    <select
                      className="select select-bordered select-sm w-full"
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
                  <label className="label">
                    <span className="label-text text-xs">截止日期</span>
                  </label>
                  <input
                    type="date"
                    className="input input-bordered input-sm w-full"
                    value={newTask.due_date}
                    onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="card-actions justify-end mt-4">
                <button className="btn btn-ghost btn-sm" onClick={() => setShowAddModal(false)}>
                  取消
                </button>
                <button className="btn btn-primary btn-sm" onClick={handleAdd}>
                  新增
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Tasks