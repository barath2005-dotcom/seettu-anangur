import { Router, Request, Response } from 'express';
import { prisma } from '../db';
import { authenticate } from '../middleware/auth';

const router = Router();

// GET /api/dashboard - Real-time metrics computed directly from database
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const isMember = req.user?.role === 'MEMBER';
    const memberId = req.user?.memberId;

    if (isMember && memberId) {
      // Member-scoped dashboard
      const member = await prisma.member.findUnique({
        where: { id: memberId },
        include: {
          memberships: { include: { scheme: { include: { collectionRounds: true } } } },
          payments: {
            where: { status: 'SUCCESS' },
            orderBy: { paymentDate: 'desc' },
            take: 5,
            include: { scheme: true },
          },
          payouts: {
            orderBy: { createdAt: 'desc' },
            take: 3,
            include: { scheme: true },
          },
        },
      });

      if (!member) {
        res.status(404).json({ success: false, error: 'Member not found' });
        return;
      }

      const totalContributedPaise = member.payments.reduce((sum, p) => sum + p.amountReceivedPaise, 0);

      let totalExpectedPaise = 0;
      const upcomingRounds: any[] = [];

      for (const ms of member.memberships) {
        if (ms.scheme.status === 'ACTIVE') {
          for (const round of ms.scheme.collectionRounds) {
            if (round.dueDate <= new Date() || round.status !== 'PENDING') {
              totalExpectedPaise += ms.scheme.contributionAmountPaise;
            }
            if (round.dueDate >= new Date()) {
              upcomingRounds.push({
                schemeId: ms.scheme.id,
                schemeName: ms.scheme.name,
                roundNumber: round.roundNumber,
                dueDate: round.dueDate.toISOString(),
                amountDuePaise: ms.scheme.contributionAmountPaise,
              });
            }
          }
        }
      }

      const outstandingPaise = Math.max(0, totalExpectedPaise - totalContributedPaise);

      res.json({
        success: true,
        data: {
          isMember: true,
          totalContributedPaise,
          outstandingContributionsPaise: outstandingPaise,
          activeSchemesCount: member.memberships.filter((m) => m.scheme.status === 'ACTIVE').length,
          upcomingRounds: upcomingRounds.slice(0, 5),
          recentTransactions: member.payments.map((p) => ({
            id: p.id,
            transactionId: p.transactionId,
            receiptNumber: p.receiptNumber,
            schemeName: p.scheme.name,
            roundNumber: p.roundNumber,
            amountReceivedPaise: p.amountReceivedPaise,
            paymentDate: p.paymentDate.toISOString(),
            paymentMethod: p.paymentMethod,
            status: p.status,
          })),
          payouts: member.payouts.map((po) => ({
            id: po.id,
            schemeName: po.scheme.name,
            roundNumber: po.roundNumber,
            netPayoutPaise: po.netPayoutPaise,
            approvalStatus: po.approvalStatus,
            disbursedDate: po.disbursedDate ? po.disbursedDate.toISOString() : null,
          })),
        },
      });
      return;
    }

    // Admin & Staff Dashboard - Global metrics
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const [
      totalActiveMembers,
      totalActiveSchemes,
      allSuccessPayments,
      thisMonthRounds,
      allRounds,
      allDisbursedPayouts,
      recentPayments,
      upcomingRounds,
      activeMembers,
    ] = await Promise.all([
      prisma.member.count({ where: { status: 'ACTIVE' } }),
      prisma.scheme.count({ where: { status: 'ACTIVE' } }),
      prisma.payment.findMany({
        where: { status: 'SUCCESS' },
        select: { amountReceivedPaise: true, paymentDate: true },
      }),
      prisma.collectionRound.findMany({
        where: {
          dueDate: { gte: startOfMonth, lte: endOfMonth },
        },
        select: { targetAmountPaise: true, collectedAmountPaise: true },
      }),
      prisma.collectionRound.findMany({
        where: { dueDate: { lte: now } },
        select: { targetAmountPaise: true, collectedAmountPaise: true },
      }),
      prisma.payout.findMany({
        where: { approvalStatus: 'DISBURSED' },
        select: { netPayoutPaise: true, disbursedDate: true },
      }),
      prisma.payment.findMany({
        take: 8,
        orderBy: { paymentDate: 'desc' },
        include: {
          member: true,
          scheme: true,
        },
      }),
      prisma.collectionRound.findMany({
        where: { dueDate: { gte: now } },
        orderBy: { dueDate: 'asc' },
        take: 5,
        include: { scheme: true },
      }),
      prisma.member.findMany({
        where: { status: 'ACTIVE' },
        include: {
          payments: {
            where: {
              status: 'SUCCESS',
              paymentDate: { gte: startOfMonth },
            },
          },
        },
      }),
    ]);

    const totalContributionsCollectedPaise = allSuccessPayments.reduce(
      (sum, p) => sum + p.amountReceivedPaise,
      0
    );

    const contributionsExpectedThisMonthPaise = thisMonthRounds.reduce(
      (sum, r) => sum + r.targetAmountPaise,
      0
    );

    const totalExpectedSoFarPaise = allRounds.reduce((sum, r) => sum + r.targetAmountPaise, 0);
    const totalCollectedSoFarPaise = allRounds.reduce((sum, r) => sum + r.collectedAmountPaise, 0);
    const outstandingContributionsPaise = Math.max(0, totalExpectedSoFarPaise - totalCollectedSoFarPaise);

    const totalPayoutsRecordedPaise = allDisbursedPayouts.reduce((sum, po) => sum + po.netPayoutPaise, 0);

    // Paid vs Pending members in current month
    let paidMembersCount = 0;
    let pendingMembersCount = 0;
    for (const m of activeMembers) {
      if (m.payments.length > 0) {
        paidMembersCount++;
      } else {
        pendingMembersCount++;
      }
    }

    // Monthly Collection Chart (past 6 months)
    const monthlyCollectionChart: any[] = [];
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextMonthDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const monthLabel = monthDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });

      const collectedInMonth = allSuccessPayments
        .filter((p) => p.paymentDate >= monthDate && p.paymentDate < nextMonthDate)
        .reduce((sum, p) => sum + p.amountReceivedPaise, 0);

      const payoutsInMonth = allDisbursedPayouts
        .filter((po) => po.disbursedDate && po.disbursedDate >= monthDate && po.disbursedDate < nextMonthDate)
        .reduce((sum, po) => sum + po.netPayoutPaise, 0);

      monthlyCollectionChart.push({
        month: monthLabel,
        collectedPaise: collectedInMonth,
        expectedPaise: Math.max(collectedInMonth, 50000000), // Target trendline
        payoutsPaise: payoutsInMonth,
      });
    }

    res.json({
      success: true,
      data: {
        totalActiveMembers,
        totalActiveSchemes,
        totalContributionsCollectedPaise,
        contributionsExpectedThisMonthPaise,
        outstandingContributionsPaise,
        totalPayoutsRecordedPaise,
        paidMembersCount,
        pendingMembersCount,
        recentTransactions: recentPayments.map((p) => ({
          id: p.id,
          transactionId: p.transactionId,
          receiptNumber: p.receiptNumber,
          schemeName: p.scheme.name,
          memberName: p.member.fullName,
          memberNumber: p.member.memberNumber,
          roundNumber: p.roundNumber,
          amountReceivedPaise: p.amountReceivedPaise,
          paymentDate: p.paymentDate.toISOString(),
          paymentMethod: p.paymentMethod,
          status: p.status,
        })),
        upcomingCollectionDates: upcomingRounds.map((r) => ({
          schemeId: r.schemeId,
          schemeName: r.scheme.name,
          roundNumber: r.roundNumber,
          dueDate: r.dueDate.toISOString(),
          expectedAmountPaise: r.targetAmountPaise,
          collectedAmountPaise: r.collectedAmountPaise,
        })),
        monthlyCollectionChart,
      },
    });
  } catch (err: any) {
    console.error('Dashboard metrics error:', err);
    res.status(500).json({ success: false, error: 'Failed to compute dashboard metrics' });
  }
});

export default router;
