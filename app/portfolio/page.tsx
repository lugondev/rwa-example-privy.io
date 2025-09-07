'use client'

import {useState, useEffect} from 'react'
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {Badge} from '@/components/ui/badge'
import {PortfolioLayout} from '@/components/layout/PortfolioLayout'
import {Wallet, TrendingUp, TrendingDown, DollarSign, PieChart, BarChart3, Activity} from 'lucide-react'

interface Asset {
	id: string
	name: string
	symbol: string
	value: number
	change: number
	changePercent: number
	shares: number
}

export default function Portfolio() {
	const [assets, setAssets] = useState<Asset[]>([])
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		// Simulate API call
		const timer = setTimeout(() => {
			setAssets([
				{
					id: '1',
					name: 'Tesla Stock',
					symbol: 'TSLA',
					value: 15000,
					change: 750,
					changePercent: 5.26,
					shares: 50,
				},
				{
					id: '2',
					name: 'Apple Stock',
					symbol: 'AAPL',
					value: 8500,
					change: -200,
					changePercent: -2.3,
					shares: 45,
				},
				{
					id: '3',
					name: 'Real Estate Token',
					symbol: 'RET',
					value: 12000,
					change: 300,
					changePercent: 2.56,
					shares: 120,
				},
				{
					id: '4',
					name: 'Gold Token',
					symbol: 'GOLD',
					value: 5500,
					change: -150,
					changePercent: -2.65,
					shares: 25,
				},
			])
			setLoading(false)
		}, 1000)

		return () => clearTimeout(timer)
	}, [])

	const totalValue = assets.reduce((sum, asset) => sum + asset.value, 0)
	const totalChange = assets.reduce((sum, asset) => sum + asset.change, 0)
	const totalChangePercent = totalValue > 0 ? (totalChange / (totalValue - totalChange)) * 100 : 0

	if (loading) {
		return (
			<PortfolioLayout>
				<div className='p-6'>
					<div className='animate-pulse'>
						<div className='h-8 bg-slate-800 rounded w-48 mb-6'></div>
						<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
							{[1, 2, 3, 4].map((i) => (
								<div key={i} className='h-32 bg-slate-800 rounded-lg'></div>
							))}
						</div>
						<div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
							<div className='h-64 bg-slate-800 rounded-lg'></div>
							<div className='h-64 bg-slate-800 rounded-lg'></div>
						</div>
					</div>
				</div>
			</PortfolioLayout>
		)
	}

	return (
		<PortfolioLayout>
			<div className='p-6 space-y-6'>
				{/* Header */}
				<div className='flex items-center justify-between'>
					<div className='flex items-center gap-3'>
						<PieChart className='h-8 w-8 text-blue-400' />
						<div>
							<h1 className='text-3xl font-bold text-white'>Portfolio Overview</h1>
							<p className='text-slate-400'>Track your investments and performance</p>
						</div>
					</div>
					<div className='flex items-center gap-2'>
						<Badge variant='outline' className='text-green-400 border-green-400'>
							<Activity className='h-3 w-3 mr-1' />
							Live
						</Badge>
					</div>
				</div>

				{/* Quick Stats */}
				<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
					<Card className='bg-slate-900/50 border-slate-800 backdrop-blur-sm'>
						<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
							<CardTitle className='text-sm font-medium text-slate-400'>Total Value</CardTitle>
							<DollarSign className='h-4 w-4 text-slate-400' />
						</CardHeader>
						<CardContent>
							<div className='text-2xl font-bold text-white'>${totalValue.toLocaleString()}</div>
							<p className='text-xs text-slate-400 mt-1'>Portfolio value</p>
						</CardContent>
					</Card>

					<Card className='bg-slate-900/50 border-slate-800 backdrop-blur-sm'>
						<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
							<CardTitle className='text-sm font-medium text-slate-400'>Total Change</CardTitle>
							{totalChange >= 0 ? <TrendingUp className='h-4 w-4 text-green-400' /> : <TrendingDown className='h-4 w-4 text-red-400' />}
						</CardHeader>
						<CardContent>
							<div className={`text-2xl font-bold ${totalChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
								{totalChange >= 0 ? '+' : ''}${Math.abs(totalChange).toLocaleString()}
							</div>
							<p className={`text-xs ${totalChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
								{totalChange >= 0 ? '+' : ''}{totalChangePercent.toFixed(2)}% today
							</p>
						</CardContent>
					</Card>

					<Card className='bg-slate-900/50 border-slate-800 backdrop-blur-sm'>
						<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
							<CardTitle className='text-sm font-medium text-slate-400'>Total Assets</CardTitle>
							<Wallet className='h-4 w-4 text-slate-400' />
						</CardHeader>
						<CardContent>
							<div className='text-2xl font-bold text-white'>{assets.length}</div>
							<p className='text-xs text-slate-400 mt-1'>Active positions</p>
						</CardContent>
					</Card>

					<Card className='bg-slate-900/50 border-slate-800 backdrop-blur-sm'>
						<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
							<CardTitle className='text-sm font-medium text-slate-400'>Performance</CardTitle>
							<BarChart3 className='h-4 w-4 text-slate-400' />
						</CardHeader>
						<CardContent>
							<div className='text-2xl font-bold text-blue-400'>+12.5%</div>
							<p className='text-xs text-slate-400 mt-1'>30-day return</p>
						</CardContent>
					</Card>
				</div>

				{/* Main Content Grid */}
				<div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
					{/* Portfolio Chart */}
					<Card className='bg-slate-900/50 border-slate-800 backdrop-blur-sm'>
						<CardHeader>
							<CardTitle className='text-white flex items-center gap-2'>
								<BarChart3 className='h-5 w-5 text-blue-400' />
								Portfolio Performance
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className='h-64 flex items-center justify-center bg-slate-800/50 rounded-lg'>
								<div className='text-center text-slate-400'>
									<BarChart3 className='h-12 w-12 mx-auto mb-2 opacity-50' />
									<p>Performance chart will be displayed here</p>
									<p className='text-xs mt-1'>Integration with charting library needed</p>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Asset Allocation */}
					<Card className='bg-slate-900/50 border-slate-800 backdrop-blur-sm'>
						<CardHeader>
							<CardTitle className='text-white flex items-center gap-2'>
								<PieChart className='h-5 w-5 text-purple-400' />
								Asset Allocation
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className='space-y-4'>
								{assets.map((asset, index) => {
									const percentage = ((asset.value / totalValue) * 100).toFixed(1)
									const colors = ['bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-yellow-500']
									return (
										<div key={asset.id} className='flex items-center justify-between'>
											<div className='flex items-center gap-3'>
												<div className={`w-3 h-3 rounded-full ${colors[index % colors.length]}`}></div>
												<span className='text-sm text-white'>{asset.symbol}</span>
											</div>
											<span className='text-sm text-slate-400'>{percentage}%</span>
										</div>
									)
								})}
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Assets List */}
				<Card className='bg-slate-900/50 border-slate-800 backdrop-blur-sm'>
					<CardHeader>
						<CardTitle className='text-white flex items-center gap-2'>
							<Wallet className='h-5 w-5 text-green-400' />
							Your Assets
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className='space-y-4'>
							{assets.map((asset) => (
								<div key={asset.id} className='flex items-center justify-between p-4 bg-slate-800/50 rounded-lg hover:bg-slate-800/70 transition-colors'>
									<div className='flex items-center gap-4'>
										<div className='w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center'>
											<span className='text-sm font-bold text-white'>{asset.symbol.charAt(0)}</span>
										</div>
										<div>
											<h3 className='font-semibold text-white'>{asset.name}</h3>
											<p className='text-sm text-slate-400'>{asset.shares} shares • {asset.symbol}</p>
										</div>
									</div>
									<div className='text-right'>
										<div className='font-semibold text-white text-lg'>${asset.value.toLocaleString()}</div>
										<div className={`text-sm flex items-center gap-1 justify-end ${asset.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
											{asset.change >= 0 ? <TrendingUp className='h-3 w-3' /> : <TrendingDown className='h-3 w-3' />}
											{asset.change >= 0 ? '+' : ''}${Math.abs(asset.change).toLocaleString()} ({asset.changePercent.toFixed(2)}%)
										</div>
									</div>
								</div>
							))}
						</div>
					</CardContent>
				</Card>
			</div>
		</PortfolioLayout>
	)
}
