/**
 * React hooks for KYC management
 */

import { kycApi } from '@/lib/utils/api'
import { compressImage, DocumentType, fileToBase64, validateFile } from '@/lib/utils/kyc'
import { usePrivy } from '@privy-io/react-auth'
import { useCallback, useEffect, useState } from 'react'

export interface KycSubmission {
  id: string
  userId: string
  status: 'pending' | 'under_review' | 'approved' | 'rejected'
  personalInfo: {
    firstName: string
    lastName: string
    dateOfBirth: string
    nationality: string
    address: string
    city: string
    postalCode: string
    country: string
  }
  documents: KycDocument[]
  reviewNotes?: string
  submittedAt: string
  reviewedAt?: string
  createdAt: string
  updatedAt: string
}

export interface KycDocument {
  id: string
  submissionId: string
  type: 'passport' | 'drivers_license' | 'national_id' | 'utility_bill' | 'bank_statement'
  fileName: string
  fileSize: number
  mimeType: string
  documentData: string // base64 encoded
  uploadedAt: string
}

export interface UseKycReturn {
  submissions: KycSubmission[]
  currentSubmission: KycSubmission | null
  loading: boolean
  error: string | null
  submitKyc: (data: Partial<KycSubmission>) => Promise<boolean>
  uploadDocument: (file: File, type: KycDocument['type'], submissionId?: string) => Promise<boolean>
  deleteDocument: (documentId: string) => Promise<boolean>
  refreshSubmissions: () => Promise<void>
}

/**
 * Hook for managing KYC submissions and documents
 */
export function useKyc(): UseKycReturn {
  const { user, authenticated } = usePrivy()
  const [submissions, setSubmissions] = useState<KycSubmission[]>([])
  const [currentSubmission, setCurrentSubmission] = useState<KycSubmission | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Fetch KYC submissions from API
   */
  const fetchSubmissions = useCallback(async () => {
    if (!authenticated || !user?.id) {
      setSubmissions([])
      setCurrentSubmission(null)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await kycApi.getKycSubmissions(user.id)

      if (response.error) {
        setError(response.error)
        setSubmissions([])
        setCurrentSubmission(null)
      } else {
        const submissionsList = response.data || []
        setSubmissions(submissionsList)

        // Set current submission to the latest one
        const latest = submissionsList.length > 0 ? submissionsList[0] : null
        setCurrentSubmission(latest)
      }
    } catch (err) {
      setError('Failed to fetch KYC submissions')
      setSubmissions([])
      setCurrentSubmission(null)
    } finally {
      setLoading(false)
    }
  }, [authenticated, user?.id])

  /**
   * Submit new KYC application
   */
  const submitKyc = useCallback(async (data: Partial<KycSubmission>): Promise<boolean> => {
    if (!authenticated || !user?.id) {
      setError('User not authenticated')
      return false
    }

    setLoading(true)
    setError(null)

    try {
      const kycData = {
        userId: user.id,
        ...data
      }

      const response = await kycApi.submitKyc(kycData)

      if (response.error) {
        setError(response.error)
        return false
      }

      // Refresh submissions to get the new one
      await fetchSubmissions()
      return true
    } catch (err) {
      setError('Failed to submit KYC application')
      return false
    } finally {
      setLoading(false)
    }
  }, [authenticated, user?.id, fetchSubmissions])

  /**
   * Upload KYC document
   */
  const uploadDocument = useCallback(async (
    file: File,
    type: KycDocument['type'],
    submissionId?: string
  ): Promise<boolean> => {
    if (!authenticated || !user?.id) {
      setError('User not authenticated')
      return false
    }

    // Validate file - map KYC document type to DocumentType
    const documentTypeMap: Record<KycDocument['type'], DocumentType> = {
      'passport': 'document_front',
      'drivers_license': 'document_front',
      'national_id': 'document_front',
      'utility_bill': 'proof_of_address',
      'bank_statement': 'proof_of_address'
    }

    const documentType = documentTypeMap[type] || 'document_front'
    const validation = validateFile(file, documentType)
    if (!validation.isValid) {
      setError(validation.error || 'Invalid file')
      return false
    }

    setLoading(true)
    setError(null)

    try {
      // Compress image if it's an image file
      let processedFile = file
      if (file.type.startsWith('image/')) {
        processedFile = await compressImage(file)
      }

      // Convert to base64
      const base64Data = await fileToBase64(processedFile)

      const documentData = {
        submissionId: submissionId || currentSubmission?.id,
        type,
        fileName: processedFile.name,
        fileSize: processedFile.size,
        mimeType: processedFile.type,
        documentData: base64Data
      }

      const response = await kycApi.uploadDocument(documentData)

      if (response.error) {
        setError(response.error)
        return false
      }

      // Refresh submissions to get updated documents
      await fetchSubmissions()
      return true
    } catch (err) {
      setError('Failed to upload document')
      return false
    } finally {
      setLoading(false)
    }
  }, [authenticated, user?.id, currentSubmission?.id, fetchSubmissions])

  /**
   * Delete KYC document
   */
  const deleteDocument = useCallback(async (documentId: string): Promise<boolean> => {
    if (!authenticated || !user?.id) {
      setError('User not authenticated')
      return false
    }

    setLoading(true)
    setError(null)

    try {
      const response = await kycApi.deleteDocument(documentId)

      if (response.error) {
        setError(response.error)
        return false
      }

      // Refresh submissions to get updated documents
      await fetchSubmissions()
      return true
    } catch (err) {
      setError('Failed to delete document')
      return false
    } finally {
      setLoading(false)
    }
  }, [authenticated, user?.id, fetchSubmissions])

  /**
   * Refresh submissions data
   */
  const refreshSubmissions = useCallback(async () => {
    await fetchSubmissions()
  }, [fetchSubmissions])

  // Fetch submissions on mount and when user changes
  useEffect(() => {
    fetchSubmissions()
  }, [fetchSubmissions])

  return {
    submissions,
    currentSubmission,
    loading,
    error,
    submitKyc,
    uploadDocument,
    deleteDocument,
    refreshSubmissions
  }
}

