export type UserRole = 'ADMIN' | 'STAFF' | 'MEMBER';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string | null;
  memberId?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type MemberStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

export interface Member {
  id: string;
  memberNumber: string; // e.g. M-101
  fullName: string;
  phone: string;
  email?: string | null;
  address?: string | null;
  dateJoined: string;
  status: MemberStatus;
  notes?: string | null;
  userId?: string | null;
  createdAt: string;
  updatedAt: string;
  // Computed / aggregated balances
  totalContributedPaise?: number;
  totalPendingPaise?: number;
  activeSchemesCount?: number;
}

export type SchemeType = 'ROTATING_CHIT' | 'FIXED_SAVINGS';
export type SchemeStatus = 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
export type Frequency = 'MONTHLY' | 'WEEKLY' | 'DAILY';

export interface Scheme {
  id: string;
  code: string; // e.g. SCH-100K-01
  name: string;
  schemeType: SchemeType;
  startDate: string;
  endDate: string;
  totalInstallments: number;
  frequency: Frequency;
  contributionAmountPaise: number; // in paise
  totalPoolAmountPaise: number; // in paise
  totalMembersCount: number;
  organizerCommissionPaise: number;
  status: SchemeStatus;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  // Computed fields
  currentRoundNumber?: number;
  totalCollectedPaise?: number;
  membersEnrolled?: number;
}

export interface SchemeMembership {
  id: string;
  schemeId: string;
  memberId: string;
  slotNumber: number;
  joinedAt: string;
  hasReceivedPayout: boolean;
  payoutRoundNumber?: number | null;
  notes?: string | null;
  member?: Member;
  scheme?: Scheme;
}

export type RoundStatus = 'PENDING' | 'COLLECTING' | 'COMPLETED';
export type PayoutStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'DISBURSED';

export interface CollectionRound {
  id: string;
  schemeId: string;
  roundNumber: number;
  dueDate: string;
  targetAmountPaise: number;
  collectedAmountPaise: number;
  status: RoundStatus;
  payoutRecipientMemberId?: string | null;
  payoutRecipient?: Member | null;
  grossPayoutPaise?: number | null;
  deductionsPaise?: number | null;
  netPayoutPaise?: number | null;
  payoutStatus?: PayoutStatus | null;
  payoutDisbursedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type PaymentMethod = 'CASH' | 'UPI' | 'BANK_TRANSFER' | 'OTHER';
export type PaymentStatus = 'SUCCESS' | 'PENDING_VERIFICATION' | 'REVERSED';

export interface Payment {
  id: string;
  transactionId: string;
  receiptNumber: string;
  schemeId: string;
  schemeName?: string;
  memberId: string;
  memberName?: string;
  memberNumber?: string;
  roundNumber: number;
  amountDuePaise: number;
  amountReceivedPaise: number;
  balanceRemainingPaise: number;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  externalReference?: string | null;
  recordedByUserId: string;
  recordedByName?: string;
  status: PaymentStatus;
  idempotencyKey?: string | null;
  notes?: string | null;
  reversedAt?: string | null;
  reversedReason?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Payout {
  id: string;
  schemeId: string;
  schemeName?: string;
  roundId: string;
  roundNumber: number;
  recipientMemberId: string;
  recipientName?: string;
  recipientMemberNumber?: string;
  recipientPhone?: string;
  grossPayoutPaise: number;
  deductionsPaise: number;
  netPayoutPaise: number;
  disbursedDate?: string | null;
  paymentMethod?: PaymentMethod | null;
  referenceNumber?: string | null;
  approvalStatus: PayoutStatus;
  preparedByUserId: string;
  approvedByUserId?: string | null;
  approvedByName?: string | null;
  approvedAt?: string | null;
  rejectionReason?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'PAYMENT_RECEIVED' | 'INSTALLMENT_DUE' | 'PAYOUT_APPROVED' | 'SCHEME_UPDATE' | 'ANNOUNCEMENT';
  isRead: boolean;
  linkUrl?: string | null;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId?: string | null;
  userName?: string | null;
  userEmail?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  details?: Record<string, any> | null;
  ipAddress?: string | null;
  createdAt: string;
}

export interface DashboardMetrics {
  totalActiveMembers: number;
  totalActiveSchemes: number;
  totalContributionsCollectedPaise: number;
  contributionsExpectedThisMonthPaise: number;
  outstandingContributionsPaise: number;
  totalPayoutsRecordedPaise: number;
  paidMembersCount: number;
  pendingMembersCount: number;
  recentTransactions: Payment[];
  upcomingCollectionDates: {
    schemeId: string;
    schemeName: string;
    roundNumber: number;
    dueDate: string;
    expectedAmountPaise: number;
    collectedAmountPaise: number;
  }[];
  monthlyCollectionChart: {
    month: string;
    collectedPaise: number;
    expectedPaise: number;
    payoutsPaise: number;
  }[];
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: User;
}
