import { Suspense } from 'react'
import dynamic from 'next/dynamic'
import { LoadingSpinner } from './loading-spinner'

/**
 * Dynamic import for Chart.js components
 * Uses Next.js dynamic imports instead of React.lazy
 */
export const DynamicChart = dynamic(
  () => import('../charts/chart-wrapper'),
  { 
    loading: () => <div className="h-64 bg-slate-800/50 rounded-lg animate-pulse" />,
    ssr: false
  }
)

/**
 * Dynamic import for Three.js 3D components
 * Uses Next.js dynamic imports instead of React.lazy
 */
export const Dynamic3DViewer = dynamic(
  () => import('../3d/asset-3d-viewer'),
  { 
    loading: () => (
      <div className="h-96 bg-slate-800/50 rounded-lg animate-pulse flex items-center justify-center">
        <div className="text-slate-400">Loading 3D viewer...</div>
      </div>
    ),
    ssr: false
  }
)

/**
 * Dynamic import for heavy animation components
 * Uses Next.js dynamic imports instead of React.lazy
 */
export const DynamicAnimatedComponent = dynamic(
  () => import('../animations/animated-wrapper'),
  { 
    loading: () => <div className="animate-pulse bg-slate-800/50 rounded-lg" />,
    ssr: false
  }
)

/**
 * Legacy function for backwards compatibility
 * Use Next.js dynamic() instead for new components
 */
export function createDynamicComponent<T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  fallback?: React.ReactNode
) {
  return dynamic(importFn as any, {
    loading: () => (fallback || <LoadingSpinner />) as React.ReactElement,
    ssr: false
  })
}