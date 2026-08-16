import { query, queryOne } from '../lib/db.js';
import { Funcao } from '../types/index.js';

export const funcoesService = {
  async list() {
    return query<Funcao>(`SELECT * FROM funcoes ORDER BY role`);
  },

  async create(payload: { role: string; nome_exibicao: string; descricao?: string; permissoes?: string[] }) {
    const row = await queryOne<Funcao>(
      `INSERT INTO funcoes (role, nome_exibicao, descricao, permissoes)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [payload.role, payload.nome_exibicao, payload.descricao || null, JSON.stringify(payload.permissoes || [])],
    );
    if (!row) throw new Error('Erro ao criar função');
    return row;
  },

  async update(role: string, payload: { nome_exibicao?: string; descricao?: string; permissoes?: string[] }) {
    const set: string[] = [];
    const params: unknown[] = [role];
    if (payload.nome_exibicao !== undefined) {
      params.push(payload.nome_exibicao);
      set.push(`nome_exibicao = $${params.length}`);
    }
    if (payload.descricao !== undefined) {
      params.push(payload.descricao);
      set.push(`descricao = $${params.length}`);
    }
    if (payload.permissoes !== undefined) {
      params.push(JSON.stringify(payload.permissoes));
      set.push(`permissoes = $${params.length}`);
    }
    set.push('updated_at = now()');
    const row = await queryOne<Funcao>(
      `UPDATE funcoes SET ${set.join(', ')} WHERE role = $1 RETURNING *`,
      params,
    );
    if (!row) throw new Error('Função não encontrada');
    return row;
  },

  async remove(role: string) {
    await query(`DELETE FROM funcoes WHERE role = $1`, [role]);
  },
};
