import { z } from 'zod';

export const LoginSchema = z.object({
  email: z.string().optional(),
  identifier: z.string().optional(),
  name: z.string().optional(),
  password: z.string().min(1, 'Password is required'),
});

export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const MemberCreateSchema = z.object({
  memberNumber: z.string().min(2, 'Member number must be at least 2 characters').regex(/^[A-Za-z0-9-_]+$/, 'Member number can only contain letters, numbers, hyphens, and underscores'),
  fullName: z.string().min(2, 'Full name is required'),
  phone: z.string().regex(/^[0-9+ -]{10,15}$/, 'Invalid phone number format'),
  email: z.string().email('Invalid email format').optional().nullable(),
  address: z.string().optional().nullable(),
  dateJoined: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).default('ACTIVE'),
  notes: z.string().optional().nullable(),
});

export const MemberUpdateSchema = MemberCreateSchema.partial();

export const SchemeCreateSchema = z.object({
  code: z.string().min(2, 'Scheme code is required').regex(/^[A-Za-z0-9-_]+$/, 'Invalid code format'),
  name: z.string().min(3, 'Scheme name must be at least 3 characters'),
  schemeType: z.enum(['ROTATING_CHIT', 'FIXED_SAVINGS']),
  startDate: z.string().min(4, 'Start date is required'),
  totalInstallments: z.number().int().min(2, 'Must have at least 2 installments'),
  frequency: z.enum(['MONTHLY', 'WEEKLY', 'DAILY']).default('MONTHLY'),
  contributionAmountPaise: z.number().int().positive('Contribution amount must be positive'),
  totalMembersCount: z.number().int().min(2, 'Total members count must be at least 2'),
  organizerCommissionPaise: z.number().int().min(0).default(0),
  status: z.enum(['DRAFT', 'ACTIVE', 'COMPLETED', 'CANCELLED']).default('ACTIVE'),
  notes: z.string().optional().nullable(),
  memberIds: z.array(z.string()).optional(), // Initial members to enroll
});

export const SchemeUpdateSchema = SchemeCreateSchema.partial();

export const SchemeEnrollMemberSchema = z.object({
  memberId: z.string().uuid('Invalid member ID'),
  slotNumber: z.number().int().positive().optional(),
  notes: z.string().optional().nullable(),
});

export const RecordPaymentSchema = z.object({
  memberId: z.string().min(1, 'Member ID is required'),
  schemeId: z.string().min(1, 'Scheme ID is required'),
  roundNumber: z.number().int().positive('Round number must be positive'),
  amountReceivedPaise: z.number().int().positive('Amount received must be positive'),
  paymentDate: z.string().optional(),
  paymentMethod: z.enum(['CASH', 'UPI', 'BANK_TRANSFER', 'OTHER']),
  externalReference: z.string().optional().nullable(),
  idempotencyKey: z.string().min(4, 'Idempotency key is required to prevent double charging').optional(),
  notes: z.string().optional().nullable(),
});

export const PaymentReversalSchema = z.object({
  reason: z.string().min(5, 'Reversal reason must be provided (min 5 chars)'),
});

export const PayoutPrepareSchema = z.object({
  schemeId: z.string().min(1, 'Scheme ID is required'),
  roundNumber: z.number().int().positive('Round number is required'),
  recipientMemberId: z.string().min(1, 'Recipient member is required'),
  grossPayoutPaise: z.number().int().positive('Gross payout must be positive'),
  deductionsPaise: z.number().int().min(0).default(0),
  notes: z.string().optional().nullable(),
});

export const PayoutApprovalSchema = z.object({
  approved: z.boolean(),
  rejectionReason: z.string().optional().nullable(),
});

export const PayoutDisburseSchema = z.object({
  paymentMethod: z.enum(['CASH', 'UPI', 'BANK_TRANSFER', 'OTHER']),
  referenceNumber: z.string().min(1, 'Payment reference number is required'),
  disbursedDate: z.string().optional(),
  notes: z.string().optional().nullable(),
});

export const MemberImportSchema = z.object({
  members: z.array(
    z.object({
      memberNumber: z.string().min(1),
      fullName: z.string().min(1),
      phone: z.string().min(10),
      email: z.string().email().optional().or(z.literal('')),
      address: z.string().optional(),
      status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).optional(),
    })
  ),
});
