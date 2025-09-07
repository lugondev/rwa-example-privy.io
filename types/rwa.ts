/**
 * Types for Real World Assets (RWA) system
 */

export interface Asset {
  id: string;
  name: string;
  description: string;
  type: AssetType;
  category: AssetCategory;
  totalValue: number;
  currency: string;
  totalSupply: number;
  availableSupply: number;
  minInvestment: number;
  location?: string;
  images: string[];
  documents: AssetDocument[];
  metadata: Record<string, any>;
  status: AssetStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  verificationStatus: VerificationStatus;
  complianceStatus: ComplianceStatus;
}

export type AssetType = 'digital' | 'physical' | 'hybrid';

export type AssetCategory = 
  | 'real_estate'
  | 'commodities'
  | 'precious_metals'
  | 'art'
  | 'collectibles'
  | 'infrastructure'
  | 'energy'
  | 'agriculture'
  | 'intellectual_property'
  | 'other';

export type AssetStatus = 'draft' | 'pending_review' | 'active' | 'paused' | 'archived';

export type VerificationStatus = 'pending' | 'verified' | 'rejected';

export type ComplianceStatus = 'compliant' | 'pending' | 'non_compliant';

export interface AssetDocument {
  id: string;
  name: string;
  type: DocumentType;
  url: string;
  uploadedAt: string;
  verifiedAt?: string;
}

export type DocumentType = 
  | 'ownership_certificate'
  | 'valuation_report'
  | 'insurance_policy'
  | 'legal_document'
  | 'inspection_report'
  | 'other';

export interface FractionalShare {
  id: string;
  assetId: string;
  tokenId: string;
  totalShares: number;
  pricePerShare: number;
  minPurchase: number;
  maxPurchase?: number;
  tradingEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FractionalTrade {
  id: string;
  assetId: string;
  shareId: string;
  buyerId: string;
  sellerId?: string;
  quantity: number;
  pricePerShare: number;
  totalAmount: number;
  status: TradeStatus;
  createdAt: string;
  executedAt?: string;
}

export type TradeStatus = 'pending' | 'executed' | 'cancelled' | 'failed';

export interface Vault {
  id: string;
  name: string;
  description: string;
  type: VaultType;
  location: string;
  capacity: number;
  currentOccupancy: number;
  securityLevel: SecurityLevel;
  insurance: VaultInsurance;
  operatorId: string;
  status: VaultStatus;
  createdAt: string;
  updatedAt: string;
}

export type VaultType = 'physical' | 'digital' | 'hybrid';

export type SecurityLevel = 'basic' | 'standard' | 'high' | 'maximum';

export type VaultStatus = 'active' | 'maintenance' | 'inactive';

export interface VaultInsurance {
  provider: string;
  policyNumber: string;
  coverage: number;
  expiryDate: string;
}

export interface VaultAsset {
  id: string;
  vaultId: string;
  assetId: string;
  depositedAt: string;
  depositedBy: string;
  condition: AssetCondition;
  location: string;
  insuranceValue: number;
}

export type AssetCondition = 'excellent' | 'good' | 'fair' | 'poor';

export interface LendingPool {
  id: string;
  name: string;
  description: string;
  assetType: AssetCategory;
  totalLiquidity: number;
  availableLiquidity: number;
  utilizationRate: number;
  baseApr: number;
  currentApr: number;
  interestRate: number;
  maxLtv: number; // Loan-to-Value ratio
  minLoanAmount: number;
  maxLoanAmount: number;
  loanTerm: number; // in days
  status: PoolStatus;
  createdAt: string;
  updatedAt: string;
}

export type PoolStatus = 'active' | 'paused' | 'closed';

export interface Loan {
  id: string;
  poolId: string;
  borrowerId: string;
  collateralAssetId: string;
  loanAmount: number;
  interestRate: number;
  duration: number; // in days
  collateralValue: number;
  ltv: number;
  status: LoanStatus;
  createdAt: string;
  dueDate: string;
  repaidAt?: string;
  liquidatedAt?: string;
}

export type LoanStatus = 'active' | 'repaid' | 'defaulted' | 'liquidated';

export interface OraclePrice {
  assetId: string;
  price: number;
  currency: string;
  timestamp: string;
  source: string;
  confidence: number;
}

export interface MarketData {
  assetId: string;
  currentPrice: number;
  priceChange24h: number;
  priceChangePercent24h: number;
  volume24h: number;
  marketCap: number;
  totalSupply: number;
  circulatingSupply: number;
  lastUpdated: string;
}

export interface UserPortfolio {
  userId: string;
  totalValue: number;
  assets: PortfolioAsset[];
  performance: PortfolioPerformance;
  lastUpdated: string;
}

export interface PortfolioAsset {
  assetId: string;
  assetName: string;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  totalValue: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
}

export interface PortfolioPerformance {
  totalReturn: number;
  totalReturnPercent: number;
  dayReturn: number;
  dayReturnPercent: number;
  weekReturn: number;
  weekReturnPercent: number;
  monthReturn: number;
  monthReturnPercent: number;
}

export interface ComplianceCheck {
  userId: string;
  kycStatus: KYCStatus;
  amlStatus: AMLStatus;
  accreditationStatus: AccreditationStatus;
  riskLevel: RiskLevel;
  lastChecked: string;
  expiryDate?: string;
}

export type KYCStatus = 'pending' | 'approved' | 'rejected' | 'expired';
export type AMLStatus = 'clear' | 'flagged' | 'under_review';
export type AccreditationStatus = 'accredited' | 'non_accredited' | 'pending';
export type RiskLevel = 'low' | 'medium' | 'high';

export interface KYCSubmission {
  userId: string;
  documents: KYCDocument[];
  personalInfo: PersonalInfo;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  status: KYCStatus;
  rejectionReason?: string;
}

export interface KYCDocument {
  type: KYCDocumentType;
  url: string;
  uploadedAt: string;
  verified: boolean;
}

export type KYCDocumentType = 
  | 'passport'
  | 'drivers_license'
  | 'national_id'
  | 'proof_of_address'
  | 'bank_statement'
  | 'utility_bill';

export interface PersonalInfo {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  nationality: string;
  address: Address;
  phoneNumber: string;
  email: string;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  pagination?: PaginationInfo;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface AssetFilters {
  type?: AssetType;
  category?: AssetCategory;
  status?: AssetStatus;
  minValue?: number;
  maxValue?: number;
  location?: string;
  search?: string;
}

export interface CreateAssetRequest {
  name: string;
  description: string;
  type: AssetType;
  category: AssetCategory;
  totalValue: number;
  currency: string;
  totalSupply: number;
  minInvestment: number;
  location?: string;
  images: string[];
  documents: Omit<AssetDocument, 'id' | 'uploadedAt'>[];
  metadata: Record<string, any>;
}

export interface UpdateAssetRequest extends Partial<CreateAssetRequest> {
  status?: AssetStatus;
}

export interface CreateFractionalShareRequest {
  assetId: string;
  totalShares: number;
  pricePerShare: number;
  minPurchase: number;
  maxPurchase?: number;
}

export interface TradeRequest {
  shareId: string;
  quantity: number;
  pricePerShare: number;
  type: 'buy' | 'sell';
}

export interface CreateLoanRequest {
  poolId: string;
  collateralAssetId: string;
  loanAmount: number;
  duration: number;
  ltv?: number;
  collateralValue?: number;
}

export interface VaultDepositRequest {
  assetId: string;
  condition: AssetCondition;
  location: string;
  insuranceValue: number;
}

export interface VaultWithdrawRequest {
  assetId: string;
  reason: string;
}