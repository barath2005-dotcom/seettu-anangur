import { Router, Request, Response } from 'express';
import { prisma } from '../db';
import { authenticate, requireRole, checkMemberAccess } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { MemberCreateSchema, MemberUpdateSchema } from '@seettu/shared';

const router = Router();

// GET /api/members - List members (Admin & Staff)
router.get('/', authenticate, requireRole('ADMIN', 'STAFF'), async (req: Request, res: Response) => {
  try {
    const { search, status, page = '1', limit = '20' } = req.query;
    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (status && status !== 'ALL') {
      where.status = status;
    }
    if (search) {
      const searchStr = String(search).trim();
      where.OR = [
        { memberNumber: { contains: searchStr } },
        { fullName: { contains: searchStr } },
        { phone: { contains: searchStr } },
        { email: { contains: searchStr } },
      ];
    }

    const [total, members] = await Promise.all([
      prisma.member.count({ where }),
      prisma.member.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { memberNumber: 'asc' },
        include: {
          memberships: {
            include: { scheme: true },
          },
          payments: {
            where: { status: 'SUCCESS' },
          },
        },
      }),
    ]);

    // Format with computed totals
    const formatted = (members as any[]).map((m) => {
      const totalContributedPaise = m.payments.reduce((sum: number, p: any) => sum + p.amountReceivedPaise, 0);
      const activeSchemesCount = m.memberships.filter((ms: any) => ms.scheme.status === 'ACTIVE').length;

      return {
        id: m.id,
        memberNumber: m.memberNumber,
        fullName: m.fullName,
        phone: m.phone,
        email: m.email,
        address: m.address,
        dateJoined: m.dateJoined.toISOString(),
        status: m.status,
        notes: m.notes,
        totalContributedPaise,
        activeSchemesCount,
        createdAt: m.createdAt.toISOString(),
        updatedAt: m.updatedAt.toISOString(),
      };
    });

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
    console.error('List members error:', err);
    res.status(500).json({ success: false, error: 'Failed to retrieve members' });
  }
});

// GET /api/members/export/csv - Export members to CSV (Admin only)
router.get('/export/csv', authenticate, requireRole('ADMIN'), async (req: Request, res: Response) => {
  try {
    const members = await prisma.member.findMany({
      orderBy: { memberNumber: 'asc' },
      include: {
        payments: { where: { status: 'SUCCESS' } },
        memberships: true,
      },
    });

    const headers = ['Member ID,Full Name,Phone,Email,Status,Date Joined,Total Contributed (INR)'];
    const rows = (members as any[]).map((m) => {
      const totalInr = (m.payments.reduce((s: number, p: any) => s + p.amountReceivedPaise, 0) / 100).toFixed(2);
      const date = m.dateJoined.toISOString().split('T')[0];
      return `"${m.memberNumber}","${m.fullName}","${m.phone}","${m.email || ''}","${m.status}","${date}","${totalInr}"`;
    });

    const csvContent = [headers.join('\n'), ...rows].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="seettu-members.csv"');
    res.send(csvContent);
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to export CSV' });
  }
});

