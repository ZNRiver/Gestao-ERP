import { buildUpdateSql, query, queryOne } from '../lib/db.js';
import { Cliente } from '../types/index.js';

export const clienteService = {
  async list() {
    return query<Cliente>(`SELECT * FROM clientes ORDER BY nome`);
  },

  async getById(id: string) {
    const row = await queryOne<Cliente>(`SELECT * FROM clientes WHERE id = $1`, [id]);
    if (!row) throw new Error('Cliente não encontrado');
    return row;
  },

  async create(payload: Partial<Cliente>) {
    const row = await queryOne<Cliente>(
      `INSERT INTO clientes (nome, documento, telefone, email, endereco, cidade, estado, observacao, ativo)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        payload.nome,
        payload.documento || null,
        payload.telefone || null,
        payload.email || null,
        payload.endereco || null,
        payload.cidade || null,
        payload.estado || null,
        payload.observacao || null,
        payload.ativo ?? true,
      ],
    );
    if (!row) throw new Error('Erro ao criar cliente');
    return row;
  },

  async update(id: string, payload: Partial<Cliente>) {
    const { text, params } = buildUpdateSql('clientes', payload, { withUpdatedAt: true });
    const row = await queryOne<Cliente>(text, [id, ...params]);
    if (!row) throw new Error('Cliente não encontrado');
    return row;
  },

  async remove(id: string) {
    await query(`DELETE FROM clientes WHERE id = $1`, [id]);
  },
};
