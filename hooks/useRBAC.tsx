'use client'

import React, {useState, useEffect, useCallback} from 'react'
import {useAuth} from './useAuth'
import {UserType} from '@/types'

// Define user role types
export type UserRole = 'individual_investor' | 'accredited_investor' | 'institutional_client' | 'custodian' | 'oracle_provider' | 'compliance_officer' | 'platform_admin'

// Define permission string type
export type PermissionString = string

// Define system permissions
export const PERMISSIONS = {
	// Asset Management
	ASSET_VIEW: 'asset:view',
	ASSET_CREATE: 'asset:create',
	ASSET_EDIT: 'asset:edit',
	ASSET_DELETE: 'asset:delete',
	ASSET_TOKENIZE: 'asset:tokenize',

	// Trading
	TRADE_VIEW: 'trade:view',
	TRADE_EXECUTE: 'trade:execute',
	TRADE_FRACTIONAL: 'trade:fractional',
	TRADE_INSTITUTIONAL: 'trade:institutional',

	// Vault Management
	VAULT_VIEW: 'vault:view',
	VAULT_CREATE: 'vault:create',
	VAULT_MANAGE: 'vault:manage',
	VAULT_AUDIT: 'vault:audit',

	// Lending/Borrowing
	LENDING_VIEW: 'lending:view',
	LENDING_LEND: 'lending:lend',
	LENDING_BORROW: 'lending:borrow',
	LENDING_MANAGE: 'lending:manage',

	// Oracle Services
	ORACLE_VIEW: 'oracle:view',
	ORACLE_PROVIDE: 'oracle:provide',
	ORACLE_MANAGE: 'oracle:manage',

	// Compliance
	COMPLIANCE_VIEW: 'compliance:view',
	COMPLIANCE_MANAGE: 'compliance:manage',
	COMPLIANCE_AUDIT: 'compliance:audit',
	COMPLIANCE_REPORT: 'compliance:report',

	// User Management
	USER_VIEW: 'user:view',
	USER_MANAGE: 'user:manage',
	USER_KYC_REVIEW: 'user:kyc_review',

	// Platform Administration
	PLATFORM_VIEW: 'platform:view',
	PLATFORM_MANAGE: 'platform:manage',
	PLATFORM_CONFIGURE: 'platform:configure',

	// Reporting
	REPORT_VIEW: 'report:view',
	REPORT_GENERATE: 'report:generate',
	REPORT_EXPORT: 'report:export',
} as const

