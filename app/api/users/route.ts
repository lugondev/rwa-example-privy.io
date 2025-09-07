import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/db'

/**
 * GET handler for users endpoint
 * Retrieves user profile information
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const walletAddress = searchParams.get('walletAddress')
    
    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      )
    }
    
    // Get Prisma client
    const prisma = await getPrismaClient();
    
    const user = await prisma.user.findUnique({
      where: { walletAddress },
      include: {
        ownedAssets: true,
        managedVaults: true,
        fractionalOwnerships: true
      }
    })
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ user })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    )
  }
}

/**
 * POST handler for creating or updating user profile
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { walletAddress, ...userData } = body
    
    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      )
    }
    
    // Get Prisma client
    const prisma = await getPrismaClient();
    
    const user = await prisma.user.upsert({
      where: { walletAddress },
      update: userData,
      create: {
        walletAddress,
        ...userData
      }
    })
    
    return NextResponse.json({ user }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create/update user' },
      { status: 500 }
    )
  }
}