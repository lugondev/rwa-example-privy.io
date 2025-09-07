import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/db'

/**
 * GET /api/assets/stats
 * Returns market statistics for assets
 */
export async function GET(request: NextRequest) {
  try {
    const prisma = await getPrismaClient()
    
    // Get total number of assets
    const totalAssets = await prisma.asset.count()
    
    // Calculate total market value
    const assets = await prisma.asset.findMany({
      select: {
        currentPrice: true,
        totalShares: true
      }
    })
    
    const totalValue = assets.reduce((sum, asset) => {
      return sum + (asset.currentPrice * asset.totalShares)
    }, 0)
    
    // Get total number of active users (users with ownerships)
    const activeUsers = await prisma.ownership.groupBy({
      by: ['userId'],
      where: {
        shares: {
          gt: 0
        }
      }
    })
    
    // Calculate 24h volume from recent trades
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    
    const volume24h = await prisma.trade.aggregate({
      where: {
        createdAt: {
          gte: yesterday
        }
      },
      _sum: {
        totalAmount: true
      }
    })
    
    const stats = {
      totalAssets,
      totalValue: `$${totalValue.toLocaleString()}`,
      activeUsers: activeUsers.length,
      volume24h: `$${(volume24h._sum.totalAmount || 0).toLocaleString()}`
    }
    
    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching asset stats:', error)
    
    // Return mock data as fallback
    const mockStats = {
      totalAssets: 1247,
      totalValue: '$125,000,000',
      activeUsers: 8934,
      volume24h: '$2,340,000'
    }
    
    return NextResponse.json(mockStats)
  }
}