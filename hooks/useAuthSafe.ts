'use client'

import { useEffect, useState, useCallback } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { User, KYCStatus, KYCLevel, UserType } from '@/types'
import { profileApi } from '@/lib/utils/api'
import { toast } from 'sonner'

/**
 * Safe auth hook that doesn't depend on Privy hooks
 * Used for components that need auth state but might render before Privy is ready
 */
export function useAuthSafe() {
  const [mounted, setMounted] = useState(false)
  const [userData, setUserData] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [kycLoading, setKycLoading] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])

  // Use actual Privy auth state
  const { 
    user: privyUser, 
    authenticated, 
    login, 
    logout, 
    linkEmail, 
    linkWallet, 
    unlinkEmail, 
    unlinkWallet,
    ready
  } = usePrivy()
  
  // Use Privy user as the main user reference
  const user = privyUser
  const wallets = privyUser?.linkedAccounts?.filter(account => account.type === 'wallet') || []

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
        setLoading(false)
        return
      }

      // Create new user
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

      localStorage.setItem(`user_${user.id}`, JSON.stringify(newUser))
      setUserData(newUser)
      
    } catch (error) {
      console.error('Error syncing user:', error)
      toast.error('Failed to sync user data')
    } finally {
      setLoading(false)
    }
  }

  // KYC functions
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

  // Wrapper function for syncUserData to maintain compatibility
  const syncUser = async () => {
    try {
      await syncUserData();
    } catch (error) {
      console.error('Error syncing user:', error);
      throw error;
    }
  };

  // Function to get compliance status based on user KYC
  const getComplianceStatus = () => {
    if (!userData) return 'not_authenticated';
    
    const kycStatus = userData.kyc_status || 'pending';
    const kycLevel = userData.kyc_level || 'basic';
    
    if (kycStatus === 'approved' && kycLevel === 'enhanced') {
      return 'compliant';
    } else if (kycStatus === 'approved' && kycLevel === 'standard') {
      return 'partial_compliant';
    } else if (kycStatus === 'pending') {
      return 'pending';
    } else {
      return 'non_compliant';
    }
  };

  return {
    // Auth state
    user,
    authenticated,
    loading,
    userData,
    wallets,
    
    // Auth actions
    login,
    logout,
    linkEmail,
    linkWallet,
    unlinkEmail,
    unlinkWallet,
    
    // KYC actions
    updateKYCStatus,
    updateKYCLevel,
    updateUserType,
    kycLoading,
    
    // Utils
    mounted,
    syncUserData,
    syncUser,
    getComplianceStatus
  }
}