import { query, queryOne } from '../lib/db.js';
import { EventoExterno, PrevisaoDemanda } from '../types/index.js';
import { addDays, format, getDay } from 'date-fns';
import { aiService } from './aiService.js';

type ChartPoint = { data: string; historico: number | null; previsao: number | null };

const DIAS_NOME = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const FATORES_DIA = [0.6, 1.15, 1.15, 1.15, 1.15, 1.15, 0.85];

const cache = {
  resultados: new Map<string, PrevisaoDemanda>(),
  eventos: null as EventoExterno[] | null,
  ultimaAtualizacao: null as string | null,
  analisando: false,
};

export const previsaoService = {
  async getPrevisao(produtoId: string): Promise<PrevisaoDemanda> {
    const produto = await queryOne<any>(
      `SELECT p.*, to_jsonb(cat) AS categoria
       FROM produtos p
       LEFT JOIN categorias_produto cat ON cat.id = p.categoria_id
       WHERE p.id = $1`,
      [produtoId],
    );

    if (!produto) throw new Error('Produto não encontrado');

    const itens = await query<any>(
      `SELECT iv.quantidade, to_jsonb(v) AS venda
       FROM itens_venda iv
       JOIN vendas v ON v.id = iv.venda_id
       WHERE iv.produto_id = $1 AND v.data_venda >= $2
       ORDER BY v.data_venda ASC`,
      [produtoId, format(addDays(new Date(), -84), 'yyyy-MM-dd')],
    );

    let historico: { data: string; quantidade: number }[] = [];

    if (itens && itens.length > 0) {
      historico = itens.map((d: any) => ({
        data: String(d.venda.data_venda).slice(0, 10),
        quantidade: d.quantidade,
      }));
    }

    const iaResult = await aiService.gerarPrevisao({
      produto: {
        descricao: produto.descricao,
        categoria: produto.categoria?.nome,
        estoque_atual: produto.estoque_atual,
        estoque_minimo: produto.estoque_minimo,
        estoque_maximo: produto.estoque_maximo,
      },
      historico,
      diaSemana: DIAS_NOME.map((nome, i) => ({ nome, fator: FATORES_DIA[i] })),
    });

    if (!iaResult || iaResult.confianca <= 0.3) {
      throw new Error('IA temporariamente indisponível. Tente novamente em instantes.');
    }

    const hoje = new Date();

    const chartData: ChartPoint[] = historico.slice(-21).map(v => ({
      data: format(new Date(v.data + 'T00:00:00'), 'dd/MM'),
      historico: v.quantidade,
      previsao: null,
    }));

    const usarIA = iaResult.previsaoDiaria.length === 7;

    for (let i = 0; i < 7; i++) {
      const d = addDays(hoje, i);
      chartData.push({
        data: format(d, 'dd/MM'),
        historico: null,
        previsao: usarIA ? iaResult.previsaoDiaria[i] : Math.round(iaResult.previsao7dias / 7),
      });
    }

    const totalHistorico = historico.reduce((s, v) => s + v.quantidade, 0);
    const mediaDiariaReal = historico.length > 0 ? totalHistorico / historico.length : 0;
    const diasComDados = new Set(historico.map(h => h.data)).size;
    const ultimos7 = historico.slice(-7).map(h => ({ data: h.data, quantidade: h.quantidade }));

    return {
      produto_id: produto.id,
      produto_nome: produto.descricao,
      previsao7dias: iaResult.previsao7dias,
      previsao30dias: iaResult.previsao30dias,
      fatorSazonal: 1.0,
      fatorTendencia: 1.0,
      fatorIA: iaResult.confianca,
      estoque_atual: produto.estoque_atual,
      recomendacao: iaResult.recomendacao,
      sugestao: `${iaResult.sugestao} (IA: ${(iaResult.confianca * 100).toFixed(0)}% confiança)`,
      chartData,
      historicoResumo: {
        total: totalHistorico,
        mediaDiaria: mediaDiariaReal,
        diasComDados,
        ultimos7,
      },
    };
  },

  async getProximosEventos() {
    const eventos = await aiService.gerarCalendario();
    if (!eventos) return [];
    const hoje = new Date().toISOString().split('T')[0];
    return eventos
      .filter(e => e.data_inicio >= hoje || (e.data_fim && e.data_fim >= hoje))
      .slice(0, 10)
      .map((e, i) => ({ id: `ia-evento-${i}`, ...e } as EventoExterno));
  },

  async analisarTodosBackground() {
    if (cache.analisando) return;
    cache.analisando = true;
    console.log('[Previsao] Background: iniciando...');

    const produtos = await query<{ id: string }>(`SELECT id FROM produtos`);
    if (!produtos) { cache.analisando = false; return; }

    const CONCURRENCY = 3;

    for (let i = 0; i < produtos.length; i += CONCURRENCY) {
      const batch = produtos.slice(i, i + CONCURRENCY);
      console.log(`[Previsao] Background: lote ${i / CONCURRENCY + 1}/${Math.ceil(produtos.length / CONCURRENCY)}`);
      await Promise.allSettled(batch.map(async (p: any) => {
        try {
          const r = await this.getPrevisao(p.id);
          cache.resultados.set(p.id, r);
        } catch (err: any) {
          console.error(`[Previsao] Background: erro ${p.id}: ${err.message}`);
        }
      }));
    }

    try {
      cache.eventos = await this.getProximosEventos();
    } catch (err: any) {
      console.error('[Previsao] Background: erro eventos:', err.message);
    }

    cache.ultimaAtualizacao = new Date().toISOString();
    cache.analisando = false;
    console.log(`[Previsao] Background: concluído (${cache.resultados.size} produtos, ${cache.eventos?.length ?? 0} eventos)`);
  },

  async onVendaCriada(produtoIds: string[]) {
    console.log(`[Previsao] Venda: reanalisando ${produtoIds.length} produtos`);
    await Promise.allSettled(produtoIds.map(async (id) => {
      try {
        const r = await this.getPrevisao(id);
        cache.resultados.set(id, r);
      } catch (err: any) {
        console.error(`[Previsao] Venda: erro ${id}: ${err.message}`);
      }
    }));
    cache.ultimaAtualizacao = new Date().toISOString();
  },

  obterCache() {
    return {
      resultados: Array.from(cache.resultados.values()),
      eventos: cache.eventos,
      ultimaAtualizacao: cache.ultimaAtualizacao,
      analisando: cache.analisando,
    };
  },

  limparCacheProduto(produtoId: string) {
    cache.resultados.delete(produtoId);
  },

  async getRecomendacoesGlobais() {
    const produtos = await query<any>(`SELECT * FROM produtos`);
    if (!produtos) return { baixos: [], excessos: [] };
    return {
      baixos: produtos.filter((p: any) => p.estoque_atual <= p.estoque_minimo).slice(0, 5),
      excessos: produtos.filter((p: any) => p.estoque_atual >= p.estoque_maximo).slice(0, 5),
    };
  },

  async getRecomendacoesIA() {
    const produtos = await query<any>(
      `SELECT p.*, to_jsonb(cat) AS categoria
       FROM produtos p
       LEFT JOIN categorias_produto cat ON cat.id = p.categoria_id`,
    );

    if (!produtos || produtos.length === 0) return [];

    const resumoProdutos = await Promise.all(produtos.map(async (p: any) => {
      const itens = await query<{ quantidade: number }>(
        `SELECT iv.quantidade
         FROM itens_venda iv
         JOIN vendas v ON v.id = iv.venda_id
         WHERE iv.produto_id = $1 AND v.data_venda >= $2`,
        [p.id, format(addDays(new Date(), -84), 'yyyy-MM-dd')],
      );

      let mediaDiaria = 0;
      let tendencia = 'estável';

      if (itens && itens.length > 0) {
        const valores = itens.map((d: any) => d.quantidade);
        mediaDiaria = valores.reduce((s: number, v: number) => s + v, 0) / valores.length;

        const metade = Math.floor(valores.length / 2);
        if (metade >= 2) {
          const antiga = valores.slice(0, metade).reduce((s: number, v: number) => s + v, 0) / metade;
          const recente = valores.slice(-metade).reduce((s: number, v: number) => s + v, 0) / metade;
          if (antiga > 0) {
            const ratio = recente / antiga;
            tendencia = ratio > 1.2 ? 'alta' : ratio < 0.8 ? 'queda' : 'estável';
          }
        }
      }

      return {
        id: p.id,
        nome: p.descricao,
        categoria: p.categoria?.nome,
        estoque_atual: p.estoque_atual,
        estoque_minimo: p.estoque_minimo,
        estoque_maximo: p.estoque_maximo,
        mediaDiaria,
        diasCobertura: mediaDiaria > 0 ? p.estoque_atual / mediaDiaria : 999,
        tendencia,
      };
    }));

    const iaRecomendacoes = await aiService.gerarRecomendacoesGlobais(resumoProdutos);

    if (!iaRecomendacoes) {
      return resumoProdutos.filter(p => p.estoque_atual <= p.estoque_minimo || p.estoque_atual >= p.estoque_maximo).map(p => ({
        produto_nome: p.nome,
        recomendacao: p.estoque_atual <= p.estoque_minimo ? 'aumentar' as const : 'reduzir' as const,
        acao: p.estoque_atual <= p.estoque_minimo ? `Comprar ${p.estoque_minimo - p.estoque_atual + Math.round(p.mediaDiaria * 15)} unidades` : `Reduzir ${Math.round((p.estoque_atual - p.estoque_maximo) / p.mediaDiaria)} dias de produção`,
        urgencia: p.estoque_atual <= p.estoque_minimo ? 'alta' as const : 'media' as const,
        motivo: p.estoque_atual <= p.estoque_minimo ? `Estoque crítico (${p.estoque_atual}/${p.estoque_minimo})` : `Excesso de estoque (${p.estoque_atual}/${p.estoque_maximo})`,
      }));
    }

    return iaRecomendacoes.map(r => {
      const prod = resumoProdutos.find(p => p.nome === r.produto_nome);
      return { ...r, produto_id: prod?.id || '' };
    });
  },
};
