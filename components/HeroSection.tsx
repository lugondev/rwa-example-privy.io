'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, TrendingUp, Vault, PieChart, Shield } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

interface FeaturedAsset {
  id: string
  name: string
  category: string
  price: number
  priceUSD: string
  change24h: number
  imageUrl: string
  vault?: string
  fractionalized: boolean
  totalShares: number
  availableShares: number
}

const HeroSection = React.memo(() => {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [featuredAssets, setFeaturedAssets] = useState<FeaturedAsset[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Memoize features array to prevent recreation
  const features = useMemo(() => [
    {
      icon: Vault,
      title: 'Secure Vaults',
      description: 'Physical assets stored in insured, monitored vaults'
    },
    {
      icon: PieChart,
      title: 'Fractional Ownership',
      description: 'Own shares of high-value assets starting from $100'
    },
    {
      icon: Shield,
      title: 'Authenticated Assets',
      description: 'Expert verification and blockchain certificates'
    },
    {
      icon: TrendingUp,
      title: 'Real-time Pricing',
      description: 'Oracle-powered pricing with market analytics'
    }
  ], [])

  // Memoize fetch function to prevent unnecessary re-creation
  const fetchFeaturedAssets = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/assets?featured=true&limit=3')
      
      if (!response.ok) {
        throw new Error('Failed to fetch featured assets')
      }
      
      const data = await response.json()
      
      // Transform API data to match component interface
      const transformedAssets: FeaturedAsset[] = data.assets?.map((asset: any) => ({
        id: asset.id,
        name: asset.name,
        category: asset.category,
        price: asset.price,
        priceUSD: `$${(asset.price * 3100).toLocaleString()}`, // Assuming ETH price ~$3100
        change24h: asset.change24h || 0,
        imageUrl: asset.imageUrl || `https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(`${asset.category} ${asset.name} professional product photo`)}&image_size=landscape_4_3`,
        vault: asset.vault || 'Secure Vault',
        fractionalized: asset.fractionalized || false,
        totalShares: asset.totalShares || 1,
        availableShares: asset.availableShares || 1
      })) || []
      
      setFeaturedAssets(transformedAssets)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load featured assets')
      console.error('Error fetching featured assets:', err)
      
      // Fallback to mock data if API fails
      setFeaturedAssets([
        {
          id: '1',
          name: 'Vintage Rolex Submariner',
          category: 'Physical Collectible',
          price: 45.8,
          priceUSD: '$142,560',
          change24h: 12.5,
          imageUrl: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=vintage%20rolex%20submariner%20luxury%20watch%20professional%20product%20photo&image_size=landscape_4_3',
          vault: 'Swiss Vault AG',
          fractionalized: true,
          totalShares: 1000,
          availableShares: 234
        },
        {
          id: '2',
          name: 'Manhattan Real Estate Token',
          category: 'Real Estate',
          price: 2450,
          priceUSD: '$7,623,000',
          change24h: 8.2,
          imageUrl: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=manhattan%20luxury%20real%20estate%20building%20professional%20photo&image_size=landscape_4_3',
          vault: 'NYC Property Vault',
          fractionalized: true,
          totalShares: 10000,
          availableShares: 1250
        },
        {
          id: '3',
          name: 'Rare Pokemon Card Collection',
          category: 'Physical Collectible',
          price: 23.4,
          priceUSD: '$72,840',
          change24h: 15.7,
          imageUrl: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=rare%20pokemon%20cards%20collection%20professional%20product%20photo&image_size=landscape_4_3',
          vault: 'Collectibles Secure',
          fractionalized: false,
          totalShares: 1,
          availableShares: 1
        }
      ])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchFeaturedAssets()
  }, [fetchFeaturedAssets])

  useEffect(() => {
    if (featuredAssets.length > 0) {
      const timer = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % featuredAssets.length)
      }, 5000)
      return () => clearInterval(timer)
    }
  }, [featuredAssets.length])

  // Memoize slide navigation functions
  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % featuredAssets.length)
  }, [featuredAssets.length])

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + featuredAssets.length) % featuredAssets.length)
  }, [featuredAssets.length])

  return (
    <section className="relative py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-transparent" />
      
      <div className="max-w-7xl mx-auto relative">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            <div className="space-y-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center px-4 py-2 bg-blue-500/20 text-blue-400 rounded-full text-sm font-medium border border-blue-500/30"
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Real World Assets Marketplace
              </motion.div>
              
              <h1 className="text-4xl lg:text-6xl font-playfair font-bold text-white leading-tight">
                Trade <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Real Assets</span> on the Blockchain
              </h1>
              
              <p className="text-xl text-slate-300 leading-relaxed">
                The first marketplace to tokenize physical collectibles, real estate, and commodities with fractional ownership, secure vaults, and DeFi integration.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/assets" className="btn-rwa">
                Explore Marketplace
              </Link>
              <Link href="/assets/create" className="btn-glass">
                Tokenize Assets
              </Link>
            </div>
            
            {/* Features Grid */}
            <div className="grid grid-cols-2 gap-4 pt-8">
              {features.map((feature, index) => {
                const Icon = feature.icon
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                    className="space-y-2"
                  >
                    <div className="flex items-center space-x-2">
                      <Icon className="w-5 h-5 text-blue-400" />
                      <h3 className="font-semibold text-white text-sm">{feature.title}</h3>
                    </div>
                    <p className="text-slate-400 text-xs leading-relaxed">{feature.description}</p>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
          
          {/* Right Content - Asset Carousel */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="relative h-96 lg:h-[500px] rounded-2xl overflow-hidden">
              {loading ? (
                <div className="asset-card h-full flex items-center justify-center">
                  <div className="text-slate-500 text-center">
                    <div className="w-16 h-16 bg-slate-700 rounded-lg mx-auto mb-2 flex items-center justify-center animate-pulse">
                      <Vault className="w-8 h-8" />
                    </div>
                    <p className="text-sm">Loading featured assets...</p>
                  </div>
                </div>
              ) : error ? (
                <div className="asset-card h-full flex items-center justify-center">
                  <div className="text-red-400 text-center">
                    <div className="w-16 h-16 bg-red-900/20 rounded-lg mx-auto mb-2 flex items-center justify-center">
                      <Vault className="w-8 h-8" />
                    </div>
                    <p className="text-sm mb-2">Failed to load assets</p>
                    <button 
                      onClick={fetchFeaturedAssets}
                      className="text-xs text-blue-400 hover:text-blue-300"
                    >
                      Try again
                    </button>
                  </div>
                </div>
              ) : featuredAssets.length > 0 ? (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentSlide}
                    initial={{ opacity: 0, scale: 1.1 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.5 }}
                    className="absolute inset-0 asset-card"
                  >
                    <div className="h-full flex flex-col">
                      {/* Asset Image */}
                      <div className="flex-1 bg-slate-800 rounded-xl mb-4 overflow-hidden">
                        <Image 
                          src={featuredAssets[currentSlide].imageUrl}
                          alt={featuredAssets[currentSlide].name}
                          width={400}
                          height={300}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.style.display = 'none'
                            target.parentElement!.innerHTML = `
                              <div class="h-full flex items-center justify-center text-slate-500">
                                <div class="text-center">
                                  <div class="w-16 h-16 bg-slate-700 rounded-lg mx-auto mb-2 flex items-center justify-center">
                                    <svg class="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                                      <path d="M12 2L2 7v10c0 5.55 3.84 9.74 9 11 5.16-1.26 9-5.45 9-11V7l-10-5z"/>
                                    </svg>
                                  </div>
                                  <p class="text-sm">Asset Preview</p>
                                </div>
                              </div>
                            `
                          }}
                        />
                      </div>
                    
                     {/* Asset Info */}
                     <div className="space-y-4">
                       <div className="flex items-center justify-between">
                         <div>
                           <h3 className="text-xl font-semibold text-white">{featuredAssets[currentSlide].name}</h3>
                           <p className="text-slate-400 text-sm">{featuredAssets[currentSlide].category}</p>
                         </div>
                         <div className="vault-indicator">
                           <Vault className="w-3 h-3 mr-1" />
                           Vaulted
                         </div>
                       </div>
                       
                       <div className="flex items-center justify-between">
                         <div>
                           <p className="text-2xl font-bold text-white">{featuredAssets[currentSlide].price} ETH</p>
                           <p className="text-slate-400 text-sm">{featuredAssets[currentSlide].priceUSD}</p>
                         </div>
                         <div className="text-right">
                           <p className={`font-semibold ${
                             featuredAssets[currentSlide].change24h >= 0 ? 'text-emerald-400' : 'text-red-400'
                           }`}>
                             {featuredAssets[currentSlide].change24h >= 0 ? '+' : ''}{featuredAssets[currentSlide].change24h.toFixed(1)}%
                           </p>
                           <p className="text-slate-400 text-sm">24h change</p>
                         </div>
                       </div>
                       
                       {featuredAssets[currentSlide].fractionalized && (
                         <div className="space-y-2">
                           <div className="flex items-center justify-between text-sm">
                             <span className="text-slate-400">Available Shares</span>
                             <span className="text-white">
                               {featuredAssets[currentSlide].availableShares} / {featuredAssets[currentSlide].totalShares}
                             </span>
                           </div>
                           <div className="w-full bg-slate-800 rounded-full h-2">
                             <div 
                               className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                               style={{ 
                                 width: `${(featuredAssets[currentSlide].availableShares / featuredAssets[currentSlide].totalShares) * 100}%` 
                               }}
                             />
                           </div>
                         </div>
                       )}
                     </div>
                   </div>
                 </motion.div>
               </AnimatePresence>
             ) : (
               <div className="asset-card h-full flex items-center justify-center">
                 <div className="text-slate-500 text-center">
                   <div className="w-16 h-16 bg-slate-700 rounded-lg mx-auto mb-2 flex items-center justify-center">
                     <Vault className="w-8 h-8" />
                   </div>
                   <p className="text-sm">No featured assets available</p>
                 </div>
               </div>
             )}
              
              {/* Navigation Arrows - Only show if we have assets */}
              {featuredAssets.length > 1 && (
                <>
                  <button
                    onClick={prevSlide}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 rounded-full transition-all duration-200"
                  >
                    <ChevronLeft className="w-5 h-5 text-white" />
                  </button>
                  
                  <button
                    onClick={nextSlide}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 rounded-full transition-all duration-200"
                  >
                    <ChevronRight className="w-5 h-5 text-white" />
                  </button>
                  
                  {/* Slide Indicators */}
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                    {featuredAssets.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentSlide(index)}
                        className={`w-2 h-2 rounded-full transition-all duration-200 ${
                          index === currentSlide ? 'bg-blue-500' : 'bg-slate-600'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
})

export default HeroSection