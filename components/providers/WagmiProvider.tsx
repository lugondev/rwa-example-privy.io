'use client';

import React from 'react';
import { WagmiProvider as WagmiProviderBase } from 'wagmi';
import { config } from '@/lib/web3-providers';

interface WagmiProviderProps {
  children: React.ReactNode;
}

/**
 * Wagmi provider component that wraps the app with Web3 functionality
 * Provides wagmi config for blockchain interactions
 * Note: QueryClient is provided by parent component
 */
export function WagmiProvider({ children }: WagmiProviderProps) {
  return (
    <WagmiProviderBase config={config}>
      {children}
    </WagmiProviderBase>
  );
}

export default WagmiProvider;