// GET /api/members/:id - Get member profile with scheme history & balances
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    if (!checkMemberAccess(id, req, res)) return;

    const member = await prisma.member.findUnique({
      where: { id },
      include: {
        memberships: {
          include: {
            scheme: {
              include: {
                collectionRounds: {
                  orderBy: { roundNumber: 'asc' },
                },
              },
            },
          },
        },
        payments: {
          orderBy: { paymentDate: 'desc' },
          include: { scheme: true },
        },
        payouts: {
          orderBy: { createdAt: 'desc' },
          include: { scheme: true },
        },
      },
    });

    if (!member) {
      res.status(404).json({ success: false, error: 'Member not found' });
      return;
    }

    const typedMember = member as any;
    const totalContributedPaise = typedMember.payments
      .filter((p: any) => p.status === 'SUCCESS')
      .reduce((sum: number, p: any) => sum + p.amountReceivedPaise, 0);

    // Calculate outstanding balance across all active schemes
    let totalExpectedPaise = 0;
    for (const membership of typedMember.memberships) {
      if (membership.scheme.status === 'ACTIVE') {
        const passedRounds = membership.scheme.collectionRounds.filter(
          (r: any) => r.dueDate <= new Date() || r.status !== 'PENDING'
        );
        totalExpectedPaise += passedRounds.length * membership.scheme.contributionAmountPaise;
      }
    }
    const totalPendingPaise = Math.max(0, totalExpectedPaise - totalContributedPaise);

    res.json({
      success: true,
      data: {
        id: typedMember.id,
        memberNumber: typedMember.memberNumber,
        fullName: typedMember.fullName,
        phone: typedMember.phone,
        email: typedMember.email,
        address: typedMember.address,
        dateJoined: typedMember.dateJoined.toISOString(),
        status: typedMember.status,
        notes: typedMember.notes,
        totalContributedPaise,
        totalPendingPaise,
        memberships: typedMember.memberships.map((m: any) => ({
          id: m.id,
          schemeId: m.schemeId,
          schemeName: m.scheme.name,
          schemeCode: m.scheme.code,
          slotNumber: m.slotNumber,
          joinedAt: m.joinedAt.toISOString(),
          hasReceivedPayout: m.hasReceivedPayout,
          contributionAmountPaise: m.scheme.contributionAmountPaise,
          status: m.scheme.status,
        })),
        recentPayments: typedMember.payments.slice(0, 10).map((p: any) => ({
          id: p.id,
          transactionId: p.transactionId,
          receiptNumber: p.receiptNumber,
          schemeName: p.scheme.name,
          roundNumber: p.roundNumber,
          amountReceivedPaise: p.amountReceivedPaise,
          balanceRemainingPaise: p.balanceRemainingPaise,
          paymentDate: p.paymentDate.toISOString(),
          paymentMethod: p.paymentMethod,
          status: p.status,
        })),
        payouts: typedMember.payouts.map((po: any) => ({
          id: po.id,
          schemeName: po.scheme.name,
          roundNumber: po.roundNumber,
          netPayoutPaise: po.netPayoutPaise,
          approvalStatus: po.approvalStatus,
          disbursedDate: po.disbursedDate ? po.disbursedDate.toISOString() : null,
        })),
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to retrieve member details' });
  }
});

// POST /api/members - Create a new member (Admin & Staff)
router.post('/', authenticate, requireRole('ADMIN', 'STAFF'), validateBody(MemberCreateSchema), async (req: Request, res: Response) => {
  try {
    const { memberNumber, fullName, phone, email, address, dateJoined, status, notes } = req.body;

    // Check duplicate memberNumber
    const existing = await prisma.member.findUnique({
      where: { memberNumber: memberNumber.trim() },
    });
    if (existing) {
      res.status(409).json({
        success: false,
        error: `Member ID "${memberNumber}" already exists`,
        code: 'DUPLICATE_MEMBER_ID',
      });
      return;
    }

    const member = await prisma.member.create({
      data: {
        memberNumber: memberNumber.trim().toUpperCase(),
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: email ? email.trim().toLowerCase() : null,
        address: address ? address.trim() : null,
        dateJoined: dateJoined ? new Date(dateJoined) : new Date(),
        status: status || 'ACTIVE',
        notes: notes ? notes.trim() : null,
      },
    });

    // Record audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'CREATE_MEMBER',
        entityType: 'Member',
        entityId: member.id,
        details: JSON.stringify({ memberNumber: member.memberNumber, fullName: member.fullName }),
        ipAddress: req.ip || req.socket.remoteAddress,
      },
    });

    res.status(201).json({
      success: true,
      data: member,
      message: 'Member registered successfully',
    });
  } catch (err: any) {
    console.error('Create member error:', err);
    res.status(500).json({ success: false, error: 'Failed to create member' });
  }
});

// PUT /api/members/:id - Update member (Admin & Staff)
router.put('/:id', authenticate, requireRole('ADMIN', 'STAFF'), validateBody(MemberUpdateSchema), async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const updateData = { ...req.body };
    if (updateData.dateJoined) {
      updateData.dateJoined = new Date(updateData.dateJoined);
    }

    const member = await prisma.member.update({
      where: { id },
      data: updateData,
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'UPDATE_MEMBER',
        entityType: 'Member',
        entityId: member.id,
        details: JSON.stringify(req.body),
        ipAddress: req.ip || req.socket.remoteAddress,
      },
    });

    res.json({
      success: true,
      data: member,
      message: 'Member updated successfully',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to update member' });
  }
});

