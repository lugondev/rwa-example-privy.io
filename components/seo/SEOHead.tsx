'use client'

interface SEOHeadProps {
  title?: string
  description?: string
  keywords?: string
  image?: string
  url?: string
  type?: 'website' | 'article'
  noIndex?: boolean
}

/**
 * SEO component for managing meta tags across all pages
 * Note: In Next.js 13+ App Router, use metadata API in layout.tsx instead
 * This component is kept for compatibility but doesn't render anything
 */
function SEOHead(_props: SEOHeadProps) {
  // In App Router, SEO should be handled via metadata API in layout.tsx
  // This component is kept for compatibility but doesn't render anything
  return null
}

// Export both named and default exports for compatibility
export { SEOHead };
export default SEOHead;