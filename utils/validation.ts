// Validation utilities for forms and user input

// Validation error type
export interface ValidationError {
  field: string
  message: string
}

// Validation result type
export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
}

// Validate required fields
export const validateRequired = (value: unknown, fieldName: string): string | null => {
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    return `${fieldName} is required`
  }
  return null
}

// Validate string length
export const validateLength = (value: string, min: number, max: number, fieldName: string): string | null => {
  if (value.length < min) {
    return `${fieldName} must be at least ${min} characters`
  }
  if (value.length > max) {
    return `${fieldName} must be no more than ${max} characters`
  }
  return null
}

// Validate positive numbers
export const validatePositiveNumber = (value: number, fieldName: string): string | null => {
  if (isNaN(value) || value <= 0) {
    return `${fieldName} must be a positive number`
  }
  return null
}

// Validate number range
export const validateNumberRange = (value: number, min: number, max: number, fieldName: string): string | null => {
  if (isNaN(value)) {
    return `${fieldName} must be a valid number`
  }
  if (value < min) {
    return `${fieldName} must be at least ${min}`
  }
  if (value > max) {
    return `${fieldName} must be no more than ${max}`
  }
  return null
}

// Validate email format
export const validateEmail = (email: string): string | null => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return 'Please enter a valid email address'
  }
  return null
}

// Validate phone number
export const validatePhone = (phone: string): string | null => {
  const phoneRegex = /^[+]?[1-9]\d{1,14}$/
  if (!phoneRegex.test(phone.replace(/[\s-()]/g, ''))) {
    return 'Please enter a valid phone number'
  }
  return null
}

// Validate date format and range
export const validateDate = (dateString: string, fieldName: string, minDate?: Date, maxDate?: Date): string | null => {
  const date = new Date(dateString)
  if (isNaN(date.getTime())) {
    return `${fieldName} must be a valid date`
  }
  
  if (minDate && date < minDate) {
    return `${fieldName} must be after ${minDate.toLocaleDateString()}`
  }
  
  if (maxDate && date > maxDate) {
    return `${fieldName} must be before ${maxDate.toLocaleDateString()}`
  }
  
  return null
}

// Validate enum values
export const validateEnum = (value: string, allowedValues: string[], fieldName: string): string | null => {
  if (!allowedValues.includes(value)) {
    return `${fieldName} must be one of: ${allowedValues.join(', ')}`
  }
  return null
}

// Asset type validation
export const validateAssetType = (type: string): string | null => {
  const allowedTypes = ['real_estate', 'commodity', 'art', 'collectible', 'bond', 'equity']
  return validateEnum(type, allowedTypes, 'Asset type')
}

// Asset status validation
export const validateAssetStatus = (status: string): string | null => {
  const allowedStatuses = ['active', 'pending', 'sold', 'inactive']
  return validateEnum(status, allowedStatuses, 'Asset status')
}

// Loan status validation
export const validateLoanStatus = (status: string): string | null => {
  const allowedStatuses = ['active', 'pending', 'completed', 'defaulted']
  return validateEnum(status, allowedStatuses, 'Loan status')
}

// Vault status validation
export const validateVaultStatus = (status: string): string | null => {
  const allowedStatuses = ['active', 'pending', 'closed']
  return validateEnum(status, allowedStatuses, 'Vault status')
}

// Transaction type validation
export const validateTransactionType = (type: string): string | null => {
  const allowedTypes = ['buy', 'sell', 'transfer', 'dividend']
  return validateEnum(type, allowedTypes, 'Transaction type')
}

// Risk level validation
export const validateRiskLevel = (risk: string): string | null => {
  const allowedRisks = ['Low', 'Medium', 'High']
  return validateEnum(risk, allowedRisks, 'Risk level')
}

// Percentage validation (0-100)
export const validatePercentage = (value: number, fieldName: string): string | null => {
  return validateNumberRange(value, 0, 100, fieldName)
}

// Minimum investment validation
export const validateMinimumInvestment = (amount: number, minimum: number): string | null => {
  if (amount < minimum) {
    return `Investment amount must be at least $${minimum.toLocaleString()}`
  }
  return null
}

// Collateral ratio validation
export const validateCollateralRatio = (borrowAmount: number, collateralAmount: number, maxLTV: number): string | null => {
  if (collateralAmount === 0) {
    return 'Collateral amount is required'
  }
  
  const ltvRatio = borrowAmount / collateralAmount
  if (ltvRatio > maxLTV) {
    return `LTV ratio (${(ltvRatio * 100).toFixed(2)}%) exceeds maximum allowed (${(maxLTV * 100).toFixed(2)}%)`
  }
  
  return null
}

