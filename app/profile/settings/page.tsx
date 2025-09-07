'use client'

import {useState, useEffect} from 'react'
import {usePrivy} from '@privy-io/react-auth'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Switch} from '@/components/ui/switch'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {Separator} from '@/components/ui/separator'
import {Alert, AlertDescription} from '@/components/ui/alert'
import {Badge} from '@/components/ui/badge'
import {toast} from 'sonner'
import {Settings, Bell, Shield, Eye, Globe, Smartphone, Mail, Lock, Trash2, Download, Upload, ArrowLeft, Save, Loader2} from 'lucide-react'
import Link from 'next/link'
import {useRouter} from 'next/navigation'
import {AuthenticatedLayout} from '@/components/layout/AppLayout'
import {useProfile, useProfilePreferences} from '@/lib/hooks/useProfile'
import {useNotificationPreferences} from '@/lib/hooks/useNotifications'

interface UserSettings {
	id?: string
	// Notification preferences
	emailNotifications: boolean
	pushNotifications: boolean
	smsNotifications: boolean
	marketingEmails: boolean
	// Notification types
	tradeNotifications: boolean
	kycUpdates: boolean
	vaultRewards: boolean
	systemAlerts: boolean
	priceAlerts: boolean
	// Privacy settings
	profileVisibility: 'public' | 'private' | 'friends'
	showPortfolio: boolean
	showTradingHistory: boolean
	// Security settings
	twoFactorEnabled: boolean
	sessionTimeout: number // in minutes
	// Display preferences
	language: string
	timezone: string
	currency: string
	theme: 'light' | 'dark' | 'system'
}

const defaultSettings: UserSettings = {
	emailNotifications: true,
	pushNotifications: true,
	smsNotifications: false,
	marketingEmails: false,
	tradeNotifications: true,
	kycUpdates: true,
	vaultRewards: true,
	systemAlerts: true,
	priceAlerts: false,
	profileVisibility: 'private',
	showPortfolio: false,
	showTradingHistory: false,
	twoFactorEnabled: false,
	sessionTimeout: 60,
	language: 'en',
	timezone: 'UTC',
	currency: 'USD',
	theme: 'dark',
}

/**
 * Profile Settings Page Component
 * Allows users to manage their account preferences and privacy settings
 */
