'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'
import { 
  Github, 
  Twitter, 
  Linkedin, 
  Mail, 
  Shield, 
  FileText, 
  HelpCircle,
  ExternalLink
} from 'lucide-react'

interface FooterProps {
  className?: string
}

interface FooterLink {
  href: string
  label: string
  external?: boolean
}

interface FooterSection {
  title: string
  links: FooterLink[]
}

/**
 * Application footer component
 * Provides site-wide footer with links, social media, and company information
 */
export function Footer({ className }: FooterProps) {
  /**
   * Footer navigation sections
   */
  const footerSections: FooterSection[] = [
    {
      title: 'Platform',
      links: [
        { href: '/assets', label: 'Marketplace' },
        { href: '/portfolio', label: 'Portfolio' },
        { href: '/trading', label: 'Trading' },
        { href: '/vaults', label: 'Vaults' }
      ]
    },
    {
      title: 'Resources',
      links: [
        { href: '/docs', label: 'Documentation', external: true },
        { href: '/api', label: 'API Reference', external: true },
        { href: '/help', label: 'Help Center' },
        { href: '/blog', label: 'Blog', external: true }
      ]
    },
    {
      title: 'Legal',
      links: [
        { href: '/privacy', label: 'Privacy Policy' },
        { href: '/terms', label: 'Terms of Service' },
        { href: '/compliance', label: 'Compliance' },
        { href: '/security', label: 'Security' }
      ]
    },
    {
      title: 'Support',
      links: [
        { href: '/contact', label: 'Contact Us' },
        { href: '/support', label: 'Support Center' },
        { href: '/status', label: 'System Status', external: true },
        { href: '/feedback', label: 'Feedback' }
      ]
    }
  ]

  /**
   * Social media links
   */
  const socialLinks = [
    {
      href: 'https://github.com/rwa-platform',
      label: 'GitHub',
      icon: Github
    },
    {
      href: 'https://twitter.com/rwa_platform',
      label: 'Twitter',
      icon: Twitter
    },
    {
      href: 'https://linkedin.com/company/rwa-platform',
      label: 'LinkedIn',
      icon: Linkedin
    },
    {
      href: 'mailto:contact@rwa-platform.com',
      label: 'Email',
      icon: Mail
    }
  ]

  /**
   * Current year for copyright
   */
  const currentYear = new Date().getFullYear()

  return (
    <footer className={cn(
      'bg-slate-900 border-t border-slate-800 text-slate-300',
      className
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8">
            {/* Brand Section */}
            <div className="lg:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">RWA</span>
                </div>
                <span className="font-semibold text-lg text-white">Platform</span>
              </div>
              <p className="text-slate-400 mb-6 max-w-md">
                The leading platform for Real World Asset tokenization. 
                Democratizing access to premium assets through blockchain technology.
              </p>
              
              {/* Social Links */}
              <div className="flex space-x-4">
                {socialLinks.map((social) => {
                  const Icon = social.icon
                  return (
                    <Link
                      key={social.label}
                      href={social.href}
                      className="text-slate-400 hover:text-white transition-colors"
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={social.label}
                    >
                      <Icon className="h-5 w-5" />
                    </Link>
                  )
                })}
              </div>
            </div>

            {/* Footer Sections */}
            {footerSections.map((section) => (
              <div key={section.title} className="lg:col-span-1">
                <h3 className="text-white font-semibold mb-4">{section.title}</h3>
                <ul className="space-y-3">
                  {section.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-slate-400 hover:text-white transition-colors flex items-center group"
                        target={link.external ? '_blank' : undefined}
                        rel={link.external ? 'noopener noreferrer' : undefined}
                      >
                        {link.label}
                        {link.external && (
                          <ExternalLink className="h-3 w-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Security & Trust Indicators */}
        <div className="py-6 border-t border-slate-800">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2 text-sm text-slate-400">
                <Shield className="h-4 w-4 text-green-400" />
                <span>SOC 2 Compliant</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-slate-400">
                <FileText className="h-4 w-4 text-blue-400" />
                <span>SEC Registered</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-slate-400">
                <HelpCircle className="h-4 w-4 text-purple-400" />
                <span>24/7 Support</span>
              </div>
            </div>
            
            <div className="text-sm text-slate-400">
              <span>Uptime: </span>
              <span className="text-green-400 font-medium">99.9%</span>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="py-6 border-t border-slate-800">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
            <div className="text-sm text-slate-400">
              © {currentYear} RWA Platform. All rights reserved.
            </div>
            
            <div className="flex items-center space-x-6 text-sm text-slate-400">
              <Link href="/privacy" className="hover:text-white transition-colors">
                Privacy
              </Link>
              <Link href="/terms" className="hover:text-white transition-colors">
                Terms
              </Link>
              <Link href="/cookies" className="hover:text-white transition-colors">
                Cookies
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}