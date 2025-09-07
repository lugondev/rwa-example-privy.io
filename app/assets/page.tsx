'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { DynamicAnimatedComponent } from '@/components/ui/dynamic-loader'
import SEOHead from '@/components/seo/SEOHead'
import { useDebounce } from '@/hooks/useDebounce'
import { useAssets, FilterOptions } from '@/hooks/useAssets'
import { 
  Search, 
  Filter, 
  TrendingUp, 
  TrendingDown,
  Building,
  Building2, 
  Vault, 
  Coins, 
  ArrowUpRight,
  ArrowDownRight,
  ChevronLeft,
  ChevronRight,
  Loader2,
  SlidersHorizontal
} from 'lucide-react'
import Navigation from '@/components/Navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { AssetGridSkeleton, PageHeaderSkeleton } from '@/components/ui/skeleton'
import { ErrorBoundary, ApiErrorFallback } from '@/components/ui/error-boundary'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { StaticPriceDisplay, PriceChangeIndicator } from '@/components/PriceDisplay'
import { usePriceUpdates } from '@/hooks/usePriceUpdates'
import { useFormValidation } from '@/hooks/useFormValidation'
import { useToast } from '@/hooks/useToast'
import Link from 'next/link'
import Image from 'next/image'

// Import types from useAssets hook
import type { Asset } from '@/hooks/useAssets'

