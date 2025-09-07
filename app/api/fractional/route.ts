import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/db'

/**
 * GET handler for fractional ownership endpoint
 * Retrieves all fractional ownership opportunities
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const assetId = searchParams.get('assetId')
    
    const where = assetId ? { assetId } : {}
    
    // Get Prisma client
    const prisma = await getPrismaClient();
    
    const fractionalShares = await prisma.fractionalOwnership.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        asset: true,
        owner: true
      }
    })
    
    return NextResponse.json({ fractionalShares })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch fractional shares' },
      { status: 500 }
    )
  }
}

/**
 * POST handler for creating fractional ownership
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Get Prisma client
    const prisma = await getPrismaClient();
    
    const fractionalShare = await prisma.fractionalOwnership.create({
      data: body
    })
    
    return NextResponse.json({ fractionalShare }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create fractional share' },
      { status: 500 }
    )
  }
}