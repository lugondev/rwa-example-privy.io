'use client'

import {useEffect, useState} from 'react'
import {useRouter} from 'next/navigation'
import {useAuthSafe} from '@/hooks/useAuthSafe'
import {Loader2} from 'lucide-react'
import {Card, CardContent} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {Alert, AlertDescription} from '@/components/ui/alert'
import {toast} from 'sonner'

interface AuthGuardProps {
	children: React.ReactNode
	requireAuth?: boolean
	requireProfile?: boolean
	requireKyc?: boolean
	allowedUserTypes?: string[]
	fallbackUrl?: string
}

/**
 * AuthGuard component to protect routes and manage authentication state
 * Provides conditional rendering based on user authentication and verification status
 */
export function AuthGuard({children, requireAuth = true, requireProfile = false, requireKyc = false, allowedUserTypes = [], fallbackUrl = '/login'}: AuthGuardProps) {
	const router = useRouter()
	const {user, authenticated, loading} = useAuthSafe()
	const [isChecking, setIsChecking] = useState(true)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		checkAccess()
	}, [authenticated, user, loading])

	/**
	 * Check if user has required access permissions
	 */
	const checkAccess = async () => {
		if (loading) return

		setIsChecking(true)
		setError(null)

		try {
			// Check authentication requirement
			if (requireAuth && !authenticated) {
				router.push(fallbackUrl)
				return
			}

			// If authenticated, check user data
			if (authenticated && !user) {
				setError('User data not available. Please try logging in again.')
				return
			}

			// Check profile completion requirement
			if (requireProfile && user) {
				const hasProfile = user.profile?.first_name && user.profile?.last_name
				if (!hasProfile) {
					router.push('/profile')
					return
				}
			}

			// Check KYC requirement
			if (requireKyc && user) {
				if (user.kyc_status !== 'verified') {
					const hasProfile = user.profile?.first_name && user.profile?.last_name
					if (!hasProfile) {
						router.push('/profile')
					} else {
						router.push('/profile/kyc')
					}
					return
				}
			}

			// Check user type restrictions
			if (allowedUserTypes.length > 0 && user) {
				if (!allowedUserTypes.includes(user.user_type)) {
					setError(`This feature is only available for ${allowedUserTypes.join(', ')} users.`)
					return
				}
			}
		} catch (error) {
			console.error('Access check error:', error)
			setError('An error occurred while checking access permissions.')
		} finally {
			setIsChecking(false)
		}
	}

	/**
	 * Handle retry action
	 */
	const handleRetry = () => {
		setError(null)
		checkAccess()
	}

	/**
	 * Handle redirect to login
	 */
	const handleLogin = () => {
		router.push('/login')
	}

	// Show loading state
	if (loading || isChecking) {
		return (
			<div className='min-h-screen flex items-center justify-center'>
				<Card className='w-full max-w-md'>
					<CardContent className='flex flex-col items-center justify-center p-8'>
						<Loader2 className='h-8 w-8 animate-spin mb-4' />
						<p className='text-sm text-muted-foreground'>Checking access permissions...</p>
					</CardContent>
				</Card>
			</div>
		)
	}

	// Show error state
	if (error) {
		return (
			<div className='min-h-screen flex items-center justify-center p-4'>
				<Card className='w-full max-w-md'>
					<CardContent className='p-6'>
						<Alert className='mb-4'>
							<AlertDescription>{error}</AlertDescription>
						</Alert>
						<div className='flex gap-2'>
							<Button onClick={handleRetry} variant='outline' className='flex-1'>
								Retry
							</Button>
							<Button onClick={handleLogin} className='flex-1'>
								Go to Login
							</Button>
						</div>
					</CardContent>
				</Card>
			</div>
		)
	}

	// Render children if all checks pass
	return <>{children}</>
}

/**
 * Higher-order component for route protection
 */
export function withAuthGuard<P extends object>(Component: React.ComponentType<P>, options: Omit<AuthGuardProps, 'children'> = {}) {
	return function AuthGuardedComponent(props: P) {
		return (
			<AuthGuard {...options}>
				<Component {...props} />
			</AuthGuard>
		)
	}
}

/**
 * Hook for checking feature access
 */
export function useFeatureAccess(feature: string) {
	const {user} = useAuthSafe()
	// Simplified feature access for now
	const canAccessFeature = (feature: string) => true
	const [hasAccess, setHasAccess] = useState(false)
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		if (user) {
			setHasAccess(canAccessFeature(feature))
			setLoading(false)
		}
	}, [user, feature, canAccessFeature])

	return {hasAccess, loading}
}

/**
 * Component for conditional feature rendering
 */
interface FeatureGateProps {
	feature: string
	children: React.ReactNode
	fallback?: React.ReactNode
	showUpgrade?: boolean
}

export function FeatureGate({feature, children, fallback = null, showUpgrade = false}: FeatureGateProps) {
	const {hasAccess, loading} = useFeatureAccess(feature)
	const router = useRouter()

	if (loading) {
		return (
			<div className='flex items-center justify-center p-4'>
				<Loader2 className='h-4 w-4 animate-spin' />
			</div>
		)
	}

	if (!hasAccess) {
		if (showUpgrade) {
			return (
				<Card className='p-4'>
					<CardContent className='text-center'>
						<p className='text-sm text-muted-foreground mb-3'>This feature requires additional verification.</p>
						<Button onClick={() => router.push('/profile/kyc')} size='sm'>
							Complete Verification
						</Button>
					</CardContent>
				</Card>
			)
		}
		return <>{fallback}</>
	}

	return <>{children}</>
}
