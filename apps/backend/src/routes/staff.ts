import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../db';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

// GET /api/staff - List all staff & admin users
router.get('/', authenticate, requireRole('ADMIN'), async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      where: { role: { in: ['ADMIN', 'STAFF'] } },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json({
      success: true,
      data: users.map((u) => ({
        ...u,
        createdAt: u.createdAt.toISOString(),
        updatedAt: u.updatedAt.toISOString(),
      })),
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to retrieve staff list' });
  }
});

// POST /api/staff - Create staff account
router.post('/', authenticate, requireRole('ADMIN'), async (req: Request, res: Response) => {
  try {
    const { email, password, name, role, phone } = req.body;

    if (!email || !password || !name) {
      res.status(400).json({ success: false, error: 'Email, password, and name are required' });
      return;
    }

    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existing) {
      res.status(409).json({ success: false, error: 'A user with this email already exists' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        passwordHash,
        name: name.trim(),
        role: role === 'ADMIN' ? 'ADMIN' : 'STAFF',
        phone: phone ? phone.trim() : null,
        isActive: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'CREATE_STAFF',
        entityType: 'User',
        entityId: user.id,
        details: JSON.stringify({ email: user.email, role: user.role }),
        ipAddress: req.ip || req.socket.remoteAddress,
      },
    });

    res.status(201).json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isActive: user.isActive,
      },
      message: 'Staff account created successfully',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to create staff account' });
  }
});

// PATCH /api/staff/:id/status - Toggle active/inactive
router.patch('/:id/status', authenticate, requireRole('ADMIN'), async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { isActive } = req.body;

    if (id === req.user!.id) {
      res.status(400).json({ success: false, error: 'Cannot deactivate your own admin account' });
      return;
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { isActive: Boolean(isActive) },
    });

    res.json({
      success: true,
      message: `Staff user ${updated.name} has been ${updated.isActive ? 'activated' : 'deactivated'}`,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to update staff status' });
  }
});

export default router;
