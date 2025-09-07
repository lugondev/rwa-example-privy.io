import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Types for API responses
export interface Asset {
  id: string;
  name: string;
  description: string;
  type: string;
  currentPrice: number;
  priceChange24h: number;
  totalSupply: number;
  availableShares: number;
  marketCap: number;
  image?: string;
  location?: string;
  yield?: number;
  riskLevel: 'Low' | 'Medium' | 'High';
  verified: boolean;
  createdAt: string;
}

export interface AssetsResponse {
  assets: Asset[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface FilterOptions {
  type: string;
  category: string;
  minPrice: string;
  maxPrice: string;
  riskLevel: string;
  minYield: string;
  maxYield: string;
  location: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export interface AssetsQueryParams {
  page: number;
  limit: number;
  search: string;
  filters: FilterOptions;
}

/**
 * Fetch assets from API with filters and pagination
 * @param params - Query parameters for fetching assets
 * @returns Promise with assets response
 */
const fetchAssets = async (params: AssetsQueryParams): Promise<AssetsResponse> => {
  const urlParams = new URLSearchParams({
    page: params.page.toString(),
    limit: params.limit.toString(),
    search: params.search,
    sortBy: params.filters.sortBy,
    sortOrder: params.filters.sortOrder
  });

  // Add filter parameters if they are not default values
  if (params.filters.type !== 'all') {
    urlParams.append('type', params.filters.type);
  }
  if (params.filters.minPrice) {
    urlParams.append('minPrice', params.filters.minPrice);
  }
  if (params.filters.maxPrice) {
    urlParams.append('maxPrice', params.filters.maxPrice);
  }
  if (params.filters.riskLevel !== 'all') {
    urlParams.append('riskLevel', params.filters.riskLevel);
  }
  if (params.filters.category !== 'all') {
    urlParams.append('category', params.filters.category);
  }
  if (params.filters.minYield) {
    urlParams.append('minYield', params.filters.minYield);
  }
  if (params.filters.maxYield) {
    urlParams.append('maxYield', params.filters.maxYield);
  }
  if (params.filters.location) {
    urlParams.append('location', params.filters.location);
  }

  const response = await fetch(`/api/assets?${urlParams.toString()}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch assets: ${response.status} ${response.statusText}`);
  }

  return response.json();
};

/**
 * React Query hook for fetching assets with caching and automatic refetching
 * @param params - Query parameters
 * @returns Query result with assets data, loading state, and error handling
 */
export const useAssets = (params: AssetsQueryParams) => {
  return useQuery({
    queryKey: ['assets', params],
    queryFn: () => fetchAssets(params),
    staleTime: 30 * 1000, // Data is fresh for 30 seconds
    gcTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: 2,
    refetchOnWindowFocus: false,
    // Only fetch if search query is not empty or we have valid filters
    enabled: params.search.length > 0 || 
             params.filters.type !== 'all' || 
             params.filters.category !== 'all' ||
             params.filters.riskLevel !== 'all' ||
             params.filters.minPrice !== '' ||
             params.filters.maxPrice !== '' ||
             params.filters.minYield !== '' ||
             params.filters.maxYield !== '' ||
             params.filters.location !== '' ||
             params.page > 1
  });
};

/**
 * Fetch single asset by ID
 * @param id - Asset ID
 * @returns Promise with asset data
 */
const fetchAsset = async (id: string): Promise<Asset> => {
  const response = await fetch(`/api/assets/${id}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch asset: ${response.status} ${response.statusText}`);
  }

  return response.json();
};

/**
 * React Query hook for fetching single asset
 * @param id - Asset ID
 * @returns Query result with asset data
 */
export const useAsset = (id: string) => {
  return useQuery({
    queryKey: ['asset', id],
    queryFn: () => fetchAsset(id),
    staleTime: 60 * 1000, // Data is fresh for 1 minute
    gcTime: 10 * 60 * 1000, // Cache for 10 minutes
    enabled: !!id
  });
};