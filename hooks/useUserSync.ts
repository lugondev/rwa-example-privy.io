import { useEffect, useState } from 'react'
import { usePrivy } from '@privy-io/react-auth'

interface SyncUserResponse {
  success: boolean
  user?: any
  message?: string
  error?: string
}

/**
 * Hook to automatically sync user with database when authenticated with Privy
 */
export function useUserSync() {
  const { user, authenticated } = usePrivy()
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncError, setSyncError] = useState<string | null>(null)
  const [isSynced, setIsSynced] = useState(false)

  useEffect(() => {
    async function syncUser() {
      if (!authenticated || !user?.id || isSynced) {
        return
      }

      console.log('useUserSync - Starting user sync for:', user.id)
      setIsSyncing(true)
      setSyncError(null)

      try {
        // First check if user exists
        const checkResponse = await fetch(`/api/user-sync?userId=${user.id}`)
        const checkResult: SyncUserResponse = await checkResponse.json()

        console.log('useUserSync - Check user result:', checkResult)

        if (checkResult.exists) {
          console.log('useUserSync - User already exists in database')
          setIsSynced(true)
          return
        }

        // User doesn't exist, create it
        console.log('useUserSync - Creating user in database')
        const response = await fetch('/api/user-sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: user.id,
            email: user.email?.address || undefined,
            walletAddress: user.wallet?.address || undefined,
          }),
        })

        const syncResult: SyncUserResponse = await syncResponse.json()
        console.log('useUserSync - Sync result:', syncResult)

        if (syncResult.success) {
          console.log('useUserSync - User synced successfully')
          setIsSynced(true)
        } else {
          console.error('useUserSync - Sync failed:', syncResult.error)
          setSyncError(syncResult.error || 'Failed to sync user')
        }
      } catch (error) {
        console.error('useUserSync - Error during sync:', error)
        setSyncError(error instanceof Error ? error.message : 'Unknown error')
      } finally {
        setIsSyncing(false)
      }
    }

    syncUser()
  }, [authenticated, user?.id, isSynced])

  // Reset sync state when user changes
  useEffect(() => {
    if (!authenticated || !user?.id) {
      setIsSynced(false)
      setSyncError(null)
    }
  }, [authenticated, user?.id])

  return {
    isSyncing,
    syncError,
    isSynced,
    userId: user?.id || null,
  }
}