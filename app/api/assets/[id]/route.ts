import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/db'

/**
 * GET handler for specific asset
 * Retrieves asset by ID with related data
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const prisma = await getPrismaClient()
    const { id } = await params
    const asset = await prisma.asset.findUnique({
      where: { id },
      include: {
        vault: true,
        fractionalOwnerships: true,
        lendingPools: true,
        oraclePrices: true
      }
    })
    
    if (!asset) {
      return NextResponse.json(
        { error: 'Asset not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ asset })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch asset' },
      { status: 500 }
    )
  }
}

/**
 * PUT handler for updating asset
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const prisma = await getPrismaClient()
    const { id } = await params
    const body = await request.json()
    
    const asset = await prisma.asset.update({
      where: { id },
      data: body
    })
    
    return NextResponse.json({ asset })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update asset' },
      { status: 500 }
    )
  }
}

/**
 * DELETE handler for removing asset
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const prisma = await getPrismaClient()
    const { id } = await params
    await prisma.asset.delete({
      where: { id }
    })
    
    return NextResponse.json({ message: 'Asset deleted successfully' })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete asset' },
      { status: 500 }
    )
  }
}