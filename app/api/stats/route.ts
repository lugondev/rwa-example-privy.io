import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/stats
 * Returns market statistics including total value, assets, users, etc.
 */
export async function GET(request: NextRequest) {
  // Log request with timestamp for debugging
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] GET /api/stats - Request received`);
  
  try {
    // Mock data for development - replace with real data from database
    const stats = {
      totalValue: 125000000, // Total value locked in USD
      totalAssets: 1247, // Number of tokenized assets
      activeUsers: 8934, // Number of active users
      vaults: 156, // Number of vaults
      fractionalShares: 45678, // Number of fractional shares
      volume24h: 2340000 // 24h trading volume in USD
    }

    return NextResponse.json(stats, { status: 200 })
  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}