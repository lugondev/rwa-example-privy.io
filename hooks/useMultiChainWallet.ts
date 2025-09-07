'use client';

import {
  fetchPriceData,
  PriceData
} from '@/lib/price-service';
import {
  connectionStorage,
  transactionStorage,
  walletStorage,
} from '@/lib/storage';
import {
  CHAIN_ID_MAPPING,
  estimateGas,
  fetchRealBalance,
  fetchTokenBalance
} from '@/lib/web3-providers';
import {
  ChainConfig,
  ContractCall,
  ContractEvent,
  MultiChainWalletState,
  NetworkStatus,
  SupportedChain,
  TokenInfo,
  Transaction,
  WalletBalance
} from '@/types/wallet';
import { optimizeGasSettings } from '@/utils/gasOptimization';
import { notificationService } from '@/utils/notificationService';
import { usePrivy } from '@privy-io/react-auth';
import { useCallback, useEffect, useState, useRef, useMemo } from 'react';
import { createPublicClient, formatEther, http } from 'viem';
import { arbitrum, base, mainnet, optimism, polygon } from 'viem/chains';
import { useAccount, useConnect, useDisconnect, useSwitchChain } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { useRealTimePrices } from './useRealTimePrices';

// Chain configurations
export const SUPPORTED_CHAINS: Record<SupportedChain, ChainConfig> = {
  ethereum: {
    id: 'ethereum',
    name: 'Ethereum',
    displayName: 'Ethereum Mainnet',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: ['https://mainnet.infura.io/v3/'],
    blockExplorerUrls: ['https://etherscan.io'],
    iconUrl: '/chains/ethereum.svg',
    chainId: 1,
    networkId: 1,
  },
  polygon: {
    id: 'polygon',
    name: 'Polygon',
    displayName: 'Polygon Mainnet',
    nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
    rpcUrls: ['https://polygon-rpc.com'],
    blockExplorerUrls: ['https://polygonscan.com'],
    iconUrl: '/chains/polygon.svg',
    chainId: 137,
    networkId: 137,
  },
  arbitrum: {
    id: 'arbitrum',
    name: 'Arbitrum',
    displayName: 'Arbitrum One',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: ['https://arb1.arbitrum.io/rpc'],
    blockExplorerUrls: ['https://arbiscan.io'],
    iconUrl: '/chains/arbitrum.svg',
    chainId: 42161,
    networkId: 42161,
  },
  optimism: {
    id: 'optimism',
    name: 'Optimism',
    displayName: 'Optimism Mainnet',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: ['https://mainnet.optimism.io'],
    blockExplorerUrls: ['https://optimistic.etherscan.io'],
    iconUrl: '/chains/optimism.svg',
    chainId: 10,
    networkId: 10,
  },
  xdc: {
    id: 'xdc',
    name: 'XDC',
    displayName: 'XDC Network',
    nativeCurrency: { name: 'XDC', symbol: 'XDC', decimals: 18 },
    rpcUrls: ['https://rpc.xinfin.network'],
    blockExplorerUrls: ['https://explorer.xinfin.network'],
    iconUrl: '/chains/xdc.svg',
    chainId: 50,
    networkId: 50,
  },
  algorand: {
    id: 'algorand',
    name: 'Algorand',
    displayName: 'Algorand Mainnet',
    nativeCurrency: { name: 'Algorand', symbol: 'ALGO', decimals: 6 },
    rpcUrls: ['https://mainnet-api.algonode.cloud'],
    blockExplorerUrls: ['https://algoexplorer.io'],
    iconUrl: '/chains/algorand.svg',
    chainId: 4160,
    networkId: 4160,
  },
};

/**
 * Hook for managing multi-chain wallet connections and operations
 */
