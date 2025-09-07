import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/db'

/**
 * GET handler for lending endpoint
 * Retrieves all lending opportunities with pagination
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status')
    
    const where = status ? { status } : {}
    
    // Get Prisma client
    const prisma = await getPrismaClient();
    
    const lendingOpportunities = await prisma.lendingPool.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        asset: true
      }
    })
    
    return NextResponse.json({ lendingOpportunities })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch lending opportunities' },
      { status: 500 }
    )
  }
}

/**
 * POST handler for creating new lending opportunity
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Get Prisma client
    const prisma = await getPrismaClient();
    
    const lendingOpportunity = await prisma.lendingPool.create({
      data: body
    })
    
    return NextResponse.json({ lendingOpportunity }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create lending opportunity' },
      { status: 500 }
    )
  }
}