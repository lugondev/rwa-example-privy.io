import React from 'react'
import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown, Minus, Wifi, WifiOff } from 'lucide-react'
import { useAssetPrice } from '@/hooks/usePriceUpdates'

interface PriceDisplayProps {
  assetId: string
  className?: string
  showChange?: boolean
  showVolume?: boolean
  showLastUpdate?: boolean
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'compact' | 'detailed'
}

interface StaticPriceDisplayProps {
  price: number
  change24h?: number
  change24hPercentage?: number
  volume24h?: number
  lastUpdated?: string
  isConnected?: boolean
  className?: string
  showChange?: boolean
  showVolume?: boolean
  showLastUpdate?: boolean
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'compact' | 'detailed'
}

/**
 * Formats price with appropriate decimal places
 */
const formatPrice = (price: number): string => {
  if (price >= 1000) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(price)
  } else if (price >= 1) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 4
    }).format(price)
  } else {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 4,
      maximumFractionDigits: 8
    }).format(price)
  }
}

/**
 * Formats volume with K, M, B suffixes
 */
const formatVolume = (volume: number): string => {
  if (volume >= 1e9) {
    return `$${(volume / 1e9).toFixed(1)}B`
  } else if (volume >= 1e6) {
    return `$${(volume / 1e6).toFixed(1)}M`
  } else if (volume >= 1e3) {
    return `$${(volume / 1e3).toFixed(1)}K`
  } else {
    return `$${volume.toFixed(0)}`
  }
}

/**
 * Formats time ago from timestamp
 */
const formatTimeAgo = (timestamp: string): string => {
  const now = new Date()
  const updated = new Date(timestamp)
  const diffMs = now.getTime() - updated.getTime()
  const diffSeconds = Math.floor(diffMs / 1000)
  const diffMinutes = Math.floor(diffSeconds / 60)
  const diffHours = Math.floor(diffMinutes / 60)

  if (diffSeconds < 60) {
    return 'just now'
  } else if (diffMinutes < 60) {
    return `${diffMinutes}m ago`
  } else if (diffHours < 24) {
    return `${diffHours}h ago`
  } else {
    return updated.toLocaleDateString()
  }
}

/**
 * Static price display component that doesn't fetch data
 */
export const StaticPriceDisplay: React.FC<StaticPriceDisplayProps> = ({
  price,
  change24h = 0,
  change24hPercentage = 0,
  volume24h,
  lastUpdated,
  isConnected = true,
  className,
  showChange = true,
  showVolume = false,
  showLastUpdate = false,
  size = 'md',
  variant = 'default'
}) => {
  const isPositive = change24hPercentage > 0
  const isNegative = change24hPercentage < 0
  const isNeutral = change24hPercentage === 0

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  }

  const priceClasses = {
    sm: 'text-lg font-semibold',
    md: 'text-xl font-bold',
    lg: 'text-2xl font-bold'
  }

  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <span className={cn('font-semibold', sizeClasses[size])}>
          {formatPrice(price)}
        </span>
        {showChange && (
          <span className={cn(
            'flex items-center gap-1 text-xs',
            isPositive && 'text-green-600',
            isNegative && 'text-red-600',
            isNeutral && 'text-gray-500'
          )}>
            {isPositive && <TrendingUp className="h-3 w-3" />}
            {isNegative && <TrendingDown className="h-3 w-3" />}
            {isNeutral && <Minus className="h-3 w-3" />}
            {change24hPercentage.toFixed(2)}%
          </span>
        )}
        {!isConnected && (
          <WifiOff className="h-3 w-3 text-gray-400" />
        )}
      </div>
    )
  }

  return (
    <div className={cn('space-y-1', className)}>
      <div className="flex items-center gap-2">
        <span className={cn('text-gray-900 dark:text-gray-100', priceClasses[size])}>
          {formatPrice(price)}
        </span>
        {!isConnected && (
          <WifiOff className="h-4 w-4 text-gray-400" />
        )}
        {isConnected && (
          <Wifi className="h-4 w-4 text-green-500" />
        )}
      </div>
      
      {showChange && (
        <div className={cn(
          'flex items-center gap-1',
          sizeClasses[size],
          isPositive && 'text-green-600',
          isNegative && 'text-red-600',
          isNeutral && 'text-gray-500'
        )}>
          {isPositive && <TrendingUp className="h-4 w-4" />}
          {isNegative && <TrendingDown className="h-4 w-4" />}
          {isNeutral && <Minus className="h-4 w-4" />}
          <span>
            {change24h > 0 ? '+' : ''}{formatPrice(change24h)} ({change24hPercentage > 0 ? '+' : ''}{change24hPercentage.toFixed(2)}%)
          </span>
        </div>
      )}
      
      {variant === 'detailed' && (
        <div className="space-y-1">
          {showVolume && volume24h && (
            <div className={cn('text-gray-600 dark:text-gray-400', sizeClasses[size])}>
              Volume: {formatVolume(volume24h)}
            </div>
          )}
          
          {showLastUpdate && lastUpdated && (
            <div className={cn('text-gray-500 dark:text-gray-500 text-xs')}>
              Updated {formatTimeAgo(lastUpdated)}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * Real-time price display component that fetches data
 */
export const PriceDisplay: React.FC<PriceDisplayProps> = ({
  assetId,
  className,
  showChange = true,
  showVolume = false,
  showLastUpdate = false,
  size = 'md',
  variant = 'default'
}) => {
  const { price, loading, error } = useAssetPrice(assetId)

  if (loading) {
    return (
      <div className={cn('animate-pulse space-y-2', className)}>
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
        {showChange && (
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
        )}
      </div>
    )
  }

  if (error) {
    return (
      <div className={cn('text-red-500 text-sm', className)}>
        Failed to load price
      </div>
    )
  }

  if (!price) {
    return (
      <div className={cn('text-gray-500 text-sm', className)}>
        Price unavailable
      </div>
    )
  }

  return (
    <StaticPriceDisplay
      price={price.currentPrice}
      change24h={price.change24h}
      change24hPercentage={price.change24hPercentage}
      volume24h={price.volume24h}
      lastUpdated={price.lastUpdated}
      className={className}
      showChange={showChange}
      showVolume={showVolume}
      showLastUpdate={showLastUpdate}
      size={size}
      variant={variant}
    />
  )
}

/**
 * Price change indicator component
 */
export const PriceChangeIndicator: React.FC<{
  change: number
  className?: string
}> = ({ change, className }) => {
  const isPositive = change > 0
  const isNegative = change < 0
  const isNeutral = change === 0

  return (
    <span className={cn(
      'inline-flex items-center gap-1 text-sm font-medium',
      isPositive && 'text-green-600',
      isNegative && 'text-red-600',
      isNeutral && 'text-gray-500',
      className
    )}>
      {isPositive && <TrendingUp className="h-3 w-3" />}
      {isNegative && <TrendingDown className="h-3 w-3" />}
      {isNeutral && <Minus className="h-3 w-3" />}
      {change > 0 ? '+' : ''}{change.toFixed(2)}%
    </span>
  )
}

export default PriceDisplay