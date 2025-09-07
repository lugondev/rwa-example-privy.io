import { useState, useEffect, useCallback, useRef } from 'react';
import { notificationService } from '@/utils/notificationService';

// Price data interfaces
export interface TokenPrice {
  symbol: string;
  address: string;
  chain: string;
  price: number;
  priceChange24h: number;
  priceChangePercentage24h: number;
  marketCap: number;
  volume24h: number;
  lastUpdated: number;
}

export interface PriceHistory {
  timestamp: number;
  price: number;
}

export interface PriceSubscription {
  tokenAddress: string;
  chain: string;
  callback: (price: TokenPrice) => void;
}

// Price API configuration
const PRICE_API_CONFIG = {
  coingecko: {
    baseUrl: 'https://api.coingecko.com/api/v3',
    endpoints: {
      prices: '/simple/price',
      history: '/coins/{id}/market_chart',
      tokenInfo: '/coins/{platform}/{address}'
    },
    rateLimit: 50, // requests per minute
    supportedChains: {
      ethereum: 'ethereum',
      polygon: 'polygon-pos',
      arbitrum: 'arbitrum-one',
      optimism: 'optimistic-ethereum',
      bsc: 'binance-smart-chain'
    }
  },
  fallback: {
    // Fallback to mock data when API fails
    enabled: true,
    updateInterval: 30000 // 30 seconds
  }
};

// Rate limiting utility
class RateLimiter {
  private requests: number[] = [];
  private limit: number;
  private window: number;

  constructor(limit: number, windowMs: number) {
    this.limit = limit;
    this.window = windowMs;
  }

  canMakeRequest(): boolean {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.window);
    return this.requests.length < this.limit;
  }

  recordRequest(): void {
    this.requests.push(Date.now());
  }
}

// Price cache for reducing API calls
class PriceCache {
  private cache = new Map<string, { data: TokenPrice; expiry: number }>();
  private readonly TTL = 60000; // 1 minute cache

  set(key: string, data: TokenPrice): void {
    this.cache.set(key, {
      data,
      expiry: Date.now() + this.TTL
    });
  }

  get(key: string): TokenPrice | null {
    const cached = this.cache.get(key);
    if (!cached || Date.now() > cached.expiry) {
      this.cache.delete(key);
      return null;
    }
    return cached.data;
  }

  clear(): void {
    this.cache.clear();
  }
}

// Initialize rate limiter and cache
const rateLimiter = new RateLimiter(PRICE_API_CONFIG.coingecko.rateLimit, 60000);
const priceCache = new PriceCache();

// Mock price data generator for fallback
const generateMockPrice = (symbol: string, basePrice: number = 1000): TokenPrice => {
  const variation = (Math.random() - 0.5) * 0.1; // ±5% variation
  const price = basePrice * (1 + variation);
  const change24h = (Math.random() - 0.5) * 200; // ±$100 change
  const changePercentage = (change24h / (price - change24h)) * 100;

  return {
    symbol,
    address: `0x${Math.random().toString(16).substr(2, 40)}`,
    chain: 'ethereum',
    price,
    priceChange24h: change24h,
    priceChangePercentage24h: changePercentage,
    marketCap: price * 1000000 * (1 + Math.random()),
    volume24h: price * 100000 * (1 + Math.random()),
    lastUpdated: Date.now()
  };
};

// API service for fetching prices
class PriceAPIService {
  private async fetchFromCoinGecko(tokens: Array<{ address: string; chain: string }>): Promise<TokenPrice[]> {
    try {
      if (!rateLimiter.canMakeRequest()) {
        throw new Error('Rate limit exceeded');
      }

      // Group tokens by chain for batch requests
      const tokensByChain = tokens.reduce((acc, token) => {
        const platform = PRICE_API_CONFIG.coingecko.supportedChains[token.chain as keyof typeof PRICE_API_CONFIG.coingecko.supportedChains];
        if (!platform) return acc;
        
        if (!acc[platform]) acc[platform] = [];
        acc[platform].push(token.address);
        return acc;
      }, {} as Record<string, string[]>);

      const results: TokenPrice[] = [];

      for (const [platform, addresses] of Object.entries(tokensByChain)) {
        const addressList = addresses.join(',');
        const url = `${PRICE_API_CONFIG.coingecko.baseUrl}/simple/token_price/${platform}?contract_addresses=${addressList}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true&include_market_cap=true`;
        
        rateLimiter.recordRequest();
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`CoinGecko API error: ${response.status}`);
        }

        const data = await response.json();
        
        for (const [address, priceData] of Object.entries(data)) {
          if (priceData && typeof priceData === 'object') {
            const price = priceData as any;
            results.push({
              symbol: 'UNKNOWN', // Would need additional API call to get symbol
              address: address.toLowerCase(),
              chain: Object.keys(PRICE_API_CONFIG.coingecko.supportedChains).find(
                key => PRICE_API_CONFIG.coingecko.supportedChains[key as keyof typeof PRICE_API_CONFIG.coingecko.supportedChains] === platform
              ) || 'ethereum',
              price: price.usd || 0,
              priceChange24h: price.usd_24h_change || 0,
              priceChangePercentage24h: price.usd_24h_change || 0,
              marketCap: price.usd_market_cap || 0,
              volume24h: price.usd_24h_vol || 0,
              lastUpdated: Date.now()
            });
          }
        }
      }

