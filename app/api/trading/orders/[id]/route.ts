import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/db'

interface UpdateOrderRequest {
  status?: 'pending' | 'filled' | 'cancelled'
  quantity?: number
  price?: number
  userId?: string
}

/**
 * GET /api/trading/orders/[id] - Get specific order details
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const prisma = await getPrismaClient()
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    const order = await prisma.order.findFirst({
      where: {
        id: params.id,
        ...(userId && { userId: userId })
      },
      include: {
        asset: {
          select: {
            id: true,
            name: true,
            symbol: true,
            currentPrice: true,
            images: true
          }
        },
        trades: {
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(order)
  } catch (error) {
    console.error('Error fetching order:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/trading/orders/[id] - Update order (mainly for cancellation)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const prisma = await getPrismaClient()

    const body: UpdateOrderRequest = await request.json()
    const { status, quantity, price, userId } = body

    // Check if order exists and belongs to user
    const existingOrder = await prisma.order.findFirst({
      where: {
        id: params.id,
        ...(userId && { userId: userId })
      }
    })

    if (!existingOrder) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // Only allow updates to pending or partial orders
    if (!['pending', 'partial'].includes(existingOrder.status)) {
      return NextResponse.json(
        { error: 'Cannot update completed or cancelled orders' },
        { status: 400 }
      )
    }

    // Validate status transition
    if (status && !['pending', 'completed', 'cancelled', 'partial'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      )
    }

    // Prepare update data
    const updateData: any = {}

    if (status) {
      updateData.status = status

      // Set completion time for completed/cancelled orders
      if (['completed', 'cancelled'].includes(status)) {
        updateData.completedAt = new Date()
      }
    }

    if (quantity !== undefined) {
      if (quantity <= 0) {
        return NextResponse.json(
          { error: 'Quantity must be positive' },
          { status: 400 }
        )
      }
      updateData.quantity = quantity
      updateData.totalValue = quantity * (price || existingOrder.price)
    }

    if (price !== undefined) {
      if (price <= 0) {
        return NextResponse.json(
          { error: 'Price must be positive' },
          { status: 400 }
        )
      }
      updateData.price = price
      updateData.totalValue = (quantity || existingOrder.quantity) * price
    }

    updateData.updatedAt = new Date()

    // Update the order
    const updatedOrder = await prisma.order.update({
      where: { id: params.id },
      data: updateData,
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

    return NextResponse.json(updatedOrder)
  } catch (error) {
    console.error('Error updating order:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/trading/orders/[id] - Cancel order
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const prisma = await getPrismaClient()
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    // Check if order exists and belongs to user
    const existingOrder = await prisma.order.findFirst({
      where: {
        id: params.id,
        ...(userId && { userId: userId })
      }
    })

    if (!existingOrder) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // Only allow cancellation of pending or partial orders
    if (!['pending', 'partial'].includes(existingOrder.status)) {
      return NextResponse.json(
        { error: 'Cannot cancel completed or already cancelled orders' },
        { status: 400 }
      )
    }

    // Update order status to cancelled
    const cancelledOrder = await prisma.order.update({
      where: { id: params.id },
      data: {
        status: 'cancelled',
        completedAt: new Date(),
        updatedAt: new Date()
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

    return NextResponse.json(cancelledOrder)
  } catch (error) {
    console.error('Error cancelling order:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}