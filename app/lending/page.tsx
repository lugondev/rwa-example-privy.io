'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import SEOHead from '@/components/seo/SEOHead'
import { 
  Banknote,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Clock,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Search,
  Filter,
  SortAsc,
  SortDesc,
  Eye,
  Loader2,
  AlertCircle,
  RefreshCw,
  Info,
  Percent,
  Calendar,
  Target,
  Users,
  BarChart3,
  PieChart,
  CreditCard,
  Wallet,
  HandCoins,
  Receipt
} from 'lucide-react'
import Navigation from '@/components/Navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Slider } from '@/components/ui/slider'
import Link from 'next/link'
import { usePrivy } from '@privy-io/react-auth'
import { CardSkeleton } from '@/components/ui/skeleton'
import { PageHeaderSkeleton } from '@/components/ui/skeleton'
import { ErrorBoundary } from '@/components/ui/error-boundary'
import { ApiErrorFallback } from '@/components/ui/error-boundary'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { useToast } from '@/hooks/useToast'
import { 
  useLendingPools, 
  useLendingPositions, 
  useCreateLendingPosition, 
  useCreateBorrowingPosition,
  useRepayLoan,
  useWithdrawLending
} from '@/hooks/useLoans'

// Types for API responses
interface LendingPool {
  id: string
  name: string
  description: string
  assetType: string
  totalLiquidity: number
  availableLiquidity: number
  utilizationRate: number
  lendingRate: number
  borrowingRate: number
  minimumLend: number
  minimumBorrow: number
  maxLTV: number
  liquidationThreshold: number
  status: 'Active' | 'Paused' | 'Closed'
  createdAt: string
  totalLenders: number
  totalBorrowers: number
  riskLevel: 'Low' | 'Medium' | 'High'
  collateralTypes: string[]
}

interface LendingPosition {
  id: string
  poolId: string
  pool: LendingPool
  type: 'lend' | 'borrow'
  amount: number
  interestRate: number
  startDate: string
  maturityDate?: string
  status: 'Active' | 'Repaid' | 'Liquidated' | 'Defaulted'
  collateralAmount?: number
  collateralAsset?: string
  currentValue: number
  accruedInterest: number
  healthFactor?: number
}

interface CreateLendingData {
  poolId: string
  amount: number
  duration?: number
  collateralAsset?: string
  collateralAmount?: number
}

