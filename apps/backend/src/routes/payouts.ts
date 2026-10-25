import { Router, Request, Response } from 'express';
import { prisma } from '../db';
import { authenticate, requireRole, checkMemberAccess } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { PayoutPrepareSchema, PayoutApprovalSchema, PayoutDisburseSchema, formatINR } from '@seettu/shared';

const router = Router();

// GET /api/payouts - List payouts with filtering
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const { schemeId, status, memberId } = req.query;
    const where: any = {};

    if (req.user?.role === 'MEMBER') {
      if (!req.user.memberId) {
        res.json({ success: true, data: [] });
        return;
      }
      where.recipientMemberId = req.user.memberId;
    } else if (memberId) {
      where.recipientMemberId = memberId as string;
    }

    if (schemeId) where.schemeId = schemeId as string;
    if (status && status !== 'ALL') where.approvalStatus = status as string;

    const payouts = await prisma.payout.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        scheme: true,
        recipient: true,
        preparedBy: { select: { id: true, name: true } },
        approvedBy: { select: { id: true, name: true } },
      },
    });

    const formatted = (payouts as any[]).map((p) => ({
      id: p.id,
      schemeId: p.schemeId,
      schemeName: p.scheme.name,
      schemeCode: p.scheme.code,
      roundId: p.roundId,
      roundNumber: p.roundNumber,
      recipientMemberId: p.recipientMemberId,
      recipientName: p.recipient.fullName,
      recipientMemberNumber: p.recipient.memberNumber,
      recipientPhone: p.recipient.phone,
      grossPayoutPaise: p.grossPayoutPaise,
      deductionsPaise: p.deductionsPaise,
      netPayoutPaise: p.netPayoutPaise,
      disbursedDate: p.disbursedDate ? p.disbursedDate.toISOString() : null,
      paymentMethod: p.paymentMethod,
      referenceNumber: p.referenceNumber,
      approvalStatus: p.approvalStatus,
      preparedByName: p.preparedBy.name,
      approvedByName: p.approvedBy?.name,
      approvedAt: p.approvedAt ? p.approvedAt.toISOString() : null,
      rejectionReason: p.rejectionReason,
      notes: p.notes,
      createdAt: p.createdAt.toISOString(),
    }));

    res.json({ success: true, data: formatted });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to retrieve payouts' });
  }
});

// POST /api/payouts/prepare - Prepare payout for a round (Admin & Staff)
router.post('/prepare', authenticate, requireRole('ADMIN', 'STAFF'), validateBody(PayoutPrepareSchema), async (req: Request, res: Response) => {
  try {
    const { schemeId, roundNumber, recipientMemberId, grossPayoutPaise, deductionsPaise, notes } = req.body;

    const round = await prisma.collectionRound.findUnique({
      where: {
        schemeId_roundNumber: { schemeId, roundNumber },
      },
    });

    if (!round) {
      res.status(404).json({ success: false, error: 'Collection round not found' });
      return;
    }

    const membership = await prisma.schemeMembership.findUnique({
      where: {
        schemeId_memberId: { schemeId, memberId: recipientMemberId },
      },
    });

    if (!membership) {
      res.status(400).json({ success: false, error: 'Recipient is not enrolled in this scheme' });
      return;
    }

    if (membership.hasReceivedPayout) {
      res.status(400).json({
        success: false,
        error: `Member has already received a payout in round ${membership.payoutRoundNumber}`,
      });
      return;
    }

    const netPayoutPaise = grossPayoutPaise - (deductionsPaise || 0);
    if (netPayoutPaise <= 0) {
      res.status(400).json({ success: false, error: 'Net payout must be greater than 0' });
      return;
    }

    const payout = await prisma.$transaction(async (tx) => {
      // Create payout record
      const po = await tx.payout.create({
        data: {
          schemeId,
          roundId: round.id,
          roundNumber,
          recipientMemberId,
          grossPayoutPaise,
          deductionsPaise: deductionsPaise || 0,
          netPayoutPaise,
          approvalStatus: 'PENDING_APPROVAL',
          preparedByUserId: req.user!.id,
          notes,
        },
      });

      // Update round
      await tx.collectionRound.update({
        where: { id: round.id },
        data: {
          payoutRecipientMemberId: recipientMemberId,
          grossPayoutPaise,
          deductionsPaise: deductionsPaise || 0,
          netPayoutPaise,
          payoutStatus: 'PENDING_APPROVAL',
        },
      });

      return po;
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'PREPARE_PAYOUT',
        entityType: 'Payout',
        entityId: payout.id,
        details: JSON.stringify({ schemeId, roundNumber, recipientMemberId, netPayoutPaise }),
        ipAddress: req.ip || req.socket.remoteAddress,
      },
    });

    res.status(201).json({
      success: true,
      data: payout,
      message: `Payout prepared for ${formatINR(netPayoutPaise)}. Awaiting Admin approval.`,
    });
  } catch (err: any) {
    console.error('Prepare payout error:', err);
    res.status(500).json({ success: false, error: 'Failed to prepare payout' });
  }
});

