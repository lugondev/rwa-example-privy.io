'use client';

/**
 * Persistent storage utilities for wallet settings and preferences
 */

export interface WalletSettings {
  autoConnect: boolean;
  hideSmallBalances: boolean;
  gasWarningThreshold: number;
  preferredNetwork: string;
  defaultGasSettings: {
    speed: 'slow' | 'standard' | 'fast';
    customGasPrice?: string;
  };
  rpcEndpoints: Record<string, string>;
  securitySettings: {
    requireConfirmation: boolean;
    phishingProtection: boolean;
    autoLockTimer: number; // minutes
  };
  advancedSettings: {
    developerMode: boolean;
    showTestnets: boolean;
    enableAnalytics: boolean;
  };
  customTokens: Array<{
    chainId: string;
    address: string;
    symbol: string;
    name: string;
    decimals: number;
  }>;
}

export interface PortfolioPreferences {
  defaultView: 'grid' | 'list';
  sortBy: 'value' | 'name' | 'change';
  sortOrder: 'asc' | 'desc';
  hideSmallBalances: boolean;
  refreshInterval: number; // seconds
  chartTimeframe: '1h' | '24h' | '7d' | '30d' | '1y';
  showPriceAlerts: boolean;
  priceAlerts: Array<{
    tokenSymbol: string;
    chainId: string;
    type: 'above' | 'below';
    price: number;
    enabled: boolean;
  }>;
}

export interface TransactionHistory {
  [chainId: string]: Array<{
    hash: string;
    timestamp: number;
    type: string;
    status: string;
    from: string;
    to: string;
    value: string;
    gasUsed?: string;
    gasPrice?: string;
  }>;
}

const STORAGE_KEYS = {
  WALLET_SETTINGS: 'rwa_wallet_settings',
  PORTFOLIO_PREFERENCES: 'rwa_portfolio_preferences',
  TRANSACTION_HISTORY: 'rwa_transaction_history',
  CONNECTED_WALLETS: 'rwa_connected_wallets',
  PRICE_CACHE: 'rwa_price_cache',
  LAST_REFRESH: 'rwa_last_refresh',
} as const;

/**
 * Default wallet settings
 */
const DEFAULT_WALLET_SETTINGS: WalletSettings = {
  autoConnect: true,
  hideSmallBalances: false,
  gasWarningThreshold: 50, // USD
  preferredNetwork: 'ethereum',
  defaultGasSettings: {
    speed: 'standard',
  },
  rpcEndpoints: {},
  securitySettings: {
    requireConfirmation: true,
    phishingProtection: true,
    autoLockTimer: 30, // 30 minutes
  },
  advancedSettings: {
    developerMode: false,
    showTestnets: false,
    enableAnalytics: true,
  },
  customTokens: [],
};

/**
 * Default portfolio preferences
 */
const DEFAULT_PORTFOLIO_PREFERENCES: PortfolioPreferences = {
  defaultView: 'grid',
  sortBy: 'value',
  sortOrder: 'desc',
  hideSmallBalances: false,
  refreshInterval: 30, // 30 seconds
  chartTimeframe: '24h',
  showPriceAlerts: true,
  priceAlerts: [],
};

/**
 * Safe localStorage wrapper with error handling
 */
class SafeStorage {
  private isAvailable(): boolean {
    try {
      return typeof window !== 'undefined' && window.localStorage !== undefined;
    } catch {
      return false;
    }
  }

  get<T>(key: string, defaultValue: T): T {
    if (!this.isAvailable()) return defaultValue;

    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.warn(`Failed to get ${key} from localStorage:`, error);
      return defaultValue;
    }
  }

  set<T>(key: string, value: T): boolean {
    if (!this.isAvailable()) return false;

    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.warn(`Failed to set ${key} in localStorage:`, error);
      return false;
    }
  }

  remove(key: string): boolean {
    if (!this.isAvailable()) return false;

    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.warn(`Failed to remove ${key} from localStorage:`, error);
      return false;
    }
  }

  clear(): boolean {
    if (!this.isAvailable()) return false;

    try {
      // Only clear our app's keys
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
      return true;
    } catch (error) {
      console.warn('Failed to clear localStorage:', error);
      return false;
    }
  }
}

