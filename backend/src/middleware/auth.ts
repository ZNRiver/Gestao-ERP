import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JwtPayload, UserRole } from '../types/index.js';

const getJwtSecret = () => process.env.JWT_SECRET || 'dev-secret-change-me';

// Extende o Request para incluir o usuário autenticado
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

/** Middleware que exige autenticação */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Token de autenticação não informado' });
  }

  try {
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, getJwtSecret()) as JwtPayload;
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ success: false, error: 'Token inválido ou expirado' });
  }
}

/** Middleware que exige uma role mínima */
export function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Não autenticado' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, error: 'Acesso negado: permissão insuficiente' });
    }
    next();
  };
}

/** Middleware opcional – popula req.user se token presente, mas não bloqueia */
export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    try {
      const token = header.split(' ')[1];
      req.user = jwt.verify(token, getJwtSecret()) as JwtPayload;
    } catch { /* token inválido, segue sem user */ }
  }
  next();
}
