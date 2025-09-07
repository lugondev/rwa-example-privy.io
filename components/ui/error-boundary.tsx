'use client'

import React from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from './button'
import { Alert, AlertDescription, AlertTitle } from './alert'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>
}

/**
 * Error boundary component to catch and handle React errors
 * Provides fallback UI when components throw errors
 */
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback
        return (
          <FallbackComponent 
            error={this.state.error!} 
            resetError={this.resetError} 
          />
        )
      }

      return <DefaultErrorFallback error={this.state.error!} resetError={this.resetError} />
    }

    return this.props.children
  }
}

/**
 * Default error fallback component
 */
function DefaultErrorFallback({ 
  error, 
  resetError 
}: { 
  error: Error
  resetError: () => void 
}) {
  return (
    <div className="flex items-center justify-center min-h-[400px] p-6">
      <div className="max-w-md w-full">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Đã xảy ra lỗi</AlertTitle>
          <AlertDescription className="mt-2">
            {error.message || 'Có lỗi không mong muốn xảy ra. Vui lòng thử lại.'}
          </AlertDescription>
        </Alert>
        
        <div className="mt-4 flex gap-2">
          <Button onClick={resetError} variant="outline" className="flex-1">
            <RefreshCw className="h-4 w-4 mr-2" />
            Thử lại
          </Button>
          <Button 
            onClick={() => window.location.reload()} 
            variant="default" 
            className="flex-1"
          >
            Tải lại trang
          </Button>
        </div>
      </div>
    </div>
  )
}

/**
 * API error fallback component for data fetching errors
 */
function ApiErrorFallback({ 
  error, 
  onRetry,
  isRetrying = false
}: { 
  error: Error
  onRetry?: () => void
  isRetrying?: boolean
}) {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">
          Không thể tải dữ liệu
        </h3>
        <p className="text-slate-400 mb-4">
          {error.message || 'Có lỗi xảy ra khi tải dữ liệu. Vui lòng thử lại.'}
        </p>
        {onRetry && (
          <Button 
            onClick={onRetry} 
            variant="outline"
            disabled={isRetrying}
            className="disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRetrying ? 'animate-spin' : ''}`} />
            {isRetrying ? 'Đang thử lại...' : 'Thử lại'}
          </Button>
        )}
      </div>
    </div>
  )
}

/**
 * Network error fallback component
 */
function NetworkErrorFallback({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">
          Lỗi kết nối mạng
        </h3>
        <p className="text-slate-400 mb-4">
          Không thể kết nối đến server. Vui lòng kiểm tra kết nối internet và thử lại.
        </p>
        {onRetry && (
          <Button onClick={onRetry} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Thử lại
          </Button>
        )}
      </div>
    </div>
  )
}

export {
  ErrorBoundary,
  DefaultErrorFallback,
  ApiErrorFallback,
  NetworkErrorFallback,
}