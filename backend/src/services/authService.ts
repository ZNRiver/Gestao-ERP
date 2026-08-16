import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { query, queryOne } from '../lib/db.js';
import { JwtPayload, Profile, UserRole } from '../types/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

const PROFILE_COLS = 'id, nome, email, role, avatar_url, telefone, created_at, updated_at';

function signToken(profile: { id: string; email: string; role: UserRole; nome: string }): string {
  const payload: JwtPayload = { sub: profile.id, email: profile.email, role: profile.role, nome: profile.nome };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
}

export const authService = {
  /** Login: valida credenciais no PostgreSQL e devolve JWT próprio + profile */
  async login(email: string, password: string) {
    const row = await queryOne<Profile & { password_hash: string }>(
      `SELECT ${PROFILE_COLS}, password_hash FROM profiles WHERE email = $1`,
      [email],
    );

    if (!row) throw new Error('Credenciais inválidas');

    const senhaOk = await bcrypt.compare(password, row.password_hash);
    if (!senhaOk) throw new Error('Credenciais inválidas');

    const { password_hash: _ph, ...profile } = row;
    return { token: signToken(profile), profile: profile as Profile };
  },

  /** Setup inicial: cria o primeiro admin (só funciona se não existir nenhum admin ainda) */
  async setupAdmin(email: string, password: string, nome: string) {
    const admin = await queryOne<{ total: number }>(
      `SELECT COUNT(*)::int AS total FROM profiles WHERE role = 'admin'`,
    );
    if (admin && admin.total > 0) {
      throw new Error('Já existe um admin cadastrado. Use o endpoint de login.');
    }

    const id = randomUUID();
    const password_hash = await bcrypt.hash(password, 10);

    const profile = await queryOne<Profile>(
      `INSERT INTO profiles (id, nome, email, role, password_hash)
       VALUES ($1, $2, $3, 'admin', $4)
       RETURNING ${PROFILE_COLS}`,
      [id, nome, email, password_hash],
    ).catch((err: any) => {
      if (err.code === '23505') throw new Error('Já existe um usuário com este email');
      throw err;
    });

    if (!profile) throw new Error('Erro ao criar perfil');

    return { token: signToken(profile), profile };
  },

  async getProfile(userId: string) {
    const profile = await queryOne<Profile>(
      `SELECT ${PROFILE_COLS} FROM profiles WHERE id = $1`,
      [userId],
    );
    if (!profile) throw new Error('Perfil não encontrado');
    return profile;
  },

  async listProfiles() {
    return query<Profile>(`SELECT ${PROFILE_COLS} FROM profiles ORDER BY nome`);
  },

  async createProfile(profileData: Partial<Profile> & { password: string }) {
    if (!profileData.password) throw new Error('Senha obrigatória');
    const id = profileData.id || randomUUID();
    const password_hash = await bcrypt.hash(profileData.password, 10);

    const profile = await queryOne<Profile>(
      `INSERT INTO profiles (id, nome, email, role, avatar_url, telefone, password_hash)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING ${PROFILE_COLS}`,
      [
        id,
        profileData.nome,
        profileData.email,
        profileData.role || 'trabalhador',
        profileData.avatar_url || null,
        profileData.telefone || null,
        password_hash,
      ],
    ).catch((err: any) => {
      if (err.code === '23505') throw new Error('Já existe um usuário com este email');
      throw err;
    });

    if (!profile) throw new Error('Erro ao criar perfil');
    return profile;
  },

  async createUser(nome: string, email: string, password: string, role: UserRole, colaboradorId?: string) {
    const id = randomUUID();
    const password_hash = await bcrypt.hash(password, 10);

    const profile = await queryOne<Profile>(
      `INSERT INTO profiles (id, nome, email, role, password_hash)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING ${PROFILE_COLS}`,
      [id, nome, email, role, password_hash],
    ).catch((err: any) => {
      if (err.code === '23505') throw new Error('Já existe um usuário com este email');
      throw err;
    });

    if (!profile) throw new Error('Erro ao criar usuário');

    if (colaboradorId) {
      await query(`UPDATE colaboradores SET profile_id = $1 WHERE id = $2`, [id, colaboradorId]);
    }

    return { profile };
  },

  async deleteProfile(profileId: string) {
    const deleted = await query<{ id: string }>(
      `DELETE FROM profiles WHERE id = $1 RETURNING id`,
      [profileId],
    );
    if (deleted.length === 0) throw new Error('Perfil não encontrado');
    // colaboradores.profile_id é limpo automaticamente via ON DELETE SET NULL
  },
};
