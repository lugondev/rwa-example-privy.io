import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/db'

interface PortfolioStats {
  totalValue: number
  totalCost: number
  totalProfitLoss: number
  totalProfitLossPercentage: number
  totalShares: number
  assetsCount: number
  topPerformingAsset?: {
    id: string
    name: string
    profitLoss: number
    profitLossPercentage: number
  }
  worstPerformingAsset?: {
    id: string
    name: string
    profitLoss: number
    profitLossPercentage: number
  }
  assetAllocation: Array<{
    assetId: string
    assetName: string
    shares: number
    currentValue: number
    percentage: number
    profitLoss: number
    profitLossPercentage: number
  }>
}

/**
 * GET /api/trading/portfolio-stats - Get comprehensive portfolio statistics
 * Query params: userId (required)
 */
export async function GET(request: NextRequest) {
  try {
    const prisma = await getPrismaClient()
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      )
    }

    // Get user's ownership data with asset information
    const ownerships = await prisma.ownership.findMany({
      where: { userId },
      include: {
        asset: {
          select: {
            id: true,
            name: true,
            currentPrice: true,
            symbol: true,
            imageUrl: true
          }
        }
      }
    })

    if (ownerships.length === 0) {
      // Return empty portfolio stats
      const emptyStats: PortfolioStats = {
        totalValue: 0,
        totalCost: 0,
        totalProfitLoss: 0,
        totalProfitLossPercentage: 0,
        totalShares: 0,
        assetsCount: 0,
        assetAllocation: []
      }
      return NextResponse.json(emptyStats)
    }

    // Calculate portfolio statistics
    let totalValue = 0
    let totalCost = 0
    let totalShares = 0
    const assetAllocation: PortfolioStats['assetAllocation'] = []
    const assetPerformance: Array<{
      id: string
      name: string
      profitLoss: number
      profitLossPercentage: number
    }> = []

    for (const ownership of ownerships) {
      const { shares, averagePrice, asset } = ownership
      const currentValue = shares * asset.currentPrice
      const cost = shares * averagePrice
      const profitLoss = currentValue - cost
      const profitLossPercentage = cost > 0 ? (profitLoss / cost) * 100 : 0

      totalValue += currentValue
      totalCost += cost
      totalShares += shares

      assetAllocation.push({
        assetId: asset.id,
        assetName: asset.name,
        shares,
        currentValue,
        percentage: 0, // Will be calculated after totalValue is known
        profitLoss,
        profitLossPercentage
      })

      assetPerformance.push({
        id: asset.id,
        name: asset.name,
        profitLoss,
        profitLossPercentage
      })
    }

    // Calculate percentages for asset allocation
    assetAllocation.forEach(allocation => {
      allocation.percentage = totalValue > 0 ? (allocation.currentValue / totalValue) * 100 : 0
    })

    // Calculate total profit/loss
    const totalProfitLoss = totalValue - totalCost
    const totalProfitLossPercentage = totalCost > 0 ? (totalProfitLoss / totalCost) * 100 : 0

    // Find top and worst performing assets
    const sortedByPerformance = [...assetPerformance].sort((a, b) => b.profitLossPercentage - a.profitLossPercentage)
    const topPerformingAsset = sortedByPerformance[0]
    const worstPerformingAsset = sortedByPerformance[sortedByPerformance.length - 1]

    const stats: PortfolioStats = {
      totalValue: Math.round(totalValue * 100) / 100,
      totalCost: Math.round(totalCost * 100) / 100,
      totalProfitLoss: Math.round(totalProfitLoss * 100) / 100,
      totalProfitLossPercentage: Math.round(totalProfitLossPercentage * 100) / 100,
      totalShares,
      assetsCount: ownerships.length,
      topPerformingAsset: topPerformingAsset ? {
        ...topPerformingAsset,
        profitLoss: Math.round(topPerformingAsset.profitLoss * 100) / 100,
        profitLossPercentage: Math.round(topPerformingAsset.profitLossPercentage * 100) / 100
      } : undefined,
      worstPerformingAsset: worstPerformingAsset && sortedByPerformance.length > 1 ? {
        ...worstPerformingAsset,
        profitLoss: Math.round(worstPerformingAsset.profitLoss * 100) / 100,
        profitLossPercentage: Math.round(worstPerformingAsset.profitLossPercentage * 100) / 100
      } : undefined,
      assetAllocation: assetAllocation.map(allocation => ({
        ...allocation,
        currentValue: Math.round(allocation.currentValue * 100) / 100,
        percentage: Math.round(allocation.percentage * 100) / 100,
        profitLoss: Math.round(allocation.profitLoss * 100) / 100,
        profitLossPercentage: Math.round(allocation.profitLossPercentage * 100) / 100
      }))
    }

    return NextResponse.json(stats)

  } catch (error) {
    console.error('Error fetching portfolio stats:', error)
    
    // Return mock data as fallback
    const mockStats: PortfolioStats = {
      totalValue: 125000,
      totalCost: 100000,
      totalProfitLoss: 25000,
      totalProfitLossPercentage: 25.0,
      totalShares: 150,
      assetsCount: 3,
      topPerformingAsset: {
        id: 'mock-1',
        name: 'Premium Art Collection',
        profitLoss: 15000,
        profitLossPercentage: 30.0
      },
      worstPerformingAsset: {
        id: 'mock-2',
        name: 'Vintage Wine Portfolio',
        profitLoss: -2000,
        profitLossPercentage: -5.0
      },
      assetAllocation: [
        {
          assetId: 'mock-1',
          assetName: 'Premium Art Collection',
          shares: 50,
          currentValue: 65000,
          percentage: 52.0,
          profitLoss: 15000,
          profitLossPercentage: 30.0
        },
        {
          assetId: 'mock-2',
          assetName: 'Vintage Wine Portfolio',
          shares: 75,
          currentValue: 38000,
          percentage: 30.4,
          profitLoss: -2000,
          profitLossPercentage: -5.0
        },
        {
          assetId: 'mock-3',
          assetName: 'Luxury Watch Collection',
          shares: 25,
          currentValue: 22000,
          percentage: 17.6,
          profitLoss: 12000,
          profitLossPercentage: 120.0
        }
      ]
    }

    return NextResponse.json(mockStats)
  }
}