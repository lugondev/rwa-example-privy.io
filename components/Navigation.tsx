'use client'

import React, {useState, useCallback, useMemo} from 'react'
import {motion, AnimatePresence} from 'framer-motion'
import {usePrivy} from '@privy-io/react-auth'
import {useToast} from '@/hooks/useToast'
import {SimpleConnectButton} from './SimpleConnectButton'
import {Menu, X, Home, Search, Plus, Vault, PieChart, CreditCard, Building, User, Wallet, LogIn, LogOut} from 'lucide-react'
import Link from 'next/link'

const Navigation = React.memo(() => {
	const [isOpen, setIsOpen] = useState(false)
	const {ready, authenticated, user, login, logout} = usePrivy()
	const {showSuccess, showError, messages} = useToast()

	// Memoize navigation items to prevent recreation
	const navigationItems = useMemo(
		() => [
			{href: '/', label: 'Home', icon: Home},
			{href: '/assets', label: 'Assets', icon: Search},
			{href: '/assets/create', label: 'Create', icon: Plus},
			{href: '/vaults', label: 'Vaults', icon: Vault},
			{href: '/portfolio', label: 'Portfolio', icon: PieChart},
		],
		[],
	)

	// Memoize event handlers
	const toggleMenu = useCallback(() => {
		setIsOpen((prev) => !prev)
	}, [])

	const closeMenu = useCallback(() => {
		setIsOpen(false)
	}, [])

	const handleLogout = useCallback(async () => {
		try {
			await logout()
			showSuccess(messages.auth.logoutSuccess)
			setIsOpen(false)
		} catch (error) {
			showError(messages.auth.logoutError)
		}
	}, [logout, showSuccess, showError, messages])

	const handleLogin = useCallback(async () => {
		try {
			await login()
			showSuccess(messages.auth.loginSuccess)
			setIsOpen(false)
		} catch (error) {
			showError(messages.auth.loginError)
		}
	}, [login, showSuccess, showError, messages])

	return (
		<nav className='sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800'>
			<div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
				<div className='flex justify-between items-center h-16'>
					{/* Logo */}
					<Link href='/' className='flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-blue-500/50 rounded-lg' aria-label='RWA Marketplace - Go to homepage'>
						<img src='/logo.png' alt='RWA Marketplace Logo' className='w-8 h-8 object-contain' />
						<span className='font-playfair text-xl font-bold text-white'>Marketplace</span>
					</Link>

					{/* Desktop Navigation */}
					<div className='hidden md:flex items-center space-x-1'>
						{navigationItems.map((item) => {
							const Icon = item.icon
							return (
								<Link key={item.href} href={item.href} className='flex items-center space-x-2 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50'>
									<Icon className='w-4 h-4' />
									<span className='text-sm font-medium'>{item.label}</span>
								</Link>
							)
						})}
					</div>

					{/* Auth & Wallet Section */}
					<div className='hidden md:flex items-center space-x-4'>
						{ready && authenticated ? (
							<>
								<Link href='/wallet' className='flex items-center space-x-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50' aria-label='Access wallet'>
									<Wallet className='w-4 h-4' />
									<span className='text-sm font-medium'>Wallet</span>
								</Link>

								<Link href={`/profile/${user?.wallet?.address}`} className='flex items-center space-x-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50' aria-label='View user profile'>
									<User className='w-4 h-4' />
									<span className='text-sm font-medium'>Profile</span>
								</Link>

								<button onClick={handleLogout} className='flex items-center space-x-2 px-4 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500/50' aria-label='Logout from account'>
									<LogOut className='w-4 h-4' />
									<span className='text-sm font-medium'>Logout</span>
								</button>
							</>
						) : (
							<SimpleConnectButton />
						)}
					</div>

					{/* Mobile menu button */}
					<button onClick={toggleMenu} className='md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50' aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'} aria-expanded={isOpen} aria-controls='mobile-navigation'>
						{isOpen ? <X className='w-6 h-6' /> : <Menu className='w-6 h-6' />}
					</button>
				</div>
			</div>

			{/* Mobile Navigation */}
			<AnimatePresence>
				{isOpen && (
					<motion.div initial={{opacity: 0, height: 0}} animate={{opacity: 1, height: 'auto'}} exit={{opacity: 0, height: 0}} className='md:hidden bg-slate-900 border-t border-slate-800' id='mobile-navigation' role='navigation' aria-label='Mobile navigation menu'>
						<div className='px-4 py-4 space-y-2'>
							{navigationItems.map((item) => {
								const Icon = item.icon
								return (
									<Link key={item.href} href={item.href} onClick={closeMenu} className='flex items-center space-x-3 px-4 py-3 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50'>
										<Icon className='w-5 h-5' />
										<span className='font-medium'>{item.label}</span>
									</Link>
								)
							})}

							<div className='pt-4 border-t border-slate-800'>
								{ready && authenticated ? (
									<>
										<Link href='/wallet' onClick={closeMenu} className='flex items-center space-x-3 px-4 py-3 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50'>
											<Wallet className='w-5 h-5' />
											<span className='font-medium'>Wallet</span>
										</Link>

										<Link href={`/profile/${user?.wallet?.address}`} onClick={closeMenu} className='flex items-center space-x-3 px-4 py-3 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50'>
											<User className='w-5 h-5' />
											<span className='font-medium'>Profile</span>
										</Link>

										<button onClick={handleLogout} className='w-full flex items-center space-x-3 px-4 py-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500/50'>
											<LogOut className='w-5 h-5' />
											<span className='font-medium'>Logout</span>
										</button>
									</>
								) : (
									<SimpleConnectButton />
								)}
							</div>
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</nav>
	)
})

Navigation.displayName = 'Navigation'

export default Navigation
