// 任務相關類型定義

export interface Task {
  id: number
  title: string
  description: string | null
  category: 'daily' | 'weekly' | 'monthly' | 'temporary'
  priority: 'low' | 'medium' | 'high'
  due_date: string | null
  is_completed: number
  created_at: string
  updated_at: string
}

export interface TaskInput {
  title: string
  description?: string
  category: string
  priority: 'low' | 'medium' | 'high'
  due_date?: string
}
