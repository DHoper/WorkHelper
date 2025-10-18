import { useState, useEffect, useRef } from 'react'
import { Mic, Square, Play, Pause, Trash2, FileAudio, Clock, Download, MessageSquare, Upload, Settings, Sparkles, FileText, Edit2, Search, Volume2 } from 'lucide-react'
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

interface Summary {
  recordingId: number
  content: string
  createdAt: string
}

const Recording = () => {
  const [recordings, setRecordings] = useState<Recording[]>([])
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioLevel, setAudioLevel] = useState(0)
  const [selectedRecording, setSelectedRecording] = useState<Recording | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [playbackTime, setPlaybackTime] = useState(0)
  const [playbackSpeed, setPlaybackSpeed] = useState(1)
  const [currentAudioUrl, setCurrentAudioUrl] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; id: number | null }>({ show: false, id: null })
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' | 'warning' | 'info' }>({ show: false, message: '', type: 'info' })
  const [transcriptions, setTranscriptions] = useState<Map<number, Transcription>>(new Map())
  const [summaries, setSummaries] = useState<Map<number, Summary>>(new Map())
  const [isTranscribing, setIsTranscribing] = useState<number | null>(null)
  const [isGeneratingSummary, setIsGeneratingSummary] = useState<number | null>(null)
  const [showApiKeyModal, setShowApiKeyModal] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [editingRecordingId, setEditingRecordingId] = useState<number | null>(null)
  const [editingTitle, setEditingTitle] = useState('')

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationFrameRef = useRef<number | null>(null)

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
      setToast({ show: true, message: '正在轉錄...可能需要幾分鐘', type: 'info' })
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

  const generateSummary = async (recording: Recording) => {
    const transcription = transcriptions.get(recording.id)
    if (!transcription) {
      setToast({ show: true, message: '請先生成逐字稿', type: 'warning' })
      return
    }

    if (!apiKey || apiKey.trim() === '') {
      setToast({ show: true, message: '請先設置 OpenAI API Key', type: 'warning' })
      setShowApiKeyModal(true)
      return
    }

    setIsGeneratingSummary(recording.id)
    try {
      setToast({ show: true, message: '正在生成摘要...', type: 'info' })

      const summary = await window.electronAPI.transcription.generateSummary(transcription.content, apiKey)

      setSummaries(prev => new Map(prev).set(recording.id, {
        recordingId: recording.id,
        content: summary,
        createdAt: new Date().toISOString()
      }))

      setToast({ show: true, message: '摘要生成完成', type: 'success' })
    } catch (error: any) {
      console.error('Summary generation error:', error)
      setToast({ show: true, message: error.message || '生成摘要失敗', type: 'error' })
    } finally {
      setIsGeneratingSummary(null)
    }
  }

  const processCompleteRecording = async (recording: Recording) => {
    if (!apiKey || apiKey.trim() === '') {
      setToast({ show: true, message: '請先設置 OpenAI API Key', type: 'warning' })
      setShowApiKeyModal(true)
      return
    }

    setIsTranscribing(recording.id)
    setIsGeneratingSummary(recording.id)

    try {
      setToast({ show: true, message: '正在處理錄音...這可能需要幾分鐘', type: 'info' })

      // 使用新的完整處理流程
      const result = await window.electronAPI.transcription.processLongRecording(recording.file_path, apiKey)

      // 保存轉錄結果
      await window.electronAPI.transcription.save(recording.id, result.transcription, 'zh')
      await loadTranscription(recording.id)

      // 保存摘要
      setSummaries(prev => new Map(prev).set(recording.id, {
        recordingId: recording.id,
        content: result.summary,
        createdAt: new Date().toISOString()
      }))

      setToast({ show: true, message: '處理完成！已生成逐字稿和摘要', type: 'success' })
    } catch (error: any) {
      console.error('Processing error:', error)
      setToast({ show: true, message: error.message || '處理失敗', type: 'error' })
    } finally {
      setIsTranscribing(null)
      setIsGeneratingSummary(null)
    }
  }

  const handleUploadFile = async () => {
    if (!selectedFile) {
      setToast({ show: true, message: '請選擇檔案', type: 'warning' })
      return
    }

    try {
      setToast({ show: true, message: '正在上傳檔案...', type: 'info' })

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

      await window.electronAPI.recording.save(metadata, filePath)

      // 重新載入錄音列表
      await loadRecordings()

      setShowUploadModal(false)
      setSelectedFile(null)
      setToast({ show: true, message: '檔案上傳成功！您現在可以點擊轉錄按鈕進行轉錄', type: 'success' })
    } catch (error: any) {
      console.error('Upload error:', error)
      setToast({ show: true, message: error.message || '上傳失敗', type: 'error' })
    }
  }

  // 監控音頻級別
  const monitorAudioLevel = (stream: MediaStream) => {
    try {
      const audioContext = new AudioContext()
      const analyser = audioContext.createAnalyser()
      const source = audioContext.createMediaStreamSource(stream)

      analyser.fftSize = 256
      source.connect(analyser)

      audioContextRef.current = audioContext
      analyserRef.current = analyser

      const dataArray = new Uint8Array(analyser.frequencyBinCount)

      const updateLevel = () => {
        if (!analyserRef.current) return

        analyser.getByteFrequencyData(dataArray)
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length
        setAudioLevel(Math.min(100, (average / 255) * 100))

        animationFrameRef.current = requestAnimationFrame(updateLevel)
      }

      updateLevel()
    } catch (error) {
      console.error('Audio level monitoring error:', error)
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

      // 啟動音頻級別監控
      monitorAudioLevel(stream)

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        await saveRecording(blob)
        stream.getTracks().forEach(track => track.stop())

        // 清理音頻分析器
        if (audioContextRef.current) {
          audioContextRef.current.close()
          audioContextRef.current = null
        }
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current)
          animationFrameRef.current = null
        }
        setAudioLevel(0)
      }

      mediaRecorder.onerror = (e) => {
        console.error('MediaRecorder error:', e)
        setToast({ show: true, message: '錄音過程中發生錯誤', type: 'error' })
        stopRecording()
      }

      mediaRecorder.start(1000)
      setIsRecording(true)
      setIsPaused(false)
      setRecordingTime(0)

      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
    } catch (error) {
      console.error('錄音失敗:', error)
      setToast({ show: true, message: '無法開始錄音，請確認麥克風權限', type: 'error' })
    }
  }

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording && !isPaused) {
      mediaRecorderRef.current.pause()
      setIsPaused(true)
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }

  const resumeRecording = () => {
    if (mediaRecorderRef.current && isRecording && isPaused) {
      mediaRecorderRef.current.resume()
      setIsPaused(false)
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
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
          audioRef.current.playbackRate = playbackSpeed
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

  const changePlaybackSpeed = (speed: number) => {
    setPlaybackSpeed(speed)
    if (audioRef.current) {
      audioRef.current.playbackRate = speed
    }
  }

  const seekAudio = (time: number) => {
    if (audioRef.current && selectedRecording) {
      audioRef.current.currentTime = time
      setPlaybackTime(Math.floor(time))
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

  const updateRecordingTitle = async (id: number, newTitle: string) => {
    try {
      await window.electronAPI.recording.update(id, { title: newTitle })
      await loadRecordings()
      setEditingRecordingId(null)
      setToast({ show: true, message: '標題已更新', type: 'success' })
    } catch (error) {
      console.error('更新標題失敗:', error)
      setToast({ show: true, message: '更新標題失敗', type: 'error' })
    }
  }

  const filteredRecordings = recordings.filter(recording => {
    return recording.title.toLowerCase().includes(searchQuery.toLowerCase())
  })

  return (
    <div className="h-full p-6 bg-white">
      <div className="max-w-3xl mx-auto h-full flex flex-col">
        {/* Header */}
        <div className="mb-5">
          <h2 className="text-xl font-bold text-gray-900">會議錄音</h2>
        </div>

        {/* Recording Control */}
        <div className="p-5 border border-gray-200 rounded-lg mb-5 bg-white shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center relative ${
                isRecording ? (isPaused ? 'bg-yellow-500' : 'bg-red-500 animate-pulse') : 'bg-gray-900'
              }`}>
                <Mic size={22} className="text-white" strokeWidth={2} />
              </div>
              <div>
                {isRecording ? (
                  <>
                    <p className="text-xl font-mono font-bold text-gray-900">{formatTime(recordingTime)}</p>
                    <p className="text-xs text-gray-500">{isPaused ? '已暫停' : '錄音中...'}</p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-medium text-gray-700">準備開始錄音</p>
                    <p className="text-xs text-gray-500">點擊錄音按鈕開始</p>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isRecording && (
                <button
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all text-sm font-medium ${
                    isPaused
                      ? 'bg-green-500 hover:bg-green-600 text-white'
                      : 'bg-yellow-500 hover:bg-yellow-600 text-white'
                  }`}
                  onClick={isPaused ? resumeRecording : pauseRecording}
                >
                  {isPaused ? (
                    <>
                      <Play size={14} strokeWidth={2} />
                      繼續
                    </>
                  ) : (
                    <>
                      <Pause size={14} strokeWidth={2} />
                      暫停
                    </>
                  )}
                </button>
              )}
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

          {/* Audio Level Meter */}
          {isRecording && !isPaused && (
            <div className="mt-3">
              <div className="flex items-center gap-2 mb-1">
                <Volume2 size={14} className="text-gray-500" strokeWidth={2} />
                <span className="text-xs text-gray-600">音量</span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-400 via-yellow-400 to-red-500 transition-all duration-100"
                  style={{ width: `${audioLevel}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Recordings List */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Search and Filter Bar */}
          <div className="mb-4 space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex-1 relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" strokeWidth={2} />
                <input
                  type="text"
                  placeholder="搜索錄音..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                />
              </div>
              <button
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-all text-xs font-medium"
                onClick={() => setShowUploadModal(true)}
              >
                <Upload size={14} strokeWidth={2} />
                上傳
              </button>
              <button
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-all text-xs font-medium"
                onClick={() => setShowApiKeyModal(true)}
                title="設定 API Key"
              >
                <Settings size={14} strokeWidth={2} />
                API Key
              </button>
            </div>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-700">錄音列表 ({filteredRecordings.length}/{recordings.length})</h3>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3">
            {filteredRecordings.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <FileAudio size={40} strokeWidth={1.5} />
                <span className="text-sm mt-3">{recordings.length === 0 ? '尚無錄音' : '無符合條件的錄音'}</span>
              </div>
            ) : (
              filteredRecordings.map(recording => (
                <div
                  key={recording.id}
                  className={`p-4 border rounded-xl transition-all shadow-sm hover:shadow-md ${
                    selectedRecording?.id === recording.id
                      ? 'border-gray-900 bg-gradient-to-br from-gray-50 to-white'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <button
                      className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all flex-shrink-0 ${
                        isPlaying && selectedRecording?.id === recording.id
                          ? 'bg-gray-900 text-white shadow-lg'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                      }`}
                      onClick={() => playRecording(recording)}
                      title={isPlaying && selectedRecording?.id === recording.id ? '暫停' : '播放'}
                    >
                      {isPlaying && selectedRecording?.id === recording.id ? (
                        <Pause size={20} strokeWidth={2} />
                      ) : (
                        <Play size={20} strokeWidth={2} />
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      {/* Title with Edit */}
                      <div className="flex items-center gap-2 mb-2">
                        {editingRecordingId === recording.id ? (
                          <input
                            type="text"
                            value={editingTitle}
                            onChange={(e) => setEditingTitle(e.target.value)}
                            onBlur={() => updateRecordingTitle(recording.id, editingTitle)}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                updateRecordingTitle(recording.id, editingTitle)
                              }
                            }}
                            autoFocus
                            className="flex-1 px-2 py-1 text-sm font-semibold text-gray-900 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-gray-900"
                          />
                        ) : (
                          <>
                            <h4 className="flex-1 text-sm font-semibold text-gray-900 truncate">{recording.title}</h4>
                            <button
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-gray-100 rounded-lg"
                              onClick={() => {
                                setEditingRecordingId(recording.id)
                                setEditingTitle(recording.title)
                              }}
                              title="編輯標題"
                            >
                              <Edit2 size={14} className="text-gray-500" strokeWidth={2} />
                            </button>
                          </>
                        )}
                      </div>

                      {/* Time and Size Info */}
                      <div className="flex items-center gap-3 text-xs text-gray-500 mb-2">
                        <span className="flex items-center gap-1">
                          <Clock size={12} strokeWidth={2} />
                          {formatTime(recording.duration)}
                        </span>
                        <span>{formatSize(recording.size)}</span>
                        <span>{new Date(recording.created_at).toLocaleDateString('zh-TW')}</span>
                      </div>

                      {/* Playback Progress and Speed Control */}
                      {isPlaying && selectedRecording?.id === recording.id && (
                        <div className="space-y-2 mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono text-gray-600">{formatTime(playbackTime)}</span>
                            <input
                              type="range"
                              min="0"
                              max={recording.duration}
                              value={playbackTime}
                              onChange={(e) => seekAudio(Number(e.target.value))}
                              className="flex-1 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gray-900"
                            />
                            <span className="text-xs font-mono text-gray-600">{formatTime(recording.duration)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-600">速度:</span>
                            {[0.5, 0.75, 1, 1.25, 1.5, 2].map(speed => (
                              <button
                                key={speed}
                                onClick={() => changePlaybackSpeed(speed)}
                                className={`px-2 py-1 text-xs rounded transition-all ${
                                  playbackSpeed === speed
                                    ? 'bg-gray-900 text-white'
                                    : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                                }`}
                              >
                                {speed}x
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                      <button
                        className="w-10 h-10 rounded-lg hover:bg-green-50 text-gray-400 hover:text-green-500 flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={() => processCompleteRecording(recording)}
                        disabled={isTranscribing === recording.id || isGeneratingSummary === recording.id}
                        title="完整處理（逐字稿+摘要）"
                      >
                        <Sparkles size={18} strokeWidth={2} />
                      </button>

                      <button
                        className="w-10 h-10 rounded-lg hover:bg-purple-50 text-gray-400 hover:text-purple-500 flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={() => transcribeRecording(recording)}
                        disabled={isTranscribing === recording.id}
                        title="生成逐字稿"
                      >
                        <MessageSquare size={18} strokeWidth={2} />
                      </button>

                      <button
                        className="w-10 h-10 rounded-lg hover:bg-indigo-50 text-gray-400 hover:text-indigo-500 flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={() => generateSummary(recording)}
                        disabled={isGeneratingSummary === recording.id || !transcriptions.has(recording.id)}
                        title="生成摘要"
                      >
                        <FileText size={18} strokeWidth={2} />
                      </button>

                      <button
                        className="w-10 h-10 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-500 flex items-center justify-center transition-all"
                        onClick={() => downloadRecording(recording)}
                        title="下載錄音"
                      >
                        <Download size={18} strokeWidth={2} />
                      </button>

                      <button
                        className="w-10 h-10 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 flex items-center justify-center transition-all"
                        onClick={() => handleDeleteClick(recording.id)}
                        title="刪除錄音"
                      >
                        <Trash2 size={18} strokeWidth={2} />
                      </button>
                    </div>
                  </div>

                  {/* Transcription and Summary Display */}
                  {(transcriptions.get(recording.id) || summaries.get(recording.id)) && (
                    <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
                      {/* Summary Display */}
                      {summaries.get(recording.id) && (
                        <div>
                          <div className="flex items-center gap-2 mb-2.5">
                            <Sparkles size={14} className="text-green-500" strokeWidth={2} />
                            <span className="text-xs font-medium text-gray-700">摘要</span>
                          </div>
                          <div className="p-3.5 bg-green-50 rounded-lg">
                            <p className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed">
                              {summaries.get(recording.id)?.content}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Transcription Display */}
                      {transcriptions.get(recording.id) && (
                        <details className="group/details">
                          <summary className="flex items-center gap-2 cursor-pointer">
                            <MessageSquare size={14} className="text-purple-500" strokeWidth={2} />
                            <span className="text-xs font-medium text-gray-700">逐字稿</span>
                            <span className="text-xs text-gray-500 ml-auto group-open/details:hidden">點擊展開</span>
                            <span className="text-xs text-gray-500 ml-auto hidden group-open/details:inline">點擊收起</span>
                          </summary>
                          <div className="mt-2.5 p-3.5 bg-gray-50 rounded-lg max-h-96 overflow-y-auto">
                            <p className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed">
                              {transcriptions.get(recording.id)?.content}
                            </p>
                          </div>
                        </details>
                      )}
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
          setPlaybackTime(0)
          if (currentAudioUrl) {
            URL.revokeObjectURL(currentAudioUrl)
            setCurrentAudioUrl(null)
          }
        }}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={(e) => {
          const audio = e.target as HTMLAudioElement
          setPlaybackTime(Math.floor(audio.currentTime))
        }}
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
                  上傳後，您可以使用轉錄按鈕將音訊轉換為文字
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
                上傳
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Recording
