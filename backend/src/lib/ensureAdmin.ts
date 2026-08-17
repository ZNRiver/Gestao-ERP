import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { queryOne } from './db.js';

export const ADMIN_EMAIL: string = process.env.ADMIN_EMAIL || 'admin@erp.com';
export const ADMIN_PASSWORD: string = process.env.ADMIN_PASSWORD || 'Admin@123';
export const ADMIN_NAME: string = process.env.ADMIN_NAME || 'Administrador';

/**
 * Cria (ou atualiza) o perfil admin inicial usando as variáveis ADMIN_* do ambiente.
 * É idempotente: se o email já existir, atualiza nome, role e senha.
 * Chamado automaticamente no startup do backend (e pelo script create-admin).
 */
export async function ensureAdmin(): Promise<void> {
  const password_hash = await bcrypt.hash(ADMIN_PASSWORD, 10);

  const profile = await queryOne(
    `INSERT INTO profiles (id, nome, email, role, telefone, password_hash)
     VALUES ($1, $2, $3, 'admin', '(11) 99999-9999', $4)
     ON CONFLICT (email) DO UPDATE SET
       nome = EXCLUDED.nome,
       role = 'admin',
       password_hash = EXCLUDED.password_hash,
       updated_at = now()
     RETURNING id, nome, email, role`,
    [randomUUID(), ADMIN_NAME, ADMIN_EMAIL, password_hash],
  );

  if (!profile) {
    throw new Error('Falha ao criar/atualizar o perfil admin');
  }

  console.log(`[Admin] ✅ Admin inicial pronto: ${profile.email} (role: ${profile.role})`);
}
