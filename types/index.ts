// Enhanced User types with KYC/AML
export interface User {
  id: string
  email?: string
  wallet_address?: string
  created_at: string
  updated_at: string
  kyc_status: KYCStatus
  kyc_level: KYCLevel
  aml_status: AMLStatus
  user_type: UserType
  compliance_tier: ComplianceTier
  profile?: UserProfile
  verification_documents?: VerificationDocument[]
  risk_score?: number
  last_compliance_check?: string
  institutional_details?: InstitutionalDetails
}

export type KYCStatus = 'pending' | 'in_review' | 'verified' | 'rejected' | 'expired' | 'suspended'
export type KYCLevel = 'basic' | 'enhanced' | 'institutional' | 'custodian' | 'oracle_provider'
export type AMLStatus = 'clear' | 'flagged' | 'under_review' | 'blocked'
export type UserType = 'individual' | 'institutional' | 'custodian' | 'oracle_provider' | 'regulator'
export type ComplianceTier = 'tier_1' | 'tier_2' | 'tier_3' | 'tier_4'

export interface UserProfile {
  first_name?: string
  last_name?: string
  company_name?: string
  phone?: string
  country?: string
  date_of_birth?: string
  profile_image?: string
  nationality?: string
  occupation?: string
  source_of_funds?: string
  investment_experience?: InvestmentExperience
  accredited_investor?: boolean
  politically_exposed_person?: boolean
}

export interface InstitutionalDetails {
  company_registration_number?: string
  tax_id?: string
  regulatory_licenses?: string[]
  aum?: number
  primary_business?: string
  authorized_representatives?: AuthorizedRepresentative[]
  compliance_officer?: ComplianceOfficer
}

export interface AuthorizedRepresentative {
  name: string
  title: string
  email: string
  phone?: string
  kyc_status: KYCStatus
}

export interface ComplianceOfficer {
  name: string
  email: string
  phone: string
  license_number?: string
}

export type InvestmentExperience = 'beginner' | 'intermediate' | 'advanced' | 'professional'

// Verification Document types
export interface VerificationDocument {
  id: string
  user_id: string
  document_type: DocumentType
  file_url: string
  file_name: string
  upload_date: string
  verification_status: VerificationStatus
  verified_by?: string
  verified_at?: string
  expiry_date?: string
  notes?: string
}

export type DocumentType = 
  | 'passport'
  | 'drivers_license'
  | 'national_id'
  | 'utility_bill'
  | 'bank_statement'
  | 'tax_document'
  | 'company_registration'
  | 'regulatory_license'
  | 'proof_of_address'
  | 'selfie_with_id'
  | 'accreditation_certificate'

export type VerificationStatus = 'pending' | 'approved' | 'rejected' | 'expired'

// Compliance and Risk types
export interface ComplianceCheck {
  id: string
  user_id: string
  check_type: ComplianceCheckType
  status: ComplianceCheckStatus
  risk_score: number
  details: Record<string, any>
  performed_at: string
  performed_by: string
  next_check_due?: string
}

export type ComplianceCheckType = 
  | 'kyc_verification'
  | 'aml_screening'
  | 'sanctions_check'
  | 'pep_screening'
  | 'adverse_media'
  | 'ongoing_monitoring'

export type ComplianceCheckStatus = 'passed' | 'failed' | 'requires_review' | 'pending'

// Role-based Access Control
export interface UserRole {
  id: string
  name: string
  description: string
  permissions: Permission[]
  is_system_role: boolean
}

export interface Permission {
  id: string
  resource: string
  action: string
  conditions?: Record<string, any>
}

export interface UserRoleAssignment {
  user_id: string
  role_id: string
  assigned_by: string
  assigned_at: string
  expires_at?: string
}

// Asset Types
export interface Asset {
  id: string
  name: string
  description: string
  asset_type: 'physical_collectible' | 'digital_nft' | 'real_estate' | 'commodity'
  category: string
  subcategory?: string
  creator_id: string
  owner_id: string
  vault_id?: string
  token_contract: string
  token_id: string
  chain_id: number
  metadata_uri: string
  image_url: string
  verification_status: 'pending' | 'verified' | 'rejected'
  fractionalized: boolean
  total_supply?: number
  available_supply?: number
  base_price: string
  current_price: string
  price_currency: 'ETH' | 'MATIC' | 'ALGO' | 'XDC' | 'USD'
  market_cap?: string
  volume_24h?: string
  price_change_24h?: number
  rarity?: 'common' | 'rare' | 'epic' | 'legendary'
  location?: string
  physical_condition?: string
  authentication_docs?: string[]
  insurance_value?: string
  storage_cost?: string
  created_at: string
  updated_at: string
}

// Fractional Share Types
export interface FractionalShare {
  id: string
  asset_id: string
  owner_id: string
  shares_owned: number
  purchase_price: string
  purchase_date: string
  current_value: string
  dividend_earned?: string
  voting_power: number
  lock_period?: string
  transferable: boolean
  created_at: string
  updated_at: string
}

// Vault Types
export interface Vault {
  id: string
  name: string
  description: string
  vault_type: 'physical' | 'digital' | 'hybrid'
  location: string
  operator: string
  security_level: 'standard' | 'high' | 'maximum'
  insurance_coverage: string
  capacity: number
  current_occupancy: number
  temperature_controlled: boolean
  humidity_controlled: boolean
  fire_protection: boolean
  security_cameras: boolean
  access_logs: boolean
  certification: string[]
  operating_hours: string
  contact_info: string
  storage_fee: string
  created_at: string
  updated_at: string
}

