'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Search, TrendingUp, DollarSign, Users, Calendar, Filter } from 'lucide-react';
import { toast } from 'sonner';

// Types
interface Asset {
  id: string;
  name: string;
  description: string;
  assetType: string;
  totalValue: number;
  currentPrice: number;
  fractionalEnabled: boolean;
}

interface FractionalOwnership {
  assetId: string;
  shares: number;
  percentage: number;
  purchasePrice: number;
  currentValue: number;
  purchaseDate: string;
}

interface OwnershipDistribution {
  ownerId: string;
  ownerName: string;
  shares: number;
  percentage: number;
  purchasePrice: number;
  currentValue: number;
  purchaseDate: string;
}

interface Dividend {
  id: string;
  assetId: string;
  assetName: string;
  assetType: string;
  shares: number;
  dividendAmount: number;
  dividendRate: number;
  paymentDate: string;
  status: string;
}

const FractionalOwnershipPage = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [myOwnerships, setMyOwnerships] = useState<FractionalOwnership[]>([]);
  const [dividends, setDividends] = useState<Dividend[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<string>('');
  const [ownershipDetails, setOwnershipDetails] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [loading, setLoading] = useState(true);

  // Mock data for demonstration
  useEffect(() => {
    const mockAssets: Asset[] = [
      {
        id: '1',
        name: 'Manhattan Luxury Apartment',
        description: 'Prime real estate in downtown Manhattan',
        assetType: 'real_estate',
        totalValue: 2500000,
        currentPrice: 2650000,
        fractionalEnabled: true
      },
      {
        id: '2',
        name: 'Vintage Wine Collection',
        description: 'Rare Bordeaux wines from 1982',
        assetType: 'collectibles',
        totalValue: 150000,
        currentPrice: 175000,
        fractionalEnabled: true
      },
      {
        id: '3',
        name: 'Contemporary Art Piece',
        description: 'Original painting by emerging artist',
        assetType: 'art',
        totalValue: 85000,
        currentPrice: 92000,
        fractionalEnabled: true
      }
    ];

    const mockOwnerships: FractionalOwnership[] = [
      {
        assetId: '1',
        shares: 25000,
        percentage: 2.5,
        purchasePrice: 62500,
        currentValue: 66250,
        purchaseDate: '2024-01-15'
      },
      {
        assetId: '2',
        shares: 50000,
        percentage: 5.0,
        purchasePrice: 7500,
        currentValue: 8750,
        purchaseDate: '2024-02-20'
      }
    ];

    const mockDividends: Dividend[] = [
      {
        id: '1',
        assetId: '1',
        assetName: 'Manhattan Luxury Apartment',
        assetType: 'real_estate',
        shares: 25000,
        dividendAmount: 331.25,
        dividendRate: 0.5,
        paymentDate: '2024-03-15',
        status: 'paid'
      },
      {
        id: '2',
        assetId: '2',
        assetName: 'Vintage Wine Collection',
        assetType: 'collectibles',
        shares: 50000,
        dividendAmount: 43.75,
        dividendRate: 0.5,
        paymentDate: '2024-03-15',
        status: 'paid'
      }
    ];

    setAssets(mockAssets);
    setMyOwnerships(mockOwnerships);
    setDividends(mockDividends);
    setLoading(false);
  }, []);

  // Filter assets based on search and type
  const filteredAssets = assets.filter(asset => {
    const matchesSearch = asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         asset.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || asset.assetType === filterType;
    return matchesSearch && matchesType && asset.fractionalEnabled;
  });

  // Calculate portfolio stats
  const portfolioStats = {
    totalValue: myOwnerships.reduce((sum, o) => sum + o.currentValue, 0),
    totalInvested: myOwnerships.reduce((sum, o) => sum + o.purchasePrice, 0),
    totalGainLoss: myOwnerships.reduce((sum, o) => sum + (o.currentValue - o.purchasePrice), 0),
    totalDividends: dividends.reduce((sum, d) => sum + d.dividendAmount, 0),
    assetsOwned: myOwnerships.length
  };

  const gainLossPercentage = portfolioStats.totalInvested > 0 
    ? ((portfolioStats.totalGainLoss / portfolioStats.totalInvested) * 100)
    : 0;

  // Prepare chart data
  const portfolioChartData = myOwnerships.map(ownership => {
    const asset = assets.find(a => a.id === ownership.assetId);
    return {
      name: asset?.name.substring(0, 20) + '...' || 'Unknown',
      value: ownership.currentValue,
      percentage: ownership.percentage
    };
  });

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  const handlePurchaseShares = async (assetId: string, shares: number, pricePerShare: number) => {
    try {
      // In real app, make API call to purchase shares
      toast.success(`Successfully purchased ${shares} shares!`);
    } catch (error) {
      toast.error('Failed to purchase shares');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Fractional Ownership</h1>
          <p className="text-gray-600 mt-2">Invest in premium assets with fractional shares</p>
        </div>
      </div>

      {/* Portfolio Overview */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${portfolioStats.totalValue.toLocaleString()}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Invested</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${portfolioStats.totalInvested.toLocaleString()}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Gain/Loss</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              portfolioStats.totalGainLoss >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              ${portfolioStats.totalGainLoss.toLocaleString()}
            </div>
            <div className={`text-sm ${
              gainLossPercentage >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {gainLossPercentage >= 0 ? '+' : ''}{gainLossPercentage.toFixed(2)}%
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Dividends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${portfolioStats.totalDividends.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Assets Owned</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{portfolioStats.assetsOwned}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="portfolio" className="space-y-6">
        <TabsList>
          <TabsTrigger value="portfolio">My Portfolio</TabsTrigger>
          <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
          <TabsTrigger value="dividends">Dividends</TabsTrigger>
        </TabsList>

        {/* My Portfolio Tab */}
        <TabsContent value="portfolio" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Portfolio Distribution Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Portfolio Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={portfolioChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name}: ${percentage.toFixed(1)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {portfolioChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => [`$${value.toLocaleString()}`, 'Value']} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* My Ownerships */}
            <Card>
              <CardHeader>
                <CardTitle>My Fractional Ownerships</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {myOwnerships.map((ownership) => {
                    const asset = assets.find(a => a.id === ownership.assetId);
                    return (
                      <div key={ownership.assetId} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-semibold">{asset?.name}</h4>
                            <Badge variant="outline">{asset?.assetType}</Badge>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold">${ownership.currentValue.toLocaleString()}</div>
                            <div className={`text-sm ${
                              ownership.currentValue >= ownership.purchasePrice ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {ownership.currentValue >= ownership.purchasePrice ? '+' : ''}
                              ${(ownership.currentValue - ownership.purchasePrice).toLocaleString()}
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                          <div>Shares: {ownership.shares.toLocaleString()}</div>
                          <div>Ownership: {ownership.percentage.toFixed(2)}%</div>
                          <div>Invested: ${ownership.purchasePrice.toLocaleString()}</div>
                          <div>Purchase Date: {new Date(ownership.purchaseDate).toLocaleDateString()}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Marketplace Tab */}
        <TabsContent value="marketplace" className="space-y-6">
          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search assets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border rounded-md"
            >
              <option value="all">All Types</option>
              <option value="real_estate">Real Estate</option>
              <option value="art">Art</option>
              <option value="collectibles">Collectibles</option>
              <option value="commodities">Commodities</option>
            </select>
          </div>

          {/* Available Assets */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAssets.map((asset) => (
              <Card key={asset.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{asset.name}</CardTitle>
                      <Badge variant="outline" className="mt-1">{asset.assetType}</Badge>
                    </div>
                  </div>
                  <CardDescription>{asset.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-gray-600">Total Value</div>
                        <div className="font-semibold">${asset.totalValue.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-gray-600">Current Price</div>
                        <div className="font-semibold">${asset.currentPrice.toLocaleString()}</div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="text-sm text-gray-600">Available Shares: 750,000</div>
                      <Progress value={25} className="h-2" />
                      <div className="text-xs text-gray-500">25% sold</div>
                    </div>
                    
                    <Button 
                      className="w-full"
                      onClick={() => setSelectedAsset(asset.id)}
                    >
                      Invest Now
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Dividends Tab */}
        <TabsContent value="dividends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Dividend History</CardTitle>
              <CardDescription>Track your dividend payments from fractional ownerships</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dividends.map((dividend) => (
                  <div key={dividend.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold">{dividend.assetName}</h4>
                        <div className="text-sm text-gray-600">
                          {dividend.shares.toLocaleString()} shares • {dividend.dividendRate}% rate
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-green-600">
                          +${dividend.dividendAmount.toFixed(2)}
                        </div>
                        <div className="text-sm text-gray-600">
                          {new Date(dividend.paymentDate).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FractionalOwnershipPage;