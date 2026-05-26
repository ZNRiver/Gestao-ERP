import { supabase } from '../lib/supabase.js';
import { DashboardData } from '../types/index.js';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const dashboardService = {
  async getDashboard(): Promise<DashboardData> {
    const hoje = new Date();
    const inicioMes = startOfMonth(hoje).toISOString();
    const fimMes = endOfMonth(hoje).toISOString();
    const inicioMesAnt = startOfMonth(subMonths(hoje, 1)).toISOString();
    const fimMesAnt = endOfMonth(subMonths(hoje, 1)).toISOString();

    // Gera os 6 meses em paralelo com as demais consultas
    const meses = Array.from({ length: 6 }, (_, i) => subMonths(hoje, 5 - i));

    const [
      { data: vendasMes },
      { data: vendasMesAnt },
      { count: totalProd },
      { data: baixos },
      { count: totalColab },
      { count: colabAtivos },
      { count: alertasNao },
      { data: perdas },
      ...vendasMeses
    ] = await Promise.all([
      supabase.from('vendas').select('valor_final').gte('data_venda', inicioMes).lte('data_venda', fimMes),
      supabase.from('vendas').select('valor_final').gte('data_venda', inicioMesAnt).lte('data_venda', fimMesAnt),
      supabase.from('produtos').select('*', { count: 'exact', head: true }),
      supabase.from('produtos').select('id').lte('estoque_atual', 10),
      supabase.from('colaboradores').select('*', { count: 'exact', head: true }),
      supabase.from('colaboradores').select('*', { count: 'exact', head: true }).eq('status', 'ativo'),
      supabase.from('alertas').select('*', { count: 'exact', head: true }).eq('lido', false),
      supabase.from('movimentacoes_estoque').select('valor_total').eq('tipo', 'perda').gte('created_at', inicioMes).lte('created_at', fimMes),
      ...meses.map(m =>
        supabase.from('vendas').select('valor_final')
          .gte('data_venda', startOfMonth(m).toISOString())
          .lte('data_venda', endOfMonth(m).toISOString())
      ),
    ]);

    const totalVendasMes = vendasMes?.reduce((s, v) => s + (v.valor_final || 0), 0) || 0;
    const totalVendasMesAnt = vendasMesAnt?.reduce((s, v) => s + (v.valor_final || 0), 0) || 0;
    const variacaoVendas = totalVendasMesAnt > 0 ? ((totalVendasMes - totalVendasMesAnt) / totalVendasMesAnt) * 100 : 0;
    const totalPerdasMes = perdas?.reduce((s, p) => s + (p.valor_total || 0), 0) || 0;

    const vendasPorMes: { mes: string; valor: number }[] = meses.map((m, i) => ({
      mes: format(m, 'MMM', { locale: ptBR }),
      valor: vendasMeses[i]?.data?.reduce((s: number, v: any) => s + (v.valor_final || 0), 0) || 0,
    }));

    return {
      totalVendasMes,
      totalVendasMesAnterior: totalVendasMesAnt,
      variacaoVendas,
      totalProdutos: totalProd || 0,
      produtosBaixoEstoque: baixos?.length || 0,
      totalColaboradores: totalColab || 0,
      colaboradoresAtivos: colabAtivos || 0,
      totalPerdasMes,
      alertasNaoLidos: alertasNao || 0,
      vendasPorMes,
    };
  }
};
