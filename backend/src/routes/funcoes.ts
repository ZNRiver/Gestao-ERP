import { Router, Request, Response, NextFunction } from 'express';
import { funcoesService } from '../services/funcoesService.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/funcoes', requireAuth, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await funcoesService.list();
    res.json({ success: true, data });
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }); }
});

router.post('/funcoes', requireAuth, requireRole('admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { role, nome_exibicao, descricao, permissoes } = req.body;
    if (!role || !nome_exibicao) {
      return res.status(400).json({ success: false, error: 'role e nome_exibicao são obrigatórios' });
    }
    const data = await funcoesService.create({ role, nome_exibicao, descricao, permissoes });
    res.status(201).json({ success: true, data });
  } catch (err: any) { res.status(400).json({ success: false, error: err.message }); }
});

router.put('/funcoes/:role', requireAuth, requireRole('admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await funcoesService.update(req.params.role, req.body);
    res.json({ success: true, data });
  } catch (err: any) { res.status(400).json({ success: false, error: err.message }); }
});

router.delete('/funcoes/:role', requireAuth, requireRole('admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    await funcoesService.remove(req.params.role);
    res.json({ success: true, message: 'Função removida' });
  } catch (err: any) { res.status(400).json({ success: false, error: err.message }); }
});

export default router;
