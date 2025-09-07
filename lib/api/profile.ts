import { UserProfile } from '@/lib/hooks/useProfile'

export interface ApiResponse<T> {
  data?: T
  error?: string
  success: boolean
}

/**
 * Profile API service for managing user profiles
 */
export const profileApi = {
  /**
   * Create a new user profile
   */
  async createProfile(userId: string, data: Partial<UserProfile>): Promise<ApiResponse<UserProfile>> {
    try {
      const response = await fetch(`/api/profile/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        return {
          success: false,
          error: result.error || 'Failed to create profile'
        }
      }

      return {
        success: true,
        data: result.data
      }
    } catch (error) {
      return {
        success: false,
        error: 'Network error occurred'
      }
    }
  },

  /**
   * Get user profile by ID
   */
  async getProfile(userId: string): Promise<ApiResponse<UserProfile>> {
    try {
      const response = await fetch(`/api/profile/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const result = await response.json()

      if (!response.ok) {
        return {
          success: false,
          error: result.error || 'Failed to fetch profile'
        }
      }

      return {
        success: true,
        data: result.data
      }
    } catch (error) {
      return {
        success: false,
        error: 'Network error occurred'
      }
    }
  },

  /**
   * Update user profile
   */
  async updateProfile(userId: string, data: Partial<UserProfile>): Promise<ApiResponse<UserProfile>> {
    try {
      const response = await fetch(`/api/profile/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        return {
          success: false,
          error: result.error || 'Failed to update profile'
        }
      }

      return {
        success: true,
        data: result.data
      }
    } catch (error) {
      return {
        success: false,
        error: 'Network error occurred'
      }
    }
  },

  /**
   * Delete user account
   */
  async deleteAccount(userId: string): Promise<ApiResponse<void>> {
    try {
      const response = await fetch(`/api/profile/${userId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const result = await response.json()

      if (!response.ok) {
        return {
          success: false,
          error: result.error || 'Failed to delete account'
        }
      }

      return {
        success: true
      }
    } catch (error) {
      return {
        success: false,
        error: 'Network error occurred'
      }
    }
  }
}