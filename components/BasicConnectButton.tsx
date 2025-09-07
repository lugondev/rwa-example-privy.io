'use client';

import { usePrivy } from '@privy-io/react-auth';
import { useEffect, useState } from 'react';

/**
 * Basic Connect Wallet button component without complex wrappers
 * Handles wallet connection using Privy authentication
 */
export default function BasicConnectButton() {
  const [mounted, setMounted] = useState(false);
  const { ready, authenticated, login, logout, user } = usePrivy();

  // Ensure component is mounted before rendering
  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render anything until mounted and Privy is ready
  if (!mounted || !ready) {
    return (
      <div className="px-6 py-3 bg-gray-200 text-gray-500 rounded-lg">
        Loading...
      </div>
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
        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
      >
        {authenticated ? 'Disconnect Wallet' : 'Connect Wallet'}
      </button>
      
      {authenticated && user && (
        <div className="text-sm text-gray-600">
          Connected: {user.wallet?.address || 'Unknown'}
        </div>
      )}
    </div>
  );
}