const storage = new SafeStorage();

/**
 * Wallet settings management
 */
export const walletStorage = {
  getSettings(): WalletSettings {
    return storage.get(STORAGE_KEYS.WALLET_SETTINGS, DEFAULT_WALLET_SETTINGS);
  },

  updateSettings(updates: Partial<WalletSettings>): boolean {
    const current = this.getSettings();
    const updated = { ...current, ...updates };
    return storage.set(STORAGE_KEYS.WALLET_SETTINGS, updated);
  },

  resetSettings(): boolean {
    return storage.set(STORAGE_KEYS.WALLET_SETTINGS, DEFAULT_WALLET_SETTINGS);
  },

  addCustomToken(token: WalletSettings['customTokens'][0]): boolean {
    const settings = this.getSettings();
    const exists = settings.customTokens.some(
      t => t.chainId === token.chainId && t.address.toLowerCase() === token.address.toLowerCase()
    );
    
    if (!exists) {
      settings.customTokens.push(token);
      return this.updateSettings(settings);
    }
    return false;
  },

  removeCustomToken(chainId: string, address: string): boolean {
    const settings = this.getSettings();
    settings.customTokens = settings.customTokens.filter(
      t => !(t.chainId === chainId && t.address.toLowerCase() === address.toLowerCase())
    );
    return this.updateSettings(settings);
  },
};

/**
 * Portfolio preferences management
 */
export const portfolioStorage = {
  getPreferences(): PortfolioPreferences {
    return storage.get(STORAGE_KEYS.PORTFOLIO_PREFERENCES, DEFAULT_PORTFOLIO_PREFERENCES);
  },

  updatePreferences(updates: Partial<PortfolioPreferences>): boolean {
    const current = this.getPreferences();
    const updated = { ...current, ...updates };
    return storage.set(STORAGE_KEYS.PORTFOLIO_PREFERENCES, updated);
  },

  resetPreferences(): boolean {
    return storage.set(STORAGE_KEYS.PORTFOLIO_PREFERENCES, DEFAULT_PORTFOLIO_PREFERENCES);
  },

  addPriceAlert(alert: PortfolioPreferences['priceAlerts'][0]): boolean {
    const preferences = this.getPreferences();
    preferences.priceAlerts.push(alert);
    return this.updatePreferences(preferences);
  },

  removePriceAlert(tokenSymbol: string, chainId: string): boolean {
    const preferences = this.getPreferences();
    preferences.priceAlerts = preferences.priceAlerts.filter(
      alert => !(alert.tokenSymbol === tokenSymbol && alert.chainId === chainId)
    );
    return this.updatePreferences(preferences);
  },
};

/**
 * Transaction history management
 */
export const transactionStorage = {
  getHistory(): TransactionHistory {
    return storage.get(STORAGE_KEYS.TRANSACTION_HISTORY, {});
  },

  addTransaction(chainId: string, transaction: TransactionHistory[string][0]): boolean {
    const history = this.getHistory();
    if (!history[chainId]) {
      history[chainId] = [];
    }
    
    // Avoid duplicates
    const exists = history[chainId].some(tx => tx.hash === transaction.hash);
    if (!exists) {
      history[chainId].unshift(transaction); // Add to beginning
      
      // Keep only last 100 transactions per chain
      if (history[chainId].length > 100) {
        history[chainId] = history[chainId].slice(0, 100);
      }
      
      return storage.set(STORAGE_KEYS.TRANSACTION_HISTORY, history);
    }
    return false;
  },

  updateTransactionStatus(chainId: string, hash: string, status: string): boolean {
    const history = this.getHistory();
    if (history[chainId]) {
      const tx = history[chainId].find(t => t.hash === hash);
      if (tx) {
        tx.status = status;
        return storage.set(STORAGE_KEYS.TRANSACTION_HISTORY, history);
      }
    }
    return false;
  },

  clearHistory(chainId?: string): boolean {
    if (chainId) {
      const history = this.getHistory();
      delete history[chainId];
      return storage.set(STORAGE_KEYS.TRANSACTION_HISTORY, history);
    } else {
      return storage.set(STORAGE_KEYS.TRANSACTION_HISTORY, {});
    }
  },
};

