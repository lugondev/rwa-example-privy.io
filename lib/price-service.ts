'use client';

import { priceStorage } from './storage';

/**
 * Price service for fetching real-time cryptocurrency prices
 */

export interface PriceData {
  symbol: string;
  price: number;
  change24h: number;
  marketCap?: number;
  volume24h?: number;
  lastUpdated: number;
}

export interface TokenPrice {
  usd: number;
  usd_24h_change: number;
  usd_market_cap?: number;
  usd_24h_vol?: number;
}

// CoinGecko API endpoints
const COINGECKO_API_BASE = 'https://api.coingecko.com/api/v3';
const PRICE_ENDPOINT = `${COINGECKO_API_BASE}/simple/price`;
const COINS_ENDPOINT = `${COINGECKO_API_BASE}/coins`;

// Token ID mapping for CoinGecko
const TOKEN_ID_MAP: Record<string, string> = {
  ETH: 'ethereum',
  BTC: 'bitcoin',
  MATIC: 'matic-network',
  USDC: 'usd-coin',
  USDT: 'tether',
  DAI: 'dai',
  WETH: 'weth',
  UNI: 'uniswap',
  LINK: 'chainlink',
  AAVE: 'aave',
  COMP: 'compound-governance-token',
  MKR: 'maker',
  SNX: 'havven',
  YFI: 'yearn-finance',
  SUSHI: 'sushi',
  CRV: 'curve-dao-token',
  BAL: 'balancer',
  ALGO: 'algorand',
  XDC: 'xdce-crowd-sale',
  // Add more tokens as needed
};

/**
 * Rate limiting for API calls
 */
class RateLimiter {
  private calls: number[] = [];
  private readonly maxCalls: number;
  private readonly timeWindow: number;

  constructor(maxCalls: number = 50, timeWindowMs: number = 60000) {
    this.maxCalls = maxCalls;
    this.timeWindow = timeWindowMs;
  }

  canMakeCall(): boolean {
    const now = Date.now();
    this.calls = this.calls.filter(time => now - time < this.timeWindow);
    return this.calls.length < this.maxCalls;
  }

  recordCall(): void {
    this.calls.push(Date.now());
  }
}

const rateLimiter = new RateLimiter();

/**
 * Fetch price data from CoinGecko API
 */
