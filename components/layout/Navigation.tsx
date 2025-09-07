'use client'

import {useState} from 'react'
import Link from 'next/link'
import {useRouter, usePathname} from 'next/navigation'
import {useAuthSafe} from '@/hooks/useAuthSafe'
import {Button} from '@/components/ui/button'
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger} from '@/components/ui/dropdown-menu'
import {Avatar, AvatarFallback, AvatarImage} from '@/components/ui/avatar'
import {Badge} from '@/components/ui/badge'
import {User, Settings, LogOut, Shield, Menu, X, Home, TrendingUp, Wallet, FileText} from 'lucide-react'
import {cn} from '@/lib/utils'
import {LoadingSpinner} from '@/components/ui/loading-spinner'

interface NavigationProps {
	className?: string
}

/**
 * Main navigation component with authentication integration
 * Provides responsive navigation with user menu and route protection
 */
export function Navigation({className}: NavigationProps) {
	const router = useRouter()
	const pathname = usePathname()
	const {user, userData, authenticated, loading, logout} = useAuthSafe()
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

	/**
	 * Handle user logout
	 */
	const handleLogout = async () => {
		try {
			await logout()
			router.push('/login')
		} catch (error) {
			console.error('Logout error:', error)
		}
	}

	/**
	 * Get user initials for avatar
	 */
	const getUserInitials = () => {
		if (!userData?.profile) return 'U'
		const firstName = userData.profile.first_name || ''
		const lastName = userData.profile.last_name || ''
		return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || 'U'
	}

	/**
	 * Get KYC status badge
	 */
	const getKycBadge = () => {
		if (!userData) return null

		const statusConfig = {
			pending: {label: 'Pending', variant: 'secondary' as const},
			under_review: {label: 'Review', variant: 'default' as const},
			verified: {label: 'Verified', variant: 'default' as const},
			rejected: {label: 'Rejected', variant: 'destructive' as const},
			not_started: {label: 'Not Started', variant: 'outline' as const},
		}

		const config = statusConfig[userData.kyc_status as keyof typeof statusConfig]
		return config ? (
			<Badge variant={config.variant} className='text-xs'>
				{config.label}
			</Badge>
		) : null
	}

	/**
	 * Navigation items
	 */
	const navigationItems = [
		{href: '/', label: 'Home', icon: Home},
		{href: '/assets', label: 'Marketplace', icon: TrendingUp},
		{href: '/portfolio', label: 'Portfolio', icon: Wallet, requireAuth: true},
		{href: '/documents', label: 'Documents', icon: FileText, requireAuth: true},
	]

	/**
	 * Check if navigation item should be shown
	 */
	const shouldShowItem = (item: (typeof navigationItems)[0]) => {
		if (item.requireAuth && !authenticated) return false
		return true
	}

	return (
		<nav className={cn('bg-slate-900/95 backdrop-blur-sm border-b border-slate-800', className)}>
			<div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
				<div className='flex justify-between h-16'>
					{/* Logo */}
					<div className='flex items-center'>
						<Link href='/' className='flex items-center space-x-2'>
							<div className='w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center'>
								<span className='text-white font-bold text-sm'>RWA</span>
							</div>
							<span className='font-semibold text-lg text-white'>Marketplace</span>
						</Link>
					</div>

					{/* Desktop Navigation */}
					<div className='hidden md:flex items-center space-x-8'>
						{navigationItems.filter(shouldShowItem).map((item) => {
							const Icon = item.icon
							const isActive = pathname === item.href

							return (
								<Link key={item.href} href={item.href} className={cn('flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors', isActive ? 'bg-slate-800 text-white' : 'text-slate-300 hover:text-white hover:bg-slate-800')}>
									<Icon className='h-4 w-4' />
									<span>{item.label}</span>
								</Link>
							)
						})}
					</div>

					{/* User Menu / Auth Buttons */}
					<div className='flex items-center space-x-4'>
						{loading ? (
							<LoadingSpinner size='sm' />
						) : authenticated && userData ? (
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button variant='ghost' className='relative h-8 w-8 rounded-full'>
										<Avatar className='h-8 w-8'>
											<AvatarImage src={userData.profile?.profile_image} alt={userData.profile?.first_name} />
											<AvatarFallback>{getUserInitials()}</AvatarFallback>
										</Avatar>
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent className='w-56' align='end' forceMount>
									<DropdownMenuLabel className='font-normal'>
										<div className='flex flex-col space-y-1'>
											<p className='text-sm font-medium leading-none'>
												{userData.profile?.first_name} {userData.profile?.last_name}
											</p>
											<p className='text-xs leading-none text-muted-foreground'>{userData.email}</p>
											<div className='flex items-center space-x-2 mt-2'>
												<Badge variant='outline' className='text-xs'>
													{userData.user_type}
												</Badge>
												{getKycBadge()}
											</div>
										</div>
									</DropdownMenuLabel>
									<DropdownMenuSeparator />
									<DropdownMenuItem asChild>
										<Link href='/profile' className='flex items-center'>
											<User className='mr-2 h-4 w-4' />
											<span>Profile</span>
										</Link>
									</DropdownMenuItem>
									<DropdownMenuItem asChild>
										<Link href='/profile/settings' className='flex items-center'>
											<Settings className='mr-2 h-4 w-4' />
											<span>Settings</span>
										</Link>
									</DropdownMenuItem>
									<DropdownMenuItem asChild>
										<Link href='/profile/kyc' className='flex items-center'>
											<Shield className='mr-2 h-4 w-4' />
											<span>KYC Verification</span>
										</Link>
									</DropdownMenuItem>
									<DropdownMenuSeparator />
									<DropdownMenuItem onClick={handleLogout}>
										<LogOut className='mr-2 h-4 w-4' />
										<span>Log out</span>
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						) : (
							<div className='flex items-center space-x-2'>
								<Button variant='ghost' asChild>
									<Link href='/login'>Sign In</Link>
								</Button>
								<Button asChild>
									<Link href='/login'>Get Started</Link>
								</Button>
							</div>
						)}

						{/* Mobile menu button */}
						<div className='md:hidden'>
							<Button variant='ghost' size='sm' onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
								{mobileMenuOpen ? <X className='h-5 w-5' /> : <Menu className='h-5 w-5' />}
							</Button>
						</div>
					</div>
				</div>

				{/* Mobile Navigation */}
				{mobileMenuOpen && (
					<div className='md:hidden'>
						<div className='px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t border-slate-800'>
							{navigationItems.filter(shouldShowItem).map((item) => {
								const Icon = item.icon
								const isActive = pathname === item.href

								return (
									<Link key={item.href} href={item.href} className={cn('flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium transition-colors', isActive ? 'bg-slate-800 text-white' : 'text-slate-300 hover:text-white hover:bg-slate-800')} onClick={() => setMobileMenuOpen(false)}>
										<Icon className='h-5 w-5' />
										<span>{item.label}</span>
									</Link>
								)
							})}
						</div>
					</div>
				)}
			</div>
		</nav>
	)
}
