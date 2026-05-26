import { Router, Request, Response, NextFunction } from 'express';
import { pontoService, faltasService } from '../services/colaboradorService.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// GET /api/rh/ponto/:colaboradorId?mes=YYYY-MM
router.get('/ponto/:colaboradorId', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const mes = (req.query.mes as string) || new Date().toISOString().slice(0, 7);
    const data = await pontoService.listByColaborador(req.params.colaboradorId, mes);
    res.json({ success: true, data });
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }); }
});

// POST /api/rh/ponto
router.post('/ponto', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { colaborador_id, tipo } = req.body;
    const data = await pontoService.baterPonto(colaborador_id, tipo);
    res.json({ success: true, data });
  } catch (err: any) { res.status(400).json({ success: false, error: err.message }); }
});

// PUT /api/rh/ponto/:id — editar horários de um registro de ponto
router.put('/ponto/:id', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await pontoService.updateRegistroPonto(req.params.id, req.body);
    res.json({ success: true, data });
  } catch (err: any) { res.status(400).json({ success: false, error: err.message }); }
});

// GET /api/rh/faltas
router.get('/faltas', requireAuth, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await faltasService.list();
    res.json({ success: true, data });
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }); }
});

// POST /api/rh/faltas
router.post('/faltas', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await faltasService.create(req.body);
    res.status(201).json({ success: true, data });
  } catch (err: any) { res.status(400).json({ success: false, error: err.message }); }
});

// PUT /api/rh/faltas/:id/abonar
router.put('/faltas/:id/abonar', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await faltasService.toggleAbonada(req.params.id);
    res.json({ success: true, data });
  } catch (err: any) { res.status(400).json({ success: false, error: err.message }); }
});

export default router;
