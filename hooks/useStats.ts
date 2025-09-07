import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { toast } from 'react-hot-toast';

// Types
interface MarketStats {
  totalMarketCap: number;
  totalVolume24h: number;
  totalAssets: number;
  totalUsers: number;
  averageReturn: number;
  // Additional properties for StatsSection compatibility
  totalValue: number;
  activeUsers: number;
  vaults: number;
  fractionalShares: number;
  volume24h: number;
  topPerformingAssets: {
    id: string;
    name: string;
    return: number;
    image: string;
  }[];
  marketTrends: {
    period: string;
    value: number;
    change: number;
  }[];
  categoryBreakdown: {
    category: string;
    value: number;
    percentage: number;
    change24h: number;
  }[];
}

interface PriceData {
  assetId: string;
  price: number;
  change24h: number;
  change7d: number;
  volume24h: number;
  marketCap: number;
  lastUpdated: string;
}

interface PerformanceMetrics {
  totalReturn: number;
  annualizedReturn: number;
  volatility: number;
  sharpeRatio: number;
  maxDrawdown: number;
  winRate: number;
  averageHoldingPeriod: number;
  diversificationRatio: number;
}

interface TrendingAsset {
  id: string;
  name: string;
  price: number;
  change24h: number;
  volume24h: number;
  image: string;
  category: string;
  trending_score: number;
}

// Query keys
export const statsKeys = {
  all: ['stats'] as const,
  market: () => [...statsKeys.all, 'market'] as const,
  prices: () => [...statsKeys.all, 'prices'] as const,
  price: (assetId: string) => [...statsKeys.prices(), assetId] as const,
  performance: () => [...statsKeys.all, 'performance'] as const,
  userPerformance: (address: string) => [...statsKeys.performance(), address] as const,
  trending: () => [...statsKeys.all, 'trending'] as const,
};

/**
 * Hook to fetch market statistics
 */
export function useMarketStats() {
  const queryKey = useMemo(() => statsKeys.market(), []);
  
  return useQuery({
    queryKey,
    queryFn: async (): Promise<MarketStats> => {
      const response = await fetch('/api/stats');
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to fetch market stats: ${response.status}`);
      }

      return response.json();
    },
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 2 * 60 * 1000, // Refetch every 2 minutes
  });
}

/**
 * Hook to fetch price data for a specific asset
 */
export function useAssetPrice(assetId: string) {
  const queryKey = useMemo(() => statsKeys.price(assetId), [assetId]);
  
  return useQuery({
    queryKey,
    queryFn: async (): Promise<PriceData> => {
      const response = await fetch(`/api/stats/prices/${assetId}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to fetch price data: ${response.status}`);
      }

      return response.json();
    },
    enabled: !!assetId,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 60 * 1000, // Refetch every minute
  });
}

/**
 * Hook to fetch price data for multiple assets
 */
export function useAssetPrices(assetIds: string[]) {
  const queryKey = useMemo(() => [...statsKeys.prices(), { assetIds }], [assetIds]);
  
  return useQuery({
    queryKey,
    queryFn: async (): Promise<Record<string, PriceData>> => {
      const params = new URLSearchParams();
      assetIds.forEach(id => params.append('ids', id));
      
      const response = await fetch(`/api/stats/prices?${params.toString()}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to fetch prices: ${response.status}`);
      }

      return response.json();
    },
    enabled: assetIds.length > 0,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 60 * 1000, // Refetch every minute
  });
}

/**
 * Hook to fetch user performance metrics
 */
export function useUserPerformance(address: string) {
  const queryKey = useMemo(() => statsKeys.userPerformance(address), [address]);
  
  return useQuery({
    queryKey,
    queryFn: async (): Promise<PerformanceMetrics> => {
      const response = await fetch(`/api/stats/performance/${address}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to fetch performance metrics: ${response.status}`);
      }

      return response.json();
    },
    enabled: !!address,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook to fetch trending assets
 */
export function useTrendingAssets(limit: number = 10) {
  const queryKey = useMemo(() => [...statsKeys.trending(), { limit }], [limit]);
  
  return useQuery({
    queryKey,
    queryFn: async (): Promise<TrendingAsset[]> => {
      const response = await fetch(`/api/stats/trending?limit=${limit}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to fetch trending assets: ${response.status}`);
      }

      return response.json();
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 3 * 60 * 1000, // Refetch every 3 minutes
  });
}

/**
 * Hook to refresh all stats data
 */
export function useRefreshStats() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<void> => {
      // Force refresh by invalidating all stats queries
      await queryClient.invalidateQueries({ queryKey: statsKeys.all });
    },
    onSuccess: () => {
      toast.success('Market data refreshed!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to refresh market data');
    },
  });
}

/**
 * Hook to subscribe to real-time price updates
 * This would typically use WebSocket or Server-Sent Events
 */
export function usePriceUpdates(assetIds: string[]) {
  return useQuery({
    queryKey: ['price-updates', assetIds],
    queryFn: async () => {
      // This is a placeholder for real-time price updates
      // In a real implementation, you would establish a WebSocket connection
      // or use Server-Sent Events to receive real-time updates
      return null;
    },
    enabled: false, // Disable automatic fetching
    staleTime: Infinity, // Never consider stale
    gcTime: Infinity, // Never garbage collect
  });
}

/**
 * Utility function to update price data in cache
 * This would be called when receiving real-time price updates
 */
export function updatePriceInCache(
  queryClient: ReturnType<typeof useQueryClient>,
  assetId: string,
  priceData: PriceData
) {
  // Update individual asset price
  queryClient.setQueryData(statsKeys.price(assetId), priceData);
  
  // Update in bulk prices cache if it exists
  queryClient.setQueryData(
    [...statsKeys.prices(), { assetIds: [assetId] }],
    (oldData: Record<string, PriceData> | undefined) => {
      if (!oldData) return { [assetId]: priceData };
      return { ...oldData, [assetId]: priceData };
    }
  );
}

/**
 * Hook to get cached price data without triggering a fetch
 */
export function useCachedPrice(assetId: string) {
  const queryClient = useQueryClient();
  
  return queryClient.getQueryData<PriceData>(statsKeys.price(assetId));
}

/**
 * Hook to prefetch price data for assets
 */
export function usePrefetchPrices() {
  const queryClient = useQueryClient();

  const prefetchPrice = async (assetId: string) => {
    await queryClient.prefetchQuery({
      queryKey: statsKeys.price(assetId),
      queryFn: async (): Promise<PriceData> => {
        const response = await fetch(`/api/stats/prices/${assetId}`);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `Failed to fetch price data: ${response.status}`);
        }

        return response.json();
      },
      staleTime: 30 * 1000,
    });
  };

  const prefetchPrices = async (assetIds: string[]) => {
    await Promise.all(assetIds.map(prefetchPrice));
  };

  return { prefetchPrice, prefetchPrices };
}