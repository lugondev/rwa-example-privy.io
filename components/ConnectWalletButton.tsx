'use client'

import React, { useCallback } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { LogIn } from 'lucide-react'
import { useToast } from '@/hooks/useToast'

interface ConnectWalletButtonProps {
  className?: string
  children?: React.ReactNode
}

/**
 * Connect Wallet Button component that handles Privy authentication
 * Provides proper error handling and loading states
 */
const ConnectWalletButton: React.FC<ConnectWalletButtonProps> = ({ 
  className = "btn-rwa flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-blue-500/50",
  children
}) => {
  const { ready, authenticated, login } = usePrivy()
  const { showSuccess, showError, messages } = useToast()

  const handleLogin = useCallback(async () => {
    console.log('Connect Wallet clicked', { ready, authenticated })
    
    if (!ready) {
      console.warn('Privy not ready yet')
      showError('Wallet connection not ready. Please try again.')
      return
    }

    if (authenticated) {
      console.log('User already authenticated')
      return
    }

    try {
      console.log('Attempting to login...')
      await login()
      showSuccess(messages.auth.loginSuccess)
      console.log('Login successful')
    } catch (error) {
      console.error('Login error:', error)
      showError(messages.auth.loginError || 'Failed to connect wallet. Please try again.')
    }
  }, [ready, authenticated, login, showSuccess, showError, messages])

  // Don't render if not ready
  if (!ready) {
    return (
      <button 
        disabled
        className={`${className} opacity-50 cursor-not-allowed`}
        aria-label="Loading wallet connection"
      >
        <LogIn className="w-4 h-4" />
        <span>Loading...</span>
      </button>
    )
  }

  // Don't render if already authenticated
  if (authenticated) {
    return null
  }

  return (
    <button
      onClick={handleLogin}
      className={className}
      aria-label="Connect wallet to access account"
    >
      {children || (
        <>
          <LogIn className="w-4 h-4" />
          <span>Connect Wallet</span>
        </>
      )}
    </button>
  )
}

export default ConnectWalletButton