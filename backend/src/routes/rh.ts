import { Router, Request, Response, NextFunction } from 'express';
import { colaboradorService, cargoService } from '../services/colaboradorService.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

// GET /api/rh/colaboradores
router.get('/colaboradores', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await colaboradorService.list();
    res.json({ success: true, data });
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }); }
});

// GET /api/rh/colaboradores/:id
router.get('/colaboradores/:id', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await colaboradorService.getById(req.params.id);
    res.json({ success: true, data });
  } catch (err: any) { res.status(404).json({ success: false, error: err.message }); }
});

// POST /api/rh/colaboradores
router.post('/colaboradores', requireAuth, requireRole('admin', 'gerente'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await colaboradorService.create(req.body);
    res.status(201).json({ success: true, data });
  } catch (err: any) { res.status(400).json({ success: false, error: err.message }); }
});

// PUT /api/rh/colaboradores/:id
router.put('/colaboradores/:id', requireAuth, requireRole('admin', 'gerente'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await colaboradorService.update(req.params.id, req.body);
    res.json({ success: true, data });
  } catch (err: any) { res.status(400).json({ success: false, error: err.message }); }
});

// DELETE /api/rh/colaboradores/:id
router.delete('/colaboradores/:id', requireAuth, requireRole('admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    await colaboradorService.delete(req.params.id);
    res.json({ success: true, message: 'Colaborador removido' });
  } catch (err: any) { res.status(400).json({ success: false, error: err.message }); }
});

// CARGOS
router.get('/cargos', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await cargoService.list();
    res.json({ success: true, data });
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }); }
});

router.post('/cargos', requireAuth, requireRole('admin', 'gerente'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await cargoService.create(req.body);
    res.status(201).json({ success: true, data });
  } catch (err: any) { res.status(400).json({ success: false, error: err.message }); }
});

router.put('/cargos/:id', requireAuth, requireRole('admin', 'gerente'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await cargoService.update(req.params.id, req.body);
    res.json({ success: true, data });
  } catch (err: any) { res.status(400).json({ success: false, error: err.message }); }
});

export default router;
