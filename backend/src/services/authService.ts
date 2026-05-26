import { createClient } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase.js';
import jwt from 'jsonwebtoken';
import { JwtPayload, Profile, UserRole } from '../types/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

export const authService = {
  /** Login: autentica no Supabase e devolve JWT próprio + profile */
  async login(email: string, password: string) {
    // Use a disposable client for signInWithPassword so the main
    // service-role client isn't polluted with a user session (which
    // would cause RLS policies to apply instead of bypassing them).
    const loginClient = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );
    const { data, error } = await loginClient.auth.signInWithPassword({ email, password });
    if (error || !data.user) {
      throw new Error('Credenciais inválidas');
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (!profile) {
      throw new Error('Perfil não encontrado. Peça ao admin para criar seu perfil.');
    }

    const payload: JwtPayload = {
      sub: profile.id,
      email: profile.email,
      role: profile.role,
      nome: profile.nome,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });

    return { token, profile: profile as Profile };
  },

  /** Setup inicial: cria o primeiro admin (só funciona se não existir nenhum admin ainda) */
  async setupAdmin(email: string, password: string, nome: string) {
    // Verifica se já existe algum admin
    const { count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'admin');

    if (count && count > 0) {
      throw new Error('Já existe um admin cadastrado. Use o endpoint de login.');
    }

    // Cria o usuário no Auth do Supabase
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { nome },
    });

    if (authError || !authData.user) {
      throw new Error('Erro ao criar usuário: ' + (authError?.message || 'desconhecido'));
    }

    // Cria o perfil admin vinculado ao auth user
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        nome,
        email,
        role: 'admin',
      })
      .select()
      .single();

    if (profileError) {
      // Rollback: deleta o auth user
      await supabase.auth.admin.deleteUser(authData.user.id);
      throw new Error('Erro ao criar perfil: ' + profileError.message);
    }

    // Gera o token JWT
    const payload: JwtPayload = {
      sub: profile.id,
      email: profile.email,
      role: profile.role,
      nome: profile.nome,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });

    return { token, profile: profile as Profile };
  },

  async getProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) throw new Error('Perfil não encontrado');
    return data as Profile;
  },

  async listProfiles() {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('nome');
    if (error) throw new Error('Erro ao listar perfis');
    return data as Profile[];
  },

  async createProfile(profileData: Partial<Profile>) {
    const { data, error } = await supabase
      .from('profiles')
      .insert(profileData)
      .select()
      .single();
    if (error) throw new Error('Erro ao criar perfil: ' + error.message);
    return data as Profile;
  },

  async createUser(nome: string, email: string, password: string, role: UserRole, colaboradorId?: string) {
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { nome },
    });

    if (authError || !authData.user) {
      throw new Error('Erro ao criar usuário: ' + (authError?.message || 'desconhecido'));
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert({ id: authData.user.id, nome, email, role })
      .select()
      .single();

    if (profileError) {
      await supabase.auth.admin.deleteUser(authData.user.id);
      throw new Error('Erro ao criar perfil: ' + profileError.message);
    }

    if (colaboradorId) {
      await supabase.from('colaboradores').update({ profile_id: authData.user.id }).eq('id', colaboradorId);
    }

    return { profile: profile as Profile };
  },

  async deleteProfile(profileId: string) {
    // Limpa profile_id do colaborador vinculado
    await supabase.from('colaboradores').update({ profile_id: null }).eq('profile_id', profileId);

    // Deleta o perfil
    const { error } = await supabase.from('profiles').delete().eq('id', profileId);
    if (error) throw new Error('Erro ao excluir perfil: ' + error.message);

    // Deleta o usuário do Auth do Supabase (email, senha, etc.)
    await supabase.auth.admin.deleteUser(profileId);
  },
};