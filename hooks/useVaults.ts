import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { toast } from 'react-hot-toast';

// Types - Updated to match Prisma schema
interface Vault {
  id: string;
  name: string;
  description: string | null;
  location: string;
  securityLevel: string; // basic, enhanced, premium
  capacity: number; // maximum number of assets
  currentAssets: number;
  managerId: string;
  createdAt: string;
  updatedAt: string;
  manager?: {
    id: string;
    walletAddress: string;
    email?: string;
  };
  assets?: {
    id: string;
    name: string;
    assetType: string;
    totalValue: number;
    currentPrice: number;
  }[];
  // Computed fields for compatibility
  totalValue?: number;
  apy?: number;
  riskLevel?: 'Low' | 'Medium' | 'High';
  strategy?: string;
  status?: 'Active' | 'Paused' | 'Closed';
}

interface VaultInvestment {
  id: string;
  vaultId: string;
  vault: Vault;
  amount: number;
  shares: number;
  investmentDate: string;
  currentValue: number;
  profitLoss: number;
  profitLossPercentage: number;
}

interface CreateVaultData {
  name: string;
  description?: string;
  location: string;
  securityLevel: string; // basic, enhanced, premium
  capacity: number; // maximum number of assets
  managerId: string;
}

interface InvestmentData {
  vaultId: string;
  amount: number;
}

interface WithdrawalData {
  investmentId: string;
  amount?: number; // If not provided, withdraw all
}

interface VaultsFilters {
  securityLevel?: string;
  location?: string;
  managerId?: string;
  search?: string;
  page?: number;
  limit?: number;
  // Legacy filters for compatibility
  riskLevel?: string;
  minApy?: number;
  maxApy?: number;
  minInvestment?: number;
  maxInvestment?: number;
  strategy?: string;
  status?: string;
}

interface VaultsResponse {
  vaults: Vault[];
  total: number;
  page: number;
  limit: number;
}

// Query keys
export const vaultKeys = {
  all: ['vaults'] as const,
  lists: () => [...vaultKeys.all, 'list'] as const,
  list: (filters: VaultsFilters) => [...vaultKeys.lists(), filters] as const,
  details: () => [...vaultKeys.all, 'detail'] as const,
  detail: (id: string) => [...vaultKeys.details(), id] as const,
  investments: () => [...vaultKeys.all, 'investments'] as const,
  userInvestments: (address: string) => [...vaultKeys.investments(), address] as const,
};

/**
 * Hook to fetch vaults with filtering and pagination
 */
export function useVaults(filters: VaultsFilters = {}) {
  // Create stable query key by normalizing filters
  const normalizedFilters = useMemo(() => {
    // Ensure filters is always an object
    const safeFilters = filters || {};
    const normalized: Record<string, string> = {};
    Object.entries(safeFilters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        normalized[key] = value.toString();
      }
    });
    return normalized;
  }, [filters]);
  
  const queryKey = useMemo(() => vaultKeys.list(normalizedFilters), [normalizedFilters]);
  
  return useQuery({
    queryKey,
    queryFn: async (): Promise<VaultsResponse> => {
      const params = new URLSearchParams();
      
      Object.entries(normalizedFilters).forEach(([key, value]) => {
        params.append(key, value);
      });

      const response = await fetch(`/api/vaults?${params.toString()}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to fetch vaults: ${response.status}`);
      }

      return response.json();
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook to fetch a single vault by ID
 */
export function useVault(id: string) {
  const queryKey = useMemo(() => vaultKeys.detail(id), [id]);
  
  return useQuery({
    queryKey,
    queryFn: async (): Promise<Vault> => {
      const response = await fetch(`/api/vaults/${id}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to fetch vault: ${response.status}`);
      }

      return response.json();
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook to fetch user's vault investments
 */
export function useVaultInvestments(address: string) {
  const queryKey = useMemo(() => vaultKeys.userInvestments(address), [address]);
  
  return useQuery({
    queryKey,
    queryFn: async (): Promise<VaultInvestment[]> => {
      if (!address) {
        return [];
      }
      
      const response = await fetch(`/api/investments/user/${address}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to fetch investments: ${response.status}`);
      }

      return response.json();
    },
    enabled: !!address,
    staleTime: 30000, // 30 seconds
    gcTime: 300000, // 5 minutes
  });
}

/**
 * Hook to create a new vault
 */
export function useCreateVault() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateVaultData): Promise<Vault> => {
      const response = await fetch('/api/vaults', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to create vault: ${response.status}`);
      }

      return response.json();
    },
    onSuccess: (newVault) => {
      // Invalidate and refetch vaults list
      queryClient.invalidateQueries({ queryKey: vaultKeys.lists() });
      
      // Add the new vault to the cache
      queryClient.setQueryData(vaultKeys.detail(newVault.id), newVault);
      
      toast.success('Vault created successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create vault');
    },
  });
}

/**
 * Hook to invest in a vault
 */
export function useInvestInVault() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ address, data }: { address: string; data: InvestmentData }): Promise<VaultInvestment> => {
      const response = await fetch(`/api/vaults/${data.vaultId}/invest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ address, amount: data.amount }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to invest in vault: ${response.status}`);
      }

      return response.json();
    },
    onSuccess: (investment, { address }) => {
      // Invalidate user's investments
      queryClient.invalidateQueries({ queryKey: vaultKeys.userInvestments(address) });
      
      // Invalidate vault details to update total value
      queryClient.invalidateQueries({ queryKey: vaultKeys.detail(investment.vaultId) });
      
      toast.success(`Successfully invested $${investment.amount.toLocaleString()} in ${investment.vault.name}!`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to invest in vault');
    },
  });
}

/**
 * Hook to withdraw from a vault
 */
export function useWithdrawFromVault() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ address, data }: { address: string; data: WithdrawalData }): Promise<{ amount: number; vaultId: string }> => {
      const response = await fetch(`/api/investments/withdraw/${data.investmentId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ address, amount: data.amount }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to withdraw from vault: ${response.status}`);
      }

      return response.json();
    },
    onSuccess: (result, { address }) => {
      // Invalidate user's investments
      queryClient.invalidateQueries({ queryKey: vaultKeys.userInvestments(address) });
      
      // Invalidate vault details to update total value
      queryClient.invalidateQueries({ queryKey: vaultKeys.detail(result.vaultId) });
      
      toast.success(`Successfully withdrew $${result.amount.toLocaleString()} from vault!`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to withdraw from vault');
    },
  });
}

/**
 * Hook to update a vault
 */
export function useUpdateVault() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateVaultData> }): Promise<Vault> => {
      const response = await fetch(`/api/vaults/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to update vault: ${response.status}`);
      }

      return response.json();
    },
    onSuccess: (updatedVault) => {
      // Update the vault in the cache
      queryClient.setQueryData(vaultKeys.detail(updatedVault.id), updatedVault);
      
      // Invalidate vaults list to reflect changes
      queryClient.invalidateQueries({ queryKey: vaultKeys.lists() });
      
      toast.success('Vault updated successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update vault');
    },
  });
}

/**
 * Hook to delete a vault
 */
export function useDeleteVault() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const response = await fetch(`/api/vaults/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to delete vault: ${response.status}`);
      }
    },
    onSuccess: (_, deletedId) => {
      // Remove the vault from the cache
      queryClient.removeQueries({ queryKey: vaultKeys.detail(deletedId) });
      
      // Invalidate vaults list to reflect changes
      queryClient.invalidateQueries({ queryKey: vaultKeys.lists() });
      
      toast.success('Vault deleted successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete vault');
    },
  });
}