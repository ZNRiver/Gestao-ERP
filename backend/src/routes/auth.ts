import { Router, Request, Response, NextFunction } from 'express';
import { authService } from '../services/authService.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email e senha são obrigatórios' });
    }
    const result = await authService.login(email, password);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(401).json({ success: false, error: err.message });
  }
});

// GET /api/auth/me
router.get('/me', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const profile = await authService.getProfile(req.user!.sub);
    res.json({ success: true, data: profile });
  } catch (err: any) {
    res.status(404).json({ success: false, error: err.message });
  }
});

// GET /api/auth/profiles (admin only)
router.get('/profiles', requireAuth, requireRole('admin'), async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const profiles = await authService.listProfiles();
    res.json({ success: true, data: profiles });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/auth/setup — cria o primeiro admin (só funciona se não houver admin ainda)
router.post('/users', requireAuth, requireRole('admin'), async (req: Request, res: Response) => {
  try {
    const { nome, email, password, role, colaborador_id } = req.body;
    if (!nome || !email || !password || !role) {
      return res.status(400).json({ success: false, error: 'Nome, email, senha e papel são obrigatórios' });
    }
    const result = await authService.createUser(nome, email, password, role, colaborador_id);
    res.status(201).json({ success: true, data: result });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.delete('/users/:id', requireAuth, requireRole('admin'), async (req: Request, res: Response) => {
  try {
    await authService.deleteProfile(req.params.id);
    res.json({ success: true, message: 'Usuário removido' });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.post('/setup', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, nome } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email e senha obrigatórios' });
    }
    const result = await authService.setupAdmin(email, password, nome || 'Administrador');
    res.status(201).json({ success: true, data: result });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

export default router;