// ============================================================
// Script: Criar primeiro Admin (1 clique)
// Uso: node scripts/create-admin.ts
// ============================================================
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Definição dos tipos
interface UserMetadata {
  nome: string;
}

interface AdminUser {
  id: string;
  email: string;
  user_metadata: UserMetadata;
}

interface AdminResponse {
  user: AdminUser;
}

interface ProfileData {
  id: string;
  nome: string;
  email: string;
  role: 'admin';
  telefone: string;
}

// Verifica variáveis de ambiente
const SUPABASE_URL: string | undefined = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY: string | undefined = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Configure SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env');
  process.exit(1);
}

const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const ADMIN_EMAIL: string = process.env.ADMIN_EMAIL || 'admin@erp.com';
const ADMIN_PASSWORD: string = process.env.ADMIN_PASSWORD || 'Admin@123';
const ADMIN_NAME: string = process.env.ADMIN_NAME || 'Administrador';

async function createAdmin(): Promise<void> {
  console.log(`\n🔧 Criando admin: ${ADMIN_EMAIL}...\n`);

  // 1. Cria o usuário no Auth
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    email_confirm: true,
    user_metadata: { nome: ADMIN_NAME }
  });

  if (authError) {
    console.error('❌ Erro ao criar usuário:', authError.message);
    process.exit(1);
  }

  if (!authData.user) {
    console.error('❌ Erro: Nenhum usuário retornado');
    process.exit(1);
  }

  const userId: string = authData.user.id;
  console.log(`✅ Usuário criado no Auth: ${userId}`);

  // 2. Insere ou atualiza o perfil com role admin
  const profileData: ProfileData = {
    id: userId,
    nome: ADMIN_NAME,
    email: ADMIN_EMAIL,
    role: 'admin',
    telefone: '(11) 99999-9999'
  };

  const { error: profileError } = await supabase
    .from('profiles')
    .upsert(profileData, { onConflict: 'id' });

  if (profileError) {
    console.error('❌ Erro ao criar perfil:', profileError.message);
    process.exit(1);
  }

  console.log('✅ Perfil admin criado na tabela profiles');
  console.log(`\n🚀 Tudo pronto! Faça login com:`);
  console.log(`   Email....: ${ADMIN_EMAIL}`);
  console.log(`   Senha....: ${ADMIN_PASSWORD}`);
  console.log(`   Role.....: admin\n`);
}

// Executa a função
createAdmin();