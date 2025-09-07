import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/featured-assets
 * Returns featured assets for the homepage display
 */
export async function GET(request: NextRequest) {
  try {
    // Mock data for development - replace with real data from database
    const featuredAssets = [
      {
        id: '1',
        name: 'Manhattan Office Building',
        symbol: 'MOB',
        type: 'Real Estate',
        totalValue: 15000000,
        currentPrice: 125.50,
        change24h: 2.34,
        image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20manhattan%20office%20building%20exterior%20professional%20photography&image_size=square',
        location: 'New York, NY',
        yield: 6.8,
        totalShares: 119521,
        availableShares: 8934
      },
      {
        id: '2',
        name: 'Luxury Art Collection',
        symbol: 'LAC',
        type: 'Art',
        totalValue: 8500000,
        currentPrice: 89.75,
        change24h: -1.23,
        image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=luxury%20art%20gallery%20with%20modern%20paintings%20elegant%20lighting&image_size=square',
        location: 'Global',
        yield: 4.2,
        totalShares: 94701,
        availableShares: 12456
      },
      {
        id: '3',
        name: 'Tech Startup Portfolio',
        symbol: 'TSP',
        type: 'Equity',
        totalValue: 12000000,
        currentPrice: 156.80,
        change24h: 5.67,
        image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20tech%20startup%20office%20with%20computers%20and%20innovation&image_size=square',
        location: 'Silicon Valley, CA',
        yield: 8.5,
        totalShares: 76531,
        availableShares: 5678
      },
      {
        id: '4',
        name: 'Renewable Energy Fund',
        symbol: 'REF',
        type: 'Infrastructure',
        totalValue: 25000000,
        currentPrice: 203.45,
        change24h: 1.89,
        image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=solar%20panels%20and%20wind%20turbines%20renewable%20energy%20farm&image_size=square',
        location: 'Multiple States',
        yield: 7.3,
        totalShares: 122847,
        availableShares: 15234
      }
    ]

    return NextResponse.json(featuredAssets, { status: 200 })
  } catch (error) {
    console.error('Error fetching featured assets:', error)
    return NextResponse.json(
      { error: 'Failed to fetch featured assets' },
      { status: 500 }
    )
  }
}