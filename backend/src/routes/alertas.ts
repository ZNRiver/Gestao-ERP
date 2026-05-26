import { Router, Request, Response, NextFunction } from 'express';
import { alertaService } from '../services/alertaService.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

// GET /api/alertas
router.get('/', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const data = await alertaService.list(limit);
    res.json({ success: true, data });
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }); }
});

// PUT /api/alertas/:id/lido
router.put('/:id/lido', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await alertaService.marcarLido(req.params.id);
    res.json({ success: true, data });
  } catch (err: any) { res.status(400).json({ success: false, error: err.message }); }
});

// PUT /api/alertas/todos/lidos
router.put('/todos/lidos', requireAuth, requireRole('admin', 'gerente'), async (_req: Request, res: Response, next: NextFunction) => {
  try {
    await alertaService.marcarTodosLidos();
    res.json({ success: true, message: 'Todos alertas marcados como lidos' });
  } catch (err: any) { res.status(400).json({ success: false, error: err.message }); }
});

export default router;