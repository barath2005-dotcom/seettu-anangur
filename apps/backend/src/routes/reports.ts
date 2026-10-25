import { Router, Request, Response } from 'express';
import { prisma } from '../db';
import { authenticate, requireRole, checkMemberAccess } from '../middleware/auth';

const router = Router();

// GET /api/reports/cash-flow - Reconciled cash-flow summary
router.get('/cash-flow', authenticate, requireRole('ADMIN', 'STAFF'), async (req: Request, res: Response) => {
  try {
    const [payments, payouts] = await Promise.all([
      prisma.payment.findMany({ where: { status: 'SUCCESS' } }),
      prisma.payout.findMany({ where: { approvalStatus: 'DISBURSED' } }),
    ]);

    const totalCollectedPaise = payments.reduce((sum, p) => sum + p.amountReceivedPaise, 0);
    const totalPayoutsDisbursedPaise = payouts.reduce((sum, po) => sum + po.netPayoutPaise, 0);
    const totalDeductionsCollectedPaise = payouts.reduce((sum, po) => sum + po.deductionsPaise, 0);
    const netCashInHandPaise = totalCollectedPaise - totalPayoutsDisbursedPaise;

    res.json({
      success: true,
      data: {
        totalCollectedPaise,
        totalPayoutsDisbursedPaise,
        totalDeductionsCollectedPaise,
        netCashInHandPaise,
        totalSuccessfulTransactions: payments.length,
        totalCompletedPayouts: payouts.length,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to compute cash-flow report' });
  }
});

// GET /api/reports/scheme-summary - Financial health and progress per scheme
router.get('/scheme-summary', authenticate, requireRole('ADMIN', 'STAFF'), async (req: Request, res: Response) => {
  try {
    const schemes = await prisma.scheme.findMany({
      include: {
        memberships: true,
        collectionRounds: true,
        payments: { where: { status: 'SUCCESS' } },
        payouts: { where: { approvalStatus: 'DISBURSED' } },
      },
    });

    const summary = (schemes as any[]).map((s) => {
      const totalCollectedPaise = s.payments.reduce((sum: number, p: any) => sum + p.amountReceivedPaise, 0);
      const totalDisbursedPaise = s.payouts.reduce((sum: number, po: any) => sum + po.netPayoutPaise, 0);
      const expectedTotalPoolPaise = s.totalPoolAmountPaise * s.totalInstallments;
      const progressPercent = Math.min(100, Math.round((totalCollectedPaise / (expectedTotalPoolPaise || 1)) * 100));

      return {
        schemeId: s.id,
        code: s.code,
        name: s.name,
        schemeType: s.schemeType,
        status: s.status,
        totalMembersCount: s.totalMembersCount,
        membersEnrolled: s.memberships.length,
        totalInstallments: s.totalInstallments,
        contributionAmountPaise: s.contributionAmountPaise,
        totalCollectedPaise,
        totalDisbursedPaise,
        organizerCommissionPaise: s.organizerCommissionPaise,
        progressPercent,
      };
    });

    res.json({ success: true, data: summary });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to generate scheme summary' });
  }
});

// GET /api/reports/member-statements/:memberId - Detailed ledger statement for a member
router.get('/member-statements/:memberId', authenticate, async (req: Request, res: Response) => {
  try {
    const memberId = req.params.memberId as string;
    if (!checkMemberAccess(memberId, req, res)) return;

    const member = await prisma.member.findUnique({
      where: { id: memberId },
      include: {
        memberships: { include: { scheme: true } },
        payments: {
          orderBy: { paymentDate: 'asc' },
          include: { scheme: true },
        },
        payouts: {
          orderBy: { createdAt: 'asc' },
          include: { scheme: true },
        },
      },
    });

    if (!member) {
      res.status(404).json({ success: false, error: 'Member not found' });
      return;
    }

    let runningPaidPaise = 0;
    const ledger = (member as any).payments.map((p: any) => {
      if (p.status === 'SUCCESS') runningPaidPaise += p.amountReceivedPaise;
      return {
        date: p.paymentDate.toISOString(),
        transactionId: p.transactionId,
        receiptNumber: p.receiptNumber,
        schemeName: p.scheme.name,
        roundNumber: p.roundNumber,
        amountReceivedPaise: p.amountReceivedPaise,
        paymentMethod: p.paymentMethod,
        status: p.status,
        runningPaidPaise,
      };
    });

    res.json({
      success: true,
      data: {
        member: {
          id: member.id,
          memberNumber: member.memberNumber,
          fullName: member.fullName,
          phone: member.phone,
          email: member.email,
        },
        totalContributedPaise: runningPaidPaise,
        ledger,
        payouts: (member as any).payouts.map((po: any) => ({
          schemeName: po.scheme.name,
          roundNumber: po.roundNumber,
          grossPayoutPaise: po.grossPayoutPaise,
          deductionsPaise: po.deductionsPaise,
          netPayoutPaise: po.netPayoutPaise,
          disbursedDate: po.disbursedDate ? po.disbursedDate.toISOString() : null,
          approvalStatus: po.approvalStatus,
        })),
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to retrieve member statement' });
  }
});

// GET /api/reports/outstanding-balances - Overdue / pending installments report
router.get('/outstanding-balances', authenticate, requireRole('ADMIN', 'STAFF'), async (req: Request, res: Response) => {
  try {
    const members = await prisma.member.findMany({
      where: { status: 'ACTIVE' },
      include: {
        memberships: {
          where: { scheme: { status: 'ACTIVE' } },
          include: {
            scheme: {
              include: {
                collectionRounds: {
                  where: { dueDate: { lte: new Date() } },
                },
              },
            },
          },
        },
        payments: {
          where: { status: 'SUCCESS' },
        },
      },
    });

    const report: any[] = [];

    for (const m of (members as any[])) {
      let expectedTotalPaise = 0;
      for (const ms of m.memberships) {
        expectedTotalPaise += ms.scheme.collectionRounds.length * ms.scheme.contributionAmountPaise;
      }

      const totalContributedPaise = m.payments.reduce((sum: number, p: any) => sum + p.amountReceivedPaise, 0);
      const pendingPaise = Math.max(0, expectedTotalPaise - totalContributedPaise);

      if (pendingPaise > 0) {
        report.push({
          memberId: m.id,
          memberNumber: m.memberNumber,
          fullName: m.fullName,
          phone: m.phone,
          activeSchemesCount: m.memberships.length,
          totalExpectedPaise: expectedTotalPaise,
          totalContributedPaise,
          outstandingBalancePaise: pendingPaise,
        });
      }
    }

    report.sort((a, b) => b.outstandingBalancePaise - a.outstandingBalancePaise);

    res.json({ success: true, data: report });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to generate outstanding balances report' });
  }
});

export default router;
