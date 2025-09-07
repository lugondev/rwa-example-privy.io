'use client'

import React from 'react'
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {BarChart3, TrendingUp} from 'lucide-react'

interface PortfolioChartProps {
	data?: Array<{
		date: string
		value: number
	}>
	title?: string
	className?: string
}

/**
 * Portfolio performance chart component
 * Displays portfolio value over time with mock data
 */
export function PortfolioChart({
	data = [],
	title = 'Portfolio Performance',
	className = ''
}: PortfolioChartProps) {
	// Mock data for demonstration
	const mockData = [
		{date: '1 Jan', value: 35000},
		{date: '1 Feb', value: 37500},
		{date: '1 Mar', value: 36800},
		{date: '1 Apr', value: 39200},
		{date: '1 May', value: 41000},
		{date: '1 Jun', value: 40500},
		{date: 'Today', value: 41000}
	]

	const chartData = data.length > 0 ? data : mockData
	const maxValue = Math.max(...chartData.map(d => d.value))
	const minValue = Math.min(...chartData.map(d => d.value))
	const totalGrowth = ((chartData[chartData.length - 1].value - chartData[0].value) / chartData[0].value * 100).toFixed(2)

	return (
		<Card className={`bg-slate-900/50 border-slate-800 backdrop-blur-sm ${className}`}>
			<CardHeader>
				<CardTitle className='text-white flex items-center justify-between'>
					<div className='flex items-center gap-2'>
						<BarChart3 className='h-5 w-5 text-blue-400' />
						{title}
					</div>
					<div className='flex items-center gap-1 text-green-400 text-sm'>
						<TrendingUp className='h-4 w-4' />
						+{totalGrowth}%
					</div>
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div className='h-64 relative'>
					{/* Chart Area */}
					<div className='absolute inset-0 bg-slate-800/30 rounded-lg p-4'>
						{/* Y-axis labels */}
						<div className='absolute left-0 top-0 bottom-0 flex flex-col justify-between text-xs text-slate-400 pr-2'>
							<span>${(maxValue / 1000).toFixed(0)}k</span>
							<span>${((maxValue + minValue) / 2000).toFixed(0)}k</span>
							<span>${(minValue / 1000).toFixed(0)}k</span>
						</div>

						{/* Chart bars */}
						<div className='ml-8 h-full flex items-end justify-between gap-2'>
							{chartData.map((point, index) => {
								const height = ((point.value - minValue) / (maxValue - minValue)) * 100
								const isLast = index === chartData.length - 1
								return (
									<div key={index} className='flex flex-col items-center flex-1'>
										<div 
											className={`w-full rounded-t-sm transition-all duration-500 ${
												isLast 
													? 'bg-gradient-to-t from-blue-500 to-blue-400' 
													: 'bg-gradient-to-t from-slate-600 to-slate-500'
											}`}
											style={{height: `${height}%`}}
										/>
										<span className='text-xs text-slate-400 mt-2 text-center'>
											{point.date}
										</span>
									</div>
								)
							})}
						</div>

						{/* Grid lines */}
						<div className='absolute inset-0 ml-8'>
							{[0, 33, 66, 100].map((position) => (
								<div 
									key={position}
									className='absolute w-full border-t border-slate-700/30'
									style={{bottom: `${position}%`}}
								/>
							))}
						</div>
					</div>

					{/* Performance metrics */}
					<div className='absolute bottom-2 right-2 bg-slate-800/80 rounded-lg p-2'>
						<div className='text-xs text-slate-300'>
							<div>Current: ${chartData[chartData.length - 1].value.toLocaleString()}</div>
							<div className='text-green-400'>Growth: +{totalGrowth}%</div>
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	)
}