'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Heart, 
  Share2, 
  ExternalLink, 
  Vault, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Clock,
  Shield,
  ChevronLeft,
  ChevronRight,
  RefreshCw
} from 'lucide-react'
import Link from 'next/link'
import { useAssets } from '@/hooks/useAssets'

interface Asset {
  id: string
  name: string
  type: 'Digital NFT' | 'Physical Collectible' | 'Real Estate' | 'Commodity'
  price: number
  priceUSD: string
  change24h: number
  image: string
  vault: string | { id: string; name: string; apy?: number }
  verified: boolean
  fractionalized: boolean
  totalShares?: number
  availableShares?: number
  owners?: number
  lastSale?: string
  rarity?: 'Common' | 'Rare' | 'Epic' | 'Legendary'
  location?: string
  description?: string
  category?: string
  status?: string
  createdAt?: string
  updatedAt?: string
}

interface AssetGridProps {
  selectedCategory: string
  searchQuery: string
}

const AssetGrid = React.memo(({ selectedCategory, searchQuery }: AssetGridProps) => {
  const [currentPage, setCurrentPage] = useState(1)
  const [sortBy, setSortBy] = useState<'price' | 'change' | 'recent'>('recent')
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const assetsPerPage = 12

  // Use React Query hook for data fetching with caching
  const {
    data: assetsData,
    isLoading: loading,
    error,
    refetch: fetchAssets
  } = useAssets({
    page: currentPage,
    limit: assetsPerPage,
    sortBy: sortBy,
    category: selectedCategory !== 'All Assets' ? selectedCategory : undefined,
    search: searchQuery || undefined
  })

  // Transform API data to match component interface
  const assets = useMemo(() => {
    if (!assetsData?.assets) return []
    
    return assetsData.assets.map((asset: any) => ({
      id: asset.id,
      name: asset.name,
      type: asset.category as Asset['type'],
      price: asset.price || 0,
      priceUSD: `$${(asset.price || 0).toLocaleString()}`,
      change24h: Math.random() * 20 - 10, // TODO: Get real price change data
      image: asset.image || '/api/placeholder/400/400',
      vault: typeof asset.vault === 'object' && asset.vault ? asset.vault.name : (asset.vault || 'Secure Vault'),
      verified: asset.status === 'active',
      fractionalized: asset.fractionalized || false,
      totalShares: asset.totalShares,
      availableShares: asset.availableShares,
      owners: Math.floor(Math.random() * 200) + 1, // TODO: Get real owner count
      lastSale: new Date(asset.updatedAt || asset.createdAt).toLocaleDateString(),
      rarity: ['Common', 'Rare', 'Epic', 'Legendary'][Math.floor(Math.random() * 4)] as Asset['rarity'],
      location: asset.location
    }))
  }, [assetsData?.assets])

  const totalAssets = assetsData?.total || 0

  useEffect(() => {
    setCurrentPage(1) // Reset to first page when filters change
  }, [selectedCategory, searchQuery])

  // Memoize calculated values
  const totalPages = useMemo(() => Math.ceil(totalAssets / assetsPerPage), [totalAssets, assetsPerPage])

  // Memoize event handlers
  const toggleFavorite = useCallback((assetId: string) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev)
      if (newFavorites.has(assetId)) {
        newFavorites.delete(assetId)
      } else {
        newFavorites.add(assetId)
      }
      return newFavorites
    })
  }, [])

  const handleSortChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortBy(e.target.value as any)
  }, [])

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page)
  }, [])

  const handlePrevPage = useCallback(() => {
    setCurrentPage(prev => Math.max(prev - 1, 1))
  }, [])

  const handleNextPage = useCallback(() => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages))
  }, [totalPages])

  // Memoize utility functions
  const getRarityColor = useCallback((rarity?: string) => {
    switch (rarity) {
      case 'Legendary': return 'text-yellow-400 bg-yellow-400/20'
      case 'Epic': return 'text-purple-400 bg-purple-400/20'
      case 'Rare': return 'text-blue-400 bg-blue-400/20'
      default: return 'text-slate-400 bg-slate-400/20'
    }
  }, [])
  
  // Error state
  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-400 mb-4">Error loading assets</div>
        <p className="text-slate-400 mb-4">{error instanceof Error ? error.message : 'An error occurred'}</p>
        <div className="flex gap-3 justify-center">
          <button 
            onClick={() => fetchAssets()}
            disabled={loading}
            className="btn-glass flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            aria-label="Retry loading assets"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Retrying...' : 'Try Again'}
          </button>
        </div>
      </div>
    )
  }



  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="asset-card animate-pulse">
            <div className="h-48 bg-slate-700 rounded-lg mb-4" />
            <div className="space-y-3">
              <div className="h-4 bg-slate-700 rounded w-3/4" />
              <div className="h-3 bg-slate-700 rounded w-1/2" />
              <div className="h-6 bg-slate-700 rounded w-2/3" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Sort Controls */}
      <div className="flex items-center justify-between">
        <p className="text-slate-400">
          Showing {assets.length} of {totalAssets} assets
        </p>
        <div className="flex items-center space-x-2">
          <label htmlFor="sort-select" className="text-slate-400 text-sm">Sort by:</label>
          <select
            id="sort-select"
            value={sortBy}
            onChange={handleSortChange}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1 text-white text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            aria-label="Sort assets by"
          >
            <option value="recent">Most Recent</option>
            <option value="price">Highest Price</option>
            <option value="change">Biggest Gain</option>
          </select>
        </div>
      </div>

      {/* Assets Grid */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentPage}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          role="grid"
          aria-label="Assets grid"
        >
          {assets.map((asset, index) => (
            <motion.div
              key={asset.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="group"
              role="gridcell"
            >
              <div className="asset-card hover:scale-105 transition-all duration-300">
                {/* Asset Image */}
                <div className="relative h-48 bg-slate-800 rounded-lg mb-4 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  
                  {/* Asset placeholder */}
                  <div className="h-full flex items-center justify-center text-slate-500">
                    <Vault className="w-12 h-12" />
                  </div>
                  
                  {/* Top badges */}
                  <div className="absolute top-3 left-3 flex items-center space-x-2">
                    {asset.verified && (
                      <div className="flex items-center px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs">
                        <Shield className="w-3 h-3 mr-1" />
                        Verified
                      </div>
                    )}
                    {asset.rarity && (
                      <div className={`px-2 py-1 rounded-full text-xs ${getRarityColor(asset.rarity)}`}>
                        {asset.rarity}
                      </div>
                    )}
                  </div>
                  
                  {/* Action buttons */}
                  <div className="absolute top-3 right-3 flex items-center space-x-2 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-200">
                    <button
                      onClick={() => toggleFavorite(asset.id)}
                      className={`p-2 rounded-full backdrop-blur-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-white/50 ${
                        favorites.has(asset.id)
                          ? 'bg-red-500/20 text-red-400'
                          : 'bg-black/20 text-white hover:bg-red-500/20 hover:text-red-400'
                      }`}
                      aria-label={favorites.has(asset.id) ? `Remove ${asset.name} from favorites` : `Add ${asset.name} to favorites`}
                      aria-pressed={favorites.has(asset.id)}
                    >
                      <Heart className={`w-4 h-4 ${favorites.has(asset.id) ? 'fill-current' : ''}`} />
                    </button>
                    <button 
                      className="p-2 bg-black/20 text-white rounded-full backdrop-blur-sm hover:bg-blue-500/20 hover:text-blue-400 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-white/50"
                      aria-label={`Share ${asset.name}`}
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  {/* Vault indicator */}
                  <div className="absolute bottom-3 left-3">
                    <div className="vault-indicator">
                      <Vault className="w-3 h-3 mr-1" />
                      {typeof asset.vault === 'object' && asset.vault ? asset.vault.name : asset.vault}
                    </div>
                  </div>
                </div>
                
                {/* Asset Info */}
                <div className="space-y-3">
                  <div>
                    <h3 className="font-semibold text-white group-hover:text-blue-400 transition-colors duration-200 line-clamp-1">
                      {asset.name}
                    </h3>
                    <p className="text-slate-400 text-sm">{asset.type}</p>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-lg font-bold text-white">{asset.price} ETH</p>
                      <p className="text-slate-400 text-sm">{asset.priceUSD}</p>
                    </div>
                    <div className={`flex items-center text-sm ${
                      asset.change24h >= 0 ? 'text-emerald-400' : 'text-red-400'
                    }`}>
                      {asset.change24h >= 0 ? (
                        <TrendingUp className="w-4 h-4 mr-1" />
                      ) : (
                        <TrendingDown className="w-4 h-4 mr-1" />
                      )}
                      {Math.abs(asset.change24h)}%
                    </div>
                  </div>
                  
                  {/* Fractional info */}
                  {asset.fractionalized && asset.totalShares && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-400">Available</span>
                        <span className="text-white">
                          {asset.availableShares} / {asset.totalShares}
                        </span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-1.5">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-purple-500 h-1.5 rounded-full"
                          style={{ 
                            width: `${((asset.totalShares - (asset.availableShares || 0)) / asset.totalShares) * 100}%` 
                          }}
                        />
                      </div>
                    </div>
                  )}
                  
                  {/* Bottom info */}
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <div className="flex items-center">
                      <Users className="w-3 h-3 mr-1" />
                      {asset.owners} owner{asset.owners !== 1 ? 's' : ''}
                    </div>
                    <div className="flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {asset.lastSale}
                    </div>
                  </div>
                  
                  {/* Action button */}
                  <Link
                    href={`/assets/${asset.id}`}
                    className="w-full btn-glass text-center inline-flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    aria-label={`View details for ${asset.name}`}
                  >
                    View Details
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>

      {/* Pagination */}
      {totalPages > 1 && (
        <nav className="flex items-center justify-center space-x-2 pt-8" aria-label="Assets pagination">
          <button
            onClick={handlePrevPage}
            disabled={currentPage === 1}
            className="p-2 bg-slate-800 border border-slate-700 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed hover:border-blue-500 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            aria-label="Go to previous page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              className={`px-3 py-2 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
                page === currentPage
                  ? 'bg-blue-500 text-white'
                  : 'bg-slate-800 border border-slate-700 text-white hover:border-blue-500'
              }`}
              aria-label={`Go to page ${page}`}
              aria-current={page === currentPage ? 'page' : undefined}
            >
              {page}
            </button>
          ))}
          
          <button
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            className="p-2 bg-slate-800 border border-slate-700 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed hover:border-blue-500 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            aria-label="Go to next page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </nav>
      )}
    </div>
  )
})

AssetGrid.displayName = 'AssetGrid'

export default AssetGrid