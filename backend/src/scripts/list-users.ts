import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { query } from '../lib/db.js';
import { runMigrations } from '../db/migrate.js';

dotenv.config();

async function listUsers() {
  console.log('\n═══════════════════════════════════════════════');
  console.log('  LISTAGEM DE USUÁRIOS');
  console.log('═══════════════════════════════════════════════\n');

  await runMigrations();

  console.log('📋 PERFIS NA TABELA profiles:');
  console.log('──────────────────────────────────────');

  const profiles = await query<{
    id: string;
    nome: string;
    email: string;
    role: string;
    telefone: string | null;
    created_at: string;
  }>(`SELECT id, nome, email, role, telefone, created_at FROM profiles ORDER BY created_at DESC`);

  if (profiles.length === 0) {
    console.log('   Nenhum perfil encontrado na tabela profiles.');
  } else {
    for (const p of profiles) {
      console.log(`   ID: ${p.id}`);
      console.log(`   Nome: ${p.nome}`);
      console.log(`   Email: ${p.email}`);
      console.log(`   Role: ${p.role}`);
      console.log(`   Telefone: ${p.telefone || '-'}`);
      console.log(`   Criado em: ${p.created_at}`);
      console.log('');
    }
    console.log(`   Total na tabela profiles: ${profiles.length}`);
  }

  // Teste de login com as credenciais do .env
  const testEmail = process.env.ADMIN_EMAIL;
  const testPass = process.env.ADMIN_PASSWORD;

  if (testEmail && testPass) {
    console.log('\n🧪 TESTE DE LOGIN:');
    console.log('──────────────────────────────────────');
    console.log(`   Tentando login com: ${testEmail}`);

    const row = await query<{ email: string; nome: string; role: string; password_hash: string }>(
      `SELECT email, nome, role, password_hash FROM profiles WHERE email = $1`,
      [testEmail],
    );

    if (row.length === 0) {
      console.log('   ❌ Usuário não encontrado no banco.');
    } else {
      const ok = await bcrypt.compare(testPass, row[0].password_hash);
      if (ok) {
        console.log(`   ✅ Login bem-sucedido: ${row[0].nome} (role: ${row[0].role})`);
      } else {
        console.log('   ❌ Senha incorreta.');
      }
    }
  }

  console.log('\n═══════════════════════════════════════════════\n');
  process.exit(0);
}

listUsers().catch((err) => {
  console.error('❌ Erro:', err.message);
  process.exit(1);
});
