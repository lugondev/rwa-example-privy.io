import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/db'

interface CreateOrderRequest {
  assetId: string
  type: 'buy' | 'sell'
  quantity: number
  price: number
  userId: string
}

/**
 * GET /api/trading/orders - Get user's trading orders
 */
export async function GET(request: NextRequest) {
  try {
    const prisma = await getPrismaClient()

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const assetId = searchParams.get('assetId')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }
    
    const whereClause: any = {
      userId: userId
    }

    if (status && status !== 'all') {
      whereClause.status = status
    }

    if (assetId) {
      whereClause.assetId = assetId
    }

    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        asset: {
          select: {
            id: true,
            name: true,
            symbol: true,
            currentPrice: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit,
      skip: offset
    })

    const totalCount = await prisma.order.count({
      where: whereClause
    })

    return NextResponse.json({
      orders,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      }
    })
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/trading/orders - Create a new trading order
 */
export async function POST(request: NextRequest) {
  try {
    const prisma = await getPrismaClient()

    const body: CreateOrderRequest = await request.json()
    const { assetId, type, quantity, price, userId } = body

    // Validate required fields
    if (!assetId || !type || !quantity || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields: assetId, type, quantity, userId' },
        { status: 400 }
      )
    }

    if (quantity <= 0 || price <= 0) {
      return NextResponse.json(
        { error: 'Quantity and price must be positive' },
        { status: 400 }
      )
    }

    if (!['buy', 'sell'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid order type' },
        { status: 400 }
      )
    }

    // Check if asset exists
    const asset = await prisma.asset.findUnique({
      where: { id: assetId }
    })

    if (!asset) {
      return NextResponse.json(
        { error: 'Asset not found' },
        { status: 404 }
      )
    }

    // For sell orders, check if user has enough shares
    if (type === 'sell') {
      const userShares = await prisma.ownership.findFirst({
        where: {
          userId: userId,
          assetId: assetId
        }
      })

      if (!userShares || userShares.shares < quantity) {
        return NextResponse.json(
          { error: 'Insufficient shares to sell' },
          { status: 400 }
        )
      }
    }

    // For buy orders, check if user has enough balance (simplified)
    if (type === 'buy') {
      const totalCost = quantity * price
      // In a real implementation, you would check user's wallet balance
      // For now, we'll assume the user has sufficient funds
    }

    const totalValue = quantity * price

    // Create the order
    const order = await prisma.order.create({
      data: {
        userId: userId,
        assetId: assetId,
        type: type,
        quantity: quantity,
        price: price,
        totalValue: totalValue,
        status: 'pending',
        createdAt: new Date()
      },
      include: {
        asset: {
          select: {
            id: true,
            name: true,
            symbol: true,
            currentPrice: true
          }
        }
      }
    })

    // In a real implementation, you would:
    // 1. Add the order to a matching engine
    // 2. Try to match with existing orders
    // 3. Update order status based on matching results
    // 4. Handle partial fills
    // 5. Update user balances and ownership

    return NextResponse.json(order, { status: 201 })
  } catch (error) {
    console.error('Error creating order:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}