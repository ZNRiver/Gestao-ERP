import { supabase } from '../lib/supabase.js';
import { Venda, ItemVenda } from '../types/index.js';
import { previsaoService } from './previsaoService.js';

export const vendaService = {
  async list(limit = 100) {
    const { data } = await supabase
      .from('vendas')
      .select('*, vendedor:colaboradores(nome), cliente:clientes(nome, documento), itens:itens_venda(*)')
      .order('data_venda', { ascending: false })
      .limit(limit);
    return data as Venda[];
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

    // Busca dados do cliente se informado
    let clienteNome = payload.cliente_nome || null;
    if (payload.cliente_id) {
      const { data: cli } = await supabase.from('clientes').select('nome').eq('id', payload.cliente_id).single();
      if (cli) clienteNome = cli.nome;
    }

    // Cria venda
    const { data: venda, error } = await supabase.from('vendas').insert({
      vendedor_id: payload.vendedor_id || null,
      cliente_id: payload.cliente_id || null,
      cliente_nome: clienteNome,
      valor_total: subtotal,
      desconto,
      valor_final: valorFinal,
      status: 'aprovado',
    }).select().single();

    if (error || !venda) throw new Error('Erro ao criar venda');

    // Insere itens
    const itens = payload.itens.map(i => ({
      venda_id: venda.id,
      produto_id: i.produto_id,
      quantidade: i.quantidade,
      valor_unitario: i.valor_unitario,
      valor_total: i.quantidade * i.valor_unitario,
    }));
    await supabase.from('itens_venda').insert(itens);

    // Atualiza estoque de cada produto
    for (const item of payload.itens) {
      const { data: prod } = await supabase.from('produtos').select('estoque_atual').eq('id', item.produto_id).single();
      if (prod) {
        await supabase.from('produtos').update({
          estoque_atual: Math.max(0, prod.estoque_atual - item.quantidade)
        }).eq('id', item.produto_id);
      }
    }

    // Reanalisa apenas os produtos afetados pela venda (não bloqueia)
    const idsAfetados = payload.itens.map(i => i.produto_id);
    previsaoService.onVendaCriada(idsAfetados).catch(() => {});

    return venda as Venda;
  },

  async updateStatus(id: string, status: string) {
    const { data, error } = await supabase.from('vendas').update({ status }).eq('id', id).select().single();
    if (error) throw new Error(error.message);
    return data as Venda;
  },
};
