'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { 
  BarChart3, 
  Wallet, 
  History, 
  TrendingUp, 
  Settings, 
  ChevronLeft,
  ChevronRight,
  PieChart,
  DollarSign
} from 'lucide-react'

interface PortfolioSidebarProps {
  className?: string
}

interface SidebarItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  description: string
}

/**
 * Portfolio sidebar navigation component
 * Provides navigation for different portfolio sections with collapsible design
 */
export function PortfolioSidebar({ className }: PortfolioSidebarProps) {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)

  /**
   * Portfolio navigation items
   */
  const sidebarItems: SidebarItem[] = [
    {
      href: '/portfolio',
      label: 'Overview',
      icon: PieChart,
      description: 'Portfolio summary and performance'
    },
    {
      href: '/portfolio/assets',
      label: 'Assets',
      icon: Wallet,
      description: 'View and manage your assets'
    },
    {
      href: '/portfolio/transactions',
      label: 'Transactions',
      icon: History,
      description: 'Transaction history and details'
    },
    {
      href: '/portfolio/analytics',
      label: 'Analytics',
      icon: BarChart3,
      description: 'Performance analytics and insights'
    },
    {
      href: '/portfolio/performance',
      label: 'Performance',
      icon: TrendingUp,
      description: 'Track portfolio performance'
    },
    {
      href: '/portfolio/settings',
      label: 'Settings',
      icon: Settings,
      description: 'Portfolio preferences and settings'
    }
  ]

  /**
   * Check if current route is active
   */
  const isActiveRoute = (href: string) => {
    if (href === '/portfolio') {
      return pathname === '/portfolio'
    }
    return pathname.startsWith(href)
  }

  /**
   * Toggle sidebar collapse state
   */
  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed)
  }

  return (
    <div className={cn(
      'bg-slate-900/50 border-r border-slate-800 transition-all duration-300 flex flex-col',
      isCollapsed ? 'w-16' : 'w-64',
      className
    )}>
      {/* Header */}
      <div className="p-4 border-b border-slate-800">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center space-x-2">
              <DollarSign className="h-6 w-6 text-blue-400" />
              <h2 className="font-semibold text-white">Portfolio</h2>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleCollapse}
            className="text-slate-400 hover:text-white"
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 p-2">
        <ul className="space-y-1">
          {sidebarItems.map((item) => {
            const Icon = item.icon
            const isActive = isActiveRoute(item.href)

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors group',
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  )}
                  title={isCollapsed ? item.label : undefined}
                >
                  <Icon className={cn(
                    'h-5 w-5 flex-shrink-0',
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'
                  )} />
                  {!isCollapsed && (
                    <div className="flex-1 min-w-0">
                      <div className="font-medium">{item.label}</div>
                      <div className="text-xs text-slate-400 group-hover:text-slate-300 truncate">
                        {item.description}
                      </div>
                    </div>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Footer */}
      {!isCollapsed && (
        <div className="p-4 border-t border-slate-800">
          <div className="text-xs text-slate-400">
            <p>Portfolio Management</p>
            <p className="text-slate-500">v1.0.0</p>
          </div>
        </div>
      )}
    </div>
  )
}