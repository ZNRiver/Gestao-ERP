import { Router, Request, Response, NextFunction } from 'express';
import { fornecedorService } from '../services/fornecedorService.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAuth, async (_req: Request, res: Response, next: NextFunction) => {
  try { res.json({ success: true, data: await fornecedorService.list() }); }
  catch (err: any) { res.status(500).json({ success: false, error: err.message }); }
});

router.get('/:id', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try { res.json({ success: true, data: await fornecedorService.getById(req.params.id) }); }
  catch (err: any) { res.status(404).json({ success: false, error: err.message }); }
});

router.post('/', requireAuth, requireRole('admin', 'gerente'), async (req: Request, res: Response, next: NextFunction) => {
  try { res.status(201).json({ success: true, data: await fornecedorService.create(req.body) }); }
  catch (err: any) { res.status(400).json({ success: false, error: err.message }); }
});

router.put('/:id', requireAuth, requireRole('admin', 'gerente'), async (req: Request, res: Response, next: NextFunction) => {
  try { res.json({ success: true, data: await fornecedorService.update(req.params.id, req.body) }); }
  catch (err: any) { res.status(400).json({ success: false, error: err.message }); }
});

router.delete('/:id', requireAuth, requireRole('admin', 'gerente'), async (req: Request, res: Response, next: NextFunction) => {
  try { await fornecedorService.remove(req.params.id); res.json({ success: true }); }
  catch (err: any) { res.status(400).json({ success: false, error: err.message }); }
});

export default router;
