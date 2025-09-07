import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'
import { toast } from 'react-hot-toast'

// Types for lending/borrowing operations
export interface LendingPool {
  id: string
  name: string
  description: string
  assetType: string
  totalLiquidity: number
  availableLiquidity: number
  utilizationRate: number
  lendingRate: number
  borrowingRate: number
  minimumLend: number
  minimumBorrow: number
  maxLTV: number
  liquidationThreshold: number
  status: 'Active' | 'Paused' | 'Closed'
  createdAt: string
  totalLenders: number
  totalBorrowers: number
  riskLevel: 'Low' | 'Medium' | 'High'
  collateralTypes: string[]
}

export interface LendingPosition {
  id: string
  poolId: string
  pool: LendingPool
  type: 'lend' | 'borrow'
  amount: number
  interestRate: number
  startDate: string
  maturityDate?: string
  status: 'Active' | 'Repaid' | 'Liquidated' | 'Defaulted'
  collateralAmount?: number
  collateralAsset?: string
  currentValue: number
  accruedInterest: number
  healthFactor?: number
}

export interface CreateLendingData {
  poolId: string
  amount: number
  duration?: number
  collateralAsset?: string
  collateralAmount?: number
}

export interface LendingPoolsResponse {
  pools: LendingPool[]
  totalCount: number
}

export interface LendingPositionsResponse {
  positions: LendingPosition[]
  totalCount: number
}

// Query keys for React Query cache management
export const lendingKeys = {
  all: ['lending'] as const,
  pools: () => [...lendingKeys.all, 'pools'] as const,
  pool: (id: string) => [...lendingKeys.pools(), id] as const,
  positions: (userAddress?: string) => [...lendingKeys.all, 'positions', userAddress] as const,
  userPositions: (userAddress: string) => [...lendingKeys.positions(userAddress)] as const,
}

// Fetch lending pools
const fetchLendingPools = async (): Promise<LendingPoolsResponse> => {
  const response = await fetch('/api/lending')
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.message || `HTTP ${response.status}: Failed to fetch lending pools`)
  }
  return response.json()
}

// Fetch specific lending pool
const fetchLendingPool = async (poolId: string): Promise<LendingPool> => {
  const response = await fetch(`/api/lending/${poolId}`)
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.message || `HTTP ${response.status}: Failed to fetch lending pool`)
  }
  const data = await response.json()
  return data.pool
}

// Fetch user lending positions
const fetchLendingPositions = async (userAddress: string): Promise<LendingPositionsResponse> => {
  const response = await fetch(`/api/lending/positions/${userAddress}`)
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.message || `HTTP ${response.status}: Failed to fetch lending positions`)
  }
  return response.json()
}

// Create lending position
const createLendingPosition = async (data: CreateLendingData & { userAddress: string }): Promise<LendingPosition> => {
  const response = await fetch('/api/lending/lend', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.message || 'Failed to create lending position')
  }
  
  const result = await response.json()
  return result.position
}

// Create borrowing position
const createBorrowingPosition = async (data: CreateLendingData & { userAddress: string }): Promise<LendingPosition> => {
  const response = await fetch('/api/lending/borrow', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.message || 'Failed to create borrowing position')
  }
  
  const result = await response.json()
  return result.position
}

// Repay loan
const repayLoan = async (data: { positionId: string; amount: number; userAddress: string }): Promise<LendingPosition> => {
  const response = await fetch('/api/lending/repay', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.message || 'Failed to repay loan')
  }
  
  const result = await response.json()
  return result.position
}

// Withdraw lending position
const withdrawLending = async (data: { positionId: string; amount: number; userAddress: string }): Promise<LendingPosition> => {
  const response = await fetch('/api/lending/withdraw', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.message || 'Failed to withdraw lending position')
  }
  
  const result = await response.json()
  return result.position
}