export async function fetchPriceData(symbols: string[]): Promise<Record<string, PriceData>> {
  if (!rateLimiter.canMakeCall()) {
    console.warn('Rate limit exceeded, using cached prices');
    return getCachedPrices(symbols);
  }

  try {
    // Convert symbols to CoinGecko IDs
    const coinIds = symbols
      .map(symbol => TOKEN_ID_MAP[symbol.toUpperCase()])
      .filter(Boolean)
      .join(',');

    if (!coinIds) {
      console.warn('No valid coin IDs found for symbols:', symbols);
      return {};
    }

    const params = new URLSearchParams({
      ids: coinIds,
      vs_currencies: 'usd',
      include_24hr_change: 'true',
      include_market_cap: 'true',
      include_24hr_vol: 'true',
    });

    const response = await fetch(`${PRICE_ENDPOINT}?${params}`, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    rateLimiter.recordCall();

    const result: Record<string, PriceData> = {};
    const now = Date.now();

    // Map response back to symbols
    Object.entries(data).forEach(([coinId, priceInfo]) => {
      const symbol = Object.entries(TOKEN_ID_MAP).find(
        ([, id]) => id === coinId
      )?.[0];

      if (symbol && priceInfo && typeof priceInfo === 'object') {
        const info = priceInfo as TokenPrice;
        const priceData: PriceData = {
          symbol,
          price: info.usd || 0,
          change24h: info.usd_24h_change || 0,
          marketCap: info.usd_market_cap,
          volume24h: info.usd_24h_vol,
          lastUpdated: now,
        };

        result[symbol] = priceData;
        
        // Cache the price
        priceStorage.updatePrice(symbol, priceData.price, priceData.change24h);
      }
    });

    return result;
  } catch (error) {
    console.error('Failed to fetch price data:', error);
    return getCachedPrices(symbols);
  }
}

/**
 * Get cached prices for symbols
 */
function getCachedPrices(symbols: string[]): Record<string, PriceData> {
  const result: Record<string, PriceData> = {};
  
  symbols.forEach(symbol => {
    const cached = priceStorage.getCachedPrice(symbol.toUpperCase(), 300000); // 5 minutes cache
    if (cached) {
      result[symbol] = {
        symbol,
        price: cached.price,
        change24h: cached.change24h,
        lastUpdated: Date.now(),
      };
    }
  });

  return result;
}

/**
 * Fetch single token price
 */
export async function fetchTokenPrice(symbol: string): Promise<PriceData | null> {
  const prices = await fetchPriceData([symbol]);
  return prices[symbol] || null;
}

/**
 * Fetch historical price data
 */
export async function fetchHistoricalPrices(
  symbol: string,
  days: number = 7
): Promise<Array<{ timestamp: number; price: number }>> {
  if (!rateLimiter.canMakeCall()) {
    console.warn('Rate limit exceeded for historical data');
    return [];
  }

  try {
    const coinId = TOKEN_ID_MAP[symbol.toUpperCase()];
    if (!coinId) {
      console.warn(`No coin ID found for symbol: ${symbol}`);
      return [];
    }

    const response = await fetch(
      `${COINS_ENDPOINT}/${coinId}/market_chart?vs_currency=usd&days=${days}&interval=hourly`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    rateLimiter.recordCall();

    if (data.prices && Array.isArray(data.prices)) {
      return data.prices.map(([timestamp, price]: [number, number]) => ({
        timestamp,
        price,
      }));
    }

    return [];
  } catch (error) {
    console.error('Failed to fetch historical prices:', error);
    return [];
  }
}

/**
 * Price monitoring service
 */
export class PriceMonitor {
  private intervals: Map<string, NodeJS.Timeout> = new Map();
  private subscribers: Map<string, Set<(price: PriceData) => void>> = new Map();

  /**
   * Subscribe to price updates for a token
   */
  subscribe(symbol: string, callback: (price: PriceData) => void, intervalMs: number = 30000): () => void {
    const upperSymbol = symbol.toUpperCase();
    
    if (!this.subscribers.has(upperSymbol)) {
      this.subscribers.set(upperSymbol, new Set());
    }
    
    this.subscribers.get(upperSymbol)!.add(callback);
    
    // Start monitoring if not already started
    if (!this.intervals.has(upperSymbol)) {
      this.startMonitoring(upperSymbol, intervalMs);
    }
    
    // Return unsubscribe function
    return () => {
      const subs = this.subscribers.get(upperSymbol);
      if (subs) {
        subs.delete(callback);
        if (subs.size === 0) {
          this.stopMonitoring(upperSymbol);
        }
      }
    };
  }

  /**
   * Start monitoring a token price
   */
  private startMonitoring(symbol: string, intervalMs: number): void {
    const interval = setInterval(async () => {
      try {
        const priceData = await fetchTokenPrice(symbol);
        if (priceData) {
          const subscribers = this.subscribers.get(symbol);
          if (subscribers) {
            subscribers.forEach(callback => callback(priceData));
          }
        }
      } catch (error) {
        console.error(`Failed to monitor price for ${symbol}:`, error);
      }
    }, intervalMs);
    
    this.intervals.set(symbol, interval);
  }

  /**
   * Stop monitoring a token price
   */
  private stopMonitoring(symbol: string): void {
    const interval = this.intervals.get(symbol);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(symbol);
    }
    this.subscribers.delete(symbol);
  }

  /**
   * Stop all monitoring
   */
  stopAll(): void {
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals.clear();
    this.subscribers.clear();
  }
}

// Global price monitor instance
export const priceMonitor = new PriceMonitor();

/**
 * Calculate portfolio value
 */
export function calculatePortfolioValue(
  balances: Array<{ symbol: string; balance: string; decimals?: number }>,
  prices: Record<string, PriceData>
): { totalValue: number; totalChange24h: number; assets: Array<{ symbol: string; value: number; change24h: number }> } {
  let totalValue = 0;
  let totalChange24h = 0;
  const assets: Array<{ symbol: string; value: number; change24h: number }> = [];

  balances.forEach(({ symbol, balance, decimals = 18 }) => {
    const price = prices[symbol.toUpperCase()];
    if (price && balance) {
      const balanceNum = parseFloat(balance);
      const value = balanceNum * price.price;
      const change24h = (value * price.change24h) / 100;
      
      totalValue += value;
      totalChange24h += change24h;
      
      assets.push({
        symbol,
        value,
        change24h: price.change24h,
      });
    }
  });

  return {
    totalValue,
    totalChange24h: totalValue > 0 ? (totalChange24h / totalValue) * 100 : 0,
    assets,
  };
}

/**
 * Format price for display
 */
export function formatPrice(price: number, decimals: number = 2): string {
  if (price === 0) return '$0.00';
  
  if (price < 0.01) {
    return `$${price.toFixed(6)}`;
  }
  
  if (price < 1) {
    return `$${price.toFixed(4)}`;
  }
  
  return `$${price.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}

/**
 * Format percentage change
 */
export function formatPriceChange(change: number): string {
  const sign = change >= 0 ? '+' : '';
  return `${sign}${change.toFixed(2)}%`;
}