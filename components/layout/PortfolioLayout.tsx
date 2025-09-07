'use client'

import { AppLayout } from './AppLayout'
import { PortfolioSidebar } from '@/components/portfolio/PortfolioSidebar'
import { cn } from '@/lib/utils'

interface PortfolioLayoutProps {
  children: React.ReactNode
  className?: string
}

/**
 * Portfolio-specific layout wrapper
 * Integrates portfolio sidebar with main app layout
 */
export function PortfolioLayout({ children, className }: PortfolioLayoutProps) {
  return (
    <AppLayout
      requireAuth={true}
      showSidebar={true}
      sidebarContent={<PortfolioSidebar />}
      className={cn('bg-slate-950', className)}
    >
      <div className="min-h-screen">
        {children}
      </div>
    </AppLayout>
  )
}