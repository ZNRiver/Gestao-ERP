import { Router, Request, Response, NextFunction } from 'express';
import { clienteService } from '../services/clienteService.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAuth, async (_req: Request, res: Response, next: NextFunction) => {
  try { res.json({ success: true, data: await clienteService.list() }); }
  catch (err: any) { res.status(500).json({ success: false, error: err.message }); }
});

router.get('/:id', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try { res.json({ success: true, data: await clienteService.getById(req.params.id) }); }
  catch (err: any) { res.status(404).json({ success: false, error: err.message }); }
});

router.post('/', requireAuth, requireRole('admin', 'gerente'), async (req: Request, res: Response, next: NextFunction) => {
  try { res.status(201).json({ success: true, data: await clienteService.create(req.body) }); }
  catch (err: any) { res.status(400).json({ success: false, error: err.message }); }
});

router.put('/:id', requireAuth, requireRole('admin', 'gerente'), async (req: Request, res: Response, next: NextFunction) => {
  try { res.json({ success: true, data: await clienteService.update(req.params.id, req.body) }); }
  catch (err: any) { res.status(400).json({ success: false, error: err.message }); }
});

router.delete('/:id', requireAuth, requireRole('admin', 'gerente'), async (req: Request, res: Response, next: NextFunction) => {
  try { await clienteService.remove(req.params.id); res.json({ success: true }); }
  catch (err: any) { res.status(400).json({ success: false, error: err.message }); }
});

export default router;
