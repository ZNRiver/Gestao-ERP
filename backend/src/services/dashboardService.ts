import { query, queryOne } from '../lib/db.js';
import { DashboardData } from '../types/index.js';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const dashboardService = {
  async getDashboard(): Promise<DashboardData> {
    const hoje = new Date();
    const fmt = (d: Date) => format(d, 'yyyy-MM-dd');
    const inicioMes = fmt(startOfMonth(hoje));
    const fimMes = fmt(endOfMonth(hoje));
    const inicioMesAnt = fmt(startOfMonth(subMonths(hoje, 1)));
    const fimMesAnt = fmt(endOfMonth(subMonths(hoje, 1)));
    const inicioJanela = fmt(startOfMonth(subMonths(hoje, 5)));

    const [
      vendasMes,
      vendasMesAnt,
      totalProd,
      baixos,
      totalColab,
      colabAtivos,
      alertasNao,
      perdas,
      vendasMeses,
    ] = await Promise.all([
      queryOne<{ total: number }>(
        `SELECT COALESCE(SUM(valor_final), 0)::float8 AS total FROM vendas WHERE data_venda BETWEEN $1 AND $2`,
        [inicioMes, fimMes],
      ),
      queryOne<{ total: number }>(
        `SELECT COALESCE(SUM(valor_final), 0)::float8 AS total FROM vendas WHERE data_venda BETWEEN $1 AND $2`,
        [inicioMesAnt, fimMesAnt],
      ),
      queryOne<{ total: number }>(`SELECT COUNT(*)::int AS total FROM produtos`),
      queryOne<{ total: number }>(`SELECT COUNT(*)::int AS total FROM produtos WHERE estoque_atual <= 10`),
      queryOne<{ total: number }>(`SELECT COUNT(*)::int AS total FROM colaboradores`),
      queryOne<{ total: number }>(`SELECT COUNT(*)::int AS total FROM colaboradores WHERE status = 'ativo'`),
      queryOne<{ total: number }>(`SELECT COUNT(*)::int AS total FROM alertas WHERE lido = false`),
      queryOne<{ total: number }>(
        `SELECT COALESCE(SUM(valor_total), 0)::float8 AS total FROM movimentacoes_estoque
         WHERE tipo = 'perda' AND created_at BETWEEN $1 AND $2`,
        [inicioMes, fimMes],
      ),
      query<{ ym: string; total: number }>(
        `SELECT to_char(data_venda, 'YYYY-MM') AS ym, COALESCE(SUM(valor_final), 0)::float8 AS total
         FROM vendas WHERE data_venda >= $1 GROUP BY ym`,
        [inicioJanela],
      ),
    ]);

    const totalVendasMes = vendasMes?.total || 0;
    const totalVendasMesAnt = vendasMesAnt?.total || 0;
    const variacaoVendas = totalVendasMesAnt > 0 ? ((totalVendasMes - totalVendasMesAnt) / totalVendasMesAnt) * 100 : 0;

    const meses = Array.from({ length: 6 }, (_, i) => subMonths(hoje, 5 - i));
    const vendasPorMes: { mes: string; valor: number }[] = meses.map((m) => {
      const ym = format(m, 'yyyy-MM');
      const encontrado = vendasMeses.find((r) => r.ym === ym);
      return { mes: format(m, 'MMM', { locale: ptBR }), valor: encontrado?.total || 0 };
    });

    return {
      totalVendasMes,
      totalVendasMesAnterior: totalVendasMesAnt,
      variacaoVendas,
      totalProdutos: totalProd?.total || 0,
      produtosBaixoEstoque: baixos?.total || 0,
      totalColaboradores: totalColab?.total || 0,
      colaboradoresAtivos: colabAtivos?.total || 0,
      totalPerdasMes: perdas?.total || 0,
      alertasNaoLidos: alertasNao?.total || 0,
      vendasPorMes,
    };
  }
};
