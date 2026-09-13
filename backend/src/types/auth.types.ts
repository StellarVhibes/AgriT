export type AuthProvider = 'google' | 'phone' | 'ussd';

export const AUTH_PROVIDERS: AuthProvider[] = ['google', 'phone', 'ussd'];

export interface FarmerProfile {
  id: string;
  provider: AuthProvider;
  providerSubject: string;
  name: string;
  region: string;
  crop: string;
  walletAddress: string;
  secretWordHash: string;
  /** Encrypted ed25519 seed — never stored in plaintext. */
  walletEncryptedSeed: string;
  createdAt: string;
}

export interface LenderProfile {
  id: string;
  walletAddress: string;
  kycStatus: KycStatus;
  kycSubmission?: KycSubmission;
  createdAt: string;
}

export interface KycSubmission {
  fullName: string;
  entityType: string;
  email: string;
  country: string;
}

export type KycStatus = 'pending' | 'approved' | 'rejected';

export const KYC_STATUSES: KycStatus[] = ['pending', 'approved', 'rejected'];

export interface SessionPayload {
  sub: string;
  role: 'farmer' | 'lender';
  iat: number;
  exp: number;
}