// Vault Record Types
export interface VaultRecord {
  id: string
  asset_id: string
  vault_id: string
  check_in_date: string
  check_out_date?: string
  condition_in: string
  condition_out?: string
  storage_fee: string
  insurance_value: string
  handling_instructions?: string
  access_log: VaultAccessLog[]
  created_at: string
  updated_at: string
}

export interface VaultAccessLog {
  id: string
  vault_record_id: string
  accessor_id: string
  access_type: 'inspection' | 'maintenance' | 'transfer' | 'emergency'
  access_date: string
  duration: number
  notes?: string
  authorized_by: string
  created_at: string
}

// Oracle Price Types
export interface OraclePrice {
  id: string
  asset_id: string
  oracle_provider: 'chainlink' | 'band_protocol' | 'manual'
  price_source: string
  price_value: string
  price_currency: string
  confidence_score: number
  timestamp: string
  block_number?: number
  transaction_hash?: string
  created_at: string
}

// Loan Types
export interface Loan {
  id: string
  borrower_id: string
  lender_id?: string
  asset_id: string
  loan_amount: string
  loan_currency: string
  interest_rate: number
  loan_term: number
  collateral_ratio: number
  loan_status: 'pending' | 'active' | 'repaid' | 'defaulted' | 'liquidated'
  start_date?: string
  due_date?: string
  repaid_date?: string
  repaid_amount?: string
  liquidation_date?: string
  liquidation_amount?: string
  created_at: string
  updated_at: string
}

// Compliance Types
export interface ComplianceRecord {
  id: string
  user_id: string
  asset_id?: string
  transaction_id?: string
  compliance_type: 'kyc' | 'aml' | 'sanctions' | 'tax_reporting'
  status: 'pending' | 'approved' | 'rejected' | 'flagged'
  provider: 'chainalysis' | 'jumio' | 'internal'
  risk_score?: number
  risk_level: 'low' | 'medium' | 'high' | 'critical'
  flags?: string[]
  notes?: string
  reviewed_by?: string
  reviewed_at?: string
  created_at: string
  updated_at: string
}

// Transaction Types
export interface Transaction {
  id: string
  from_user_id: string
  to_user_id: string
  asset_id: string
  transaction_type: 'purchase' | 'sale' | 'transfer' | 'fractionalization' | 'loan' | 'repayment'
  amount: string
  currency: string
  shares?: number
  price_per_share?: string
  transaction_hash: string
  block_number: number
  chain_id: number
  gas_fee: string
  platform_fee: string
  status: 'pending' | 'confirmed' | 'failed'
  created_at: string
  confirmed_at?: string
}

// Metadata Types
export interface AssetMetadata {
  id: string
  asset_id: string
  metadata_type: 'erc721' | 'erc1155' | 'custom'
  metadata_schema: string
  metadata_content: Record<string, any>
  ipfs_hash?: string
  arweave_hash?: string
  created_at: string
  updated_at: string
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Blockchain Types
export interface ChainConfig {
  chainId: number
  name: string
  symbol: string
  rpcUrl: string
  blockExplorer: string
  nativeCurrency: {
    name: string
    symbol: string
    decimals: number
  }
}

// Wallet Types
export interface WalletConnection {
  address: string
  chainId: number
  isConnected: boolean
  provider?: any
  signer?: any
}

// Market Data Types
export interface MarketData {
  totalValueLocked: string
  totalAssets: number
  activeUsers: number
  volume24h: string
  topGainers: Asset[]
  topLosers: Asset[]
  recentTransactions: Transaction[]
}

// Search and Filter Types
export interface SearchFilters {
  category?: string
  priceRange?: {
    min: number
    max: number
  }
  assetType?: string[]
  verified?: boolean
  fractionalized?: boolean
  location?: string
  rarity?: string[]
  sortBy?: 'price' | 'change' | 'volume' | 'recent'
  sortOrder?: 'asc' | 'desc'
}

export interface SearchResult {
  assets: Asset[]
  total: number
  filters: SearchFilters
  suggestions?: string[]
}

// Notification Types
export interface Notification {
  id: string
  user_id: string
  type: 'transaction' | 'price_alert' | 'kyc_update' | 'loan_reminder' | 'system'
  title: string
  message: string
  read: boolean
  action_url?: string
  created_at: string
}

// Analytics Types
export interface AnalyticsData {
  timeframe: '24h' | '7d' | '30d' | '90d' | '1y'
  metrics: {
    volume: number[]
    price: number[]
    users: number[]
    transactions: number[]
  }
  labels: string[]
}

// Error Types
export interface AppError {
  code: string
  message: string
  details?: any
  timestamp: string
}

// Form Types
export interface CreateAssetForm {
  name: string
  description: string
  assetType: string
  category: string
  images: File[]
  documents: File[]
  basePrice: string
  currency: string
  fractionalize: boolean
  totalShares?: number
  location?: string
  condition?: string
  insuranceValue?: string
}

export interface KYCForm {
  firstName: string
  lastName: string
  dateOfBirth: string
  nationality: string
  address: string
  city: string
  country: string
  postalCode: string
  phoneNumber: string
  idDocument: File
  proofOfAddress: File
  selfie: File
}