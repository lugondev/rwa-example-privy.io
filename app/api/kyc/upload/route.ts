import { PrismaClient } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const prisma = new PrismaClient()

// Validation schema for document upload
const uploadDocumentSchema = z.object({
  submissionId: z.string().min(1),
  documentType: z.enum(['document_front', 'document_back', 'selfie', 'proof_of_address']),
  fileName: z.string().min(1),
  fileSize: z.number().min(1).max(10 * 1024 * 1024), // Max 10MB
  mimeType: z.string().regex(/^(image\/(jpeg|jpg|png|gif|webp)|application\/pdf)$/),
  base64Data: z.string().min(1)
})

/**
 * POST /api/kyc/upload
 * Upload individual KYC document
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate request body
    const validationResult = uploadDocumentSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: validationResult.error.issues
        },
        { status: 400 }
      )
    }

    const { submissionId, documentType, fileName, fileSize, mimeType, base64Data } = validationResult.data

    // Check if KYC submission exists
    const existingSubmission = await prisma.kycSubmission.findUnique({
      where: { id: submissionId }
    })

    if (!existingSubmission) {
      return NextResponse.json(
        { error: 'KYC submission not found' },
        { status: 404 }
      )
    }

    // Check if submission is still editable
    if (existingSubmission.status === 'approved') {
      return NextResponse.json(
        { error: 'Cannot upload documents to approved submission' },
        { status: 409 }
      )
    }

    // Check if document of this type already exists for this submission
    const existingDocument = await prisma.kycDocument.findFirst({
      where: {
        submissionId,
        documentType
      }
    })

    let document
    if (existingDocument) {
      // Update existing document
      document = await prisma.kycDocument.update({
        where: { id: existingDocument.id },
        data: {
          fileName,
          fileSize,
          mimeType,
          fileUrl: `data:${mimeType};base64,${base64Data}`,
          uploadedAt: new Date(),
          updatedAt: new Date()
        }
      })
    } else {
      // Create new document
      document = await prisma.kycDocument.create({
        data: {
          submissionId,
          documentType,
          fileName,
          fileSize,
          mimeType,
          fileUrl: `data:${mimeType};base64,${base64Data}`,
          uploadedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        }
      })
    }

    // Update submission's updatedAt timestamp
    await prisma.kycSubmission.update({
      where: { id: submissionId },
      data: { updatedAt: new Date() }
    })

    return NextResponse.json({
      message: 'Document uploaded successfully',
      document: {
        id: document.id,
        documentType: document.documentType,
        fileName: document.fileName,
        fileSize: document.fileSize,
        mimeType: document.mimeType,
        uploadedAt: document.uploadedAt
      }
    }, { status: 201 })
  } catch (error) {
    console.error('Error uploading document:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/kyc/upload?documentId=xxx
 * Delete a KYC document
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const documentId = searchParams.get('documentId')

    if (!documentId) {
      return NextResponse.json(
        { error: 'Document ID is required' },
        { status: 400 }
      )
    }

    // Check if document exists
    const existingDocument = await prisma.kycDocument.findUnique({
      where: { id: documentId },
      include: {
        submission: true
      }
    })

    if (!existingDocument) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      )
    }

    // Check if submission is still editable
    if (existingDocument.submission.status === 'approved') {
      return NextResponse.json(
        { error: 'Cannot delete documents from approved submission' },
        { status: 409 }
      )
    }

    // Delete document
    await prisma.kycDocument.delete({
      where: { id: documentId }
    })

    // Update submission's updatedAt timestamp
    await prisma.kycSubmission.update({
      where: { id: existingDocument.submissionId },
      data: { updatedAt: new Date() }
    })

    return NextResponse.json({
      message: 'Document deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting document:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/kyc/upload?submissionId=xxx
 * Get all documents for a KYC submission
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const submissionId = searchParams.get('submissionId')

    if (!submissionId) {
      return NextResponse.json(
        { error: 'Submission ID is required' },
        { status: 400 }
      )
    }

    // Get documents for submission
    const documents = await prisma.kycDocument.findMany({
      where: { submissionId },
      select: {
        id: true,
        documentType: true,
        fileName: true,
        fileSize: true,
        mimeType: true,
        uploadedAt: true,
        createdAt: true,
        updatedAt: true
        // Note: fileUrl is excluded for security reasons
      },
      orderBy: { uploadedAt: 'desc' }
    })

    return NextResponse.json({
      documents
    })
  } catch (error) {
    console.error('Error fetching documents:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}