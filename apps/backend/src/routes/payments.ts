import { Router, Request, Response } from 'express';
import { prisma } from '../db';
import { authenticate, requireRole, checkMemberAccess } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import {
  RecordPaymentSchema,
  PaymentReversalSchema,
  generateReceiptNumber,
  generateTransactionId,
  formatINR,
} from '@seettu/shared';

const router = Router();

// GET /api/payments - Payments ledger with filtering and pagination
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const { schemeId, memberId, roundNumber, status, method, startDate, endDate, page = '1', limit = '20' } = req.query;
    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    // Role-based scoping: Members can only see their own payments
    if (req.user?.role === 'MEMBER') {
      if (!req.user.memberId) {
        res.json({ success: true, data: [], pagination: { page: 1, limit: limitNum, total: 0, totalPages: 0 } });
        return;
      }
      where.memberId = req.user.memberId;
    } else if (memberId) {
      where.memberId = memberId as string;
    }

    if (schemeId) where.schemeId = schemeId as string;
    if (roundNumber) where.roundNumber = parseInt(roundNumber as string, 10);
    if (status && status !== 'ALL') where.status = status as string;
    if (method && method !== 'ALL') where.paymentMethod = method as string;
    if (startDate || endDate) {
      where.paymentDate = {};
      if (startDate) where.paymentDate.gte = new Date(startDate as string);
      if (endDate) where.paymentDate.lte = new Date(endDate as string);
    }

    const [total, payments] = await Promise.all([
      prisma.payment.count({ where }),
      prisma.payment.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { paymentDate: 'desc' },
        include: {
          member: true,
          scheme: true,
          recordedBy: { select: { id: true, name: true, email: true } },
          receipt: true,
        },
      }),
    ]);

    const formatted = (payments as any[]).map((p) => ({
      id: p.id,
      transactionId: p.transactionId,
      receiptNumber: p.receiptNumber,
      schemeId: p.schemeId,
      schemeName: p.scheme.name,
      schemeCode: p.scheme.code,
      memberId: p.memberId,
      memberName: p.member.fullName,
      memberNumber: p.member.memberNumber,
      roundNumber: p.roundNumber,
      amountDuePaise: p.amountDuePaise,
      amountReceivedPaise: p.amountReceivedPaise,
      balanceRemainingPaise: p.balanceRemainingPaise,
      paymentDate: p.paymentDate.toISOString(),
      paymentMethod: p.paymentMethod,
      externalReference: p.externalReference,
      recordedByUserId: p.recordedByUserId,
      recordedByName: p.recordedBy.name,
      status: p.status,
      idempotencyKey: p.idempotencyKey,
      notes: p.notes,
      reversedAt: p.reversedAt ? p.reversedAt.toISOString() : null,
      reversedReason: p.reversedReason,
      createdAt: p.createdAt.toISOString(),
    }));

    res.json({
      success: true,
      data: formatted,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (err: any) {
    console.error('List payments error:', err);
    res.status(500).json({ success: false, error: 'Failed to retrieve payment records' });
  }
});

// GET /api/payments/:id - Get single payment receipt
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        member: true,
        scheme: true,
        recordedBy: { select: { id: true, name: true, email: true } },
        receipt: true,
      },
    });

    if (!payment) {
      res.status(404).json({ success: false, error: 'Payment not found' });
      return;
    }

    if (!checkMemberAccess(payment.memberId, req, res)) return;

    res.json({
      success: true,
      data: {
        ...payment,
        paymentDate: payment.paymentDate.toISOString(),
        createdAt: payment.createdAt.toISOString(),
        updatedAt: payment.updatedAt.toISOString(),
        reversedAt: payment.reversedAt ? payment.reversedAt.toISOString() : null,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to retrieve payment' });
  }
});

