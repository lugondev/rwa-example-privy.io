'use client';

import { useState } from 'react';

/**
 * Simple wallet connect button for testing
 * Does not use any external libraries
 */
export default function SimpleWalletButton() {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState('');

  const handleConnect = async () => {
    try {
      // Check if MetaMask is installed
      if (typeof window !== 'undefined' && (window as any).ethereum) {
        // Request account access
        const accounts = await (window as any).ethereum.request({
          method: 'eth_requestAccounts',
        });
        
        if (accounts.length > 0) {
          setAddress(accounts[0]);
          setIsConnected(true);
        }
      } else {
        alert('MetaMask is not installed. Please install MetaMask to connect your wallet.');
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      alert('Failed to connect wallet');
    }
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    setAddress('');
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      {!isConnected ? (
        <button
          onClick={handleConnect}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors"
        >
          Connect Wallet
        </button>
      ) : (
        <div className="text-center">
          <p className="text-green-600 font-semibold mb-2">Wallet Connected!</p>
          <p className="text-sm text-gray-600 mb-4">
            {address.slice(0, 6)}...{address.slice(-4)}
          </p>
          <button
            onClick={handleDisconnect}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition-colors"
          >
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
}