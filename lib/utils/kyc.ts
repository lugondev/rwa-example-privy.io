/**
 * KYC Document Processing Utilities
 * Handles file validation, conversion, and processing for KYC submissions
 */

// Supported file types for KYC documents
export const SUPPORTED_FILE_TYPES = {
  image: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
  document: ['application/pdf']
}

// Maximum file sizes (in bytes)
export const MAX_FILE_SIZES = {
  image: 10 * 1024 * 1024, // 10MB
  document: 20 * 1024 * 1024 // 20MB
}

// Document type configurations
export const DOCUMENT_TYPES = {
  document_front: {
    label: 'Document Front',
    description: 'Front side of your ID document',
    required: true,
    acceptedTypes: [...SUPPORTED_FILE_TYPES.image, ...SUPPORTED_FILE_TYPES.document]
  },
  document_back: {
    label: 'Document Back',
    description: 'Back side of your ID document',
    required: true,
    acceptedTypes: [...SUPPORTED_FILE_TYPES.image, ...SUPPORTED_FILE_TYPES.document]
  },
  selfie: {
    label: 'Selfie',
    description: 'A clear photo of yourself',
    required: true,
    acceptedTypes: SUPPORTED_FILE_TYPES.image
  },
  proof_of_address: {
    label: 'Proof of Address',
    description: 'Utility bill or bank statement (max 3 months old)',
    required: false,
    acceptedTypes: [...SUPPORTED_FILE_TYPES.image, ...SUPPORTED_FILE_TYPES.document]
  }
} as const

export type DocumentType = keyof typeof DOCUMENT_TYPES

/**
 * Validate file type and size
 */
export function validateFile(file: File, documentType: DocumentType): { isValid: boolean; error?: string } {
  const config = DOCUMENT_TYPES[documentType]

  // Check file type
  if (!config.acceptedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: `Invalid file type. Accepted types: ${config.acceptedTypes.join(', ')}`
    }
  }

  // Check file size
  const isImage = SUPPORTED_FILE_TYPES.image.includes(file.type)
  const maxSize = isImage ? MAX_FILE_SIZES.image : MAX_FILE_SIZES.document

  if (file.size > maxSize) {
    const maxSizeMB = Math.round(maxSize / (1024 * 1024))
    return {
      isValid: false,
      error: `File size too large. Maximum size: ${maxSizeMB}MB`
    }
  }

  return { isValid: true }
}

/**
 * Convert file to base64 string
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => {
      const result = reader.result as string
      // Remove data URL prefix (e.g., "data:image/jpeg;base64,")
      const base64 = result.split(',')[1]
      resolve(base64)
    }

    reader.onerror = () => {
      reject(new Error('Failed to read file'))
    }

    reader.readAsDataURL(file)
  })
}

/**
 * Compress image file if it's too large
 */
export function compressImage(file: File, maxWidth: number = 1920, quality: number = 0.8): Promise<File> {
  return new Promise((resolve, reject) => {
    // Only compress images
    if (!SUPPORTED_FILE_TYPES.image.includes(file.type)) {
      resolve(file)
      return
    }

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    img.onload = () => {
      // Calculate new dimensions
      const ratio = Math.min(maxWidth / img.width, maxWidth / img.height)
      const newWidth = img.width * ratio
      const newHeight = img.height * ratio

      // Set canvas dimensions
      canvas.width = newWidth
      canvas.height = newHeight

      // Draw and compress
      ctx?.drawImage(img, 0, 0, newWidth, newHeight)

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now()
            })
            resolve(compressedFile)
          } else {
            reject(new Error('Failed to compress image'))
          }
        },
        file.type,
        quality
      )
    }

    img.onerror = () => {
      reject(new Error('Failed to load image'))
    }

    img.src = URL.createObjectURL(file)
  })
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2)
}

/**
 * Generate unique filename with timestamp
 */
export function generateUniqueFilename(originalName: string, userId: string): string {
  const timestamp = Date.now()
  const extension = getFileExtension(originalName)
  const baseName = originalName.replace(/\.[^/.]+$/, '')

  return `${userId}_${baseName}_${timestamp}.${extension}`
}

/**
 * Validate KYC document file
 */
export function validateKycDocument(file: File, documentType: DocumentType): { isValid: boolean; error?: string } {
  return validateFile(file, documentType)
}

/**
 * Validate KYC submission data
 */
export function validateKycSubmission(data: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  // Required fields validation
  if (!data.documentType) {
    errors.push('Document type is required')
  }

  if (!data.documentNumber) {
    errors.push('Document number is required')
  }

  if (!data.issuingCountry) {
    errors.push('Issuing country is required')
  }

  if (!data.personalInfo) {
    errors.push('Personal information is required')
  } else {
    const { firstName, lastName, dateOfBirth, nationality, address, city, postalCode, country } = data.personalInfo

    if (!firstName) errors.push('First name is required')
    if (!lastName) errors.push('Last name is required')
    if (!dateOfBirth) errors.push('Date of birth is required')
    if (!nationality) errors.push('Nationality is required')
    if (!address) errors.push('Address is required')
    if (!city) errors.push('City is required')
    if (!postalCode) errors.push('Postal code is required')
    if (!country) errors.push('Country is required')
  }

  // Document validation
  if (!data.documents || !Array.isArray(data.documents) || data.documents.length === 0) {
    errors.push('At least one document is required')
  } else {
    // Check for required document types
    const documentTypes = data.documents.map((doc: any) => doc.type)
    const requiredTypes = Object.entries(DOCUMENT_TYPES)
      .filter(([_, config]) => config.required)
      .map(([type, _]) => type)

    for (const requiredType of requiredTypes) {
      if (!documentTypes.includes(requiredType)) {
        errors.push(`${DOCUMENT_TYPES[requiredType as DocumentType].label} is required`)
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Get KYC status display information
 */
export function getKycStatusInfo(status: string) {
  const statusMap = {
    not_started: {
      label: 'Not Started',
      color: 'gray',
      description: 'KYC verification has not been started'
    },
    pending: {
      label: 'Pending',
      color: 'yellow',
      description: 'KYC submission is pending review'
    },
    under_review: {
      label: 'Under Review',
      color: 'blue',
      description: 'Your documents are being reviewed'
    },
    approved: {
      label: 'Approved',
      color: 'green',
      description: 'KYC verification completed successfully'
    },
    rejected: {
      label: 'Rejected',
      color: 'red',
      description: 'KYC verification was rejected'
    },
    requires_resubmission: {
      label: 'Requires Resubmission',
      color: 'orange',
      description: 'Additional documents or information required'
    }
  }

  return statusMap[status as keyof typeof statusMap] || statusMap.not_started
}