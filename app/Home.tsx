'use client'

import { useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { Wallet, TrendingUp, Shield, Globe, Zap, Users } from 'lucide-react';

/**
 * Home page component that displays the RWA Marketplace overview
 */
export default function Home() {
  const { authenticated, login } = usePrivy();

  // Hero section for unauthenticated users
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        {/* Header */}
        <header className="border-b bg-white/80 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Globe className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900">RWA Marketplace</span>
            </div>
            <Button onClick={login} className="bg-blue-600 hover:bg-blue-700">
              <Wallet className="h-4 w-4 mr-2" />
              Connect Wallet
            </Button>
          </div>
        </header>

        {/* Hero Section */}
        <section className="container mx-auto px-4 py-20 text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              Trade Real-World Assets
              <span className="text-blue-600"> On Blockchain</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Discover, invest, and trade tokenized real-world assets on a secure, 
              decentralized platform. From real estate to commodities, access global markets 
              with the power of blockchain technology.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={login} className="bg-blue-600 hover:bg-blue-700">
                <Wallet className="h-5 w-5 mr-2" />
                Get Started
              </Button>
              <Button size="lg" variant="outline">
                Learn More
              </Button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="container mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose RWA Marketplace?</h2>
            <p className="text-lg text-gray-600">Built for the future of tokenized assets</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center p-6 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle>Secure & Transparent</CardTitle>
                <CardDescription>
                  All transactions are secured by blockchain technology with full transparency and immutable records.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="text-center p-6 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
                <CardTitle>Global Access</CardTitle>
                <CardDescription>
                  Access global real-world asset markets 24/7 from anywhere in the world with just a few clicks.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="text-center p-6 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <Zap className="h-6 w-6 text-purple-600" />
                </div>
                <CardTitle>Fast & Efficient</CardTitle>
                <CardDescription>
                  Trade assets instantly with low fees and fast settlement times powered by modern blockchain infrastructure.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </section>

        {/* Stats Section */}
        <section className="bg-gray-50 py-16">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-3xl font-bold text-blue-600 mb-2">$50M+</div>
                <div className="text-gray-600">Total Value Locked</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-green-600 mb-2">10K+</div>
                <div className="text-gray-600">Active Users</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-purple-600 mb-2">500+</div>
                <div className="text-gray-600">Listed Assets</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-orange-600 mb-2">99.9%</div>
                <div className="text-gray-600">Uptime</div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto px-4 py-20 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Ready to Start Trading?
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              Join thousands of users who are already trading real-world assets on our platform.
            </p>
            <Button size="lg" onClick={login} className="bg-blue-600 hover:bg-blue-700">
              <Wallet className="h-5 w-5 mr-2" />
              Connect Your Wallet
            </Button>
          </div>
        </section>
      </div>
    );
  }

  // Authenticated user dashboard
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Welcome to RWA Marketplace
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Manage your tokenized real-world assets
            </p>
          </div>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Portfolio Value</CardTitle>
                <div className="text-2xl font-bold">$0.00</div>
              </CardHeader>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Assets</CardTitle>
                <div className="text-2xl font-bold">0</div>
              </CardHeader>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">24h Change</CardTitle>
                <div className="text-2xl font-bold text-green-500">+0.00%</div>
              </CardHeader>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Active Positions</CardTitle>
                <div className="text-2xl font-bold">0</div>
              </CardHeader>
            </Card>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Asset Portfolio</CardTitle>
                  <CardDescription>
                    Your tokenized real-world assets overview
                  </CardDescription>
                </CardHeader>
                <div className="p-6">
                  <div className="text-center py-12">
                    <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Assets Yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Start by exploring available assets in the marketplace.
                    </p>
                    <Button>Explore Marketplace</Button>
                  </div>
                </div>
              </Card>
            </div>
            
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <div className="p-6">
                  <div className="text-center py-8">
                    <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No recent activity</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}