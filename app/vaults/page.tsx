'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { DynamicAnimatedComponent, DynamicChart } from '@/components/ui/dynamic-loader'
import SEOHead from '@/components/seo/SEOHead'
import { useFormValidation } from '@/hooks/useFormValidation'
import { useToast } from '@/hooks/useToast'
import { useVaults, useVaultInvestments, useCreateVault } from '@/hooks/useVaults'
import { validateVaultCreation, VaultFormData } from '@/utils/vaultValidation'
import { 
  Vault,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Calendar,
  Target,
  Clock,
  Shield,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Search,
  Filter,
  SortAsc,
  SortDesc,
  Eye,
  Settings,
  Loader2,
  AlertCircle,
  RefreshCw,
  Info,
  CheckCircle,
  XCircle,
  Percent,
  BarChart3,
  PieChart
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
import { CardSkeleton, PageHeaderSkeleton } from '@/components/ui/skeleton'
import { ErrorBoundary, ApiErrorFallback } from '@/components/ui/error-boundary'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import Link from 'next/link'
import { usePrivy } from '@privy-io/react-auth'

// Types for API responses
interface Vault {
  id: string
  name: string
  description: string
  strategy: string
  totalValue: number
  targetAmount: number
  currentInvestors: number
  maxInvestors: number
  minimumInvestment: number
  expectedReturn: number
  riskLevel: 'Low' | 'Medium' | 'High'
  status: 'Active' | 'Closed' | 'Pending'
  createdAt: string
  endDate?: string
  manager: string
  performanceHistory: {
    date: string
    value: number
    return: number
  }[]
  assets: {
    id: string
    name: string
    allocation: number
    currentValue: number
  }[]
}

interface VaultInvestment {
  id: string
  vaultId: string
  vault: Vault
  amount: number
  shares: number
  investmentDate: string
  currentValue: number
  profitLoss: number
  profitLossPercentage: number
}

interface CreateVaultData {
  name: string
  description: string
  strategy: string
  targetAmount: number
  maxInvestors: number
  minimumInvestment: number
  expectedReturn: number
  riskLevel: 'low' | 'medium' | 'high'
  endDate?: string
}

export default function VaultsPage() {
  const { user, authenticated, login } = usePrivy()
  const { showError, showSuccess, showLoading, messages } = useToast()
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
  // React Query hooks - always call hooks, use enabled option for conditional fetching
  const vaultsQuery = useVaults()
  const investmentsQuery = useVaultInvestments(user?.wallet?.address || '')
  const createVaultMutation = useCreateVault()
  
  const { 
    data: vaultsData, 
    isLoading: vaultsLoading, 
    error: vaultsError, 
    refetch: refetchVaults 
  } = vaultsQuery
  
  const { 
    data: investmentsData, 
    isLoading: investmentsLoading 
  } = investmentsQuery
  
  const myInvestments = Array.isArray(investmentsData) ? investmentsData : []
  const loading = vaultsLoading || investmentsLoading

  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterRisk, setFilterRisk] = useState('all')
  const [sortBy, setSortBy] = useState('totalValue')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState('all-vaults')

  // Create vault form state
  const initialVaultData: VaultFormData = {
    name: '',
    description: '',
    strategy: '',
    targetAmount: 0,
    maxInvestors: 0,
    minimumInvestment: 0,
    expectedReturn: 0,
    riskLevel: 'Medium'
  }

  const vaultForm = useFormValidation({
    initialData: initialVaultData,
    validator: validateVaultCreation,
    onSubmit: async (data) => {
      await handleCreateVault(data)
    }
  })



  // Refresh data
  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    await refetchVaults()
    setRefreshing(false)
  }, [refetchVaults])

  // Create new vault
  const handleCreateVault = useCallback(async (data: VaultFormData) => {
    if (!authenticated || !user?.wallet?.address) {
      login()
      return
    }

    try {
      showLoading('Creating vault...')
      
      await createVaultMutation.mutateAsync({
        ...data,
        manager: user.wallet.address
      })

      setShowCreateDialog(false)
      vaultForm.resetForm()
      
      showSuccess(messages.vault.createSuccess)

    } catch (err) {
      console.error('Error creating vault:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to create vault'
      showError(errorMessage)
      throw err // Re-throw để validation hook xử lý
    }
  }, [authenticated, user?.wallet?.address, login, createVaultMutation, vaultForm, showLoading, showSuccess, showError, messages])



  // Filter and sort vaults
  const filteredVaults = useMemo(() => {
    const vaults = vaultsData?.vaults || []
    return vaults
      .filter(vault => {
        const matchesSearch = vault.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             vault.description.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesStatus = filterStatus === 'all' || vault.status === filterStatus
        const matchesRisk = filterRisk === 'all' || vault.riskLevel === filterRisk
        return matchesSearch && matchesStatus && matchesRisk
      })
      .sort((a, b) => {
        let aValue: string | number = a[sortBy as keyof Vault] as string | number
        let bValue: string | number = b[sortBy as keyof Vault] as string | number
        
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          aValue = aValue.toLowerCase()
          bValue = bValue.toLowerCase()
        }
        
        if (sortOrder === 'asc') {
          return aValue > bValue ? 1 : -1
        } else {
          return aValue < bValue ? 1 : -1
        }
      })
  }, [vaultsData?.vaults, searchTerm, filterStatus, filterRisk, sortBy, sortOrder])

  // Format currency with null/undefined check
  const formatCurrency = useCallback((amount: number | undefined | null) => {
    if (amount === undefined || amount === null || isNaN(amount)) {
      return '$0'
    }
    return `$${amount.toLocaleString()}`
  }, [])

  // Format percentage
  const formatPercentage = useCallback((percentage: number) => {
    return `${percentage > 0 ? '+' : ''}${percentage.toFixed(2)}%`
  }, [])

  // Get risk level color
  const getRiskLevelColor = useCallback((risk: string) => {
    switch (risk) {
      case 'Low': return 'bg-green-900/20 text-green-400 border-green-800'
      case 'Medium': return 'bg-yellow-900/20 text-yellow-400 border-yellow-800'
      case 'High': return 'bg-red-900/20 text-red-400 border-red-800'
      default: return 'bg-slate-900/20 text-slate-400 border-slate-800'
    }
  }, [])

  // Get status color
  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-900/20 text-green-400 border-green-800'
      case 'Pending': return 'bg-yellow-900/20 text-yellow-400 border-yellow-800'
      case 'Closed': return 'bg-slate-900/20 text-slate-400 border-slate-800'
      default: return 'bg-slate-900/20 text-slate-400 border-slate-800'
    }
  }, [])

  return (
    <ErrorBoundary fallback={ApiErrorFallback}>
      <SEOHead 
        title="Investment Vaults"
        description="Create and invest in diversified RWA investment vaults. Pool resources with other investors to access premium real-world assets with professional management."
        keywords="investment vaults, pooled investments, RWA funds, diversified portfolio, asset management, collective investment"
      />
      <div className="min-h-screen bg-slate-950">
        <Navigation />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {vaultsError && (
            <div className="bg-red-900/20 border border-red-800 rounded-lg p-6 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <AlertCircle className="w-5 h-5 text-red-400" />
                <h3 className="text-lg font-semibold text-red-400">Error Loading Vaults</h3>
              </div>
              <p className="text-slate-300 mb-4">{vaultsError instanceof Error ? vaultsError.message : 'An error occurred'}</p>
              <div className="flex gap-3">
                <Button
                  onClick={() => refetchVaults()}
                  disabled={loading}
                  className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-2"
                  aria-label="Retry loading vaults"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  {loading ? 'Retrying...' : 'Try Again'}
                </Button>
              </div>
            </div>
          )}
          
          {loading ? (
            <div className="space-y-6">
              <PageHeaderSkeleton />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <CardSkeleton key={i} />
                ))}
              </div>
            </div>
          ) : (
            <>
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Investment Vaults
            </h1>
            <p className="text-slate-400">
              Diversified investment strategies for real-world assets
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
            
            {authenticated && (
              <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogTrigger asChild>
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Vault
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create New Investment Vault</DialogTitle>
                    <DialogDescription className="text-slate-400">
                      Set up a new vault to pool investments for real-world assets
                    </DialogDescription>
                  </DialogHeader>
                  
                  <form onSubmit={vaultForm.handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Vault Name</Label>
                      <Input
                        id="name"
                        value={vaultForm.data.name}
                        onChange={(e) => vaultForm.updateField('name', e.target.value)}
                        onBlur={() => vaultForm.setFieldTouched('name')}
                        className={`bg-slate-800 border-slate-700 text-white ${
                          vaultForm.getFieldError('name') ? 'border-red-500' : ''
                        }`}
                        placeholder="e.g., Premium Real Estate Fund"
                      />
                      {vaultForm.getFieldError('name') && (
                        <p className="text-red-400 text-sm">{vaultForm.getFieldError('name')}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="strategy">Investment Strategy</Label>
                      <Input
                        id="strategy"
                        value={vaultForm.data.strategy}
                        onChange={(e) => vaultForm.updateField('strategy', e.target.value)}
                        onBlur={() => vaultForm.setFieldTouched('strategy')}
                        className={`bg-slate-800 border-slate-700 text-white ${
                          vaultForm.getFieldError('strategy') ? 'border-red-500' : ''
                        }`}
                        placeholder="e.g., Diversified Real Estate"
                      />
                      {vaultForm.getFieldError('strategy') && (
                        <p className="text-red-400 text-sm">{vaultForm.getFieldError('strategy')}</p>
                      )}
                    </div>
                    
                    <div className="md:col-span-2 space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={vaultForm.data.description}
                        onChange={(e) => vaultForm.updateField('description', e.target.value)}
                        onBlur={() => vaultForm.setFieldTouched('description')}
                        className={`bg-slate-800 border-slate-700 text-white ${
                          vaultForm.getFieldError('description') ? 'border-red-500' : ''
                        }`}
                        placeholder="Describe the vault's investment focus and strategy..."
                        rows={3}
                      />
                      {vaultForm.getFieldError('description') && (
                        <p className="text-red-400 text-sm">{vaultForm.getFieldError('description')}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="targetAmount">Target Amount ($)</Label>
                      <Input
                        id="targetAmount"
                        type="number"
                        value={vaultForm.data.targetAmount || ''}
                        onChange={(e) => vaultForm.updateField('targetAmount', Number(e.target.value) || 0)}
                        onBlur={() => vaultForm.setFieldTouched('targetAmount')}
                        className={`bg-slate-800 border-slate-700 text-white ${
                          vaultForm.getFieldError('targetAmount') ? 'border-red-500' : ''
                        }`}
                        placeholder="1000000"
                      />
                      {vaultForm.getFieldError('targetAmount') && (
                        <p className="text-red-400 text-sm">{vaultForm.getFieldError('targetAmount')}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="maxInvestors">Max Investors</Label>
                      <Input
                        id="maxInvestors"
                        type="number"
                        value={vaultForm.data.maxInvestors || ''}
                        onChange={(e) => vaultForm.updateField('maxInvestors', Number(e.target.value) || 0)}
                        onBlur={() => vaultForm.setFieldTouched('maxInvestors')}
                        className={`bg-slate-800 border-slate-700 text-white ${
                          vaultForm.getFieldError('maxInvestors') ? 'border-red-500' : ''
                        }`}
                        placeholder="100"
                      />
                      {vaultForm.getFieldError('maxInvestors') && (
                        <p className="text-red-400 text-sm">{vaultForm.getFieldError('maxInvestors')}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="minimumInvestment">Minimum Investment ($)</Label>
                      <Input
                        id="minimumInvestment"
                        type="number"
                        value={vaultForm.data.minimumInvestment || ''}
                        onChange={(e) => vaultForm.updateField('minimumInvestment', Number(e.target.value) || 0)}
                        onBlur={() => vaultForm.setFieldTouched('minimumInvestment')}
                        className={`bg-slate-800 border-slate-700 text-white ${
                          vaultForm.getFieldError('minimumInvestment') ? 'border-red-500' : ''
                        }`}
                        placeholder="10000"
                      />
                      {vaultForm.getFieldError('minimumInvestment') && (
                        <p className="text-red-400 text-sm">{vaultForm.getFieldError('minimumInvestment')}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="expectedReturn">Expected Return (%)</Label>
                      <Input
                        id="expectedReturn"
                        type="number"
                        step="0.1"
                        value={vaultForm.data.expectedReturn || ''}
                        onChange={(e) => vaultForm.updateField('expectedReturn', Number(e.target.value) || 0)}
                        onBlur={() => vaultForm.setFieldTouched('expectedReturn')}
                        className={`bg-slate-800 border-slate-700 text-white ${
                          vaultForm.getFieldError('expectedReturn') ? 'border-red-500' : ''
                        }`}
                        placeholder="12.5"
                      />
                      {vaultForm.getFieldError('expectedReturn') && (
                        <p className="text-red-400 text-sm">{vaultForm.getFieldError('expectedReturn')}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="riskLevel">Risk Level</Label>
                      <Select 
                        value={vaultForm.data.riskLevel} 
                        onValueChange={(value: 'low' | 'medium' | 'high') => {
                          vaultForm.updateField('riskLevel', value)
                          vaultForm.setFieldTouched('riskLevel')
                        }}
                      >
                        <SelectTrigger className={`bg-slate-800 border-slate-700 text-white ${
                          vaultForm.getFieldError('riskLevel') ? 'border-red-500' : ''
                        }`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low Risk</SelectItem>
                          <SelectItem value="medium">Medium Risk</SelectItem>
                          <SelectItem value="high">High Risk</SelectItem>
                        </SelectContent>
                      </Select>
                      {vaultForm.getFieldError('riskLevel') && (
                        <p className="text-red-400 text-sm">{vaultForm.getFieldError('riskLevel')}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="endDate">End Date (Optional)</Label>
                      <Input
                        id="endDate"
                        type="date"
                        value={vaultForm.data.endDate || ''}
                        onChange={(e) => vaultForm.updateField('endDate', e.target.value)}
                        onBlur={() => vaultForm.setFieldTouched('endDate')}
                        className={`bg-slate-800 border-slate-700 text-white ${
                          vaultForm.getFieldError('endDate') ? 'border-red-500' : ''
                        }`}
                      />
                      {vaultForm.getFieldError('endDate') && (
                        <p className="text-red-400 text-sm">{vaultForm.getFieldError('endDate')}</p>
                      )}
                    </div>
                  </form>
                  
                  <div className="flex justify-end gap-3">
                    <Button 
                      variant="outline" 
                      onClick={() => setShowCreateDialog(false)}
                      className="border-slate-700 text-slate-300"
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={vaultForm.handleSubmit}
                      disabled={vaultForm.isSubmitting || !vaultForm.isValid}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {vaultForm.isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        'Create Vault'
                      )}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-slate-900/50 mb-6">
            <TabsTrigger value="all-vaults">All Vaults</TabsTrigger>
            <TabsTrigger value="my-investments">My Investments</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all-vaults">
            {/* Filters and Search */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                  <Input
                    placeholder="Search vaults..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-slate-800 border-slate-700 text-white"
                  />
                </div>
              </div>
              
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger 
                  className="w-40 bg-slate-800 border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  aria-label="Filter vaults by status"
                >
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Closed">Closed</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={filterRisk} onValueChange={setFilterRisk}>
                <SelectTrigger 
                  className="w-40 bg-slate-800 border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  aria-label="Filter vaults by risk level"
                >
                  <SelectValue placeholder="Risk" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Risk</SelectItem>
                  <SelectItem value="Low">Low Risk</SelectItem>
                  <SelectItem value="Medium">Medium Risk</SelectItem>
                  <SelectItem value="High">High Risk</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger 
                  className="w-40 bg-slate-800 border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  aria-label="Sort vaults by"
                >
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="totalValue">Total Value</SelectItem>
                  <SelectItem value="expectedReturn">Expected Return</SelectItem>
                  <SelectItem value="currentInvestors">Investors</SelectItem>
                  <SelectItem value="createdAt">Created Date</SelectItem>
                </SelectContent>
              </Select>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="border-slate-700 text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                aria-label={`Sort ${sortOrder === 'asc' ? 'descending' : 'ascending'}`}
              >
                {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
              </Button>
            </div>

            {/* Vaults Grid */}
            <div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              role="grid"
              aria-label="Investment vaults"
            >
              {filteredVaults.map((vault, index) => {
                const progressPercentage = (vault.totalValue / vault.targetAmount) * 100
                const investorPercentage = (vault.currentInvestors / vault.maxInvestors) * 100
                
                return (
                  <DynamicAnimatedComponent
                    key={vault.id}
                    animation="slideUp"
                    delay={index * 0.1}
                  >
                    <Card 
                      className="bg-slate-900/50 border-slate-800 hover:bg-slate-800/50 transition-colors h-full focus-within:ring-2 focus-within:ring-blue-500/50"
                      role="gridcell"
                      tabIndex={0}
                      aria-label={`Vault: ${vault.name}`}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-lg flex items-center justify-center">
                              <Vault className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <CardTitle className="text-white text-lg">{vault.name}</CardTitle>
                              <p className="text-sm text-slate-400">{vault.strategy}</p>
                            </div>
                          </div>
                          
                          <div className="flex flex-col gap-2">
                            <Badge className={getStatusColor(vault.status)}>
                              {vault.status}
                            </Badge>
                            <Badge className={getRiskLevelColor(vault.riskLevel)}>
                              {vault.riskLevel}
                            </Badge>
                          </div>
                        </div>
                        
                        <CardDescription className="text-slate-400 line-clamp-2">
                          {vault.description}
                        </CardDescription>
                      </CardHeader>
                      
                      <CardContent>
                        <div className="space-y-4">
                          {/* Key Metrics */}
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-slate-400">Total Value</p>
                              <p className="text-lg font-semibold text-white">
                                {formatCurrency(vault.totalValue || 0)}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-slate-400">Expected Return</p>
                              <p className="text-lg font-semibold text-green-400">
                                {vault.expectedReturn}%
                              </p>
                            </div>
                          </div>
                          
                          {/* Progress Bars */}
                          <div className="space-y-3">
                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span className="text-slate-400">Funding Progress</span>
                                <span className="text-white">
                                  {progressPercentage.toFixed(1)}%
                                </span>
                              </div>
                              <Progress value={progressPercentage} className="h-2" />
                              <p className="text-xs text-slate-500 mt-1">
                                {formatCurrency(vault.totalValue || 0)} of {formatCurrency(vault.targetAmount || 0)}
                              </p>
                            </div>
                            
                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span className="text-slate-400">Investors</span>
                                <span className="text-white">
                                  {vault.currentInvestors}/{vault.maxInvestors}
                                </span>
                              </div>
                              <Progress value={investorPercentage} className="h-2" />
                            </div>
                          </div>
                          
                          {/* Additional Info */}
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-slate-400">Min. Investment</p>
                              <p className="text-white font-medium">
                                {formatCurrency(vault.minimumInvestment || 0)}
                              </p>
                            </div>
                            <div>
                              <p className="text-slate-400">Manager</p>
                              <p className="text-white font-medium truncate">
                                {vault.manager?.walletAddress ? `${vault.manager.walletAddress.slice(0, 6)}...${vault.manager.walletAddress.slice(-4)}` : 'Unknown'}
                              </p>
                            </div>
                          </div>
                          
                          {/* Action Buttons */}
                          <div className="flex gap-2 pt-2">
                            <Link href={`/vaults/${vault.id}`} className="flex-1">
                              <Button 
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                aria-label={`View details for ${vault.name}`}
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                View Details
                              </Button>
                            </Link>
                            
                            {vault.status === 'Active' && authenticated && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="border-slate-700 text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                aria-label={`Invest in ${vault.name}`}
                              >
                                <Plus className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </DynamicAnimatedComponent>
                )
              })}
            </div>
            
            {filteredVaults.length === 0 && (
              <div className="text-center py-12" role="status" aria-live="polite">
                <Vault className="h-12 w-12 text-slate-600 mx-auto mb-4" aria-hidden="true" />
                <h3 className="text-lg font-medium text-white mb-2">No vaults found</h3>
                <p className="text-slate-400 mb-4">
                  {searchTerm || filterStatus !== 'all' || filterRisk !== 'all'
                    ? 'Try adjusting your search or filters'
                    : 'Be the first to create an investment vault'}
                </p>
                {authenticated && (
                  <Button 
                    onClick={() => setShowCreateDialog(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    aria-label="Create your first investment vault"
                  >
                    <Plus className="w-4 h-4 mr-2" aria-hidden="true" />
                    Create First Vault
                  </Button>
                )}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="my-investments">
            {!authenticated ? (
              <div className="text-center py-12">
                <Shield className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">Connect Your Wallet</h3>
                <p className="text-slate-400 mb-4">
                  Connect your wallet to view your vault investments
                </p>
                <Button 
                  onClick={login} 
                  className="bg-blue-600 hover:bg-blue-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  aria-label="Connect wallet to view investments"
                >
                  Connect Wallet
                </Button>
              </div>
            ) : myInvestments.length === 0 ? (
              <div className="text-center py-12">
                <PieChart className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">No Investments Yet</h3>
                <p className="text-slate-400 mb-4">
                  Start investing in vaults to see your portfolio here
                </p>
                <Button 
                  onClick={() => setActiveTab('all-vaults')}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Explore Vaults
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Investment Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="bg-slate-900/50 border-slate-800">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-slate-400 mb-1">Total Invested</p>
                          <p className="text-2xl font-bold text-white">
                            {formatCurrency(Array.isArray(myInvestments) ? myInvestments.reduce((sum, inv) => sum + inv.amount, 0) : 0)}
                          </p>
                        </div>
                        <DollarSign className="w-8 h-8 text-blue-400" />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-slate-900/50 border-slate-800">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-slate-400 mb-1">Current Value</p>
                          <p className="text-2xl font-bold text-white">
                            {formatCurrency(Array.isArray(myInvestments) ? myInvestments.reduce((sum, inv) => sum + inv.currentValue, 0) : 0)}
                          </p>
                        </div>
                        <BarChart3 className="w-8 h-8 text-green-400" />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-slate-900/50 border-slate-800">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-slate-400 mb-1">Total P&L</p>
                          <p className={`text-2xl font-bold ${
                            (Array.isArray(myInvestments) ? myInvestments.reduce((sum, inv) => sum + inv.profitLoss, 0) : 0) >= 0
                              ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {formatCurrency(Array.isArray(myInvestments) ? myInvestments.reduce((sum, inv) => sum + inv.profitLoss, 0) : 0)}
                          </p>
                        </div>
                        {(Array.isArray(myInvestments) ? myInvestments.reduce((sum, inv) => sum + inv.profitLoss, 0) : 0) >= 0 ? (
                          <TrendingUp className="w-8 h-8 text-green-400" />
                        ) : (
                          <TrendingDown className="w-8 h-8 text-red-400" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                {/* Investment List */}
                <div className="space-y-4">
                  {myInvestments.map((investment, index) => (
                    <DynamicAnimatedComponent
                      key={investment.id}
                      animation="slideUp"
                      delay={index * 0.1}
                    >
                      <Card className="bg-slate-900/50 border-slate-800">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-lg flex items-center justify-center">
                                <Vault className="w-6 h-6 text-white" />
                              </div>
                              
                              <div>
                                <Link href={`/vaults/${investment.vaultId}`}>
                                  <h4 className="font-semibold text-white hover:text-blue-400 transition-colors cursor-pointer">
                                    {investment.vault.name}
                                  </h4>
                                </Link>
                                <p className="text-sm text-slate-400">
                                  {investment.shares.toLocaleString()} shares • {investment.vault.strategy}
                                </p>
                              </div>
                            </div>
                            
                            <div className="text-right">
                              <p className="font-semibold text-white">
                                {formatCurrency(investment.currentValue)}
                              </p>
                              <div className="flex items-center gap-1">
                                {investment.profitLoss >= 0 ? (
                                  <ArrowUpRight className="h-3 w-3 text-green-500" />
                                ) : (
                                  <ArrowDownRight className="h-3 w-3 text-red-500" />
                                )}
                                <span className={`text-sm ${
                                  investment.profitLoss >= 0 ? 'text-green-500' : 'text-red-500'
                                }`}>
                                  {formatPercentage(investment.profitLossPercentage)}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <p className="text-slate-400">Invested</p>
                              <p className="text-white font-medium">
                                {formatCurrency(investment.amount)}
                              </p>
                            </div>
                            <div>
                              <p className="text-slate-400">P&L</p>
                              <p className={`font-medium ${
                                investment.profitLoss >= 0 ? 'text-green-400' : 'text-red-400'
                              }`}>
                                {formatCurrency(investment.profitLoss)}
                              </p>
                            </div>
                            <div>
                              <p className="text-slate-400">Investment Date</p>
                              <p className="text-white font-medium">
                                {new Date(investment.investmentDate).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </DynamicAnimatedComponent>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </>
    )}
        </div>
      </div>
    </ErrorBoundary>
  )
}