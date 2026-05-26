import { supabase } from '../lib/supabase.js';
import { Produto, CategoriaProduto, MovimentacaoEstoque } from '../types/index.js';

export const produtoService = {
  async list() {
    const { data } = await supabase
      .from('produtos')
      .select('*, categoria:categorias_produto(*), fornecedor:fornecedores(nome)')
      .order('descricao');
    return data as Produto[];
  },

  async create(payload: Partial<Produto>) {
    if (!payload.codigo) {
      const random = Math.random().toString(36).substring(2, 8).toUpperCase();
      payload.codigo = `PROD-${random}`;
    }
    const { data, error } = await supabase.from('produtos').insert(payload).select().single();
    if (error) throw new Error(error.message);
    return data as Produto;
  },

  async update(id: string, payload: Partial<Produto>) {
    const { data, error } = await supabase.from('produtos').update(payload).eq('id', id).select().single();
    if (error) throw new Error(error.message);
    return data as Produto;
  },

  async delete(id: string) {
    // Remove registros relacionados antes de excluir o produto
    await supabase.from('itens_venda').delete().eq('produto_id', id);
    await supabase.from('movimentacoes_estoque').delete().eq('produto_id', id);
    await supabase.from('previsao_demanda').delete().eq('produto_id', id);
    await supabase.from('alertas').delete().eq('produto_id', id);

    const { error } = await supabase.from('produtos').delete().eq('id', id);
    if (error) throw new Error(error.message);

    // Limpa do cache de previsão
    const { previsaoService } = await import('./previsaoService.js');
    previsaoService.limparCacheProduto(id);
  },
};

export const categoriaService = {
  async list() {
    const { data } = await supabase.from('categorias_produto').select('*').order('nome');
    return data as CategoriaProduto[];
  },

  async create(payload: Partial<CategoriaProduto>) {
    const { data, error } = await supabase.from('categorias_produto').insert(payload).select().single();
    if (error) throw new Error(error.message);
    return data as CategoriaProduto;
  },

  async update(id: string, payload: Partial<CategoriaProduto>) {
    const { data, error } = await supabase.from('categorias_produto').update(payload).eq('id', id).select().single();
    if (error) throw new Error(error.message);
    return data as CategoriaProduto;
  },

  async delete(id: string) {
    await supabase.from('produtos').update({ categoria_id: null }).eq('categoria_id', id);
    const { error } = await supabase.from('categorias_produto').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },
};

export const movimentacaoService = {
  async list(limit = 100) {
    const { data } = await supabase
      .from('movimentacoes_estoque')
      .select('*, produto:produtos(descricao, unidade, estoque_atual)')
      .order('created_at', { ascending: false })
      .limit(limit);
    return data as MovimentacaoEstoque[];
  },

  async create(payload: { produto_id: string; tipo: string; quantidade: number; valor_unitario?: number; motivo?: string; colaborador_id?: string }) {
    const vu = payload.valor_unitario || 0;
    const qtd = Math.abs(payload.quantidade);
    const sinal = ['saida', 'perda'].includes(payload.tipo) ? -qtd : qtd;
    const record = {
      produto_id: payload.produto_id,
      tipo: payload.tipo,
      quantidade: sinal,
      valor_unitario: vu,
      valor_total: qtd * vu,
      motivo: payload.motivo || null,
      colaborador_id: payload.colaborador_id || null,
    };

    // Atualiza estoque
    const { data: prod } = await supabase.from('produtos').select('estoque_atual').eq('id', payload.produto_id).single();
    if (prod) {
      let novo = prod.estoque_atual;
      if (['entrada', 'producao'].includes(payload.tipo)) novo += qtd;
      else if (['saida', 'perda'].includes(payload.tipo)) novo -= qtd;
      await supabase.from('produtos').update({ estoque_atual: Math.max(0, novo) }).eq('id', payload.produto_id);
    }

    const { data, error } = await supabase.from('movimentacoes_estoque').insert(record).select().single();
    if (error) throw new Error(error.message);

    return data as MovimentacaoEstoque;
  },
};
