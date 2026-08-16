import { pool, query, queryOne } from '../lib/db.js';
import { Venda } from '../types/index.js';
import { previsaoService } from './previsaoService.js';

export const vendaService = {
  async list(limit = 100) {
    return query<Venda>(
      `SELECT v.*,
         CASE WHEN ve.id IS NULL THEN NULL ELSE jsonb_build_object('nome', ve.nome) END AS vendedor,
         CASE WHEN cl.id IS NULL THEN NULL
              ELSE jsonb_build_object('nome', cl.nome, 'documento', cl.documento)
         END AS cliente,
         COALESCE((SELECT jsonb_agg(to_jsonb(iv)) FROM itens_venda iv WHERE iv.venda_id = v.id), '[]'::jsonb) AS itens
       FROM vendas v
       LEFT JOIN colaboradores ve ON ve.id = v.vendedor_id
       LEFT JOIN clientes cl ON cl.id = v.cliente_id
       ORDER BY v.data_venda DESC, v.created_at DESC
       LIMIT $1`,
      [limit],
    );
  },

  async create(payload: {
    vendedor_id?: string;
    cliente_id?: string;
    cliente_nome?: string;
    desconto?: number;
    itens: { produto_id: string; quantidade: number; valor_unitario: number }[];
  }) {
    const subtotal = payload.itens.reduce((s, i) => s + i.quantidade * i.valor_unitario, 0);
    const desconto = payload.desconto || 0;
    const valorFinal = Math.max(0, subtotal - desconto);

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Busca dados do cliente se informado
      let clienteNome = payload.cliente_nome || null;
      if (payload.cliente_id) {
        const cli = await client.query<{ nome: string }>(`SELECT nome FROM clientes WHERE id = $1`, [
          payload.cliente_id,
        ]);
        if (cli.rows.length > 0) clienteNome = cli.rows[0].nome;
      }

      // Cria venda
      const vendaRes = await client.query<Venda>(
        `INSERT INTO vendas (vendedor_id, cliente_id, cliente_nome, valor_total, desconto, valor_final, status)
         VALUES ($1, $2, $3, $4, $5, $6, 'aprovado')
         RETURNING *`,
        [payload.vendedor_id || null, payload.cliente_id || null, clienteNome, subtotal, desconto, valorFinal],
      );
      const venda = vendaRes.rows[0];
      if (!venda) throw new Error('Erro ao criar venda');

      // Insere itens
      for (const item of payload.itens) {
        await client.query(
          `INSERT INTO itens_venda (venda_id, produto_id, quantidade, valor_unitario, valor_total)
           VALUES ($1, $2, $3, $4, $5)`,
          [venda.id, item.produto_id, item.quantidade, item.valor_unitario, item.quantidade * item.valor_unitario],
        );

        // Atualiza estoque do produto
        const prod = await client.query<{ estoque_atual: number }>(
          `SELECT estoque_atual FROM produtos WHERE id = $1 FOR UPDATE`,
          [item.produto_id],
        );
        if (prod.rows.length > 0) {
          await client.query(`UPDATE produtos SET estoque_atual = $2, updated_at = now() WHERE id = $1`, [
            item.produto_id,
            Math.max(0, prod.rows[0].estoque_atual - item.quantidade),
          ]);
        }
      }

      await client.query('COMMIT');

      // Reanalisa apenas os produtos afetados pela venda (não bloqueia)
      const idsAfetados = payload.itens.map((i) => i.produto_id);
      previsaoService.onVendaCriada(idsAfetados).catch(() => {});

      return venda;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  async updateStatus(id: string, status: string) {
    const row = await queryOne<Venda>(`UPDATE vendas SET status = $2 WHERE id = $1 RETURNING *`, [id, status]);
    if (!row) throw new Error('Venda não encontrada');
    return row;
  },
};