export default function AssetsPage() {
  const { authenticated, user, login } = usePrivy()
  const { showError, showSuccess, showLoading, messages } = useToast()
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearchQuery = useDebounce(searchQuery, 500) // Debounce search for 500ms
  const [currentPage, setCurrentPage] = useState(1)
  const [showFilters, setShowFilters] = useState(false)
  const [compareAssets, setCompareAssets] = useState<string[]>([])
  const [showComparison, setShowComparison] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('')
  
  const [filters, setFilters] = useState<FilterOptions>({
    type: 'all',
    category: 'all',
    minPrice: '',
    maxPrice: '',
    riskLevel: 'all',
    minYield: '',
    maxYield: '',
    location: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  })

  const assetTypes = [
    { value: 'all', label: 'All Assets', icon: TrendingUp },
    { value: 'real_estate', label: 'Real Estate', icon: Building },
    { value: 'art', label: 'Art & Collectibles', icon: Vault },
    { value: 'commodities', label: 'Commodities', icon: Coins },
    { value: 'luxury_goods', label: 'Luxury Goods', icon: TrendingUp },
    { value: 'intellectual_property', label: 'IP Rights', icon: TrendingUp },
  ]

  const assetCategories = {
    real_estate: ['Residential', 'Commercial', 'Industrial', 'Land', 'REITs'],
    art: ['Paintings', 'Sculptures', 'Photography', 'Digital Art', 'Antiques'],
    commodities: ['Gold', 'Silver', 'Oil', 'Agricultural', 'Precious Metals'],
    luxury_goods: ['Watches', 'Cars', 'Jewelry', 'Wine', 'Fashion'],
    intellectual_property: ['Patents', 'Trademarks', 'Copyrights', 'Royalties']
  }

  const sortOptions = [
    { value: 'createdAt', label: 'Newest First' },
    { value: 'currentPrice', label: 'Price' },
    { value: 'priceChange24h', label: 'Performance' },
    { value: 'marketCap', label: 'Market Cap' },
    { value: 'name', label: 'Name' }
  ]

  // Use React Query hook for fetching assets with caching and automatic refetching
  const { 
    data: assetsData, 
    isLoading, 
    error, 
    refetch 
  } = useAssets({
    page: currentPage,
    limit: 12,
    search: debouncedSearchQuery,
    filters
  })

  // Extract data from React Query response
  const assets = assetsData?.assets || []
  const totalPages = assetsData?.totalPages || 1

  const handleRetry = () => {
    refetch()
  }

  // Show error message when there's an error
  useEffect(() => {
    if (error) {
      const errorMessage = error instanceof Error ? error.message : 'Không thể tải danh sách tài sản. Vui lòng thử lại.'
      showError(errorMessage)
    }
  }, [error, showError])

  // Handle search
  const handleSearch = (value: string) => {
    setSearchQuery(value)
    setCurrentPage(1) // Reset to first page when searching
  }

  // Handle filter changes
  const handleFilterChange = (key: keyof FilterOptions, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setCurrentPage(1) // Reset to first page when filtering
  }

  // Handle pagination
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Handle asset comparison
  const toggleAssetComparison = (assetId: string) => {
    setCompareAssets(prev => {
      if (prev.includes(assetId)) {
        return prev.filter(id => id !== assetId)
      } else if (prev.length < 3) {
        return [...prev, assetId]
      } else {
        showError('You can only compare up to 3 assets at once')
        return prev
      }
    })
  }

  // Handle category change
  const handleCategoryChange = (type: string) => {
    setFilters(prev => ({ ...prev, type, category: 'all' }))
    setSelectedCategory('')
    setCurrentPage(1)
  }

  // Get available categories for selected type
  const getAvailableCategories = () => {
    if (filters.type === 'all') return []
    return assetCategories[filters.type as keyof typeof assetCategories] || []
  }

  // Get risk level color
  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'Low': return 'bg-green-900/20 text-green-400 border-green-800'
      case 'Medium': return 'bg-yellow-900/20 text-yellow-400 border-yellow-800'
      case 'High': return 'bg-red-900/20 text-red-400 border-red-800'
      default: return 'bg-slate-900/20 text-slate-400 border-slate-800'
    }
  }

  return (
    <ErrorBoundary>
      <SEOHead 
        title="Assets"
        description="Discover and invest in tokenized real-world assets. Browse our curated collection of premium properties, art, commodities, and more with fractional ownership opportunities."
        keywords="tokenized assets, real estate, art, commodities, fractional ownership, investment opportunities, RWA marketplace"
      />
      <div className="min-h-screen bg-slate-950">
        <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Real World Assets
          </h1>
          <p className="text-slate-400">
            Discover and invest in tokenized real-world assets
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          {/* Search Bar */}
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Search assets, collections, or creators..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-12 bg-slate-900/50 border-slate-800 text-white placeholder-slate-400 focus:border-blue-500"
              />
            </div>
            
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              <SlidersHorizontal className="w-4 h-4 mr-2" />
              Filters
            </Button>
          </div>

          {/* Asset Type Buttons */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {assetTypes.map((type) => {
              const Icon = type.icon
              return (
                <Button
                  key={type.value}
                  variant={filters.type === type.value ? "default" : "outline"}
                  onClick={() => handleCategoryChange(type.value)}
                  className={`flex items-center gap-2 whitespace-nowrap ${
                    filters.type === type.value
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'border-slate-700 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {type.label}
                </Button>
              )
            })}
          </div>

          {/* Category Filters */}
          {filters.type !== 'all' && getAvailableCategories().length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              <Button
                variant={filters.category === 'all' ? "default" : "outline"}
                onClick={() => handleFilterChange('category', 'all')}
                size="sm"
                className={`whitespace-nowrap ${
                  filters.category === 'all'
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'border-slate-700 text-slate-300 hover:bg-slate-800'
                }`}
              >
                All Categories
              </Button>
              {getAvailableCategories().map((category) => (
                <Button
                  key={category}
                  variant={filters.category === category ? "default" : "outline"}
                  onClick={() => handleFilterChange('category', category)}
                  size="sm"
                  className={`whitespace-nowrap ${
                    filters.category === category
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'border-slate-700 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {category}
                </Button>
              ))}
            </div>
          )}

          {/* Comparison Bar */}
          {compareAssets.length > 0 && (
            <div className="flex items-center justify-between p-4 bg-blue-900/20 border border-blue-800 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-blue-400 font-medium">
                  {compareAssets.length} asset{compareAssets.length > 1 ? 's' : ''} selected for comparison
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowComparison(true)}
                  disabled={compareAssets.length < 2}
                  className="border-blue-700 text-blue-400 hover:bg-blue-800"
                >
                  Compare Assets
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCompareAssets([])}
                  className="border-slate-700 text-slate-300 hover:bg-slate-800"
                >
                  Clear
                </Button>
              </div>
            </div>
          )}

          {/* Advanced Filters */}
          {showFilters && (
            <DynamicAnimatedComponent
              animation="slideDown"
              className="grid grid-cols-1 md:grid-cols-6 gap-4 p-4 bg-slate-900/30 rounded-lg border border-slate-800"
            >
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  Min Price
                </label>
                <Input
                  type="number"
                  placeholder="0"
                  value={filters.minPrice}
                  onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  Max Price
                </label>
                <Input
                  type="number"
                  placeholder="No limit"
                  value={filters.maxPrice}
                  onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  Risk Level
                </label>
                <Select value={filters.riskLevel} onValueChange={(value) => handleFilterChange('riskLevel', value)}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="Low">Low Risk</SelectItem>
                    <SelectItem value="Medium">Medium Risk</SelectItem>
                    <SelectItem value="High">High Risk</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  Min Yield (%)
                </label>
                <Input
                  type="number"
                  placeholder="0"
                  value={filters.minYield}
                  onChange={(e) => handleFilterChange('minYield', e.target.value)}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  Max Yield (%)
                </label>
                <Input
                  type="number"
                  placeholder="No limit"
                  value={filters.maxYield}
                  onChange={(e) => handleFilterChange('maxYield', e.target.value)}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  Location
                </label>
                <Input
                  type="text"
                  placeholder="City, Country"
                  value={filters.location}
                  onChange={(e) => handleFilterChange('location', e.target.value)}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  Sort By
                </label>
                <Select value={filters.sortBy} onValueChange={(value) => handleFilterChange('sortBy', value)}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {sortOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </DynamicAnimatedComponent>
          )}
        </div>

        {/* Error State */}
        {error && (
          <ApiErrorFallback 
            error={new Error(error)} 
            onRetry={handleRetry}
          />
        )}

        {/* Loading State */}
        {isLoading && (
          <AssetGridSkeleton count={12} />
        )}

        {/* Assets Grid */}
        {!isLoading && !error && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
              {assets.map((asset, index) => (
                <DynamicAnimatedComponent
                  key={asset.id}
                  animation="slideUp"
                  delay={index * 0.1}
                >
                  <div className="relative">
                    {/* Comparison Checkbox */}
                    <div className="absolute top-3 right-3 z-10">
                      <input
                        type="checkbox"
                        checked={compareAssets.includes(asset.id)}
                        onChange={() => toggleAssetComparison(asset.id)}
                        className="w-4 h-4 text-blue-600 bg-slate-800 border-slate-600 rounded focus:ring-blue-500 focus:ring-2"
                      />
                    </div>
                    
                    <Link href={`/assets/${asset.id}`}>
                      <Card className="bg-slate-900/50 border-slate-800 hover:bg-slate-800/50 transition-all duration-300 cursor-pointer group">
                      <CardHeader className="p-0">
                        <div className="aspect-video bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-t-lg flex items-center justify-center">
                          {asset.image ? (
                            <Image 
                              src={asset.image} 
                              alt={asset.name}
                              width={400}
                              height={225}
                              className="w-full h-full object-cover rounded-t-lg"
                            />
                          ) : (
                            <div className="text-4xl font-bold text-white">
                              {asset.name.charAt(0)}
                            </div>
                          )}
                        </div>
                      </CardHeader>
                      
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h3 className="font-semibold text-white group-hover:text-blue-400 transition-colors">
                              {asset.name}
                            </h3>
                            <p className="text-sm text-slate-400">{asset.type}</p>
                          </div>
                          {asset.verified && (
                            <Badge className="bg-blue-900/20 text-blue-400 border-blue-800">
                              Verified
                            </Badge>
                          )}
                        </div>
                        
                        <p className="text-sm text-slate-400 mb-3 line-clamp-2">
                          {asset.description}
                        </p>
                        
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-400">Current Price</span>
                            <StaticPriceDisplay
                              price={asset.currentPrice}
                              change24hPercentage={asset.priceChange24h}
                              variant="compact"
                              size="sm"
                              showChange={false}
                              className="text-white"
                            />
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-400">24h Change</span>
                            <PriceChangeIndicator 
                              change={asset.priceChange24h}
                              className="text-xs"
                            />
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-400">Available Shares</span>
                            <span className="text-sm text-white">
                              {asset.availableShares?.toLocaleString() || 'N/A'}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-800">
                          <Badge className={getRiskLevelColor(asset.riskLevel)}>
                            {asset.riskLevel} Risk
                          </Badge>
                          {asset.yield && (
                            <span className="text-sm text-green-400">
                              {asset.yield.toFixed(1)}% APY
                            </span>
                          )}
                        </div>
                      </CardContent>
                      </Card>
                    </Link>
                  </div>
                </DynamicAnimatedComponent>
              ))}
            </div>

            {/* Empty State */}
            {assets.length === 0 && !isLoading && (
              <div className="text-center py-12">
                <Building2 className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-400 mb-2">
                  No assets found
                </h3>
                <p className="text-slate-500">
                  Try adjusting your search criteria or filters
                </p>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="border-slate-700 text-slate-300 hover:bg-slate-800"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = i + 1
                    return (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(page)}
                        className={currentPage === page 
                          ? "bg-blue-600 hover:bg-blue-700" 
                          : "border-slate-700 text-slate-300 hover:bg-slate-800"
                        }
                      >
                        {page}
                      </Button>
                    )
                  })}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="border-slate-700 text-slate-300 hover:bg-slate-800"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        )}
        </div>
      </div>
      
      {/* Asset Comparison Modal */}
      {showComparison && compareAssets.length >= 2 && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-xl border border-slate-700 max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-700">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Asset Comparison</h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowComparison(false)}
                  className="border-slate-700 text-slate-300 hover:bg-slate-800"
                >
                  Close
                </Button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {compareAssets.map((assetId) => {
                  const asset = assets.find(a => a.id === assetId);
                  if (!asset) return null;
                  
                  return (
                    <div key={asset.id} className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                      <div className="aspect-video bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-lg flex items-center justify-center mb-4">
                        <Building className="w-12 h-12 text-blue-400" />
                      </div>
                      
                      <h3 className="text-lg font-bold text-white mb-3">{asset.name}</h3>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Type:</span>
                          <span className="text-white">{asset.type}</span>
                        </div>
                        
                        <div className="flex justify-between">
                          <span className="text-slate-400">Price:</span>
                          <span className="text-white font-semibold">${asset.currentPrice.toLocaleString()}</span>
                        </div>
                        
                        <div className="flex justify-between">
                          <span className="text-slate-400">Yield:</span>
                          <span className="text-green-400 font-semibold">{asset.yield}%</span>
                        </div>
                        
                        <div className="flex justify-between">
                           <span className="text-slate-400">Risk Level:</span>
                           <Badge 
                             variant="outline" 
                             className={`border-${getRiskColor(asset.riskLevel)}-500 text-${getRiskColor(asset.riskLevel)}-400`}
                           >
                             {asset.riskLevel}
                           </Badge>
                         </div>
                        
                        <div className="flex justify-between">
                          <span className="text-slate-400">Available Shares:</span>
                          <span className="text-white">{asset.availableShares.toLocaleString()}</span>
                        </div>
                        
                        <div className="pt-3 border-t border-slate-700">
                          <Button 
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                            onClick={() => {
                              setShowComparison(false);
                              window.location.href = `/assets/${asset.id}`;
                            }}
                          >
                            View Details
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </ErrorBoundary>
  )
}