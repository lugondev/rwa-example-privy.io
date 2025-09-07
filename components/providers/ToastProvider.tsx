'use client'

import { Toaster } from 'react-hot-toast'

/**
 * Toast Provider component that provides global toast notifications
 * Uses react-hot-toast for consistent toast styling and behavior
 */
export function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        // Default options for all toasts
        duration: 4000,
        style: {
          background: '#1e293b', // slate-800
          color: '#f8fafc', // slate-50
          border: '1px solid #334155', // slate-700
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: '500',
        },
        // Success toast styling
        success: {
          duration: 3000,
          style: {
            background: '#064e3b', // emerald-900
            color: '#d1fae5', // emerald-100
            border: '1px solid #059669', // emerald-600
          },
          iconTheme: {
            primary: '#10b981', // emerald-500
            secondary: '#d1fae5', // emerald-100
          },
        },
        // Error toast styling
        error: {
          duration: 5000,
          style: {
            background: '#7f1d1d', // red-900
            color: '#fecaca', // red-200
            border: '1px solid #dc2626', // red-600
          },
          iconTheme: {
            primary: '#ef4444', // red-500
            secondary: '#fecaca', // red-200
          },
        },
        // Loading toast styling
        loading: {
          style: {
            background: '#1e3a8a', // blue-900
            color: '#dbeafe', // blue-100
            border: '1px solid #2563eb', // blue-600
          },
        },
      }}
    />
  )
}