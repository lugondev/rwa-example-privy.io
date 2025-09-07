import { useCallback, useRef } from 'react'

/**
 * Custom hook for debouncing function calls
 * Prevents multiple rapid calls to the same function
 */
export const useDebounce = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      // Set new timeout
      timeoutRef.current = setTimeout(() => {
        callback(...args)
      }, delay)
    },
    [callback, delay]
  ) as T

  return debouncedCallback
}

/**
 * Custom hook for debouncing async function calls
 * Returns a promise that resolves with the debounced result
 */
export const useAsyncDebounce = <T extends (...args: any[]) => Promise<any>>(
  callback: T,
  delay: number
): T => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const promiseRef = useRef<{
    resolve: (value: any) => void
    reject: (reason: any) => void
  } | null>(null)

  const debouncedCallback = useCallback(
    (...args: Parameters<T>): Promise<Awaited<ReturnType<T>>> => {
      return new Promise((resolve, reject) => {
        // Clear existing timeout and reject previous promise
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
          if (promiseRef.current) {
            promiseRef.current.reject(new Error('Debounced: newer call initiated'))
          }
        }

        // Store promise handlers
        promiseRef.current = { resolve, reject }

        // Set new timeout
        timeoutRef.current = setTimeout(async () => {
          try {
            const result = await callback(...args)
            resolve(result)
          } catch (error) {
            reject(error)
          } finally {
            promiseRef.current = null
          }
        }, delay)
      })
    },
    [callback, delay]
  ) as T

  return debouncedCallback
}

/**
 * Custom hook for throttling function calls
 * Ensures function is called at most once per specified interval
 */
export const useThrottle = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T => {
  const lastCallRef = useRef<number>(0)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const throttledCallback = useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now()
      const timeSinceLastCall = now - lastCallRef.current

      if (timeSinceLastCall >= delay) {
        // Call immediately if enough time has passed
        lastCallRef.current = now
        callback(...args)
      } else {
        // Schedule call for later if not enough time has passed
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }
        
        timeoutRef.current = setTimeout(() => {
          lastCallRef.current = Date.now()
          callback(...args)
        }, delay - timeSinceLastCall)
      }
    },
    [callback, delay]
  ) as T

  return throttledCallback
}