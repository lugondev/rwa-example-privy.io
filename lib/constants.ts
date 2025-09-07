// Blockchain Networks
export const SUPPORTED_CHAINS = {
  ETHEREUM: {
    id: 1,
    name: 'Ethereum',
    symbol: 'ETH',
    rpcUrl: 'https://mainnet.infura.io/v3/',
    blockExplorer: 'https://etherscan.io',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
  },
  POLYGON: {
    id: 137,
    name: 'Polygon',
    symbol: 'MATIC',
    rpcUrl: 'https://polygon-rpc.com',
    blockExplorer: 'https://polygonscan.com',
    nativeCurrency: {
      name: 'MATIC',
      symbol: 'MATIC',
      decimals: 18,
    },
  },
  XDC: {
    id: 50,
    name: 'XDC Network',
    symbol: 'XDC',
    rpcUrl: 'https://rpc.xinfin.network',
    blockExplorer: 'https://explorer.xinfin.network',
    nativeCurrency: {
      name: 'XDC',
      symbol: 'XDC',
      decimals: 18,
    },
  },
  ALGORAND: {
    id: 4160,
    name: 'Algorand',
    symbol: 'ALGO',
    rpcUrl: 'https://mainnet-api.algonode.cloud',
    blockExplorer: 'https://algoexplorer.io',
    nativeCurrency: {
      name: 'Algorand',
      symbol: 'ALGO',
      decimals: 6,
    },
  },
} as const;

// Asset Types
export const ASSET_TYPES = {
  PHYSICAL_COLLECTIBLE: 'physical_collectible',
  DIGITAL_NFT: 'digital_nft',
  REAL_ESTATE: 'real_estate',
  COMMODITY: 'commodity',
} as const;

// Asset Categories
export const ASSET_CATEGORIES = {
  ART: 'art',
  COLLECTIBLES: 'collectibles',
  GAMING: 'gaming',
  MUSIC: 'music',
  SPORTS: 'sports',
  PHOTOGRAPHY: 'photography',
  UTILITY: 'utility',
  DOMAIN: 'domain',
  VIRTUAL_WORLDS: 'virtual_worlds',
  TRADING_CARDS: 'trading_cards',
  REAL_ESTATE: 'real_estate',
  COMMODITIES: 'commodities',
} as const;

// Rarity Levels
export const RARITY_LEVELS = {
  COMMON: 'common',
  RARE: 'rare',
  EPIC: 'epic',
  LEGENDARY: 'legendary',
} as const;

// KYC Status
export const KYC_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const;

// KYC Levels
export const KYC_LEVELS = {
  BASIC: 'basic',
  INTERMEDIATE: 'intermediate',
  ADVANCED: 'advanced',
} as const;

// Verification Status
export const VERIFICATION_STATUS = {
  PENDING: 'pending',
  VERIFIED: 'verified',
  REJECTED: 'rejected',
} as const;

// Transaction Types
export const TRANSACTION_TYPES = {
  PURCHASE: 'purchase',
  SALE: 'sale',
  TRANSFER: 'transfer',
  FRACTIONALIZATION: 'fractionalization',
  LOAN: 'loan',
  REPAYMENT: 'repayment',
} as const;

// Transaction Status
export const TRANSACTION_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  FAILED: 'failed',
} as const;

// Loan Status
export const LOAN_STATUS = {
  PENDING: 'pending',
  ACTIVE: 'active',
  REPAID: 'repaid',
  DEFAULTED: 'defaulted',
  LIQUIDATED: 'liquidated',
} as const;

// Vault Types
export const VAULT_TYPES = {
  PHYSICAL: 'physical',
  DIGITAL: 'digital',
  HYBRID: 'hybrid',
} as const;

// Security Levels
export const SECURITY_LEVELS = {
  STANDARD: 'standard',
  HIGH: 'high',
  MAXIMUM: 'maximum',
} as const;

// Compliance Types
export const COMPLIANCE_TYPES = {
  KYC: 'kyc',
  AML: 'aml',
  SANCTIONS: 'sanctions',
  TAX_REPORTING: 'tax_reporting',
} as const;

// Risk Levels
export const RISK_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
} as const;

// Oracle Providers
export const ORACLE_PROVIDERS = {
  CHAINLINK: 'chainlink',
  BAND_PROTOCOL: 'band_protocol',
  MANUAL: 'manual',
} as const;

// Currencies
export const CURRENCIES = {
  ETH: 'ETH',
  MATIC: 'MATIC',
  ALGO: 'ALGO',
  XDC: 'XDC',
  USD: 'USD',
} as const;

// Platform Settings
export const PLATFORM_SETTINGS = {
  PLATFORM_FEE_PERCENTAGE: 2.5, // 2.5%
  MIN_FRACTIONALIZATION_SHARES: 100,
  MAX_FRACTIONALIZATION_SHARES: 10000,
  MIN_LOAN_COLLATERAL_RATIO: 150, // 150%
  MAX_LOAN_TERM_DAYS: 365,
  DEFAULT_PAGINATION_LIMIT: 20,
  MAX_PAGINATION_LIMIT: 100,
} as const;

