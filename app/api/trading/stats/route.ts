import { getPrismaClient } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/trading/stats - Get comprehensive trading statistics
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }
    
    const prisma = await getPrismaClient()
    const period = searchParams.get('period') || '30d' // 7d, 30d, 90d, 1y, all

    // Calculate date range based on period
    const now = new Date()
    let startDate: Date | undefined

    switch (period) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        break
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
        break
      case 'all':
      default:
        startDate = undefined
        break
    }

    const whereClause: any = {
      userId: userId
    }

    if (startDate) {
      whereClause.createdAt = {
        gte: startDate
      }
    }

    // Get trading statistics
    const stats = await calculateComprehensiveStats(userId, whereClause, startDate)

    // Get portfolio performance
    const portfolioStats = await calculatePortfolioStats(userId)

    // Get recent activity
    const recentActivity = await getRecentActivity(userId, 10)

    return NextResponse.json({
      period,
      trading: stats,
      portfolio: portfolioStats,
      recentActivity
    })
  } catch (error) {
    console.error('Error fetching trading stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Calculate comprehensive trading statistics
 */
async function calculateComprehensiveStats(userId: string, whereClause: any, startDate?: Date) {
  try {
    // Get all trades in the period
    const trades = await prisma.trade.findMany({
      where: whereClause,
      select: {
        type: true,
        quantity: true,
        price: true,
        totalValue: true,
        fees: true,
        createdAt: true,
        assetId: true
      }
    })

    // Get all orders in the period
    const orders = await prisma.order.findMany({
      where: whereClause,
      select: {
        status: true,
        type: true,
        totalValue: true,
        createdAt: true
      }
    })

    if (trades.length === 0) {
      return {
        totalVolume: 0,
        totalTrades: 0,
        totalOrders: orders.length,
        totalFees: 0,
        avgTradeSize: 0,
        avgOrderSize: orders.length > 0 ? orders.reduce((sum, order) => sum + order.totalValue, 0) / orders.length : 0,
        buyVolume: 0,
        sellVolume: 0,
        profitLoss: 0,
        profitLossPercent: 0,
        successRate: 0,
        uniqueAssets: 0,
        dailyVolume: [],
        orderStatusBreakdown: getOrderStatusBreakdown(orders)
      }
    }

    const totalVolume = trades.reduce((sum, trade) => sum + trade.totalValue, 0)
    const totalFees = trades.reduce((sum, trade) => sum + (trade.fees || 0), 0)
    const buyTrades = trades.filter(trade => trade.type === 'buy')
    const sellTrades = trades.filter(trade => trade.type === 'sell')

    const buyVolume = buyTrades.reduce((sum, trade) => sum + trade.totalValue, 0)
    const sellVolume = sellTrades.reduce((sum, trade) => sum + trade.totalValue, 0)

    // Calculate P&L
    const profitLoss = sellVolume - buyVolume - totalFees
    const profitLossPercent = buyVolume > 0 ? (profitLoss / buyVolume) * 100 : 0

    // Calculate success rate (completed orders / total orders)
    const completedOrders = orders.filter(order => order.status === 'completed').length
    const successRate = orders.length > 0 ? (completedOrders / orders.length) * 100 : 0

    // Count unique assets traded
    const uniqueAssets = new Set(trades.map(trade => trade.assetId)).size

    // Calculate daily volume for chart
    const dailyVolume = calculateDailyVolume(trades, startDate)

    // Order status breakdown
    const orderStatusBreakdown = getOrderStatusBreakdown(orders)

    return {
      totalVolume,
      totalTrades: trades.length,
      totalOrders: orders.length,
      totalFees,
      avgTradeSize: totalVolume / trades.length,
      avgOrderSize: orders.length > 0 ? orders.reduce((sum, order) => sum + order.totalValue, 0) / orders.length : 0,
      buyVolume,
      sellVolume,
      profitLoss,
      profitLossPercent,
      successRate,
      uniqueAssets,
      dailyVolume,
      orderStatusBreakdown
    }
  } catch (error) {
    console.error('Error calculating comprehensive stats:', error)
    throw error
  }
}

/**
 * Calculate portfolio statistics
 */
async function calculatePortfolioStats(userId: string) {
  try {
    const ownerships = await prisma.ownership.findMany({
      where: {
        userId: userId,
        shares: {
          gt: 0
        }
      },
      include: {
        asset: {
          select: {
            id: true,
            name: true,
            currentPrice: true,
            symbol: true
          }
        }
      }
    })

    if (ownerships.length === 0) {
      return {
        totalValue: 0,
        totalAssets: 0,
        totalShares: 0,
        topHoldings: [],
        assetAllocation: []
      }
    }

    const totalValue = ownerships.reduce((sum, ownership) => {
      return sum + (ownership.shares * ownership.asset.currentPrice)
    }, 0)

    const totalShares = ownerships.reduce((sum, ownership) => sum + ownership.shares, 0)

    // Top 5 holdings by value
    const topHoldings = ownerships
      .map(ownership => ({
        assetId: ownership.asset.id,
        assetName: ownership.asset.name,
        symbol: ownership.asset.symbol,
        shares: ownership.shares,
        currentPrice: ownership.asset.currentPrice,
        value: ownership.shares * ownership.asset.currentPrice,
        percentage: ((ownership.shares * ownership.asset.currentPrice) / totalValue) * 100
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)

    // Asset allocation for pie chart
    const assetAllocation = ownerships.map(ownership => ({
      name: ownership.asset.name,
      value: ownership.shares * ownership.asset.currentPrice,
      percentage: ((ownership.shares * ownership.asset.currentPrice) / totalValue) * 100
    }))

    return {
      totalValue,
      totalAssets: ownerships.length,
      totalShares,
      topHoldings,
      assetAllocation
    }
  } catch (error) {
    console.error('Error calculating portfolio stats:', error)
    throw error
  }
}

/**
 * Get recent trading activity
 */
async function getRecentActivity(userId: string, limit: number) {
  try {
    const recentTrades = await prisma.trade.findMany({
      where: {
        userId: userId
      },
      include: {
        asset: {
          select: {
            id: true,
            name: true,
            symbol: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    })

    return recentTrades.map(trade => ({
      id: trade.id,
      type: trade.type,
      assetName: trade.asset.name,
      symbol: trade.asset.symbol,
      quantity: trade.quantity,
      price: trade.price,
      totalValue: trade.totalValue,
      timestamp: trade.createdAt
    }))
  } catch (error) {
    console.error('Error getting recent activity:', error)
    return []
  }
}

/**
 * Calculate daily volume for chart data
 */
function calculateDailyVolume(trades: any[], startDate?: Date) {
  const dailyData = new Map<string, number>()

  trades.forEach(trade => {
    const date = trade.createdAt.toISOString().split('T')[0]
    const currentVolume = dailyData.get(date) || 0
    dailyData.set(date, currentVolume + trade.totalValue)
  })

  // Convert to array and sort by date
  return Array.from(dailyData.entries())
    .map(([date, volume]) => ({ date, volume }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

/**
 * Get order status breakdown
 */
function getOrderStatusBreakdown(orders: any[]) {
  const breakdown = {
    pending: 0,
    completed: 0,
    cancelled: 0,
    partial: 0
  }

  orders.forEach(order => {
    if (breakdown.hasOwnProperty(order.status)) {
      breakdown[order.status as keyof typeof breakdown]++
    }
  })

  return breakdown
}