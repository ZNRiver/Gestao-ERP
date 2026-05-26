import { Router, Request, Response, NextFunction } from 'express';
import { produtoService, categoriaService, movimentacaoService } from '../services/estoqueService.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

// PRODUTOS
router.get('/produtos', requireAuth, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await produtoService.list();
    res.json({ success: true, data });
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }); }
});

router.post('/produtos', requireAuth, requireRole('admin', 'gerente'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await produtoService.create(req.body);
    res.status(201).json({ success: true, data });
  } catch (err: any) { res.status(400).json({ success: false, error: err.message }); }
});

router.put('/produtos/:id', requireAuth, requireRole('admin', 'gerente'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await produtoService.update(req.params.id, req.body);
    res.json({ success: true, data });
  } catch (err: any) { res.status(400).json({ success: false, error: err.message }); }
});

router.delete('/produtos/:id', requireAuth, requireRole('admin', 'gerente'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    await produtoService.delete(req.params.id);
    res.json({ success: true });
  } catch (err: any) { res.status(400).json({ success: false, error: err.message }); }
});

// CATEGORIAS
router.get('/categorias', requireAuth, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await categoriaService.list();
    res.json({ success: true, data });
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }); }
});

router.post('/categorias', requireAuth, requireRole('admin', 'gerente'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await categoriaService.create(req.body);
    res.status(201).json({ success: true, data });
  } catch (err: any) { res.status(400).json({ success: false, error: err.message }); }
});

router.put('/categorias/:id', requireAuth, requireRole('admin', 'gerente'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await categoriaService.update(req.params.id, req.body);
    res.json({ success: true, data });
  } catch (err: any) { res.status(400).json({ success: false, error: err.message }); }
});

router.delete('/categorias/:id', requireAuth, requireRole('admin', 'gerente'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    await categoriaService.delete(req.params.id);
    res.json({ success: true });
  } catch (err: any) { res.status(400).json({ success: false, error: err.message }); }
});

// MOVIMENTAÇÕES
router.get('/movimentacoes', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const data = await movimentacaoService.list(limit);
    res.json({ success: true, data });
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }); }
});

router.post('/movimentacoes', requireAuth, requireRole('admin', 'gerente'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await movimentacaoService.create(req.body);
    res.status(201).json({ success: true, data });
  } catch (err: any) { res.status(400).json({ success: false, error: err.message }); }
});

export default router;
