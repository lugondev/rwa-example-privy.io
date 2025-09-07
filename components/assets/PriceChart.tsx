'use client'

import React, {useState, useMemo} from 'react'
import {LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart} from 'recharts'
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {TrendingUp, TrendingDown, Activity, DollarSign} from 'lucide-react'
import {cn} from '@/lib/utils'

interface PriceDataPoint {
	timestamp: string
	price: number
	volume?: number
	date: string
}

interface PriceChartProps {
	data: PriceDataPoint[]
	currentPrice: number
	priceChange24h: number
	priceChangePercent24h: number
	className?: string
}

type TimeRange = '1D' | '7D' | '1M' | '3M' | '1Y' | 'ALL'

/**
 * Enhanced price chart component with multiple timeframes and interactive features
 */
export function PriceChart({data, currentPrice, priceChange24h, priceChangePercent24h, className = ''}: PriceChartProps) {
	const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>('7D')
	const [chartType, setChartType] = useState<'line' | 'area'>('area')

	const timeRanges: TimeRange[] = ['1D', '7D', '1M', '3M', '1Y', 'ALL']

	// Filter data based on selected time range
	const filteredData = useMemo(() => {
		const now = new Date()
		let startDate = new Date()

		switch (selectedTimeRange) {
			case '1D':
				startDate.setDate(now.getDate() - 1)
				break
			case '7D':
				startDate.setDate(now.getDate() - 7)
				break
			case '1M':
				startDate.setMonth(now.getMonth() - 1)
				break
			case '3M':
				startDate.setMonth(now.getMonth() - 3)
				break
			case '1Y':
				startDate.setFullYear(now.getFullYear() - 1)
				break
			case 'ALL':
				return data
		}

		return data.filter((point) => new Date(point.timestamp) >= startDate)
	}, [data, selectedTimeRange])

	// Calculate price statistics
	const priceStats = useMemo(() => {
		if (filteredData.length === 0) return null

		const prices = filteredData.map((d) => d.price)
		const minPrice = Math.min(...prices)
		const maxPrice = Math.max(...prices)
		const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length

		return {
			min: minPrice,
			max: maxPrice,
			avg: avgPrice,
			range: maxPrice - minPrice,
		}
	}, [filteredData])

	// Custom tooltip component
	const CustomTooltip = ({active, payload, label}: any) => {
		if (active && payload && payload.length) {
			const data = payload[0].payload
			return (
				<div className='bg-slate-900/95 backdrop-blur-sm border border-slate-700 rounded-lg p-3 shadow-xl'>
					<p className='text-slate-300 text-sm mb-1'>{data.date}</p>
					<p className='text-white font-semibold'>
						$
						{payload[0].value.toLocaleString('en-US', {
							minimumFractionDigits: 2,
							maximumFractionDigits: 2,
						})}
					</p>
					{data.volume && <p className='text-slate-400 text-xs mt-1'>Volume: {data.volume.toLocaleString()}</p>}
				</div>
			)
		}
		return null
	}

	const isPositive = priceChange24h >= 0

	return (
		<Card className={`bg-slate-900/50 border-slate-800 ${className}`}>
			<CardHeader>
				<div className='flex items-center justify-between'>
					<CardTitle className='text-white flex items-center gap-2'>
						<Activity className='w-5 h-5' />
						Price Chart
					</CardTitle>
					<div className='flex items-center gap-2'>
						<Button variant={chartType === 'line' ? 'default' : 'outline'} size='sm' onClick={() => setChartType('line')} className='text-xs'>
							Line
						</Button>
						<Button variant={chartType === 'area' ? 'default' : 'outline'} size='sm' onClick={() => setChartType('area')} className='text-xs'>
							Area
						</Button>
					</div>
				</div>

				{/* Price Summary */}
				<div className='flex items-center justify-between mt-4'>
					<div>
						<div className='flex items-center gap-3'>
							<span className='text-2xl font-bold text-white'>
								$
								{currentPrice.toLocaleString('en-US', {
									minimumFractionDigits: 2,
									maximumFractionDigits: 2,
								})}
							</span>
							<div className={cn('flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium', isPositive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400')}>
								{isPositive ? <TrendingUp className='w-4 h-4' /> : <TrendingDown className='w-4 h-4' />}
								{isPositive ? '+' : ''}
								{priceChangePercent24h.toFixed(2)}%
							</div>
						</div>
						<div className='text-slate-400 text-sm mt-1'>
							{isPositive ? '+' : ''}${priceChange24h.toFixed(2)} (24h)
						</div>
					</div>

					{priceStats && (
						<div className='text-right'>
							<div className='text-xs text-slate-400 space-y-1'>
								<div>High: ${priceStats.max.toFixed(2)}</div>
								<div>Low: ${priceStats.min.toFixed(2)}</div>
								<div>Avg: ${priceStats.avg.toFixed(2)}</div>
							</div>
						</div>
					)}
				</div>

				{/* Time Range Selector */}
				<div className='flex items-center gap-1 mt-4'>
					{timeRanges.map((range) => (
						<Button key={range} variant={selectedTimeRange === range ? 'default' : 'ghost'} size='sm' onClick={() => setSelectedTimeRange(range)} className='text-xs px-3 py-1 h-8'>
							{range}
						</Button>
					))}
				</div>
			</CardHeader>

			<CardContent>
				<div className='h-80'>
					<ResponsiveContainer width='100%' height='100%'>
						{chartType === 'area' ? (
							<AreaChart data={filteredData}>
								<defs>
									<linearGradient id='priceGradient' x1='0' y1='0' x2='0' y2='1'>
										<stop offset='5%' stopColor={isPositive ? '#10B981' : '#EF4444'} stopOpacity={0.3} />
										<stop offset='95%' stopColor={isPositive ? '#10B981' : '#EF4444'} stopOpacity={0} />
									</linearGradient>
								</defs>
								<CartesianGrid strokeDasharray='3 3' stroke='#374151' opacity={0.3} />
								<XAxis dataKey='date' stroke='#9CA3AF' fontSize={12} tickLine={false} axisLine={false} />
								<YAxis stroke='#9CA3AF' fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value.toFixed(0)}`} />
								<Tooltip content={<CustomTooltip />} />
								<Area
									type='monotone'
									dataKey='price'
									stroke={isPositive ? '#10B981' : '#EF4444'}
									strokeWidth={2}
									fill='url(#priceGradient)'
									dot={false}
									activeDot={{
										r: 4,
										fill: isPositive ? '#10B981' : '#EF4444',
										strokeWidth: 2,
										stroke: '#1F2937',
									}}
								/>
							</AreaChart>
						) : (
							<LineChart data={filteredData}>
								<CartesianGrid strokeDasharray='3 3' stroke='#374151' opacity={0.3} />
								<XAxis dataKey='date' stroke='#9CA3AF' fontSize={12} tickLine={false} axisLine={false} />
								<YAxis stroke='#9CA3AF' fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value.toFixed(0)}`} />
								<Tooltip content={<CustomTooltip />} />
								<Line
									type='monotone'
									dataKey='price'
									stroke={isPositive ? '#10B981' : '#EF4444'}
									strokeWidth={2}
									dot={false}
									activeDot={{
										r: 4,
										fill: isPositive ? '#10B981' : '#EF4444',
										strokeWidth: 2,
										stroke: '#1F2937',
									}}
								/>
							</LineChart>
						)}
					</ResponsiveContainer>
				</div>
			</CardContent>
		</Card>
	)
}
