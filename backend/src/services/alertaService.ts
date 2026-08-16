import { query, queryOne } from '../lib/db.js';
import { Alerta } from '../types/index.js';

export const alertaService = {
  async list(limit = 100) {
    return query<Alerta>(
      `SELECT a.*,
         CASE WHEN p.id IS NULL THEN NULL
              ELSE jsonb_build_object('descricao', p.descricao, 'codigo', p.codigo)
         END AS produto
       FROM alertas a
       LEFT JOIN produtos p ON p.id = a.produto_id
       ORDER BY a.created_at DESC
       LIMIT $1`,
      [limit],
    );
  },

  async marcarLido(id: string) {
    const row = await queryOne<Alerta>(`UPDATE alertas SET lido = true WHERE id = $1 RETURNING *`, [id]);
    if (!row) throw new Error('Alerta não encontrado');
    return row;
  },

  async marcarTodosLidos() {
    await query(`UPDATE alertas SET lido = true WHERE lido = false`);
  },

  async countNaoLidos() {
    const row = await queryOne<{ total: number }>(
      `SELECT COUNT(*)::int AS total FROM alertas WHERE lido = false`,
    );
    return row?.total || 0;
  },
};
