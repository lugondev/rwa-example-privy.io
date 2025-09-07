'use client'

import {cn} from '@/lib/utils'
import {Loader2} from 'lucide-react'

interface LoadingSpinnerProps {
	size?: 'sm' | 'md' | 'lg'
	className?: string
	text?: string
}

/**
 * Reusable loading spinner component
 * Provides consistent loading states across the application
 */
export function LoadingSpinner({size = 'md', className, text}: LoadingSpinnerProps) {
	const sizeClasses = {
		sm: 'h-4 w-4',
		md: 'h-6 w-6',
		lg: 'h-8 w-8',
	}

	return (
		<div className={cn('flex items-center justify-center', className)}>
			<div className='flex flex-col items-center gap-2'>
				<Loader2 className={cn('animate-spin', sizeClasses[size])} />
				{text && <p className='text-sm text-muted-foreground'>{text}</p>}
			</div>
		</div>
	)
}

/**
 * Full page loading spinner
 */
export function PageLoadingSpinner({text = 'Loading...'}: {text?: string}) {
	return (
		<div className='min-h-screen flex items-center justify-center'>
			<LoadingSpinner size='lg' text={text} />
		</div>
	)
}

/**
 * Inline loading spinner for buttons
 */
export function ButtonLoadingSpinner() {
	return <Loader2 className='h-4 w-4 animate-spin' />
}
