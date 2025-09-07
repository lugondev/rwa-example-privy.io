import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/db'

/**
 * GET /api/trading/history - Get user's trading history
 */
export async function GET(request: NextRequest) {
  try {
      const prisma = await getPrismaClient()

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const type = searchParams.get('type') // 'buy' | 'sell' | null
    const status = searchParams.get('status') // 'pending' | 'filled' | 'cancelled' | null
    const assetId = searchParams.get('assetId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }
    
    const whereClause: any = {
      userId: userId
    }

    if (assetId) {
      whereClause.assetId = assetId
    }

    if (type && ['buy', 'sell'].includes(type)) {
      whereClause.type = type
    }

    if (startDate) {
      whereClause.createdAt = {
        ...whereClause.createdAt,
        gte: new Date(startDate)
      }
    }

    if (endDate) {
      whereClause.createdAt = {
        ...whereClause.createdAt,
        lte: new Date(endDate)
      }
    }

    const trades = await prisma.trade.findMany({
      where: whereClause,
      include: {
        asset: {
          select: {
            id: true,
            name: true,
            symbol: true,
            images: true
          }
        },
        order: {
          select: {
            id: true,
            type: true,
            status: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit,
      skip: offset
    })

    const totalCount = await prisma.trade.count({
      where: whereClause
    })

    // Calculate trading statistics
    const stats = await calculateTradingStats(prisma, userId, whereClause)

    return NextResponse.json({
      trades,
      stats,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      }
    })
  } catch (error) {
    console.error('Error fetching trading history:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Calculate trading statistics for a user
 */
async function calculateTradingStats(prisma: any, userId: string, whereClause: any) {
  try {
    // Get all trades for stats calculation
    const allTrades = await prisma.trade.findMany({
      where: whereClause,
      select: {
        type: true,
        quantity: true,
        price: true,
        totalValue: true,
        fees: true,
        createdAt: true
      }
    })

    if (allTrades.length === 0) {
      return {
        totalVolume: 0,
        totalTrades: 0,
        totalFees: 0,
        avgTradeSize: 0,
        buyVolume: 0,
        sellVolume: 0,
        profitLoss: 0,
        profitLossPercent: 0
      }
    }

    const totalVolume = allTrades.reduce((sum, trade) => sum + trade.totalValue, 0)
    const totalFees = allTrades.reduce((sum, trade) => sum + (trade.fees || 0), 0)
    const buyTrades = allTrades.filter(trade => trade.type === 'buy')
    const sellTrades = allTrades.filter(trade => trade.type === 'sell')

    const buyVolume = buyTrades.reduce((sum, trade) => sum + trade.totalValue, 0)
    const sellVolume = sellTrades.reduce((sum, trade) => sum + trade.totalValue, 0)

    // Simple P&L calculation (sell volume - buy volume - fees)
    const profitLoss = sellVolume - buyVolume - totalFees
    const profitLossPercent = buyVolume > 0 ? (profitLoss / buyVolume) * 100 : 0

    return {
      totalVolume,
      totalTrades: allTrades.length,
      totalFees,
      avgTradeSize: totalVolume / allTrades.length,
      buyVolume,
      sellVolume,
      profitLoss,
      profitLossPercent
    }
  } catch (error) {
    console.error('Error calculating trading stats:', error)
    return {
      totalVolume: 0,
      totalTrades: 0,
      totalFees: 0,
      avgTradeSize: 0,
      buyVolume: 0,
      sellVolume: 0,
      profitLoss: 0,
      profitLossPercent: 0
    }
  }
}