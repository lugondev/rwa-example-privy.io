'use client'

import { useState, useRef } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { 
  Upload, 
  File, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle,
  Download,
  Trash2,
  Eye
} from 'lucide-react'
import { DocumentType, VerificationDocument, VerificationStatus } from '@/types'
import { toast } from 'sonner'

interface UploadProgress {
  [key: string]: number
}

export function DocumentUpload() {
  const { user, updateKYCLevel } = useAuth()
  const [documents, setDocuments] = useState<VerificationDocument[]>(
    user?.verification_documents || []
  )
  const [uploading, setUploading] = useState<UploadProgress>({})
  const [selectedType, setSelectedType] = useState<DocumentType>('passport')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Simulate file upload with progress
  const simulateUpload = (file: File, documentId: string): Promise<string> => {
    return new Promise((resolve) => {
      let progress = 0
      const interval = setInterval(() => {
        progress += Math.random() * 30
        if (progress >= 100) {
          progress = 100
          clearInterval(interval)
          setUploading(prev => {
            const newState = { ...prev }
            delete newState[documentId]
            return newState
          })
          // Simulate file URL (in real app, this would be from cloud storage)
          resolve(`https://storage.example.com/documents/${documentId}-${file.name}`)
        }
        setUploading(prev => ({ ...prev, [documentId]: progress }))
      }, 200)
    })
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    const file = files[0]
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload only JPEG, PNG, or PDF files')
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB')
      return
    }

    const documentId = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    try {
      setUploading(prev => ({ ...prev, [documentId]: 0 }))
      
      const fileUrl = await simulateUpload(file, documentId)
      
      const newDocument: VerificationDocument = {
        id: documentId,
        user_id: user?.id || '',
        document_type: selectedType,
        file_name: file.name,
        file_url: fileUrl,
        upload_date: new Date().toISOString(),
        verification_status: 'pending',
        verified_at: undefined
      }

      setDocuments(prev => [...prev, newDocument])
      toast.success('Document uploaded successfully')
      
      // Auto-upgrade KYC level if sufficient documents
      const updatedDocs = [...documents, newDocument]
      const hasIdDocument = updatedDocs.some(doc => 
        ['passport', 'drivers_license', 'national_id'].includes(doc.document_type)
      )
      const hasProofOfAddress = updatedDocs.some(doc => 
        ['utility_bill', 'bank_statement'].includes(doc.document_type)
      )
      
      if (hasIdDocument && hasProofOfAddress) {
        await updateKYCLevel('enhanced')
      }
      
    } catch (error) {
      toast.error('Failed to upload document')
      setUploading(prev => {
        const newState = { ...prev }
        delete newState[documentId]
        return newState
      })
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleDeleteDocument = (documentId: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== documentId))
    toast.success('Document deleted')
  }

  const getStatusIcon = (status: VerificationStatus) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'expired':
        return <AlertCircle className="h-4 w-4 text-gray-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status: VerificationStatus) => {
    const variants = {
      approved: 'default',
      rejected: 'destructive',
      pending: 'secondary',
      expired: 'outline',
    } as const

    return (
      <Badge variant={variants[status] || 'outline'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const documentTypes: { value: DocumentType; label: string; description: string }[] = [
    {
      value: 'passport',
      label: 'Passport',
      description: 'Government-issued passport'
    },
    {
      value: 'drivers_license',
      label: "Driver's License",
      description: 'Valid driver\'s license'
    },
    {
      value: 'national_id',
      label: 'National ID',
      description: 'Government-issued national ID card'
    },
    {
      value: 'utility_bill',
      label: 'Utility Bill',
      description: 'Recent utility bill (within 3 months)'
    },
    {
      value: 'bank_statement',
      label: 'Bank Statement',
      description: 'Recent bank statement (within 3 months)'
    },
    {
      value: 'tax_document',
      label: 'Tax Document',
      description: 'Tax return or tax certificate'
    },
    {
      value: 'company_registration',
      label: 'Company Registration',
      description: 'Certificate of incorporation or business license'
    },
    {
      value: 'proof_of_address',
      label: 'Proof of Address',
      description: 'Address verification document'
    }
  ]

  const requiredDocuments = [
    { type: 'Identity Document', docs: ['passport', 'drivers_license', 'national_id'] },
    { type: 'Proof of Address', docs: ['utility_bill', 'bank_statement'] },
  ]

  const getCompletionStatus = () => {
    const hasIdDocument = documents.some(doc => 
      ['passport', 'drivers_license', 'national_id'].includes(doc.document_type) && 
      doc.verification_status === 'approved'
    )
    const hasProofOfAddress = documents.some(doc => 
      ['utility_bill', 'bank_statement'].includes(doc.document_type) && 
      doc.verification_status === 'approved'
    )
    
    if (hasIdDocument && hasProofOfAddress) return 'complete'
    if (hasIdDocument || hasProofOfAddress) return 'partial'
    return 'incomplete'
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Document Verification</h2>
        <p className="text-muted-foreground">
          Upload required documents to verify your identity and address
        </p>
      </div>

      {/* Requirements Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <File className="h-5 w-5" />
            Document Requirements
          </CardTitle>
          <CardDescription>
            Complete verification requires the following document types
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {requiredDocuments.map((requirement) => {
              const hasDocument = documents.some(doc => 
                requirement.docs.includes(doc.document_type) && doc.verification_status === 'approved'
              )
              return (
                <div key={requirement.type} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h4 className="font-medium">{requirement.type}</h4>
                    <p className="text-sm text-muted-foreground">
                      {requirement.docs.map(type => 
                        documentTypes.find(dt => dt.value === type)?.label
                      ).join(', ')}
                    </p>
                  </div>
                  {hasDocument ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <Clock className="h-5 w-5 text-yellow-500" />
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Document</CardTitle>
          <CardDescription>
            Select document type and upload a clear, readable file
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="document-type">Document Type</Label>
            <Select value={selectedType} onValueChange={(value: DocumentType) => setSelectedType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {documentTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div>
                      <div className="font-medium">{type.label}</div>
                      <div className="text-sm text-muted-foreground">{type.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="file-upload">Choose File</Label>
            <div className="flex items-center gap-4">
              <Input
                ref={fileInputRef}
                id="file-upload"
                type="file"
                accept=".jpg,.jpeg,.png,.pdf"
                onChange={handleFileUpload}
                className="flex-1"
              />
              <Button 
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                Browse
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Supported formats: JPEG, PNG, PDF. Maximum size: 10MB
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Upload Progress */}
      {Object.keys(uploading).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Uploading Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(uploading).map(([docId, progress]) => (
                <div key={docId} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Uploading...</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Uploaded Documents */}
      {documents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Uploaded Documents</CardTitle>
            <CardDescription>
              Manage your uploaded verification documents
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(doc.verification_status)}
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{doc.file_name}</h4>
                        {getStatusBadge(doc.verification_status)}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>
                          {documentTypes.find(dt => dt.value === doc.document_type)?.label || doc.document_type}
                        </span>
                        <span>Uploaded {new Date(doc.upload_date).toLocaleDateString()}</span>
                      </div>
                      {doc.verification_status === 'rejected' && (
                        <Alert className="mt-2">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            Document rejected. Please upload a new document.
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(doc.file_url, '_blank')}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const link = document.createElement('a')
                        link.href = doc.file_url
                        link.download = doc.file_name
                        link.click()
                      }}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteDocument(doc.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Verification Status */}
      <Card>
        <CardHeader>
          <CardTitle>Verification Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {(() => {
              const status = getCompletionStatus()
              if (status === 'complete') {
                return (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      All required documents have been verified. Your account is fully verified.
                    </AlertDescription>
                  </Alert>
                )
              } else if (status === 'partial') {
                return (
                  <Alert>
                    <Clock className="h-4 w-4" />
                    <AlertDescription>
                      Some documents are still pending verification. Please upload any missing required documents.
                    </AlertDescription>
                  </Alert>
                )
              } else {
                return (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Please upload the required identity and address verification documents to complete your verification.
                    </AlertDescription>
                  </Alert>
                )
              }
            })()}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}