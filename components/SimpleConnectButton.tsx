'use client'

import { usePrivy } from '@privy-io/react-auth'
import { useEffect, useState } from 'react'

/**
 * Simple Connect Wallet Button component for testing
 * This component handles wallet connection with basic error handling
 */
export function SimpleConnectButton() {
  const [mounted, setMounted] = useState(false)
  const { ready, authenticated, login, logout, user } = usePrivy()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Don't render anything until mounted to avoid hydration issues
  if (!mounted) {
    return (
      <div className="px-4 py-2 bg-gray-600 text-gray-400 rounded-lg cursor-not-allowed">
        Loading...
      </div>
    )
  }

  // Show loading state while Privy is initializing
  if (!ready) {
    return (
      <div className="px-4 py-2 bg-gray-600 text-gray-400 rounded-lg cursor-not-allowed">
        Initializing...
      </div>
    )
  }

  // Show user info and logout button if authenticated
  if (authenticated && user) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-300">
          {user.email?.address || user.wallet?.address?.slice(0, 6) + '...' || 'Connected'}
        </span>
        <button
          onClick={logout}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
        >
          Disconnect
        </button>
      </div>
    )
  }

  // Show connect button if not authenticated
  return (
    <button
      onClick={() => {
        console.log('Connect button clicked')
        try {
          login()
        } catch (error) {
          console.error('Login error:', error)
        }
      }}
      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
    >
      Connect Wallet
    </button>
  )
}