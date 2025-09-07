'use client'

import React, {useState} from 'react'
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {Badge} from '@/components/ui/badge'
import {Button} from '@/components/ui/button'
import {History, ArrowUpRight, ArrowDownLeft, Filter, Search} from 'lucide-react'
import {Input} from '@/components/ui/input'

interface Transaction {
	id: string
	type: 'buy' | 'sell' | 'dividend' | 'transfer'
	asset: string
	symbol: string
	amount: number
	price: number
	total: number
	date: string
	status: 'completed' | 'pending' | 'failed'
}

interface TransactionHistoryProps {
	transactions?: Transaction[]
	className?: string
	limit?: number
	showSearch?: boolean
}

/**
 * Transaction history component
 * Displays a list of portfolio transactions with filtering and search
 */
export function TransactionHistory({
	transactions = [],
	className = '',
	limit,
	showSearch = true
}: TransactionHistoryProps) {
	const [searchTerm, setSearchTerm] = useState('')
	const [filterType, setFilterType] = useState<string>('all')

	// Mock transaction data
	const mockTransactions: Transaction[] = [
		{
			id: '1',
			type: 'buy',
			asset: 'Tesla Stock',
			symbol: 'TSLA',
			amount: 10,
			price: 250.00,
			total: 2500.00,
			date: '2024-01-15T10:30:00Z',
			status: 'completed'
		},
		{
			id: '2',
			type: 'sell',
			asset: 'Apple Stock',
			symbol: 'AAPL',
			amount: 5,
			price: 180.00,
			total: 900.00,
			date: '2024-01-14T14:20:00Z',
			status: 'completed'
		},
		{
			id: '3',
			type: 'dividend',
			asset: 'Real Estate Token',
			symbol: 'RET',
			amount: 0,
			price: 0,
			total: 125.50,
			date: '2024-01-13T09:00:00Z',
			status: 'completed'
		},
		{
			id: '4',
			type: 'buy',
			asset: 'Gold Token',
			symbol: 'GOLD',
			amount: 15,
			price: 220.00,
			total: 3300.00,
			date: '2024-01-12T16:45:00Z',
			status: 'pending'
		},
		{
			id: '5',
			type: 'transfer',
			asset: 'Portfolio Transfer',
			symbol: 'USD',
			amount: 0,
			price: 0,
			total: 5000.00,
			date: '2024-01-11T11:15:00Z',
			status: 'completed'
		}
	]

	const allTransactions = transactions.length > 0 ? transactions : mockTransactions

	// Filter and search transactions
	const filteredTransactions = allTransactions
		.filter(tx => {
			if (filterType !== 'all' && tx.type !== filterType) return false
			if (searchTerm && !tx.asset.toLowerCase().includes(searchTerm.toLowerCase()) && 
				!tx.symbol.toLowerCase().includes(searchTerm.toLowerCase())) return false
			return true
		})
		.slice(0, limit)

	// Get transaction type info
	const getTransactionInfo = (type: string) => {
		switch (type) {
			case 'buy':
				return {
					icon: ArrowDownLeft,
					color: 'text-green-400',
					bgColor: 'bg-green-400/10',
					label: 'Buy'
				}
			case 'sell':
				return {
					icon: ArrowUpRight,
					color: 'text-red-400',
					bgColor: 'bg-red-400/10',
					label: 'Sell'
				}
			case 'dividend':
				return {
					icon: ArrowDownLeft,
					color: 'text-blue-400',
					bgColor: 'bg-blue-400/10',
					label: 'Dividend'
				}
			case 'transfer':
				return {
					icon: ArrowUpRight,
					color: 'text-purple-400',
					bgColor: 'bg-purple-400/10',
					label: 'Transfer'
				}
			default:
				return {
					icon: ArrowDownLeft,
					color: 'text-slate-400',
					bgColor: 'bg-slate-400/10',
					label: 'Unknown'
				}
		}
	}

	// Get status badge
	const getStatusBadge = (status: string) => {
		switch (status) {
			case 'completed':
				return <Badge variant='outline' className='text-green-400 border-green-400 text-xs'>Completed</Badge>
			case 'pending':
				return <Badge variant='outline' className='text-yellow-400 border-yellow-400 text-xs'>Pending</Badge>
			case 'failed':
				return <Badge variant='outline' className='text-red-400 border-red-400 text-xs'>Failed</Badge>
			default:
				return <Badge variant='outline' className='text-slate-400 border-slate-400 text-xs'>Unknown</Badge>
		}
	}

	// Format date
	const formatDate = (dateString: string) => {
		const date = new Date(dateString)
		return {
			date: date.toLocaleDateString('en-US', {month: 'short', day: 'numeric'}),
			time: date.toLocaleTimeString('en-US', {hour: '2-digit', minute: '2-digit'})
		}
	}

	return (
		<Card className={`bg-slate-900/50 border-slate-800 backdrop-blur-sm ${className}`}>
			<CardHeader>
				<div className='flex items-center justify-between'>
					<CardTitle className='text-white flex items-center gap-2'>
						<History className='h-5 w-5 text-blue-400' />
						Transaction History
					</CardTitle>
					<div className='flex items-center gap-2'>
						{showSearch && (
							<>
								<div className='relative'>
									<Search className='absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400' />
									<Input
										placeholder='Search transactions...'
										value={searchTerm}
										onChange={(e) => setSearchTerm(e.target.value)}
										className='pl-8 h-8 w-48 bg-slate-800 border-slate-700'
									/>
								</div>
								<Button
									variant='outline'
									size='sm'
									className='h-8'
									onClick={() => {
										// Toggle filter dropdown
										setFilterType(filterType === 'all' ? 'buy' : 'all')
									}}
								>
									<Filter className='h-4 w-4' />
								</Button>
							</>
						)}
					</div>
				</div>
			</CardHeader>
			<CardContent>
				<div className='space-y-3'>
					{filteredTransactions.length === 0 ? (
						<div className='text-center py-8 text-slate-400'>
							<History className='h-12 w-12 mx-auto mb-2 opacity-50' />
							<p>No transactions found</p>
						</div>
					) : (
						filteredTransactions.map((transaction) => {
							const txInfo = getTransactionInfo(transaction.type)
							const {date, time} = formatDate(transaction.date)
							const Icon = txInfo.icon

							return (
								<div 
									key={transaction.id} 
									className='flex items-center justify-between p-3 bg-slate-800/30 rounded-lg hover:bg-slate-800/50 transition-colors'
								>
									<div className='flex items-center gap-3'>
										{/* Transaction Icon */}
										<div className={`w-10 h-10 rounded-full flex items-center justify-center ${txInfo.bgColor}`}>
											<Icon className={`h-4 w-4 ${txInfo.color}`} />
										</div>

										{/* Transaction Details */}
										<div>
											<div className='flex items-center gap-2 mb-1'>
												<span className='font-medium text-white text-sm'>
													{txInfo.label} {transaction.asset}
												</span>
												{getStatusBadge(transaction.status)}
											</div>
											<div className='text-xs text-slate-400'>
												{transaction.type !== 'dividend' && transaction.type !== 'transfer' && (
													<span>{transaction.amount} shares @ ${transaction.price.toFixed(2)} • </span>
												)}
												{date} at {time}
											</div>
										</div>
									</div>

									{/* Transaction Amount */}
									<div className='text-right'>
										<div className={`font-semibold text-sm ${
											transaction.type === 'buy' || transaction.type === 'transfer' 
												? 'text-red-400' 
												: 'text-green-400'
										}`}>
											{transaction.type === 'buy' || transaction.type === 'transfer' ? '-' : '+'}
											${transaction.total.toLocaleString()}
										</div>
										<div className='text-xs text-slate-400'>
											{transaction.symbol}
										</div>
									</div>
								</div>
							)
						})
					)}
				</div>

				{/* Show more button */}
				{!limit && filteredTransactions.length > 0 && (
					<div className='pt-4 border-t border-slate-800'>
						<Button variant='outline' className='w-full' size='sm'>
							View All Transactions
						</Button>
					</div>
				)}
			</CardContent>
		</Card>
	)
}