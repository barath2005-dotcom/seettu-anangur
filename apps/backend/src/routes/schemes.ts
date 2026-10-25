import { Router, Request, Response } from 'express';
import { prisma } from '../db';
import { authenticate, requireRole } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { SchemeCreateSchema, SchemeUpdateSchema, SchemeEnrollMemberSchema } from '@seettu/shared';

const router = Router();

// GET /api/schemes - List all schemes
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const { status, type } = req.query;
    const where: any = {};
    if (status && status !== 'ALL') where.status = status;
    if (type && type !== 'ALL') where.schemeType = type;

    // If member role, list schemes they are enrolled in or all active public schemes
    if (req.user?.role === 'MEMBER' && req.user.memberId) {
      // Find schemes where member is enrolled
      where.memberships = {
        some: { memberId: req.user.memberId },
      };
    }

    const schemes = await prisma.scheme.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        memberships: {
          include: { member: true },
        },
        collectionRounds: {
          orderBy: { roundNumber: 'asc' },
        },
        payments: {
          where: { status: 'SUCCESS' },
        },
      },
    });

    const formatted = (schemes as any[]).map((s) => {
      const totalCollectedPaise = s.payments.reduce((sum: number, p: any) => sum + p.amountReceivedPaise, 0);
      const activeRound = s.collectionRounds.find((r: any) => r.status === 'COLLECTING') ||
        s.collectionRounds.find((r: any) => r.status === 'PENDING') ||
        s.collectionRounds[s.collectionRounds.length - 1];

      return {
        id: s.id,
        code: s.code,
        name: s.name,
        schemeType: s.schemeType,
        startDate: s.startDate.toISOString(),
        endDate: s.endDate.toISOString(),
        totalInstallments: s.totalInstallments,
        frequency: s.frequency,
        contributionAmountPaise: s.contributionAmountPaise,
        totalPoolAmountPaise: s.totalPoolAmountPaise,
        totalMembersCount: s.totalMembersCount,
        organizerCommissionPaise: s.organizerCommissionPaise,
        status: s.status,
        notes: s.notes,
        membersEnrolled: s.memberships.length,
        totalCollectedPaise,
        currentRoundNumber: activeRound ? activeRound.roundNumber : 1,
        createdAt: s.createdAt.toISOString(),
        updatedAt: s.updatedAt.toISOString(),
      };
    });

    res.json({ success: true, data: formatted });
  } catch (err: any) {
    console.error('List schemes error:', err);
    res.status(500).json({ success: false, error: 'Failed to retrieve schemes' });
  }
});

// GET /api/schemes/:id - Detailed scheme view with members and rounds
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const scheme = await prisma.scheme.findUnique({
      where: { id },
      include: {
        memberships: {
          orderBy: { slotNumber: 'asc' },
          include: { member: true },
        },
        collectionRounds: {
          orderBy: { roundNumber: 'asc' },
          include: {
            payoutRecipient: true,
            payouts: true,
          },
        },
        payments: {
          where: { status: 'SUCCESS' },
          include: { member: true },
          orderBy: { paymentDate: 'desc' },
          take: 20,
        },
      },
    });

    if (!scheme) {
      res.status(404).json({ success: false, error: 'Scheme not found' });
      return;
    }

    const typedScheme = scheme as any;
    const totalCollectedPaise = typedScheme.payments.reduce((sum: number, p: any) => sum + p.amountReceivedPaise, 0);

    res.json({
      success: true,
      data: {
        ...typedScheme,
        startDate: typedScheme.startDate.toISOString(),
        endDate: typedScheme.endDate.toISOString(),
        totalCollectedPaise,
        membersEnrolled: typedScheme.memberships.length,
        memberships: typedScheme.memberships.map((m: any) => ({
          id: m.id,
          memberId: m.memberId,
          slotNumber: m.slotNumber,
          joinedAt: m.joinedAt.toISOString(),
          hasReceivedPayout: m.hasReceivedPayout,
          payoutRoundNumber: m.payoutRoundNumber,
          notes: m.notes,
          member: {
            id: m.member.id,
            memberNumber: m.member.memberNumber,
            fullName: m.member.fullName,
            phone: m.member.phone,
            status: m.member.status,
          },
        })),
        collectionRounds: typedScheme.collectionRounds.map((r: any) => ({
          id: r.id,
          roundNumber: r.roundNumber,
          dueDate: r.dueDate.toISOString(),
          targetAmountPaise: r.targetAmountPaise,
          collectedAmountPaise: r.collectedAmountPaise,
          status: r.status,
          payoutRecipientMemberId: r.payoutRecipientMemberId,
          payoutRecipientName: r.payoutRecipient?.fullName,
          grossPayoutPaise: r.grossPayoutPaise,
          deductionsPaise: r.deductionsPaise,
          netPayoutPaise: r.netPayoutPaise,
          payoutStatus: r.payoutStatus,
          payoutDisbursedAt: r.payoutDisbursedAt ? r.payoutDisbursedAt.toISOString() : null,
        })),
        recentPayments: typedScheme.payments.map((p: any) => ({
          id: p.id,
          transactionId: p.transactionId,
          receiptNumber: p.receiptNumber,
          memberName: p.member.fullName,
          memberNumber: p.member.memberNumber,
          roundNumber: p.roundNumber,
          amountReceivedPaise: p.amountReceivedPaise,
          paymentDate: p.paymentDate.toISOString(),
          paymentMethod: p.paymentMethod,
        })),
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to retrieve scheme details' });
  }
});

