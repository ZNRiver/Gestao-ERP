import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

async function debugLogin() {
  const email = 'kauazin352911@gmail.com';
  const password = '352911kkK?';

  console.log('Usando SERVICE_ROLE_KEY (igual ao backend):\n');

  const svcClient = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Step 1: signInWithPassword
  const { data: authData, error: authError } = await svcClient.auth.signInWithPassword({ email, password });
  if (authError) {
    console.log(`❌ signInWithPassword erro: ${authError.message}`);
    return;
  }
  console.log(`✅ signInWithPassword OK`);
  console.log(`   user.id: ${authData.user?.id}`);

  // Step 2: query profiles
  const { data: profile, error: profileError } = await svcClient
    .from('profiles')
    .select('*')
    .eq('id', authData.user?.id)
    .single();

  if (profileError) {
    console.log(`❌ profiles query erro: ${profileError.message}`);
    console.log(`   Detalhes:`, JSON.stringify(profileError));
  } else if (profile) {
    console.log(`✅ Profile encontrado: ${JSON.stringify(profile)}`);
  } else {
    console.log(`❌ Profile retornou null`);
  }

  // Step 3: try query without .single() to see all profiles
  console.log(`\n📋 Todos os profiles:`);
  const { data: all } = await svcClient.from('profiles').select('*');
  console.log(JSON.stringify(all));
}

debugLogin().catch(console.error);