// Define user roles with their permissions
export const USER_ROLES: Record<UserRole, PermissionString[]> = {
	individual_investor: [PERMISSIONS.ASSET_VIEW, PERMISSIONS.TRADE_VIEW, PERMISSIONS.TRADE_EXECUTE, PERMISSIONS.TRADE_FRACTIONAL, PERMISSIONS.LENDING_VIEW, PERMISSIONS.LENDING_BORROW, PERMISSIONS.ORACLE_VIEW, PERMISSIONS.COMPLIANCE_VIEW, PERMISSIONS.REPORT_VIEW],

	accredited_investor: [PERMISSIONS.ASSET_VIEW, PERMISSIONS.ASSET_CREATE, PERMISSIONS.TRADE_VIEW, PERMISSIONS.TRADE_EXECUTE, PERMISSIONS.TRADE_FRACTIONAL, PERMISSIONS.TRADE_INSTITUTIONAL, PERMISSIONS.LENDING_VIEW, PERMISSIONS.LENDING_LEND, PERMISSIONS.LENDING_BORROW, PERMISSIONS.ORACLE_VIEW, PERMISSIONS.COMPLIANCE_VIEW, PERMISSIONS.REPORT_VIEW, PERMISSIONS.REPORT_GENERATE],

	institutional_client: [PERMISSIONS.ASSET_VIEW, PERMISSIONS.ASSET_CREATE, PERMISSIONS.ASSET_EDIT, PERMISSIONS.ASSET_TOKENIZE, PERMISSIONS.TRADE_VIEW, PERMISSIONS.TRADE_EXECUTE, PERMISSIONS.TRADE_FRACTIONAL, PERMISSIONS.TRADE_INSTITUTIONAL, PERMISSIONS.VAULT_VIEW, PERMISSIONS.VAULT_CREATE, PERMISSIONS.VAULT_MANAGE, PERMISSIONS.LENDING_VIEW, PERMISSIONS.LENDING_LEND, PERMISSIONS.LENDING_BORROW, PERMISSIONS.LENDING_MANAGE, PERMISSIONS.ORACLE_VIEW, PERMISSIONS.COMPLIANCE_VIEW, PERMISSIONS.COMPLIANCE_MANAGE, PERMISSIONS.USER_VIEW, PERMISSIONS.REPORT_VIEW, PERMISSIONS.REPORT_GENERATE, PERMISSIONS.REPORT_EXPORT],

	custodian: [PERMISSIONS.ASSET_VIEW, PERMISSIONS.ASSET_CREATE, PERMISSIONS.ASSET_EDIT, PERMISSIONS.ASSET_TOKENIZE, PERMISSIONS.TRADE_VIEW, PERMISSIONS.TRADE_INSTITUTIONAL, PERMISSIONS.VAULT_VIEW, PERMISSIONS.VAULT_CREATE, PERMISSIONS.VAULT_MANAGE, PERMISSIONS.VAULT_AUDIT, PERMISSIONS.LENDING_VIEW, PERMISSIONS.LENDING_MANAGE, PERMISSIONS.ORACLE_VIEW, PERMISSIONS.COMPLIANCE_VIEW, PERMISSIONS.COMPLIANCE_MANAGE, PERMISSIONS.COMPLIANCE_AUDIT, PERMISSIONS.USER_VIEW, PERMISSIONS.USER_MANAGE, PERMISSIONS.REPORT_VIEW, PERMISSIONS.REPORT_GENERATE, PERMISSIONS.REPORT_EXPORT],

	oracle_provider: [PERMISSIONS.ASSET_VIEW, PERMISSIONS.ORACLE_VIEW, PERMISSIONS.ORACLE_PROVIDE, PERMISSIONS.ORACLE_MANAGE, PERMISSIONS.COMPLIANCE_VIEW, PERMISSIONS.REPORT_VIEW, PERMISSIONS.REPORT_GENERATE],

	compliance_officer: [PERMISSIONS.ASSET_VIEW, PERMISSIONS.TRADE_VIEW, PERMISSIONS.VAULT_VIEW, PERMISSIONS.VAULT_AUDIT, PERMISSIONS.LENDING_VIEW, PERMISSIONS.ORACLE_VIEW, PERMISSIONS.COMPLIANCE_VIEW, PERMISSIONS.COMPLIANCE_MANAGE, PERMISSIONS.COMPLIANCE_AUDIT, PERMISSIONS.COMPLIANCE_REPORT, PERMISSIONS.USER_VIEW, PERMISSIONS.USER_MANAGE, PERMISSIONS.USER_KYC_REVIEW, PERMISSIONS.REPORT_VIEW, PERMISSIONS.REPORT_GENERATE, PERMISSIONS.REPORT_EXPORT],

	platform_admin: [...Object.values(PERMISSIONS)],
}

// Define role hierarchy for inheritance
export const ROLE_HIERARCHY: Record<UserRole, UserRole[]> = {
	individual_investor: [],
	accredited_investor: ['individual_investor'],
	institutional_client: ['accredited_investor'],
	custodian: ['institutional_client'],
	oracle_provider: ['individual_investor'],
	compliance_officer: ['institutional_client'],
	platform_admin: ['compliance_officer', 'custodian'],
}

// Define feature access based on KYC levels and user types
export const FEATURE_ACCESS = {
	marketplace: {
		requiredKYC: 'basic',
		allowedUserTypes: ['individual', 'institutional', 'custodian'] as UserType[],
	},
	fractional_trading: {
		requiredKYC: 'enhanced',
		allowedUserTypes: ['individual', 'institutional', 'custodian'] as UserType[],
	},
	institutional_trading: {
		requiredKYC: 'institutional',
		allowedUserTypes: ['institutional', 'custodian'] as UserType[],
	},
	vault_management: {
		requiredKYC: 'institutional',
		allowedUserTypes: ['institutional', 'custodian'] as UserType[],
	},
	lending_platform: {
		requiredKYC: 'enhanced',
		allowedUserTypes: ['institutional', 'custodian'] as UserType[],
	},
	oracle_services: {
		requiredKYC: 'provider',
		allowedUserTypes: ['oracle_provider'] as UserType[],
	},
	compliance_dashboard: {
		requiredKYC: 'institutional',
		allowedUserTypes: ['institutional', 'custodian'] as UserType[],
	},
}

