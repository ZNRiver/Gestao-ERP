import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiDashboard } from '../lib/api';
import { DollarSign, Users, Package, AlertTriangle, TrendingUp, TrendingDown, BarChart3, Clock } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useNavigate } from 'react-router-dom';

interface KPI { label: string; value: string; change: string; positive: boolean; icon: React.ReactNode; color: string; link: string; }

export default function Dashboard() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [vendasChart, setVendasChart] = useState<any[]>([]);
  const [totalPerdas, setTotalPerdas] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiDashboard.get().then(d => {
      setKpis([
        { label: 'Vendas do Mês', value: `R$ ${d.totalVendasMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, change: `${d.variacaoVendas >= 0 ? '+' : ''}${d.variacaoVendas.toFixed(1)}%`, positive: d.variacaoVendas >= 0, icon: <DollarSign size={22} />, color: 'bg-blue-500', link: '/vendas' },
        { label: 'Produtos', value: `${d.totalProdutos}`, change: `${d.produtosBaixoEstoque} baixo estoque`, positive: false, icon: <Package size={22} />, color: 'bg-amber-500', link: '/estoque/produtos' },
        { label: 'Colaboradores', value: `${d.colaboradoresAtivos}`, change: `de ${d.totalColaboradores} total`, positive: true, icon: <Users size={22} />, color: 'bg-green-500', link: '/rh/colaboradores' },
        { label: 'Perdas Mensais', value: `R$ ${d.totalPerdasMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, change: 'Monitorar', positive: false, icon: <AlertTriangle size={22} />, color: 'bg-red-500', link: '/estoque/movimentacoes' },
      ]);
      setVendasChart(d.vendasPorMes || []);
      setTotalPerdas(d.totalPerdasMes);
    }).finally(() => setLoading(false));
  }, []);

  const COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6', '#10b981'];

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin h-10 w-10 border-4 border-primary-500 border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Bem-vindo, {profile?.nome}. Confira os indicadores da empresa.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <div key={i} onClick={() => navigate(kpi.link)} className="card flex items-start gap-4 animate-fade-in cursor-pointer hover:shadow-md transition-shadow" style={{ animationDelay: `${i * 80}ms` }}>
            <div className={`${kpi.color} w-11 h-11 rounded-xl flex items-center justify-center text-white shrink-0`}>{kpi.icon}</div>
            <div className="min-w-0">
              <p className="text-sm text-gray-500">{kpi.label}</p>
              <p className="text-xl font-bold text-gray-900 mt-0.5 truncate">{kpi.value}</p>
              <p className={`text-xs mt-1 flex items-center gap-1 ${kpi.positive ? 'text-green-600' : 'text-red-500'}`}>
                {kpi.positive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}{kpi.change}
              </p>
            </div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card lg:col-span-2">
          <div className="flex items-center gap-2 mb-6"><BarChart3 size={20} className="text-primary-600" /><h3 className="font-semibold text-gray-900">Vendas Últimos 6 Meses</h3></div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={vendasChart}>
              <defs><linearGradient id="grad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} /><stop offset="95%" stopColor="#3b82f6" stopOpacity={0} /></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="mes" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => [`R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Vendas']} />
              <Area type="monotone" dataKey="valor" stroke="#3b82f6" strokeWidth={2} fill="url(#grad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <div className="flex items-center gap-2 mb-4"><AlertTriangle size={20} className="text-danger-500" /><h3 className="font-semibold text-gray-900">Perdas</h3></div>
          <div className="flex items-center justify-center py-8 text-4xl font-bold text-danger-600">R$ {totalPerdas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card"><div className="flex items-center gap-2 mb-4"><Clock size={20} className="text-amber-500" /><h3 className="font-semibold text-gray-900">Resumo do Dia</h3></div><p className="text-gray-500 text-sm">Acesse os módulos de RH, Estoque e Vendas para gerenciar as operações. Verifique os <strong>alertas</strong> para itens que precisam de atenção imediata.</p></div>
        <div className="card bg-gradient-to-br from-primary-600 to-primary-800 text-white"><h3 className="font-semibold mb-2">Previsão Inteligente</h3><p className="text-primary-100 text-sm mb-4">O motor de previsão analisa histórico de vendas, sazonalidade e eventos para sugerir reposições.</p><a href="/previsao" className="inline-flex items-center gap-1 text-sm font-medium text-white/90 hover:text-white">Ver previsões <TrendingUp size={14} /></a></div>
      </div>
    </div>
  );
}