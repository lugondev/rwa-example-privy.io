import { ethers } from 'ethers'
import { ChainConfig } from '@/types'

// Supported blockchain networks
export const SUPPORTED_CHAINS: Record<number, ChainConfig> = {
  1: {
    chainId: 1,
    name: 'Ethereum Mainnet',
    symbol: 'ETH',
    rpcUrl: process.env.NEXT_PUBLIC_ETHEREUM_RPC_URL || 'https://mainnet.infura.io/v3/your_key',
    blockExplorer: 'https://etherscan.io',
    nativeCurrency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18
    }
  },
  137: {
    chainId: 137,
    name: 'Polygon Mainnet',
    symbol: 'MATIC',
    rpcUrl: process.env.NEXT_PUBLIC_POLYGON_RPC_URL || 'https://polygon-mainnet.infura.io/v3/your_key',
    blockExplorer: 'https://polygonscan.com',
    nativeCurrency: {
      name: 'Polygon',
      symbol: 'MATIC',
      decimals: 18
    }
  },
  50: {
    chainId: 50,
    name: 'XDC Network',
    symbol: 'XDC',
    rpcUrl: process.env.NEXT_PUBLIC_XDC_RPC_URL || 'https://rpc.xinfin.network',
    blockExplorer: 'https://explorer.xinfin.network',
    nativeCurrency: {
      name: 'XDC',
      symbol: 'XDC',
      decimals: 18
    }
  }
}

// Smart contract ABIs (simplified)
export const CONTRACT_ABIS = {
  ERC721: [
    'function ownerOf(uint256 tokenId) view returns (address)',
    'function balanceOf(address owner) view returns (uint256)',
    'function tokenURI(uint256 tokenId) view returns (string)',
    'function approve(address to, uint256 tokenId)',
    'function transferFrom(address from, address to, uint256 tokenId)',
    'function safeTransferFrom(address from, address to, uint256 tokenId)',
    'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)'
  ],
  ERC1155: [
    'function balanceOf(address account, uint256 id) view returns (uint256)',
    'function balanceOfBatch(address[] accounts, uint256[] ids) view returns (uint256[])',
    'function setApprovalForAll(address operator, bool approved)',
    'function safeTransferFrom(address from, address to, uint256 id, uint256 amount, bytes data)',
    'function safeBatchTransferFrom(address from, address to, uint256[] ids, uint256[] amounts, bytes data)',
    'event TransferSingle(address indexed operator, address indexed from, address indexed to, uint256 id, uint256 value)'
  ],
  RWAToken: [
    'function mint(address to, uint256 tokenId, string uri) returns (bool)',
    'function fractionalize(uint256 tokenId, uint256 shares) returns (address)',
    'function getAssetInfo(uint256 tokenId) view returns (tuple(string name, string description, uint256 totalShares, uint256 availableShares, uint256 basePrice))',
    'function updatePrice(uint256 tokenId, uint256 newPrice)',
    'function transferShares(uint256 tokenId, address to, uint256 shares)',
    'event AssetTokenized(uint256 indexed tokenId, address indexed owner, string uri)',
    'event AssetFractionalized(uint256 indexed tokenId, address indexed fractionalContract, uint256 shares)',
    'event PriceUpdated(uint256 indexed tokenId, uint256 oldPrice, uint256 newPrice)'
  ]
}

// Blockchain utility functions
export class BlockchainService {
  private providers: Map<number, ethers.JsonRpcProvider> = new Map()
  
  constructor() {
    // Initialize providers for supported chains
    Object.values(SUPPORTED_CHAINS).forEach(chain => {
      this.providers.set(chain.chainId, new ethers.JsonRpcProvider(chain.rpcUrl))
    })
  }

  // Get provider for specific chain
  getProvider(chainId: number): ethers.JsonRpcProvider | null {
    return this.providers.get(chainId) || null
  }

  // Get signer from provider (requires wallet connection)
  async getSigner(chainId: number, provider?: unknown): Promise<ethers.Signer | null> {
    try {
      if (provider) {
        const ethersProvider = new ethers.BrowserProvider(provider as any)
        return await ethersProvider.getSigner()
      }
      return null
    } catch (error) {
      console.error('Error getting signer:', error)
      return null
    }
  }

  // Get contract instance
  getContract(address: string, abi: string[], signerOrProvider: ethers.Signer | ethers.Provider): ethers.Contract {
    return new ethers.Contract(address, abi, signerOrProvider)
  }

