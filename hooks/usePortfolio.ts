import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { toast } from 'react-hot-toast';

// Types
export interface PortfolioAsset {
  id: string;
  assetId: string;
  name: string;
  shares: number;
  totalShares: number;
  currentPrice: number;
  purchasePrice: number;
  value: number;
  gainLoss: number;
  gainLossPercentage: number;
  image: string;
  category: string;
  riskLevel: 'low' | 'medium' | 'high';
}

interface Transaction {
  id: string;
  type: 'buy' | 'sell' | 'transfer';
  assetId: string;
  assetName: string;
  shares: number;
  price: number;
  total: number;
  timestamp: string;
  status: 'pending' | 'completed' | 'failed';
  txHash?: string;
}

interface PortfolioSummary {
  totalValue: number;
  totalGainLoss: number;
  totalGainLossPercentage: number;
  totalAssets: number;
  diversificationScore: number;
}

interface PortfolioData {
  summary: PortfolioSummary;
  assets: PortfolioAsset[];
  transactions: Transaction[];
}

interface TradeData {
  assetId: string;
  shares: number;
  type: 'buy' | 'sell';
}

// Query keys
export const portfolioKeys = {
  all: ['portfolio'] as const,
  user: (address: string) => [...portfolioKeys.all, address] as const,
  data: (address: string) => [...portfolioKeys.user(address), 'data'] as const,
  transactions: (address: string) => [...portfolioKeys.user(address), 'transactions'] as const,
  summary: (address: string) => [...portfolioKeys.user(address), 'summary'] as const,
};

/**
 * Hook to fetch complete portfolio data for a user
 */
export function usePortfolio(address: string) {
  const queryKey = useMemo(() => portfolioKeys.data(address), [address]);
  
  return useQuery({
    queryKey,
    queryFn: async (): Promise<PortfolioData> => {
      const response = await fetch(`/api/users/${address}/portfolio`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to fetch portfolio: ${response.status}`);
      }

      return response.json();
    },
    enabled: !!address,
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch portfolio summary only
 */
export function usePortfolioSummary(address: string) {
  const queryKey = useMemo(() => portfolioKeys.summary(address), [address]);
  
  return useQuery({
    queryKey,
    queryFn: async (): Promise<PortfolioSummary> => {
      const response = await fetch(`/api/users/${address}/portfolio/summary`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to fetch portfolio summary: ${response.status}`);
      }

      return response.json();
    },
    enabled: !!address,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook to fetch user transactions
 */
export function useTransactions(address: string, limit?: number) {
  const queryKey = useMemo(() => [...portfolioKeys.transactions(address), { limit }], [address, limit]);
  
  return useQuery({
    queryKey,
    queryFn: async (): Promise<Transaction[]> => {
      const params = new URLSearchParams();
      if (limit) {
        params.append('limit', limit.toString());
      }

      const response = await fetch(`/api/users/${address}/transactions?${params.toString()}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to fetch transactions: ${response.status}`);
      }

      return response.json();
    },
    enabled: !!address,
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to execute a trade (buy/sell shares)
 */
export function useTrade() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ address, data }: { address: string; data: TradeData }): Promise<Transaction> => {
      const response = await fetch(`/api/users/${address}/trade`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to execute trade: ${response.status}`);
      }

      return response.json();
    },
    onSuccess: (transaction, { address }) => {
      // Invalidate portfolio data to reflect the trade
      queryClient.invalidateQueries({ queryKey: portfolioKeys.user(address) });
      
      // Show success message
      const action = transaction.type === 'buy' ? 'purchased' : 'sold';
      toast.success(`Successfully ${action} ${transaction.shares} shares!`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to execute trade');
    },
  });
}

/**
 * Hook to transfer shares to another user
 */
export function useTransferShares() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      fromAddress,
      toAddress,
      assetId,
      shares,
    }: {
      fromAddress: string;
      toAddress: string;
      assetId: string;
      shares: number;
    }): Promise<Transaction> => {
      const response = await fetch(`/api/users/${fromAddress}/transfer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          toAddress,
          assetId,
          shares,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to transfer shares: ${response.status}`);
      }

      return response.json();
    },
    onSuccess: (transaction, { fromAddress, toAddress }) => {
      // Invalidate portfolio data for both users
      queryClient.invalidateQueries({ queryKey: portfolioKeys.user(fromAddress) });
      queryClient.invalidateQueries({ queryKey: portfolioKeys.user(toAddress) });
      
      toast.success(`Successfully transferred ${transaction.shares} shares!`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to transfer shares');
    },
  });
}

/**
 * Hook to refresh portfolio data manually
 */
export function useRefreshPortfolio() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (address: string): Promise<void> => {
      // Force refresh by invalidating all portfolio queries for the user
      await queryClient.invalidateQueries({ queryKey: portfolioKeys.user(address) });
    },
    onSuccess: () => {
      toast.success('Portfolio data refreshed!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to refresh portfolio');
    },
  });
}