// POST /api/schemes - Create scheme & auto-generate rounds (Admin only)
router.post('/', authenticate, requireRole('ADMIN'), validateBody(SchemeCreateSchema), async (req: Request, res: Response) => {
  try {
    const {
      code,
      name,
      schemeType,
      startDate,
      totalInstallments,
      frequency,
      contributionAmountPaise,
      totalMembersCount,
      organizerCommissionPaise,
      status,
      notes,
      memberIds,
    } = req.body;

    const existing = await prisma.scheme.findUnique({
      where: { code: code.trim().toUpperCase() },
    });
    if (existing) {
      res.status(409).json({
        success: false,
        error: `Scheme code "${code}" already exists`,
        code: 'DUPLICATE_SCHEME_CODE',
      });
      return;
    }

    const start = new Date(startDate);
    const end = new Date(start);
    if (frequency === 'MONTHLY') {
      end.setMonth(end.getMonth() + totalInstallments);
    } else if (frequency === 'WEEKLY') {
      end.setDate(end.getDate() + totalInstallments * 7);
    } else {
      end.setDate(end.getDate() + totalInstallments);
    }

    const totalPoolAmountPaise = totalMembersCount * contributionAmountPaise;

    // Database transaction to create scheme, collection rounds, and initial enrollments
    const newScheme = await prisma.$transaction(async (tx) => {
      const scheme = await tx.scheme.create({
        data: {
          code: code.trim().toUpperCase(),
          name: name.trim(),
          schemeType,
          startDate: start,
          endDate: end,
          totalInstallments,
          frequency,
          contributionAmountPaise,
          totalPoolAmountPaise,
          totalMembersCount,
          organizerCommissionPaise: organizerCommissionPaise || 0,
          status: status || 'ACTIVE',
          notes: notes ? notes.trim() : null,
        },
      });

      // Create collection rounds
      const roundsData = [];
      for (let i = 1; i <= totalInstallments; i++) {
        const dueDate = new Date(start);
        if (frequency === 'MONTHLY') {
          dueDate.setMonth(dueDate.getMonth() + (i - 1));
        } else if (frequency === 'WEEKLY') {
          dueDate.setDate(dueDate.getDate() + (i - 1) * 7);
        } else {
          dueDate.setDate(dueDate.getDate() + (i - 1));
        }

        roundsData.push({
          schemeId: scheme.id,
          roundNumber: i,
          dueDate,
          targetAmountPaise: totalPoolAmountPaise,
          collectedAmountPaise: 0,
          status: i === 1 ? 'COLLECTING' : 'PENDING',
        });
      }

      await tx.collectionRound.createMany({ data: roundsData });

      // Enroll initial members if provided
      if (Array.isArray(memberIds) && memberIds.length > 0) {
        const membershipsData = memberIds.slice(0, totalMembersCount).map((mId: string, idx: number) => ({
          schemeId: scheme.id,
          memberId: mId,
          slotNumber: idx + 1,
        }));
        await tx.schemeMembership.createMany({ data: membershipsData });
      }

      return scheme;
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'CREATE_SCHEME',
        entityType: 'Scheme',
        entityId: newScheme.id,
        details: JSON.stringify({ code: newScheme.code, name: newScheme.name }),
        ipAddress: req.ip || req.socket.remoteAddress,
      },
    });

    res.status(201).json({
      success: true,
      data: newScheme,
      message: 'Scheme created and collection rounds initialized successfully',
    });
  } catch (err: any) {
    console.error('Create scheme error:', err);
    res.status(500).json({ success: false, error: 'Failed to create scheme' });
  }
});