export default function ProfileSettingsPage() {
	const {user, authenticated, logout} = usePrivy()
	const router = useRouter()
	const {profile, loading: profileLoading, deleteAccount} = useProfile()
	const {preferences: profilePrefs, loading: prefsLoading, updatePreferences: updateProfilePrefs} = useProfilePreferences()
	const {preferences: notificationPrefs, loading: notificationLoading, updatePreferences: updateNotificationPrefs} = useNotificationPreferences()
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

	// Redirect if not authenticated
	useEffect(() => {
		if (!authenticated) {
			router.push('/login')
			return
		}
	}, [authenticated, router])

	const handleNotificationChange = async (key: string, value: boolean) => {
		try {
			const success = await updateNotificationPrefs({[key]: value})
			if (success) {
				toast.success('Notification settings updated')
			} else {
				toast.error('Failed to update notification settings')
			}
		} catch (error) {
			toast.error('Failed to update notification settings')
		}
	}

	const handlePrivacyChange = async (key: string, value: boolean | string | number) => {
		try {
			const success = await updateProfilePrefs({[key]: value})
			if (success) {
				toast.success('Privacy settings updated')
			} else {
				toast.error('Failed to update privacy settings')
			}
		} catch (error) {
			toast.error('Failed to update privacy settings')
		}
	}

	// Handle setting changes
	const handleSettingChange = (key: keyof UserSettings, value: any) => {
		// This function is kept for compatibility but will be replaced by specific handlers
	}

	// Handle account deletion
	const handleDeleteAccount = async () => {
		if (!showDeleteConfirm) {
			setShowDeleteConfirm(true)
			return
		}

		try {
			const success = await deleteAccount()
			if (success) {
				toast.success('Account deleted successfully')
				logout()
				router.push('/')
			} else {
				toast.error('Failed to delete account')
			}
		} catch (error) {
			console.error('Error deleting account:', error)
			toast.error('Failed to delete account')
		}
	}

	if (!authenticated) {
		return (
			<div className='min-h-screen flex items-center justify-center'>
				<div className='text-center'>
					<p className='text-muted-foreground'>Please log in to access settings.</p>
				</div>
			</div>
		)
	}

	if (profileLoading || prefsLoading || notificationLoading) {
		return (
			<div className='min-h-screen flex items-center justify-center'>
				<div className='flex items-center space-x-2'>
					<Loader2 className='h-6 w-6 animate-spin' />
					<span>Loading settings...</span>
				</div>
			</div>
		)
	}

	return (
		<AuthenticatedLayout className='py-8'>
			<div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8'>
				{/* Header */}
				<div className='flex items-center justify-between mb-8'>
					<div className='flex items-center gap-4'>
						<Link href='/profile'>
							<Button variant='ghost' size='sm'>
								<ArrowLeft className='h-4 w-4 mr-2' />
								Back to Profile
							</Button>
						</Link>
						<h1 className='text-3xl font-bold'>Account Settings</h1>
					</div>
				</div>

				<div className='space-y-8'>
					{/* Notification Settings */}
					<Card className='bg-slate-900 border-slate-800'>
						<CardHeader>
							<CardTitle className='flex items-center gap-2'>
								<Bell className='h-5 w-5' />
								Notification Preferences
							</CardTitle>
							<CardDescription>Choose how you want to receive notifications</CardDescription>
						</CardHeader>
						<CardContent className='space-y-6'>
							{/* Notification Channels */}
							<div>
								<h3 className='text-lg font-semibold mb-4'>Notification Channels</h3>
								<div className='space-y-4'>
									<div className='flex items-center justify-between'>
										<div>
											<Label htmlFor='emailNotifications'>Email Notifications</Label>
											<p className='text-sm text-slate-400'>Receive notifications via email</p>
										</div>
										<Switch id='emailNotifications' checked={notificationPrefs?.emailNotifications || false} onCheckedChange={(checked: boolean) => handleNotificationChange('emailNotifications', checked)} />
									</div>
									<div className='flex items-center justify-between'>
										<div>
											<Label htmlFor='pushNotifications'>Push Notifications</Label>
											<p className='text-sm text-slate-400'>Receive browser push notifications</p>
										</div>
										<Switch id='pushNotifications' checked={notificationPrefs?.pushNotifications || false} onCheckedChange={(checked: boolean) => handleNotificationChange('pushNotifications', checked)} />
									</div>
									<div className='flex items-center justify-between'>
										<div>
											<Label htmlFor='smsNotifications'>SMS Notifications</Label>
											<p className='text-sm text-slate-400'>Receive notifications via SMS</p>
										</div>
										<Switch id='smsNotifications' checked={notificationPrefs?.smsNotifications || false} onCheckedChange={(checked: boolean) => handleNotificationChange('smsNotifications', checked)} />
									</div>
									<div className='flex items-center justify-between'>
										<div>
											<Label htmlFor='marketingEmails'>Marketing Emails</Label>
											<p className='text-sm text-slate-400'>Receive promotional and marketing emails</p>
										</div>
										<Switch id='marketingEmails' checked={notificationPrefs?.marketingEmails || false} onCheckedChange={(checked: boolean) => handleNotificationChange('marketingEmails', checked)} />
									</div>
								</div>
							</div>

							<Separator className='bg-slate-800' />

							{/* Notification Types */}
							<div>
								<h3 className='text-lg font-semibold mb-4'>Notification Types</h3>
								<div className='space-y-4'>
									<div className='flex items-center justify-between'>
										<div>
											<Label htmlFor='tradeNotifications'>Trade Notifications</Label>
											<p className='text-sm text-slate-400'>Get notified when trades are executed</p>
										</div>
										<Switch id='tradeNotifications' checked={notificationPrefs?.tradeNotifications || false} onCheckedChange={(checked: boolean) => handleNotificationChange('tradeNotifications', checked)} />
									</div>
									<div className='flex items-center justify-between'>
										<div>
											<Label htmlFor='kycUpdates'>KYC Updates</Label>
											<p className='text-sm text-slate-400'>Receive updates on KYC verification status</p>
										</div>
										<Switch id='kycUpdates' checked={notificationPrefs?.kycUpdates || false} onCheckedChange={(checked: boolean) => handleNotificationChange('kycUpdates', checked)} />
									</div>
									<div className='flex items-center justify-between'>
										<div>
											<Label htmlFor='vaultRewards'>Vault Rewards</Label>
											<p className='text-sm text-slate-400'>Get notified about vault rewards and distributions</p>
										</div>
										<Switch id='vaultRewards' checked={notificationPrefs?.vaultRewards || false} onCheckedChange={(checked: boolean) => handleNotificationChange('vaultRewards', checked)} />
									</div>
									<div className='flex items-center justify-between'>
										<div>
											<Label htmlFor='systemAlerts'>System Alerts</Label>
											<p className='text-sm text-slate-400'>Important system notifications and maintenance alerts</p>
										</div>
										<Switch id='systemAlerts' checked={notificationPrefs?.systemAlerts !== false} onCheckedChange={(checked: boolean) => handleNotificationChange('systemAlerts', checked)} disabled />
									</div>
									<div className='flex items-center justify-between'>
										<div>
											<Label htmlFor='priceAlerts'>Price Alerts</Label>
											<p className='text-sm text-slate-400'>Get notified about significant price changes</p>
										</div>
										<Switch id='priceAlerts' checked={notificationPrefs?.priceAlerts || false} onCheckedChange={(checked: boolean) => handleNotificationChange('priceAlerts', checked)} />
									</div>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Privacy Settings */}
					<Card className='bg-slate-900 border-slate-800'>
						<CardHeader>
							<CardTitle className='flex items-center gap-2'>
								<Eye className='h-5 w-5' />
								Privacy Settings
							</CardTitle>
							<CardDescription>Control who can see your information and activity</CardDescription>
						</CardHeader>
						<CardContent className='space-y-6'>
							<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
								<div>
									<Label htmlFor='profileVisibility'>Profile Visibility</Label>
									<Select value={profilePrefs?.profileVisibility || 'private'} onValueChange={(value) => handlePrivacyChange('profileVisibility', value)}>
										<SelectTrigger className='bg-slate-800 border-slate-700'>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value='public'>Public</SelectItem>
											<SelectItem value='private'>Private</SelectItem>
											<SelectItem value='friends'>Friends Only</SelectItem>
										</SelectContent>
									</Select>
								</div>
							</div>

							<div className='space-y-4'>
								<div className='flex items-center justify-between'>
									<div>
										<Label htmlFor='showPortfolio'>Show Portfolio</Label>
										<p className='text-sm text-slate-400'>Allow others to see your portfolio holdings</p>
									</div>
									<Switch id='showPortfolio' checked={profilePrefs?.showPortfolio || false} onCheckedChange={(checked: boolean) => handlePrivacyChange('showPortfolio', checked)} />
								</div>
								<div className='flex items-center justify-between'>
									<div>
										<Label htmlFor='showTradingHistory'>Show Trading History</Label>
										<p className='text-sm text-slate-400'>Allow others to see your trading activity</p>
									</div>
									<Switch id='showTradingHistory' checked={profilePrefs?.showTradingHistory || false} onCheckedChange={(checked: boolean) => handlePrivacyChange('showTradingHistory', checked)} />
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Security Settings */}
					<Card className='bg-slate-900 border-slate-800'>
						<CardHeader>
							<CardTitle className='flex items-center gap-2'>
								<Shield className='h-5 w-5' />
								Security Settings
							</CardTitle>
							<CardDescription>Manage your account security preferences</CardDescription>
						</CardHeader>
						<CardContent className='space-y-6'>
							<div className='flex items-center justify-between'>
								<div>
									<Label htmlFor='twoFactorEnabled'>Two-Factor Authentication</Label>
									<p className='text-sm text-slate-400'>Add an extra layer of security to your account</p>
								</div>
								<Switch id='twoFactorEnabled' checked={profilePrefs?.twoFactorEnabled || false} onCheckedChange={(checked: boolean) => handlePrivacyChange('twoFactorEnabled', checked)} />
							</div>

							<div>
								<Label htmlFor='sessionTimeout'>Session Timeout (minutes)</Label>
								<Select value={(profilePrefs?.sessionTimeout || 60).toString()} onValueChange={(value) => handlePrivacyChange('sessionTimeout', parseInt(value))}>
									<SelectTrigger className='bg-slate-800 border-slate-700'>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value='15'>15 minutes</SelectItem>
										<SelectItem value='30'>30 minutes</SelectItem>
										<SelectItem value='60'>1 hour</SelectItem>
										<SelectItem value='120'>2 hours</SelectItem>
										<SelectItem value='480'>8 hours</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</CardContent>
					</Card>

					{/* Display Preferences */}
					<Card className='bg-slate-900 border-slate-800'>
						<CardHeader>
							<CardTitle className='flex items-center gap-2'>
								<Globe className='h-5 w-5' />
								Display Preferences
							</CardTitle>
							<CardDescription>Customize your app experience</CardDescription>
						</CardHeader>
						<CardContent className='space-y-6'>
							<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
								<div>
									<Label htmlFor='language'>Language</Label>
									<Select value={profilePrefs?.language || 'en'} onValueChange={(value) => handlePrivacyChange('language', value)}>
										<SelectTrigger className='bg-slate-800 border-slate-700'>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value='en'>English</SelectItem>
											<SelectItem value='vi'>Tiếng Việt</SelectItem>
											<SelectItem value='zh'>中文</SelectItem>
											<SelectItem value='ja'>日本語</SelectItem>
										</SelectContent>
									</Select>
								</div>

								<div>
									<Label htmlFor='currency'>Default Currency</Label>
									<Select value={profilePrefs?.currency || 'USD'} onValueChange={(value) => handlePrivacyChange('currency', value)}>
										<SelectTrigger className='bg-slate-800 border-slate-700'>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value='USD'>USD</SelectItem>
											<SelectItem value='EUR'>EUR</SelectItem>
											<SelectItem value='VND'>VND</SelectItem>
											<SelectItem value='ETH'>ETH</SelectItem>
											<SelectItem value='BTC'>BTC</SelectItem>
										</SelectContent>
									</Select>
								</div>
							</div>

							<div>
								<Label htmlFor='timezone'>Timezone</Label>
								<Select value={profilePrefs?.timezone || 'UTC'} onValueChange={(value) => handlePrivacyChange('timezone', value)}>
									<SelectTrigger className='bg-slate-800 border-slate-700'>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value='UTC'>UTC</SelectItem>
										<SelectItem value='America/New_York'>Eastern Time</SelectItem>
										<SelectItem value='America/Los_Angeles'>Pacific Time</SelectItem>
										<SelectItem value='Europe/London'>London</SelectItem>
										<SelectItem value='Asia/Tokyo'>Tokyo</SelectItem>
										<SelectItem value='Asia/Ho_Chi_Minh'>Ho Chi Minh City</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</CardContent>
					</Card>

					{/* Danger Zone */}
					<Card className='bg-red-950 border-red-800'>
						<CardHeader>
							<CardTitle className='flex items-center gap-2 text-red-400'>
								<Trash2 className='h-5 w-5' />
								Danger Zone
							</CardTitle>
							<CardDescription className='text-red-300'>Irreversible actions that will permanently affect your account</CardDescription>
						</CardHeader>
						<CardContent>
							{!showDeleteConfirm ? (
								<Button variant='destructive' onClick={() => setShowDeleteConfirm(true)} className='bg-red-600 hover:bg-red-700'>
									<Trash2 className='h-4 w-4 mr-2' />
									Delete Account
								</Button>
							) : (
								<div className='space-y-4'>
									<p className='text-red-300'>Are you sure you want to delete your account? This action cannot be undone. All your data, including portfolio, trading history, and profile information will be permanently deleted.</p>
									<div className='flex gap-2'>
										<Button variant='destructive' onClick={handleDeleteAccount} disabled={profileLoading} className='bg-red-600 hover:bg-red-700'>
											{profileLoading ? (
												<>
													<Loader2 className='h-4 w-4 animate-spin mr-2' />
													Deleting...
												</>
											) : (
												<>
													<Trash2 className='h-4 w-4 mr-2' />
													Yes, Delete My Account
												</>
											)}
										</Button>
										<Button variant='outline' onClick={() => setShowDeleteConfirm(false)} className='border-slate-600'>
											Cancel
										</Button>
									</div>
								</div>
							)}
						</CardContent>
					</Card>
				</div>
			</div>
		</AuthenticatedLayout>
	)
}
