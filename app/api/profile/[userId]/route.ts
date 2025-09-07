import { PrismaClient } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const prisma = new PrismaClient()

// Validation schema for user profile update
const updateProfileSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  dateOfBirth: z.string().optional(),
  phoneNumber: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
  nationality: z.string().optional(),
  occupation: z.string().optional(),
  annualIncome: z.number().optional(),
  investmentExperience: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  riskTolerance: z.enum(['low', 'medium', 'high']).optional(),
  investmentGoals: z.array(z.string()).optional(),
  preferredLanguage: z.string().optional(),
  timezone: z.string().optional(),
  avatarUrl: z.string().url().optional(),
  bio: z.string().optional()
})

/**
 * GET /api/profile/[userId]
 * Retrieve user profile information
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params
    console.log('GET /api/profile/[userId] - Request received:', { userId, params })

    if (!userId) {
      console.log('GET /api/profile/[userId] - Error: User ID is required')
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Get user with profile
    console.log('GET /api/profile/[userId] - Searching for user:', userId)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        kycSubmissions: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            documents: true
          }
        }
      }
    })

    console.log('GET /api/profile/[userId] - User found:', !!user, user ? { id: user.id, email: user.email } : null)

    if (!user) {
      console.log('GET /api/profile/[userId] - Error: User not found in database')
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Return user profile data
    const profileData = {
      id: user.id,
      email: user.email,
      walletAddress: user.walletAddress,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      profile: user.profile,
      kycStatus: user.kycSubmissions[0]?.status || 'not_started',
      kycSubmission: user.kycSubmissions[0] || null
    }

    console.log('GET /api/profile/[userId] - Success, returning profile data')
    return NextResponse.json(profileData)
  } catch (error) {
    console.error('GET /api/profile/[userId] - Error fetching user profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/profile/[userId]
 * Update user profile information
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params
    const body = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Validate request body
    const validationResult = updateProfileSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: validationResult.error.issues
        },
        { status: 400 }
      )
    }

    const profileData = validationResult.data

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true }
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Convert investmentGoals array to string if needed
    const processedData = {
      ...profileData,
      investmentGoals: Array.isArray(profileData.investmentGoals)
        ? profileData.investmentGoals.join(', ')
        : profileData.investmentGoals
    }

    // Update or create user profile
    const updatedProfile = await prisma.userProfile.upsert({
      where: { userId },
      update: {
        ...processedData,
        updatedAt: new Date()
      },
      create: {
        userId,
        ...processedData,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })

    // Update user's updatedAt timestamp
    await prisma.user.update({
      where: { id: userId },
      data: { updatedAt: new Date() }
    })

    return NextResponse.json({
      message: 'Profile updated successfully',
      profile: updatedProfile
    })
  } catch (error) {
    console.error('Error updating user profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/profile/[userId]
 * Delete user account and all associated data
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Delete user and all related data (cascade delete)
    // Note: Prisma will handle cascade deletes based on schema relationships
    await prisma.user.delete({
      where: { id: userId }
    })

    return NextResponse.json({
      message: 'User account deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting user account:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}