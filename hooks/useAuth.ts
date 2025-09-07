'use client'

import { usePrivy, useWallets } from '@privy-io/react-auth'
import { useEffect, useState, useCallback } from 'react'
import { User, KYCStatus, KYCLevel, UserType, ComplianceTier, AMLStatus } from '@/types'
import { profileApi } from '@/lib/utils/api'
import { toast } from 'sonner'

export function useAuth() {
  const [mounted, setMounted] = useState(false)
  const [userData, setUserData] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [kycLoading, setKycLoading] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])

  // Always call hooks to maintain consistent order
  let privyData
  let walletsData
  
  try {
    privyData = usePrivy()
    walletsData = useWallets()
  } catch (error) {
    // Fallback when hooks are called outside provider
    privyData = {
      user: null,
      authenticated: false,
      login: () => Promise.resolve(),
      logout: () => Promise.resolve(),
      linkEmail: () => Promise.resolve(),
      linkWallet: () => Promise.resolve(),
      unlinkEmail: () => Promise.resolve(),
      unlinkWallet: () => Promise.resolve()
    }
    walletsData = { wallets: [] }
  }

  // Only use data when mounted to prevent hydration issues
  const user = mounted ? privyData.user : null
  const authenticated = mounted ? privyData.authenticated : false
  const login = privyData.login
  const logout = privyData.logout
  const linkEmail = privyData.linkEmail
  const linkWallet = privyData.linkWallet
  const unlinkEmail = privyData.unlinkEmail
  const unlinkWallet = privyData.unlinkWallet
  const wallets = mounted ? walletsData.wallets : []

  // Sync user data
  useEffect(() => {
    if (authenticated && user) {
      syncUserData()
    } else {
      setUserData(null)
      setLoading(false)
    }
  }, [authenticated, user])

  const syncUserData = async () => {
    if (!user) return

    try {
      setLoading(true)
      
      // Try to get user profile from API first
      try {
        const profile = await profileApi.getProfile(user.id)
        if (profile.data) {
          setUserData(profile.data)
          setLoading(false)
          return
        }
      } catch (apiError) {
        console.log('Profile not found in API, checking localStorage')
      }
      
      // Check if user exists in local storage (fallback)
      const localUser = localStorage.getItem(`user_${user.id}`)
      if (localUser) {
        const userData = JSON.parse(localUser)
        setUserData(userData)
        
        // Try to sync with API in background
        try {
          await profileApi.createProfile({
            first_name: userData.profile?.first_name || '',
            last_name: userData.profile?.last_name || '',
            country: userData.profile?.country || '',
            investment_experience: userData.profile?.investment_experience || 'beginner',
            accredited_investor: userData.profile?.accredited_investor || false,
            politically_exposed_person: userData.profile?.politically_exposed_person || false
          })
        } catch (syncError) {
          console.log('Could not sync to API:', syncError)
        }
        
        setLoading(false)
        return
      }

      // Create new user with enhanced KYC/AML structure
      const newUser: User = {
        id: user.id,
        email: user.email?.address,
        wallet_address: user.wallet?.address,
        kyc_status: 'pending',
        kyc_level: 'basic',
        aml_status: 'clear',
        user_type: 'individual',
        compliance_tier: 'tier_1',
        risk_score: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        profile: {
          first_name: '',
          last_name: '',
          country: '',
          investment_experience: 'beginner',
          accredited_investor: false,
          politically_exposed_person: false,
        },
        verification_documents: [],
      }

      // Store in localStorage for demo
      localStorage.setItem(`user_${user.id}`, JSON.stringify(newUser))
      setUserData(newUser)
      
      // Try to create profile in API
      try {
        await profileApi.createProfile({
          first_name: '',
          last_name: '',
          country: '',
          investment_experience: 'beginner',
          accredited_investor: false,
          politically_exposed_person: false
        })
      } catch (createError) {
        console.log('Could not create profile in API:', createError)
      }
      
    } catch (error) {
      console.error('Error syncing user:', error)
      toast.error('Failed to sync user data')
    } finally {
      setLoading(false)
    }
  }

  // Enhanced KYC functions
  const updateKYCStatus = useCallback(async (status: KYCStatus) => {
    if (!userData) return

    setKycLoading(true)
    try {
      const updatedUser = {
        ...userData,
        kyc_status: status,
        updated_at: new Date().toISOString(),
      }
      
      localStorage.setItem(`user_${userData.id}`, JSON.stringify(updatedUser))
      setUserData(updatedUser)
    } catch (error) {
      console.error('Error updating KYC status:', error)
    } finally {
      setKycLoading(false)
    }
  }, [userData])

  const updateKYCLevel = useCallback(async (level: KYCLevel) => {
    if (!userData) return

    setKycLoading(true)
    try {
      const updatedUser = {
        ...userData,
        kyc_level: level,
        updated_at: new Date().toISOString(),
      }
      
      localStorage.setItem(`user_${userData.id}`, JSON.stringify(updatedUser))
      setUserData(updatedUser)
    } catch (error) {
      console.error('Error updating KYC level:', error)
    } finally {
      setKycLoading(false)
    }
  }, [userData])

  const updateUserType = useCallback(async (userType: UserType) => {
    if (!userData) return

    setKycLoading(true)
    try {
      const updatedUser = {
        ...userData,
        user_type: userType,
        compliance_tier: userType === 'institutional' ? 'tier_3' as ComplianceTier : 'tier_1' as ComplianceTier,
        updated_at: new Date().toISOString(),
      }
      
      localStorage.setItem(`user_${userData.id}`, JSON.stringify(updatedUser))
      setUserData(updatedUser)
    } catch (error) {
      console.error('Error updating user type:', error)
    } finally {
      setKycLoading(false)
    }
  }, [userData])

  const updateProfile = useCallback(async (profileData: Partial<User['profile']>) => {
    if (!userData) return

    try {
      // Update via API first
      try {
        await profileApi.updateProfile(userData.id, profileData)
        // Refresh user data from API
        const updatedProfile = await profileApi.getProfile(userData.id)
        if (updatedProfile.data) {
          setUserData(updatedProfile.data)
          localStorage.setItem(`user_${userData.id}`, JSON.stringify(updatedProfile.data))
          toast.success('Profile updated successfully')
          return
        }
      } catch (apiError) {
        console.log('API update failed, updating localStorage only:', apiError)
      }
      
      // Fallback to localStorage update
      const updatedUser = {
        ...userData,
        profile: {
          ...userData.profile,
          ...profileData,
        },
        updated_at: new Date().toISOString(),
      }
      
      localStorage.setItem(`user_${userData.id}`, JSON.stringify(updatedUser))
      setUserData(updatedUser)
      toast.success('Profile updated locally')
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Failed to update profile')
    }
  }, [userData])

  const updateAMLStatus = useCallback(async (status: AMLStatus) => {
    if (!userData) return

    try {
      const updatedUser = {
        ...userData,
        aml_status: status,
        last_compliance_check: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      
      localStorage.setItem(`user_${userData.id}`, JSON.stringify(updatedUser))
      setUserData(updatedUser)
    } catch (error) {
      console.error('Error updating AML status:', error)
    }
  }, [userData])

  // Check if user can access certain features based on compliance
  const canAccessFeature = useCallback((feature: string) => {
    if (!userData) return false

    switch (feature) {
      case 'basic_trading':
        return userData.kyc_status === 'verified' && userData.kyc_level !== 'basic'
      case 'institutional_trading':
        return userData.kyc_status === 'verified' && userData.user_type === 'institutional'
      case 'vault_management':
        return userData.kyc_status === 'verified' && userData.compliance_tier !== 'tier_1'
      case 'oracle_services':
        return userData.kyc_status === 'verified' && userData.user_type === 'oracle_provider'
      default:
        return userData.kyc_status === 'verified'
    }
  }, [userData])

  // Get compliance status summary
  const getComplianceStatus = useCallback(() => {
    if (!userData) return { status: 'incomplete', message: 'Please complete authentication' }

    if (userData.kyc_status === 'pending') {
      return { status: 'pending', message: 'KYC verification in progress' }
    }

    if (userData.kyc_status === 'rejected') {
      return { status: 'rejected', message: 'KYC verification failed' }
    }

    if (userData.aml_status === 'flagged' || userData.aml_status === 'blocked') {
      return { status: 'blocked', message: 'Account flagged for compliance review' }
    }

    if (userData.kyc_status === 'verified' && userData.aml_status === 'clear') {
      return { status: 'verified', message: 'Fully verified and compliant' }
    }

    return { status: 'incomplete', message: 'Additional verification required' }
  }, [userData])

  return {
    user: userData,
    privyUser: user,
    authenticated,
    loading,
    kycLoading,
    wallets,
    login,
    logout,
    linkEmail,
    linkWallet,
    unlinkEmail,
    unlinkWallet,
    syncUser: syncUserData,
    // Enhanced KYC/AML functions
    updateKYCStatus,
    updateKYCLevel,
    updateUserType,
    updateProfile,
    updateAMLStatus,
    canAccessFeature,
    getComplianceStatus,
  }
}