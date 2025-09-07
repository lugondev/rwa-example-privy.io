'use client'

import { usePrivy } from '@privy-io/react-auth';
import { useEffect, useState } from 'react';

/**
 * Dynamic Connect Wallet Button component that handles Privy authentication
 * Uses client-side only rendering to avoid hydration issues
 */
export default function DynamicConnectButton() {
  const [mounted, setMounted] = useState(false);
  const { ready, authenticated, login, logout, user } = usePrivy();

  // Ensure component only renders on client side
  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render anything until mounted and Privy is ready
  if (!mounted || !ready) {
    return (
      <button 
        disabled 
        className="px-6 py-3 bg-gray-400 text-white rounded-lg cursor-not-allowed"
      >
        Loading...
      </button>
    );
  }

  // Handle login/logout actions
  const handleClick = () => {
    if (authenticated) {
      logout();
    } else {
      login();
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <button
        onClick={handleClick}
        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
      >
        {authenticated ? 'Disconnect Wallet' : 'Connect Wallet'}
      </button>
      
      {authenticated && user && (
        <div className="text-sm text-gray-600">
          <p>Connected: {user.wallet?.address || 'Unknown'}</p>
        </div>
      )}
    </div>
  );
}