// POST /api/members/import - CSV Import (Admin only)
router.post('/import', authenticate, requireRole('ADMIN'), async (req: Request, res: Response) => {
  try {
    const { members } = req.body;
    if (!Array.isArray(members) || members.length === 0) {
      res.status(400).json({ success: false, error: 'Invalid members array' });
      return;
    }

    let importedCount = 0;
    const errors: string[] = [];

    for (const item of members) {
      try {
        const exists = await prisma.member.findUnique({
          where: { memberNumber: item.memberNumber },
        });

        if (exists) {
          errors.push(`Member ID ${item.memberNumber} already exists`);
          continue;
        }

        await prisma.member.create({
          data: {
            memberNumber: item.memberNumber.trim().toUpperCase(),
            fullName: item.fullName.trim(),
            phone: item.phone.trim(),
            email: item.email ? item.email.trim().toLowerCase() : null,
            address: item.address ? item.address.trim() : null,
            status: item.status || 'ACTIVE',
          },
        });
        importedCount++;
      } catch (err: any) {
        errors.push(`Failed to import ${item.memberNumber}: ${err.message}`);
      }
    }

    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'IMPORT_MEMBERS',
        entityType: 'Member',
        details: JSON.stringify({ importedCount, errorCount: errors.length }),
        ipAddress: req.ip || req.socket.remoteAddress,
      },
    });

    res.json({
      success: true,
      data: { importedCount, errors },
      message: `Successfully imported ${importedCount} members. ${errors.length} skipped.`,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Import failed' });
  }
});

// DELETE /api/members/:id - Delete single member (Admin & Staff)
router.delete('/:id', authenticate, requireRole('ADMIN', 'STAFF'), async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    const member = await prisma.member.findUnique({
      where: { id },
    });

    if (!member) {
      res.status(404).json({ success: false, error: 'Member not found' });
      return;
    }

    await prisma.$transaction(async (tx) => {
      await tx.user.deleteMany({ where: { memberId: id } });
      await tx.receipt.deleteMany({ where: { memberId: id } });
      await tx.payment.deleteMany({ where: { memberId: id } });
      await tx.payout.deleteMany({ where: { recipientMemberId: id } });
      await tx.schemeMembership.deleteMany({ where: { memberId: id } });
      await tx.member.delete({ where: { id } });

      await tx.auditLog.create({
        data: {
          userId: req.user!.id,
          action: 'DELETE_MEMBER',
          entityType: 'Member',
          entityId: id,
          details: JSON.stringify({ memberNumber: member.memberNumber, fullName: member.fullName }),
          ipAddress: req.ip || req.socket.remoteAddress,
        },
      });
    });

    res.json({
      success: true,
      message: `Member ${member.memberNumber} (${member.fullName}) deleted successfully`,
    });
  } catch (err: any) {
    console.error('Delete member error:', err);
    res.status(500).json({ success: false, error: err.message || 'Failed to delete member' });
  }
});

// POST /api/members/batch-delete - Delete multiple members (Admin & Staff)
router.post('/batch-delete', authenticate, requireRole('ADMIN', 'STAFF'), async (req: Request, res: Response) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      res.status(400).json({ success: false, error: 'No member IDs provided' });
      return;
    }

    let deletedCount = 0;
    for (const memberId of ids as string[]) {
      try {
        const member = await prisma.member.findUnique({
          where: { id: memberId },
        });
        if (member) {
          await prisma.$transaction(async (tx) => {
            await tx.user.deleteMany({ where: { memberId } });
            await tx.receipt.deleteMany({ where: { memberId } });
            await tx.payment.deleteMany({ where: { memberId } });
            await tx.payout.deleteMany({ where: { recipientMemberId: memberId } });
            await tx.schemeMembership.deleteMany({ where: { memberId } });
            await tx.member.delete({ where: { id: memberId } });
          });
          deletedCount++;
        }
      } catch (e) {
        console.error(`Error deleting member ${memberId}:`, e);
      }
    }

    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'BATCH_DELETE_MEMBERS',
        entityType: 'Member',
        details: JSON.stringify({ requested: ids.length, deleted: deletedCount }),
        ipAddress: req.ip || req.socket.remoteAddress,
      },
    });

    res.json({
      success: true,
      message: `Successfully deleted ${deletedCount} member(s)`,
      data: { deletedCount },
    });
  } catch (err: any) {
    console.error('Batch delete error:', err);
    res.status(500).json({ success: false, error: err.message || 'Failed to delete members' });
  }
});

export default router;
