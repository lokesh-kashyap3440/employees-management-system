import { Router } from 'express';
import type { Response } from 'express';
import { authenticateToken } from '../middleware/auth.ts';
import type { AuthRequest } from '../middleware/auth.ts';
import { getNotifications, clearNotifications } from '../redis.ts';

const router = Router();

/**
 * @swagger
 * /notifications:
 *   get:
 *     summary: Get all stored notifications (Admin only)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of notifications
 *       403:
 *         description: Access denied
 */
router.get('/', authenticateToken as any, async (req: AuthRequest, res: Response) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admins only.' });
  }

  try {
    const notifications = await getNotifications();
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

/**
 * @swagger
 * /notifications:
 *   delete:
 *     summary: Clear all notifications (Admin only)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Notifications cleared
 *       403:
 *         description: Access denied
 */
router.delete('/', authenticateToken as any, async (req: AuthRequest, res: Response) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admins only.' });
  }

  try {
    await clearNotifications();
    res.json({ message: 'Notifications cleared' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to clear notifications' });
  }
});

export default router;
