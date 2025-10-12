import { useState, useEffect, useRef } from 'react'
import { Mic, Square, Play, Pause, Trash2, FileAudio, Clock, Download } from 'lucide-react'
import ConfirmDialog from '../../components/ConfirmDialog'
import Toast from '../../components/Toast'

interface Recording {
  id: number
  title: string
  file_path: string
  duration: number
  size: number
  format: string
  created_at: string
  tags: string | null
}

const Recording = () => {
  const [recordings, setRecordings] = useState<Recording[]>([])
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [selectedRecording, setSelectedRecording] = useState<Recording | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentAudioUrl, setCurrentAudioUrl] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; id: number | null }>({ show: false, id: null })
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' | 'warning' | 'info' }>({ show: false, message: '', type: 'info' })

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    loadRecordings()

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      if (audioRef.current) {
        audioRef.current.pause()
      }
    }
  }, [])

  useEffect(() => {
    return () => {
      if (currentAudioUrl) {
        URL.revokeObjectURL(currentAudioUrl)
      }
    }
  }, [currentAudioUrl])

  const loadRecordings = async () => {
    const allRecordings = await window.electronAPI.recording.getAll()
    setRecordings(allRecordings)
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      })
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        await saveRecording(blob)
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.onerror = (e) => {
        console.error('MediaRecorder error:', e)
        setToast({ show: true, message: '錄音過程中發生錯誤', type: 'error' })
        stopRecording()
      }

      mediaRecorder.start(1000)
      setIsRecording(true)
      setRecordingTime(0)

      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
    } catch (error) {
      console.error('錄音失敗:', error)
      setToast({ show: true, message: '無法開始錄音，請確認麥克風權限', type: 'error' })
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }

  const saveRecording = async (blob: Blob) => {
    try {
      const filePath = await window.electronAPI.recording.getFilePath('webm')
      const arrayBuffer = await blob.arrayBuffer()
      const uint8Array = new Uint8Array(arrayBuffer)

      await window.electronAPI.recording.writeFile(filePath, uint8Array as any)

      const title = `錄音 ${new Date().toLocaleString('zh-TW')}`
      const metadata = {
        title,
        duration: recordingTime,
        size: blob.size,
        format: 'webm',
        tags: null
      }

      await window.electronAPI.recording.save(metadata, filePath)
      await loadRecordings()
      setRecordingTime(0)
      setToast({ show: true, message: '錄音保存成功', type: 'success' })
    } catch (error) {
      console.error('保存錄音失敗:', error)
      setToast({ show: true, message: '保存錄音失敗', type: 'error' })
    }
  }

  const playRecording = async (recording: Recording) => {
    if (audioRef.current) {
      if (isPlaying && selectedRecording?.id === recording.id) {
        audioRef.current.pause()
        setIsPlaying(false)
      } else {
        try {
          if (currentAudioUrl) {
            URL.revokeObjectURL(currentAudioUrl)
          }

          const buffer = await window.electronAPI.recording.readFile(recording.file_path)
          const blob = new Blob([new Uint8Array(buffer)], { type: 'audio/webm' })
          const url = URL.createObjectURL(blob)

          audioRef.current.src = url
          audioRef.current.play()
          setSelectedRecording(recording)
          setIsPlaying(true)
          setCurrentAudioUrl(url)
        } catch (error) {
          console.error('播放錄音失敗:', error)
          setToast({ show: true, message: '播放錄音失敗', type: 'error' })
        }
      }
    }
  }

  const downloadRecording = async (recording: Recording) => {
    try {
      const buffer = await window.electronAPI.recording.readFile(recording.file_path)
      const blob = new Blob([new Uint8Array(buffer)], { type: 'audio/webm' })
      const url = URL.createObjectURL(blob)

      const a = document.createElement('a')
      a.href = url
      a.download = `${recording.title}.webm`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      setToast({ show: true, message: '錄音下載成功', type: 'success' })
    } catch (error) {
      console.error('下載錄音失敗:', error)
      setToast({ show: true, message: '下載錄音失敗', type: 'error' })
    }
  }

  const handleDeleteClick = (id: number) => {
    setDeleteConfirm({ show: true, id })
  }

  const deleteRecording = async () => {
    const id = deleteConfirm.id
    if (!id) return

    try {
      await window.electronAPI.recording.delete(id)
      await loadRecordings()
      if (selectedRecording?.id === id) {
        setSelectedRecording(null)
        setIsPlaying(false)
      }
      setToast({ show: true, message: '錄音已刪除', type: 'success' })
    } catch (error) {
      console.error('刪除錄音失敗:', error)
      setToast({ show: true, message: '刪除錄音失敗', type: 'error' })
    } finally {
      setDeleteConfirm({ show: false, id: null })
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="h-full p-6 bg-white">
      <div className="max-w-3xl mx-auto h-full flex flex-col">
        {/* Header */}
        <div className="mb-5">
          <h2 className="text-xl font-bold text-gray-900">會議錄音</h2>
        </div>

        {/* Recording Control */}
        <div className="p-4 border border-gray-200 rounded-lg mb-4 bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                isRecording ? 'bg-red-500' : 'bg-gray-900'
              }`}>
                <Mic size={18} className="text-white" strokeWidth={2} />
              </div>
              <div>
                {isRecording ? (
                  <p className="text-lg font-mono font-bold text-gray-900">{formatTime(recordingTime)}</p>
                ) : (
                  <p className="text-sm text-gray-600">就緒</p>
                )}
              </div>
            </div>

            <button
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all text-sm font-medium ${
                isRecording
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-gray-900 hover:bg-gray-800 text-white'
              }`}
              onClick={isRecording ? stopRecording : startRecording}
            >
              {isRecording ? (
                <>
                  <Square size={14} strokeWidth={2} fill="currentColor" />
                  停止
                </>
              ) : (
                <>
                  <Mic size={14} strokeWidth={2} />
                  錄音
                </>
              )}
            </button>
          </div>
        </div>

        {/* Recordings List */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-700">錄音 ({recordings.length})</h3>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2">
            {recordings.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <FileAudio size={40} strokeWidth={1.5} />
                <span className="text-sm mt-3">尚無錄音</span>
              </div>
            ) : (
              recordings.map(recording => (
                <div
                  key={recording.id}
                  className={`p-3 border rounded-lg transition-all group ${
                    selectedRecording?.id === recording.id
                      ? 'border-gray-900 bg-gray-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <button
                      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                        isPlaying && selectedRecording?.id === recording.id
                          ? 'bg-gray-900 text-white'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                      }`}
                      onClick={() => playRecording(recording)}
                    >
                      {isPlaying && selectedRecording?.id === recording.id ? (
                        <Pause size={14} strokeWidth={2} />
                      ) : (
                        <Play size={14} strokeWidth={2} />
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-gray-900 truncate mb-1">{recording.title}</h4>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock size={12} strokeWidth={2} />
                          {formatTime(recording.duration)}
                        </span>
                        <span>{formatSize(recording.size)}</span>
                        <span>{new Date(recording.created_at).toLocaleDateString('zh-TW')}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        className="w-9 h-9 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-500 flex items-center justify-center transition-all"
                        onClick={() => downloadRecording(recording)}
                        title="下載錄音"
                      >
                        <Download size={16} strokeWidth={2} />
                      </button>

                      <button
                        className="w-9 h-9 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 flex items-center justify-center transition-all"
                        onClick={() => handleDeleteClick(recording.id)}
                        title="刪除錄音"
                      >
                        <Trash2 size={16} strokeWidth={2} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Audio Player (hidden) */}
      <audio
        ref={audioRef}
        onEnded={() => {
          setIsPlaying(false)
          if (currentAudioUrl) {
            URL.revokeObjectURL(currentAudioUrl)
            setCurrentAudioUrl(null)
          }
        }}
        onPause={() => setIsPlaying(false)}
      />

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm.show}
        title="刪除錄音"
        message="確定要刪除此錄音嗎？此操作無法撤銷。"
        confirmText="刪除"
        cancelText="取消"
        type="danger"
        onConfirm={deleteRecording}
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

export default Recording
