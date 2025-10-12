import { useState, useEffect, useRef } from 'react'
import { Mic, Square, Play, Pause, Trash2, FileAudio, Clock, Download, MessageSquare, Upload, Settings } from 'lucide-react'
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

interface Transcription {
  id: number
  recording_id: number
  content: string
  language: string
  created_at: string
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
  const [transcriptions, setTranscriptions] = useState<Map<number, Transcription>>(new Map())
  const [isTranscribing, setIsTranscribing] = useState<number | null>(null)
  const [showApiKeyModal, setShowApiKeyModal] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    loadRecordings()
    loadApiKey()

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
    // 載入所有錄音的轉錄記錄
    recordings.forEach(recording => {
      loadTranscription(recording.id)
    })
  }, [recordings])

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

  const loadTranscription = async (recordingId: number) => {
    try {
      const transcription = await window.electronAPI.transcription.get(recordingId)
      if (transcription) {
        setTranscriptions(prev => new Map(prev).set(recordingId, transcription as Transcription))
      }
    } catch (error) {
      console.error('Load transcription error:', error)
    }
  }

  const loadApiKey = () => {
    const savedKey = localStorage.getItem('openai_api_key')
    if (savedKey) {
      setApiKey(savedKey)
    }
  }

  const saveApiKey = () => {
    if (apiKey.trim()) {
      localStorage.setItem('openai_api_key', apiKey.trim())
      setShowApiKeyModal(false)
      setToast({ show: true, message: 'API Key 已保存', type: 'success' })
    } else {
      setToast({ show: true, message: '請輸入有效的 API Key', type: 'warning' })
    }
  }

  const transcribeRecording = async (recording: Recording) => {
    if (!apiKey || apiKey.trim() === '') {
      setToast({ show: true, message: '請先設置 OpenAI API Key', type: 'warning' })
      setShowApiKeyModal(true)
      return
    }

    setIsTranscribing(recording.id)
    try {
      setToast({ show: true, message: '正在轉錄...', type: 'info' })
      const transcription = await window.electronAPI.transcription.whisper(recording.file_path, apiKey)

      // 保存轉錄結果
      await window.electronAPI.transcription.save(recording.id, transcription, 'zh')

      // 重新載入轉錄記錄
      await loadTranscription(recording.id)

      setToast({ show: true, message: '轉錄完成', type: 'success' })
    } catch (error: any) {
      console.error('Transcription error:', error)
      setToast({ show: true, message: error.message || '轉錄失敗', type: 'error' })
    } finally {
      setIsTranscribing(null)
    }
  }

  const handleUploadFile = async () => {
    if (!selectedFile) {
      setToast({ show: true, message: '請選擇檔案', type: 'warning' })
      return
    }

    if (!apiKey || apiKey.trim() === '') {
      setToast({ show: true, message: '請先設置 OpenAI API Key', type: 'warning' })
      setShowApiKeyModal(true)
      return
    }

    try {
      setToast({ show: true, message: '正在上傳並轉錄...', type: 'info' })

      // 獲取文件路徑
      const filePath = await window.electronAPI.recording.getFilePath(selectedFile.name.split('.').pop() || 'webm')

      // 將文件寫入臨時位置
      const arrayBuffer = await selectedFile.arrayBuffer()
      await window.electronAPI.recording.writeFile(filePath, new Uint8Array(arrayBuffer) as any)

      // 保存錄音記錄
      const metadata = {
        title: selectedFile.name,
        duration: 0, // 上傳的文件無法獲取時長
        size: selectedFile.size,
        format: selectedFile.name.split('.').pop() || 'webm',
        tags: 'uploaded'
      }

      const recordingId = await window.electronAPI.recording.save(metadata, filePath)

      // 調用 Whisper API 轉錄
      const transcription = await window.electronAPI.transcription.whisper(filePath, apiKey)

      // 保存轉錄結果
      await window.electronAPI.transcription.save(recordingId as number, transcription, 'zh')

      // 重新載入錄音列表
      await loadRecordings()

      setShowUploadModal(false)
      setSelectedFile(null)
      setToast({ show: true, message: '上傳並轉錄完成', type: 'success' })
    } catch (error: any) {
      console.error('Upload and transcribe error:', error)
      setToast({ show: true, message: error.message || '上傳失敗', type: 'error' })
    }
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
            <div className="flex items-center gap-2">
              <button
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-all text-xs font-medium"
                onClick={() => setShowUploadModal(true)}
              >
                <Upload size={14} strokeWidth={2} />
                上傳
              </button>
              <button
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-all text-xs font-medium"
                onClick={() => setShowApiKeyModal(true)}
                title="設定 API Key"
              >
                <Settings size={14} strokeWidth={2} />
                API Key
              </button>
            </div>
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
                        className="w-9 h-9 rounded-lg hover:bg-purple-50 text-gray-400 hover:text-purple-500 flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={() => transcribeRecording(recording)}
                        disabled={isTranscribing === recording.id}
                        title="Whisper 轉錄"
                      >
                        <MessageSquare size={16} strokeWidth={2} />
                      </button>

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

                  {/* Transcription Display */}
                  {transcriptions.get(recording.id) && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="flex items-center gap-2 mb-2">
                        <MessageSquare size={14} className="text-purple-500" strokeWidth={2} />
                        <span className="text-xs font-medium text-gray-700">轉錄文本</span>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed">
                          {transcriptions.get(recording.id)?.content}
                        </p>
                      </div>
                    </div>
                  )}
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

      {/* API Key Modal */}
      {showApiKeyModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in" onClick={() => setShowApiKeyModal(false)}>
          <div className="premium-card w-full max-w-md mx-4 p-6 animate-scale-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-gray-900">設定 OpenAI API Key</h3>
              <button
                className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 transition-all"
                onClick={() => setShowApiKeyModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">API Key</label>
                <input
                  type="password"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-..."
                  autoFocus
                />
              </div>

              <div className="p-3 bg-blue-50 rounded-xl">
                <p className="text-xs text-blue-700">
                  您可以在 <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="underline font-medium">OpenAI Platform</a> 取得 API Key
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 mt-6">
              <button
                className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition-all"
                onClick={() => setShowApiKeyModal(false)}
              >
                取消
              </button>
              <button
                className="px-4 py-2 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 text-white shadow-lg hover:shadow-xl transition-all text-sm font-medium"
                onClick={saveApiKey}
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload File Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in" onClick={() => setShowUploadModal(false)}>
          <div className="premium-card w-full max-w-md mx-4 p-6 animate-scale-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-gray-900">上傳音訊檔案</h3>
              <button
                className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 transition-all"
                onClick={() => setShowUploadModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">選擇檔案</label>
                <input
                  type="file"
                  accept="audio/*"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                />
              </div>

              {selectedFile && (
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-700">
                    <span className="font-medium">檔案：</span>{selectedFile.name}
                  </p>
                  <p className="text-xs text-gray-700 mt-1">
                    <span className="font-medium">大小：</span>{(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              )}

              <div className="p-3 bg-blue-50 rounded-xl">
                <p className="text-xs text-blue-700">
                  上傳的檔案將自動使用 Whisper API 進行轉錄
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 mt-6">
              <button
                className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition-all"
                onClick={() => {
                  setShowUploadModal(false)
                  setSelectedFile(null)
                }}
              >
                取消
              </button>
              <button
                className="px-4 py-2 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 text-white shadow-lg hover:shadow-xl transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleUploadFile}
                disabled={!selectedFile}
              >
                上傳並轉錄
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Recording
