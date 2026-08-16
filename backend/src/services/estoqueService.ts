import { buildUpdateSql, pool, query, queryOne } from '../lib/db.js';
import { CategoriaProduto, MovimentacaoEstoque, Produto } from '../types/index.js';

export const produtoService = {
  async list() {
    return query<Produto>(
      `SELECT p.*, to_jsonb(cat) AS categoria,
         CASE WHEN f.id IS NULL THEN NULL
              ELSE jsonb_build_object('nome', f.nome)
         END AS fornecedor
       FROM produtos p
       LEFT JOIN categorias_produto cat ON cat.id = p.categoria_id
       LEFT JOIN fornecedores f ON f.id = p.fornecedor_id
       ORDER BY p.descricao`,
    );
  },

  async create(payload: Partial<Produto>) {
    if (!payload.codigo) {
      const random = Math.random().toString(36).substring(2, 8).toUpperCase();
      payload.codigo = `PROD-${random}`;
    }
    const row = await queryOne<Produto>(
      `INSERT INTO produtos
         (codigo, descricao, categoria_id, fornecedor_id, preco_custo, preco_venda, estoque_atual, estoque_minimo, estoque_maximo, unidade, ativo)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        payload.codigo,
        payload.descricao,
        payload.categoria_id || null,
        payload.fornecedor_id || null,
        payload.preco_custo ?? 0,
        payload.preco_venda ?? 0,
        payload.estoque_atual ?? 0,
        payload.estoque_minimo ?? 0,
        payload.estoque_maximo ?? 0,
        payload.unidade || 'un',
        payload.ativo ?? true,
      ],
    );
    if (!row) throw new Error('Erro ao criar produto');
    return row;
  },

  async update(id: string, payload: Partial<Produto>) {
    const { text, params } = buildUpdateSql('produtos', payload, { withUpdatedAt: true });
    const row = await queryOne<Produto>(text, [id, ...params]);
    if (!row) throw new Error('Produto não encontrado');
    return row;
  },

  async delete(id: string) {
    // Registros relacionados são removidos via ON DELETE CASCADE
    await query(`DELETE FROM produtos WHERE id = $1`, [id]);

    // Limpa do cache de previsão
    const { previsaoService } = await import('./previsaoService.js');
    previsaoService.limparCacheProduto(id);
  },
};

export const categoriaService = {
  async list() {
    return query<CategoriaProduto>(`SELECT * FROM categorias_produto ORDER BY nome`);
  },

  async create(payload: Partial<CategoriaProduto>) {
    const row = await queryOne<CategoriaProduto>(
      `INSERT INTO categorias_produto (nome, descricao, icone)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [payload.nome, payload.descricao || null, payload.icone || null],
    );
    if (!row) throw new Error('Erro ao criar categoria');
    return row;
  },

  async update(id: string, payload: Partial<CategoriaProduto>) {
    const { text, params } = buildUpdateSql('categorias_produto', payload);
    const row = await queryOne<CategoriaProduto>(text, [id, ...params]);
    if (!row) throw new Error('Categoria não encontrada');
    return row;
  },

  async delete(id: string) {
    await query(`UPDATE produtos SET categoria_id = NULL WHERE categoria_id = $1`, [id]);
    await query(`DELETE FROM categorias_produto WHERE id = $1`, [id]);
  },
};

export const movimentacaoService = {
  async list(limit = 100) {
    return query<MovimentacaoEstoque>(
      `SELECT m.*,
         CASE WHEN p.id IS NULL THEN NULL
              ELSE jsonb_build_object('descricao', p.descricao, 'unidade', p.unidade, 'estoque_atual', p.estoque_atual)
         END AS produto
       FROM movimentacoes_estoque m
       LEFT JOIN produtos p ON p.id = m.produto_id
       ORDER BY m.created_at DESC
       LIMIT $1`,
      [limit],
    );
  },

  async create(payload: { produto_id: string; tipo: string; quantidade: number; valor_unitario?: number; motivo?: string; colaborador_id?: string }) {
    const vu = payload.valor_unitario || 0;
    const qtd = Math.abs(payload.quantidade);
    const sinal = ['saida', 'perda'].includes(payload.tipo) ? -qtd : qtd;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Atualiza estoque
      const prod = await client.query<{ estoque_atual: number }>(
        `SELECT estoque_atual FROM produtos WHERE id = $1 FOR UPDATE`,
        [payload.produto_id],
      );
      if (prod.rows.length > 0) {
        let novo = prod.rows[0].estoque_atual;
        if (['entrada', 'producao'].includes(payload.tipo)) novo += qtd;
        else if (['saida', 'perda'].includes(payload.tipo)) novo -= qtd;
        await client.query(`UPDATE produtos SET estoque_atual = $2, updated_at = now() WHERE id = $1`, [
          payload.produto_id,
          Math.max(0, novo),
        ]);
      }

      const inserted = await client.query<MovimentacaoEstoque>(
        `INSERT INTO movimentacoes_estoque
           (produto_id, tipo, quantidade, valor_unitario, valor_total, motivo, colaborador_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [
          payload.produto_id,
          payload.tipo,
          sinal,
          vu,
          qtd * vu,
          payload.motivo || null,
          payload.colaborador_id || null,
        ],
      );

      await client.query('COMMIT');
      return inserted.rows[0];
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },
};
