import { useState, useCallback, useRef } from 'react'
import { useToast } from '@/hooks/useToast'

interface RetryOptions {
  maxAttempts?: number
  delay?: number
  backoffMultiplier?: number
  onError?: (error: Error, attempt: number) => void
  onSuccess?: () => void
  onRetry?: (error: Error, attempt: number) => void
}

interface RetryState {
  isLoading: boolean
  error: Error | null
  attempt: number
}

/**
 * Custom hook for handling API retry logic with exponential backoff
 * @param asyncFunction - The async function to retry
 * @param options - Retry configuration options
 * @returns Object with execute function and retry state
 */
export function useRetry<T>(
  asyncFunction: () => Promise<T>,
  options: RetryOptions = {}
) {
  const {
    maxAttempts = 3,
    delay = 1000,
    backoffMultiplier = 2,
    onError,
    onSuccess,
    onRetry
  } = options

  const { showError, showSuccess } = useToast()
  const [state, setState] = useState<RetryState>({
    isLoading: false,
    error: null,
    attempt: 0
  })
  const [isCircuitOpen, setIsCircuitOpen] = useState(false)
  const lastFailureTime = useRef<number>(0)
  const consecutiveFailures = useRef<number>(0)

  /**
   * Sleep utility function for delays
   */
  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

  /**
   * Execute the async function with retry logic
   */
  const execute = useCallback(async (): Promise<T | null> => {
    // Circuit breaker: if too many consecutive failures, wait before trying again
    const now = Date.now()
    const circuitBreakerTimeout = 30000 // 30 seconds
    
    if (isCircuitOpen && now - lastFailureTime.current < circuitBreakerTimeout) {
      const remainingTime = Math.ceil((circuitBreakerTimeout - (now - lastFailureTime.current)) / 1000)
      showError(`Too many failures. Please wait ${remainingTime} seconds before retrying.`)
      return null
    }

    setState(prev => ({ ...prev, isLoading: true, error: null, attempt: 0 }))

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        setState(prev => ({ ...prev, attempt }))
        
        const result = await asyncFunction()
        
        setState(prev => ({ ...prev, isLoading: false, error: null }))
        
        // Reset circuit breaker on success
        consecutiveFailures.current = 0
        setIsCircuitOpen(false)
        
        if (onSuccess) {
          onSuccess()
        }
        
        if (attempt > 1) {
          showSuccess('Operation completed successfully after retry')
        }
        
        return result
      } catch (error) {
        const err = error as Error
        
        setState(prev => ({ ...prev, error: err }))
        
        if (onRetry) {
          onRetry(err, attempt)
        }
        
        if (onError) {
          onError(err, attempt)
        }
        
        // If this is the last attempt, don't retry
        if (attempt === maxAttempts) {
          setState(prev => ({ ...prev, isLoading: false }))
          
          // Increment consecutive failures and potentially open circuit breaker
          consecutiveFailures.current++
          lastFailureTime.current = now
          
          if (consecutiveFailures.current >= 3) {
            setIsCircuitOpen(true)
            showError(`Multiple failures detected. Circuit breaker activated for 30 seconds.`)
          } else {
            showError(`Operation failed after ${maxAttempts} attempts: ${err.message}`)
          }
          
          throw err
        }
        
        // Exponential backoff with jitter to prevent thundering herd
        const baseDelay = delay * Math.pow(backoffMultiplier, attempt - 1)
        const jitter = Math.random() * 1000
        const currentDelay = Math.min(baseDelay + jitter, 10000) // Cap at 10 seconds
        
        showError(`Attempt ${attempt} failed. Retrying in ${Math.ceil(currentDelay / 1000)}s...`)
        
        // Wait before next attempt
        await sleep(currentDelay)
      }
    }
    
    setState(prev => ({ ...prev, isLoading: false }))
    return null
  }, [asyncFunction, maxAttempts, delay, backoffMultiplier, onError, onSuccess, onRetry, showError, showSuccess, isCircuitOpen])

  /**
   * Reset the retry state
   */
  const reset = useCallback(() => {
    setState({
      isLoading: false,
      error: null,
      attempt: 0
    })
  }, [])

  return {
    execute,
    reset,
    ...state
  }
}

/**
 * Hook for retrying fetch operations specifically
 * @param url - The URL to fetch
 * @param options - Fetch options and retry configuration
 * @returns Object with fetch function and retry state
 */
export function useRetryFetch(
  url: string,
  fetchOptions: RequestInit = {},
  retryOptions: RetryOptions = {}
) {
  const fetchFunction = useCallback(async () => {
    const response = await fetch(url, fetchOptions)
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    return response.json()
  }, [url, fetchOptions])

  return useRetry(fetchFunction, retryOptions)
}

/**
 * Hook for retrying API calls with authentication
 * @param apiCall - The API call function
 * @param options - Retry configuration options
 * @returns Object with execute function and retry state
 */
export function useRetryApiCall<T>(
  apiCall: () => Promise<T>,
  options: RetryOptions = {}
) {
  const retryOptions = {
    maxAttempts: 3,
    delay: 1000,
    backoffMultiplier: 1.5,
    ...options
  }

  return useRetry(apiCall, retryOptions)
}