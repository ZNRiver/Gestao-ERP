import { Router, Request, Response, NextFunction } from 'express';
import { dashboardService } from '../services/dashboardService.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

// GET /api/dashboard
router.get('/', requireAuth, requireRole('admin', 'gerente', 'supervisor'), async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await dashboardService.getDashboard();
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;