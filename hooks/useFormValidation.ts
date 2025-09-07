import { useState, useCallback, useMemo } from 'react'
import { ValidationResult, ValidationError } from '@/utils/validation'

// Form validation hook interface
interface UseFormValidationOptions<T> {
  initialData: T
  validator: (data: T) => ValidationResult
  onSubmit?: (data: T) => Promise<void> | void
}

// Form validation hook return type
interface UseFormValidationReturn<T> {
  data: T
  errors: Record<string, string>
  isValid: boolean
  isSubmitting: boolean
  hasErrors: boolean
  touched: Record<string, boolean>
  setData: (data: T | ((prev: T) => T)) => void
  updateField: (field: keyof T, value: unknown) => void
  validateField: (field: keyof T) => void
  validateForm: () => boolean
  handleSubmit: (e?: React.FormEvent) => Promise<void>
  resetForm: () => void
  setFieldTouched: (field: keyof T, touched?: boolean) => void
  getFieldError: (field: keyof T) => string | undefined
  clearErrors: () => void
}

/**
 * Custom hook for form validation and state management
 * Provides comprehensive form handling with validation, error management, and submission
 */
export function useFormValidation<T extends Record<string, unknown>>({
  initialData,
  validator,
  onSubmit
}: UseFormValidationOptions<T>): UseFormValidationReturn<T> {
  const [data, setData] = useState<T>(initialData)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Validate the entire form
  const validateForm = useCallback((): boolean => {
    const result = validator(data)
    
    const errorMap: Record<string, string> = {}
    result.errors.forEach((error: ValidationError) => {
      errorMap[error.field] = error.message
    })
    
    setErrors(errorMap)
    return result.isValid
  }, [data, validator])

  // Validate a specific field
  const validateField = useCallback((field: keyof T) => {
    const fieldData = { ...data, [field]: data[field] }
    const result = validator(fieldData)
    
    const fieldError = result.errors.find((error: ValidationError) => error.field === field)
    
    setErrors(prev => ({
      ...prev,
      [field]: fieldError ? fieldError.message : ''
    }))
  }, [data, validator])

  // Update a specific field
  const updateField = useCallback((field: keyof T, value: unknown) => {
    setData(prev => ({ ...prev, [field]: value }))
    
    // Clear error for this field when user starts typing
    if (errors[field as string]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }, [errors])

  // Set field as touched
  const setFieldTouched = useCallback((field: keyof T, isTouched: boolean = true) => {
    setTouched(prev => ({ ...prev, [field]: isTouched }))
    
    // Validate field when it becomes touched
    if (isTouched) {
      validateField(field)
    }
  }, [validateField])

  // Get error for a specific field
  const getFieldError = useCallback((field: keyof T): string | undefined => {
    return touched[field as string] ? errors[field as string] : undefined
  }, [errors, touched])

  // Handle form submission
  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault()
    }

    // Mark all fields as touched
    const allTouched: Record<string, boolean> = {}
    Object.keys(data).forEach(key => {
      allTouched[key] = true
    })
    setTouched(allTouched)

    // Validate form
    const isValid = validateForm()
    
    if (!isValid || !onSubmit) {
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit(data)
    } catch (error) {
      console.error('Form submission error:', error)
      // You might want to set a general error here
    } finally {
      setIsSubmitting(false)
    }
  }, [data, validateForm, onSubmit])

  // Reset form to initial state
  const resetForm = useCallback(() => {
    setData(initialData)
    setErrors({})
    setTouched({})
    setIsSubmitting(false)
  }, [initialData])

  // Clear all errors
  const clearErrors = useCallback(() => {
    setErrors({})
  }, [])

  // Computed values
  const isValid = useMemo(() => {
    return Object.values(errors).every(error => !error)
  }, [errors])

  const hasErrors = useMemo(() => {
    return Object.values(errors).some(error => !!error)
  }, [errors])

  return {
    data,
    errors,
    isValid,
    isSubmitting,
    hasErrors,
    touched,
    setData,
    updateField,
    validateField,
    validateForm,
    handleSubmit,
    resetForm,
    setFieldTouched,
    getFieldError,
    clearErrors
  }
}

// Utility hook for simple field validation
export function useFieldValidation<T>(initialValue: T, validator: (value: T) => string | null) {
  const [value, setValue] = useState(initialValue)
  const [error, setError] = useState<string | null>(null)
  const [touched, setTouched] = useState(false)

  const validate = useCallback(() => {
    const validationError = validator(value)
    setError(validationError)
    return !validationError
  }, [value, validator])

  const handleChange = useCallback((newValue: T) => {
    setValue(newValue)
    if (touched && error) {
      // Re-validate if field was touched and had an error
      const validationError = validator(newValue)
      setError(validationError)
    }
  }, [touched, error, validator])

  const handleBlur = useCallback(() => {
    setTouched(true)
    validate()
  }, [validate])

  return {
    value,
    error: touched ? error : null,
    touched,
    isValid: !error,
    setValue: handleChange,
    setTouched,
    validate,
    handleBlur,
    reset: () => {
      setValue(initialValue)
      setError(null)
      setTouched(false)
    }
  }
}