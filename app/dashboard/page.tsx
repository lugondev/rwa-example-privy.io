'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { useToast } from '@/hooks/useToast'
import { DynamicAnimatedComponent } from '@/components/ui/dynamic-loader'
import SEOHead from '@/components/seo/SEOHead'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  Building2, 
  Vault, 
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Loader2
} from 'lucide-react'
import Navigation from '@/components/Navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { StatsCardSkeleton, CardSkeleton, PageHeaderSkeleton } from '@/components/ui/skeleton'
import { ErrorBoundary, ApiErrorFallback } from '@/components/ui/error-boundary'
import Link from 'next/link'

// Types for API responses
interface MarketStats {
  totalAssets: number
  totalValue: string
  totalUsers: number
  totalVaults: number
  volumeChange24h: number
  priceChange24h: number
}

interface Asset {
  id: string
  name: string
  type: string
  currentPrice: number
  priceChange24h: number
  totalSupply: number
  marketCap: number
  image?: string
}

interface UserPortfolio {
  totalValue: number
  totalAssets: number
  totalShares: number
  performance24h: number
  topAssets: Asset[]
}

const Dashboard = React.memo(function Dashboard() {
  const { user, authenticated } = usePrivy()
  const { showError, showSuccess, messages } = useToast()
  const [marketStats, setMarketStats] = useState<MarketStats | null>(null)
  const [userPortfolio, setUserPortfolio] = useState<UserPortfolio | null>(null)
  const [topAssets, setTopAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const [isRetrying, setIsRetrying] = useState(false)
  const [consecutiveErrors, setConsecutiveErrors] = useState(0)
  const maxConsecutiveErrors = 3

  // Fetch market statistics
  const fetchMarketStats = useCallback(async () => {
    try {
      const response = await fetch('/api/assets/stats')
      if (!response.ok) throw new Error(`Failed to fetch market stats: ${response.status}`)
      const data = await response.json()
      setMarketStats(data)
    } catch (err) {
      console.error('Error fetching market stats:', err)
      throw err
    }
  }, [])

  // Fetch user portfolio
  const fetchUserPortfolio = useCallback(async () => {
    if (!authenticated || !user?.wallet?.address) return
    
    try {
      const response = await fetch(`/api/users/${user.wallet.address}/portfolio`)
      if (!response.ok) throw new Error(`Failed to fetch portfolio: ${response.status}`)
      const data = await response.json()
      setUserPortfolio(data)
    } catch (err) {
      console.error('Error fetching portfolio:', err)
      throw err
    }
  }, [authenticated, user?.wallet?.address])

  // Fetch top performing assets
  const fetchTopAssets = useCallback(async () => {
    try {
      const response = await fetch('/api/assets?limit=5&sortBy=performance')
      if (!response.ok) throw new Error(`Failed to fetch top assets: ${response.status}`)
      const data = await response.json()
      setTopAssets(data.assets || [])
    } catch (err) {
      console.error('Error fetching top assets:', err)
      throw err
    }
  }, [])

  const handleRetry = useCallback(async () => {
    if (isRetrying) return // Prevent multiple retry attempts
    
    setIsRetrying(true)
    setRetryCount(prev => prev + 1)
    
    // Reset circuit breaker on manual retry
    setConsecutiveErrors(0)
    
    // Add delay to prevent spam
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    setIsRetrying(false)
  }, [isRetrying])

  // Load dashboard data with proper error handling and circuit breaker
  const loadDashboardData = useCallback(async () => {
    // Circuit breaker: stop trying if too many consecutive errors
    if (consecutiveErrors >= maxConsecutiveErrors) {
      setError('Quá nhiều lỗi liên tiếp. Vui lòng tải lại trang hoặc thử lại sau.')
      return
    }

    setLoading(true)
    setError(null)
    
    try {
      await Promise.all([
        fetchMarketStats(),
        fetchUserPortfolio(),
        fetchTopAssets()
      ])
      // Reset error count on success
      setConsecutiveErrors(0)
    } catch (err) {
      setConsecutiveErrors(prev => prev + 1)
      const errorMessage = err instanceof Error ? err.message : 'Không thể tải dữ liệu dashboard. Vui lòng thử lại.'
      setError(errorMessage)
      // Only show error toast for first few attempts
      if (consecutiveErrors < 2) {
        showError(errorMessage)
      }
    } finally {
      setLoading(false)
    }
  }, [fetchMarketStats, fetchUserPortfolio, fetchTopAssets, showError])

  // Trigger retry when retryCount changes
  useEffect(() => {
    if (retryCount > 0) {
      loadDashboardData()
    }
  }, [retryCount]) // Remove loadDashboardData dependency to prevent loops

  // Initial load only
  useEffect(() => {
    loadDashboardData()
  }, []) // Empty dependency array for initial load only

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <PageHeaderSkeleton />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 mt-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <StatsCardSkeleton key={i} />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CardSkeleton />
            <CardSkeleton />
          </div>
        </div>
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <SEOHead 
        title="Dashboard"
        description="View your RWA portfolio, market statistics, and top performing assets. Monitor your investments and discover new opportunities in real-world asset tokenization."
        keywords="dashboard, portfolio, market stats, RWA investments, asset performance, blockchain portfolio"
      />
      <div className="min-h-screen bg-slate-950">
        <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            {authenticated ? `Welcome back, ${user?.email || 'User'}` : 'RWA Marketplace Dashboard'}
          </h1>
          <p className="text-slate-400">
            Monitor your portfolio and explore real-world asset opportunities
          </p>
        </div>

        {error && (
          <ApiErrorFallback 
            error={new Error(error)} 
            onRetry={handleRetry}
            isRetrying={isRetrying}
          />
        )}

        {/* Market Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Total Assets</CardTitle>
              <Building2 className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {marketStats?.totalAssets?.toLocaleString() || '0'}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Total Value Locked</CardTitle>
              <DollarSign className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {marketStats?.totalValue || '$0'}
              </div>
              <div className="flex items-center text-xs text-slate-400 mt-1">
                {marketStats?.volumeChange24h && marketStats.volumeChange24h > 0 ? (
                  <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
                ) : (
                  <ArrowDownRight className="h-3 w-3 text-red-500 mr-1" />
                )}
                {Math.abs(marketStats?.volumeChange24h || 0).toFixed(2)}% from yesterday
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Active Users</CardTitle>
              <Users className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {marketStats?.totalUsers?.toLocaleString() || '0'}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Active Vaults</CardTitle>
              <Vault className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {marketStats?.totalVaults?.toLocaleString() || '0'}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* User Portfolio Summary */}
          {authenticated && userPortfolio && (
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Your Portfolio
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Overview of your RWA investments
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-400">Total Value</p>
                    <p className="text-2xl font-bold text-white">
                      ${userPortfolio.totalValue.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">24h Performance</p>
                    <div className="flex items-center gap-1">
                      {userPortfolio.performance24h > 0 ? (
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-500" />
                      )}
                      <span className={`text-lg font-semibold ${
                        userPortfolio.performance24h > 0 ? 'text-green-500' : 'text-red-500'
                      }`}>
                        {userPortfolio.performance24h > 0 ? '+' : ''}
                        {userPortfolio.performance24h.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800">
                  <div>
                    <p className="text-sm text-slate-400">Assets Owned</p>
                    <p className="text-lg font-semibold text-white">
                      {userPortfolio.totalAssets}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Total Shares</p>
                    <p className="text-lg font-semibold text-white">
                      {userPortfolio.totalShares.toLocaleString()}
                    </p>
                  </div>
                </div>

                <Link href="/portfolio">
                  <Button className="w-full mt-4 bg-blue-600 hover:bg-blue-700">
                    View Full Portfolio
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Top Performing Assets */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Top Performing Assets
              </CardTitle>
              <CardDescription className="text-slate-400">
                Best performing RWA assets in the last 24h
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topAssets.length > 0 ? (
                  topAssets.map((asset, index) => (
                    <DynamicAnimatedComponent
                      key={asset.id}
                      animation="slideUp"
                      delay={index * 0.1}
                      className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                          {asset.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-white">{asset.name}</p>
                          <p className="text-sm text-slate-400">{asset.type}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-white">
                          ${asset.currentPrice.toLocaleString()}
                        </p>
                        <div className="flex items-center gap-1">
                          {asset.priceChange24h > 0 ? (
                            <ArrowUpRight className="h-3 w-3 text-green-500" />
                          ) : (
                            <ArrowDownRight className="h-3 w-3 text-red-500" />
                          )}
                          <span className={`text-sm ${
                            asset.priceChange24h > 0 ? 'text-green-500' : 'text-red-500'
                          }`}>
                            {asset.priceChange24h > 0 ? '+' : ''}
                            {asset.priceChange24h.toFixed(2)}%
                          </span>
                        </div>
                      </div>
                    </DynamicAnimatedComponent>
                  ))
                ) : (
                  <p className="text-slate-400 text-center py-4">
                    No asset data available
                  </p>
                )}
              </div>
              
              <Link href="/assets">
                <Button variant="outline" className="w-full mt-4 border-slate-700 text-slate-300 hover:bg-slate-800">
                  Explore All Assets
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/assets">
              <Card className="bg-slate-900/50 border-slate-800 hover:bg-slate-800/50 transition-colors cursor-pointer">
                <CardContent className="p-6 text-center">
                  <Building2 className="h-8 w-8 text-blue-500 mx-auto mb-3" />
                  <h3 className="font-semibold text-white mb-2">Browse Assets</h3>
                  <p className="text-sm text-slate-400">Discover and invest in real-world assets</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/vaults">
              <Card className="bg-slate-900/50 border-slate-800 hover:bg-slate-800/50 transition-colors cursor-pointer">
                <CardContent className="p-6 text-center">
                  <Vault className="h-8 w-8 text-purple-500 mx-auto mb-3" />
                  <h3 className="font-semibold text-white mb-2">Manage Vaults</h3>
                  <p className="text-sm text-slate-400">Create and manage asset vaults</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/lending">
              <Card className="bg-slate-900/50 border-slate-800 hover:bg-slate-800/50 transition-colors cursor-pointer">
                <CardContent className="p-6 text-center">
                  <DollarSign className="h-8 w-8 text-green-500 mx-auto mb-3" />
                  <h3 className="font-semibold text-white mb-2">Lending & Borrowing</h3>
                  <p className="text-sm text-slate-400">Earn yield or borrow against assets</p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
        </div>
      </div>
    </ErrorBoundary>
  )
})

Dashboard.displayName = 'Dashboard'

export default Dashboard