  // Format address
  formatAddress(address: string): string {
    if (!address) return ''
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  // Validate address
  isValidAddress(address: string): boolean {
    try {
      return ethers.isAddress(address)
    } catch {
      return false
    }
  }

  // Format token amount
  formatTokenAmount(amount: string | number, decimals: number = 18): string {
    try {
      return ethers.formatUnits(amount.toString(), decimals)
    } catch {
      return '0'
    }
  }

  // Parse token amount
  parseTokenAmount(amount: string, decimals: number = 18): bigint {
    try {
      return ethers.parseUnits(amount, decimals)
    } catch {
      return BigInt(0)
    }
  }

  // Get transaction receipt
  async getTransactionReceipt(txHash: string, chainId: number): Promise<ethers.TransactionReceipt | null> {
    try {
      const provider = this.getProvider(chainId)
      if (!provider) return null
      
      return await provider.getTransactionReceipt(txHash)
    } catch (error) {
      console.error('Error getting transaction receipt:', error)
      return null
    }
  }

  // Get current gas price
  async getGasPrice(chainId: number): Promise<bigint | null> {
    try {
      const provider = this.getProvider(chainId)
      if (!provider) return null
      
      const feeData = await provider.getFeeData()
      return feeData.gasPrice
    } catch (error) {
      console.error('Error getting gas price:', error)
      return null
    }
  }

  // Estimate gas for transaction
  async estimateGas(
    contract: ethers.Contract,
    method: string,
    params: unknown[]
  ): Promise<bigint | null> {
    try {
      return await contract[method].estimateGas(...params)
    } catch (error) {
      console.error('Error estimating gas:', error)
      return null
    }
  }

  // Wait for transaction confirmation
  async waitForTransaction(
    txHash: string,
    chainId: number,
    confirmations: number = 1
  ): Promise<ethers.TransactionReceipt | null> {
    try {
      const provider = this.getProvider(chainId)
      if (!provider) return null
      
      return await provider.waitForTransaction(txHash, confirmations)
    } catch (error) {
      console.error('Error waiting for transaction:', error)
      return null
    }
  }

  // Get block number
  async getBlockNumber(chainId: number): Promise<number | null> {
    try {
      const provider = this.getProvider(chainId)
      if (!provider) return null
      
      return await provider.getBlockNumber()
    } catch (error) {
      console.error('Error getting block number:', error)
      return null
    }
  }

  // Get balance
  async getBalance(address: string, chainId: number): Promise<string | null> {
    try {
      const provider = this.getProvider(chainId)
      if (!provider) return null
      
      const balance = await provider.getBalance(address)
      return ethers.formatEther(balance)
    } catch (error) {
      console.error('Error getting balance:', error)
      return null
    }
  }

  // Get token balance
  async getTokenBalance(
    tokenAddress: string,
    userAddress: string,
    chainId: number,
    decimals: number = 18
  ): Promise<string | null> {
    try {
      const provider = this.getProvider(chainId)
      if (!provider) return null
      
      const contract = this.getContract(tokenAddress, [
        'function balanceOf(address owner) view returns (uint256)'
      ], provider)
      
      const balance = await contract.balanceOf(userAddress)
      return ethers.formatUnits(balance, decimals)
    } catch (error) {
      console.error('Error getting token balance:', error)
      return null
    }
  }

  // Get NFT metadata
  async getNFTMetadata(
    contractAddress: string,
    tokenId: string,
    chainId: number
  ): Promise<Record<string, unknown> | null> {
    try {
      const provider = this.getProvider(chainId)
      if (!provider) return null
      
      const contract = this.getContract(contractAddress, CONTRACT_ABIS.ERC721, provider)
      const tokenURI = await contract.tokenURI(tokenId)
      
      // Fetch metadata from URI
      if (tokenURI.startsWith('http')) {
        const response = await fetch(tokenURI)
        return await response.json()
      } else if (tokenURI.startsWith('ipfs://')) {
        const ipfsHash = tokenURI.replace('ipfs://', '')
        const response = await fetch(`${process.env.NEXT_PUBLIC_IPFS_GATEWAY}${ipfsHash}`)
        return await response.json()
      }
      
      return null
    } catch (error) {
      console.error('Error getting NFT metadata:', error)
      return null
    }
  }

  // Switch network (for wallet)
  async switchNetwork(chainId: number, provider: unknown): Promise<boolean> {
    try {
      const chain = SUPPORTED_CHAINS[chainId]
      if (!chain) return false
      
      await (provider as any).request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${chainId.toString(16)}` }]
      })
      
      return true
    } catch (error: unknown) {
      // If network doesn't exist, add it
      if ((error as { code?: number }).code === 4902) {
        return await this.addNetwork(chainId, provider)
      }
      console.error('Error switching network:', error)
      return false
    }
  }

  // Add network to wallet
  async addNetwork(chainId: number, provider: unknown): Promise<boolean> {
    try {
      const chain = SUPPORTED_CHAINS[chainId]
      if (!chain) return false
      
      await (provider as any).request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: `0x${chainId.toString(16)}`,
          chainName: chain.name,
          nativeCurrency: chain.nativeCurrency,
          rpcUrls: [chain.rpcUrl],
          blockExplorerUrls: [chain.blockExplorer]
        }]
      })
      
      return true
    } catch (error) {
      console.error('Error adding network:', error)
      return false
    }
  }
}

// Create singleton instance
export const blockchainService = new BlockchainService()

// Helper functions
export const formatCurrency = (amount: string | number, currency: string = 'ETH'): string => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M ${currency}`
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K ${currency}`
  } else if (num >= 1) {
    return `${num.toFixed(2)} ${currency}`
  } else {
    return `${num.toFixed(4)} ${currency}`
  }
}

export const formatUSD = (amount: string | number): string => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(num)
}

export const calculatePriceChange = (currentPrice: number, previousPrice: number): number => {
  if (previousPrice === 0) return 0
  return ((currentPrice - previousPrice) / previousPrice) * 100
}

export const getExplorerUrl = (chainId: number, txHash: string): string => {
  const chain = SUPPORTED_CHAINS[chainId]
  if (!chain) return ''
  return `${chain.blockExplorer}/tx/${txHash}`
}

export const getAddressUrl = (chainId: number, address: string): string => {
  const chain = SUPPORTED_CHAINS[chainId]
  if (!chain) return ''
  return `${chain.blockExplorer}/address/${address}`
}