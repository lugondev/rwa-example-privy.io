'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { DynamicAnimatedComponent, DynamicChart, Dynamic3DViewer } from '@/components/ui/dynamic-loader'
import SEOHead from '@/components/seo/SEOHead'
import { 
  ArrowLeft,
  Share2,
  Heart,
  TrendingUp,
  TrendingDown,
  Building2,
  MapPin,
  Calendar,
  Users,
  DollarSign,
  Percent,
  Shield,
  AlertTriangle,
  Info,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Target,
  BarChart3,
  Download,
  ShoppingCart,
  FileText
} from 'lucide-react'
import Navigation from '@/components/Navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import Link from 'next/link'
import Image from 'next/image'
import { usePrivy } from '@privy-io/react-auth'
import { Asset3DViewer } from '@/components/assets/Asset3DViewer'
import { PriceChart } from '@/components/assets/PriceChart'
import { OwnershipTracker } from '@/components/assets/OwnershipTracker'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// Types for API responses
interface Asset {
  id: string
  name: string
  description: string
  type: string
  currentPrice: number
  priceChange24h: number
  totalSupply: number
  availableShares: number
  marketCap: number
  image?: string
  location?: string
  yield?: number
  riskLevel: 'Low' | 'Medium' | 'High'
  verified: boolean
  createdAt: string
  updatedAt: string
  metadata?: {
    propertyType?: string
    yearBuilt?: number
    squareFootage?: number
    bedrooms?: number
    bathrooms?: number
    amenities?: string[]
    documents?: string[]
  }
}

interface FractionalOwnership {
  id: string
  assetId: string
  userAddress: string
  shares: number
  purchasePrice: number
  purchaseDate: string
  currentValue: number
}

interface PriceHistory {
  timestamp: string
  price: number
  volume?: number
  date: string
}

interface OwnershipData {
  totalShares: number
  availableShares: number
  userShares: number
  sharePrice: number
  totalOwners: number
  ownershipPercentage: number
  dividendYield: number
  lastDividendDate?: string
  nextDividendDate?: string
  totalDividendsEarned: number
}

interface TopOwner {
  id: string
  name: string
  avatar?: string
  shares: number
  percentage: number
  joinDate: string
}

