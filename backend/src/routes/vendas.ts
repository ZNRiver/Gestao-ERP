import { Router, Request, Response, NextFunction } from 'express';
import { vendaService } from '../services/vendaService.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// GET /api/vendas
router.get('/', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const data = await vendaService.list(limit);
    res.json({ success: true, data });
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }); }
});

// POST /api/vendas
router.post('/', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await vendaService.create(req.body);
    res.status(201).json({ success: true, data });
  } catch (err: any) { res.status(400).json({ success: false, error: err.message }); }
});

// PUT /api/vendas/:id/status
router.put('/:id/status', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = req.body;
    if (!status) return res.status(400).json({ success: false, error: 'Status é obrigatório' });
    const data = await vendaService.updateStatus(req.params.id, status);
    res.json({ success: true, data });
  } catch (err: any) { res.status(400).json({ success: false, error: err.message }); }
});

export default router;
