import toast from 'react-hot-toast'

/**
 * Custom hook for toast notifications with predefined styles and messages
 * Provides consistent toast behavior across the application
 */
export const useToast = () => {
  const showSuccess = (message: string) => {
    toast.success(message)
  }

  const showError = (message: string) => {
    toast.error(message)
  }

  const showLoading = (message: string) => {
    return toast.loading(message)
  }

  const showInfo = (message: string) => {
    toast(message, {
      icon: 'ℹ️',
      style: {
        background: '#1e40af', // blue-800
        color: '#dbeafe', // blue-100
        border: '1px solid #3b82f6', // blue-500
      },
    })
  }

  const showWarning = (message: string) => {
    toast(message, {
      icon: '⚠️',
      style: {
        background: '#92400e', // amber-800
        color: '#fef3c7', // amber-100
        border: '1px solid #f59e0b', // amber-500
      },
    })
  }

  const dismiss = (toastId?: string) => {
    if (toastId) {
      toast.dismiss(toastId)
    } else {
      toast.dismiss()
    }
  }

  const promise = <T,>(
    promise: Promise<T>,
    messages: {
      loading: string
      success: string | ((data: T) => string)
      error: string | ((error: any) => string)
    }
  ) => {
    return toast.promise(promise, messages)
  }

  // Predefined messages for common operations
  const messages = {
    // Authentication
    auth: {
      loginSuccess: 'Successfully connected wallet!',
      loginError: 'Failed to connect wallet. Please try again.',
      logoutSuccess: 'Wallet disconnected successfully.',
      logoutError: 'Failed to disconnect wallet.',
    },
    // Asset operations
    asset: {
      createSuccess: 'Asset created successfully!',
      createError: 'Failed to create asset. Please try again.',
      updateSuccess: 'Asset updated successfully!',
      updateError: 'Failed to update asset.',
      deleteSuccess: 'Asset deleted successfully!',
      deleteError: 'Failed to delete asset.',
      purchaseSuccess: 'Asset purchased successfully!',
      purchaseError: 'Failed to purchase asset.',
    },
    // Portfolio operations
    portfolio: {
      refreshSuccess: 'Portfolio refreshed successfully!',
      refreshError: 'Failed to refresh portfolio.',
      loadError: 'Failed to load portfolio data.',
    },
    // Vault operations
    vault: {
      createSuccess: 'Vault created successfully!',
      createError: 'Failed to create vault.',
      investSuccess: 'Investment successful!',
      investError: 'Failed to process investment.',
      withdrawSuccess: 'Withdrawal successful!',
      withdrawError: 'Failed to process withdrawal.',
    },
    // Lending operations
    lending: {
      lendSuccess: 'Lending position created successfully!',
      lendError: 'Failed to create lending position.',
      borrowSuccess: 'Borrowing successful!',
      borrowError: 'Failed to process borrowing.',
      repaySuccess: 'Loan repaid successfully!',
      repayError: 'Failed to repay loan.',
    },
    // General operations
    general: {
      saveSuccess: 'Changes saved successfully!',
      saveError: 'Failed to save changes.',
      loadError: 'Failed to load data.',
      networkError: 'Network error. Please check your connection.',
      unexpectedError: 'An unexpected error occurred.',
    },
  }

  return {
    showSuccess,
    showError,
    showLoading,
    showInfo,
    showWarning,
    dismiss,
    promise,
    messages,
  }
}