function AssetDetailPage() {
  const params = useParams()
  const { user, authenticated } = usePrivy()
  const [asset, setAsset] = useState<Asset | null>(null)
  const [ownership, setOwnership] = useState<FractionalOwnership | null>(null)
  const [priceHistory, setPriceHistory] = useState<PriceHistory[]>([])
  const [ownershipData, setOwnershipData] = useState<OwnershipData | null>(null)
  const [topOwners, setTopOwners] = useState<TopOwner[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [purchaseAmount, setPurchaseAmount] = useState('')
  const [purchasing, setPurchasing] = useState(false)
  const [liked, setLiked] = useState(false)

  // Fetch asset details
  const fetchAssetDetails = useCallback(async () => {
    if (!params.id) return
    
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/assets/${params.id}`)
      if (!response.ok) {
        throw new Error('Asset not found')
      }
      
      const data = await response.json()
      setAsset(data)
      
      // Fetch user's ownership if authenticated
      if (authenticated && user?.wallet?.address) {
        try {
          const ownershipResponse = await fetch(
            `/api/fractional/ownership/${params.id}/${user.wallet.address}`
          )
          if (ownershipResponse.ok) {
            const ownershipData = await ownershipResponse.json()
            setOwnership(ownershipData)
          }
        } catch (err) {
          console.log('No ownership found')
        }
      }
      
      // Fetch price history
      try {
        const historyResponse = await fetch(`/api/assets/${params.id}/history`)
        if (historyResponse.ok) {
          const historyData = await historyResponse.json()
          setPriceHistory(historyData)
        }
      } catch (err) {
        console.log('No price history available')
        // Mock price history data
        const mockPriceHistory: PriceHistory[] = [
          { timestamp: '2024-01-01T00:00:00Z', price: 95000, volume: 1200, date: 'Jan 1' },
          { timestamp: '2024-01-02T00:00:00Z', price: 96500, volume: 1350, date: 'Jan 2' },
          { timestamp: '2024-01-03T00:00:00Z', price: 98000, volume: 1100, date: 'Jan 3' },
          { timestamp: '2024-01-04T00:00:00Z', price: 97500, volume: 1400, date: 'Jan 4' },
          { timestamp: '2024-01-05T00:00:00Z', price: 100000, volume: 1600, date: 'Jan 5' },
          { timestamp: '2024-01-06T00:00:00Z', price: 102000, volume: 1800, date: 'Jan 6' },
          { timestamp: '2024-01-07T00:00:00Z', price: 101500, volume: 1700, date: 'Jan 7' }
        ]
        setPriceHistory(mockPriceHistory)
      }
      
      // Fetch ownership data
      try {
        const ownershipResponse = await fetch(`/api/assets/${params.id}/ownership`)
        if (ownershipResponse.ok) {
          const ownershipInfo = await ownershipResponse.json()
          setOwnershipData(ownershipInfo)
        }
      } catch (err) {
        console.log('No ownership data available')
        // Mock ownership data
        const mockOwnershipData: OwnershipData = {
          totalShares: 10000,
          availableShares: 2500,
          userShares: ownership?.shares || 0,
          sharePrice: asset.currentPrice / 10000, // Assuming price per share
          totalOwners: 156,
          ownershipPercentage: ownership ? (ownership.shares / 10000) * 100 : 0,
          dividendYield: 8.5,
          lastDividendDate: '2024-01-01T00:00:00Z',
          nextDividendDate: '2024-04-01T00:00:00Z',
          totalDividendsEarned: 2450.75
        }
        setOwnershipData(mockOwnershipData)
      }
      
      // Fetch top owners
      try {
        const ownersResponse = await fetch(`/api/assets/${params.id}/owners`)
        if (ownersResponse.ok) {
          const ownersData = await ownersResponse.json()
          setTopOwners(ownersData.slice(0, 5)) // Top 5 owners
        }
      } catch (err) {
        console.log('No owners data available')
        // Mock top owners data
        const mockTopOwners: TopOwner[] = [
          { id: '1', name: 'Investment Fund Alpha', shares: 1500, percentage: 15.0, joinDate: '2023-06-15T00:00:00Z' },
          { id: '2', name: 'Real Estate Trust', shares: 1200, percentage: 12.0, joinDate: '2023-07-20T00:00:00Z' },
          { id: '3', name: 'Private Investor', shares: 800, percentage: 8.0, joinDate: '2023-08-10T00:00:00Z' },
          { id: '4', name: 'Pension Fund Beta', shares: 600, percentage: 6.0, joinDate: '2023-09-05T00:00:00Z' },
          { id: '5', name: 'Wealth Management Co', shares: 450, percentage: 4.5, joinDate: '2023-10-12T00:00:00Z' }
        ]
        setTopOwners(mockTopOwners)
      }
      
    } catch (err) {
      console.error('Error fetching asset:', err)
      setError('Failed to load asset details')
    } finally {
      setLoading(false)
    }
  }, [params.id, authenticated, user?.wallet?.address])

  useEffect(() => {
    fetchAssetDetails()
  }, [fetchAssetDetails])

  // Handle purchase
  const handlePurchase = useCallback(async () => {
    if (!authenticated || !user?.wallet?.address || !asset) {
      alert('Please connect your wallet first')
      return
    }
    
    const shares = parseInt(purchaseAmount)
    if (!shares || shares <= 0 || shares > asset.availableShares) {
      alert('Invalid number of shares')
      return
    }
    
    setPurchasing(true)
    
    try {
      const response = await fetch('/api/fractional/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assetId: asset.id,
          userAddress: user.wallet.address,
          shares,
          pricePerShare: asset.currentPrice
        })
      })
      
      if (!response.ok) {
        throw new Error('Purchase failed')
      }
      
      // Refresh asset and ownership data
      await fetchAssetDetails()
      setPurchaseAmount('')
      alert('Purchase successful!')
      
    } catch (err) {
      console.error('Purchase error:', err)
      alert('Purchase failed. Please try again.')
    } finally {
      setPurchasing(false)
    }
  }, [authenticated, user?.wallet?.address, asset, purchaseAmount, fetchAssetDetails])

  // Get risk level color
  const getRiskLevelColor = useCallback((riskLevel: string) => {
    switch (riskLevel) {
      case 'Low': return 'bg-green-900/20 text-green-400 border-green-800'
      case 'Medium': return 'bg-yellow-900/20 text-yellow-400 border-yellow-800'
      case 'High': return 'bg-red-900/20 text-red-400 border-red-800'
      default: return 'bg-slate-900/20 text-slate-400 border-slate-800'
    }
  }, [])

  // Calculate derived values
  const totalValue = useMemo(() => {
    return asset ? asset.currentPrice * asset.totalSupply : 0
  }, [asset])
  
  const ownershipPercentage = useMemo(() => {
    return ownership && asset ? (ownership.shares / asset.totalSupply) * 100 : 0
  }, [ownership, asset])
  
  const availabilityPercentage = useMemo(() => {
    return asset ? (asset.availableShares / asset.totalSupply) * 100 : 0
  }, [asset])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950">
        <Navigation />
        <div className="flex items-center justify-center py-20">
          <div className="flex items-center gap-3 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span>Loading asset details...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error || !asset) {
    return (
      <div className="min-h-screen bg-slate-950">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-20">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">
              {error || 'Asset not found'}
            </h2>
            <Link href="/assets">
              <Button variant="outline" className="border-slate-700 text-slate-300">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Assets
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <SEOHead 
        title={asset ? `${asset.name} - Asset Details` : 'Asset Details'}
        description={asset ? `Invest in ${asset.name} - ${asset.description}. Current price: $${asset.currentPrice.toLocaleString()}. ${asset.type} asset with ${asset.totalSupply.toLocaleString()} total shares available.` : 'View detailed information about this tokenized real-world asset including price history, ownership details, and investment opportunities.'}
        keywords={asset ? `${asset.name}, ${asset.type}, tokenized asset, fractional ownership, investment, ${asset.location}` : 'asset details, tokenized assets, fractional ownership, investment'}
        image={asset?.image}
        type="article"
      />
      <div className="min-h-screen bg-slate-950">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/assets">
            <Button variant="outline" size="sm" className="border-slate-700 text-slate-300">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-white">{asset.name}</h1>
              {asset.verified && (
                <Badge className="bg-blue-900/20 text-blue-400 border-blue-800">
                  <Shield className="w-3 h-3 mr-1" />
                  Verified
                </Badge>
              )}
            </div>
            <p className="text-slate-400 mt-1">{asset.type}</p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLiked(!liked)}
              className={`border-slate-700 ${liked ? 'text-red-400' : 'text-slate-300'}`}
            >
              <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} />
            </Button>
            <Button variant="outline" size="sm" className="border-slate-700 text-slate-300">
              <Share2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Asset Image and 3D Viewer */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-slate-900/50 border-slate-800">
                <CardContent className="p-0">
                  <div className="aspect-video bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-lg flex items-center justify-center">
                    {asset.image ? (
                      <Image 
                        src={asset.image} 
                        alt={asset.name}
                        width={800}
                        height={450}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <div className="text-6xl font-bold text-white">
                        {asset.name.charAt(0)}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              
              <Asset3DViewer
                modelUrl={asset.metadata?.modelUrl}
                assetType={asset.type}
                className="h-full"
              />
            </div>

            {/* Price Chart */}
            {priceHistory.length > 0 && (
              <PriceChart
                data={priceHistory}
                currentPrice={asset.currentPrice}
                priceChange24h={asset.priceChange24h || 0}
                priceChangePercent24h={asset.priceChangePercent24h || 0}
              />
            )}
            
            {/* Asset Details Tabs */}
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-5 bg-slate-900/50">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="performance">Performance</TabsTrigger>
                <TabsTrigger value="ownership">Ownership</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="space-y-4">
                <Card className="bg-slate-900/50 border-slate-800">
                  <CardHeader>
                    <CardTitle className="text-white">Description</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-300 leading-relaxed">
                      {asset.description}
                    </p>
                  </CardContent>
                </Card>
                
                {asset.location && (
                  <Card className="bg-slate-900/50 border-slate-800">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <MapPin className="w-5 h-5" />
                        Location
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-slate-300">{asset.location}</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
              
              <TabsContent value="details" className="space-y-4">
                <Card className="bg-slate-900/50 border-slate-800">
                  <CardHeader>
                    <CardTitle className="text-white">Asset Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-slate-400">Asset Type</label>
                        <p className="text-white font-medium">{asset.type}</p>
                      </div>
                      <div>
                        <label className="text-sm text-slate-400">Risk Level</label>
                        <Badge className={getRiskLevelColor(asset.riskLevel)}>
                          {asset.riskLevel}
                        </Badge>
                      </div>
                      <div>
                        <label className="text-sm text-slate-400">Created</label>
                        <p className="text-white font-medium">
                          {new Date(asset.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm text-slate-400">Last Updated</label>
                        <p className="text-white font-medium">
                          {new Date(asset.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    {asset.metadata && (
                      <div className="mt-6">
                        <h4 className="text-white font-medium mb-3">Additional Details</h4>
                        <div className="grid grid-cols-2 gap-4">
                          {asset.metadata.propertyType && (
                            <div>
                              <label className="text-sm text-slate-400">Property Type</label>
                              <p className="text-white">{asset.metadata.propertyType}</p>
                            </div>
                          )}
                          {asset.metadata.yearBuilt && (
                            <div>
                              <label className="text-sm text-slate-400">Year Built</label>
                              <p className="text-white">{asset.metadata.yearBuilt}</p>
                            </div>
                          )}
                          {asset.metadata.squareFootage && (
                            <div>
                              <label className="text-sm text-slate-400">Square Footage</label>
                              <p className="text-white">{asset.metadata.squareFootage.toLocaleString()} sq ft</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="performance">
                <Card className="bg-slate-900/50 border-slate-800">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <BarChart3 className="w-5 h-5" />
                      Price Performance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">24h Change</span>
                        <div className="flex items-center gap-1">
                          {asset.priceChange24h > 0 ? (
                            <ArrowUpRight className="h-4 w-4 text-green-500" />
                          ) : (
                            <ArrowDownRight className="h-4 w-4 text-red-500" />
                          )}
                          <span className={`font-medium ${
                            asset.priceChange24h > 0 ? 'text-green-500' : 'text-red-500'
                          }`}>
                            {asset.priceChange24h > 0 ? '+' : ''}
                            {asset.priceChange24h.toFixed(2)}%
                          </span>
                        </div>
                      </div>
                      
                      {asset.yield && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Annual Yield</span>
                          <span className="text-green-400 font-medium">
                            {asset.yield.toFixed(2)}%
                          </span>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Market Cap</span>
                        <span className="text-white font-medium">
                          ${asset.marketCap.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="ownership" className="space-y-4">
                {ownershipData && topOwners.length > 0 && (
                  <OwnershipTracker
                    data={ownershipData}
                    topOwners={topOwners}
                    onViewAllOwners={() => {
                      // Navigate to owners page or open modal
                      toast.info('View all owners feature coming soon!')
                    }}
                  />
                )}
              </TabsContent>
              
              <TabsContent value="documents">
                <Card className="bg-slate-900/50 border-slate-800">
                  <CardHeader>
                    <CardTitle className="text-white">Legal Documents</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                        <span className="text-slate-300">Asset Prospectus</span>
                        <Button variant="outline" size="sm" className="border-slate-700">
                          Download
                        </Button>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                        <span className="text-slate-300">Legal Opinion</span>
                        <Button variant="outline" size="sm" className="border-slate-700">
                          Download
                        </Button>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                        <span className="text-slate-300">Audit Report</span>
                        <Button variant="outline" size="sm" className="border-slate-700">
                          Download
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Price Info */}
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Current Price
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-3xl font-bold text-white">
                    ${asset.currentPrice.toLocaleString()}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {asset.priceChange24h > 0 ? (
                      <ArrowUpRight className="h-4 w-4 text-green-500" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4 text-red-500" />
                    )}
                    <span className={`font-medium ${
                      asset.priceChange24h > 0 ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {asset.priceChange24h > 0 ? '+' : ''}
                      {asset.priceChange24h.toFixed(2)}% (24h)
                    </span>
                  </div>
                  
                  <Separator className="bg-slate-800" />
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Total Supply</span>
                      <span className="text-white">{asset.totalSupply.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Available</span>
                      <span className="text-white">{asset.availableShares.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Market Cap</span>
                      <span className="text-white">${asset.marketCap.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Ownership Status */}
            {ownership && (
              <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Your Ownership
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-2xl font-bold text-blue-400">
                      {ownership.shares.toLocaleString()} shares
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Ownership %</span>
                        <span className="text-white">{ownershipPercentage.toFixed(2)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Purchase Price</span>
                        <span className="text-white">${ownership.purchasePrice.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Current Value</span>
                        <span className="text-white">${ownership.currentValue.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">P&L</span>
                        <span className={`font-medium ${
                          ownership.currentValue > ownership.purchasePrice ? 'text-green-500' : 'text-red-500'
                        }`}>
                          ${(ownership.currentValue - ownership.purchasePrice).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Purchase Interface */}
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Purchase Shares
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Buy fractional ownership in this asset
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">
                      Number of Shares
                    </label>
                    <Input
                      type="number"
                      placeholder="Enter amount"
                      value={purchaseAmount}
                      onChange={(e) => setPurchaseAmount(e.target.value)}
                      max={asset.availableShares}
                      className="bg-slate-800 border-slate-700 text-white"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      Max: {asset.availableShares.toLocaleString()} shares available
                    </p>
                  </div>
                  
                  {purchaseAmount && (
                    <div className="p-3 bg-slate-800/50 rounded-lg space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Shares</span>
                        <span className="text-white">{parseInt(purchaseAmount || '0').toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Price per share</span>
                        <span className="text-white">${asset.currentPrice.toLocaleString()}</span>
                      </div>
                      <Separator className="bg-slate-700" />
                      <div className="flex justify-between font-medium">
                        <span className="text-slate-300">Total Cost</span>
                        <span className="text-white">
                          ${(parseInt(purchaseAmount || '0') * asset.currentPrice).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  <Button 
                    onClick={handlePurchase}
                    disabled={!authenticated || purchasing || !purchaseAmount || parseInt(purchaseAmount) <= 0}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {purchasing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : !authenticated ? (
                      'Connect Wallet to Purchase'
                    ) : (
                      'Purchase Shares'
                    )}
                  </Button>
                  
                  {!authenticated && (
                    <p className="text-xs text-slate-500 text-center">
                      Connect your wallet to start investing
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Availability Progress */}
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Availability
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Available for purchase</span>
                    <span className="text-white">{availabilityPercentage.toFixed(1)}%</span>
                  </div>
                  <Progress value={availabilityPercentage} className="h-2" />
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>{asset.availableShares.toLocaleString()} available</span>
                    <span>{asset.totalSupply.toLocaleString()} total</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      </div>
    </>
  )
}

AssetDetailPage.displayName = 'AssetDetailPage'

export default React.memo(AssetDetailPage)