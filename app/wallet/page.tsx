'use client';

import React from 'react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { SimpleWalletDashboard } from '@/components/wallet/SimpleWalletDashboard';
import { SEOHead } from '@/components/seo/SEOHead';

/**
 * Wallet page component that displays the simple wallet dashboard
 * Protected by authentication guard to ensure only authenticated users can access
 */
export default function WalletPage() {
  return (
    <>
      <SEOHead 
        title="Wallet - Thông Tin Ví"
        description="Xem và quản lý thông tin ví cơ bản của bạn."
        keywords="wallet, ví, cryptocurrency, blockchain, thông tin ví"
      />
      
      <AuthGuard>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
          <div className="container mx-auto px-4 py-8">
            <SimpleWalletDashboard />
          </div>
        </div>
      </AuthGuard>
    </>
  );
}