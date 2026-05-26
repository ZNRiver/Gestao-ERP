import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Configure SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function listUsers() {
  console.log('\n═══════════════════════════════════════════════');
  console.log('  LISTAGEM DE USUÁRIOS');
  console.log('═══════════════════════════════════════════════\n');

  // 1. Listar usuários do Auth
  console.log('📋 USUÁRIOS NO AUTH (supabase.auth):');
  console.log('──────────────────────────────────────');
  
  const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();

  if (authError) {
    console.error('❌ Erro ao listar auth users:', authError.message);
  } else if (!authUsers?.users || authUsers.users.length === 0) {
    console.log('   Nenhum usuário encontrado no Auth.');
  } else {
    for (const u of authUsers.users) {
      console.log(`   ID: ${u.id}`);
      console.log(`   Email: ${u.email}`);
      console.log(`   Criado em: ${u.created_at}`);
      console.log(`   Email confirmado: ${u.email_confirmed_at ? 'Sim' : 'Não'}`);
      console.log(`   Metadata: ${JSON.stringify(u.user_metadata)}`);
      console.log('');
    }
    console.log(`   Total no Auth: ${authUsers.users.length}`);
  }

  // 2. Listar perfis da tabela profiles
  console.log('\n📋 PERFIS NA TABELA profiles:');
  console.log('──────────────────────────────────────');

  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (profileError) {
    console.error('❌ Erro ao listar profiles:', profileError.message);
  } else if (!profiles || profiles.length === 0) {
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

  // 3. Comparar e mostrar inconsistências
  console.log('\n🔍 VERIFICAÇÃO DE CONSISTÊNCIA:');
  console.log('──────────────────────────────────────');

  if (authUsers?.users && profiles) {
    const authIds = new Set(authUsers.users.map(u => u.id));
    const profileIds = new Set(profiles.map(p => p.id));

    const semPerfil = authUsers.users.filter(u => !profileIds.has(u.id));
    const semAuth = profiles.filter(p => !authIds.has(p.id));

    if (semPerfil.length > 0) {
      console.log(`\n⚠️  ${semPerfil.length} usuário(s) no Auth SEM perfil na tabela profiles:`);
      semPerfil.forEach(u => console.log(`   - ${u.email} (${u.id})`));
    } else {
      console.log('\n✅ Todos os usuários do Auth têm perfil na tabela profiles.');
    }

    if (semAuth.length > 0) {
      console.log(`\n⚠️  ${semAuth.length} perfil(s) na tabela profiles SEM usuário no Auth:`);
      semAuth.forEach(p => console.log(`   - ${p.email} (${p.id} / role: ${p.role})`));
    } else {
      console.log('✅ Todos os perfis têm usuário correspondente no Auth.');
    }
  }

  // 4. Testar login com as credenciais do .env
  const testEmail = process.env.ADMIN_EMAIL;
  const testPass = process.env.ADMIN_PASSWORD;

  if (testEmail && testPass) {
    console.log('\n🧪 TESTE DE LOGIN:');
    console.log('──────────────────────────────────────');
    console.log(`   Tentando login com: ${testEmail}`);

    const clientUser = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const { data, error } = await clientUser.auth.signInWithPassword({
      email: testEmail,
      password: testPass,
    });

    if (error) {
      console.log(`   ❌ Erro no login: ${error.message}`);
    } else if (data.user) {
      console.log(`   ✅ Login bem-sucedido!`);

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profile) {
        console.log(`   ✅ Perfil encontrado: ${profile.nome} (role: ${profile.role})`);
      } else {
        console.log(`   ❌ Perfil NÃO encontrado na tabela profiles!`);
      }
    }
  }

  console.log('\n═══════════════════════════════════════════════\n');
}

listUsers();
