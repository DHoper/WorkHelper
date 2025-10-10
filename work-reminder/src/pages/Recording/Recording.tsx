import { useState, useEffect, useRef } from 'react'
import { Mic, Square, Play, Pause, Trash2, FileAudio, Clock } from 'lucide-react'

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

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    loadRecordings()
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  const loadRecordings = async () => {
    const allRecordings = await window.electronAPI.recording.getAll()
    setRecordings(allRecordings)
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
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

      mediaRecorder.start()
      setIsRecording(true)
      setRecordingTime(0)

      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
    } catch (error) {
      console.error('錄音失敗:', error)
      alert('無法開始錄音，請確認麥克風權限')
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
      // 轉換為 Uint8Array（不依賴 Buffer）
      const uint8Array = new Uint8Array(arrayBuffer)

      // 通過 IPC 寫入文件
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
    } catch (error) {
      console.error('保存錄音失敗:', error)
      alert('保存錄音失敗')
    }
  }

  const playRecording = (recording: Recording) => {
    if (audioRef.current) {
      if (isPlaying && selectedRecording?.id === recording.id) {
        audioRef.current.pause()
        setIsPlaying(false)
      } else {
        audioRef.current.src = `file://${recording.file_path}`
        audioRef.current.play()
        setSelectedRecording(recording)
        setIsPlaying(true)
      }
    }
  }

  const deleteRecording = async (id: number) => {
    if (confirm('確定要刪除此錄音？')) {
      try {
        await window.electronAPI.recording.delete(id)
        await loadRecordings()
        if (selectedRecording?.id === id) {
          setSelectedRecording(null)
          setIsPlaying(false)
        }
      } catch (error) {
        console.error('刪除錄音失敗:', error)
        alert('刪除錄音失敗')
      }
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
    <div className="p-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Mic size={20} strokeWidth={1.5} className="text-base-content/60" />
          <span className="text-sm text-base-content/60">會議錄音</span>
        </div>
      </div>

      {/* Recording Control */}
      <div className="card bg-base-100 border border-base-300 mb-4">
        <div className="card-body p-6">
          <div className="flex items-center justify-between">
            <div>
              {isRecording ? (
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-error animate-pulse"></div>
                  <span className="text-sm">錄音中</span>
                  <span className="text-lg font-mono tabular-nums">{formatTime(recordingTime)}</span>
                </div>
              ) : (
                <span className="text-sm text-base-content/60">點擊開始錄音</span>
              )}
            </div>

            <button
              className={`btn ${isRecording ? 'btn-error' : 'btn-primary'} gap-2`}
              onClick={isRecording ? stopRecording : startRecording}
            >
              {isRecording ? (
                <>
                  <Square size={18} strokeWidth={1.5} />
                  停止錄音
                </>
              ) : (
                <>
                  <Mic size={18} strokeWidth={1.5} />
                  開始錄音
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Recordings List */}
      <div className="flex-1 overflow-y-auto">
        <h3 className="text-sm font-medium mb-3">錄音列表</h3>

        {recordings.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-base-content/40">
            <FileAudio size={48} strokeWidth={1} className="mb-2" />
            <span className="text-sm">尚無錄音</span>
          </div>
        ) : (
          <div className="space-y-2">
            {recordings.map(recording => (
              <div
                key={recording.id}
                className={`card bg-base-100 border transition-all ${
                  selectedRecording?.id === recording.id
                    ? 'border-primary'
                    : 'border-base-300 hover:border-base-400'
                }`}
              >
                <div className="card-body p-4">
                  <div className="flex items-center gap-3">
                    <button
                      className="btn btn-circle btn-sm btn-ghost"
                      onClick={() => playRecording(recording)}
                    >
                      {isPlaying && selectedRecording?.id === recording.id ? (
                        <Pause size={16} strokeWidth={1.5} />
                      ) : (
                        <Play size={16} strokeWidth={1.5} />
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium truncate">{recording.title}</h4>
                      <div className="flex items-center gap-3 text-xs text-base-content/50 mt-1">
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {formatTime(recording.duration)}
                        </span>
                        <span>{formatSize(recording.size)}</span>
                        <span>{new Date(recording.created_at).toLocaleDateString('zh-TW')}</span>
                      </div>
                    </div>

                    <button
                      className="btn btn-ghost btn-xs btn-square"
                      onClick={() => deleteRecording(recording.id)}
                    >
                      <Trash2 size={14} strokeWidth={1.5} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Audio Player (hidden) */}
      <audio
        ref={audioRef}
        onEnded={() => setIsPlaying(false)}
        onPause={() => setIsPlaying(false)}
      />

      {/* Feature Note */}
      <div className="mt-4 p-3 bg-base-200 rounded-lg">
        <p className="text-xs text-base-content/60">
          💡 提示：錄音功能已啟用。Whisper AI 轉錄功能需要在 .env 中配置 API Key
        </p>
      </div>
    </div>
  )
}

export default Recording
