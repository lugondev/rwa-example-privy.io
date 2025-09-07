'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { TrendingUp, TrendingDown, DollarSign, Activity, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { usePrivy } from '@privy-io/react-auth'
import { toast } from 'sonner'

interface Order {
  id: string
  assetId: string
  asset: {
    name: string
    symbol: string
    currentPrice: number
    imageUrl?: string
  }
  type: 'buy' | 'sell'
  quantity: number
  price: number
  totalValue: number
  status: 'pending' | 'filled' | 'cancelled'
  orderType: 'market' | 'limit'
  createdAt: string
}

interface Trade {
  id: string
  assetId: string
  asset: {
    name: string
    symbol: string
    imageUrl?: string
  }
  type: 'buy' | 'sell'
  quantity: number
  price: number
  totalValue: number
  fees: number
  createdAt: string
}

interface Asset {
  id: string
  name: string
  symbol: string
  currentPrice: number
  imageUrl?: string
  category: string
}

interface PortfolioStats {
  totalValue: number
  totalCost: number
  totalProfitLoss: number
  totalProfitLossPercentage: number
  totalShares: number
  assetsCount: number
}

export default function TradingPage() {
  const { user } = usePrivy()
  const [orders, setOrders] = useState<Order[]>([])
  const [trades, setTrades] = useState<Trade[]>([])
  const [assets, setAssets] = useState<Asset[]>([])
  const [portfolioStats, setPortfolioStats] = useState<PortfolioStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [isTradeDialogOpen, setIsTradeDialogOpen] = useState(false)
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null)
  const [tradeForm, setTradeForm] = useState({
    type: 'buy' as 'buy' | 'sell',
    quantity: '',
    orderType: 'market' as 'market' | 'limit',
    price: ''
  })

  // Fetch data on component mount
  useEffect(() => {
    if (user?.id) {
      fetchData()
    }
  }, [user?.id])

  const fetchData = async () => {
    try {
      setLoading(true)
      const userId = user?.id || 'demo-user'

      // Fetch orders, trades, assets, and portfolio stats in parallel
      const [ordersRes, tradesRes, assetsRes, statsRes] = await Promise.all([
        fetch(`/api/trading/orders?userId=${userId}`),
        fetch(`/api/trading/history?userId=${userId}`),
        fetch('/api/assets?limit=20'),
        fetch(`/api/trading/portfolio-stats?userId=${userId}`)
      ])

      const [ordersData, tradesData, assetsData, statsData] = await Promise.all([
        ordersRes.json(),
        tradesRes.json(),
        assetsRes.json(),
        statsRes.json()
      ])

      setOrders(ordersData.orders || [])
      setTrades(tradesData.trades || [])
      setAssets(assetsData.assets || [])
      setPortfolioStats(statsData)
    } catch (error) {
      console.error('Error fetching trading data:', error)
      toast.error('Failed to load trading data')
    } finally {
      setLoading(false)
    }
  }

  const handleTrade = async () => {
    if (!selectedAsset || !tradeForm.quantity) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      const userId = user?.id || 'demo-user'
      const response = await fetch('/api/trading/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId,
          assetId: selectedAsset.id,
          type: tradeForm.type,
          quantity: parseInt(tradeForm.quantity),
          price: tradeForm.orderType === 'limit' ? parseFloat(tradeForm.price) : undefined,
          orderType: tradeForm.orderType
        })
      })

      const result = await response.json()

      if (response.ok) {
        toast.success(`${tradeForm.type === 'buy' ? 'Purchase' : 'Sale'} executed successfully!`)
        setIsTradeDialogOpen(false)
        setTradeForm({ type: 'buy', quantity: '', orderType: 'market', price: '' })
        setSelectedAsset(null)
        fetchData() // Refresh data
      } else {
        toast.error(result.error || 'Trade execution failed')
      }
    } catch (error) {
      console.error('Error executing trade:', error)
      toast.error('Failed to execute trade')
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'filled':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'filled':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Trading Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage your trades and monitor portfolio performance</p>
        </div>
        <Dialog open={isTradeDialogOpen} onOpenChange={setIsTradeDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Activity className="h-4 w-4 mr-2" />
              New Trade
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Execute Trade</DialogTitle>
              <DialogDescription>
                Place a buy or sell order for your selected asset
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="asset">Asset</Label>
                <Select onValueChange={(value) => {
                  const asset = assets.find(a => a.id === value)
                  setSelectedAsset(asset || null)
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an asset" />
                  </SelectTrigger>
                  <SelectContent>
                    {assets.map((asset) => (
                      <SelectItem key={asset.id} value={asset.id}>
                        {asset.name} ({asset.symbol}) - ${asset.currentPrice}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="type">Type</Label>
                  <Select value={tradeForm.type} onValueChange={(value: 'buy' | 'sell') => 
                    setTradeForm(prev => ({ ...prev, type: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="buy">Buy</SelectItem>
                      <SelectItem value="sell">Sell</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="orderType">Order Type</Label>
                  <Select value={tradeForm.orderType} onValueChange={(value: 'market' | 'limit') => 
                    setTradeForm(prev => ({ ...prev, orderType: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="market">Market</SelectItem>
                      <SelectItem value="limit">Limit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  placeholder="Enter quantity"
                  value={tradeForm.quantity}
                  onChange={(e) => setTradeForm(prev => ({ ...prev, quantity: e.target.value }))}
                />
              </div>
              {tradeForm.orderType === 'limit' && (
                <div>
                  <Label htmlFor="price">Limit Price</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    placeholder="Enter limit price"
                    value={tradeForm.price}
                    onChange={(e) => setTradeForm(prev => ({ ...prev, price: e.target.value }))}
                  />
                </div>
              )}
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsTradeDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleTrade}>
                  Execute Trade
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Portfolio Stats */}
      {portfolioStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${portfolioStats.totalValue.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total P&L</CardTitle>
              {portfolioStats.totalProfitLoss >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${
                portfolioStats.totalProfitLoss >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                ${portfolioStats.totalProfitLoss.toLocaleString()}
              </div>
              <p className={`text-xs ${
                portfolioStats.totalProfitLoss >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {portfolioStats.totalProfitLossPercentage >= 0 ? '+' : ''}
                {portfolioStats.totalProfitLossPercentage.toFixed(2)}%
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Shares</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{portfolioStats.totalShares}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Assets</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{portfolioStats.assetsCount}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Trading Tabs */}
      <Tabs defaultValue="orders" className="space-y-6">
        <TabsList>
          <TabsTrigger value="orders">Active Orders</TabsTrigger>
          <TabsTrigger value="history">Trading History</TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Orders</CardTitle>
              <CardDescription>
                Monitor your pending and recent orders
              </CardDescription>
            </CardHeader>
            <CardContent>
              {orders.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No active orders found
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(order.status)}
                          <Badge className={getStatusColor(order.status)}>
                            {order.status}
                          </Badge>
                        </div>
                        <div>
                          <div className="font-medium">{order.asset.name}</div>
                          <div className="text-sm text-gray-500">
                            {order.type.toUpperCase()} {order.quantity} shares
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">${order.totalValue.toLocaleString()}</div>
                        <div className="text-sm text-gray-500">
                          ${order.price} per share
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Trading History</CardTitle>
              <CardDescription>
                View your completed trades and transactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {trades.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No trading history found
                </div>
              ) : (
                <div className="space-y-4">
                  {trades.map((trade) => (
                    <div key={trade.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className={`px-2 py-1 rounded text-xs font-medium ${
                          trade.type === 'buy' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {trade.type.toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium">{trade.asset.name}</div>
                          <div className="text-sm text-gray-500">
                            {trade.quantity} shares at ${trade.price}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">${trade.totalValue.toLocaleString()}</div>
                        <div className="text-sm text-gray-500">
                          Fee: ${trade.fees.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}