export function useMultiChainWallet() {
  const { authenticated, user } = usePrivy();

  const { address, isConnected, chain } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();

  const [walletState, setWalletState] = useState<MultiChainWalletState>({
    connections: {},
    currentChain: null,
    balances: {},
    transactions: {},
    isLoading: false,
    error: undefined,
  });

  const [prices, setPrices] = useState<Record<string, PriceData>>({});
  const [settings, setSettings] = useState(walletStorage.getSettings());

  // Real-time price updates
  const {
    prices: realTimePrices,
    isLoading: pricesLoading,
    error: pricesError,
    addTokens: addTokensFromHook,
    startUpdates,
    stopUpdates,
    subscribe: subscribeToPriceUpdates
  } = useRealTimePrices();

  // Memoize addTokens to prevent infinite re-renders
  const addTokensStable = useCallback((tokens: Array<{ address: string; chain: string; symbol?: string }>) => {
    // Add validation and prevent duplicates
    const validTokens = tokens.filter(token => 
      token.address && 
      typeof token.address === 'string' && 
      token.address.trim().length > 0 && 
      token.address !== 'undefined' && 
      token.address !== 'null' &&
      token.chain &&
      typeof token.chain === 'string' &&
      token.chain.trim().length > 0
    );

    if (validTokens.length > 0) {
      addTokensFromHook(validTokens);
    }
  }, [addTokensFromHook]);

  // Load saved connections, settings, and transactions on mount
  useEffect(() => {
    const savedConnections = connectionStorage.getConnectedWallets();
    const savedSettings = walletStorage.getSettings();
    const connections: Record<string, any> = {};

    Object.entries(savedConnections).forEach(([chainId, data]) => {
      connections[chainId] = {
        isConnected: false, // Will be updated when actually connected
        isConnecting: false,
        address: data.address,
        chainId,
      };
    });

    // Load saved transactions for all chains
    const savedTransactions: Record<string, Transaction[]> = {};
    const allTransactions = transactionStorage.getHistory();
    Object.keys(SUPPORTED_CHAINS).forEach(chainId => {
      const chainTransactions = allTransactions[chainId] || [];
      if (chainTransactions.length > 0) {
        // Ensure transactions have required fields
        const validTransactions = chainTransactions.map(tx => ({
          ...tx,
          chainId: (tx as any).chainId || chainId,
          nonce: (tx as any).nonce || 0,
        })) as Transaction[];
        savedTransactions[chainId] = validTransactions;
      }
    });

    setWalletState(prev => ({ ...prev, connections, transactions: savedTransactions }));
    setSettings(savedSettings);

    // Initialize notification service
    notificationService.init();

    // Start price updates if there are connected wallets - use timeout to avoid circular dependency
    if (Object.keys(connections).length > 0) {
      setTimeout(() => {
        startUpdates(30000); // Update every 30 seconds
      }, 0);
    }

    return () => {
      stopUpdates();
    };
  }, []); // Remove dependencies to prevent circular

  // Create public clients for each chain
  const publicClients = {
    [mainnet.id]: createPublicClient({ chain: mainnet, transport: http() }),
    [polygon.id]: createPublicClient({ chain: polygon, transport: http() }),
    [arbitrum.id]: createPublicClient({ chain: arbitrum, transport: http() }),
    [optimism.id]: createPublicClient({ chain: optimism, transport: http() }),
    [base.id]: createPublicClient({ chain: base, transport: http() })
  };

  // Fetch balances for a specific chain - memoized to prevent recreation
  const fetchBalances = useCallback(async (chainId: string, walletAddress?: string) => {
    try {
      // Get address from parameter or current connections
      let address = walletAddress;
      if (!address) {
        const connection = walletState.connections[chainId];
        if (!connection?.address) {
          console.warn(`No address found for chain ${chainId}`);
          return;
        }
        address = connection.address;
      }

      const balances: Record<string, WalletBalance> = {};

      // Get native token balance using viem client
      const chain = SUPPORTED_CHAINS[chainId as SupportedChain];
      const wagmiChainId = CHAIN_ID_MAPPING[chainId as SupportedChain];
      const client = wagmiChainId ? publicClients[wagmiChainId as keyof typeof publicClients] : null;

      let nativeBalance = '0';
      if (client && address) {
        try {
          const balance = await client.getBalance({ address: address as `0x${string}` });
          nativeBalance = formatEther(balance);
        } catch (error) {
          console.error(`Failed to fetch native balance for ${chainId}:`, error);
          nativeBalance = await fetchRealBalance(chainId as SupportedChain, address);
        }
      } else {
        nativeBalance = await fetchRealBalance(chainId as SupportedChain, address);
      }

      if (chain && nativeBalance) {
        const nativeToken: TokenInfo = {
          address: '0x0000000000000000000000000000000000000000',
          symbol: chain.nativeCurrency.symbol,
          name: chain.nativeCurrency.name,
          decimals: chain.nativeCurrency.decimals,
          chainId,
          balance: nativeBalance,
        };

        // Get price data for native token - capture current state values
        const currentPrices = prices;
        const priceData = currentPrices[nativeToken.symbol];
        if (priceData) {
          nativeToken.price = priceData.price;
          nativeToken.priceChange24h = priceData.change24h;
          nativeToken.usdValue = parseFloat(nativeBalance) * priceData.price;
        }

        balances[nativeToken.address] = {
          address: nativeToken.address,
          balance: nativeBalance,
          usdValue: nativeToken.usdValue || 0,
          token: nativeToken,
          lastUpdated: Date.now(),
        };
      }

      // Get custom tokens from settings - capture current state values
      const currentSettings = settings;
      const currentPrices = prices;
      const customTokens = currentSettings.customTokens.filter(token => token.chainId === chainId);

      for (const customToken of customTokens) {
        try {
          const tokenBalance = await fetchTokenBalance(
            chainId as SupportedChain,
            customToken.address,
            address,
            customToken.decimals
          );

          if (parseFloat(tokenBalance) > 0 || !currentSettings.hideSmallBalances) {
            const tokenInfo: TokenInfo = {
              ...customToken,
              balance: tokenBalance,
            };

            // Get price data for token
            const priceData = currentPrices[customToken.symbol];
            if (priceData) {
              tokenInfo.price = priceData.price;
              tokenInfo.priceChange24h = priceData.change24h;
              tokenInfo.usdValue = parseFloat(tokenBalance) * priceData.price;
            }

            balances[customToken.address] = {
              address: customToken.address,
              balance: tokenBalance,
              usdValue: tokenInfo.usdValue || 0,
              token: tokenInfo,
              lastUpdated: Date.now(),
            };
          }
        } catch (error) {
          console.error(`Failed to fetch balance for token ${customToken.symbol}:`, error);
        }
      }

      // Add some popular tokens for demo (you can remove this in production)
      const popularTokens: Record<string, Array<{ address: string; symbol: string; name: string; decimals: number }>> = {
        ethereum: [
          { address: '0xA0b86a33E6441c8C06DD2b7c94b7E0e8c0c8c8c8', symbol: 'USDC', name: 'USD Coin', decimals: 6 },
          { address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', symbol: 'USDT', name: 'Tether USD', decimals: 6 },
        ],
        polygon: [
          { address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', symbol: 'USDC', name: 'USD Coin', decimals: 6 },
        ],
      };

      const chainPopularTokens = popularTokens[chainId] || [];
      for (const token of chainPopularTokens) {
        try {
          const tokenBalance = await fetchTokenBalance(
            chainId as SupportedChain,
            token.address,
            address,
            token.decimals
          );

          if (parseFloat(tokenBalance) > 0 || !currentSettings.hideSmallBalances) {
            const tokenInfo: TokenInfo = {
              ...token,
              chainId,
              balance: tokenBalance,
            };

            // Get price data for token
            const priceData = currentPrices[token.symbol];
            if (priceData) {
              tokenInfo.price = priceData.price;
              tokenInfo.priceChange24h = priceData.change24h;
              tokenInfo.usdValue = parseFloat(tokenBalance) * priceData.price;
            }

            balances[token.address] = {
              address: token.address,
              balance: tokenBalance,
              usdValue: tokenInfo.usdValue || 0,
              token: tokenInfo,
              lastUpdated: Date.now(),
            };
          }
        } catch (error) {
          console.error(`Failed to fetch balance for token ${token.symbol}:`, error);
        }
      }

      setWalletState(prev => ({
        ...prev,
        balances: {
          ...prev.balances,
          [chainId]: balances,
        },
      }));
    } catch (error) {
      console.error('Failed to fetch balances:', error);
    }
  }, [walletState.connections]); // Only depend on connections to avoid circular dependencies

  // Handle wagmi connection state changes - prevent circular updates
  useEffect(() => {
    if (isConnected && address && chain) {
      const supportedChain = Object.entries(CHAIN_ID_MAPPING).find(
        ([_, id]) => id === chain.id
      )?.[0] as SupportedChain;

      if (supportedChain) {
        setWalletState(prev => ({
          ...prev,
          connections: {
            ...prev.connections,
            [supportedChain]: {
              isConnected: true,
              isConnecting: false,
              address,
              chainId: supportedChain,
            }
          },
          currentChain: supportedChain,
          isLoading: false,
        }));

        // Save connection
        connectionStorage.saveConnection(supportedChain, address);

        // Use setTimeout to break the synchronous chain
        setTimeout(() => {
          fetchBalances(supportedChain, address);
        }, 50);
      }
    } else if (!isConnected) {
      // Clear EVM connections when disconnected
      setWalletState(prev => {
        const newConnections = { ...prev.connections };
        Object.keys(CHAIN_ID_MAPPING).forEach(chain => {
          if (newConnections[chain]) {
            delete newConnections[chain];
            connectionStorage.removeConnection(chain);
          }
        });

        return {
          ...prev,
          connections: newConnections,
          currentChain: Object.keys(newConnections)[0] || '',
        };
      });
    }
  }, [isConnected, address, chain?.id]); // Remove fetchBalances from dependencies and use only chain.id

  // Auto-connect to previously connected wallets - break circular dependency
  useEffect(() => {
    if (authenticated && !isConnected) {
      const savedConnections = connectionStorage.getConnectedWallets();

      Object.entries(savedConnections).forEach(([chainId, data]) => {
        if (data.address) {
          const wagmiChainId = CHAIN_ID_MAPPING[chainId as SupportedChain];

          if (wagmiChainId) {
            // Try to reconnect to EVM chains using wagmi
            try {
              connect({ connector: injected() });
            } catch (error) {
              console.error('Failed to reconnect wallet:', error);
            }
          } else if (!wagmiChainId) {
            // For non-EVM chains, restore connection state
            setWalletState(prev => ({
              ...prev,
              connections: {
                ...prev.connections,
                [chainId]: {
                  isConnected: true,
                  isConnecting: false,
                  address: data.address,
                  chainId,
                }
              }
            }));

            // Use setTimeout to prevent immediate re-render loops
            setTimeout(() => {
              fetchBalances(chainId, data.address);
            }, 50);
          }
        }
      });
    }
  }, [authenticated, isConnected, connect]); // Remove fetchBalances from dependencies

  // Simplified auto-connect with better control
  const hasTriedAutoConnect = useRef(false);
  useEffect(() => {
    if (settings.autoConnect && !isConnected && authenticated && !hasTriedAutoConnect.current) {
      hasTriedAutoConnect.current = true;
      const savedConnections = connectionStorage.getConnectedWallets();
      const lastConnection = Object.entries(savedConnections)
        .sort(([, a], [, b]) => b.lastConnected - a.lastConnected)[0];

      if (lastConnection) {
        const [chainId] = lastConnection;
        const wagmiChainId = CHAIN_ID_MAPPING[chainId as SupportedChain];
        if (wagmiChainId) {
          setTimeout(() => {
            try {
              connect({ connector: injected() });
            } catch (error) {
              console.error('Auto-connect failed:', error);
            }
          }, 100);
        }
      }
    }
  }, [settings.autoConnect, isConnected, authenticated, connect]);

  // Monitor prices for connected tokens - prevent infinite loops with better dependency tracking
  const balanceKeys = Object.keys(walletState.balances);
  useEffect(() => {
    if (balanceKeys.length === 0) return;

    const timeoutId = setTimeout(() => {
      const symbols = new Set<string>();
      const tokens: Array<{ address: string; chain: string; symbol?: string }> = [];

      Object.values(walletState.balances).forEach(chainBalances => {
        Object.values(chainBalances).forEach(balance => {
          // Enhanced validation for token address
          const isValidAddress = balance.token?.address && 
            typeof balance.token.address === 'string' && 
            balance.token.address.trim().length > 0 && 
            balance.token.address !== 'undefined' && 
            balance.token.address !== 'null';
            
          if (balance.token?.symbol && isValidAddress && balance.token?.chainId) {
            symbols.add(balance.token.symbol);
            // Create proper token object for addTokens
            tokens.push({
              address: balance.token.address.trim(),
              chain: balance.token.chainId,
              symbol: balance.token.symbol
            });
          }
        });
      });

      if (symbols.size > 0) {
        fetchPriceData(Array.from(symbols)).then(setPrices).catch(console.error);
        // Add tokens to real-time price tracking with proper format
        if (tokens.length > 0) {
          addTokensStable(tokens);
        }
      }
    }, 1000); // Increase debounce time to prevent infinite loops

    return () => clearTimeout(timeoutId);
  }, [balanceKeys.join(','), addTokensStable]); // Use string join instead of object references to prevent unnecessary re-renders

  // Sync real-time prices with local prices state
  useEffect(() => {
    if (realTimePrices && Array.isArray(realTimePrices) && realTimePrices.length > 0) {
      // Convert array to Record format
      const pricesRecord: Record<string, PriceData> = {};
      realTimePrices.forEach(tokenPrice => {
        if (tokenPrice.symbol) {
          pricesRecord[tokenPrice.symbol] = {
            price: tokenPrice.price,
            change24h: tokenPrice.priceChangePercentage24h,
            symbol: tokenPrice.symbol,
            lastUpdated: tokenPrice.lastUpdated,
          };
        }
      });

      setPrices(prev => ({ ...prev, ...pricesRecord }));

      // Check price alerts for all tokens (simplified call)
      realTimePrices.forEach(tokenPrice => {
        try {
          // Simple price alert check - you may need to adjust this based on your notification service API
          if (tokenPrice.symbol && tokenPrice.price) {
            // notificationService.checkPriceAlerts(tokenPrice); // Comment out if API mismatch
          }
        } catch (error) {
          console.warn(`Failed to check price alerts for ${tokenPrice.symbol}:`, error);
        }
      });
    }
  }, [realTimePrices]);

  // Subscribe to price updates for notifications - commented out to prevent circular dependencies
  /*
  useEffect(() => {
    const unsubscribe = subscribeToPriceUpdates((symbol, oldPrice, newPrice) => {
      // Send price change notification if significant
      const changePercent = Math.abs((newPrice - oldPrice) / oldPrice) * 100;
      if (changePercent >= 5) { // 5% change threshold
        notificationService.sendNotification({
          title: 'Giá thay đổi đáng kể',
          message: `${symbol}: ${oldPrice.toFixed(4)} → ${newPrice.toFixed(4)} (${changePercent.toFixed(1)}%)`,
          type: 'price',
          priority: changePercent >= 10 ? 'high' : 'medium',
        });
      }
    });

    return unsubscribe;
  }, [subscribeToPriceUpdates]);
  */



  // Get wallet address for a specific chain
  const getWalletAddress = useCallback(async (chainId: string): Promise<string | null> => {
    try {
      if (!authenticated) return null;

      const connection = walletState.connections[chainId];
      if (!connection?.isConnected) return null;

      return connection.address || null;
    } catch (error) {
      console.error('Failed to get wallet address:', error);
      return null;
    }
  }, [authenticated, walletState.connections]);

  // Connect to a specific chain
  const connectWallet = useCallback(async (chainId: string) => {
    if (!authenticated) {
      setWalletState(prev => ({ ...prev, error: 'Please authenticate first' }));
      return;
    }

    setWalletState(prev => ({
      ...prev,
      isLoading: true,
      error: undefined,
      connections: {
        ...prev.connections,
        [chainId]: {
          isConnected: false,
          isConnecting: true,
        }
      }
    }));

    try {
      const chain = SUPPORTED_CHAINS[chainId as SupportedChain];
      if (!chain) {
        throw new Error(`Unsupported chain: ${chainId}`);
      }

      // Use wagmi to connect wallet
      const wagmiChainId = CHAIN_ID_MAPPING[chainId as SupportedChain];

      if (wagmiChainId) {
        // Connect using MetaMask (injected) by default
        await connect({ connector: injected() });

        // Switch to the correct chain if needed
        if (chain && switchChain) {
          await switchChain({ chainId: wagmiChainId });
        }
      } else {
        // For non-EVM chains like Algorand, use custom connection logic
        console.warn(`Custom connection logic needed for ${chainId}`);

        // For now, we'll simulate connection for non-EVM chains
        const mockAddresses: Record<string, string> = {
          algorand: 'ALGO567890123456789012345678901234567890123456789012345',
        };

        setWalletState(prev => ({
          ...prev,
          connections: {
            ...prev.connections,
            [chainId]: {
              isConnected: true,
              isConnecting: false,
              address: mockAddresses[chainId],
              chainId,
            }
          },
          currentChain: chainId,
          isLoading: false,
        }));

        // Save connection
        connectionStorage.saveConnection(chainId, mockAddresses[chainId]);

        // Fetch balances for the newly connected chain - use setTimeout to avoid circular calls
        setTimeout(() => {
          fetchBalances(chainId, mockAddresses[chainId]);
        }, 100);
      }
    } catch (error) {
      setWalletState(prev => ({
        ...prev,
        connections: {
          ...prev.connections,
          [chainId]: {
            isConnected: false,
            isConnecting: false,
            error: error instanceof Error ? error.message : 'Connection failed',
          }
        },
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to connect wallet',
      }));
    }
  }, [authenticated, connect, switchChain]);

  // Disconnect from a specific chain
  const disconnectWallet = useCallback(async (chainId: string) => {
    // Remove from storage
    connectionStorage.removeConnection(chainId);

    setWalletState(prev => {
      const newConnections = { ...prev.connections };
      delete newConnections[chainId];

      const newBalances = { ...prev.balances };
      delete newBalances[chainId];

      const newTransactions = { ...prev.transactions };
      delete newTransactions[chainId];

      return {
        ...prev,
        connections: newConnections,
        currentChain: prev.currentChain === chainId ? null : prev.currentChain,
        balances: newBalances,
        transactions: newTransactions,
      };
    });
  }, []);

  // Switch to a different network
  const switchNetwork = useCallback(async (chainId: string) => {
    const chain = SUPPORTED_CHAINS[chainId as SupportedChain];
    if (!chain) {
      setWalletState(prev => ({ ...prev, error: `Unsupported chain: ${chainId}` }));
      return;
    }

    // Check if already connected to this chain
    const connection = walletState.connections[chainId];
    if (!connection?.isConnected) {
      // Use setTimeout to prevent synchronous chain
      setTimeout(() => {
        connectWallet(chainId);
      }, 0);
      return;
    }

    setWalletState(prev => ({
      ...prev,
      currentChain: chainId,
    }));
  }, [walletState.connections, connectWallet]);



  // Refresh balances for all connected chains
  const refreshBalances = useCallback(async () => {
    if (!address) return;

    const connectedChainIds = Object.keys(walletState.connections).filter(
      chainId => walletState.connections[chainId].isConnected
    );
    
    // Use setTimeout to prevent synchronous batch calls
    connectedChainIds.forEach((chainId, index) => {
      const connection = walletState.connections[chainId];
      setTimeout(() => {
        fetchBalances(chainId, connection?.address || address);
      }, index * 100); // Stagger the calls
    });
  }, [address, walletState.connections, fetchBalances]);

  // Estimate gas fees for a transaction
  const estimateGasFees = useCallback(async (chainId: string, transaction: any) => {
    try {
      const wagmiChainId = CHAIN_ID_MAPPING[chainId as SupportedChain];

      if (wagmiChainId) {
        // Mock gas estimation for EVM chains (replace with real implementation)
        return {
          slow: { gasPrice: '20', maxFeePerGas: '20', maxPriorityFeePerGas: '1', estimatedTime: 300 },
          standard: { gasPrice: '25', maxFeePerGas: '25', maxPriorityFeePerGas: '2', estimatedTime: 180 },
          fast: { gasPrice: '30', maxFeePerGas: '30', maxPriorityFeePerGas: '3', estimatedTime: 60 },
        };
      } else {
        // Mock gas estimation for non-EVM chains
        const mockGasFees = {
          algorand: {
            slow: { gasPrice: '0.001', maxFeePerGas: '0.001', maxPriorityFeePerGas: '0', estimatedTime: 300 },
            standard: { gasPrice: '0.001', maxFeePerGas: '0.001', maxPriorityFeePerGas: '0', estimatedTime: 180 },
            fast: { gasPrice: '0.001', maxFeePerGas: '0.001', maxPriorityFeePerGas: '0', estimatedTime: 60 },
          },
        };

        return mockGasFees[chainId as keyof typeof mockGasFees] || {
          slow: { gasPrice: '1', maxFeePerGas: '1', maxPriorityFeePerGas: '0', estimatedTime: 300 },
          standard: { gasPrice: '1', maxFeePerGas: '1', maxPriorityFeePerGas: '0', estimatedTime: 180 },
          fast: { gasPrice: '1', maxFeePerGas: '1', maxPriorityFeePerGas: '0', estimatedTime: 60 },
        };
      }
    } catch (error) {
      console.error('Failed to estimate gas fees:', error);
      throw error;
    }
  }, []);

  // Get network status
  const getNetworkStatus = useCallback(async (chainId: string) => {
    try {
      const wagmiChainId = CHAIN_ID_MAPPING[chainId as SupportedChain];

      if (wagmiChainId) {
        // Mock network status for EVM chains (replace with real implementation)
        return {
          blockNumber: Math.floor(Math.random() * 1000000) + 18000000,
          gasPrice: '25',
          networkCongestion: 'medium' as const,
          lastBlockTime: Date.now() - 12000,
        };
      } else {
        // Mock network status for non-EVM chains
        const mockStatus = {
          algorand: {
            blockNumber: 35000000,
            gasPrice: '0.001',
            networkCongestion: 'low' as const,
            lastBlockTime: Date.now() - 4000,
          },
        };

        return mockStatus[chainId as keyof typeof mockStatus] || {
          blockNumber: 1000000,
          gasPrice: '1',
          networkCongestion: 'medium' as const,
          lastBlockTime: Date.now() - 10000,
        };
      }
    } catch (error) {
      console.error('Failed to get network status:', error);
      throw error;
    }
  }, []);



  // Transaction management functions
  const addTransaction = useCallback((transaction: Transaction) => {
    setWalletState(prev => ({
      ...prev,
      transactions: {
        ...prev.transactions,
        [transaction.chainId]: [
          ...(prev.transactions[transaction.chainId] || []),
          transaction
        ]
      }
    }));

    // Save to storage
    try {
      transactionStorage.addTransaction(transaction.chainId, transaction);
    } catch (error) {
      console.warn('Failed to save transaction to storage:', error);
    }
  }, []);

  const updateTransactionStatus = useCallback((chainId: string, hash: string, status: Transaction['status']) => {
    setWalletState(prev => ({
      ...prev,
      transactions: {
        ...prev.transactions,
        [chainId]: prev.transactions[chainId]?.map(tx =>
          tx.hash === hash ? { ...tx, status } : tx
        ) || []
      }
    }));

    // Update in storage
    transactionStorage.updateTransactionStatus(chainId, hash, status);
  }, []);

  // Smart contract interaction functions
  const callContract = useCallback(async (contractCall: ContractCall, gasUrgency: 'low' | 'medium' | 'high' = 'medium'): Promise<Transaction> => {
    try {
      const currentChainId = walletState.currentChain || 'ethereum';
      const connection = walletState.connections[currentChainId];

      if (!connection?.isConnected || !connection.address) {
        throw new Error('Wallet not connected');
      }

      // Mock contract call with delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Create transaction with mock gas settings
      const transaction: Transaction = {
        hash: `0x${Math.random().toString(16).substr(2, 64)}`,
        chainId: currentChainId,
        from: connection.address,
        to: contractCall.address,
        value: contractCall.value || '0',
        gasPrice: contractCall.gasPrice || '25',
        gasLimit: contractCall.gasLimit || '21000',
        nonce: Math.floor(Math.random() * 1000),
        status: 'pending',
        type: 'contract_interaction',
        timestamp: Date.now(),
      };

      // Add transaction to state and storage
      addTransaction(transaction);

      return transaction;
    } catch (error) {
      console.error('Contract call failed:', error);
      throw error;
    }
  }, [walletState.currentChain, walletState.connections, addTransaction]);

  const readContract = useCallback(async (chainId: string, contractAddress: string, abi: any[], functionName: string, args: any[] = []): Promise<any> => {
    try {
      // Mock contract read
      await new Promise(resolve => setTimeout(resolve, 500));

      // Return mock data based on function name
      const mockData = {
        balanceOf: '1000000000000000000', // 1 token
        totalSupply: '1000000000000000000000000', // 1M tokens
        name: 'Mock Token',
        symbol: 'MOCK',
        decimals: 18,
      };

      return mockData[functionName as keyof typeof mockData] || '0';
    } catch (error) {
      console.error('Contract read failed:', error);
      throw error;
    }
  }, []);

  const getTransactionReceipt = useCallback(async (chainId: string, txHash: string): Promise<any> => {
    try {
      // Mock transaction receipt
      await new Promise(resolve => setTimeout(resolve, 300));

      return {
        transactionHash: txHash,
        blockNumber: Math.floor(Math.random() * 1000000) + 18000000,
        blockHash: `0x${Math.random().toString(16).substr(2, 64)}`,
        gasUsed: '21000',
        status: 'success',
        logs: [],
      };
    } catch (error) {
      console.error('Failed to get transaction receipt:', error);
      throw error;
    }
  }, []);

  const getContractEvents = useCallback(async (chainId: string, contractAddress: string, abi: any[], eventName: string, fromBlock: number = 0, toBlock: number | string = 'latest'): Promise<ContractEvent[]> => {
    try {
      // Mock contract events
      await new Promise(resolve => setTimeout(resolve, 500));

      return [
        {
          address: contractAddress,
          topics: [`0x${Math.random().toString(16).substr(2, 64)}`],
          data: `0x${Math.random().toString(16).substr(2, 128)}`,
          blockNumber: Math.floor(Math.random() * 1000) + 18000000,
          transactionHash: `0x${Math.random().toString(16).substr(2, 64)}`,
          transactionIndex: 0,
          blockHash: `0x${Math.random().toString(16).substr(2, 64)}`,
          logIndex: 0,
          removed: false,
        },
      ];
    } catch (error) {
      console.error('Failed to get contract events:', error);
      throw error;
    }
  }, []);

  // Settings management functions
  const updateSettings = useCallback((updates: Partial<typeof settings>) => {
    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);
    walletStorage.updateSettings(updates);
  }, [settings]);

  const resetSettings = useCallback(() => {
    const defaultSettings = walletStorage.getSettings();
    setSettings(defaultSettings);
    walletStorage.resetSettings();
  }, []);

  // Get connected chains - memoized to prevent re-computation
  const connectedChains = useMemo(() => {
    return Object.keys(walletState.connections)
      .filter(chainId => walletState.connections[chainId].isConnected)
      .map(chainId => SUPPORTED_CHAINS[chainId as SupportedChain])
      .filter(Boolean);
  }, [walletState.connections]);

  const currentChain = useMemo(() => {
    return walletState.currentChain ? SUPPORTED_CHAINS[walletState.currentChain as SupportedChain] : null;
  }, [walletState.currentChain]);

  return {
    // State
    connectedChains,
    currentChain,
    balances: walletState.balances,
    transactions: walletState.transactions,
    connections: walletState.connections,
    isLoading: walletState.isLoading,
    error: walletState.error,
    settings,
    prices,

    // Real-time price data
    realTimePrices,
    pricesLoading,
    pricesError,

    // Chain info
    supportedChains: Object.values(SUPPORTED_CHAINS),

    // Actions
    connectWallet,
    disconnectWallet,
    switchNetwork,
    getWalletAddress,
    fetchBalances,
    refreshBalances,
    estimateGasFees,
    getNetworkStatus,

    // Settings management
    updateSettings,
    resetSettings,

    // Transaction management
    addTransaction,
    updateTransactionStatus,

    // Contract interactions
    callContract,
    readContract,
    getTransactionReceipt,
    getContractEvents,

    // Real-time price management
    addTokens: addTokensStable,
    startUpdates: startUpdates,
    stopUpdates: stopUpdates,
    subscribeToPriceUpdates,

    // Notification service
    notificationService,
  };
}