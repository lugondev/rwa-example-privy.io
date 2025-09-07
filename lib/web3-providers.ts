'use client';

import { SupportedChain } from '@/types/wallet';
import { ethers } from 'ethers';
import { createConfig, http } from 'wagmi';
import { arbitrum, base, mainnet, optimism, polygon } from 'wagmi/chains';
import { injected, walletConnect } from 'wagmi/connectors';

// WalletConnect project ID - should be set in environment variables
const WALLETCONNECT_PROJECT_ID = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '2f05a7cde2bb14f63c3bd2b27426e5a6';

// Singleton WalletConnect connector with proper cleanup
let walletConnectConnector: any = null;
let isInitializing = false;

function getWalletConnectConnector() {
  if (walletConnectConnector) {
    return walletConnectConnector;
  }

  if (isInitializing) {
    return null; // Prevent multiple initializations
  }

  isInitializing = true;

  try {
    walletConnectConnector = walletConnect({
      projectId: WALLETCONNECT_PROJECT_ID,
      metadata: {
        name: 'RWA Portfolio',
        description: 'Real World Asset Portfolio Management',
        url: 'https://rwa-portfolio.com',
        icons: ['https://rwa-portfolio.com/icon.png'],
      },
      showQrModal: true,
    });
  } catch (error) {
    console.error('Failed to initialize WalletConnect:', error);
    walletConnectConnector = null;
  } finally {
    isInitializing = false;
  }

  return walletConnectConnector;
}

/**
 * Wagmi configuration for multi-chain wallet connections
 */
export const config = createConfig({
  chains: [mainnet, polygon, arbitrum, optimism, base],
  connectors: [
    injected(),
    // WalletConnect temporarily disabled to fix initialization issues
    // getWalletConnectConnector(),
  ],
  transports: {
    [mainnet.id]: http(),
    [polygon.id]: http(),
    [arbitrum.id]: http(),
    [optimism.id]: http(),
    [base.id]: http(),
  },
});

// Export as wagmiConfig for backward compatibility
export const wagmiConfig = config;

/**
 * Chain ID mapping between our internal chain IDs and wagmi chain IDs
 */
export const CHAIN_ID_MAPPING: Record<SupportedChain, number> = {
  ethereum: mainnet.id,
  polygon: polygon.id,
  arbitrum: arbitrum.id,
  optimism: optimism.id,
  xdc: 50, // XDC Network
  algorand: 4160, // Algorand (not supported by wagmi, will use custom provider)
};

/**
 * Get ethers provider for a specific chain
 */
export function getEthersProvider(chainId: SupportedChain): ethers.JsonRpcProvider | null {
  const rpcUrls: Record<SupportedChain, string> = {
    ethereum: process.env.NEXT_PUBLIC_ETHEREUM_RPC || 'https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
    polygon: process.env.NEXT_PUBLIC_POLYGON_RPC || 'https://polygon-rpc.com',
    arbitrum: process.env.NEXT_PUBLIC_ARBITRUM_RPC || 'https://arb1.arbitrum.io/rpc',
    optimism: process.env.NEXT_PUBLIC_OPTIMISM_RPC || 'https://mainnet.optimism.io',
    xdc: process.env.NEXT_PUBLIC_XDC_RPC || 'https://rpc.xinfin.network',
    algorand: process.env.NEXT_PUBLIC_ALGORAND_RPC || 'https://mainnet-api.algonode.cloud',
  };

  const rpcUrl = rpcUrls[chainId];
  if (!rpcUrl) return null;

  try {
    return new ethers.JsonRpcProvider(rpcUrl);
  } catch (error) {
    console.error(`Failed to create provider for ${chainId}:`, error);
    return null;
  }
}

/**
 * Get signer for a specific chain (requires wallet connection)
 */
export async function getEthersSigner(chainId: SupportedChain, address: string): Promise<ethers.Signer | null> {
  try {
    if (typeof window === 'undefined' || !window.ethereum) {
      return null;
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner(address);

    // Switch to the correct network if needed
    const targetChainId = CHAIN_ID_MAPPING[chainId];
    const currentChainId = await provider.getNetwork().then(n => Number(n.chainId));

    if (currentChainId !== targetChainId) {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${targetChainId.toString(16)}` }],
      });
    }

    return signer;
  } catch (error) {
    console.error(`Failed to get signer for ${chainId}:`, error);
    return null;
  }
}

/**
 * Fetch real balance for an address on a specific chain
 */
export async function fetchRealBalance(chainId: SupportedChain, address: string): Promise<string> {
  try {
    const provider = getEthersProvider(chainId);
    if (!provider) throw new Error(`No provider for chain ${chainId}`);

    const balance = await provider.getBalance(address);
    return ethers.formatEther(balance);
  } catch (error) {
    console.error(`Failed to fetch balance for ${address} on ${chainId}:`, error);
    return '0';
  }
}

/**
 * Fetch ERC-20 token balance
 */
export async function fetchTokenBalance(
  chainId: SupportedChain,
  tokenAddress: string,
  walletAddress: string,
  decimals: number = 18
): Promise<string> {
  try {
    const provider = getEthersProvider(chainId);
    if (!provider) throw new Error(`No provider for chain ${chainId}`);

    // ERC-20 balanceOf ABI
    const abi = ['function balanceOf(address owner) view returns (uint256)'];
    const contract = new ethers.Contract(tokenAddress, abi, provider);

    const balance = await contract.balanceOf(walletAddress);
    return ethers.formatUnits(balance, decimals);
  } catch (error) {
    console.error(`Failed to fetch token balance for ${tokenAddress}:`, error);
    return '0';
  }
}

/**
 * Get current gas price for a chain
 */
export async function getCurrentGasPrice(chainId: SupportedChain): Promise<string> {
  try {
    const provider = getEthersProvider(chainId);
    if (!provider) throw new Error(`No provider for chain ${chainId}`);

    const feeData = await provider.getFeeData();
    return feeData.gasPrice?.toString() || '0';
  } catch (error) {
    console.error(`Failed to get gas price for ${chainId}:`, error);
    return '0';
  }
}

/**
 * Estimate gas for a transaction
 */
export async function estimateGas(
  chainId: SupportedChain,
  from: string,
  to: string,
  value?: string,
  data?: string
): Promise<string> {
  try {
    const provider = getEthersProvider(chainId);
    if (!provider) throw new Error(`No provider for chain ${chainId}`);

    const gasEstimate = await provider.estimateGas({
      from,
      to,
      value: value ? ethers.parseEther(value) : undefined,
      data,
    });

    return gasEstimate.toString();
  } catch (error) {
    console.error(`Failed to estimate gas:`, error);
    return '21000'; // Default gas limit for simple transfers
  }
}

/**
 * Send a transaction
 */
export async function sendTransaction(
  chainId: SupportedChain,
  signer: ethers.Signer,
  to: string,
  value: string,
  gasLimit?: string,
  gasPrice?: string
): Promise<ethers.TransactionResponse> {
  try {
    const tx = {
      to,
      value: ethers.parseEther(value),
      gasLimit: gasLimit ? BigInt(gasLimit) : undefined,
      gasPrice: gasPrice ? BigInt(gasPrice) : undefined,
    };

    return await signer.sendTransaction(tx);
  } catch (error) {
    console.error('Failed to send transaction:', error);
    throw error;
  }
}