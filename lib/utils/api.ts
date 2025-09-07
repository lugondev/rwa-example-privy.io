/**
 * API Client Utilities
 * Centralized API calling functions for frontend components
 */

// Base API configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || ''

// API response types
export interface ApiResponse<T = any> {
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    total: number
    unread?: number
    limit: number
    offset: number
    hasMore: boolean
  }
}

// User Profile API
export const profileApi = {
  /**
   * Get user profile
   */
  async getProfile(userId: string): Promise<ApiResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/profile/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (!response.ok) {
        return { error: data.error || 'Failed to fetch profile' }
      }

      return { data }
    } catch (error) {
      console.error('Error fetching profile:', error)
      return { error: 'Network error occurred' }
    }
  },

  /**
   * Create user profile
   */
  async createProfile(profileData: any): Promise<ApiResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(profileData)
      })

      const data = await response.json()

      if (!response.ok) {
        return { error: data.error || 'Failed to create profile' }
      }

      return { data, message: data.message }
    } catch (error) {
      console.error('Error creating profile:', error)
      return { error: 'Network error occurred' }
    }
  },

  /**
   * Update user profile
   */
  async updateProfile(userId: string, profileData: any): Promise<ApiResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/profile/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(profileData)
      })

      const data = await response.json()

      if (!response.ok) {
        return { error: data.error || 'Failed to update profile' }
      }

      return { data, message: data.message }
    } catch (error) {
      console.error('Error updating profile:', error)
      return { error: 'Network error occurred' }
    }
  },

  /**
   * Delete user account
   */
  async deleteAccount(userId: string): Promise<ApiResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/profile/${userId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (!response.ok) {
        return { error: data.error || 'Failed to delete account' }
      }

      return { message: data.message }
    } catch (error) {
      console.error('Error deleting account:', error)
      return { error: 'Network error occurred' }
    }
  }
}

// KYC API
export const kycApi = {
  /**
   * Submit KYC application
   */
  async submitKyc(kycData: any): Promise<ApiResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/kyc`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(kycData)
      })

      const data = await response.json()

      if (!response.ok) {
        return { error: data.error || 'Failed to submit KYC' }
      }

      return { data, message: data.message }
    } catch (error) {
      console.error('Error submitting KYC:', error)
      return { error: 'Network error occurred' }
    }
  },

  /**
   * Get KYC submissions for user
   */
  async getKycSubmissions(userId: string): Promise<ApiResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/kyc?userId=${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (!response.ok) {
        return { error: data.error || 'Failed to fetch KYC submissions' }
      }

      return { data }
    } catch (error) {
      console.error('Error fetching KYC submissions:', error)
      return { error: 'Network error occurred' }
    }
  },

  /**
   * Upload KYC document
   */
  async uploadDocument(documentData: any): Promise<ApiResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/kyc/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(documentData)
      })

      const data = await response.json()

      if (!response.ok) {
        return { error: data.error || 'Failed to upload document' }
      }

      return { data, message: data.message }
    } catch (error) {
      console.error('Error uploading document:', error)
      return { error: 'Network error occurred' }
    }
  },

  /**
   * Get documents for KYC submission
   */
  async getDocuments(submissionId: string): Promise<ApiResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/kyc/upload?submissionId=${submissionId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (!response.ok) {
        return { error: data.error || 'Failed to fetch documents' }
      }

      return { data }
    } catch (error) {
      console.error('Error fetching documents:', error)
      return { error: 'Network error occurred' }
    }
  },

  /**
   * Delete KYC document
   */
  async deleteDocument(documentId: string): Promise<ApiResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/kyc/upload?documentId=${documentId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (!response.ok) {
        return { error: data.error || 'Failed to delete document' }
      }

      return { message: data.message }
    } catch (error) {
      console.error('Error deleting document:', error)
      return { error: 'Network error occurred' }
    }
  }
}

// Notifications API
export const notificationsApi = {
  /**
   * Get notifications for user
   */
  async getNotifications(
    userId: string,
    options: {
      limit?: number
      offset?: number
      unreadOnly?: boolean
    } = {}
  ): Promise<ApiResponse<PaginatedResponse<any>>> {
    try {
      const { limit = 20, offset = 0, unreadOnly = false } = options
      const params = new URLSearchParams({
        userId,
        limit: limit.toString(),
        offset: offset.toString(),
        unreadOnly: unreadOnly.toString()
      })

      const response = await fetch(`${API_BASE_URL}/api/notifications?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (!response.ok) {
        return { error: data.error || 'Failed to fetch notifications' }
      }

      return { data }
    } catch (error) {
      console.error('Error fetching notifications:', error)
      return { error: 'Network error occurred' }
    }
  },

  /**
   * Mark notifications as read
   */
  async markAsRead(notificationIds: string[]): Promise<ApiResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/notifications`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ notificationIds })
      })

      const data = await response.json()

      if (!response.ok) {
        return { error: data.error || 'Failed to mark notifications as read' }
      }

      return { message: data.message }
    } catch (error) {
      console.error('Error marking notifications as read:', error)
      return { error: 'Network error occurred' }
    }
  },

  /**
   * Delete notifications
   */
  async deleteNotifications(userId: string, notificationIds: string[]): Promise<ApiResponse> {
    try {
      const params = new URLSearchParams({
        userId,
        notificationIds: notificationIds.join(',')
      })

      const response = await fetch(`${API_BASE_URL}/api/notifications?${params}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (!response.ok) {
        return { error: data.error || 'Failed to delete notifications' }
      }

      return { message: data.message }
    } catch (error) {
      console.error('Error deleting notifications:', error)
      return { error: 'Network error occurred' }
    }
  },

  /**
   * Create notification (admin only)
   */
  async createNotification(notificationData: any): Promise<ApiResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/notifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(notificationData)
      })

      const data = await response.json()

      if (!response.ok) {
        return { error: data.error || 'Failed to create notification' }
      }

      return { data, message: data.message }
    } catch (error) {
      console.error('Error creating notification:', error)
      return { error: 'Network error occurred' }
    }
  }
}

// Generic API helper
export async function apiCall<T = any>(
  url: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    })

    const data = await response.json()

    if (!response.ok) {
      return { error: data.error || 'API request failed' }
    }

    return { data }
  } catch (error) {
    console.error('API call error:', error)
    return { error: 'Network error occurred' }
  }
}