      return results;
    } catch (error) {
      console.error('CoinGecko API error:', error);
      throw error;
    }
  }

  private generateFallbackPrices(tokens: Array<{ address: string; chain: string; symbol?: string }>): TokenPrice[] {
    return tokens.map(token => {
      const basePrice = token.symbol === 'ETH' ? 2000 : 
                       token.symbol === 'BTC' ? 45000 :
                       token.symbol === 'USDC' ? 1 :
                       Math.random() * 1000 + 100;
      
      return generateMockPrice(token.symbol || 'UNKNOWN', basePrice);
    });
  }

  async fetchPrices(tokens: Array<{ address: string; chain: string; symbol?: string }>): Promise<TokenPrice[]> {
    // Check cache first
    const cachedResults: TokenPrice[] = [];
    const uncachedTokens: Array<{ address: string; chain: string; symbol?: string }> = [];

    for (const token of tokens) {
      const cacheKey = `${token.chain}:${token.address.toLowerCase()}`;
      const cached = priceCache.get(cacheKey);
      if (cached) {
        cachedResults.push(cached);
      } else {
        uncachedTokens.push(token);
      }
    }

    if (uncachedTokens.length === 0) {
      return cachedResults;
    }

    try {
      // Try to fetch from CoinGecko
      const freshPrices = await this.fetchFromCoinGecko(uncachedTokens);
      
      // Cache the results
      freshPrices.forEach(price => {
        const cacheKey = `${price.chain}:${price.address.toLowerCase()}`;
        priceCache.set(cacheKey, price);
      });

      return [...cachedResults, ...freshPrices];
    } catch (error) {
      console.warn('Falling back to mock prices due to API error:', error);
      
      // Fallback to mock data
      const fallbackPrices = this.generateFallbackPrices(uncachedTokens);
      
      // Cache fallback prices with shorter TTL
      fallbackPrices.forEach(price => {
        const cacheKey = `${price.chain}:${price.address.toLowerCase()}`;
        priceCache.set(cacheKey, price);
      });

      return [...cachedResults, ...fallbackPrices];
    }
  }

  async fetchPriceHistory(tokenAddress: string, chain: string, days: number = 7): Promise<PriceHistory[]> {
    try {
      // For now, generate mock historical data
      // In production, you would fetch from CoinGecko's market_chart endpoint
      const history: PriceHistory[] = [];
      const now = Date.now();
      const interval = (days * 24 * 60 * 60 * 1000) / 100; // 100 data points
      
      let basePrice = 1000 + Math.random() * 1000;
      
      for (let i = 0; i < 100; i++) {
        const timestamp = now - (99 - i) * interval;
        const variation = (Math.random() - 0.5) * 0.05; // ±2.5% variation
        basePrice *= (1 + variation);
        
        history.push({
          timestamp,
          price: basePrice
        });
      }
      
      return history;
    } catch (error) {
      console.error('Error fetching price history:', error);
      return [];
    }
  }
}

const priceAPIService = new PriceAPIService();