/**
 * Hook for managing KYC document upload with drag & drop
 */
export function useKycDocumentUpload(submissionId?: string) {
  const { uploadDocument, deleteDocument, loading, error } = useKyc()
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})
  const [uploadErrors, setUploadErrors] = useState<Record<string, string>>({})

  /**
   * Handle multiple file uploads
   */
  const handleFilesUpload = useCallback(async (
    files: File[],
    type: KycDocument['type']
  ): Promise<boolean> => {
    const results: boolean[] = []

    for (const file of files) {
      const fileId = `${file.name}-${Date.now()}`

      try {
        setUploadProgress(prev => ({ ...prev, [fileId]: 0 }))
        setUploadErrors(prev => ({ ...prev, [fileId]: '' }))

        // Simulate upload progress
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => {
            const current = prev[fileId] || 0
            if (current < 90) {
              return { ...prev, [fileId]: current + 10 }
            }
            return prev
          })
        }, 100)

        const success = await uploadDocument(file, type, submissionId)

        clearInterval(progressInterval)

        if (success) {
          setUploadProgress(prev => ({ ...prev, [fileId]: 100 }))
          // Remove progress after success
          setTimeout(() => {
            setUploadProgress(prev => {
              const { [fileId]: _, ...rest } = prev
              return rest
            })
          }, 1000)
        } else {
          setUploadErrors(prev => ({ ...prev, [fileId]: error || 'Upload failed' }))
        }

        results.push(success)
      } catch (err) {
        setUploadErrors(prev => ({ ...prev, [fileId]: 'Upload failed' }))
        results.push(false)
      }
    }

    return results.every(result => result)
  }, [uploadDocument, deleteDocument, submissionId, error])

  /**
   * Clear upload errors
   */
  const clearUploadErrors = useCallback(() => {
    setUploadErrors({})
  }, [])

  return {
    handleFilesUpload,
    uploadProgress,
    uploadErrors,
    clearUploadErrors,
    loading
  }
}

/**
 * Hook for KYC status tracking
 */
export function useKycStatus() {
  const { currentSubmission, loading, error } = useKyc()

  const getStatusInfo = useCallback(() => {
    if (!currentSubmission) {
      return {
        status: 'not_started',
        message: 'KYC verification not started',
        canSubmit: true,
        canUpload: false
      }
    }

    switch (currentSubmission.status) {
      case 'pending':
        return {
          status: 'pending',
          message: 'KYC application submitted, waiting for review',
          canSubmit: false,
          canUpload: true
        }
      case 'under_review':
        return {
          status: 'under_review',
          message: 'KYC application is under review',
          canSubmit: false,
          canUpload: false
        }
      case 'approved':
        return {
          status: 'approved',
          message: 'KYC verification approved',
          canSubmit: false,
          canUpload: false
        }
      case 'rejected':
        return {
          status: 'rejected',
          message: currentSubmission.reviewNotes || 'KYC application rejected',
          canSubmit: true,
          canUpload: true
        }
      default:
        return {
          status: 'unknown',
          message: 'Unknown KYC status',
          canSubmit: false,
          canUpload: false
        }
    }
  }, [currentSubmission])

  return {
    submission: currentSubmission,
    statusInfo: getStatusInfo(),
    loading,
    error
  }
}