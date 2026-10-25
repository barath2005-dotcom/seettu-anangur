import { Router, Request, Response } from 'express';
import { prisma } from '../db';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

// GET /api/audit - Audit logs report (Admin only)
router.get('/', authenticate, requireRole('ADMIN'), async (req: Request, res: Response) => {
  try {
    const { action, entityType, page = '1', limit = '25' } = req.query;
    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 25;
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (action && action !== 'ALL') where.action = action as string;
    if (entityType && entityType !== 'ALL') where.entityType = entityType as string;

    const [total, logs] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, email: true, role: true } },
        },
      }),
    ]);

    const formatted = logs.map((log) => ({
      id: log.id,
      userId: log.userId,
      userName: log.user?.name || 'System',
      userEmail: log.user?.email || null,
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      details: log.details ? JSON.parse(log.details) : null,
      ipAddress: log.ipAddress,
      createdAt: log.createdAt.toISOString(),
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
    res.status(500).json({ success: false, error: 'Failed to retrieve audit logs' });
  }
});

export default router;
