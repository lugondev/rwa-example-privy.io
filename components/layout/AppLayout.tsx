'use client'

import {Navigation} from './Navigation'
import {Footer} from './Footer'
import {AuthGuard} from '@/components/auth/AuthGuard'
import {Toaster} from 'sonner'
import {cn} from '@/lib/utils'

interface AppLayoutProps {
	children: React.ReactNode
	requireAuth?: boolean
	requireProfile?: boolean
	requireKyc?: boolean
	allowedUserTypes?: string[]
	showNavigation?: boolean
	showFooter?: boolean
	showSidebar?: boolean
	sidebarContent?: React.ReactNode
	className?: string
}

/**
 * Main application layout wrapper
 * Integrates navigation, sidebar, footer, authentication guards, and toast notifications
 */
export function AppLayout({
	children, 
	requireAuth = false, 
	requireProfile = false, 
	requireKyc = false, 
	allowedUserTypes = [], 
	showNavigation = true, 
	showFooter = true,
	showSidebar = false,
	sidebarContent,
	className
}: AppLayoutProps) {
	return (
		<div className='min-h-screen bg-slate-950 flex flex-col'>
			{showNavigation && <Navigation />}

			<div className='flex flex-1'>
				{showSidebar && sidebarContent && (
					<aside className='flex-shrink-0'>
						{sidebarContent}
					</aside>
				)}

				<main className={cn('flex-1 flex flex-col', className)}>
					<div className='flex-1'>
						<AuthGuard requireAuth={requireAuth} requireProfile={requireProfile} requireKyc={requireKyc} allowedUserTypes={allowedUserTypes}>
							{children}
						</AuthGuard>
					</div>
				</main>
			</div>

			{showFooter && <Footer />}

			<Toaster
				position='top-right'
				toastOptions={{
					style: {
						background: 'hsl(var(--background))',
						color: 'hsl(var(--foreground))',
						border: '1px solid hsl(var(--border))',
					},
				}}
			/>
		</div>
	)
}

/**
 * Layout for authenticated pages
 */
export function AuthenticatedLayout({children, ...props}: Omit<AppLayoutProps, 'requireAuth'>) {
	return (
		<AppLayout requireAuth={true} {...props}>
			{children}
		</AppLayout>
	)
}

/**
 * Layout for profile pages
 */
export function ProfileLayout({children, ...props}: Omit<AppLayoutProps, 'requireAuth' | 'requireProfile'>) {
	return (
		<AppLayout requireAuth={true} requireProfile={true} {...props}>
			{children}
		</AppLayout>
	)
}

/**
 * Layout for KYC-required pages
 */
export function KycLayout({children, ...props}: Omit<AppLayoutProps, 'requireAuth' | 'requireKyc'>) {
	return (
		<AppLayout requireAuth={true} requireKyc={true} {...props}>
			{children}
		</AppLayout>
	)
}

/**
 * Layout for public pages (no authentication required)
 */
export function PublicLayout({children, ...props}: Omit<AppLayoutProps, 'requireAuth'>) {
	return (
		<AppLayout requireAuth={false} {...props}>
			{children}
		</AppLayout>
	)
}
