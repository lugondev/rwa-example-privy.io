import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/db'

interface ExecuteTradeRequest {
  userId: string
  assetId: string
  type: 'buy' | 'sell'
  quantity: number
  price?: number // Optional for market orders
  orderType: 'market' | 'limit'
}

/**
 * POST /api/trading/execute - Execute a trade (buy/sell)
 * Handles both market and limit orders
 */
export async function POST(request: NextRequest) {
  try {
    const prisma = await getPrismaClient()
    const body: ExecuteTradeRequest = await request.json()
    const { userId, assetId, type, quantity, price, orderType } = body

    // Validate required fields
    if (!userId || !assetId || !type || !quantity || !orderType) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, assetId, type, quantity, orderType' },
        { status: 400 }
      )
    }

    if (quantity <= 0) {
      return NextResponse.json(
        { error: 'Quantity must be positive' },
        { status: 400 }
      )
    }

    if (!['buy', 'sell'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid trade type' },
        { status: 400 }
      )
    }

    if (!['market', 'limit'].includes(orderType)) {
      return NextResponse.json(
        { error: 'Invalid order type' },
        { status: 400 }
      )
    }

    if (orderType === 'limit' && (!price || price <= 0)) {
      return NextResponse.json(
        { error: 'Price is required for limit orders and must be positive' },
        { status: 400 }
      )
    }

    // Get asset information
    const asset = await prisma.asset.findUnique({
      where: { id: assetId },
      include: {
        fractionalOwnerships: true
      }
    })

    if (!asset) {
      return NextResponse.json(
        { error: 'Asset not found' },
        { status: 404 }
      )
    }

    // For market orders, use current asset price
    const executionPrice = orderType === 'market' ? asset.currentPrice : price!
    const totalValue = quantity * executionPrice
    const fees = totalValue * 0.001 // 0.1% trading fee
    const totalCost = type === 'buy' ? totalValue + fees : totalValue - fees

    // Check availability for buy orders
    if (type === 'buy') {
      const totalShares = asset.fractionalOwnerships.reduce((sum, fo) => sum + fo.totalShares, 0) || 10000
      const ownedShares = asset.fractionalOwnerships.reduce((sum, fo) => sum + fo.shares, 0) || 0
      const availableShares = Math.max(0, totalShares - ownedShares)

      if (quantity > availableShares) {
        return NextResponse.json(
          { error: `Insufficient shares available. Only ${availableShares} shares available` },
          { status: 400 }
        )
      }
    }

    // Check ownership for sell orders
    if (type === 'sell') {
      const userOwnership = await prisma.ownership.findFirst({
        where: {
          userId: userId,
          assetId: assetId
        }
      })

      if (!userOwnership || userOwnership.shares < quantity) {
        const availableShares = userOwnership?.shares || 0
        return NextResponse.json(
          { error: `Insufficient shares to sell. You own ${availableShares} shares` },
          { status: 400 }
        )
      }
    }

    // Start transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create order record
      const order = await tx.order.create({
        data: {
          userId: userId,
          assetId: assetId,
          type: type,
          quantity: quantity,
          price: executionPrice,
          totalValue: totalValue,
          status: 'filled', // Immediately filled for this implementation
          orderType: orderType,
          createdAt: new Date()
        }
      })

      // Create trade record
      const trade = await tx.trade.create({
        data: {
          userId: userId,
          assetId: assetId,
          orderId: order.id,
          type: type,
          quantity: quantity,
          price: executionPrice,
          totalValue: totalValue,
          fees: fees,
          createdAt: new Date()
        }
      })

      // Update or create ownership record
      if (type === 'buy') {
        const existingOwnership = await tx.ownership.findFirst({
          where: {
            userId: userId,
            assetId: assetId
          }
        })

        if (existingOwnership) {
          // Update existing ownership
          const newTotalShares = existingOwnership.shares + quantity
          const newTotalCost = (existingOwnership.shares * existingOwnership.averagePrice) + totalCost
          const newAveragePrice = newTotalCost / newTotalShares

          await tx.ownership.update({
            where: { id: existingOwnership.id },
            data: {
              shares: newTotalShares,
              averagePrice: newAveragePrice,
              updatedAt: new Date()
            }
          })
        } else {
          // Create new ownership
          await tx.ownership.create({
            data: {
              userId: userId,
              assetId: assetId,
              shares: quantity,
              averagePrice: executionPrice,
              createdAt: new Date(),
              updatedAt: new Date()
            }
          })
        }
      } else {
        // Sell: reduce ownership
        const existingOwnership = await tx.ownership.findFirst({
          where: {
            userId: userId,
            assetId: assetId
          }
        })

        if (existingOwnership) {
          const newShares = existingOwnership.shares - quantity
          if (newShares > 0) {
            await tx.ownership.update({
              where: { id: existingOwnership.id },
              data: {
                shares: newShares,
                updatedAt: new Date()
              }
            })
          } else {
            // Remove ownership if no shares left
            await tx.ownership.delete({
              where: { id: existingOwnership.id }
            })
          }
        }
      }

      return { order, trade }
    })

    return NextResponse.json({
      success: true,
      order: result.order,
      trade: result.trade,
      executionPrice,
      totalValue,
      fees,
      totalCost
    }, { status: 201 })

  } catch (error) {
    console.error('Error executing trade:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}