import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { query } from '../lib/db.js';

dotenv.config();

async function debugLogin() {
  const email = process.env.ADMIN_EMAIL || 'admin@erp.com';
  const password = process.env.ADMIN_PASSWORD || 'Admin@123';

  console.log(`Testando login com ${email}...\n`);

  const row = await query<{ id: string; email: string; nome: string; role: string; password_hash: string }>(
    `SELECT id, email, nome, role, password_hash FROM profiles WHERE email = $1`,
    [email],
  );

  if (row.length === 0) {
    console.log(`❌ Nenhum usuário com email ${email} no banco.`);
    return;
  }

  const profile = row[0];
  console.log(`✅ Usuário encontrado: ${profile.nome} (role: ${profile.role})`);
  console.log(`   id: ${profile.id}`);

  const senhaOk = await bcrypt.compare(password, profile.password_hash);
  if (senhaOk) {
    console.log('✅ Senha válida');
  } else {
    console.log('❌ Senha inválida');
  }

  console.log('\n📋 Todos os profiles:');
  const all = await query(`SELECT id, nome, email, role FROM profiles`);
  console.log(JSON.stringify(all, null, 2));
}

debugLogin().catch(console.error);
