'use client'

import {useState, useEffect} from 'react'
import {usePrivy} from '@privy-io/react-auth'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Textarea} from '@/components/ui/textarea'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {Avatar, AvatarFallback, AvatarImage} from '@/components/ui/avatar'
import {Badge} from '@/components/ui/badge'
import {Separator} from '@/components/ui/separator'
import {toast} from 'sonner'
import {User, Settings, Shield, Camera, Save, ArrowLeft, Loader2} from 'lucide-react'
import Link from 'next/link'
import {useRouter} from 'next/navigation'
import {AuthenticatedLayout} from '@/components/layout/AppLayout'
import {useProfile} from '@/lib/hooks/useProfile'
import {useKycStatus} from '@/lib/hooks/useKyc'

interface UserProfile {
	id?: string
	firstName?: string
	lastName?: string
	dateOfBirth?: string
	phoneNumber?: string
	address?: string
	city?: string
	country?: string
	postalCode?: string
	profileImage?: string
	bio?: string
	investorType?: string
	riskTolerance?: string
	investmentGoals?: string
}

/**
 * User Profile Page Component
 * Allows users to view and edit their personal information
 */
export default function ProfilePage() {
	const [mounted, setMounted] = useState(false)
	const {user, authenticated, ready} = usePrivy()
	const router = useRouter()
	const {profile, loading: profileLoading, error: profileError, updateProfile} = useProfile()
	const {statusInfo: kycStatus} = useKycStatus()
	const [isLoading, setIsLoading] = useState(true)
	const [isSaving, setIsSaving] = useState(false)
	const [isEditing, setIsEditing] = useState(false)
	const [formData, setFormData] = useState<Partial<UserProfile>>({})

	// Handle client-side mounting
	useEffect(() => {
		setMounted(true)
	}, [])

	// Debug logging for user data
	useEffect(() => {
		if (mounted && ready) {
			console.log('ProfilePage Debug:', {
				ready,
				authenticated,
				user,
				userId: user?.id,
				profile,
				profileLoading,
				profileError
			})
		}
	}, [mounted, ready, authenticated, user, profile, profileLoading, profileError])

	// Redirect if not authenticated (only after mounting and ready)
	useEffect(() => {
		if (mounted && ready && !authenticated) {
			console.log('User not authenticated, redirecting to login')
			router.push('/login')
			return
		}
		if (mounted && ready && authenticated) {
			console.log('User authenticated:', user?.id)
		}
	}, [mounted, ready, authenticated, router, user?.id])

	// Update form data when profile loads
	useEffect(() => {
		if (profile) {
			setFormData({...profile})
		}
	}, [profile])

	// Handle form submission
	const handleSave = async () => {
		try {
			// Type-safe form data with proper casting
			const profileData = {
				...formData,
				investorType: formData.investorType as 'retail' | 'accredited' | 'institutional' | undefined,
				riskTolerance: formData.riskTolerance as 'low' | 'medium' | 'high' | undefined,
			}

			const success = await updateProfile(profileData)
			if (success) {
				setIsEditing(false)
				toast.success('Profile updated successfully')
			} else {
				toast.error('Failed to update profile')
			}
		} catch (error) {
			console.error('Error saving profile:', error)
			toast.error('Failed to update profile')
		}
	}

	// Handle input changes
	const handleInputChange = (field: keyof UserProfile, value: string) => {
		setFormData((prev) => ({...prev, [field]: value}))
	}

	// Handle cancel
	const handleCancel = () => {
		if (profile) {
			setFormData(profile)
		}
		setIsEditing(false)
	}

	// Get user initials for avatar
	const getUserInitials = () => {
		const firstName = profile?.firstName || ''
		const lastName = profile?.lastName || ''
		return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || 'U'
	}

	// Get KYC status badge
	const getKycStatusBadge = () => {
		// This would come from user data in real implementation
		const status = 'pending' // user?.kycStatus || 'pending'
		const statusConfig = {
			pending: {label: 'Pending', variant: 'secondary' as const},
			approved: {label: 'Verified', variant: 'default' as const},
			rejected: {label: 'Rejected', variant: 'destructive' as const},
		}

		return statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
	}

	if (!mounted || !ready || !authenticated || profileLoading) {
		return (
			<div className='min-h-screen flex items-center justify-center'>
				<div className='animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500'></div>
			</div>
		)
	}

	if (profileError) {
		return (
			<div className='min-h-screen flex items-center justify-center'>
				<div className='text-red-500'>Error loading profile: {profileError}</div>
			</div>
		)
	}

	const kycStatusBadge = getKycStatusBadge()

	return (
		<AuthenticatedLayout className='py-8'>
			<div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8'>
				{/* Header */}
				<div className='flex items-center justify-between mb-8'>
					<div className='flex items-center gap-4'>
						<Link href='/dashboard'>
							<Button variant='ghost' size='sm'>
								<ArrowLeft className='h-4 w-4 mr-2' />
								Back to Dashboard
							</Button>
						</Link>
						<h1 className='text-3xl font-bold'>My Profile</h1>
					</div>
					<div className='flex items-center gap-2'>
						<Link href='/profile/settings'>
							<Button variant='outline' size='sm'>
								<Settings className='h-4 w-4 mr-2' />
								Settings
							</Button>
						</Link>
						<Link href='/profile/kyc'>
							<Button variant='outline' size='sm'>
								<Shield className='h-4 w-4 mr-2' />
								KYC Verification
							</Button>
						</Link>
					</div>
				</div>

				<div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
					{/* Profile Summary Card */}
					<div className='lg:col-span-1'>
						<Card className='bg-slate-900 border-slate-800'>
							<CardHeader className='text-center'>
								<div className='flex justify-center mb-4'>
									<div className='relative'>
										<Avatar className='h-24 w-24'>
											<AvatarImage src={profile?.profileImage} />
											<AvatarFallback className='bg-blue-600 text-white text-xl'>{getUserInitials()}</AvatarFallback>
										</Avatar>
										{isEditing && (
											<Button
												size='sm'
												className='absolute -bottom-2 -right-2 h-8 w-8 rounded-full'
												onClick={() => {
													/* Handle image upload */
												}}>
												<Camera className='h-4 w-4' />
											</Button>
										)}
									</div>
								</div>
								<CardTitle className='text-xl'>{profile?.firstName && profile?.lastName ? `${profile.firstName} ${profile.lastName}` : 'Complete your profile'}</CardTitle>
								<CardDescription className='text-slate-400'>{user?.email?.address || 'No email provided'}</CardDescription>
								<div className='flex justify-center mt-4'>
									<Badge variant={kycStatus?.status === 'approved' ? 'default' : kycStatus?.status === 'rejected' ? 'destructive' : 'secondary'}>{kycStatus?.status === 'not_started' ? 'Not Started' : kycStatus?.status === 'pending' ? 'Pending' : kycStatus?.status === 'under_review' ? 'Under Review' : kycStatus?.status === 'approved' ? 'Approved' : kycStatus?.status === 'rejected' ? 'Rejected' : 'Unknown'}</Badge>
								</div>
							</CardHeader>
							<CardContent>
								<div className='space-y-4'>
									<div>
										<Label className='text-sm text-slate-400'>Investor Type</Label>
										<p className='text-sm capitalize'>{profile?.investorType || 'Not specified'}</p>
									</div>
									<div>
										<Label className='text-sm text-slate-400'>Risk Tolerance</Label>
										<p className='text-sm capitalize'>{profile?.riskTolerance || 'Not specified'}</p>
									</div>
									<Separator className='bg-slate-800' />
									<div className='flex justify-center'>
										{!isEditing ? (
											<Button onClick={() => setIsEditing(true)} className='w-full'>
												<User className='h-4 w-4 mr-2' />
												Edit Profile
											</Button>
										) : (
											<div className='flex gap-2 w-full'>
												<Button onClick={handleSave} disabled={profileLoading} className='flex-1'>
													{profileLoading ? (
														<>
															<Loader2 className='h-4 w-4 animate-spin mr-2' />
															Saving...
														</>
													) : (
														<>
															<Save className='h-4 w-4 mr-2' />
															Save
														</>
													)}
												</Button>
												<Button variant='outline' onClick={handleCancel} className='flex-1'>
													Cancel
												</Button>
											</div>
										)}
									</div>
								</div>
							</CardContent>
						</Card>
					</div>

					{/* Profile Details Form */}
					<div className='lg:col-span-2'>
						<Card className='bg-slate-900 border-slate-800'>
							<CardHeader>
								<CardTitle>Personal Information</CardTitle>
								<CardDescription>Manage your personal details and investment preferences</CardDescription>
							</CardHeader>
							<CardContent className='space-y-6'>
								{/* Basic Information */}
								<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
									<div>
										<Label htmlFor='firstName'>First Name</Label>
										<Input id='firstName' value={formData.firstName || ''} onChange={(e) => handleInputChange('firstName', e.target.value)} disabled={!isEditing} className='bg-slate-800 border-slate-700' />
									</div>
									<div>
										<Label htmlFor='lastName'>Last Name</Label>
										<Input id='lastName' value={formData.lastName || ''} onChange={(e) => handleInputChange('lastName', e.target.value)} disabled={!isEditing} className='bg-slate-800 border-slate-700' />
									</div>
								</div>

								<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
									<div>
										<Label htmlFor='dateOfBirth'>Date of Birth</Label>
										<Input id='dateOfBirth' type='date' value={formData.dateOfBirth || ''} onChange={(e) => handleInputChange('dateOfBirth', e.target.value)} disabled={!isEditing} className='bg-slate-800 border-slate-700' />
									</div>
									<div>
										<Label htmlFor='phoneNumber'>Phone Number</Label>
										<Input id='phoneNumber' value={formData.phoneNumber || ''} onChange={(e) => handleInputChange('phoneNumber', e.target.value)} disabled={!isEditing} className='bg-slate-800 border-slate-700' />
									</div>
								</div>

								{/* Address Information */}
								<Separator className='bg-slate-800' />
								<h3 className='text-lg font-semibold'>Address Information</h3>

								<div>
									<Label htmlFor='address'>Street Address</Label>
									<Input id='address' value={formData.address || ''} onChange={(e) => handleInputChange('address', e.target.value)} disabled={!isEditing} className='bg-slate-800 border-slate-700' />
								</div>

								<div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
									<div>
										<Label htmlFor='city'>City</Label>
										<Input id='city' value={formData.city || ''} onChange={(e) => handleInputChange('city', e.target.value)} disabled={!isEditing} className='bg-slate-800 border-slate-700' />
									</div>
									<div>
										<Label htmlFor='country'>Country</Label>
										<Input id='country' value={formData.country || ''} onChange={(e) => handleInputChange('country', e.target.value)} disabled={!isEditing} className='bg-slate-800 border-slate-700' />
									</div>
									<div>
										<Label htmlFor='postalCode'>Postal Code</Label>
										<Input id='postalCode' value={formData.postalCode || ''} onChange={(e) => handleInputChange('postalCode', e.target.value)} disabled={!isEditing} className='bg-slate-800 border-slate-700' />
									</div>
								</div>

								{/* Investment Preferences */}
								<Separator className='bg-slate-800' />
								<h3 className='text-lg font-semibold'>Investment Preferences</h3>

								<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
									<div>
										<Label htmlFor='investorType'>Investor Type</Label>
										<Select value={formData.investorType || ''} onValueChange={(value) => handleInputChange('investorType', value)} disabled={!isEditing}>
											<SelectTrigger className='bg-slate-800 border-slate-700'>
												<SelectValue placeholder='Select investor type' />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value='retail'>Retail Investor</SelectItem>
												<SelectItem value='accredited'>Accredited Investor</SelectItem>
												<SelectItem value='institutional'>Institutional Investor</SelectItem>
											</SelectContent>
										</Select>
									</div>
									<div>
										<Label htmlFor='riskTolerance'>Risk Tolerance</Label>
										<Select value={formData.riskTolerance || ''} onValueChange={(value) => handleInputChange('riskTolerance', value)} disabled={!isEditing}>
											<SelectTrigger className='bg-slate-800 border-slate-700'>
												<SelectValue placeholder='Select risk tolerance' />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value='low'>Low Risk</SelectItem>
												<SelectItem value='medium'>Medium Risk</SelectItem>
												<SelectItem value='high'>High Risk</SelectItem>
											</SelectContent>
										</Select>
									</div>
								</div>

								<div>
									<Label htmlFor='bio'>Bio</Label>
									<Textarea id='bio' value={formData.bio || ''} onChange={(e) => handleInputChange('bio', e.target.value)} disabled={!isEditing} className='bg-slate-800 border-slate-700' rows={3} placeholder='Tell us about yourself and your investment goals...' />
								</div>

								<div>
									<Label htmlFor='investmentGoals'>Investment Goals</Label>
									<Textarea id='investmentGoals' value={formData.investmentGoals || ''} onChange={(e) => handleInputChange('investmentGoals', e.target.value)} disabled={!isEditing} className='bg-slate-800 border-slate-700' rows={3} placeholder='Describe your investment objectives and timeline...' />
								</div>
							</CardContent>
						</Card>
					</div>
				</div>
			</div>
		</AuthenticatedLayout>
	)
}
