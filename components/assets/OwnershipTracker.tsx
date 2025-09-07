'use client'

import React, {useState} from 'react'
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {Progress} from '@/components/ui/progress'
import {Badge} from '@/components/ui/badge'
import {Users, PieChart, TrendingUp, Calendar, DollarSign, Award, Clock, ArrowUpRight, ArrowDownRight} from 'lucide-react'
import {cn} from '@/lib/utils'

interface OwnershipData {
	totalShares: number
	availableShares: number
	userShares: number
	sharePrice: number
	totalOwners: number
	ownershipPercentage: number
	dividendYield: number
	lastDividendDate?: string
	nextDividendDate?: string
	totalDividendsEarned: number
}

interface TopOwner {
	id: string
	name: string
	avatar?: string
	shares: number
	percentage: number
	joinDate: string
}

interface OwnershipTrackerProps {
	data: OwnershipData
	topOwners: TopOwner[]
	className?: string
	onViewAllOwners?: () => void
}

/**
 * Enhanced ownership tracking component with detailed analytics
 */
export function OwnershipTracker({data, topOwners, className = '', onViewAllOwners}: OwnershipTrackerProps) {
	const [activeTab, setActiveTab] = useState<'overview' | 'dividends' | 'owners'>('overview')

	const {totalShares, availableShares, userShares, sharePrice, totalOwners, ownershipPercentage, dividendYield, lastDividendDate, nextDividendDate, totalDividendsEarned} = data

	const soldPercentage = ((totalShares - availableShares) / totalShares) * 100
	const userValue = userShares * sharePrice

	// Calculate ownership distribution
	const ownershipDistribution = [
		{label: 'Your Ownership', value: ownershipPercentage, color: 'bg-blue-500'},
		{label: 'Other Owners', value: soldPercentage - ownershipPercentage, color: 'bg-purple-500'},
		{label: 'Available', value: 100 - soldPercentage, color: 'bg-slate-600'},
	]

	return (
		<Card className={`bg-slate-900/50 border-slate-800 ${className}`}>
			<CardHeader>
				<div className='flex items-center justify-between'>
					<CardTitle className='text-white flex items-center gap-2'>
						<PieChart className='w-5 h-5' />
						Ownership Tracker
					</CardTitle>
					<div className='flex items-center gap-1'>
						{(['overview', 'dividends', 'owners'] as const).map((tab) => (
							<Button key={tab} variant={activeTab === tab ? 'default' : 'ghost'} size='sm' onClick={() => setActiveTab(tab)} className='text-xs capitalize'>
								{tab}
							</Button>
						))}
					</div>
				</div>
			</CardHeader>

			<CardContent className='space-y-6'>
				{activeTab === 'overview' && (
					<>
						{/* User Ownership Summary */}
						<div className='bg-slate-800/50 rounded-lg p-4'>
							<div className='flex items-center justify-between mb-3'>
								<h3 className='text-white font-medium'>Your Ownership</h3>
								<Badge variant='secondary' className='bg-blue-500/20 text-blue-400'>
									{ownershipPercentage.toFixed(2)}%
								</Badge>
							</div>

							<div className='grid grid-cols-2 gap-4'>
								<div>
									<div className='text-2xl font-bold text-white'>{userShares.toLocaleString()}</div>
									<div className='text-sm text-slate-400'>Shares Owned</div>
								</div>
								<div>
									<div className='text-2xl font-bold text-white'>
										$
										{userValue.toLocaleString('en-US', {
											minimumFractionDigits: 2,
											maximumFractionDigits: 2,
										})}
									</div>
									<div className='text-sm text-slate-400'>Current Value</div>
								</div>
							</div>
						</div>

						{/* Ownership Distribution */}
						<div>
							<h3 className='text-white font-medium mb-3'>Ownership Distribution</h3>
							<div className='space-y-3'>
								{ownershipDistribution.map((item, index) => (
									<div key={index} className='flex items-center justify-between'>
										<div className='flex items-center gap-3'>
											<div className={`w-3 h-3 rounded-full ${item.color}`} />
											<span className='text-slate-300 text-sm'>{item.label}</span>
										</div>
										<span className='text-white font-medium'>{item.value.toFixed(1)}%</span>
									</div>
								))}
							</div>

							<div className='mt-4'>
								<Progress value={soldPercentage} className='h-3 bg-slate-700' />
								<div className='flex justify-between text-xs text-slate-400 mt-2'>
									<span>0%</span>
									<span>{soldPercentage.toFixed(1)}% Sold</span>
									<span>100%</span>
								</div>
							</div>
						</div>

						{/* Key Metrics */}
						<div className='grid grid-cols-2 gap-4'>
							<div className='bg-slate-800/50 rounded-lg p-3'>
								<div className='flex items-center gap-2 mb-2'>
									<Users className='w-4 h-4 text-slate-400' />
									<span className='text-sm text-slate-400'>Total Owners</span>
								</div>
								<div className='text-xl font-bold text-white'>{totalOwners.toLocaleString()}</div>
							</div>

							<div className='bg-slate-800/50 rounded-lg p-3'>
								<div className='flex items-center gap-2 mb-2'>
									<DollarSign className='w-4 h-4 text-slate-400' />
									<span className='text-sm text-slate-400'>Share Price</span>
								</div>
								<div className='text-xl font-bold text-white'>${sharePrice.toFixed(2)}</div>
							</div>
						</div>
					</>
				)}

				{activeTab === 'dividends' && (
					<>
						{/* Dividend Summary */}
						<div className='bg-slate-800/50 rounded-lg p-4'>
							<div className='flex items-center gap-2 mb-3'>
								<Award className='w-5 h-5 text-green-400' />
								<h3 className='text-white font-medium'>Dividend Summary</h3>
							</div>

							<div className='grid grid-cols-2 gap-4'>
								<div>
									<div className='text-2xl font-bold text-green-400'>{dividendYield.toFixed(2)}%</div>
									<div className='text-sm text-slate-400'>Annual Yield</div>
								</div>
								<div>
									<div className='text-2xl font-bold text-white'>
										$
										{totalDividendsEarned.toLocaleString('en-US', {
											minimumFractionDigits: 2,
											maximumFractionDigits: 2,
										})}
									</div>
									<div className='text-sm text-slate-400'>Total Earned</div>
								</div>
							</div>
						</div>

						{/* Dividend Timeline */}
						<div>
							<h3 className='text-white font-medium mb-3'>Dividend Timeline</h3>
							<div className='space-y-3'>
								{lastDividendDate && (
									<div className='flex items-center justify-between p-3 bg-slate-800/30 rounded-lg'>
										<div className='flex items-center gap-3'>
											<div className='w-2 h-2 bg-green-400 rounded-full' />
											<div>
												<div className='text-white text-sm font-medium'>Last Dividend</div>
												<div className='text-slate-400 text-xs'>{new Date(lastDividendDate).toLocaleDateString()}</div>
											</div>
										</div>
										<ArrowDownRight className='w-4 h-4 text-green-400' />
									</div>
								)}

								{nextDividendDate && (
									<div className='flex items-center justify-between p-3 bg-slate-800/30 rounded-lg'>
										<div className='flex items-center gap-3'>
											<div className='w-2 h-2 bg-blue-400 rounded-full' />
											<div>
												<div className='text-white text-sm font-medium'>Next Dividend</div>
												<div className='text-slate-400 text-xs'>{new Date(nextDividendDate).toLocaleDateString()}</div>
											</div>
										</div>
										<Clock className='w-4 h-4 text-blue-400' />
									</div>
								)}
							</div>
						</div>
					</>
				)}

				{activeTab === 'owners' && (
					<>
						{/* Top Owners */}
						<div>
							<div className='flex items-center justify-between mb-4'>
								<h3 className='text-white font-medium'>Top Owners</h3>
								{onViewAllOwners && (
									<Button variant='ghost' size='sm' onClick={onViewAllOwners} className='text-blue-400 hover:text-blue-300'>
										View All
										<ArrowUpRight className='w-4 h-4 ml-1' />
									</Button>
								)}
							</div>

							<div className='space-y-3'>
								{topOwners.map((owner, index) => (
									<div key={owner.id} className='flex items-center justify-between p-3 bg-slate-800/30 rounded-lg hover:bg-slate-800/50 transition-colors'>
										<div className='flex items-center gap-3'>
											<div className='flex items-center justify-center w-8 h-8 bg-slate-700 rounded-full text-sm font-medium text-white'>#{index + 1}</div>
											<div>
												<div className='text-white text-sm font-medium'>{owner.name}</div>
												<div className='text-slate-400 text-xs'>Joined {new Date(owner.joinDate).toLocaleDateString()}</div>
											</div>
										</div>

										<div className='text-right'>
											<div className='text-white text-sm font-medium'>{owner.shares.toLocaleString()} shares</div>
											<div className='text-slate-400 text-xs'>{owner.percentage.toFixed(2)}%</div>
										</div>
									</div>
								))}
							</div>
						</div>
					</>
				)}
			</CardContent>
		</Card>
	)
}
