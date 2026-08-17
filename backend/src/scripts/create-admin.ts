// ============================================================
// Script: Criar/atualizar Admin (1 clique)
// Uso: bun run createadmin
// Nota: o backend já cria o admin automaticamente no startup;
// este script existe como fallback manual.
// ============================================================
import dotenv from 'dotenv';
import { runMigrations } from '../db/migrate.js';
import { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME, ensureAdmin } from '../lib/ensureAdmin.js';

dotenv.config();

async function createAdmin(): Promise<void> {
  console.log(`\n🔧 Garantindo admin: ${ADMIN_EMAIL}...\n`);

  await runMigrations();
  await ensureAdmin();

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
