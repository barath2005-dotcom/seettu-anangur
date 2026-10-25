import { Router, Request, Response } from 'express';
import { prisma } from '../db';
import { authenticate } from '../middleware/auth';

const router = Router();

// GET /api/notifications - User's notifications
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const unreadCount = await prisma.notification.count({
      where: { userId: req.user!.id, isRead: false },
    });

    res.json({
      success: true,
      data: notifications.map((n) => ({
        id: n.id,
        title: n.title,
        message: n.message,
        type: n.type,
        isRead: n.isRead,
        linkUrl: n.linkUrl,
        createdAt: n.createdAt.toISOString(),
      })),
      unreadCount,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to retrieve notifications' });
  }
});

// PATCH /api/notifications/:id/read - Mark as read
router.patch('/:id/read', authenticate, async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    await prisma.notification.updateMany({
      where: { id, userId: req.user!.id },
      data: { isRead: true },
    });

    res.json({ success: true, message: 'Notification marked as read' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to update notification' });
  }
});

// POST /api/notifications/read-all - Mark all as read
router.post('/read-all', authenticate, async (req: Request, res: Response) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user!.id, isRead: false },
      data: { isRead: true },
    });

    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to mark notifications as read' });
  }
});

export default router;
