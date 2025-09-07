import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { toast } from 'react-hot-toast';

// Types
interface Asset {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  location: string;
  totalShares: number;
  availableShares: number;
  riskLevel: 'low' | 'medium' | 'high';
  expectedReturn: number;
  verified: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CreateAssetData {
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  location: string;
  totalShares: number;
  riskLevel: 'low' | 'medium' | 'high';
  expectedReturn: number;
}

interface AssetsResponse {
  assets: Asset[];
  total: number;
  page: number;
  limit: number;
}

interface AssetsFilters {
  category?: string;
  location?: string;
  riskLevel?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
}

// Query keys
export const assetKeys = {
  all: ['assets'] as const,
  lists: () => [...assetKeys.all, 'list'] as const,
  list: (filters: AssetsFilters) => [...assetKeys.lists(), filters] as const,
  details: () => [...assetKeys.all, 'detail'] as const,
  detail: (id: string) => [...assetKeys.details(), id] as const,
};

/**
 * Hook to fetch assets with filtering and pagination
 */
export function useAssets(filters: AssetsFilters = {}) {
  const normalizedFilters = useMemo(() => {
    const safeFilters = filters || {};
    const normalized: Record<string, string> = {};
    Object.entries(safeFilters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        normalized[key] = value.toString();
      }
    });
    return normalized;
  }, [filters]);
  
  const queryKey = useMemo(() => assetKeys.list(normalizedFilters), [normalizedFilters]);
  
  return useQuery({
    queryKey,
    queryFn: async (): Promise<AssetsResponse> => {
      const params = new URLSearchParams();
      
      Object.entries(normalizedFilters).forEach(([key, value]) => {
        params.append(key, value);
      });

      const response = await fetch(`/api/assets?${params.toString()}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to fetch assets: ${response.status}`);
      }

      return response.json();
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch a single asset by ID
 */
export function useAsset(id: string) {
  const queryKey = useMemo(() => assetKeys.detail(id), [id]);
  
  return useQuery({
    queryKey,
    queryFn: async (): Promise<Asset> => {
      const response = await fetch(`/api/assets/${id}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to fetch asset: ${response.status}`);
      }

      return response.json();
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook to create a new asset
 */
export function useCreateAsset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateAssetData): Promise<Asset> => {
      const response = await fetch('/api/assets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to create asset: ${response.status}`);
      }

      return response.json();
    },
    onSuccess: (newAsset) => {
      // Invalidate and refetch assets list
      queryClient.invalidateQueries({ queryKey: assetKeys.lists() });
      
      // Add the new asset to the cache
      queryClient.setQueryData(assetKeys.detail(newAsset.id), newAsset);
      
      toast.success('Asset created successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create asset');
    },
  });
}

/**
 * Hook to update an asset
 */
export function useUpdateAsset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateAssetData> }): Promise<Asset> => {
      const response = await fetch(`/api/assets/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to update asset: ${response.status}`);
      }

      return response.json();
    },
    onSuccess: (updatedAsset) => {
      // Update the asset in the cache
      queryClient.setQueryData(assetKeys.detail(updatedAsset.id), updatedAsset);
      
      // Invalidate assets list to reflect changes
      queryClient.invalidateQueries({ queryKey: assetKeys.lists() });
      
      toast.success('Asset updated successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update asset');
    },
  });
}

/**
 * Hook to delete an asset
 */
export function useDeleteAsset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const response = await fetch(`/api/assets/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to delete asset: ${response.status}`);
      }
    },
    onSuccess: (_, deletedId) => {
      // Remove the asset from the cache
      queryClient.removeQueries({ queryKey: assetKeys.detail(deletedId) });
      
      // Invalidate assets list to reflect changes
      queryClient.invalidateQueries({ queryKey: assetKeys.lists() });
      
      toast.success('Asset deleted successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete asset');
    },
  });
}