// POST /api/payments - Record a full or partial payment (Admin & Staff)
router.post('/', authenticate, requireRole('ADMIN', 'STAFF'), validateBody(RecordPaymentSchema), async (req: Request, res: Response) => {
  try {
    const {
      memberId,
      schemeId,
      roundNumber,
      amountReceivedPaise,
      paymentDate,
      paymentMethod,
      externalReference,
      idempotencyKey,
      notes,
    } = req.body;

    // Idempotency check: if key already exists, return existing payment
    if (idempotencyKey) {
      const existingPayment = await prisma.payment.findUnique({
        where: { idempotencyKey },
        include: { member: true, scheme: true },
      });
      if (existingPayment) {
        res.status(200).json({
          success: true,
          data: existingPayment,
          message: 'Payment already recorded (idempotent replay)',
        });
        return;
      }
    }

    // Verify scheme and membership
    const scheme = await prisma.scheme.findUnique({
      where: { id: schemeId },
      include: {
        memberships: { where: { memberId } },
        collectionRounds: { where: { roundNumber } },
      },
    });

    if (!scheme) {
      res.status(404).json({ success: false, error: 'Scheme not found' });
      return;
    }

    if ((scheme as any).memberships.length === 0) {
      res.status(400).json({
        success: false,
        error: 'Member is not enrolled in this scheme',
      });
      return;
    }

    if ((scheme as any).collectionRounds.length === 0) {
      res.status(400).json({
        success: false,
        error: `Round ${roundNumber} does not exist for this scheme`,
      });
      return;
    }

    const collectionRound = (scheme as any).collectionRounds[0];

    // Compute previous payments for this member & round
    const existingRoundPayments = await prisma.payment.findMany({
      where: {
        schemeId,
        memberId,
        roundNumber,
        status: 'SUCCESS',
      },
    });

    const totalAlreadyPaidPaise = existingRoundPayments.reduce((sum, p) => sum + p.amountReceivedPaise, 0);
    const amountDuePaise = Math.max(0, scheme.contributionAmountPaise - totalAlreadyPaidPaise);

    if (amountDuePaise <= 0) {
      res.status(400).json({
        success: false,
        error: `Installment round ${roundNumber} is already fully paid for this member`,
      });
      return;
    }

    const balanceRemainingPaise = Math.max(0, amountDuePaise - amountReceivedPaise);

    const receiptNumber = generateReceiptNumber();
    const transactionId = generateTransactionId();
    const pDate = paymentDate ? new Date(paymentDate) : new Date();

    // Execute atomic database transaction
    const result = await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          transactionId,
          receiptNumber,
          schemeId,
          memberId,
          roundNumber,
          amountDuePaise,
          amountReceivedPaise,
          balanceRemainingPaise,
          paymentDate: pDate,
          paymentMethod,
          externalReference: externalReference ? externalReference.trim() : null,
          recordedByUserId: req.user!.id,
          status: 'SUCCESS',
          idempotencyKey: idempotencyKey || null,
          notes: notes ? notes.trim() : null,
        },
        include: {
          member: true,
          scheme: true,
        },
      });

      // Create formal receipt
      await tx.receipt.create({
        data: {
          receiptNumber,
          paymentId: payment.id,
          memberId,
          schemeId,
          amountPaise: amountReceivedPaise,
        },
      });

      // Update collection round collected amount
      const updatedCollected = collectionRound.collectedAmountPaise + amountReceivedPaise;
      const roundStatus = updatedCollected >= collectionRound.targetAmountPaise ? 'COMPLETED' : 'COLLECTING';

      await tx.collectionRound.update({
        where: { id: collectionRound.id },
        data: {
          collectedAmountPaise: updatedCollected,
          status: roundStatus,
        },
      });

      // If member has linked user account, create notification
      const memberUser = await tx.user.findFirst({
        where: { memberId },
      });

      if (memberUser) {
        await tx.notification.create({
          data: {
            userId: memberUser.id,
            title: 'Payment Received',
            message: `Received ${formatINR(amountReceivedPaise)} for Round ${roundNumber} in ${scheme.name}. Receipt: ${receiptNumber}`,
            type: 'PAYMENT_RECEIVED',
          },
        });
      }

      return payment;
    });

    // Record audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'RECORD_PAYMENT',
        entityType: 'Payment',
        entityId: result.id,
        details: JSON.stringify({
          receiptNumber: result.receiptNumber,
          transactionId: result.transactionId,
          amountReceivedPaise,
          memberId,
          schemeId,
          roundNumber,
          paymentMethod,
        }),
        ipAddress: req.ip || req.socket.remoteAddress,
      },
    });

    res.status(201).json({
      success: true,
      data: result,
      message: `Payment of ${formatINR(amountReceivedPaise)} recorded successfully. Receipt #${receiptNumber}`,
    });
  } catch (err: any) {
    console.error('Record payment error:', err);
    res.status(500).json({ success: false, error: 'Failed to record payment' });
  }
});

// POST /api/payments/:id/reverse - Audited reversal of a posted payment (Admin only)
router.post('/:id/reverse', authenticate, requireRole('ADMIN'), validateBody(PaymentReversalSchema), async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { reason } = req.body;

    const payment = await prisma.payment.findUnique({
      where: { id },
      include: { scheme: true, member: true },
    });

    if (!payment) {
      res.status(404).json({ success: false, error: 'Payment not found' });
      return;
    }

    if (payment.status === 'REVERSED') {
      res.status(400).json({ success: false, error: 'Payment is already reversed' });
      return;
    }

    const round = await prisma.collectionRound.findUnique({
      where: {
        schemeId_roundNumber: {
          schemeId: payment.schemeId,
          roundNumber: payment.roundNumber,
        },
      },
    });

    await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id },
        data: {
          status: 'REVERSED',
          reversedAt: new Date(),
          reversedReason: reason.trim(),
        },
      });

      if (round) {
        const newCollected = Math.max(0, round.collectedAmountPaise - payment.amountReceivedPaise);
        await tx.collectionRound.update({
          where: { id: round.id },
          data: {
            collectedAmountPaise: newCollected,
            status: newCollected >= round.targetAmountPaise ? 'COMPLETED' : 'COLLECTING',
          },
        });
      }

      // Member notification
      const memberUser = await tx.user.findFirst({
        where: { memberId: payment.memberId },
      });
      if (memberUser) {
        await tx.notification.create({
          data: {
            userId: memberUser.id,
            title: 'Payment Reversal Notice',
            message: `Payment of ${formatINR(payment.amountReceivedPaise)} (Receipt: ${payment.receiptNumber}) has been reversed. Reason: ${reason}`,
            type: 'ANNOUNCEMENT',
          },
        });
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'REVERSE_PAYMENT',
        entityType: 'Payment',
        entityId: payment.id,
        details: JSON.stringify({
          receiptNumber: payment.receiptNumber,
          amountReversedPaise: payment.amountReceivedPaise,
          reason,
        }),
        ipAddress: req.ip || req.socket.remoteAddress,
      },
    });

    res.json({
      success: true,
      message: `Payment #${payment.receiptNumber} reversed successfully`,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to reverse payment' });
  }
});

export default router;
