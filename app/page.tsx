'use client'

import { useState, useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Search, Filter, TrendingUp, Vault, Coins, Building2 } from 'lucide-react'
import { PublicLayout } from '@/components/layout/AppLayout'
import HeroSection from '@/components/HeroSection'
import AssetGrid from '@/components/AssetGrid'
import StatsSection from '@/components/StatsSection'
import SEOHead from '@/components/seo/SEOHead'

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All Assets')

  // Memoize asset types to prevent recreation on every render
  const assetTypes = useMemo(() => [
    { id: 'All Assets', label: 'All Assets', icon: TrendingUp },
    { id: 'Digital NFT', label: 'Digital NFTs', icon: Coins },
    { id: 'Physical Collectible', label: 'Physical Collectibles', icon: Vault },
    { id: 'Real Estate', label: 'Real Estate', icon: Building2 },
  ], [])

  // Memoize event handlers to prevent unnecessary re-renders
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }, [])

  const handleCategoryChange = useCallback((categoryId: string) => {
    setSelectedCategory(categoryId)
  }, [])

  return (
    <>
      <SEOHead
        title="RWA Platform - Tokenized Real World Assets"
        description="Discover, invest, and trade tokenized real-world assets including real estate, art, commodities, and collectibles. Start your journey into the future of asset ownership."
        keywords="tokenized assets, real world assets, RWA, blockchain, investment, real estate, art, commodities, fractional ownership"
      />
      <PublicLayout>
      
      {/* Hero Section */}
      <HeroSection />

      {/* Stats Section */}
      <StatsSection />
      
      {/* Search and Filter Section */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-6 mb-8">
            {/* Search Bar */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search assets, collections, or creators..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full pl-12 pr-4 py-4 bg-slate-900/50 border border-slate-800 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            
            {/* Filter Buttons */}
            <div className="flex gap-2 overflow-x-auto">
              {assetTypes.map((type) => {
                const Icon = type.icon
                return (
                  <motion.button
                    key={type.id}
                    onClick={() => handleCategoryChange(type.id)}
                    className={`flex items-center gap-2 px-4 py-3 rounded-xl font-medium whitespace-nowrap transition-all duration-300 ${
                      selectedCategory === type.id
                        ? 'bg-blue-500 text-white'
                        : 'bg-slate-900/50 text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Icon className="w-4 h-4" />
                    {type.label}
                  </motion.button>
                )
              })}
            </div>
          </div>
          
          {/* Asset Grid */}
          <AssetGrid 
            selectedCategory={selectedCategory} 
            searchQuery={searchQuery} 
          />
        </div>
      </section>
      </PublicLayout>
    </>
  )
}