interface RBACState {
	userRoles: UserRole[]
	permissions: PermissionString[]
	loading: boolean
	error: string | null
}

export function useRBAC() {
	const {user, getComplianceStatus} = useAuth()
	const [state, setState] = useState<RBACState>({
		userRoles: [],
		permissions: [],
		loading: true,
		error: null,
	})

	// Calculate user roles based on user type and compliance status
	const calculateUserRoles = useCallback((): UserRole[] => {
		if (!user) return []

		const roles: UserRole[] = []
		const compliance = getComplianceStatus()

		// Base role assignment based on user type
		switch (user.user_type) {
			case 'individual':
				// Check if user is accredited based on compliance status
				if (compliance.status === 'approved' && (user.kyc_level === 'enhanced' || user.kyc_level === 'institutional')) {
					roles.push('accredited_investor')
				} else {
					roles.push('individual_investor')
				}
				break
			case 'institutional':
				roles.push('institutional_client')
				break
			case 'custodian':
				roles.push('custodian')
				break
			case 'oracle_provider':
				roles.push('oracle_provider')
				break
		}

		// Add compliance officer role if designated
		if (user.institutional_details?.compliance_officer) {
			roles.push('compliance_officer')
		}

		// Add admin role if user has admin permissions (check user type)
		if (user.user_type === 'regulator') {
			roles.push('platform_admin')
		}

		return roles
	}, [user, getComplianceStatus])

	// Calculate permissions based on roles
	const calculatePermissions = useCallback((roles: UserRole[]): PermissionString[] => {
		const allPermissions = new Set<PermissionString>()

		roles.forEach((role) => {
			// Add direct permissions for the role
			USER_ROLES[role]?.forEach((permission) => {
				allPermissions.add(permission)
			})

			// Add inherited permissions from role hierarchy
			ROLE_HIERARCHY[role]?.forEach((inheritedRole) => {
				USER_ROLES[inheritedRole]?.forEach((permission) => {
					allPermissions.add(permission)
				})
			})
		})

		return Array.from(allPermissions)
	}, [])

	// Update roles and permissions when user changes
	useEffect(() => {
		setState((prev) => ({...prev, loading: true, error: null}))

		try {
			const roles = calculateUserRoles()
			const permissions = calculatePermissions(roles)

			setState({
				userRoles: roles,
				permissions,
				loading: false,
				error: null,
			})
		} catch (error) {
			setState((prev) => ({
				...prev,
				loading: false,
				error: error instanceof Error ? error.message : 'Failed to calculate permissions',
			}))
		}
	}, [user, calculateUserRoles, calculatePermissions])

	// Check if user has specific permission
	const hasPermission = useCallback(
		(permission: PermissionString): boolean => {
			return state.permissions.includes(permission)
		},
		[state.permissions],
	)

	// Check if user has any of the specified permissions
	const hasAnyPermission = useCallback(
		(permissions: PermissionString[]): boolean => {
			return permissions.some((permission) => hasPermission(permission))
		},
		[hasPermission],
	)

	// Check if user has all specified permissions
	const hasAllPermissions = useCallback(
		(permissions: PermissionString[]): boolean => {
			return permissions.every((permission) => hasPermission(permission))
		},
		[hasPermission],
	)

	// Check if user has specific role
	const hasRole = useCallback(
		(role: UserRole): boolean => {
			return state.userRoles.includes(role)
		},
		[state.userRoles],
	)

	// Check if user has any of the specified roles
	const hasAnyRole = useCallback(
		(roles: UserRole[]): boolean => {
			return roles.some((role) => hasRole(role))
		},
		[hasRole],
	)

	// Check if user can access a specific feature
	const canAccessFeature = useCallback(
		(featureName: keyof typeof FEATURE_ACCESS): boolean => {
			if (!user) return false

			const feature = FEATURE_ACCESS[featureName]
			if (!feature) return false

			const compliance = getComplianceStatus()

			// Check user type
			if (!feature.allowedUserTypes.includes(user.user_type)) {
				return false
			}

			// Check KYC level based on user's kyc_level
			switch (feature.requiredKYC) {
				case 'basic':
					return ['basic', 'enhanced', 'institutional', 'custodian', 'oracle_provider'].includes(user.kyc_level)
				case 'enhanced':
					return ['enhanced', 'institutional', 'custodian', 'oracle_provider'].includes(user.kyc_level)
				case 'institutional':
					return ['institutional', 'custodian', 'oracle_provider'].includes(user.kyc_level)
				case 'provider':
					return ['enhanced', 'institutional', 'custodian', 'oracle_provider'].includes(user.kyc_level) && user.user_type === 'oracle_provider'
				default:
					return false
			}
		},
		[user, getComplianceStatus],
	)

	// Get user's highest role
	const getHighestRole = useCallback((): UserRole | null => {
		const roleOrder: UserRole[] = ['platform_admin', 'compliance_officer', 'custodian', 'institutional_client', 'oracle_provider', 'accredited_investor', 'individual_investor']

		for (const role of roleOrder) {
			if (state.userRoles.includes(role)) {
				return role
			}
		}

		return null
	}, [state.userRoles])

	// Get permissions for a specific role
	const getPermissionsForRole = useCallback((role: UserRole): PermissionString[] => {
		return USER_ROLES[role] || []
	}, [])

	// Check if user can perform action on resource
	const canPerformAction = useCallback(
		(action: string, resource: string, context?: Record<string, any>): boolean => {
			const permission = `${resource}:${action}` as PermissionString

			// Basic permission check
			if (!hasPermission(permission)) {
				return false
			}

			// Additional context-based checks
			if (context) {
				// Check ownership for certain actions
				if (action === 'edit' || action === 'delete') {
					if (context.ownerId && user?.id !== context.ownerId) {
						// Only allow if user has management permissions
						const managementPermission = `${resource}:manage` as PermissionString
						return hasPermission(managementPermission)
					}
				}

				// Check compliance requirements
				if (context.requiresEnhancedKYC) {
					return user?.kyc_level === 'enhanced' || user?.kyc_level === 'institutional' || user?.kyc_level === 'custodian' || user?.kyc_level === 'oracle_provider'
				}
			}

			return true
		},
		[hasPermission, user, getComplianceStatus],
	)

	return {
		// State
		userRoles: state.userRoles,
		permissions: state.permissions,
		loading: state.loading,
		error: state.error,

		// Permission checks
		hasPermission,
		hasAnyPermission,
		hasAllPermissions,

		// Role checks
		hasRole,
		hasAnyRole,
		getHighestRole,

		// Feature access
		canAccessFeature,
		canPerformAction,

		// Utilities
		getPermissionsForRole,

		// Constants
		PERMISSIONS,
		USER_ROLES,
		FEATURE_ACCESS,
	}
}

// Higher-order component for role-based rendering
export function withRoleAccess<T extends object>(Component: React.ComponentType<T>, requiredRoles: UserRole[]) {
	return function RoleProtectedComponent(props: T) {
		const {hasAnyRole, loading} = useRBAC()

		if (loading) {
			return <div>Loading...</div>
		}

		if (!hasAnyRole(requiredRoles)) {
			return <div>Access denied. Insufficient permissions.</div>
		}

		return <Component {...props} />
	}
}

// Higher-order component for permission-based rendering
export function withPermissionAccess<T extends object>(Component: React.ComponentType<T>, requiredPermissions: PermissionString[]) {
	return function PermissionProtectedComponent(props: T) {
		const {hasAllPermissions, loading} = useRBAC()

		if (loading) {
			return <div>Loading...</div>
		}

		if (!hasAllPermissions(requiredPermissions)) {
			return <div>Access denied. Insufficient permissions.</div>
		}

		return <Component {...props} />
	}
}