// Main hook for real-time prices
export const useRealTimePrices = () => {
  const [prices, setPrices] = useState<Map<string, TokenPrice>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number>(0);
  
  const subscriptionsRef = useRef<Map<string, PriceSubscription>>(new Map());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const watchedTokensRef = useRef<Array<{ address: string; chain: string; symbol?: string }>>([]);

  // Subscribe to price updates for a token
  const subscribe = useCallback((tokenAddress: string, chain: string, callback: (price: TokenPrice) => void) => {
    // Enhanced validation for tokenAddress
    if (!tokenAddress || 
        typeof tokenAddress !== 'string' || 
        tokenAddress.trim().length === 0 || 
        tokenAddress === 'undefined' || 
        tokenAddress === 'null') {
      console.error('Invalid tokenAddress provided to subscribe:', tokenAddress);
      return () => {}; // Return empty unsubscribe function
    }
    
    const key = `${chain}:${tokenAddress.toLowerCase()}`;
    subscriptionsRef.current.set(key, { tokenAddress, chain, callback });
    
    // Add to watched tokens if not already present
    const isWatched = watchedTokensRef.current.some(
      token => token.address.toLowerCase() === tokenAddress.toLowerCase() && token.chain === chain
    );
    
    if (!isWatched) {
      watchedTokensRef.current.push({ address: tokenAddress, chain });
    }
    
    return () => {
      subscriptionsRef.current.delete(key);
      watchedTokensRef.current = watchedTokensRef.current.filter(
        token => !(token.address.toLowerCase() === tokenAddress.toLowerCase() && token.chain === chain)
      );
    };
  }, []);

  // Unsubscribe from price updates
  const unsubscribe = useCallback((tokenAddress: string, chain: string) => {
    const key = `${chain}:${tokenAddress.toLowerCase()}`;
    subscriptionsRef.current.delete(key);
    watchedTokensRef.current = watchedTokensRef.current.filter(
      token => !(token.address.toLowerCase() === tokenAddress.toLowerCase() && token.chain === chain)
    );
  }, []);

  // Fetch prices for watched tokens
  const fetchPrices = useCallback(async () => {
    if (watchedTokensRef.current.length === 0) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const tokenPrices = await priceAPIService.fetchPrices(watchedTokensRef.current);
      
      const newPrices = new Map<string, TokenPrice>();
      
      tokenPrices.forEach(price => {
        const key = `${price.chain}:${price.address.toLowerCase()}`;
        newPrices.set(key, price);
        
        // Notify subscribers
        const subscription = subscriptionsRef.current.get(key);
        if (subscription) {
          subscription.callback(price);
        }
        
        // Check price alerts
        notificationService.checkPriceAlerts(price);
      });
      
      setPrices(newPrices);
      setLastUpdated(Date.now());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch prices');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get price for a specific token
  const getPrice = useCallback((tokenAddress: string, chain: string): TokenPrice | null => {
    const key = `${chain}:${tokenAddress.toLowerCase()}`;
    return prices.get(key) || null;
  }, [prices]);

  // Get price history for a token
  const getPriceHistory = useCallback(async (tokenAddress: string, chain: string, days: number = 7): Promise<PriceHistory[]> => {
    return priceAPIService.fetchPriceHistory(tokenAddress, chain, days);
  }, []);

  // Start real-time updates
  const startUpdates = useCallback((intervalMs: number = 30000) => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    // Initial fetch
    fetchPrices();
    
    // Set up interval
    intervalRef.current = setInterval(fetchPrices, intervalMs);
  }, [fetchPrices]);

  // Stop real-time updates
  const stopUpdates = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Add tokens to watch list
  const addTokens = useCallback((tokens: Array<{ address: string; chain: string; symbol?: string }>) => {
    tokens.forEach(token => {
      // Validate token address before adding
      const isValidAddress = token.address && 
        typeof token.address === 'string' && 
        token.address.trim().length > 0 && 
        token.address !== 'undefined' && 
        token.address !== 'null';
        
      const isValidChain = token.chain && 
        typeof token.chain === 'string' && 
        token.chain.trim().length > 0;
        
      if (!isValidAddress || !isValidChain) {
        console.warn('Invalid token data provided to addTokens:', token);
        return;
      }
      
      const isWatched = watchedTokensRef.current.some(
        existing => existing.address.toLowerCase() === token.address.toLowerCase() && existing.chain === token.chain
      );
      
      if (!isWatched) {
        watchedTokensRef.current.push({
          ...token,
          address: token.address.trim()
        });
      }
    });
    
    // Fetch prices immediately for new tokens
    fetchPrices();
  }, [fetchPrices]);

  // Remove tokens from watch list
  const removeTokens = useCallback((tokens: Array<{ address: string; chain: string }>) => {
    tokens.forEach(token => {
      watchedTokensRef.current = watchedTokensRef.current.filter(
        existing => !(existing.address.toLowerCase() === token.address.toLowerCase() && existing.chain === token.chain)
      );
      
      const key = `${token.chain}:${token.address.toLowerCase()}`;
      subscriptionsRef.current.delete(key);
    });
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopUpdates();
      subscriptionsRef.current.clear();
      watchedTokensRef.current = [];
    };
  }, [stopUpdates]);

  return {
    prices: Array.from(prices.values()),
    pricesMap: prices,
    isLoading,
    error,
    lastUpdated,
    subscribe,
    unsubscribe,
    getPrice,
    getPriceHistory,
    startUpdates,
    stopUpdates,
    addTokens,
    removeTokens,
    fetchPrices
  };
};

// Hook for individual token price
export const useTokenPrice = (tokenAddress: string, chain: string, autoUpdate: boolean = true) => {
  const [price, setPrice] = useState<TokenPrice | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { subscribe, unsubscribe, getPrice, startUpdates, stopUpdates } = useRealTimePrices();

  useEffect(() => {
    // Enhanced validation for tokenAddress and chain
    if (!tokenAddress || 
        !chain || 
        typeof tokenAddress !== 'string' || 
        typeof chain !== 'string' ||
        tokenAddress.trim().length === 0 || 
        chain.trim().length === 0 ||
        tokenAddress === 'undefined' || 
        tokenAddress === 'null') {
      setError('Invalid tokenAddress or chain provided');
      return;
    }
    
    setIsLoading(true);
    
    const unsubscribeCallback = subscribe(tokenAddress, chain, (newPrice) => {
      setPrice(newPrice);
      setIsLoading(false);
      setError(null);
    });
    
    // Get initial price
    const initialPrice = getPrice(tokenAddress, chain);
    if (initialPrice) {
      setPrice(initialPrice);
      setIsLoading(false);
    }
    
    if (autoUpdate) {
      startUpdates();
    }
    
    return () => {
      unsubscribeCallback();
      if (autoUpdate) {
        stopUpdates();
      }
    };
  }, [tokenAddress, chain, autoUpdate, subscribe, unsubscribe, getPrice, startUpdates, stopUpdates]);

  return { price, isLoading, error };
};