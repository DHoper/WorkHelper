import { create } from 'zustand'

// Types
interface EyeCareState {
  remainingSeconds: number
  config: { interval: number; enabled: boolean }
  isPaused: boolean
}

interface WorkTimeState {
  isClockedIn: boolean
  clockInTime: string | null
  clockOutTime: string | null
  estimatedOffTime: string | null
  hasNotified: boolean
  isInitialized: boolean
}

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

interface AppStore {
  // Eye Care State
  eyeCare: EyeCareState
  eyeCareInitialized: boolean
  
  // Work Time State
  workTime: WorkTimeState
  workTimeInitialized: boolean
  
  // Tasks State
  tasks: Task[]
  tasksLoaded: boolean
  
  // Recording State
  recordingCount: number
  
  // Actions
  initializeEyeCare: () => Promise<void>
  updateEyeCareState: (state: EyeCareState) => void
  
  initializeWorkTime: () => Promise<void>
  updateWorkTimeState: (state: WorkTimeState) => void
  
  loadTasks: () => Promise<void>
  addTask: (task: Partial<Task>) => Promise<void>
  updateTask: (id: number, updates: Partial<Task>) => Promise<void>
  deleteTask: (id: number) => Promise<void>
  toggleTask: (id: number) => Promise<void>
  
  loadRecordingCount: () => Promise<void>
  
  // Cleanup
  cleanup: () => void
}

// Cleanup functions storage
let eyeCareCleanup: (() => void) | null = null
let workTimeCleanup: (() => void) | null = null

export const useAppStore = create<AppStore>((set, get) => ({
  // Initial states
  eyeCare: {
    remainingSeconds: 0,
    config: { interval: 60, enabled: true },
    isPaused: false
  },
  eyeCareInitialized: false,
  
  workTime: {
    isClockedIn: false,
    clockInTime: null,
    clockOutTime: null,
    estimatedOffTime: null,
    hasNotified: false,
    isInitialized: false
  },
  workTimeInitialized: false,
  
  tasks: [],
  tasksLoaded: false,
  
  recordingCount: 0,
  
  // Initialize Eye Care
  initializeEyeCare: async () => {
    if (get().eyeCareInitialized) return
    
    try {
      const state = await window.electronAPI.eyeCare.getState()
      set({ eyeCare: state, eyeCareInitialized: true })
      
      // Subscribe to updates (only once)
      const unsubscribeTick = window.electronAPI.eyeCare.onTick((newState: EyeCareState) => {
        set({ eyeCare: newState })
      })
      
      eyeCareCleanup = unsubscribeTick
    } catch (error) {
      console.error('Failed to initialize eye care:', error)
    }
  },
  
  updateEyeCareState: (state: EyeCareState) => {
    set({ eyeCare: state })
  },
  
  // Initialize Work Time
  initializeWorkTime: async () => {
    if (get().workTimeInitialized) return
    
    try {
      const state = await window.electronAPI.workTime.getState()
      set({ workTime: state, workTimeInitialized: true })
      
      // Subscribe to updates (only once)
      const unsubscribe = window.electronAPI.workTime.onStateUpdate((newState: WorkTimeState) => {
        set({ workTime: newState })
      })
      
      workTimeCleanup = unsubscribe
    } catch (error) {
      console.error('Failed to initialize work time:', error)
    }
  },
  
  updateWorkTimeState: (state: WorkTimeState) => {
    set({ workTime: state })
  },
  
  // Load Tasks
  loadTasks: async () => {
    try {
      const tasks = await window.electronAPI.tasks.getAll()
      set({ tasks, tasksLoaded: true })
    } catch (error) {
      console.error('Failed to load tasks:', error)
    }
  },
  
  addTask: async (task: Partial<Task>) => {
    try {
      await window.electronAPI.tasks.create(task)
      await get().loadTasks()
    } catch (error) {
      console.error('Failed to add task:', error)
      throw error
    }
  },
  
  updateTask: async (id: number, updates: Partial<Task>) => {
    try {
      await window.electronAPI.tasks.update(id, updates)
      await get().loadTasks()
    } catch (error) {
      console.error('Failed to update task:', error)
      throw error
    }
  },
  
  deleteTask: async (id: number) => {
    try {
      await window.electronAPI.tasks.delete(id)
      await get().loadTasks()
    } catch (error) {
      console.error('Failed to delete task:', error)
      throw error
    }
  },
  
  toggleTask: async (id: number) => {
    try {
      await window.electronAPI.tasks.toggleComplete(id)
      await get().loadTasks()
    } catch (error) {
      console.error('Failed to toggle task:', error)
      throw error
    }
  },
  
  // Load Recording Count
  loadRecordingCount: async () => {
    try {
      const recordings = await window.electronAPI.recording.getAll()
      set({ recordingCount: recordings.length })
    } catch (error) {
      console.error('Failed to load recording count:', error)
    }
  },
  
  // Cleanup all subscriptions
  cleanup: () => {
    if (eyeCareCleanup) {
      eyeCareCleanup()
      eyeCareCleanup = null
    }
    if (workTimeCleanup) {
      workTimeCleanup()
      workTimeCleanup = null
    }
  }
}))