// Form validation helper
export const validateForm = (data: Record<string, unknown>, rules: Record<string, (value: unknown) => string | null>): ValidationResult => {
  const errors: ValidationError[] = []
  
  Object.entries(rules).forEach(([field, validator]) => {
    const error = validator(data[field])
    if (error) {
      errors.push({ field, message: error })
    }
  })
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

// KYC form validation
export const validateKYCPersonalData = (data: Record<string, unknown>): ValidationResult => {
  const rules = {
    firstName: (value: unknown) => validateRequired(value as string, 'First name') || validateLength(value as string, 2, 50, 'First name'),
    lastName: (value: unknown) => validateRequired(value as string, 'Last name') || validateLength(value as string, 2, 50, 'Last name'),
    email: (value: unknown) => validateRequired(value as string, 'Email') || validateEmail(value as string),
    phone: (value: unknown) => validateRequired(value as string, 'Phone number') || validatePhone(value as string),
    dateOfBirth: (value: unknown) => {
      const error = validateRequired(value as string, 'Date of birth')
      if (error) return error
      
      const minDate = new Date()
      minDate.setFullYear(minDate.getFullYear() - 100)
      const maxDate = new Date()
      maxDate.setFullYear(maxDate.getFullYear() - 18)
      
      return validateDate(value as string, 'Date of birth', minDate, maxDate)
    },
    country: (value: unknown) => validateRequired(value as string, 'Country of residence'),
    nationality: (value: unknown) => validateRequired(value as string, 'Nationality'),
    occupation: (value: unknown) => validateRequired(value as string, 'Occupation'),
    sourceOfFunds: (value: unknown) => validateRequired(value as string, 'Source of funds'),
    investmentExperience: (value: unknown) => validateRequired(value as string, 'Investment experience')
  }
  
  return validateForm(data, rules)
}

// Vault creation validation
export const validateVaultCreation = (data: Record<string, unknown>): ValidationResult => {
  const rules = {
    name: (value: unknown) => validateRequired(value as string, 'Vault name') || validateLength(value as string, 3, 100, 'Vault name'),
    description: (value: unknown) => validateRequired(value as string, 'Description') || validateLength(value as string, 10, 500, 'Description'),
    strategy: (value: unknown) => validateRequired(value as string, 'Investment strategy') || validateLength(value as string, 5, 200, 'Investment strategy'),
    targetAmount: (value: unknown) => validateRequired(value as number, 'Target amount') || validatePositiveNumber(value as number, 'Target amount'),
    maxInvestors: (value: unknown) => validateRequired(value as number, 'Maximum investors') || validateNumberRange(value as number, 1, 10000, 'Maximum investors'),
    minimumInvestment: (value: unknown) => validateRequired(value as number, 'Minimum investment') || validatePositiveNumber(value as number, 'Minimum investment'),
    expectedReturn: (value: unknown) => validateRequired(value as number, 'Expected return') || validateNumberRange(value as number, 0, 100, 'Expected return'),
    riskLevel: (value: unknown) => validateRequired(value as string, 'Risk level') || validateRiskLevel(value as string)
  }
  
  return validateForm(data, rules)
}

// Lending form validation
export const validateLendingForm = (data: Record<string, unknown>, pool?: Record<string, unknown>): ValidationResult => {
  const rules = {
    amount: (value: unknown) => {
      const error = validateRequired(value as number, 'Amount') || validatePositiveNumber(value as number, 'Amount')
      if (error) return error
      
      if (pool && (value as number) < (pool.minimumLend as number)) {
        return `Amount must be at least $${(pool.minimumLend as number).toLocaleString()}`
      }
      
      return null
    },
    duration: (value: unknown) => validateRequired(value as number, 'Duration') || validateNumberRange(value as number, 1, 365, 'Duration')
  }
  
  return validateForm(data, rules)
}

// Borrowing form validation
export const validateBorrowingForm = (data: Record<string, unknown>, pool?: Record<string, unknown>): ValidationResult => {
  const rules = {
    amount: (value: unknown) => {
      const error = validateRequired(value as number, 'Borrow amount') || validatePositiveNumber(value as number, 'Borrow amount')
      if (error) return error
      
      if (pool && (value as number) < (pool.minimumBorrow as number)) {
        return `Amount must be at least $${(pool.minimumBorrow as number).toLocaleString()}`
      }
      
      return null
    },
    collateralAmount: (value: unknown) => validateRequired(value as number, 'Collateral amount') || validatePositiveNumber(value as number, 'Collateral amount'),
    collateralAsset: (value: unknown) => validateRequired(value as string, 'Collateral asset'),
    duration: (value: unknown) => validateRequired(value as number, 'Duration') || validateNumberRange(value as number, 1, 365, 'Duration')
  }
  
  const result = validateForm(data, rules)
  
  // Additional validation for collateral ratio
  if (result.isValid && pool && data.amount && data.collateralAmount) {
    const collateralError = validateCollateralRatio(data.amount as number, data.collateralAmount as number, pool.maxLTV as number)
    if (collateralError) {
      result.errors.push({ field: 'collateralAmount', message: collateralError })
      result.isValid = false
    }
  }
  
  return result
}