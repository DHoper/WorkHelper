/**
 * Error Boundary Component
 * 基於 React 最佳實踐，捕獲和處理組件錯誤
 */

import { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by ErrorBoundary:', error, errorInfo)

    this.setState({
      error,
      errorInfo
    })

    // 記錄錯誤到日誌系統（如果有的話）
    // window.electronAPI.logging?.error({
    //   message: error.message,
    //   stack: error.stack,
    //   componentStack: errorInfo.componentStack
    // })
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex flex-col items-center justify-center h-full p-6 bg-gray-50">
          <div className="max-w-md w-full bg-white rounded-lg border border-red-200 p-6">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center mr-3">
                <svg
                  className="w-6 h-6 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-gray-900">應用程式發生錯誤</h2>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">錯誤訊息：</p>
              <pre className="text-xs text-red-600 bg-red-50 p-3 rounded border border-red-200 overflow-auto max-h-32">
                {this.state.error?.message}
              </pre>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error?.stack && (
              <details className="mb-4">
                <summary className="text-sm text-gray-600 cursor-pointer hover:text-gray-900">
                  詳細堆疊追蹤
                </summary>
                <pre className="text-xs text-gray-600 bg-gray-50 p-3 rounded border border-gray-200 overflow-auto max-h-48 mt-2">
                  {this.state.error.stack}
                </pre>
              </details>
            )}

            <button
              onClick={this.handleReset}
              className="w-full px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
            >
              重新載入
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// 函數式錯誤回退組件
export function ErrorFallback({ error, resetError }: { error: Error; resetError?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full p-6">
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-900 mb-2">出錯了</h2>
        <p className="text-sm text-gray-600 mb-4">{error.message}</p>
        {resetError && (
          <button
            onClick={resetError}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            重試
          </button>
        )}
      </div>
    </div>
  )
}
