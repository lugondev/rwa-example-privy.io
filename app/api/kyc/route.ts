import { PrismaClient } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const prisma = new PrismaClient()

// Validation schema for KYC submission
const kycSubmissionSchema = z.object({
  userId: z.string().min(1),
  documentType: z.enum(['passport', 'national_id', 'drivers_license']),
  documentNumber: z.string().min(1),
  issuingCountry: z.string().min(1),
  expiryDate: z.string().optional(),
  personalInfo: z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    dateOfBirth: z.string(),
    nationality: z.string().min(1),
    address: z.string().min(1),
    city: z.string().min(1),
    postalCode: z.string().min(1),
    country: z.string().min(1)
  }),
  documents: z.array(z.object({
    type: z.enum(['document_front', 'document_back', 'selfie', 'proof_of_address']),
    fileName: z.string(),
    fileSize: z.number(),
    mimeType: z.string(),
    base64Data: z.string()
  })).min(1)
})

// Validation schema for KYC status update
const updateKycStatusSchema = z.object({
  submissionId: z.string().min(1),
  status: z.enum(['pending', 'under_review', 'approved', 'rejected', 'requires_resubmission']),
  reviewNotes: z.string().optional(),
  rejectionReason: z.string().optional()
})

/**
 * POST /api/kyc
 * Submit KYC application with documents
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate request body
    const validationResult = kycSubmissionSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: validationResult.error.issues
        },
        { status: 400 }
      )
    }

    const { userId, documentType, documentNumber, issuingCountry, expiryDate, personalInfo, documents } = validationResult.data

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

    // Check if user already has a pending or approved KYC submission
    const existingSubmission = await prisma.kycSubmission.findFirst({
      where: {
        userId,
        status: {
          in: ['pending', 'under_review', 'approved']
        }
      }
    })

    if (existingSubmission) {
      return NextResponse.json(
        {
          error: 'User already has an active KYC submission',
          submissionId: existingSubmission.id,
          status: existingSubmission.status
        },
        { status: 409 }
      )
    }

    // Create KYC submission
    const kycSubmission = await prisma.kycSubmission.create({
      data: {
        userId,
        submissionType: 'individual',
        documentType,
        documentNumber,
        issuingCountry,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        personalInfo: JSON.stringify(personalInfo),
        status: 'pending',
        submittedAt: new Date()
      }
    })

    // Create document records
    const documentRecords = await Promise.all(
      documents.map(doc =>
        prisma.kycDocument.create({
          data: {
            submissionId: kycSubmission.id,
            documentType: doc.type,
            fileName: doc.fileName,
            fileSize: doc.fileSize,
            mimeType: doc.mimeType,
            fileUrl: `data:${doc.mimeType};base64,${doc.base64Data}`, // Store as data URL for now
            uploadedAt: new Date(),
            createdAt: new Date(),
            updatedAt: new Date()
          }
        })
      )
    )

    return NextResponse.json({
      message: 'KYC submission created successfully',
      submission: {
        id: kycSubmission.id,
        status: kycSubmission.status,
        submittedAt: kycSubmission.submittedAt,
        documents: documentRecords.map(doc => ({
          id: doc.id,
          type: doc.documentType,
          fileName: doc.fileName,
          uploadedAt: doc.uploadedAt
        }))
      }
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating KYC submission:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/kyc?userId=xxx
 * Get KYC submissions for a user
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Get user's KYC submissions
    const submissions = await prisma.kycSubmission.findMany({
      where: { userId },
      include: {
        documents: {
          select: {
            id: true,
            documentType: true,
            fileName: true,
            fileSize: true,
            mimeType: true,
            uploadedAt: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      submissions: submissions.map(submission => ({
        id: submission.id,
        documentType: submission.documentType,
        documentNumber: submission.documentNumber,
        issuingCountry: submission.issuingCountry,
        status: submission.status,
        submittedAt: submission.submittedAt,
        reviewedAt: submission.reviewedAt,
        reviewNotes: submission.reviewNotes,
        rejectionReason: submission.rejectionReason,
        documents: submission.documents,
        createdAt: submission.createdAt,
        updatedAt: submission.updatedAt
      }))
    })
  } catch (error) {
    console.error('Error fetching KYC submissions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/kyc
 * Update KYC submission status (admin only)
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate request body
    const validationResult = updateKycStatusSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: validationResult.error.issues
        },
        { status: 400 }
      )
    }

    const { submissionId, status, reviewNotes, rejectionReason } = validationResult.data

    // Check if submission exists
    const existingSubmission = await prisma.kycSubmission.findUnique({
      where: { id: submissionId }
    })

    if (!existingSubmission) {
      return NextResponse.json(
        { error: 'KYC submission not found' },
        { status: 404 }
      )
    }

    // Update submission status
    const updatedSubmission = await prisma.kycSubmission.update({
      where: { id: submissionId },
      data: {
        status,
        reviewedAt: new Date(),
        reviewNotes,
        rejectionReason: status === 'rejected' ? rejectionReason : null,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({
      message: 'KYC submission status updated successfully',
      submission: {
        id: updatedSubmission.id,
        status: updatedSubmission.status,
        reviewedAt: updatedSubmission.reviewedAt,
        reviewNotes: updatedSubmission.reviewNotes,
        rejectionReason: updatedSubmission.rejectionReason
      }
    })
  } catch (error) {
    console.error('Error updating KYC submission:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}