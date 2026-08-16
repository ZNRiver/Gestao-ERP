// ============================================================
// Script: Criar primeiro Admin (1 clique)
// Uso: bun run createadmin
// ============================================================
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import dotenv from 'dotenv';
import { queryOne } from '../lib/db.js';
import { runMigrations } from '../db/migrate.js';

dotenv.config();

const ADMIN_EMAIL: string = process.env.ADMIN_EMAIL || 'admin@erp.com';
const ADMIN_PASSWORD: string = process.env.ADMIN_PASSWORD || 'Admin@123';
const ADMIN_NAME: string = process.env.ADMIN_NAME || 'Administrador';

async function createAdmin(): Promise<void> {
  console.log(`\n🔧 Criando admin: ${ADMIN_EMAIL}...\n`);

  await runMigrations();

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
    console.error('❌ Erro ao criar perfil admin');
    process.exit(1);
  }

  console.log('✅ Perfil admin criado/atualizado na tabela profiles');
  console.log(`\n🚀 Tudo pronto! Faça login com:`);
  console.log(`   Email....: ${ADMIN_EMAIL}`);
  console.log(`   Senha....: ${ADMIN_PASSWORD}`);
  console.log(`   Role.....: admin\n`);
  process.exit(0);
}

createAdmin().catch((err) => {
  console.error('❌ Erro:', err.message);
  process.exit(1);
});
