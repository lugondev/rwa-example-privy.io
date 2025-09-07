'use client';

import React, { useState } from 'react';
import { useMultiChainWallet } from '@/hooks/useMultiChainWallet';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Wallet,
  TrendingUp,
  Zap,
  Activity,
  Settings,
  Plus,
  ArrowUpDown,
  BarChart3,
} from 'lucide-react';

// Import wallet components
import { MultiChainWalletModal } from './MultiChainWalletModal';
import { NetworkSwitcher } from './NetworkSwitcher';
import { CrossChainBridge } from './CrossChainBridge';
import { MultiChainPortfolio } from './MultiChainPortfolio';
import { GasFeeEstimator } from './GasFeeEstimator';
import { YieldFarmingOpportunities } from './YieldFarmingOpportunities';
import { NetworkStatusIndicator } from './NetworkStatusIndicator';
import WalletErrorBoundary, { useWalletErrorHandler } from './WalletErrorBoundary';

/**
 * Comprehensive multi-chain wallet dashboard component
 */
export function MultiChainWalletDashboard() {
  // Initialize wallet error handler
  useWalletErrorHandler();
  
  const { connectedChains, balances } = useMultiChainWallet();
  
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [activeTab, setActiveTab] = useState('portfolio');

  // Calculate total portfolio value
  const totalPortfolioValue = Object.values(balances).reduce((total, chainBalances) => {
    return total + Object.values(chainBalances).reduce((chainTotal, balance) => {
      return chainTotal + (balance.usdValue || 0);
    }, 0);
  }, 0);

  // Get connected chains count
  const connectedChainsCount = connectedChains.length;
  const totalAssets = Object.values(balances).reduce((total, chainBalances) => {
    return total + Object.keys(chainBalances).length;
  }, 0);

  return (
    <WalletErrorBoundary>
      <div className="space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-5 w-5" />
                  Multi-Chain Wallet Dashboard
                </CardTitle>
                <CardDescription>
                  Manage your assets across multiple blockchain networks
                </CardDescription>
              </div>
            
            <div className="flex items-center gap-2">
              {/* <NetworkStatusIndicator /> */}
              <NetworkSwitcher />
              <Button onClick={() => setShowWalletModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Connect Wallet
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-500">
                ${totalPortfolioValue.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">Total Portfolio Value</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold">
                {connectedChainsCount}
              </div>
              <div className="text-sm text-muted-foreground">Connected Networks</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold">
                {totalAssets}
              </div>
              <div className="text-sm text-muted-foreground">Total Assets</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-500">
                +12.5%
              </div>
              <div className="text-sm text-muted-foreground">24h Change</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="portfolio" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Portfolio
          </TabsTrigger>
          <TabsTrigger value="bridge" className="flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4" />
            Bridge
          </TabsTrigger>
          <TabsTrigger value="yield" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Yield
          </TabsTrigger>
          <TabsTrigger value="gas" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Gas Fees
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Activity
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="portfolio" className="space-y-6">
          <MultiChainPortfolio />
        </TabsContent>

        <TabsContent value="bridge" className="space-y-4">
          <CrossChainBridge />
        </TabsContent>

        <TabsContent value="yield" className="space-y-4">
          <YieldFarmingOpportunities />
        </TabsContent>

        <TabsContent value="gas" className="space-y-4">
          <GasFeeEstimator />
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Transaction Activity</CardTitle>
              <CardDescription>
                Recent transactions across all connected networks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Recent Activity</h3>
                <p className="text-muted-foreground mb-4">
                  Your transaction history will appear here once you start using the wallet.
                </p>
                <Button onClick={() => setActiveTab('bridge')}>
                  Start Trading
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Wallet Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Wallet Settings</CardTitle>
                <CardDescription>
                  Configure your multi-chain wallet preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Auto-connect to networks</div>
                    <div className="text-sm text-muted-foreground">
                      Automatically connect to supported networks
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Enable
                  </Button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Show small balances</div>
                    <div className="text-sm text-muted-foreground">
                      Display assets with value less than $1
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Hide
                  </Button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Gas price alerts</div>
                    <div className="text-sm text-muted-foreground">
                      Get notified when gas prices are optimal
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Enable
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Network Preferences */}
            <Card>
              <CardHeader>
                <CardTitle>Network Preferences</CardTitle>
                <CardDescription>
                  Customize your blockchain network settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="font-medium">Preferred Networks</div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="default">Ethereum</Badge>
                    <Badge variant="secondary">Polygon</Badge>
                    <Badge variant="secondary">Arbitrum</Badge>
                    <Badge variant="outline">Optimism</Badge>
                    <Badge variant="outline">XDC</Badge>
                    <Badge variant="outline">Algorand</Badge>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="font-medium">Default Gas Settings</div>
                  <div className="grid grid-cols-3 gap-2">
                    <Button variant="outline" size="sm">Slow</Button>
                    <Button variant="default" size="sm">Standard</Button>
                    <Button variant="outline" size="sm">Fast</Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="font-medium">RPC Endpoints</div>
                  <Button variant="outline" size="sm" className="w-full">
                    Manage Custom RPCs
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Security Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>
                  Protect your wallet with advanced security features
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Transaction signing</div>
                    <div className="text-sm text-muted-foreground">
                      Require confirmation for all transactions
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Required
                  </Button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Phishing protection</div>
                    <div className="text-sm text-muted-foreground">
                      Warn about suspicious websites and contracts
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Enabled
                  </Button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Auto-lock timer</div>
                    <div className="text-sm text-muted-foreground">
                      Automatically lock wallet after inactivity
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    15 min
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Advanced Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Advanced Settings</CardTitle>
                <CardDescription>
                  Developer and advanced user options
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Developer mode</div>
                    <div className="text-sm text-muted-foreground">
                      Enable advanced features and debugging
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Disabled
                  </Button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Custom tokens</div>
                    <div className="text-sm text-muted-foreground">
                      Automatically detect and add new tokens
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Auto-detect
                  </Button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Analytics</div>
                    <div className="text-sm text-muted-foreground">
                      Share anonymous usage data to improve the app
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Enabled
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Wallet Connection Modal */}
      <MultiChainWalletModal 
        isOpen={showWalletModal}
        onClose={() => setShowWalletModal(false)}
      />
      </div>
    </WalletErrorBoundary>
  );
}

export default MultiChainWalletDashboard;