// File Upload Settings
export const FILE_UPLOAD = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  ALLOWED_VIDEO_TYPES: ['video/mp4', 'video/webm', 'video/ogg'],
  ALLOWED_AUDIO_TYPES: ['audio/mp3', 'audio/wav', 'audio/ogg'],
  ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
} as const;

// API Endpoints
export const API_ENDPOINTS = {
  ASSETS: '/api/assets',
  USERS: '/api/users',
  TRANSACTIONS: '/api/transactions',
  FRACTIONAL_SHARES: '/api/fractional-shares',
  VAULTS: '/api/vaults',
  LOANS: '/api/loans',
  COMPLIANCE: '/api/compliance',
  ORACLE_PRICES: '/api/oracle-prices',
  METADATA: '/api/metadata',
  UPLOAD: '/api/upload',
  SEARCH: '/api/search',
  ANALYTICS: '/api/analytics',
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  WALLET_NOT_CONNECTED: 'Please connect your wallet to continue',
  INSUFFICIENT_BALANCE: 'Insufficient balance for this transaction',
  TRANSACTION_FAILED: 'Transaction failed. Please try again.',
  NETWORK_NOT_SUPPORTED: 'This network is not supported',
  KYC_REQUIRED: 'KYC verification is required for this action',
  ASSET_NOT_FOUND: 'Asset not found',
  UNAUTHORIZED: 'You are not authorized to perform this action',
  INVALID_INPUT: 'Invalid input provided',
  SERVER_ERROR: 'Server error. Please try again later.',
  FILE_TOO_LARGE: 'File size exceeds the maximum limit',
  INVALID_FILE_TYPE: 'Invalid file type',
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  TRANSACTION_SUBMITTED: 'Transaction submitted successfully',
  ASSET_CREATED: 'Asset created successfully',
  ASSET_UPDATED: 'Asset updated successfully',
  PROFILE_UPDATED: 'Profile updated successfully',
  KYC_SUBMITTED: 'KYC verification submitted successfully',
  FILE_UPLOADED: 'File uploaded successfully',
} as const;

// Local Storage Keys
export const STORAGE_KEYS = {
  USER_PREFERENCES: 'rwa_user_preferences',
  THEME: 'rwa_theme',
  LANGUAGE: 'rwa_language',
  RECENT_SEARCHES: 'rwa_recent_searches',
  FAVORITES: 'rwa_favorites',
  CART: 'rwa_cart',
} as const;

// Theme Colors
export const THEME_COLORS = {
  PRIMARY: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9',
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
  },
  SECONDARY: {
    50: '#fdf4ff',
    100: '#fae8ff',
    200: '#f5d0fe',
    300: '#f0abfc',
    400: '#e879f9',
    500: '#d946ef',
    600: '#c026d3',
    700: '#a21caf',
    800: '#86198f',
    900: '#701a75',
  },
  ACCENT: {
    50: '#fff7ed',
    100: '#ffedd5',
    200: '#fed7aa',
    300: '#fdba74',
    400: '#fb923c',
    500: '#f97316',
    600: '#ea580c',
    700: '#c2410c',
    800: '#9a3412',
    900: '#7c2d12',
  },
} as const;

export type SupportedChain = keyof typeof SUPPORTED_CHAINS;
export type AssetType = typeof ASSET_TYPES[keyof typeof ASSET_TYPES];
export type AssetCategory = typeof ASSET_CATEGORIES[keyof typeof ASSET_CATEGORIES];
export type RarityLevel = typeof RARITY_LEVELS[keyof typeof RARITY_LEVELS];
export type KYCStatus = typeof KYC_STATUS[keyof typeof KYC_STATUS];
export type KYCLevel = typeof KYC_LEVELS[keyof typeof KYC_LEVELS];
export type VerificationStatus = typeof VERIFICATION_STATUS[keyof typeof VERIFICATION_STATUS];
export type TransactionType = typeof TRANSACTION_TYPES[keyof typeof TRANSACTION_TYPES];
export type TransactionStatus = typeof TRANSACTION_STATUS[keyof typeof TRANSACTION_STATUS];
export type LoanStatus = typeof LOAN_STATUS[keyof typeof LOAN_STATUS];
export type VaultType = typeof VAULT_TYPES[keyof typeof VAULT_TYPES];
export type SecurityLevel = typeof SECURITY_LEVELS[keyof typeof SECURITY_LEVELS];
export type ComplianceType = typeof COMPLIANCE_TYPES[keyof typeof COMPLIANCE_TYPES];
export type RiskLevel = typeof RISK_LEVELS[keyof typeof RISK_LEVELS];
export type OracleProvider = typeof ORACLE_PROVIDERS[keyof typeof ORACLE_PROVIDERS];
export type Currency = typeof CURRENCIES[keyof typeof CURRENCIES];