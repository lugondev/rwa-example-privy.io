import { PrismaClient } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const prisma = new PrismaClient()

// Validation schema for creating notification
const createNotificationSchema = z.object({
  userId: z.string().min(1),
  type: z.enum(['kyc_update', 'trade_executed', 'vault_update', 'lending_update', 'system_alert', 'security_alert']),
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(1000),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  metadata: z.record(z.string(), z.any()).optional()
})

// Validation schema for marking notifications as read
const markAsReadSchema = z.object({
  notificationIds: z.array(z.string()).min(1)
})

/**
 * GET /api/notifications?userId=xxx&limit=20&offset=0&unreadOnly=false
 * Get notifications for a user
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')
    const unreadOnly = searchParams.get('unreadOnly') === 'true'

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Validate limit and offset
    if (limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: 'Limit must be between 1 and 100' },
        { status: 400 }
      )
    }

    if (offset < 0) {
      return NextResponse.json(
        { error: 'Offset must be non-negative' },
        { status: 400 }
      )
    }

    // Build where clause
    const whereClause: any = { userId }
    if (unreadOnly) {
      whereClause.readAt = null
    }

    // Get notifications
    const [notifications, totalCount, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      }),
      prisma.notification.count({
        where: { userId }
      }),
      prisma.notification.count({
        where: {
          userId,
          readAt: null
        }
      })
    ])

    return NextResponse.json({
      notifications,
      pagination: {
        total: totalCount,
        unread: unreadCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      }
    })
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/notifications
 * Create a new notification
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate request body
    const validationResult = createNotificationSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: validationResult.error.issues
        },
        { status: 400 }
      )
    }

    const { userId, type, title, message, priority, metadata } = validationResult.data

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

    // Create notification
    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        priority,
        metadata: JSON.stringify(metadata || {}),
        createdAt: new Date()
      }
    })

    return NextResponse.json({
      message: 'Notification created successfully',
      notification
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating notification:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/notifications
 * Mark notifications as read
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate request body
    const validationResult = markAsReadSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: validationResult.error.issues
        },
        { status: 400 }
      )
    }

    const { notificationIds } = validationResult.data

    // Update notifications as read
    const updateResult = await prisma.notification.updateMany({
      where: {
        id: {
          in: notificationIds
        },
        readAt: null // Only update unread notifications
      },
      data: {
        readAt: new Date()
      }
    })

    return NextResponse.json({
      message: 'Notifications marked as read',
      updatedCount: updateResult.count
    })
  } catch (error) {
    console.error('Error marking notifications as read:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/notifications?userId=xxx&notificationIds=id1,id2,id3
 * Delete notifications
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const notificationIdsParam = searchParams.get('notificationIds')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    if (!notificationIdsParam) {
      return NextResponse.json(
        { error: 'Notification IDs are required' },
        { status: 400 }
      )
    }

    const notificationIds = notificationIdsParam.split(',')

    if (notificationIds.length === 0) {
      return NextResponse.json(
        { error: 'At least one notification ID is required' },
        { status: 400 }
      )
    }

    // Delete notifications (only user's own notifications)
    const deleteResult = await prisma.notification.deleteMany({
      where: {
        id: {
          in: notificationIds
        },
        userId // Ensure user can only delete their own notifications
      }
    })

    return NextResponse.json({
      message: 'Notifications deleted successfully',
      deletedCount: deleteResult.count
    })
  } catch (error) {
    console.error('Error deleting notifications:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}