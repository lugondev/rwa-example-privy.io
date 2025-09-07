'use client'

import React from 'react'
import {Card, CardContent} from '@/components/ui/card'
import {Badge} from '@/components/ui/badge'
import {TrendingUp, TrendingDown, MoreHorizontal} from 'lucide-react'
import {Button} from '@/components/ui/button'

interface Asset {
	id: string
	name: string
	symbol: string
	value: number
	change: number
	changePercent: number
	shares: number
	type?: 'stock' | 'crypto' | 'real-estate' | 'commodity'
}

interface AssetCardProps {
	asset: Asset
	onClick?: (asset: Asset) => void
	className?: string
	showActions?: boolean
}

/**
 * Asset card component for displaying individual asset information
 * Shows asset details, performance, and optional actions
 */
export function AssetCard({
	asset,
	onClick,
	className = '',
	showActions = true
}: AssetCardProps) {
	const isPositive = asset.change >= 0
	const percentage = ((asset.value / 41000) * 100).toFixed(1) // Mock total portfolio value

	// Get asset type color and icon
	const getAssetTypeInfo = (type: string = 'stock') => {
		switch (type) {
			case 'crypto':
				return {color: 'bg-orange-500', label: 'Crypto'}
			case 'real-estate':
				return {color: 'bg-green-500', label: 'Real Estate'}
			case 'commodity':
				return {color: 'bg-yellow-500', label: 'Commodity'}
			default:
				return {color: 'bg-blue-500', label: 'Stock'}
		}
	}

	const typeInfo = getAssetTypeInfo(asset.type)

	return (
		<Card 
			className={`bg-slate-900/50 border-slate-800 backdrop-blur-sm hover:bg-slate-800/50 transition-all duration-200 cursor-pointer group ${className}`}
			onClick={() => onClick?.(asset)}
		>
			<CardContent className='p-4'>
				<div className='flex items-start justify-between mb-3'>
					<div className='flex items-center gap-3'>
						{/* Asset Icon */}
						<div className={`w-12 h-12 ${typeInfo.color} rounded-full flex items-center justify-center relative`}>
							<span className='text-sm font-bold text-white'>
								{asset.symbol.charAt(0)}
							</span>
							{/* Type indicator */}
							<div className='absolute -bottom-1 -right-1 w-4 h-4 bg-slate-800 rounded-full flex items-center justify-center'>
								<div className={`w-2 h-2 ${typeInfo.color} rounded-full`}></div>
							</div>
						</div>

						{/* Asset Info */}
						<div className='flex-1'>
							<div className='flex items-center gap-2 mb-1'>
								<h3 className='font-semibold text-white text-sm group-hover:text-blue-400 transition-colors'>
									{asset.name}
								</h3>
								<Badge variant='outline' className='text-xs px-1 py-0 h-4'>
									{asset.symbol}
								</Badge>
							</div>
							<p className='text-xs text-slate-400'>
								{asset.shares} shares • {typeInfo.label}
							</p>
						</div>
					</div>

					{/* Actions */}
					{showActions && (
						<Button 
							variant='ghost' 
							size='sm'
							className='h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity'
							onClick={(e) => {
								e.stopPropagation()
								// Handle actions menu
							}}
						>
							<MoreHorizontal className='h-4 w-4' />
						</Button>
					)}
				</div>

				{/* Value and Performance */}
				<div className='space-y-3'>
					{/* Current Value */}
					<div className='flex items-center justify-between'>
						<span className='text-lg font-bold text-white'>
							${asset.value.toLocaleString()}
						</span>
						<span className='text-xs text-slate-400'>
							{percentage}% of portfolio
						</span>
					</div>

					{/* Performance */}
					<div className='flex items-center justify-between'>
						<div className={`flex items-center gap-1 text-sm ${
							isPositive ? 'text-green-400' : 'text-red-400'
						}`}>
							{isPositive ? (
								<TrendingUp className='h-3 w-3' />
							) : (
								<TrendingDown className='h-3 w-3' />
							)}
							<span>
								{isPositive ? '+' : ''}${Math.abs(asset.change).toLocaleString()}
							</span>
						</div>
						<span className={`text-sm font-medium ${
							isPositive ? 'text-green-400' : 'text-red-400'
						}`}>
							{isPositive ? '+' : ''}{asset.changePercent.toFixed(2)}%
						</span>
					</div>

					{/* Performance Bar */}
					<div className='w-full bg-slate-800 rounded-full h-1.5 overflow-hidden'>
						<div 
							className={`h-full transition-all duration-500 ${
								isPositive 
									? 'bg-gradient-to-r from-green-500 to-green-400' 
									: 'bg-gradient-to-r from-red-500 to-red-400'
							}`}
							style={{
								width: `${Math.min(Math.abs(asset.changePercent) * 10, 100)}%`
							}}
						/>
					</div>
				</div>
			</CardContent>
		</Card>
	)
}