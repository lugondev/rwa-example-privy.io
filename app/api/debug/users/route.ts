import { PrismaClient } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'

const prisma = new PrismaClient()

/**
 * GET /api/debug/users
 * Debug endpoint to check all users in database
 */
export async function GET(request: NextRequest) {
  try {
    console.log('DEBUG: Checking all users in database')
    
    // Get all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        walletAddress: true,
        createdAt: true,
        profile: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      },
      take: 10 // Limit to first 10 users
    })

    const userCount = await prisma.user.count()
    
    console.log('DEBUG: Found users:', {
      count: userCount,
      users: users.map(u => ({ id: u.id, email: u.email, walletAddress: u.walletAddress }))
    })

    return NextResponse.json({
      success: true,
      totalUsers: userCount,
      users: users,
      message: `Found ${userCount} users in database`
    })
  } catch (error) {
    console.error('DEBUG: Error checking users:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to check users',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}