// POST /api/payouts/:id/approve - Admin approval or rejection (Admin only)
router.post('/:id/approve', authenticate, requireRole('ADMIN'), validateBody(PayoutApprovalSchema), async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { approved, rejectionReason } = req.body;

    const payout = await prisma.payout.findUnique({
      where: { id },
      include: { round: true, scheme: true, recipient: true },
    });

    if (!payout) {
      res.status(404).json({ success: false, error: 'Payout not found' });
      return;
    }

    if (payout.approvalStatus === 'DISBURSED') {
      res.status(400).json({ success: false, error: 'Payout is already disbursed and cannot be modified' });
      return;
    }

    const newStatus = approved ? 'APPROVED' : 'REJECTED';

    await prisma.$transaction(async (tx) => {
      await tx.payout.update({
        where: { id },
        data: {
          approvalStatus: newStatus,
          approvedByUserId: req.user!.id,
          approvedAt: new Date(),
          rejectionReason: approved ? null : rejectionReason,
        },
      });

      await tx.collectionRound.update({
        where: { id: payout.roundId },
        data: { payoutStatus: newStatus },
      });

      // Member notification
      const memberUser = await tx.user.findFirst({
        where: { memberId: payout.recipientMemberId },
      });
      if (memberUser) {
        await tx.notification.create({
          data: {
            userId: memberUser.id,
            title: approved ? 'Payout Approved!' : 'Payout Review Update',
            message: approved
              ? `Your payout of ${formatINR(payout.netPayoutPaise)} for ${(payout as any).scheme.name} Round #${payout.roundNumber} has been approved.`
              : `Payout review update: ${rejectionReason || 'Rejected'}`,
            type: 'PAYOUT_APPROVED',
          },
        });
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: approved ? 'APPROVE_PAYOUT' : 'REJECT_PAYOUT',
        entityType: 'Payout',
        entityId: payout.id,
        details: JSON.stringify({ approved, rejectionReason, netPayoutPaise: payout.netPayoutPaise }),
        ipAddress: req.ip || req.socket.remoteAddress,
      },
    });

    res.json({
      success: true,
      message: approved ? 'Payout approved successfully. Ready for disbursement.' : 'Payout has been rejected',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to process payout approval' });
  }
});

// POST /api/payouts/:id/disburse - Disburse payout (Admin only)
router.post('/:id/disburse', authenticate, requireRole('ADMIN'), validateBody(PayoutDisburseSchema), async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { paymentMethod, referenceNumber, disbursedDate, notes } = req.body;

    const payout = await prisma.payout.findUnique({
      where: { id },
      include: { round: true, scheme: true, recipient: true },
    });

    if (!payout) {
      res.status(404).json({ success: false, error: 'Payout not found' });
      return;
    }

    if (payout.approvalStatus !== 'APPROVED') {
      res.status(400).json({
        success: false,
        error: `Payout must be in APPROVED status before disbursement. Current status: ${payout.approvalStatus}`,
      });
      return;
    }

    const dDate = disbursedDate ? new Date(disbursedDate) : new Date();

    await prisma.$transaction(async (tx) => {
      await tx.payout.update({
        where: { id },
        data: {
          approvalStatus: 'DISBURSED',
          disbursedDate: dDate,
          paymentMethod,
          referenceNumber,
          notes: notes ? (payout.notes ? `${payout.notes}\n${notes}` : notes) : payout.notes,
        },
      });

      await tx.collectionRound.update({
        where: { id: payout.roundId },
        data: {
          payoutStatus: 'DISBURSED',
          payoutDisbursedAt: dDate,
        },
      });

      // Mark member has received payout
      await tx.schemeMembership.update({
        where: {
          schemeId_memberId: {
            schemeId: payout.schemeId,
            memberId: payout.recipientMemberId,
          },
        },
        data: {
          hasReceivedPayout: true,
          payoutRoundNumber: payout.roundNumber,
        },
      });

      // Notify recipient member
      const memberUser = await tx.user.findFirst({
        where: { memberId: payout.recipientMemberId },
      });
      if (memberUser) {
        await tx.notification.create({
          data: {
            userId: memberUser.id,
            title: 'Payout Disbursed',
            message: `Payout of ${formatINR(payout.netPayoutPaise)} has been disbursed via ${paymentMethod}. Ref: ${referenceNumber}`,
            type: 'PAYOUT_APPROVED',
          },
        });
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'DISBURSE_PAYOUT',
        entityType: 'Payout',
        entityId: payout.id,
        details: JSON.stringify({
          netPayoutPaise: payout.netPayoutPaise,
          paymentMethod,
          referenceNumber,
          recipientMemberNumber: (payout as any).recipient.memberNumber,
        }),
        ipAddress: req.ip || req.socket.remoteAddress,
      },
    });

    res.json({
      success: true,
      message: `Payout of ${formatINR(payout.netPayoutPaise)} disbursed successfully. Ref #${referenceNumber}`,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to disburse payout' });
  }
});

export default router;