/**
 * Connected wallets management
 */
export const connectionStorage = {
  getConnectedWallets(): Record<string, { address: string; lastConnected: number }> {
    return storage.get(STORAGE_KEYS.CONNECTED_WALLETS, {});
  },

  saveConnection(chainId: string, address: string): boolean {
    const connections = this.getConnectedWallets();
    connections[chainId] = {
      address,
      lastConnected: Date.now(),
    };
    return storage.set(STORAGE_KEYS.CONNECTED_WALLETS, connections);
  },

  removeConnection(chainId: string): boolean {
    const connections = this.getConnectedWallets();
    delete connections[chainId];
    return storage.set(STORAGE_KEYS.CONNECTED_WALLETS, connections);
  },

  clearAllConnections(): boolean {
    return storage.set(STORAGE_KEYS.CONNECTED_WALLETS, {});
  },
};

/**
 * Price cache management
 */
export const priceStorage = {
  getPriceCache(): Record<string, { price: number; timestamp: number; change24h: number }> {
    return storage.get(STORAGE_KEYS.PRICE_CACHE, {});
  },

  updatePrice(symbol: string, price: number, change24h: number): boolean {
    const cache = this.getPriceCache();
    cache[symbol] = {
      price,
      change24h,
      timestamp: Date.now(),
    };
    return storage.set(STORAGE_KEYS.PRICE_CACHE, cache);
  },

  getCachedPrice(symbol: string, maxAge: number = 60000): { price: number; change24h: number } | null {
    const cache = this.getPriceCache();
    const cached = cache[symbol];
    
    if (cached && Date.now() - cached.timestamp < maxAge) {
      return { price: cached.price, change24h: cached.change24h };
    }
    return null;
  },

  clearPriceCache(): boolean {
    return storage.set(STORAGE_KEYS.PRICE_CACHE, {});
  },
};

/**
 * General utilities
 */
export const storageUtils = {
  getLastRefresh(): number {
    return storage.get(STORAGE_KEYS.LAST_REFRESH, 0);
  },

  setLastRefresh(timestamp: number = Date.now()): boolean {
    return storage.set(STORAGE_KEYS.LAST_REFRESH, timestamp);
  },

  exportData(): string {
    const data = {
      settings: walletStorage.getSettings(),
      preferences: portfolioStorage.getPreferences(),
      history: transactionStorage.getHistory(),
      connections: connectionStorage.getConnectedWallets(),
      priceCache: priceStorage.getPriceCache(),
      lastRefresh: this.getLastRefresh(),
    };
    return JSON.stringify(data, null, 2);
  },

  importData(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);
      
      if (data.settings) walletStorage.updateSettings(data.settings);
      if (data.preferences) portfolioStorage.updatePreferences(data.preferences);
      if (data.history) storage.set(STORAGE_KEYS.TRANSACTION_HISTORY, data.history);
      if (data.connections) storage.set(STORAGE_KEYS.CONNECTED_WALLETS, data.connections);
      if (data.priceCache) storage.set(STORAGE_KEYS.PRICE_CACHE, data.priceCache);
      if (data.lastRefresh) this.setLastRefresh(data.lastRefresh);
      
      return true;
    } catch (error) {
      console.error('Failed to import data:', error);
      return false;
    }
  },

  clearAllData(): boolean {
    return storage.clear();
  },
};