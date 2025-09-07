import { ethers } from 'ethers';
import { SupportedChain } from '@/types/wallet';

/**
 * Gas optimization utilities for transaction management
 */

interface GasEstimate {
  gasLimit: string;
  gasPrice: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  estimatedCost: string;
  estimatedTime: number; // in seconds
}

interface GasOption {
  speed: 'slow' | 'standard' | 'fast';
  gasPrice: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  estimatedTime: number;
  cost: string;
}

/**
 * Get current gas prices from network
 */
export async function getCurrentGasPrices(
  provider: ethers.Provider,
  chainId: SupportedChain
): Promise<GasOption[]> {
  try {
    const feeData = await provider.getFeeData();
    const gasPrice = feeData.gasPrice || ethers.parseUnits('20', 'gwei');
    const maxFeePerGas = feeData.maxFeePerGas;
    const maxPriorityFeePerGas = feeData.maxPriorityFeePerGas;

    // Base gas options
    const baseGasPrice = Number(ethers.formatUnits(gasPrice, 'gwei'));
    
    const options: GasOption[] = [
      {
        speed: 'slow',
        gasPrice: ethers.formatUnits(gasPrice * BigInt(80) / BigInt(100), 'gwei'), // 80% of current
        maxFeePerGas: maxFeePerGas ? ethers.formatUnits(maxFeePerGas * BigInt(80) / BigInt(100), 'gwei') : undefined,
        maxPriorityFeePerGas: maxPriorityFeePerGas ? ethers.formatUnits(maxPriorityFeePerGas * BigInt(80) / BigInt(100), 'gwei') : undefined,
        estimatedTime: 300, // 5 minutes
        cost: '0.00', // Will be calculated based on gas limit
      },
      {
        speed: 'standard',
        gasPrice: ethers.formatUnits(gasPrice, 'gwei'),
        maxFeePerGas: maxFeePerGas ? ethers.formatUnits(maxFeePerGas, 'gwei') : undefined,
        maxPriorityFeePerGas: maxPriorityFeePerGas ? ethers.formatUnits(maxPriorityFeePerGas, 'gwei') : undefined,
        estimatedTime: 120, // 2 minutes
        cost: '0.00',
      },
      {
        speed: 'fast',
        gasPrice: ethers.formatUnits(gasPrice * BigInt(120) / BigInt(100), 'gwei'), // 120% of current
        maxFeePerGas: maxFeePerGas ? ethers.formatUnits(maxFeePerGas * BigInt(120) / BigInt(100), 'gwei') : undefined,
        maxPriorityFeePerGas: maxPriorityFeePerGas ? ethers.formatUnits(maxPriorityFeePerGas * BigInt(120) / BigInt(100), 'gwei') : undefined,
        estimatedTime: 30, // 30 seconds
        cost: '0.00',
      },
    ];

    return options;
  } catch (error) {
    console.error('Error fetching gas prices:', error);
    // Return fallback gas options
    return [
      {
        speed: 'slow',
        gasPrice: '10',
        estimatedTime: 300,
        cost: '0.00',
      },
      {
        speed: 'standard',
        gasPrice: '20',
        estimatedTime: 120,
        cost: '0.00',
      },
      {
        speed: 'fast',
        gasPrice: '30',
        estimatedTime: 30,
        cost: '0.00',
      },
    ];
  }
}

/**
 * Estimate gas for a transaction
 */
export async function estimateTransactionGas(
  provider: ethers.Provider,
  transaction: {
    to: string;
    value?: string;
    data?: string;
    from?: string;
  }
): Promise<GasEstimate> {
  try {
    const gasLimit = await provider.estimateGas({
      to: transaction.to,
      value: transaction.value ? ethers.parseEther(transaction.value) : undefined,
      data: transaction.data,
      from: transaction.from,
    });

    const feeData = await provider.getFeeData();
    const gasPrice = feeData.gasPrice || ethers.parseUnits('20', 'gwei');
    
    const estimatedCost = ethers.formatEther(gasLimit * gasPrice);
    
    return {
      gasLimit: gasLimit.toString(),
      gasPrice: ethers.formatUnits(gasPrice, 'gwei'),
      maxFeePerGas: feeData.maxFeePerGas ? ethers.formatUnits(feeData.maxFeePerGas, 'gwei') : undefined,
      maxPriorityFeePerGas: feeData.maxPriorityFeePerGas ? ethers.formatUnits(feeData.maxPriorityFeePerGas, 'gwei') : undefined,
      estimatedCost,
      estimatedTime: 120, // 2 minutes standard
    };
  } catch (error) {
    console.error('Error estimating gas:', error);
    // Return fallback estimate
    return {
      gasLimit: '21000',
      gasPrice: '20',
      estimatedCost: '0.00042',
      estimatedTime: 120,
    };
  }
}

