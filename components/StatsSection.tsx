'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, Users, Vault, DollarSign, PieChart, Activity, Wifi, WifiOff, RefreshCw } from 'lucide-react'
import { usePriceUpdates } from '@/hooks/usePriceUpdates'
import { useRetryApiCall } from '@/hooks/useRetry'
import { useMarketStats } from '@/hooks/useStats'

const StatsSection = React.memo(() => {
  const [stats, setStats] = useState({
    totalValue: 0,
    totalAssets: 0,
    activeUsers: 0,
    vaults: 0,
    fractionalShares: 0,
    volume24h: 0
  })
  
  // Use price updates hook for real-time market data
  const { prices, isConnected, lastUpdate } = usePriceUpdates({
    assetIds: ['real-estate-token-1', 'real-estate-token-2', 'real-estate-token-3'],
    updateInterval: 60000 // Update every 60 seconds to reduce API spam
  })

  // Use React Query hook for stats with built-in caching and deduplication
  const { data: marketData, isLoading, error, refetch: refetchStats } = useMarketStats()
  const reset = () => {
    refetchStats()
  }

  // Update stats with animation when data changes
  useEffect(() => {
    if (marketData) {
      const targetStats = {
        totalValue: marketData.totalValue || 0,
        totalAssets: marketData.totalAssets || 0,
        activeUsers: marketData.activeUsers || 0,
        vaults: marketData.vaults || 0,
        fractionalShares: marketData.fractionalShares || 0,
        volume24h: marketData.volume24h || 0
      }

      // Animate the stats update with proper cleanup
      const animateStats = () => {
        const duration = 2000 // 2 seconds
        const steps = 60
        const stepDuration = duration / steps
        let currentStep = 0

        const interval = setInterval(() => {
          currentStep++
          const progress = currentStep / steps
          const easeOutQuart = 1 - Math.pow(1 - progress, 4)

          setStats({
            totalValue: Math.floor(targetStats.totalValue * easeOutQuart),
            totalAssets: Math.floor(targetStats.totalAssets * easeOutQuart),
            activeUsers: Math.floor(targetStats.activeUsers * easeOutQuart),
            vaults: Math.floor(targetStats.vaults * easeOutQuart),
            fractionalShares: Math.floor(targetStats.fractionalShares * easeOutQuart),
            volume24h: Math.floor(targetStats.volume24h * easeOutQuart)
          })

          if (currentStep >= steps) {
            clearInterval(interval)
            setStats(targetStats)
          }
        }, stepDuration)

        // Return cleanup function
        return () => clearInterval(interval)
      }

      const cleanup = animateStats()
      
      // Cleanup on unmount or when marketData changes
      return cleanup
    }
  }, [marketData])
  
  // Update volume24h based on real-time price data
  useEffect(() => {
    if (Object.keys(prices).length > 0) {
      const totalVolume = Object.values(prices).reduce((sum, price) => {
        return sum + (price.volume24h || 0)
      }, 0)
      
      setStats(prev => ({
        ...prev,
        volume24h: totalVolume
      }))
    }
  }, [prices])

  const formatNumber = useCallback((num: number) => {
    if (num >= 1000000) {
      return `$${(num / 1000000).toFixed(1)}M`
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`
    }
    return num.toLocaleString()
  }, [])

  const formatCurrency = useCallback((num: number) => {
    if (num >= 1000000) {
      return `$${(num / 1000000).toFixed(1)}M`
    } else if (num >= 1000) {
      return `$${(num / 1000).toFixed(1)}K`
    }
    return `$${num.toLocaleString()}`
  }, [])

  const statsData = useMemo(() => [
    {
      icon: DollarSign,
      label: 'Total Value Locked',
      value: formatCurrency(stats.totalValue),
      change: '+12.5%', // TODO: Calculate real change from API
      changeType: 'positive' as const,
      description: 'Assets under management'
    },
    {
      icon: Vault,
      label: 'Tokenized Assets',
      value: stats.totalAssets.toLocaleString(),
      change: '+8.2%', // TODO: Calculate real change from API
      changeType: 'positive' as const,
      description: 'Physical & digital assets'
    },
    {
      icon: Users,
      label: 'Active Users',
      value: formatNumber(stats.activeUsers),
      change: '+15.7%', // TODO: Calculate real change from API
      changeType: 'positive' as const,
      description: 'Verified participants'
    },
    {
      icon: Activity,
      label: '24h Volume',
      value: formatCurrency(stats.volume24h),
      change: '+23.1%', // TODO: Calculate real change from API
      changeType: 'positive' as const,
      description: 'Trading volume'
    },
    {
      icon: PieChart,
      label: 'Fractional Shares',
      value: formatNumber(stats.fractionalShares),
      change: '+18.9%', // TODO: Calculate real change from API
      changeType: 'positive' as const,
      description: 'Ownership tokens issued'
    },
    {
      icon: TrendingUp,
      label: 'Secure Vaults',
      value: stats.vaults.toString(),
      change: '+5.3%', // TODO: Calculate real change from API
      changeType: 'positive' as const,
      description: 'Insured storage facilities'
    }
  ], [stats, formatCurrency, formatNumber])

  if (error) {
    return (
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-slate-900/50">
        <div className="max-w-7xl mx-auto text-center">
          <div className="text-red-400 mb-4">Error loading market statistics</div>
          <p className="text-slate-400 mb-4">{error.message}</p>
          <div className="flex gap-3 justify-center">
            <button 
              onClick={() => refetchStats()}
              disabled={isLoading}
              className="btn-glass flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              aria-label="Retry loading statistics"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Retrying...' : 'Try Again'}
            </button>
            <button 
              onClick={reset}
              className="btn-glass focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              aria-label="Reset error state"
            >
              Reset
            </button>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section 
      className="py-16 px-4 sm:px-6 lg:px-8 bg-slate-900/50"
      aria-labelledby="market-stats-heading"
      role="region"
    >
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <h2 
              id="market-stats-heading"
              className="text-3xl lg:text-4xl font-playfair font-bold text-white"
            >
              Market <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Statistics</span>
            </h2>
            {/* Real-time connection indicator */}
            <div 
              className="flex items-center gap-1 ml-4"
              role="status"
              aria-live="polite"
              aria-label={isConnected ? 'Real-time data connection active' : 'Real-time data connection offline'}
            >
              {isConnected ? (
                <>
                  <Wifi className="w-4 h-4 text-green-400" aria-hidden="true" />
                  <span className="text-xs text-green-400">Live</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-4 h-4 text-red-400" aria-hidden="true" />
                  <span className="text-xs text-red-400">Offline</span>
                </>
              )}
            </div>
          </div>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto">
            Real-time insights into the world&apos;s first comprehensive RWA marketplace
          </p>
          {lastUpdate && (
            <p className="text-sm text-slate-400 mt-2">
              Last updated: {new Date(lastUpdate).toLocaleTimeString()}
            </p>
          )}
        </motion.div>

        {/* Stats Grid */}
        <div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          role="list"
          aria-label="Market statistics"
        >
          {statsData.map((stat, index) => {
            const Icon = stat.icon
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="group"
                role="listitem"
              >
                <div 
                  className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 hover:border-blue-500/50 transition-all duration-300 hover:bg-slate-800/70 focus-within:ring-2 focus-within:ring-blue-500/50"
                  tabIndex={0}
                  role="article"
                  aria-labelledby={`stat-label-${index}`}
                  aria-describedby={`stat-description-${index}`}
                >
                  {/* Icon and Change */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-blue-500/20 rounded-lg group-hover:bg-blue-500/30 transition-colors duration-300">
                      <Icon className="w-6 h-6 text-blue-400" aria-hidden="true" />
                    </div>
                    <div 
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        stat.changeType === 'positive' 
                          ? 'bg-emerald-500/20 text-emerald-400' 
                          : 'bg-red-500/20 text-red-400'
                      }`}
                      aria-label={`${stat.changeType === 'positive' ? 'Increase' : 'Decrease'} of ${stat.change}`}
                    >
                      {stat.change}
                    </div>
                  </div>

                  {/* Value */}
                  <div className="mb-2">
                    <h3 
                      className="text-2xl lg:text-3xl font-bold text-white group-hover:text-blue-400 transition-colors duration-300"
                      aria-live="polite"
                    >
                      {stat.value}
                    </h3>
                  </div>

                  {/* Label and Description */}
                  <div className="space-y-1">
                    <p 
                      id={`stat-label-${index}`}
                      className="text-slate-300 font-medium"
                    >
                      {stat.label}
                    </p>
                    <p 
                      id={`stat-description-${index}`}
                      className="text-slate-500 text-sm"
                    >
                      {stat.description}
                    </p>
                  </div>

                  {/* Hover Effect Line */}
                  <div className="mt-4 h-1 bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Additional Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-12 text-center"
        >
          <div className="inline-flex items-center space-x-2 px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-full">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-slate-300 text-sm">Live price data updated via WebSocket</span>
          </div>
        </motion.div>
      </div>
    </section>
  )
})

StatsSection.displayName = 'StatsSection'

export default StatsSection