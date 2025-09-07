'use client'

import {useState, useEffect, useCallback} from 'react'
import {usePrivy} from '@privy-io/react-auth'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {Label} from '@/components/ui/label'
import {Input} from '@/components/ui/input'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {Progress} from '@/components/ui/progress'
import {Badge} from '@/components/ui/badge'
import {Separator} from '@/components/ui/separator'
import {Alert, AlertDescription} from '@/components/ui/alert'
import {toast} from 'sonner'
import {ArrowLeft, Upload, FileText, CheckCircle, XCircle, Clock, AlertTriangle, Eye, Download, Trash2, Loader2} from 'lucide-react'
import Link from 'next/link'
import {useRouter} from 'next/navigation'
import {useDropzone} from 'react-dropzone'
import {AuthenticatedLayout} from '@/components/layout/AppLayout'
import {useKyc, useKycDocumentUpload, useKycStatus} from '@/lib/hooks/useKyc'
import {validateKycDocument, formatFileSize} from '@/lib/utils/kyc'

type KycStatus = 'not_started' | 'pending' | 'under_review' | 'approved' | 'rejected' | 'expired'
type DocumentType = 'passport' | 'drivers_license' | 'national_id' | 'proof_of_address' | 'bank_statement'

interface KycDocument {
	id: string
	type: DocumentType
	fileName: string
	fileSize: number
	uploadedAt: string
	status: 'uploaded' | 'verified' | 'rejected'
	rejectionReason?: string
	url?: string
}

interface KycSubmission {
	id?: string
	userId: string
	status: KycStatus
	submittedAt?: string
	reviewedAt?: string
	expiresAt?: string
	rejectionReason?: string
	documents: KycDocument[]
	// Personal information
	firstName: string
	lastName: string
	dateOfBirth: string
	nationality: string
	address: string
	city: string
	postalCode: string
	country: string
	phoneNumber: string
}

const documentTypeLabels: Record<DocumentType, string> = {
	passport: 'Passport',
	drivers_license: "Driver's License",
	national_id: 'National ID',
	proof_of_address: 'Proof of Address',
	bank_statement: 'Bank Statement',
}

const statusColors: Record<KycStatus, string> = {
	not_started: 'bg-gray-500',
	pending: 'bg-yellow-500',
	under_review: 'bg-blue-500',
	approved: 'bg-green-500',
	rejected: 'bg-red-500',
	expired: 'bg-orange-500',
}

const statusIcons: Record<KycStatus, React.ReactNode> = {
	not_started: <FileText className='h-4 w-4' />,
	pending: <Clock className='h-4 w-4' />,
	under_review: <Eye className='h-4 w-4' />,
	approved: <CheckCircle className='h-4 w-4' />,
	rejected: <XCircle className='h-4 w-4' />,
	expired: <AlertTriangle className='h-4 w-4' />,
}

/**
 * KYC Workflow Page Component
 * Handles Know Your Customer verification process with document upload
 */
