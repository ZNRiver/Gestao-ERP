import { Router, Request, Response, NextFunction } from 'express';
import { previsaoService } from '../services/previsaoService.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

// GET /api/previsao/cache — retorna cache em memória (instantâneo)
router.get('/cache', requireAuth, async (_req: Request, res: Response) => {
  const cache = previsaoService.obterCache();
  res.json({ success: true, data: cache });
});

// POST /api/previsao/analisar-todos — dispara background e retorna cache imediatamente
router.post('/analisar-todos', requireAuth, requireRole('admin', 'gerente'), async (req: Request, res: Response) => {
  previsaoService.analisarTodosBackground().catch((err: any) =>
    console.error('[Previsao] Erro no background:', err.message)
  );
  const cache = previsaoService.obterCache();
  res.json({ success: true, data: cache });
});

// GET /api/previsao/:produtoId — análise sob demanda de um produto específico
router.get('/:produtoId', requireAuth, requireRole('admin', 'gerente'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await previsaoService.getPrevisao(req.params.produtoId);
    res.json({ success: true, data });
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }); }
});

// GET /api/previsao/eventos/proximos — eventos do cache ou geração sob demanda
router.get('/eventos/proximos', requireAuth, async (_req: Request, res: Response) => {
  try {
    const cache = previsaoService.obterCache();
    if (cache.eventos) return res.json({ success: true, data: cache.eventos });
    const data = await previsaoService.getProximosEventos();
    res.json({ success: true, data });
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }); }
});

// GET /api/previsao/recomendacoes/globais
router.get('/recomendacoes/globais', requireAuth, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await previsaoService.getRecomendacoesGlobais();
    res.json({ success: true, data });
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }); }
});

// GET /api/previsao/recomendacoes/ia
router.get('/recomendacoes/ia', requireAuth, requireRole('admin', 'gerente'), async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await previsaoService.getRecomendacoesIA();
    res.json({ success: true, data });
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }); }
});

export default router;
