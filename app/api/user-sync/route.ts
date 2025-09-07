import { PrismaClient } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const prisma = new PrismaClient()

// Schema for user sync request
const syncUserSchema = z.object({
  id: z.string().min(1, 'User ID is required'),
  email: z.string().email('Valid email is required').optional(),
  walletAddress: z.string().min(1, 'Wallet address is required').optional(),
})

/**
 * POST /api/auth/sync-user
 * Create or update user record when authenticating with Privy
 */
export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/auth/sync-user - Request received')
    
    const body = await request.json()
    console.log('POST /api/auth/sync-user - Request body:', body)
    
    // Validate request body
    const validatedData = syncUserSchema.parse(body)
    console.log('POST /api/auth/sync-user - Validated data:', validatedData)
    
    const { id, email, walletAddress } = validatedData
    
    // Check if user already exists
    console.log('POST /api/auth/sync-user - Checking if user exists:', id)
    const existingUser = await prisma.user.findUnique({
      where: { id },
      include: {
        profile: true
      }
    })
    
    if (existingUser) {
      console.log('POST /api/auth/sync-user - User already exists:', existingUser.id)
      return NextResponse.json({
        success: true,
        user: existingUser,
        message: 'User already exists'
      })
    }
    
    // Create new user
    console.log('POST /api/auth/sync-user - Creating new user')
    const newUser = await prisma.user.create({
      data: {
        id,
        email: email || null,
        walletAddress: walletAddress || null,
        kycStatus: 'pending',
        complianceStatus: 'pending'
      },
      include: {
        profile: true
      }
    })
    
    console.log('POST /api/auth/sync-user - User created successfully:', newUser.id)
    
    return NextResponse.json({
      success: true,
      user: newUser,
      message: 'User created successfully'
    })
    
  } catch (error) {
    console.error('POST /api/auth/sync-user - Error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Validation error',
          details: error.errors
        },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to sync user',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/auth/sync-user
 * Check if user exists in database
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      )
    }
    
    console.log('GET /api/auth/sync-user - Checking user:', userId)
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true
      }
    })
    
    return NextResponse.json({
      success: true,
      exists: !!user,
      user: user || null
    })
    
  } catch (error) {
    console.error('GET /api/auth/sync-user - Error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to check user',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}