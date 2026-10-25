import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../index';
import { prisma } from '../db';

describe('Seettu Manager API Test Suite', () => {
  let adminToken = '';
  let staffToken = '';
  let memberToken = '';
  let testMemberId = '';
  let testSchemeId = '';

  beforeAll(async () => {
    // 1. Test Admin Login
    const adminRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@seettu.com', password: 'admin123' });
    expect(adminRes.status).toBe(200);
    expect(adminRes.body.success).toBe(true);
    expect(adminRes.body.data.user.role).toBe('ADMIN');
    adminToken = adminRes.body.data.accessToken;

    // 2. Test Staff Login
    const staffRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'staff@seettu.com', password: 'staff123' });
    expect(staffRes.status).toBe(200);
    staffToken = staffRes.body.data.accessToken;

    // 3. Test Member Login
    const memberRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'member@seettu.com', password: 'member123' });
    expect(memberRes.status).toBe(200);
    memberToken = memberRes.body.data.accessToken;
  });

  describe('1. Authentication & Access Control', () => {
    it('rejects invalid password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@seettu.com', password: 'wrongpassword' });
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('rejects unauthenticated request to protected endpoints', async () => {
      const res = await request(app).get('/api/members');
      expect(res.status).toBe(401);
    });

    it('restricts staff from accessing admin-only staff management', async () => {
      const res = await request(app)
        .get('/api/staff')
        .set('Authorization', `Bearer ${staffToken}`);
      expect(res.status).toBe(403);
    });

    it('allows admin to access staff management', async () => {
      const res = await request(app)
        .get('/api/staff')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('2. Member Management & Privacy', () => {
    it('creates a new member with valid data', async () => {
      const memberNumber = `M-TEST-${Date.now().toString().slice(-4)}`;
      const res = await request(app)
        .post('/api/members')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          memberNumber,
          fullName: 'Test Member Automated',
          phone: '9840999999',
          email: 'testmember@example.com',
          status: 'ACTIVE',
        });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.memberNumber).toBe(memberNumber);
      testMemberId = res.body.data.id;
    });

    it('prevents duplicate member number registration', async () => {
      const res = await request(app)
        .post('/api/members')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          memberNumber: 'M-001', // Existing seeded member
          fullName: 'Duplicate Check',
          phone: '9840111111',
        });
      expect(res.status).toBe(409);
      expect(res.body.code).toBe('DUPLICATE_MEMBER_ID');
    });

    it('prevents a member from accessing another member profile (Privacy check)', async () => {
      // Member Ramesh (M-001) tries to access Priya (M-002)
      const allMembers = await request(app)
        .get('/api/members')
        .set('Authorization', `Bearer ${adminToken}`);
      const otherMember = allMembers.body.data.find((m: any) => m.memberNumber === 'M-002');

      const res = await request(app)
        .get(`/api/members/${otherMember.id}`)
        .set('Authorization', `Bearer ${memberToken}`);
      expect(res.status).toBe(403);
      expect(res.body.code).toBe('CROSS_MEMBER_ACCESS_FORBIDDEN');
    });
  });

  describe('3. Scheme Management & Rounds Generation', () => {
    it('creates a new scheme and automatically generates collection rounds', async () => {
      const code = `SCH-TEST-${Date.now().toString().slice(-4)}`;
      const res = await request(app)
        .post('/api/schemes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          code,
          name: 'Automated 12-Month Test Scheme',
          schemeType: 'ROTATING_CHIT',
          startDate: '2026-05-01',
          totalInstallments: 12,
          frequency: 'MONTHLY',
          contributionAmountPaise: 200000, // ₹2,000
          totalMembersCount: 12,
          organizerCommissionPaise: 100000,
          status: 'ACTIVE',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      testSchemeId = res.body.data.id;

      // Verify scheme rounds were generated
      const schemeDetails = await request(app)
        .get(`/api/schemes/${testSchemeId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(schemeDetails.status).toBe(200);
      expect(schemeDetails.body.data.collectionRounds.length).toBe(12);
      expect(schemeDetails.body.data.collectionRounds[0].roundNumber).toBe(1);
    });

    it('enrolls member into a scheme slot', async () => {
      const res = await request(app)
        .post(`/api/schemes/${testSchemeId}/enroll`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          memberId: testMemberId,
          slotNumber: 1,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.slotNumber).toBe(1);
    });
  });

  describe('4. Contribution Payments, Idempotency & Reversals', () => {
    const idempotencyKey = `idemp-test-${Date.now()}`;
    let recordedPaymentId = '';

    it('records partial or full contribution payment with auto-generated receipt', async () => {
      const res = await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          memberId: testMemberId,
          schemeId: testSchemeId,
          roundNumber: 1,
          amountReceivedPaise: 200000, // ₹2,000 in full
          paymentMethod: 'UPI',
          idempotencyKey,
          notes: 'Automated test contribution',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.receiptNumber).toMatch(/^REC-/);
      expect(res.body.data.amountReceivedPaise).toBe(200000);
      expect(res.body.data.balanceRemainingPaise).toBe(0);
      recordedPaymentId = res.body.data.id;
    });

    it('prevents duplicate payment entry when idempotency key is replayed', async () => {
      const res = await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          memberId: testMemberId,
          schemeId: testSchemeId,
          roundNumber: 1,
          amountReceivedPaise: 200000,
          paymentMethod: 'UPI',
          idempotencyKey,
        });

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('idempotent replay');
    });

    it('supports audited payment reversal with required reason', async () => {
      const res = await request(app)
        .post(`/api/payments/${recordedPaymentId}/reverse`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Bank transaction bounced after verification' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify payment status changed to REVERSED
      const checkRes = await request(app)
        .get(`/api/payments/${recordedPaymentId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(checkRes.body.data.status).toBe('REVERSED');
      expect(checkRes.body.data.reversedReason).toBe('Bank transaction bounced after verification');
    });
  });

  describe('5. Payout Workflow (Prepare, Approve, Disburse)', () => {
    it('prepares payout for an eligible member', async () => {
      const schemesRes = await request(app)
        .get('/api/schemes')
        .set('Authorization', `Bearer ${adminToken}`);
      const scheme1 = schemesRes.body.data.find((s: any) => s.code === 'SCH-100K-01');

      // Fetch members enrolled in scheme 1
      const schemeDetails = await request(app)
        .get(`/api/schemes/${scheme1.id}`)
        .set('Authorization', `Bearer ${adminToken}`);
      // Pick second member who hasn't received payout yet
      const eligibleMembership = schemeDetails.body.data.memberships.find((m: any) => !m.hasReceivedPayout);

      const res = await request(app)
        .post('/api/payouts/prepare')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          schemeId: scheme1.id,
          roundNumber: 2,
          recipientMemberId: eligibleMembership.memberId,
          grossPayoutPaise: 10000000,
          deductionsPaise: 600000,
          notes: 'Round 2 auction winner',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.approvalStatus).toBe('PENDING_APPROVAL');
      expect(res.body.data.netPayoutPaise).toBe(9400000);

      const payoutId = res.body.data.id;

      // Staff cannot approve payouts
      const staffApproveRes = await request(app)
        .post(`/api/payouts/${payoutId}/approve`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ approved: true });
      expect(staffApproveRes.status).toBe(403);

      // Admin approves payout
      const adminApproveRes = await request(app)
        .post(`/api/payouts/${payoutId}/approve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ approved: true });
      expect(adminApproveRes.status).toBe(200);

      // Disburse payout
      const disburseRes = await request(app)
        .post(`/api/payouts/${payoutId}/disburse`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          paymentMethod: 'BANK_TRANSFER',
          referenceNumber: 'NEFT-AXIS-AUTO-TEST',
          notes: 'Disbursed via bank transfer',
        });
      expect(disburseRes.status).toBe(200);
      expect(disburseRes.body.success).toBe(true);
    });
  });

  describe('6. Dashboard & Reports Reconciliation', () => {
    it('calculates live metrics without hardcoded figures', async () => {
      const res = await request(app)
        .get('/api/dashboard')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalActiveMembers).toBeGreaterThan(0);
      expect(res.body.data.totalContributionsCollectedPaise).toBeGreaterThan(0);
      expect(Array.isArray(res.body.data.recentTransactions)).toBe(true);
      expect(Array.isArray(res.body.data.monthlyCollectionChart)).toBe(true);
    });

    it('generates reconciled cash-flow report', async () => {
      const res = await request(app)
        .get('/api/reports/cash-flow')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalCollectedPaise).toBeDefined();
      expect(res.body.data.totalPayoutsDisbursedPaise).toBeDefined();
      expect(res.body.data.netCashInHandPaise).toBe(
        res.body.data.totalCollectedPaise - res.body.data.totalPayoutsDisbursedPaise
      );
    });

    afterAll(async () => {
      if (testSchemeId) {
        await prisma.receipt.deleteMany({ where: { payment: { schemeId: testSchemeId } } });
        await prisma.payment.deleteMany({ where: { schemeId: testSchemeId } });
        await prisma.payout.deleteMany({ where: { schemeId: testSchemeId } });
        await prisma.collectionRound.deleteMany({ where: { schemeId: testSchemeId } });
        await prisma.schemeMembership.deleteMany({ where: { schemeId: testSchemeId } });
        await prisma.scheme.delete({ where: { id: testSchemeId } }).catch(() => {});
      }
      if (testMemberId) {
        await prisma.receipt.deleteMany({ where: { payment: { memberId: testMemberId } } });
        await prisma.payment.deleteMany({ where: { memberId: testMemberId } });
        await prisma.schemeMembership.deleteMany({ where: { memberId: testMemberId } });
        await prisma.member.delete({ where: { id: testMemberId } }).catch(() => {});
      }
    });
  });
});
