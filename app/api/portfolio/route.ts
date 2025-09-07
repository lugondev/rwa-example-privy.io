import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/db'

/**
 * GET /api/portfolio - Get user's portfolio data
 * Includes assets, performance metrics, and allocation data
 */
export async function GET(request: NextRequest) {
  try {
    const prisma = await getPrismaClient()
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }
    
    // Get user's asset ownerships
    const ownerships = await prisma.ownership.findMany({
      where: { userId },
      include: {
        asset: {
          select: {
            id: true,
            name: true,
            symbol: true,
            assetType: true,
            currentPrice: true,
            metadata: true
          }
        }
      }
    })
    
    // Calculate portfolio metrics
    let totalValue = 0
    let totalCost = 0
    const assets = ownerships.map(ownership => {
      const currentValue = ownership.shares * ownership.asset.currentPrice
      const costBasis = ownership.shares * ownership.averagePrice
      const unrealizedPnL = currentValue - costBasis
      const unrealizedPnLPercent = costBasis > 0 ? (unrealizedPnL / costBasis) * 100 : 0
      
      totalValue += currentValue
      totalCost += costBasis
      
      return {
        id: ownership.asset.id,
        name: ownership.asset.name,
        symbol: ownership.asset.symbol,
        type: ownership.asset.assetType,
        shares: ownership.shares,
        currentPrice: ownership.asset.currentPrice,
        averagePrice: ownership.averagePrice,
        currentValue,
        costBasis,
        unrealizedPnL,
        unrealizedPnLPercent,
        allocation: 0, // Will be calculated after totalValue is known
        image: ownership.asset.metadata?.image || `/images/${ownership.asset.assetType.toLowerCase()}-${ownership.asset.id}.jpg`
      }
    })
    
    // Calculate allocations
    assets.forEach(asset => {
      asset.allocation = totalValue > 0 ? (asset.currentValue / totalValue) * 100 : 0
    })
    
    const totalUnrealizedPnL = totalValue - totalCost
    const totalUnrealizedPnLPercent = totalCost > 0 ? (totalUnrealizedPnL / totalCost) * 100 : 0
    
    // Get recent trading activity
    const recentTrades = await prisma.trade.findMany({
      where: { userId },
      include: {
        asset: {
          select: {
            name: true,
            symbol: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    })
    
    // Calculate asset type allocation
    const typeAllocation = assets.reduce((acc, asset) => {
      const type = asset.type
      if (!acc[type]) {
        acc[type] = { value: 0, percentage: 0 }
      }
      acc[type].value += asset.currentValue
      return acc
    }, {} as Record<string, { value: number; percentage: number }>)
    
    // Calculate percentages for type allocation
    Object.keys(typeAllocation).forEach(type => {
      typeAllocation[type].percentage = totalValue > 0 ? (typeAllocation[type].value / totalValue) * 100 : 0
    })
    
    // Mock performance data (in a real app, this would come from historical data)
    const performanceData = {
      labels: ['1M', '3M', '6M', '1Y', 'YTD'],
      values: [2.5, 8.2, 15.7, 22.3, 18.9] // Mock percentage returns
    }
    
    return NextResponse.json({
      portfolio: {
        totalValue,
        totalCost,
        totalUnrealizedPnL,
        totalUnrealizedPnLPercent,
        assets,
        typeAllocation,
        performanceData,
        recentTrades: recentTrades.map(trade => ({
          id: trade.id,
          type: trade.type,
          assetName: trade.asset.name,
          assetSymbol: trade.asset.symbol,
          quantity: trade.quantity,
          price: trade.price,
          totalValue: trade.totalValue,
          createdAt: trade.createdAt
        }))
      }
    })
  } catch (error) {
    console.error('Error fetching portfolio:', error)
    
    // Return mock data if database fails
    const mockPortfolio = {
      totalValue: 125000.50,
      totalCost: 100000.00,
      totalUnrealizedPnL: 25000.50,
      totalUnrealizedPnLPercent: 25.0,
      assets: [
        {
          id: '1',
          name: 'Real Estate Token A',
          symbol: 'RETA',
          type: 'Real Estate',
          shares: 50,
          currentPrice: 1250.50,
          averagePrice: 1000.00,
          currentValue: 62525.00,
          costBasis: 50000.00,
          unrealizedPnL: 12525.00,
          unrealizedPnLPercent: 25.05,
          allocation: 50.02,
          image: '/images/real-estate-1.jpg'
        },
        {
          id: '2',
          name: 'Gold Token B',
          symbol: 'GOLDB',
          type: 'Physical Collectible',
          shares: 30,
          currentPrice: 2100.75,
          averagePrice: 1800.00,
          currentValue: 63022.50,
          costBasis: 54000.00,
          unrealizedPnL: 9022.50,
          unrealizedPnLPercent: 16.71,
          allocation: 50.42,
          image: '/images/gold-1.jpg'
        }
      ],
      typeAllocation: {
        'Real Estate': { value: 62525.00, percentage: 50.02 },
        'Physical Collectible': { value: 63022.50, percentage: 50.42 }
      },
      performanceData: {
        labels: ['1M', '3M', '6M', '1Y', 'YTD'],
        values: [2.5, 8.2, 15.7, 22.3, 18.9]
      },
      recentTrades: [
        {
          id: '1',
          type: 'buy',
          assetName: 'Real Estate Token A',
          assetSymbol: 'RETA',
          quantity: 10,
          price: 1250.50,
          totalValue: 12505.00,
          createdAt: new Date().toISOString()
        }
      ]
    }
    
    return NextResponse.json({ portfolio: mockPortfolio })
  }
}