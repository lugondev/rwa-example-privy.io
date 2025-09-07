import { NextRequest, NextResponse } from 'next/server'

// Mock price data for demonstration
const MOCK_PRICES = {
  'real-estate-token-1': {
    assetId: 'real-estate-token-1',
    currentPrice: 125.50,
    change24h: 3.25,
    change24hPercentage: 2.65,
    lastUpdated: new Date().toISOString(),
    volume24h: 1250000,
    marketCap: 15600000
  },
  'real-estate-token-2': {
    assetId: 'real-estate-token-2',
    currentPrice: 89.75,
    change24h: -1.85,
    change24hPercentage: -2.02,
    lastUpdated: new Date().toISOString(),
    volume24h: 890000,
    marketCap: 8970000
  },
  'real-estate-token-3': {
    assetId: 'real-estate-token-3',
    currentPrice: 245.00,
    change24h: 12.50,
    change24hPercentage: 5.38,
    lastUpdated: new Date().toISOString(),
    volume24h: 2100000,
    marketCap: 24500000
  },
  'commercial-property-1': {
    assetId: 'commercial-property-1',
    currentPrice: 1850.25,
    change24h: -25.75,
    change24hPercentage: -1.37,
    lastUpdated: new Date().toISOString(),
    volume24h: 5600000,
    marketCap: 185000000
  },
  'residential-reit-1': {
    assetId: 'residential-reit-1',
    currentPrice: 67.80,
    change24h: 0.95,
    change24hPercentage: 1.42,
    lastUpdated: new Date().toISOString(),
    volume24h: 450000,
    marketCap: 6780000
  }
}

/**
 * Simulates price fluctuations for realistic demo
 */
function simulatePriceFluctuation(basePrice: number, volatility: number = 0.02): number {
  const randomFactor = (Math.random() - 0.5) * 2 * volatility
  return basePrice * (1 + randomFactor)
}

/**
 * Updates mock prices with simulated fluctuations
 */
function updateMockPrices() {
  Object.keys(MOCK_PRICES).forEach(assetId => {
    const asset = MOCK_PRICES[assetId as keyof typeof MOCK_PRICES]
    const oldPrice = asset.currentPrice

    // Simulate price change with different volatility for different assets
    const volatility = assetId.includes('commercial') ? 0.015 : 0.025
    const newPrice = simulatePriceFluctuation(oldPrice, volatility)

    // Calculate changes
    const change24h = newPrice - oldPrice
    const change24hPercentage = (change24h / oldPrice) * 100

    // Update the price data
    asset.currentPrice = Math.round(newPrice * 100) / 100
    asset.change24h = Math.round(change24h * 100) / 100
    asset.change24hPercentage = Math.round(change24hPercentage * 100) / 100
    asset.lastUpdated = new Date().toISOString()

    // Simulate volume changes
    asset.volume24h = Math.round(asset.volume24h * (0.8 + Math.random() * 0.4))
  })
}

// Update prices every 10 seconds for demo purposes
setInterval(updateMockPrices, 10000)

/**
 * GET /api/oracle/prices
 * Fetches current prices for specified assets or all assets
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const assetIdsParam = searchParams.get('assetIds')

    // Parse asset IDs if provided
    const requestedAssetIds = assetIdsParam
      ? assetIdsParam.split(',').map(id => id.trim())
      : Object.keys(MOCK_PRICES)

    // Filter prices based on requested asset IDs
    const filteredPrices = requestedAssetIds
      .map(assetId => MOCK_PRICES[assetId as keyof typeof MOCK_PRICES])
      .filter(Boolean)

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, Math.random() * 200 + 100))

    return NextResponse.json({
      success: true,
      prices: filteredPrices,
      timestamp: new Date().toISOString(),
      count: filteredPrices.length
    })

  } catch (error) {
    console.error('Error fetching oracle prices:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch price data',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/oracle/prices
 * Updates price data (for admin/oracle use)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { assetId, price, volume24h } = body

    if (!assetId || typeof price !== 'number') {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request data',
          message: 'assetId and price are required'
        },
        { status: 400 }
      )
    }

    // Update or create price data
    const existingPrice = MOCK_PRICES[assetId as keyof typeof MOCK_PRICES]

    if (existingPrice) {
      const oldPrice = existingPrice.currentPrice
      const change24h = price - oldPrice
      const change24hPercentage = (change24h / oldPrice) * 100

      MOCK_PRICES[assetId as keyof typeof MOCK_PRICES] = {
        ...existingPrice,
        currentPrice: price,
        change24h: Math.round(change24h * 100) / 100,
        change24hPercentage: Math.round(change24hPercentage * 100) / 100,
        lastUpdated: new Date().toISOString(),
        volume24h: volume24h || existingPrice.volume24h
      }
    } else {
      // Create new price entry
      (MOCK_PRICES as any)[assetId] = {
        assetId,
        currentPrice: price,
        change24h: 0,
        change24hPercentage: 0,
        lastUpdated: new Date().toISOString(),
        volume24h: volume24h || 0,
        marketCap: price * 1000000 // Mock market cap
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Price updated successfully',
      data: MOCK_PRICES[assetId as keyof typeof MOCK_PRICES]
    })

  } catch (error) {
    console.error('Error updating oracle price:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update price data',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/oracle/prices
 * Bulk update price data
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { prices } = body

    if (!Array.isArray(prices)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request data',
          message: 'prices must be an array'
        },
        { status: 400 }
      )
    }

    const updatedAssets: string[] = []

    prices.forEach((priceData: any) => {
      const { assetId, currentPrice, volume24h } = priceData

      if (assetId && typeof currentPrice === 'number') {
        const existingPrice = MOCK_PRICES[assetId as keyof typeof MOCK_PRICES]

        if (existingPrice) {
          const oldPrice = existingPrice.currentPrice
          const change24h = currentPrice - oldPrice
          const change24hPercentage = (change24h / oldPrice) * 100

          MOCK_PRICES[assetId as keyof typeof MOCK_PRICES] = {
            ...existingPrice,
            currentPrice,
            change24h: Math.round(change24h * 100) / 100,
            change24hPercentage: Math.round(change24hPercentage * 100) / 100,
            lastUpdated: new Date().toISOString(),
            volume24h: volume24h || existingPrice.volume24h
          }

          updatedAssets.push(assetId)
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: `Updated ${updatedAssets.length} assets`,
      updatedAssets
    })

  } catch (error) {
    console.error('Error bulk updating oracle prices:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to bulk update price data',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}