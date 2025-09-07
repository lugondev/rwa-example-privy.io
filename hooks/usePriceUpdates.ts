import { useState, useEffect, useCallback, useRef } from 'react'
import { useAsyncDebounce } from './useDebounce'

// Types for price data
interface PriceData {
  assetId: string
  currentPrice: number
  change24h: number
  change24hPercentage: number
  lastUpdated: string
  volume24h?: number
  marketCap?: number
}

interface PriceUpdateHookOptions {
  assetIds?: string[]
  updateInterval?: number // in milliseconds
  enableWebSocket?: boolean
  wsServerUrl?: string // Custom WebSocket server URL
  fallbackToPolling?: boolean // Auto fallback to polling if WebSocket fails
  disableWebSocket?: boolean // Option to completely disable WebSocket and use only polling
}

interface PriceUpdateHookReturn {
  prices: Record<string, PriceData>
  loading: boolean
  error: string | null
  lastUpdate: Date | null
  isConnected: boolean
  reconnect: () => void
  updatePrices: () => Promise<void>
}

/**
 * Custom hook for managing real-time price updates
 * Supports both WebSocket and polling mechanisms
 */
export const usePriceUpdates = ({
  assetIds = [],
  updateInterval = 30000, // 30 seconds default
  enableWebSocket = true,
  wsServerUrl,
  fallbackToPolling = true,
  disableWebSocket = false
}: PriceUpdateHookOptions = {}): PriceUpdateHookReturn => {
  const [prices, setPrices] = useState<Record<string, PriceData>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [wsServerAvailable, setWsServerAvailable] = useState(true)
  
  const wsRef = useRef<WebSocket | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttempts = useRef(0)
  const maxReconnectAttempts = 5
  const isCleaningUpRef = useRef(false)
  const lastRequestRef = useRef<{ assetIds: string[], timestamp: number } | null>(null)
  const requestCacheTimeMs = 5000 // Cache requests for 5 seconds
  const wsConnectionTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const wsConnectionTimeout = 10000 // 10 seconds timeout for WebSocket connection

  // Check if request should be deduplicated
  const shouldSkipRequest = useCallback((currentAssetIds: string[]) => {
    if (!lastRequestRef.current) return false
    
    const now = Date.now()
    const { assetIds: lastAssetIds, timestamp } = lastRequestRef.current
    
    // Skip if same assets requested within cache time
    const isSameAssets = currentAssetIds.length === lastAssetIds.length && 
      currentAssetIds.every(id => lastAssetIds.includes(id))
    const isWithinCacheTime = (now - timestamp) < requestCacheTimeMs
    
    return isSameAssets && isWithinCacheTime
  }, [requestCacheTimeMs])
  
  // Enhanced fetch prices from REST API (without debouncing)
  const fetchPricesInternal = useCallback(async (): Promise<PriceData[]> => {
    // Check for request deduplication
    if (shouldSkipRequest(assetIds)) {
      console.log('Skipping duplicate request for assets:', assetIds)
      return []
    }
    
    try {
      // Update last request cache
      lastRequestRef.current = {
        assetIds: [...assetIds],
        timestamp: Date.now()
      }
      
      const queryParams = assetIds.length > 0 
        ? `?assetIds=${assetIds.join(',')}` 
        : ''
      
      const response = await fetch(`/api/oracle/prices${queryParams}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch prices: ${response.status}`)
      }
      
      const data = await response.json()
      return data.prices || []
    } catch (err) {
      console.error('Error fetching prices:', err)
      throw err
    }
  }, [assetIds, shouldSkipRequest])

  // Enhanced debounced version to prevent rapid successive calls (2 second delay)
  const fetchPrices = useAsyncDebounce(fetchPricesInternal, 2000)

  // Update prices state
  const updatePricesState = useCallback((priceData: PriceData[]) => {
    // Prevent state updates if component is cleaning up
    if (isCleaningUpRef.current) return
    
    const priceMap = priceData.reduce((acc, price) => {
      acc[price.assetId] = price
      return acc
    }, {} as Record<string, PriceData>)
    
    setPrices(prevPrices => ({ ...prevPrices, ...priceMap }))
    setLastUpdate(new Date())
    setError(null)
  }, [])

  // Manual price update function
  const updatePrices = useCallback(async () => {
    try {
      setLoading(true)
      const priceData = await fetchPricesInternal()
      updatePricesState(priceData)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update prices'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [fetchPricesInternal, updatePricesState])

  // Check WebSocket server availability
  const checkWebSocketServer = useCallback(async (url: string): Promise<boolean> => {
    return new Promise((resolve) => {
      try {
        const testWs = new WebSocket(url)
        const timeout = setTimeout(() => {
          if (testWs.readyState === WebSocket.CONNECTING || testWs.readyState === WebSocket.OPEN) {
            testWs.close()
          }
          resolve(false)
        }, 3000) // 3 second timeout for availability check
        
        testWs.onopen = () => {
          clearTimeout(timeout)
          testWs.close()
          resolve(true)
        }
        
        testWs.onerror = () => {
          clearTimeout(timeout)
          resolve(false)
        }
        
        testWs.onclose = () => {
          clearTimeout(timeout)
        }
      } catch {
        resolve(false)
      }
    })
  }, [])

  // Safe WebSocket message sending with connection status check
  const sendWebSocketMessage = useCallback((ws: WebSocket | null, message: any) => {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      console.warn('Cannot send WebSocket message: connection not ready')
      return false
    }
    
    try {
      ws.send(JSON.stringify(message))
      return true
    } catch (err) {
      console.error('Failed to send WebSocket message:', err)
      setError('Communication error with real-time service')
      return false
    }
  }, [])

  // Check if WebSocket is ready for operations
  const isWebSocketReady = useCallback(() => {
    return wsRef.current && 
           wsRef.current.readyState === WebSocket.OPEN && 
           isConnected && 
           wsServerAvailable
  }, [isConnected, wsServerAvailable])

  // Setup polling fallback
  const setupPolling = useCallback(() => {
    // Clear any existing polling interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
    
    // Close WebSocket if still connected
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.close(1000, 'Switching to polling')
    }
    
    console.log('Starting polling mode with interval:', updateInterval + 'ms')
    
    // Initial fetch when switching to polling
    fetchPricesInternal()
      .then(updatePricesState)
      .catch(err => {
        console.error('Initial polling fetch error:', err)
        setError('Unable to load current prices. Please check your internet connection and try again.')
      })

    intervalRef.current = setInterval(async () => {
      // Skip polling if component is cleaning up
      if (isCleaningUpRef.current) return
      
      try {
        const priceData = await fetchPricesInternal()
        updatePricesState(priceData)
        
        // Clear any previous errors if polling succeeds
        setError(prev => {
          if (prev && (prev.includes('Real-time') || prev.includes('Connection') || prev.includes('Unable to'))) {
            return null
          }
          return prev
        })
      } catch (err) {
        console.error('Polling error:', err)
        // Only set error if this is a persistent issue (multiple failures)
        const errorMessage = 'Unable to update prices. Please check your internet connection.'
        setError(prev => prev !== errorMessage ? errorMessage : prev)
      }
    }, updateIntervalRef.current)
  }, [fetchPricesInternal, updatePricesState])

  // WebSocket connection management
  const connectWebSocket = useCallback(async () => {
    if (!enableWebSocketRef.current || !wsServerAvailable) {
      if (fallbackToPollingRef.current) {
        console.log('WebSocket disabled or unavailable, using polling fallback')
        setupPolling()
      }
      return
    }

    try {
      // Close existing connection
      if (wsRef.current) {
        wsRef.current.close()
      }

      // Clear any existing connection timeout
      if (wsConnectionTimeoutRef.current) {
        clearTimeout(wsConnectionTimeoutRef.current)
      }

      const wsUrl = wsServerUrlRef.current || 
        (process.env.NODE_ENV === 'production' 
          ? 'wss://your-domain.com/ws/prices'
          : 'ws://localhost:3001/ws/prices')
      
      // Check server availability first
      const isServerAvailable = await checkWebSocketServer(wsUrl)
      if (!isServerAvailable) {
        console.warn('WebSocket server not available at:', wsUrl)
        setWsServerAvailable(false)
        setError('Real-time updates unavailable - using periodic updates')
        
        if (fallbackToPollingRef.current) {
          setupPolling()
        }
        return
      }
      
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws
      
      // Set connection timeout
      wsConnectionTimeoutRef.current = setTimeout(() => {
        if (ws.readyState === WebSocket.CONNECTING) {
          ws.close()
          setError('WebSocket connection timeout - switching to polling')
          setWsServerAvailable(false)
          
          if (fallbackToPollingRef.current) {
            setupPolling()
          }
        }
      }, wsConnectionTimeout)

      ws.onopen = () => {
        // Prevent operations if component is cleaning up
        if (isCleaningUpRef.current) {
          ws.close()
          return
        }
        
        console.log('WebSocket connected for price updates')
        setIsConnected(true)
        setError(null)
        reconnectAttempts.current = 0
        
        // Clear connection timeout on successful connection
        if (wsConnectionTimeoutRef.current) {
          clearTimeout(wsConnectionTimeoutRef.current)
          wsConnectionTimeoutRef.current = null
        }
        
        // Subscribe to specific assets if provided
        if (assetIds.length > 0) {
          sendWebSocketMessage(ws, {
            type: 'subscribe',
            assetIds: assetIds
          })
        }
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          
          if (data.type === 'price_update' && data.prices) {
            updatePricesState(data.prices)
          } else if (data.type === 'error') {
            setError(data.message || 'WebSocket error')
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err)
        }
      }

      ws.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason)
        setIsConnected(false)
        
        // Attempt to reconnect if not a manual close and not cleaning up
        if (!isCleaningUpRef.current && event.code !== 1000 && reconnectAttempts.current < maxReconnectAttempts && wsServerAvailable) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000)
          reconnectAttempts.current++
          
          console.log(`WebSocket disconnected (code: ${event.code}), attempting to reconnect (${reconnectAttempts.current}/${maxReconnectAttempts})...`)
          
          reconnectTimeoutRef.current = setTimeout(() => {
            if (!isCleaningUpRef.current) {
              connectWebSocket()
            }
          }, delay)
        } else if (!isCleaningUpRef.current && (reconnectAttempts.current >= maxReconnectAttempts || !wsServerAvailable)) {
          // Fallback to polling after max reconnect attempts or server unavailable
          const reason = !wsServerAvailable ? 'server unavailable' : 'max reconnect attempts reached'
          console.log(`WebSocket fallback to polling: ${reason}`)
          setWsServerAvailable(false)
          
          if (!wsServerAvailable) {
            setError('Real-time service is currently unavailable. Using periodic updates to keep prices current.')
          } else {
            setError('Connection could not be restored. Switched to periodic updates to ensure you receive the latest prices.')
          }
          
          if (fallbackToPollingRef.current) {
            setupPolling()
          }
        }
      }

      ws.onerror = (error) => {
        console.error('WebSocket connection error:', error)
        
        // Clear connection timeout
        if (wsConnectionTimeoutRef.current) {
          clearTimeout(wsConnectionTimeoutRef.current)
        }
        
        // Provide user-friendly error messages based on connection state
        if (reconnectAttempts.current === 0) {
          // Initial connection failure
          setWsServerAvailable(false)
          setError('Unable to establish real-time connection. Switching to periodic updates for price data.')
          
          if (fallbackToPollingRef.current) {
            setupPolling()
          }
        } else {
          // Reconnection failure
          setError(`Connection interrupted. Attempting to reconnect... (${reconnectAttempts.current}/${maxReconnectAttempts})`)
        }
      }

    } catch (err) {
      console.error('Failed to create WebSocket connection:', err)
      setError('Failed to establish real-time connection - using periodic updates')
      setWsServerAvailable(false)
      
      if (fallbackToPollingRef.current) {
        setupPolling()
      }
    }
  }, [])

  // Manual reconnect function
  const reconnect = useCallback(() => {
    if (reconnectAttempts.current < maxReconnectAttempts) {
      reconnectAttempts.current++
      console.log(`Reconnecting... attempt ${reconnectAttempts.current}`)
      
      // Enhanced exponential backoff with jitter to prevent thundering herd
      const baseDelay = 1000
      const exponentialDelay = baseDelay * Math.pow(2, reconnectAttempts.current - 1)
      const jitter = Math.random() * 1000 // Add up to 1 second of jitter
      const delay = Math.min(exponentialDelay + jitter, 30000) // Cap at 30 seconds
      
      reconnectTimeoutRef.current = setTimeout(() => {
        connectWebSocket()
      }, delay)
    } else {
      console.log('Max reconnection attempts reached, falling back to polling')
      setError('WebSocket connection failed, using polling mode')
      setupPolling()
    }
  }, [])

  // Store stable references for options
  const enableWebSocketRef = useRef(enableWebSocket)
  const disableWebSocketRef = useRef(disableWebSocket)
  const updateIntervalRef = useRef(updateInterval)
  const fallbackToPollingRef = useRef(fallbackToPolling)
  const wsServerUrlRef = useRef(wsServerUrl)
  
  // Update refs when props change
  useEffect(() => {
    enableWebSocketRef.current = enableWebSocket
    disableWebSocketRef.current = disableWebSocket
    updateIntervalRef.current = updateInterval
    fallbackToPollingRef.current = fallbackToPolling
    wsServerUrlRef.current = wsServerUrl
  }, [enableWebSocket, disableWebSocket, updateInterval, fallbackToPolling, wsServerUrl])

  // Initialize price updates
  useEffect(() => {
    // Initial price fetch
    updatePrices()

    // Check if WebSocket is disabled or should use polling only
    if (disableWebSocketRef.current || !enableWebSocketRef.current) {
      console.log('WebSocket disabled - using polling mode only')
      setWsServerAvailable(false)
      setupPolling()
    } else {
      // Setup WebSocket OR polling, not both
      connectWebSocket()
    }

    return () => {
      console.log('Cleaning up usePriceUpdates hook')
      
      // Set cleanup flag to prevent new operations
      isCleaningUpRef.current = true
      
      // Cleanup WebSocket gracefully
      if (wsRef.current) {
        wsRef.current.onopen = null
        wsRef.current.onmessage = null
        wsRef.current.onclose = null
        wsRef.current.onerror = null
        wsRef.current.close(1000, 'Component unmounting')
        wsRef.current = null
      }
      
      // Cleanup polling interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      
      // Cleanup reconnect timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
        reconnectTimeoutRef.current = null
      }
      
      // Cleanup connection timeout
      if (wsConnectionTimeoutRef.current) {
        clearTimeout(wsConnectionTimeoutRef.current)
        wsConnectionTimeoutRef.current = null
      }
      
      // Cancel any pending debounced calls
      // Note: fetchPrices from useAsyncDebounce doesn't have cancel method
      // The cleanup is handled by the timeout clearing in useAsyncDebounce
      
      // Reset state
      setIsConnected(false)
      reconnectAttempts.current = 0
      lastRequestRef.current = null
    }
  }, []) // Empty dependency array - only run once on mount

  // Update WebSocket subscription when assetIds change
  useEffect(() => {
    if (disableWebSocketRef.current || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN || assetIds.length === 0) return

    try {
      wsRef.current.send(JSON.stringify({
        type: 'subscribe',
        assetIds: assetIds
      }))
    } catch (error) {
      console.error('Failed to send WebSocket subscription:', error)
    }
  }, [assetIds])

  return {
    prices,
    loading,
    error,
    lastUpdate,
    isConnected,
    reconnect,
    updatePrices
  }
}

// Helper hook for single asset price updates
export const useAssetPrice = (assetId: string) => {
  const { prices, loading, error, lastUpdate, updatePrices } = usePriceUpdates({
    assetIds: [assetId]
  })

  return {
    price: prices[assetId] || null,
    loading,
    error,
    lastUpdate,
    updatePrice: updatePrices
  }
}

// Helper hook for portfolio price updates
export const usePortfolioPrices = (assetIds: string[]) => {
  return usePriceUpdates({
    assetIds,
    updateInterval: 60000, // Reduced frequency to prevent spam
    enableWebSocket: true // Prefer WebSocket for real-time updates
  })
}