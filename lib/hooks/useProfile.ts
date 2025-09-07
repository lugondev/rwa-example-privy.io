/**
 * React hooks for user profile management
 */

import { profileApi } from '@/lib/api/profile'
import { usePrivy } from '@privy-io/react-auth'
import { useCallback, useEffect, useState } from 'react'
import { useUserSync } from '@/hooks/useUserSync'

export interface UserProfile {
  id: string
  firstName?: string
  lastName?: string
  email?: string
  dateOfBirth?: string
  phoneNumber?: string
  profileImage?: string
  investorType?: 'retail' | 'accredited' | 'institutional'
  riskTolerance?: 'low' | 'medium' | 'high'
  address?: string
  city?: string
  country?: string
  postalCode?: string
  preferences?: {
    emailNotifications: boolean
    pushNotifications: boolean
    smsNotifications: boolean
    marketingEmails: boolean
    tradeNotifications: boolean
    kycUpdates: boolean
    vaultRewards: boolean
    systemAlerts: boolean
    priceAlerts: boolean
    profileVisibility: 'public' | 'private' | 'friends'
    showPortfolio: boolean
    showTradingHistory: boolean
    twoFactorEnabled: boolean
    sessionTimeout: number
    theme: 'light' | 'dark' | 'system'
    language: string
    currency: string
    timezone: string
  }
  createdAt: string
  updatedAt: string
}

export interface UseProfileReturn {
  profile: UserProfile | null
  loading: boolean
  error: string | null
  createProfile: (data: Partial<UserProfile>) => Promise<boolean>
  updateProfile: (data: Partial<UserProfile>) => Promise<boolean>
  deleteAccount: () => Promise<boolean>
  refreshProfile: () => Promise<void>
  isSyncing: boolean
  isSynced: boolean
}

/**
 * Hook for managing user profile data
 */
export function useProfile(): UseProfileReturn {
  const { user, authenticated } = usePrivy()
  const { isSyncing, isSynced, syncError, syncUser } = useUserSync()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Fetch user profile from API
   */
  const fetchProfile = useCallback(async () => {
    if (!user?.id) {
      setProfile(null)
      setLoading(false)
      return
    }

    // Wait for sync to complete if it's in progress
    if (isSyncing) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      console.log('useProfile - Fetching profile for user:', user.id)
      const response = await fetch(`/api/profile/${user.id}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          console.log('useProfile - Profile not found for user:', user.id)
          console.log('useProfile - Triggering user sync to create user record')
          // Trigger user sync to create user record
          await syncUser()
          setProfile(null)
        } else {
          throw new Error(`Failed to fetch profile: ${response.status}`)
        }
      } else {
        const data = await response.json()
        console.log('useProfile - Profile fetched successfully:', data)
        setProfile(data)
      }
    } catch (err) {
      console.error('useProfile - Error fetching profile:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch profile')
    } finally {
      setLoading(false)
    }
  }, [user?.id, isSyncing, syncUser])

  /**
   * Create user profile
   */
  const createProfile = useCallback(async (data: Partial<UserProfile>): Promise<boolean> => {
    if (!authenticated || !user?.id) {
      setError('User not authenticated')
      return false
    }

    setLoading(true)
    setError(null)

    try {
      const response = await profileApi.createProfile(user.id, data)

      if (response.error) {
        setError(response.error)
        return false
      }

      if (response.data) {
        setProfile(response.data)
      }
      return true
    } catch (err) {
      setError('Failed to create profile')
      return false
    } finally {
      setLoading(false)
    }
  }, [authenticated, user?.id])

  /**
   * Update user profile
   */
  const updateProfile = useCallback(async (data: Partial<UserProfile>): Promise<boolean> => {
    if (!authenticated || !user?.id) {
      setError('User not authenticated')
      return false
    }

    setLoading(true)
    setError(null)

    try {
      const response = await profileApi.updateProfile(user.id, data)

      if (response.error) {
        setError(response.error)
        return false
      }

      // Update local state with new data
      if (response.data) {
        setProfile(prev => prev ? { ...prev, ...response.data } : response.data || null)
      }
      return true
    } catch (err) {
      setError('Failed to update profile')
      return false
    } finally {
      setLoading(false)
    }
  }, [authenticated, user?.id])

  /**
   * Delete user account
   */
  const deleteAccount = useCallback(async (): Promise<boolean> => {
    if (!authenticated || !user?.id) {
      setError('User not authenticated')
      return false
    }

    setLoading(true)
    setError(null)

    try {
      const response = await profileApi.deleteAccount(user.id)

      if (response.error) {
        setError(response.error)
        return false
      }

      setProfile(null)
      return true
    } catch (err) {
      setError('Failed to delete account')
      return false
    } finally {
      setLoading(false)
    }
  }, [authenticated, user?.id])

  /**
   * Refresh profile data
   */
  const refreshProfile = useCallback(async () => {
    await fetchProfile()
  }, [fetchProfile])

  // Fetch profile when user changes or when sync completes
  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  // Retry fetching profile when sync completes successfully
  useEffect(() => {
    if (isSynced && !isSyncing && user?.id) {
      console.log('useProfile - Sync completed, retrying profile fetch')
      fetchProfile()
    }
  }, [isSynced, isSyncing, user?.id, fetchProfile])

  return {
    profile,
    loading: loading || isSyncing,
    error: error || syncError,
    createProfile,
    updateProfile,
    deleteAccount,
    refreshProfile,
    isSyncing,
    isSynced
  }
}

/**
 * Hook for managing profile preferences
 */
export function useProfilePreferences() {
  const { profile, updateProfile, loading, error } = useProfile()

  const updatePreferences = useCallback(async (preferences: Partial<NonNullable<UserProfile['preferences']>>) => {
    if (!profile) return false

    const defaultPreferences = {
      // Notification preferences
      emailNotifications: true,
      pushNotifications: true,
      smsNotifications: false,
      marketingEmails: false,
      tradeNotifications: true,
      kycUpdates: true,
      vaultRewards: true,
      systemAlerts: true,
      priceAlerts: false,
      // Privacy settings
      profileVisibility: 'private' as const,
      showPortfolio: false,
      showTradingHistory: false,
      // Security settings
      twoFactorEnabled: false,
      sessionTimeout: 60,
      // Display preferences
      language: 'en',
      timezone: 'UTC',
      currency: 'USD',
      theme: 'dark' as const
    }

    const updatedPreferences = {
      ...defaultPreferences,
      ...profile.preferences,
      ...preferences
    }

    return await updateProfile({ preferences: updatedPreferences })
  }, [profile, updateProfile])



  return {
    preferences: profile?.preferences,
    loading,
    error,
    updatePreferences
  }
}