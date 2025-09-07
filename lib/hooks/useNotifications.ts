/**
 * React hooks for notifications management
 */

import { notificationsApi, PaginatedResponse } from '@/lib/utils/api'
import { usePrivy } from '@privy-io/react-auth'
import { useCallback, useEffect, useState } from 'react'

export interface Notification {
  id: string
  userId: string
  type: 'info' | 'success' | 'warning' | 'error' | 'kyc' | 'trade' | 'system'
  title: string
  message: string
  isRead: boolean
  metadata?: Record<string, any>
  createdAt: string
  readAt?: string
}

export interface UseNotificationsReturn {
  notifications: Notification[]
  unreadCount: number
  loading: boolean
  error: string | null
  hasMore: boolean
  markAsRead: (notificationIds: string[]) => Promise<boolean>
  markAllAsRead: () => Promise<boolean>
  deleteNotifications: (notificationIds: string[]) => Promise<boolean>
  loadMore: () => Promise<void>
  refresh: () => Promise<void>
}

/**
 * Hook for managing user notifications
 */
export function useNotifications(options: {
  limit?: number
  unreadOnly?: boolean
  autoRefresh?: boolean
  refreshInterval?: number
} = {}): UseNotificationsReturn {
  const { user, authenticated } = usePrivy()
  const {
    limit = 20,
    unreadOnly = false,
    autoRefresh = false,
    refreshInterval = 30000 // 30 seconds
  } = options

  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [offset, setOffset] = useState(0)

  /**
   * Fetch notifications from API
   */
  const fetchNotifications = useCallback(async (
    reset: boolean = false,
    currentOffset: number = 0
  ) => {
    if (!authenticated || !user?.id) {
      setNotifications([])
      setUnreadCount(0)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await notificationsApi.getNotifications(user.id, {
        limit,
        offset: currentOffset,
        unreadOnly
      })

      if (response.error) {
        setError(response.error)
        if (reset) {
          setNotifications([])
          setUnreadCount(0)
        }
      } else {
        const data = response.data as PaginatedResponse<Notification>

        if (reset) {
          setNotifications(data.data)
        } else {
          setNotifications(prev => [...prev, ...data.data])
        }

        setUnreadCount(data.pagination.unread || 0)
        setHasMore(data.pagination.hasMore)
        setOffset(currentOffset + data.data.length)
      }
    } catch (err) {
      setError('Failed to fetch notifications')
      if (reset) {
        setNotifications([])
        setUnreadCount(0)
      }
    } finally {
      setLoading(false)
    }
  }, [authenticated, user?.id, limit, unreadOnly])

  /**
   * Mark notifications as read
   */
  const markAsRead = useCallback(async (notificationIds: string[]): Promise<boolean> => {
    if (!authenticated || !user?.id || notificationIds.length === 0) {
      setError('Invalid request')
      return false
    }

    try {
      const response = await notificationsApi.markAsRead(notificationIds)

      if (response.error) {
        setError(response.error)
        return false
      }

      // Update local state
      setNotifications(prev =>
        prev.map(notification =>
          notificationIds.includes(notification.id)
            ? { ...notification, isRead: true, readAt: new Date().toISOString() }
            : notification
        )
      )

      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - notificationIds.length))

      return true
    } catch (err) {
      setError('Failed to mark notifications as read')
      return false
    }
  }, [authenticated, user?.id])

  /**
   * Mark all notifications as read
   */
  const markAllAsRead = useCallback(async (): Promise<boolean> => {
    const unreadNotifications = notifications.filter(n => !n.isRead)
    if (unreadNotifications.length === 0) return true

    return await markAsRead(unreadNotifications.map(n => n.id))
  }, [notifications, markAsRead])

  /**
   * Delete notifications
   */
  const deleteNotifications = useCallback(async (notificationIds: string[]): Promise<boolean> => {
    if (!authenticated || !user?.id || notificationIds.length === 0) {
      setError('Invalid request')
      return false
    }

    try {
      const response = await notificationsApi.deleteNotifications(user.id, notificationIds)

      if (response.error) {
        setError(response.error)
        return false
      }

      // Update local state
      setNotifications(prev =>
        prev.filter(notification => !notificationIds.includes(notification.id))
      )

      // Update unread count
      const deletedUnreadCount = notifications.filter(
        n => notificationIds.includes(n.id) && !n.isRead
      ).length
      setUnreadCount(prev => Math.max(0, prev - deletedUnreadCount))

      return true
    } catch (err) {
      setError('Failed to delete notifications')
      return false
    }
  }, [authenticated, user?.id, notifications])

  /**
   * Load more notifications
   */
  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return
    await fetchNotifications(false, offset)
  }, [hasMore, loading, offset, fetchNotifications])

  /**
   * Refresh notifications
   */
  const refresh = useCallback(async () => {
    setOffset(0)
    await fetchNotifications(true, 0)
  }, [fetchNotifications])

  // Initial fetch
  useEffect(() => {
    refresh()
  }, [refresh])

  // Auto refresh
  useEffect(() => {
    if (!autoRefresh || !authenticated) return

    const interval = setInterval(() => {
      refresh()
    }, refreshInterval)

    return () => clearInterval(interval)
  }, [autoRefresh, authenticated, refreshInterval, refresh])

  return {
    notifications,
    unreadCount,
    loading,
    error,
    hasMore,
    markAsRead,
    markAllAsRead,
    deleteNotifications,
    loadMore,
    refresh
  }
}

/**
 * Hook for managing notification preferences
 */
export function useNotificationPreferences() {
  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    marketingEmails: false,
    tradeNotifications: true,
    kycUpdates: true,
    vaultRewards: true,
    systemAlerts: true,
    priceAlerts: false
  })

  const [loading, setLoading] = useState(false)

  const updatePreferences = useCallback(async (newPreferences: Partial<typeof preferences>) => {
    setLoading(true)
    try {
      // This would typically call an API to update preferences
      setPreferences(prev => ({ ...prev, ...newPreferences }))
      return true
    } catch (error) {
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    preferences,
    loading,
    updatePreferences
  }
}

/**
 * Hook for real-time notifications (WebSocket or SSE)
 */
export function useRealtimeNotifications() {
  const { user, authenticated } = usePrivy()
  const [isConnected, setIsConnected] = useState(false)
  const [newNotification, setNewNotification] = useState<Notification | null>(null)

  useEffect(() => {
    if (!authenticated || !user?.id) {
      setIsConnected(false)
      return
    }

    // This would typically establish a WebSocket connection
    // For now, we'll simulate it
    setIsConnected(true)

    // Cleanup function
    return () => {
      setIsConnected(false)
    }
  }, [authenticated, user?.id])

  const clearNewNotification = useCallback(() => {
    setNewNotification(null)
  }, [])

  return {
    isConnected,
    newNotification,
    clearNewNotification
  }
}

/**
 * Hook for notification toast management
 */
export function useNotificationToast() {
  const [toasts, setToasts] = useState<Array<{
    id: string
    notification: Notification
    timestamp: number
  }>>([])

  const showToast = useCallback((notification: Notification) => {
    const toast = {
      id: `${notification.id}-${Date.now()}`,
      notification,
      timestamp: Date.now()
    }

    setToasts(prev => [...prev, toast])

    // Auto remove after 5 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== toast.id))
    }, 5000)
  }, [])

  const removeToast = useCallback((toastId: string) => {
    setToasts(prev => prev.filter(t => t.id !== toastId))
  }, [])

  const clearAllToasts = useCallback(() => {
    setToasts([])
  }, [])

  return {
    toasts,
    showToast,
    removeToast,
    clearAllToasts
  }
}