export default function LendingPage() {
  const { user, authenticated, login } = usePrivy()
  const { showError, showSuccess, showLoading, messages } = useToast()
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
  // React Query hooks - only use when mounted
  const poolsQuery = mounted ? useLendingPools() : { data: null, isLoading: false, error: null, refetch: () => {} }
  const positionsQuery = mounted && authenticated && user?.wallet?.address ? useLendingPositions(user.wallet.address) : { data: null, isLoading: false }
  const createLendingMutation = mounted ? useCreateLendingPosition() : { mutateAsync: async () => {}, isPending: false }
  const createBorrowingMutation = mounted ? useCreateBorrowingPosition() : { mutateAsync: async () => {}, isPending: false }
  const repayLoanMutation = mounted ? useRepayLoan() : { mutateAsync: async () => {}, isPending: false }
  const withdrawLendingMutation = mounted ? useWithdrawLending() : { mutateAsync: async () => {}, isPending: false }
  
  const { 
    data: poolsData, 
    isLoading: poolsLoading, 
    error: poolsError, 
    refetch: refetchPools 
  } = poolsQuery
  
  const { 
    data: positionsData, 
    isLoading: positionsLoading 
  } = positionsQuery
  
  const pools = poolsData?.pools || []
  const myPositions = positionsData?.positions || []
  const loading = poolsLoading || positionsLoading
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterType, setFilterType] = useState('all')
  const [sortBy, setSortBy] = useState('lendingRate')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [showLendDialog, setShowLendDialog] = useState(false)
  const [showBorrowDialog, setShowBorrowDialog] = useState(false)
  const [selectedPool, setSelectedPool] = useState<LendingPool | null>(null)
  const processing = createLendingMutation.isPending || createBorrowingMutation.isPending || repayLoanMutation.isPending || withdrawLendingMutation.isPending
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState('pools')

  // Lending/Borrowing form state
  const [lendingData, setLendingData] = useState<CreateLendingData>({
    poolId: '',
    amount: 0,
    duration: 30
  })

  const [borrowingData, setBorrowingData] = useState<CreateLendingData>({
    poolId: '',
    amount: 0,
    duration: 30,
    collateralAsset: '',
    collateralAmount: 0
  })

  // Refresh data
  const handleRefresh = async () => {
    setRefreshing(true)
    await refetchPools()
    setRefreshing(false)
  }

  // Handle lending
  const handleLend = async () => {
    if (!authenticated || !user?.wallet?.address) {
      login()
      return
    }

    try {
      await createLendingMutation.mutateAsync({
        ...lendingData,
        userAddress: user.wallet.address
      })
      
      setShowLendDialog(false)
      setLendingData({ poolId: '', amount: 0, duration: 30 })
      showSuccess(messages.lending.lendSuccess)

    } catch (err) {
      console.error('Error creating lending position:', err)
      const errorMessage = 'Failed to create lending position'
      showError(errorMessage)
    }
  }

  // Handle borrowing
  const handleBorrow = async () => {
    if (!authenticated || !user?.wallet?.address) {
      login()
      return
    }

    try {
      await createBorrowingMutation.mutateAsync({
        ...borrowingData,
        userAddress: user.wallet.address
      })
      
      setShowBorrowDialog(false)
      setBorrowingData({ poolId: '', amount: 0, duration: 30, collateralAsset: '', collateralAmount: 0 })
      showSuccess(messages.lending.borrowSuccess)

    } catch (err) {
      console.error('Error creating borrowing position:', err)
      const errorMessage = 'Failed to create borrowing position'
      showError(errorMessage)
    }
  }



  // Filter and sort pools
  const filteredPools = pools
    .filter(pool => {
      const matchesSearch = pool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           pool.assetType.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = filterStatus === 'all' || pool.status === filterStatus
      const matchesType = filterType === 'all' || pool.assetType === filterType
      return matchesSearch && matchesStatus && matchesType
    })
    .sort((a, b) => {
      let aValue: any = a[sortBy as keyof LendingPool]
      let bValue: any = b[sortBy as keyof LendingPool]
      
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase()
        bValue = bValue.toLowerCase()
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

  // Format currency
  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString()}`
  }

  // Format percentage
  const formatPercentage = (percentage: number) => {
    return `${percentage.toFixed(2)}%`
  }

  // Get risk level color
  const getRiskLevelColor = (risk: string) => {
    switch (risk) {
      case 'Low': return 'bg-green-900/20 text-green-400 border-green-800'
      case 'Medium': return 'bg-yellow-900/20 text-yellow-400 border-yellow-800'
      case 'High': return 'bg-red-900/20 text-red-400 border-red-800'
      default: return 'bg-slate-900/20 text-slate-400 border-slate-800'
    }
  }

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-900/20 text-green-400 border-green-800'
      case 'Paused': return 'bg-yellow-900/20 text-yellow-400 border-yellow-800'
      case 'Closed': return 'bg-slate-900/20 text-slate-400 border-slate-800'
      default: return 'bg-slate-900/20 text-slate-400 border-slate-800'
    }
  }

  // Get health factor color
  const getHealthFactorColor = (healthFactor: number) => {
    if (healthFactor >= 2) return 'text-green-400'
    if (healthFactor >= 1.5) return 'text-yellow-400'
    if (healthFactor >= 1.2) return 'text-orange-400'
    return 'text-red-400'
  }

  return (
    <ErrorBoundary fallback={({ error, resetError }) => (
      <ApiErrorFallback 
        error={error} 
        onRetry={() => {
          resetError()
          refetchPools()
        }} 
      />
    )}>
      <SEOHead
        title="Lending & Borrowing - RWA Platform"
        description="Earn yield by lending or access liquidity by borrowing against your real-world assets. Explore lending pools with competitive rates."
        keywords="lending, borrowing, DeFi, real world assets, yield farming, liquidity, APY"
      />
      <div className="min-h-screen bg-slate-950">
        <Navigation />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {loading ? (
            <div className="space-y-6">
              <PageHeaderSkeleton />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <CardSkeleton key={i} />
                ))}
              </div>
            </div>
          ) : poolsError ? (
             <ApiErrorFallback 
               error={poolsError instanceof Error ? poolsError : new Error('An error occurred')} 
               onRetry={() => refetchPools()} 
             />
           ) : (
             <>
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Lending & Borrowing
            </h1>
            <p className="text-slate-400">
              Earn yield by lending or access liquidity by borrowing against your assets
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
              className="border-slate-700 text-slate-300"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-slate-900/50 mb-6">
            <TabsTrigger value="pools">Lending Pools</TabsTrigger>
            <TabsTrigger value="my-lending">My Lending</TabsTrigger>
            <TabsTrigger value="my-borrowing">My Borrowing</TabsTrigger>
          </TabsList>
          
          <TabsContent value="pools">
            {/* Filters and Search */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                  <Input
                    placeholder="Search pools..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-slate-800 border-slate-700 text-white"
                  />
                </div>
              </div>
              
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40 bg-slate-800 border-slate-700 text-white">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Paused">Paused</SelectItem>
                  <SelectItem value="Closed">Closed</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-40 bg-slate-800 border-slate-700 text-white">
                  <SelectValue placeholder="Asset Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Assets</SelectItem>
                  <SelectItem value="Real Estate">Real Estate</SelectItem>
                  <SelectItem value="Commodities">Commodities</SelectItem>
                  <SelectItem value="Art">Art</SelectItem>
                  <SelectItem value="Collectibles">Collectibles</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40 bg-slate-800 border-slate-700 text-white">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lendingRate">Lending Rate</SelectItem>
                  <SelectItem value="borrowingRate">Borrowing Rate</SelectItem>
                  <SelectItem value="totalLiquidity">Total Liquidity</SelectItem>
                  <SelectItem value="utilizationRate">Utilization</SelectItem>
                </SelectContent>
              </Select>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="border-slate-700 text-slate-300"
              >
                {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
              </Button>
            </div>

            {/* Pools Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredPools.map((pool, index) => {
                const utilizationPercentage = pool.utilizationRate * 100
                
                return (
                  <motion.div
                    key={pool.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="bg-slate-900/50 border-slate-800 hover:bg-slate-800/50 transition-colors h-full">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-green-500/20 to-blue-600/20 rounded-lg flex items-center justify-center">
                              <Banknote className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <CardTitle className="text-white text-lg">{pool.name}</CardTitle>
                              <p className="text-sm text-slate-400">{pool.assetType}</p>
                            </div>
                          </div>
                          
                          <div className="flex flex-col gap-2">
                            <Badge className={getStatusColor(pool.status)}>
                              {pool.status}
                            </Badge>
                            <Badge className={getRiskLevelColor(pool.riskLevel)}>
                              {pool.riskLevel}
                            </Badge>
                          </div>
                        </div>
                        
                        <CardDescription className="text-slate-400 line-clamp-2">
                          {pool.description}
                        </CardDescription>
                      </CardHeader>
                      
                      <CardContent>
                        <div className="space-y-4">
                          {/* Key Metrics */}
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-slate-400">Lending APY</p>
                              <p className="text-lg font-semibold text-green-400">
                                {formatPercentage(pool.lendingRate)}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-slate-400">Borrowing APY</p>
                              <p className="text-lg font-semibold text-blue-400">
                                {formatPercentage(pool.borrowingRate)}
                              </p>
                            </div>
                          </div>
                          
                          {/* Liquidity Info */}
                          <div className="space-y-3">
                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span className="text-slate-400">Utilization Rate</span>
                                <span className="text-white">
                                  {formatPercentage(utilizationPercentage)}
                                </span>
                              </div>
                              <Progress value={utilizationPercentage} className="h-2" />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="text-slate-400">Total Liquidity</p>
                                <p className="text-white font-medium">
                                  {formatCurrency(pool.totalLiquidity)}
                                </p>
                              </div>
                              <div>
                                <p className="text-slate-400">Available</p>
                                <p className="text-white font-medium">
                                  {formatCurrency(pool.availableLiquidity)}
                                </p>
                              </div>
                            </div>
                          </div>
                          
                          {/* Additional Info */}
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-slate-400">Min. Lend</p>
                              <p className="text-white font-medium">
                                {formatCurrency(pool.minimumLend)}
                              </p>
                            </div>
                            <div>
                              <p className="text-slate-400">Min. Borrow</p>
                              <p className="text-white font-medium">
                                {formatCurrency(pool.minimumBorrow)}
                              </p>
                            </div>
                            <div>
                              <p className="text-slate-400">Max LTV</p>
                              <p className="text-white font-medium">
                                {formatPercentage(pool.maxLTV)}
                              </p>
                            </div>
                            <div>
                              <p className="text-slate-400">Liquidation</p>
                              <p className="text-white font-medium">
                                {formatPercentage(pool.liquidationThreshold)}
                              </p>
                            </div>
                          </div>
                          
                          {/* Participants */}
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4 text-slate-400" />
                              <span className="text-slate-400">
                                {pool.totalLenders} lenders, {pool.totalBorrowers} borrowers
                              </span>
                            </div>
                          </div>
                          
                          {/* Action Buttons */}
                          {pool.status === 'Active' && authenticated && (
                            <div className="flex gap-2 pt-2">
                              <Button 
                                onClick={() => {
                                  setSelectedPool(pool)
                                  setLendingData({...lendingData, poolId: pool.id})
                                  setShowLendDialog(true)
                                }}
                                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                              >
                                <HandCoins className="w-4 h-4 mr-2" />
                                Lend
                              </Button>
                              
                              <Button 
                                onClick={() => {
                                  setSelectedPool(pool)
                                  setBorrowingData({...borrowingData, poolId: pool.id})
                                  setShowBorrowDialog(true)
                                }}
                                variant="outline"
                                className="flex-1 border-slate-700 text-slate-300"
                              >
                                <CreditCard className="w-4 h-4 mr-2" />
                                Borrow
                              </Button>
                            </div>
                          )}
                          
                          {!authenticated && (
                            <Button 
                              onClick={login}
                              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                            >
                              Connect Wallet to Participate
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </div>
            
            {filteredPools.length === 0 && (
              <div className="text-center py-12">
                <Banknote className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">No pools found</h3>
                <p className="text-slate-400">
                  {searchTerm || filterStatus !== 'all' || filterType !== 'all'
                    ? 'Try adjusting your search or filters'
                    : 'No lending pools available at the moment'}
                </p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="my-lending">
            {!authenticated ? (
              <div className="text-center py-12">
                <Shield className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">Connect Your Wallet</h3>
                <p className="text-slate-400 mb-4">
                  Connect your wallet to view your lending positions
                </p>
                <Button onClick={login} className="bg-blue-600 hover:bg-blue-700 text-white">
                  Connect Wallet
                </Button>
              </div>
            ) : myPositions.filter(p => p.type === 'lend').length === 0 ? (
              <div className="text-center py-12">
                <HandCoins className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">No Lending Positions</h3>
                <p className="text-slate-400 mb-4">
                  Start lending to earn yield on your assets
                </p>
                <Button 
                  onClick={() => setActiveTab('pools')}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  Explore Pools
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Lending Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="bg-slate-900/50 border-slate-800">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-slate-400 mb-1">Total Lent</p>
                          <p className="text-2xl font-bold text-white">
                            {formatCurrency(myPositions.filter(p => p.type === 'lend').reduce((sum, pos) => sum + pos.amount, 0))}
                          </p>
                        </div>
                        <HandCoins className="w-8 h-8 text-green-400" />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-slate-900/50 border-slate-800">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-slate-400 mb-1">Current Value</p>
                          <p className="text-2xl font-bold text-white">
                            {formatCurrency(myPositions.filter(p => p.type === 'lend').reduce((sum, pos) => sum + pos.currentValue, 0))}
                          </p>
                        </div>
                        <BarChart3 className="w-8 h-8 text-blue-400" />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-slate-900/50 border-slate-800">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-slate-400 mb-1">Interest Earned</p>
                          <p className="text-2xl font-bold text-green-400">
                            {formatCurrency(myPositions.filter(p => p.type === 'lend').reduce((sum, pos) => sum + pos.accruedInterest, 0))}
                          </p>
                        </div>
                        <TrendingUp className="w-8 h-8 text-green-400" />
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                {/* Lending Positions List */}
                <div className="space-y-4">
                  {myPositions.filter(p => p.type === 'lend').map((position, index) => (
                    <motion.div
                      key={position.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card className="bg-slate-900/50 border-slate-800">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-gradient-to-br from-green-500/20 to-blue-600/20 rounded-lg flex items-center justify-center">
                                <HandCoins className="w-6 h-6 text-white" />
                              </div>
                              
                              <div>
                                <h4 className="font-semibold text-white">
                                  {position.pool.name}
                                </h4>
                                <p className="text-sm text-slate-400">
                                  {position.pool.assetType} • {formatPercentage(position.interestRate)} APY
                                </p>
                              </div>
                            </div>
                            
                            <div className="text-right">
                              <p className="font-semibold text-white">
                                {formatCurrency(position.currentValue)}
                              </p>
                              <Badge className={getStatusColor(position.status)}>
                                {position.status}
                              </Badge>
                            </div>
                          </div>
                          
                          <div className="mt-4 grid grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-slate-400">Amount Lent</p>
                              <p className="text-white font-medium">
                                {formatCurrency(position.amount)}
                              </p>
                            </div>
                            <div>
                              <p className="text-slate-400">Interest Earned</p>
                              <p className="text-green-400 font-medium">
                                {formatCurrency(position.accruedInterest)}
                              </p>
                            </div>
                            <div>
                              <p className="text-slate-400">Start Date</p>
                              <p className="text-white font-medium">
                                {new Date(position.startDate).toLocaleDateString()}
                              </p>
                            </div>
                            <div>
                              <p className="text-slate-400">Maturity</p>
                              <p className="text-white font-medium">
                                {position.maturityDate ? new Date(position.maturityDate).toLocaleDateString() : 'Flexible'}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="my-borrowing">
            {!authenticated ? (
              <div className="text-center py-12">
                <Shield className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">Connect Your Wallet</h3>
                <p className="text-slate-400 mb-4">
                  Connect your wallet to view your borrowing positions
                </p>
                <Button onClick={login} className="bg-blue-600 hover:bg-blue-700 text-white">
                  Connect Wallet
                </Button>
              </div>
            ) : myPositions.filter(p => p.type === 'borrow').length === 0 ? (
              <div className="text-center py-12">
                <CreditCard className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">No Borrowing Positions</h3>
                <p className="text-slate-400 mb-4">
                  Borrow against your assets to access liquidity
                </p>
                <Button 
                  onClick={() => setActiveTab('pools')}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Explore Pools
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Borrowing Summary */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <Card className="bg-slate-900/50 border-slate-800">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-slate-400 mb-1">Total Borrowed</p>
                          <p className="text-2xl font-bold text-white">
                            {formatCurrency(myPositions.filter(p => p.type === 'borrow').reduce((sum, pos) => sum + pos.amount, 0))}
                          </p>
                        </div>
                        <CreditCard className="w-8 h-8 text-blue-400" />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-slate-900/50 border-slate-800">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-slate-400 mb-1">Total Collateral</p>
                          <p className="text-2xl font-bold text-white">
                            {formatCurrency(myPositions.filter(p => p.type === 'borrow').reduce((sum, pos) => sum + (pos.collateralAmount || 0), 0))}
                          </p>
                        </div>
                        <Shield className="w-8 h-8 text-yellow-400" />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-slate-900/50 border-slate-800">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-slate-400 mb-1">Interest Owed</p>
                          <p className="text-2xl font-bold text-red-400">
                            {formatCurrency(myPositions.filter(p => p.type === 'borrow').reduce((sum, pos) => sum + pos.accruedInterest, 0))}
                          </p>
                        </div>
                        <TrendingDown className="w-8 h-8 text-red-400" />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-slate-900/50 border-slate-800">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-slate-400 mb-1">Avg Health Factor</p>
                          <p className={`text-2xl font-bold ${
                            getHealthFactorColor(
                              myPositions.filter(p => p.type === 'borrow' && p.healthFactor)
                                .reduce((sum, pos, _, arr) => sum + (pos.healthFactor || 0), 0) /
                              Math.max(myPositions.filter(p => p.type === 'borrow' && p.healthFactor).length, 1)
                            )
                          }`}>
                            {(
                              myPositions.filter(p => p.type === 'borrow' && p.healthFactor)
                                .reduce((sum, pos, _, arr) => sum + (pos.healthFactor || 0), 0) /
                              Math.max(myPositions.filter(p => p.type === 'borrow' && p.healthFactor).length, 1)
                            ).toFixed(2)}
                          </p>
                        </div>
                        <AlertTriangle className="w-8 h-8 text-yellow-400" />
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                {/* Borrowing Positions List */}
                <div className="space-y-4">
                  {myPositions.filter(p => p.type === 'borrow').map((position, index) => (
                    <motion.div
                      key={position.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card className="bg-slate-900/50 border-slate-800">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-lg flex items-center justify-center">
                                <CreditCard className="w-6 h-6 text-white" />
                              </div>
                              
                              <div>
                                <h4 className="font-semibold text-white">
                                  {position.pool.name}
                                </h4>
                                <p className="text-sm text-slate-400">
                                  {position.pool.assetType} • {formatPercentage(position.interestRate)} APY
                                </p>
                              </div>
                            </div>
                            
                            <div className="text-right">
                              <p className="font-semibold text-white">
                                {formatCurrency(position.currentValue)}
                              </p>
                              <div className="flex items-center gap-2">
                                <Badge className={getStatusColor(position.status)}>
                                  {position.status}
                                </Badge>
                                {position.healthFactor && (
                                  <Badge className={`${getHealthFactorColor(position.healthFactor)} bg-transparent border`}>
                                    HF: {position.healthFactor.toFixed(2)}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="mt-4 grid grid-cols-5 gap-4 text-sm">
                            <div>
                              <p className="text-slate-400">Borrowed</p>
                              <p className="text-white font-medium">
                                {formatCurrency(position.amount)}
                              </p>
                            </div>
                            <div>
                              <p className="text-slate-400">Collateral</p>
                              <p className="text-white font-medium">
                                {formatCurrency(position.collateralAmount || 0)}
                              </p>
                            </div>
                            <div>
                              <p className="text-slate-400">Interest Owed</p>
                              <p className="text-red-400 font-medium">
                                {formatCurrency(position.accruedInterest)}
                              </p>
                            </div>
                            <div>
                              <p className="text-slate-400">Start Date</p>
                              <p className="text-white font-medium">
                                {new Date(position.startDate).toLocaleDateString()}
                              </p>
                            </div>
                            <div>
                              <p className="text-slate-400">Maturity</p>
                              <p className="text-white font-medium">
                                {position.maturityDate ? new Date(position.maturityDate).toLocaleDateString() : 'Flexible'}
                              </p>
                            </div>
                          </div>
                          
                          {position.healthFactor && position.healthFactor < 1.5 && (
                            <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-800 rounded-lg">
                              <div className="flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-yellow-400" />
                                <span className="text-yellow-400 text-sm font-medium">
                                  Low Health Factor - Consider adding collateral or repaying debt
                                </span>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

      {/* Lending Dialog */}
      <Dialog open={showLendDialog} onOpenChange={setShowLendDialog}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Lend to {selectedPool?.name}</DialogTitle>
            <DialogDescription className="text-slate-400">
              Earn {selectedPool?.lendingRate.toFixed(2)}% APY by lending to this pool
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="lend-amount">Amount to Lend ($)</Label>
              <Input
                id="lend-amount"
                type="number"
                value={lendingData.amount}
                onChange={(e) => setLendingData({...lendingData, amount: Number(e.target.value)})}
                className="bg-slate-800 border-slate-700 text-white"
                placeholder={`Min: ${formatCurrency(selectedPool?.minimumLend || 0)}`}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="lend-duration">Duration (days)</Label>
              <div className="space-y-2">
                <Slider
                  value={[lendingData.duration || 30]}
                  onValueChange={(value) => setLendingData({...lendingData, duration: value[0]})}
                  max={365}
                  min={1}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-slate-400">
                  <span>1 day</span>
                  <span>{lendingData.duration} days</span>
                  <span>365 days</span>
                </div>
              </div>
            </div>
            
            {selectedPool && (
              <div className="p-3 bg-slate-800/50 rounded-lg space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Expected Interest:</span>
                  <span className="text-green-400 font-medium">
                    {formatCurrency((lendingData.amount * selectedPool.lendingRate * (lendingData.duration || 30)) / 365)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Return:</span>
                  <span className="text-white font-medium">
                    {formatCurrency(lendingData.amount + (lendingData.amount * selectedPool.lendingRate * (lendingData.duration || 30)) / 365)}
                  </span>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex justify-end gap-3">
            <Button 
              variant="outline" 
              onClick={() => setShowLendDialog(false)}
              className="border-slate-700 text-slate-300"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleLend}
              disabled={processing || !lendingData.amount || (selectedPool ? lendingData.amount < selectedPool.minimumLend : false)}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {processing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                'Confirm Lending'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Borrowing Dialog */}
      <Dialog open={showBorrowDialog} onOpenChange={setShowBorrowDialog}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Borrow from {selectedPool?.name}</DialogTitle>
            <DialogDescription className="text-slate-400">
              Borrow at {selectedPool?.borrowingRate.toFixed(2)}% APY with collateral
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="borrow-amount">Amount to Borrow ($)</Label>
              <Input
                id="borrow-amount"
                type="number"
                value={borrowingData.amount}
                onChange={(e) => setBorrowingData({...borrowingData, amount: Number(e.target.value)})}
                className="bg-slate-800 border-slate-700 text-white"
                placeholder={`Min: ${formatCurrency(selectedPool?.minimumBorrow || 0)}`}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="collateral-amount">Collateral Amount ($)</Label>
              <Input
                id="collateral-amount"
                type="number"
                value={borrowingData.collateralAmount}
                onChange={(e) => setBorrowingData({...borrowingData, collateralAmount: Number(e.target.value)})}
                className="bg-slate-800 border-slate-700 text-white"
                placeholder="Required collateral"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="collateral-asset">Collateral Asset</Label>
              <Select 
                value={borrowingData.collateralAsset} 
                onValueChange={(value) => setBorrowingData({...borrowingData, collateralAsset: value})}
              >
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue placeholder="Select collateral type" />
                </SelectTrigger>
                <SelectContent>
                  {selectedPool?.collateralTypes.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="borrow-duration">Duration (days)</Label>
              <div className="space-y-2">
                <Slider
                  value={[borrowingData.duration || 30]}
                  onValueChange={(value) => setBorrowingData({...borrowingData, duration: value[0]})}
                  max={365}
                  min={1}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-slate-400">
                  <span>1 day</span>
                  <span>{borrowingData.duration} days</span>
                  <span>365 days</span>
                </div>
              </div>
            </div>
            
            {selectedPool && borrowingData.amount && borrowingData.collateralAmount && (
              <div className="p-3 bg-slate-800/50 rounded-lg space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">LTV Ratio:</span>
                  <span className={`font-medium ${
                    (borrowingData.amount / borrowingData.collateralAmount) <= selectedPool.maxLTV 
                      ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {formatPercentage((borrowingData.amount / borrowingData.collateralAmount) * 100)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Interest Cost:</span>
                  <span className="text-red-400 font-medium">
                    {formatCurrency((borrowingData.amount * selectedPool.borrowingRate * (borrowingData.duration || 30)) / 365)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Repayment:</span>
                  <span className="text-white font-medium">
                    {formatCurrency(borrowingData.amount + (borrowingData.amount * selectedPool.borrowingRate * (borrowingData.duration || 30)) / 365)}
                  </span>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex justify-end gap-3">
            <Button 
              variant="outline" 
              onClick={() => setShowBorrowDialog(false)}
              className="border-slate-700 text-slate-300"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleBorrow}
              disabled={
                processing || 
                !borrowingData.amount || 
                !borrowingData.collateralAmount || 
                !borrowingData.collateralAsset ||
                (selectedPool ? borrowingData.amount < selectedPool.minimumBorrow : false) ||
                (selectedPool && borrowingData.collateralAmount ? (borrowingData.amount / borrowingData.collateralAmount) > selectedPool.maxLTV : false)
              }
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {processing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                'Confirm Borrowing'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
              </>
            )}
          </div>
        </div>
    </ErrorBoundary>
  )
}