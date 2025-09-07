'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { PrivyProvider } from '@privy-io/react-auth'
import { Toaster } from 'sonner'
import { createContext, useContext, useEffect, useState } from 'react'
import { WagmiProvider } from '@/components/providers/WagmiProvider'

type Theme = 'dark' | 'light' | 'system'

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

// Debug logging for Privy connection
const logPrivyStatus = () => {
  console.log('🔐 Privy Configuration:')
  console.log('App ID:', process.env.NEXT_PUBLIC_PRIVY_APP_ID)
  console.log('Environment:', process.env.NODE_ENV)
  console.log('Timestamp:', new Date().toISOString())
}

interface ProvidersProps {
  children: React.ReactNode
}

/**
 * Theme provider component that manages theme state
 */
function ThemeProvider({ children }: ProvidersProps) {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')
  
  useEffect(() => {
    // Get initial theme from localStorage or system preference
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    const initialTheme = savedTheme || systemTheme
    
    setTheme(initialTheme)
    document.documentElement.classList.remove('light', 'dark')
    document.documentElement.classList.add(initialTheme)
    
    // Listen for theme changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'theme' && e.newValue) {
        const newTheme = e.newValue as 'light' | 'dark'
        setTheme(newTheme)
        document.documentElement.classList.remove('light', 'dark')
        document.documentElement.classList.add(newTheme)
      }
    }
    
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])
  
  return <>{children}</>
}

/**
 * Main providers wrapper that includes all necessary providers for the app
 * - PrivyProvider for authentication
 * - QueryProvider for React Query
 * - ThemeProvider for theme management
 * - Toaster for notifications
 */
export default function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient()
  const [privyError, setPrivyError] = useState<string | null>(null)

  // Log Privy configuration on mount
  useEffect(() => {
    logPrivyStatus()
    
    // Check if required environment variables are present
    if (!process.env.NEXT_PUBLIC_PRIVY_APP_ID) {
      const error = 'Missing NEXT_PUBLIC_PRIVY_APP_ID environment variable'
      console.error('❌ Privy Error:', error)
      setPrivyError(error)
    }
  }, [])

  // Handle Privy initialization errors (we'll catch them at component level)
  const handlePrivyError = (error: any) => {
    console.error('❌ Privy Provider Error:', error)
    setPrivyError(error.message || 'Unknown Privy error')
  }

  if (privyError) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950 text-white">
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold mb-4">🔐 Privy Connection Error</h1>
          <p className="text-red-400 mb-4">{privyError}</p>
          <p className="text-sm text-slate-400">Check console for more details</p>
        </div>
      </div>
    )
  }

  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider>
        <ThemeProvider>
          <PrivyProvider
            appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!}
            config={{
              appearance: {
                theme: 'dark',
                accentColor: '#3B82F6',
              },
              embeddedWallets: {
                createOnLogin: 'users-without-wallets',
              },
              loginMethods: ['email', 'wallet'],
              supportedChains: [
                {
                  id: 1,
                  name: 'Ethereum',
                  network: 'homestead',
                  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
                  rpcUrls: { default: { http: ['https://eth.llamarpc.com'] } },
                  blockExplorers: { default: { name: 'Etherscan', url: 'https://etherscan.io' } },
                },
                {
                  id: 137,
                  name: 'Polygon',
                  network: 'matic',
                  nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
                  rpcUrls: { default: { http: ['https://polygon.llamarpc.com'] } },
                  blockExplorers: { default: { name: 'PolygonScan', url: 'https://polygonscan.com' } },
                },
              ],
            }}
          >
            {children}
          </PrivyProvider>
        </ThemeProvider>
        <Toaster
          style={{
            '--normal-bg': 'hsl(var(--background))',
            '--normal-border': 'hsl(var(--border))',
            '--normal-text': 'hsl(var(--foreground))',
          } as React.CSSProperties}
        />
      </WagmiProvider>
    </QueryClientProvider>
  )
}