/**
 * Calculate gas cost for different options
 */
export function calculateGasCost(
  gasLimit: string,
  gasOption: GasOption,
  nativeTokenPrice: number = 2000 // ETH price in USD
): GasOption {
  const gasPriceWei = ethers.parseUnits(gasOption.gasPrice, 'gwei');
  const totalCostWei = BigInt(gasLimit) * gasPriceWei;
  const totalCostEth = ethers.formatEther(totalCostWei);
  const totalCostUsd = (parseFloat(totalCostEth) * nativeTokenPrice).toFixed(2);
  
  return {
    ...gasOption,
    cost: totalCostUsd,
  };
}

/**
 * Optimize gas settings based on network conditions
 */
export async function optimizeGasSettings(
  provider: ethers.Provider,
  chainId: SupportedChain,
  transaction: {
    to: string;
    value?: string;
    data?: string;
    from?: string;
  },
  urgency: 'low' | 'medium' | 'high' = 'medium'
): Promise<{
  gasLimit: string;
  gasPrice: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  estimatedCost: string;
  estimatedTime: number;
}> {
  try {
    const [gasEstimate, gasOptions] = await Promise.all([
      estimateTransactionGas(provider, transaction),
      getCurrentGasPrices(provider, chainId),
    ]);

    // Select gas option based on urgency
    let selectedOption: GasOption;
    switch (urgency) {
      case 'low':
        selectedOption = gasOptions.find(opt => opt.speed === 'slow') || gasOptions[0];
        break;
      case 'high':
        selectedOption = gasOptions.find(opt => opt.speed === 'fast') || gasOptions[2];
        break;
      default:
        selectedOption = gasOptions.find(opt => opt.speed === 'standard') || gasOptions[1];
    }

    // Calculate final cost
    const optimizedOption = calculateGasCost(gasEstimate.gasLimit, selectedOption);

    return {
      gasLimit: gasEstimate.gasLimit,
      gasPrice: selectedOption.gasPrice,
      maxFeePerGas: selectedOption.maxFeePerGas,
      maxPriorityFeePerGas: selectedOption.maxPriorityFeePerGas,
      estimatedCost: optimizedOption.cost,
      estimatedTime: selectedOption.estimatedTime,
    };
  } catch (error) {
    console.error('Error optimizing gas settings:', error);
    // Return safe fallback
    return {
      gasLimit: '21000',
      gasPrice: '20',
      estimatedCost: '0.84',
      estimatedTime: 120,
    };
  }
}

/**
 * Monitor gas prices and suggest optimal timing
 */
export class GasTracker {
  private provider: ethers.Provider;
  private chainId: SupportedChain;
  private priceHistory: { timestamp: number; gasPrice: number }[] = [];
  private updateInterval: NodeJS.Timeout | null = null;

  constructor(provider: ethers.Provider, chainId: SupportedChain) {
    this.provider = provider;
    this.chainId = chainId;
  }

  /**
   * Start monitoring gas prices
   */
  startMonitoring(intervalMs: number = 30000) {
    this.updateInterval = setInterval(async () => {
      try {
        const feeData = await this.provider.getFeeData();
        const gasPrice = feeData.gasPrice ? Number(ethers.formatUnits(feeData.gasPrice, 'gwei')) : 20;
        
        this.priceHistory.push({
          timestamp: Date.now(),
          gasPrice,
        });

        // Keep only last 24 hours of data
        const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
        this.priceHistory = this.priceHistory.filter(entry => entry.timestamp > oneDayAgo);
      } catch (error) {
        console.error('Error monitoring gas prices:', error);
      }
    }, intervalMs);
  }

  /**
   * Stop monitoring gas prices
   */
  stopMonitoring() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  /**
   * Get gas price trend analysis
   */
  getTrend(): {
    current: number;
    average24h: number;
    trend: 'rising' | 'falling' | 'stable';
    recommendation: string;
  } {
    if (this.priceHistory.length === 0) {
      return {
        current: 20,
        average24h: 20,
        trend: 'stable',
        recommendation: 'No data available',
      };
    }

    const current = this.priceHistory[this.priceHistory.length - 1].gasPrice;
    const average24h = this.priceHistory.reduce((sum, entry) => sum + entry.gasPrice, 0) / this.priceHistory.length;
    
    let trend: 'rising' | 'falling' | 'stable';
    let recommendation: string;

    if (current > average24h * 1.1) {
      trend = 'rising';
      recommendation = 'Gas prices are high. Consider waiting for lower prices.';
    } else if (current < average24h * 0.9) {
      trend = 'falling';
      recommendation = 'Good time to transact. Gas prices are below average.';
    } else {
      trend = 'stable';
      recommendation = 'Gas prices are stable. Normal time to transact.';
    }

    return {
      current,
      average24h,
      trend,
      recommendation,
    };
  }
}