export default function KycPage() {
	const {user, authenticated} = usePrivy()
	const router = useRouter()
	const [kycData, setKycData] = useState<KycSubmission>({
		userId: '',
		status: 'not_started',
		documents: [],
		firstName: '',
		lastName: '',
		dateOfBirth: '',
		nationality: '',
		address: '',
		city: '',
		postalCode: '',
		country: '',
		phoneNumber: '',
	})
	const [isLoading, setIsLoading] = useState(true)
	const [isSaving, setIsSaving] = useState(false)
	const [currentStep, setCurrentStep] = useState(1)
	const [uploadingDocument, setUploadingDocument] = useState<DocumentType | null>(null)

	// Redirect if not authenticated
	useEffect(() => {
		if (!authenticated) {
			router.push('/login')
			return
		}
	}, [authenticated, router])

	// Load existing KYC data
	useEffect(() => {
		const loadKycData = async () => {
			if (!user?.id) return

			try {
				const response = await fetch(`/api/profile/${user.id}/kyc`)
				if (response.ok) {
					const data = await response.json()
					setKycData(data)
					// Set current step based on status
					if (data.status === 'not_started') {
						setCurrentStep(1)
					} else if (data.documents.length === 0) {
						setCurrentStep(2)
					} else {
						setCurrentStep(3)
					}
				} else {
					setKycData((prev) => ({...prev, userId: user.id}))
				}
			} catch (error) {
				console.error('Error loading KYC data:', error)
				setKycData((prev) => ({...prev, userId: user.id}))
			} finally {
				setIsLoading(false)
			}
		}

		loadKycData()
	}, [user?.id])

	// Handle form field changes
	const handleFieldChange = (field: keyof KycSubmission, value: string) => {
		setKycData((prev) => ({...prev, [field]: value}))
	}

	// Handle personal information save
	const handleSavePersonalInfo = async () => {
		if (!user?.id) return

		setIsSaving(true)
		try {
			const response = await fetch(`/api/profile/${user.id}/kyc`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					...kycData,
					status: 'pending',
				}),
			})

			if (response.ok) {
				const updatedData = await response.json()
				setKycData(updatedData)
				setCurrentStep(2)
				toast.success('Personal information saved successfully')
			} else {
				throw new Error('Failed to save personal information')
			}
		} catch (error) {
			console.error('Error saving personal info:', error)
			toast.error('Failed to save personal information')
		} finally {
			setIsSaving(false)
		}
	}

	// Handle document upload
	const onDrop = useCallback(
		async (acceptedFiles: File[], documentType: DocumentType) => {
			if (!user?.id || acceptedFiles.length === 0) return

			const file = acceptedFiles[0]

			// Validate file using utility function
			const validation = validateKycDocument(file, 'document_front') // Default document type
			if (!validation.isValid) {
				toast.error(validation.error || 'Invalid file')
				return
			}

			setUploadingDocument(documentType)

			try {
				const formData = new FormData()
				formData.append('file', file)
				formData.append('documentType', documentType)
				formData.append('userId', user.id)

				const response = await fetch('/api/profile/kyc/upload', {
					method: 'POST',
					body: formData,
				})

				if (response.ok) {
					const uploadedDocument = await response.json()
					setKycData((prev) => ({
						...prev,
						documents: [...prev.documents.filter((doc) => doc.type !== documentType), uploadedDocument],
					}))
					toast.success(`${documentTypeLabels[documentType]} uploaded successfully`)
				} else {
					throw new Error('Upload failed')
				}
			} catch (error) {
				console.error('Error uploading document:', error)
				toast.error('Failed to upload document')
			} finally {
				setUploadingDocument(null)
			}
		},
		[user?.id],
	)

	// Handle document deletion
	const handleDeleteDocument = async (documentId: string) => {
		try {
			const response = await fetch(`/api/profile/kyc/documents/${documentId}`, {
				method: 'DELETE',
			})

			if (response.ok) {
				setKycData((prev) => ({
					...prev,
					documents: prev.documents.filter((doc) => doc.id !== documentId),
				}))
				toast.success('Document deleted successfully')
			} else {
				throw new Error('Failed to delete document')
			}
		} catch (error) {
			console.error('Error deleting document:', error)
			toast.error('Failed to delete document')
		}
	}

	// Handle KYC submission
	const handleSubmitKyc = async () => {
		if (!user?.id) return

		setIsSaving(true)
		try {
			const response = await fetch(`/api/profile/${user.id}/kyc/submit`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({kycId: kycData.id}),
			})

			if (response.ok) {
				const updatedData = await response.json()
				setKycData(updatedData)
				setCurrentStep(3)
				toast.success('KYC submitted for review successfully')
			} else {
				throw new Error('Failed to submit KYC')
			}
		} catch (error) {
			console.error('Error submitting KYC:', error)
			toast.error('Failed to submit KYC')
		} finally {
			setIsSaving(false)
		}
	}

	// Document upload dropzone component
	const DocumentUpload = ({documentType}: {documentType: DocumentType}) => {
		const {getRootProps, getInputProps, isDragActive} = useDropzone({
			onDrop: (files) => onDrop(files, documentType),
			accept: {
				'image/*': ['.png', '.jpg', '.jpeg'],
				'application/pdf': ['.pdf'],
			},
			maxFiles: 1,
			maxSize: 10 * 1024 * 1024, // 10MB
		})

		const existingDocument = kycData.documents.find((doc) => doc.type === documentType)
		const isUploading = uploadingDocument === documentType

		return (
			<div className='space-y-4'>
				<Label>{documentTypeLabels[documentType]}</Label>

				{existingDocument ? (
					<div className='flex items-center justify-between p-4 bg-slate-800 rounded-lg border border-slate-700'>
						<div className='flex items-center gap-3'>
							<FileText className='h-5 w-5 text-blue-400' />
							<div>
								<p className='font-medium'>{existingDocument.fileName}</p>
								<p className='text-sm text-slate-400'>{(existingDocument.fileSize / 1024 / 1024).toFixed(2)} MB</p>
							</div>
							<Badge variant={existingDocument.status === 'verified' ? 'default' : existingDocument.status === 'rejected' ? 'destructive' : 'secondary'}>{existingDocument.status}</Badge>
						</div>
						<div className='flex items-center gap-2'>
							{existingDocument.url && (
								<Button variant='ghost' size='sm' asChild>
									<a href={existingDocument.url} target='_blank' rel='noopener noreferrer'>
										<Eye className='h-4 w-4' />
									</a>
								</Button>
							)}
							<Button variant='ghost' size='sm' onClick={() => handleDeleteDocument(existingDocument.id)}>
								<Trash2 className='h-4 w-4' />
							</Button>
						</div>
					</div>
				) : (
					<div {...getRootProps()} className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${isDragActive ? 'border-blue-400 bg-blue-400/10' : 'border-slate-600 hover:border-slate-500'} ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
						<input {...getInputProps()} />
						<Upload className='h-8 w-8 mx-auto mb-4 text-slate-400' />
						{isUploading ? (
							<p>Uploading...</p>
						) : isDragActive ? (
							<p>Drop the file here...</p>
						) : (
							<div>
								<p className='mb-2'>Drag & drop your {documentTypeLabels[documentType].toLowerCase()} here</p>
								<p className='text-sm text-slate-400'>or click to select file</p>
								<p className='text-xs text-slate-500 mt-2'>PNG, JPG, PDF up to 10MB</p>
							</div>
						)}
					</div>
				)}

				{existingDocument?.status === 'rejected' && existingDocument.rejectionReason && (
					<div className='p-3 bg-red-950 border border-red-800 rounded-lg'>
						<p className='text-sm text-red-300'>
							<strong>Rejection Reason:</strong> {existingDocument.rejectionReason}
						</p>
					</div>
				)}
			</div>
		)
	}

	if (!authenticated || isLoading) {
		return (
			<div className='min-h-screen flex items-center justify-center'>
				<div className='flex items-center space-x-2'>
					<Loader2 className='h-6 w-6 animate-spin' />
					<span>Loading KYC data...</span>
				</div>
			</div>
		)
	}

	const progressPercentage = currentStep === 1 ? 33 : currentStep === 2 ? 66 : 100

	return (
		<AuthenticatedLayout className='text-white'>
			<div className='container mx-auto px-4 py-8 max-w-4xl'>
				{/* Header */}
				<div className='flex items-center justify-between mb-8'>
					<div className='flex items-center gap-4'>
						<Link href='/profile'>
							<Button variant='ghost' size='sm'>
								<ArrowLeft className='h-4 w-4 mr-2' />
								Back to Profile
							</Button>
						</Link>
						<div>
							<h1 className='text-3xl font-bold'>KYC Verification</h1>
							<p className='text-slate-400'>Complete your identity verification</p>
						</div>
					</div>
					<Badge className={`${statusColors[kycData.status]} text-white`}>
						{statusIcons[kycData.status]}
						{kycData.status.replace('_', ' ').toUpperCase()}
					</Badge>
				</div>

				{/* Progress Bar */}
				<div className='mb-8'>
					<div className='flex justify-between text-sm mb-2'>
						<span className={currentStep >= 1 ? 'text-blue-400' : 'text-slate-400'}>Personal Information</span>
						<span className={currentStep >= 2 ? 'text-blue-400' : 'text-slate-400'}>Document Upload</span>
						<span className={currentStep >= 3 ? 'text-blue-400' : 'text-slate-400'}>Review & Submit</span>
					</div>
					<Progress value={progressPercentage} className='h-2' />
				</div>

				{/* Step 1: Personal Information */}
				{currentStep === 1 && (
					<Card className='bg-slate-900 border-slate-800'>
						<CardHeader>
							<CardTitle>Personal Information</CardTitle>
							<CardDescription>Please provide your personal details for identity verification</CardDescription>
						</CardHeader>
						<CardContent className='space-y-6'>
							<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
								<div>
									<Label htmlFor='firstName'>First Name *</Label>
									<Input id='firstName' value={kycData.firstName} onChange={(e) => handleFieldChange('firstName', e.target.value)} className='bg-slate-800 border-slate-700' required />
								</div>
								<div>
									<Label htmlFor='lastName'>Last Name *</Label>
									<Input id='lastName' value={kycData.lastName} onChange={(e) => handleFieldChange('lastName', e.target.value)} className='bg-slate-800 border-slate-700' required />
								</div>
							</div>

							<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
								<div>
									<Label htmlFor='dateOfBirth'>Date of Birth *</Label>
									<Input id='dateOfBirth' type='date' value={kycData.dateOfBirth} onChange={(e) => handleFieldChange('dateOfBirth', e.target.value)} className='bg-slate-800 border-slate-700' required />
								</div>
								<div>
									<Label htmlFor='nationality'>Nationality *</Label>
									<Select value={kycData.nationality} onValueChange={(value) => handleFieldChange('nationality', value)}>
										<SelectTrigger className='bg-slate-800 border-slate-700'>
											<SelectValue placeholder='Select nationality' />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value='US'>United States</SelectItem>
											<SelectItem value='VN'>Vietnam</SelectItem>
											<SelectItem value='GB'>United Kingdom</SelectItem>
											<SelectItem value='CA'>Canada</SelectItem>
											<SelectItem value='AU'>Australia</SelectItem>
											<SelectItem value='SG'>Singapore</SelectItem>
											<SelectItem value='JP'>Japan</SelectItem>
											<SelectItem value='KR'>South Korea</SelectItem>
										</SelectContent>
									</Select>
								</div>
							</div>

							<div>
								<Label htmlFor='address'>Address *</Label>
								<Input id='address' value={kycData.address} onChange={(e) => handleFieldChange('address', e.target.value)} className='bg-slate-800 border-slate-700' placeholder='Street address' required />
							</div>

							<div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
								<div>
									<Label htmlFor='city'>City *</Label>
									<Input id='city' value={kycData.city} onChange={(e) => handleFieldChange('city', e.target.value)} className='bg-slate-800 border-slate-700' required />
								</div>
								<div>
									<Label htmlFor='postalCode'>Postal Code *</Label>
									<Input id='postalCode' value={kycData.postalCode} onChange={(e) => handleFieldChange('postalCode', e.target.value)} className='bg-slate-800 border-slate-700' required />
								</div>
								<div>
									<Label htmlFor='country'>Country *</Label>
									<Select value={kycData.country} onValueChange={(value) => handleFieldChange('country', value)}>
										<SelectTrigger className='bg-slate-800 border-slate-700'>
											<SelectValue placeholder='Select country' />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value='US'>United States</SelectItem>
											<SelectItem value='VN'>Vietnam</SelectItem>
											<SelectItem value='GB'>United Kingdom</SelectItem>
											<SelectItem value='CA'>Canada</SelectItem>
											<SelectItem value='AU'>Australia</SelectItem>
											<SelectItem value='SG'>Singapore</SelectItem>
											<SelectItem value='JP'>Japan</SelectItem>
											<SelectItem value='KR'>South Korea</SelectItem>
										</SelectContent>
									</Select>
								</div>
							</div>

							<div>
								<Label htmlFor='phoneNumber'>Phone Number *</Label>
								<Input id='phoneNumber' value={kycData.phoneNumber} onChange={(e) => handleFieldChange('phoneNumber', e.target.value)} className='bg-slate-800 border-slate-700' placeholder='+1 (555) 123-4567' required />
							</div>

							<div className='flex justify-end'>
								<Button onClick={handleSavePersonalInfo} disabled={isSaving || !kycData.firstName || !kycData.lastName || !kycData.dateOfBirth}>
									{isSaving ? 'Saving...' : 'Continue to Documents'}
								</Button>
							</div>
						</CardContent>
					</Card>
				)}

				{/* Step 2: Document Upload */}
				{currentStep === 2 && (
					<Card className='bg-slate-900 border-slate-800'>
						<CardHeader>
							<CardTitle>Document Upload</CardTitle>
							<CardDescription>Upload the required documents for identity verification</CardDescription>
						</CardHeader>
						<CardContent className='space-y-8'>
							<DocumentUpload documentType='passport' />
							<Separator className='bg-slate-800' />
							<DocumentUpload documentType='drivers_license' />
							<Separator className='bg-slate-800' />
							<DocumentUpload documentType='proof_of_address' />

							<div className='flex justify-between'>
								<Button variant='outline' onClick={() => setCurrentStep(1)}>
									Back to Personal Info
								</Button>
								<Button onClick={() => setCurrentStep(3)} disabled={kycData.documents.length === 0}>
									Continue to Review
								</Button>
							</div>
						</CardContent>
					</Card>
				)}

				{/* Step 3: Review & Submit */}
				{currentStep === 3 && (
					<div className='space-y-6'>
						{/* Status Card */}
						{kycData.status !== 'pending' && (
							<Card className='bg-slate-900 border-slate-800'>
								<CardHeader>
									<CardTitle className='flex items-center gap-2'>
										{statusIcons[kycData.status]}
										Verification Status
									</CardTitle>
								</CardHeader>
								<CardContent>
									{kycData.status === 'approved' && (
										<div className='text-green-400'>
											<p className='font-semibold'>✅ Your identity has been verified!</p>
											<p className='text-sm text-slate-400 mt-1'>Verified on {kycData.reviewedAt && new Date(kycData.reviewedAt).toLocaleDateString()}</p>
										</div>
									)}
									{kycData.status === 'rejected' && (
										<div className='text-red-400'>
											<p className='font-semibold'>❌ Verification was rejected</p>
											{kycData.rejectionReason && (
												<p className='text-sm mt-2'>
													<strong>Reason:</strong> {kycData.rejectionReason}
												</p>
											)}
											<p className='text-sm text-slate-400 mt-1'>Please update your information and resubmit.</p>
										</div>
									)}
									{kycData.status === 'under_review' && (
										<div className='text-blue-400'>
											<p className='font-semibold'>🔍 Under Review</p>
											<p className='text-sm text-slate-400 mt-1'>Your documents are being reviewed. This usually takes 1-3 business days.</p>
										</div>
									)}
									{kycData.status === 'expired' && (
										<div className='text-orange-400'>
											<p className='font-semibold'>⚠️ Verification Expired</p>
											<p className='text-sm text-slate-400 mt-1'>Your verification has expired. Please resubmit your documents.</p>
										</div>
									)}
								</CardContent>
							</Card>
						)}

						{/* Review Card */}
						<Card className='bg-slate-900 border-slate-800'>
							<CardHeader>
								<CardTitle>Review Your Information</CardTitle>
								<CardDescription>Please review all information before submitting</CardDescription>
							</CardHeader>
							<CardContent className='space-y-6'>
								{/* Personal Information Summary */}
								<div>
									<h3 className='text-lg font-semibold mb-4'>Personal Information</h3>
									<div className='grid grid-cols-2 gap-4 text-sm'>
										<div>
											<span className='text-slate-400'>Name:</span>
											<p>
												{kycData.firstName} {kycData.lastName}
											</p>
										</div>
										<div>
											<span className='text-slate-400'>Date of Birth:</span>
											<p>{kycData.dateOfBirth}</p>
										</div>
										<div>
											<span className='text-slate-400'>Nationality:</span>
											<p>{kycData.nationality}</p>
										</div>
										<div>
											<span className='text-slate-400'>Phone:</span>
											<p>{kycData.phoneNumber}</p>
										</div>
										<div className='col-span-2'>
											<span className='text-slate-400'>Address:</span>
											<p>
												{kycData.address}, {kycData.city}, {kycData.postalCode}, {kycData.country}
											</p>
										</div>
									</div>
								</div>

								<Separator className='bg-slate-800' />

								{/* Documents Summary */}
								<div>
									<h3 className='text-lg font-semibold mb-4'>Uploaded Documents</h3>
									<div className='space-y-3'>
										{kycData.documents.map((doc) => (
											<div key={doc.id} className='flex items-center justify-between p-3 bg-slate-800 rounded-lg'>
												<div className='flex items-center gap-3'>
													<FileText className='h-5 w-5 text-blue-400' />
													<div>
														<p className='font-medium'>{documentTypeLabels[doc.type]}</p>
														<p className='text-sm text-slate-400'>{doc.fileName}</p>
													</div>
												</div>
												<Badge variant={doc.status === 'verified' ? 'default' : doc.status === 'rejected' ? 'destructive' : 'secondary'}>{doc.status}</Badge>
											</div>
										))}
									</div>
								</div>

								{kycData.status === 'pending' && (
									<div className='flex justify-between'>
										<Button variant='outline' onClick={() => setCurrentStep(2)}>
											Back to Documents
										</Button>
										<Button onClick={handleSubmitKyc} disabled={isSaving || kycData.documents.length === 0}>
											{isSaving ? 'Submitting...' : 'Submit for Review'}
										</Button>
									</div>
								)}
							</CardContent>
						</Card>
					</div>
				)}
			</div>
		</AuthenticatedLayout>
	)
}