// POST /api/schemes/:id/enroll - Enroll a member into a slot (Admin only)
router.post('/:id/enroll', authenticate, requireRole('ADMIN'), validateBody(SchemeEnrollMemberSchema), async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { memberId, slotNumber, notes } = req.body;

    const scheme = await prisma.scheme.findUnique({
      where: { id },
      include: { memberships: true },
    });

    if (!scheme) {
      res.status(404).json({ success: false, error: 'Scheme not found' });
      return;
    }

    const typedScheme = scheme as any;
    if (typedScheme.memberships.length >= typedScheme.totalMembersCount) {
      res.status(400).json({
        success: false,
        error: `Scheme is already full (${typedScheme.totalMembersCount} / ${typedScheme.totalMembersCount} members enrolled)`,
      });
      return;
    }

    // Determine slot number
    const occupiedSlots = new Set(typedScheme.memberships.map((m: any) => m.slotNumber));
    let assignedSlot = slotNumber;
    if (!assignedSlot || occupiedSlots.has(assignedSlot)) {
      for (let s = 1; s <= typedScheme.totalMembersCount; s++) {
        if (!occupiedSlots.has(s)) {
          assignedSlot = s;
          break;
        }
      }
    }

    const membership = await prisma.schemeMembership.create({
      data: {
        schemeId: id,
        memberId,
        slotNumber: assignedSlot,
        notes,
      },
      include: { member: true },
    });

    const typedMembership = membership as any;

    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'ENROLL_MEMBER',
        entityType: 'SchemeMembership',
        entityId: membership.id,
        details: JSON.stringify({ schemeCode: scheme.code, memberNumber: typedMembership.member.memberNumber, slotNumber: assignedSlot }),
        ipAddress: req.ip || req.socket.remoteAddress,
      },
    });

    res.status(201).json({
      success: true,
      data: membership,
      message: `Enrolled ${typedMembership.member.fullName} at Slot #${assignedSlot}`,
    });
  } catch (err: any) {
    if (err.code === 'P2002') {
      res.status(409).json({ success: false, error: 'Member is already enrolled in this scheme or slot is occupied' });
      return;
    }
    res.status(500).json({ success: false, error: 'Failed to enroll member' });
  }
});

// DELETE /api/schemes/:id/members/:memberId - Remove member enrollment (Admin only)
router.delete('/:id/members/:memberId', authenticate, requireRole('ADMIN'), async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const memberId = req.params.memberId as string;

    // Check if member already has recorded payments for this scheme
    const paymentCount = await prisma.payment.count({
      where: { schemeId: id, memberId },
    });

    if (paymentCount > 0) {
      res.status(400).json({
        success: false,
        error: 'Cannot unenroll member: Member already has recorded payments in this scheme.',
      });
      return;
    }

    await prisma.schemeMembership.deleteMany({
      where: { schemeId: id, memberId },
    });

    res.json({ success: true, message: 'Member unenrolled from scheme' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to unenroll member' });
  }
});

// PUT /api/schemes/:id - Update scheme (Admin only)
router.put('/:id', authenticate, requireRole('ADMIN'), validateBody(SchemeUpdateSchema), async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const updateData = { ...req.body };
    delete updateData.memberIds;
    if (updateData.startDate) updateData.startDate = new Date(updateData.startDate);

    const scheme = await prisma.scheme.update({
      where: { id },
      data: updateData,
    });

    res.json({ success: true, data: scheme, message: 'Scheme updated successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to update scheme' });
  }
});

export default router;
