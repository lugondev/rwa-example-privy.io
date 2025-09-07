import { ValidationResult, ValidationError } from './validation'

// Vault creation form data interface
export interface VaultFormData {
  name: string
  strategy: string
  description: string
  targetAmount: number
  maxInvestors: number
  minimumInvestment: number
  expectedReturn: number
  riskLevel: 'Low' | 'Medium' | 'High'
  endDate?: string
  [key: string]: unknown
}

/**
 * Validate vault creation form data
 * Ensures all required fields are present and valid
 */
export function validateVaultCreation(data: VaultFormData): ValidationResult {
  const errors: ValidationError[] = []

  // Validate vault name
  if (!data.name || data.name.trim().length === 0) {
    errors.push({
      field: 'name',
      message: 'Vault name is required'
    })
  } else if (data.name.trim().length < 3) {
    errors.push({
      field: 'name',
      message: 'Vault name must be at least 3 characters long'
    })
  } else if (data.name.trim().length > 100) {
    errors.push({
      field: 'name',
      message: 'Vault name must be less than 100 characters'
    })
  }

  // Validate strategy
  if (!data.strategy || data.strategy.trim().length === 0) {
    errors.push({
      field: 'strategy',
      message: 'Investment strategy is required'
    })
  } else if (data.strategy.trim().length < 10) {
    errors.push({
      field: 'strategy',
      message: 'Strategy description must be at least 10 characters long'
    })
  }

  // Validate description
  if (!data.description || data.description.trim().length === 0) {
    errors.push({
      field: 'description',
      message: 'Vault description is required'
    })
  } else if (data.description.trim().length < 20) {
    errors.push({
      field: 'description',
      message: 'Description must be at least 20 characters long'
    })
  } else if (data.description.trim().length > 1000) {
    errors.push({
      field: 'description',
      message: 'Description must be less than 1000 characters'
    })
  }

  // Validate target amount
  if (!data.targetAmount || data.targetAmount <= 0) {
    errors.push({
      field: 'targetAmount',
      message: 'Target amount must be greater than 0'
    })
  } else if (data.targetAmount < 1000) {
    errors.push({
      field: 'targetAmount',
      message: 'Target amount must be at least $1,000'
    })
  } else if (data.targetAmount > 100000000) {
    errors.push({
      field: 'targetAmount',
      message: 'Target amount cannot exceed $100,000,000'
    })
  }

  // Validate max investors
  if (!data.maxInvestors || data.maxInvestors <= 0) {
    errors.push({
      field: 'maxInvestors',
      message: 'Maximum investors must be greater than 0'
    })
  } else if (data.maxInvestors < 1) {
    errors.push({
      field: 'maxInvestors',
      message: 'Must allow at least 1 investor'
    })
  } else if (data.maxInvestors > 10000) {
    errors.push({
      field: 'maxInvestors',
      message: 'Maximum investors cannot exceed 10,000'
    })
  }

  // Validate minimum investment
  if (!data.minimumInvestment || data.minimumInvestment <= 0) {
    errors.push({
      field: 'minimumInvestment',
      message: 'Minimum investment must be greater than 0'
    })
  } else if (data.minimumInvestment < 100) {
    errors.push({
      field: 'minimumInvestment',
      message: 'Minimum investment must be at least $100'
    })
  } else if (data.minimumInvestment > data.targetAmount) {
    errors.push({
      field: 'minimumInvestment',
      message: 'Minimum investment cannot exceed target amount'
    })
  }

  // Validate expected return
  if (data.expectedReturn === undefined || data.expectedReturn === null) {
    errors.push({
      field: 'expectedReturn',
      message: 'Expected return is required'
    })
  } else if (data.expectedReturn < 0) {
    errors.push({
      field: 'expectedReturn',
      message: 'Expected return cannot be negative'
    })
  } else if (data.expectedReturn > 100) {
    errors.push({
      field: 'expectedReturn',
      message: 'Expected return cannot exceed 100%'
    })
  }

  // Validate risk level
  if (!data.riskLevel) {
    errors.push({
      field: 'riskLevel',
      message: 'Risk level is required'
    })
  } else if (!['low', 'medium', 'high'].includes(data.riskLevel)) {
    errors.push({
      field: 'riskLevel',
      message: 'Risk level must be low, medium, or high'
    })
  }

  // Validate end date (optional)
  if (data.endDate) {
    const endDate = new Date(data.endDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    if (isNaN(endDate.getTime())) {
      errors.push({
        field: 'endDate',
        message: 'Invalid end date format'
      })
    } else if (endDate <= today) {
      errors.push({
        field: 'endDate',
        message: 'End date must be in the future'
      })
    }
  }

  // Cross-field validations
  if (data.targetAmount && data.minimumInvestment && data.maxInvestors) {
    const maxPossibleRaise = data.minimumInvestment * data.maxInvestors
    if (maxPossibleRaise < data.targetAmount) {
      errors.push({
        field: 'maxInvestors',
        message: `With minimum investment of $${data.minimumInvestment.toLocaleString()}, you need at least ${Math.ceil(data.targetAmount / data.minimumInvestment)} investors to reach target`
      })
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Validate vault name availability (would typically check against API)
 */
export function validateVaultNameAvailability(name: string): Promise<boolean> {
  // This would typically make an API call to check name availability
  // For now, we'll simulate with a simple check
  return new Promise((resolve) => {
    setTimeout(() => {
      // Simulate some reserved names
      const reservedNames = ['admin', 'test', 'demo', 'system']
      resolve(!reservedNames.includes(name.toLowerCase()))
    }, 500)
  })
}

/**
 * Get risk level color for UI display
 */
export function getRiskLevelColor(riskLevel: string): string {
  switch (riskLevel) {
    case 'low':
      return 'text-green-600 bg-green-100'
    case 'medium':
      return 'text-yellow-600 bg-yellow-100'
    case 'high':
      return 'text-red-600 bg-red-100'
    default:
      return 'text-gray-600 bg-gray-100'
  }
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

/**
 * Format percentage for display
 */
export function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`
}