// Hook to get all lending pools
export const useLendingPools = () => {
  const queryKey = useMemo(() => lendingKeys.pools(), []);
  
  return useQuery({
    queryKey,
    queryFn: fetchLendingPools,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Hook to get specific lending pool
export const useLendingPool = (poolId: string) => {
  const queryKey = useMemo(() => lendingKeys.pool(poolId), [poolId]);
  
  return useQuery({
    queryKey,
    queryFn: () => fetchLendingPool(poolId),
    enabled: !!poolId,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Hook to get user lending positions
export const useLendingPositions = (userAddress?: string, options?: { enabled?: boolean }) => {
  const queryKey = useMemo(() => lendingKeys.userPositions(userAddress || ''), [userAddress]);
  
  return useQuery({
    queryKey,
    queryFn: () => fetchLendingPositions(userAddress!),
    enabled: !!userAddress && (options?.enabled !== false),
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Hook to create lending position
export const useCreateLendingPosition = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: createLendingPosition,
    onSuccess: (data, variables) => {
      // Invalidate and refetch lending pools
      queryClient.invalidateQueries({ queryKey: lendingKeys.pools() })
      
      // Invalidate and refetch user positions
      queryClient.invalidateQueries({ 
        queryKey: lendingKeys.userPositions(variables.userAddress) 
      })
      
      // Update specific pool cache
      queryClient.invalidateQueries({ 
        queryKey: lendingKeys.pool(variables.poolId) 
      })
    },
    retry: 1,
    retryDelay: 1000,
  })
}

// Hook to create borrowing position
export const useCreateBorrowingPosition = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: createBorrowingPosition,
    onSuccess: (data, variables) => {
      // Invalidate and refetch lending pools
      queryClient.invalidateQueries({ queryKey: lendingKeys.pools() })
      
      // Invalidate and refetch user positions
      queryClient.invalidateQueries({ 
        queryKey: lendingKeys.userPositions(variables.userAddress) 
      })
      
      // Update specific pool cache
      queryClient.invalidateQueries({ 
        queryKey: lendingKeys.pool(variables.poolId) 
      })
    },
    retry: 1,
    retryDelay: 1000,
  })
}

// Hook to repay loan
export const useRepayLoan = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: repayLoan,
    onSuccess: (data, variables) => {
      // Invalidate and refetch lending pools
      queryClient.invalidateQueries({ queryKey: lendingKeys.pools() })
      
      // Invalidate and refetch user positions
      queryClient.invalidateQueries({ 
        queryKey: lendingKeys.userPositions(variables.userAddress) 
      })
      
      // Update specific pool cache if available
      if (data.pool) {
        queryClient.invalidateQueries({ 
          queryKey: lendingKeys.pool(data.poolId) 
        })
      }
    },
    retry: 1,
    retryDelay: 1000,
  })
}

// Hook to withdraw lending position
export const useWithdrawLending = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: withdrawLending,
    onSuccess: (data, variables) => {
      // Invalidate and refetch lending pools
      queryClient.invalidateQueries({ queryKey: lendingKeys.pools() })
      
      // Invalidate and refetch user positions
      queryClient.invalidateQueries({ 
        queryKey: lendingKeys.userPositions(variables.userAddress) 
      })
      
      // Update specific pool cache if available
      if (data.pool) {
        queryClient.invalidateQueries({ 
          queryKey: lendingKeys.pool(data.poolId) 
        })
      }
    },
    retry: 1,
    retryDelay: 1000,
  })
}

// Hook to refresh lending data
export const useRefreshLendingData = () => {
  const queryClient = useQueryClient()
  
  return {
    refreshPools: () => queryClient.invalidateQueries({ queryKey: lendingKeys.pools() }),
    refreshPositions: (userAddress: string) => 
      queryClient.invalidateQueries({ queryKey: lendingKeys.userPositions(userAddress) }),
    refreshAll: () => queryClient.invalidateQueries({ queryKey: lendingKeys.all }),
  }
}