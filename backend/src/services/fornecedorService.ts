import { buildUpdateSql, query, queryOne } from '../lib/db.js';
import { Fornecedor } from '../types/index.js';

export const fornecedorService = {
  async list() {
    return query<Fornecedor>(`SELECT * FROM fornecedores ORDER BY nome`);
  },

  async getById(id: string) {
    const row = await queryOne<Fornecedor>(`SELECT * FROM fornecedores WHERE id = $1`, [id]);
    if (!row) throw new Error('Fornecedor não encontrado');
    return row;
  },

  async create(payload: Partial<Fornecedor>) {
    const row = await queryOne<Fornecedor>(
      `INSERT INTO fornecedores (nome, cnpj, inscricao_estadual, contato_nome, contato_telefone, contato_email, endereco, cidade, estado, observacao, ativo)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        payload.nome,
        payload.cnpj || null,
        payload.inscricao_estadual || null,
        payload.contato_nome || null,
        payload.contato_telefone || null,
        payload.contato_email || null,
        payload.endereco || null,
        payload.cidade || null,
        payload.estado || null,
        payload.observacao || null,
        payload.ativo ?? true,
      ],
    );
    if (!row) throw new Error('Erro ao criar fornecedor');
    return row;
  },

  async update(id: string, payload: Partial<Fornecedor>) {
    const { text, params } = buildUpdateSql('fornecedores', payload, { withUpdatedAt: true });
    const row = await queryOne<Fornecedor>(text, [id, ...params]);
    if (!row) throw new Error('Fornecedor não encontrado');
    return row;
  },

  async remove(id: string) {
    await query(`DELETE FROM fornecedores WHERE id = $1`, [id]);
  },
};
