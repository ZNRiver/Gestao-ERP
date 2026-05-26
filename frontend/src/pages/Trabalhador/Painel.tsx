import { useEffect, useState } from 'react';
import { apiColaboradores, apiProdutos, apiVendas } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { format, startOfMonth } from 'date-fns';
import { Gauge, Target, TrendingUp, DollarSign, Factory, CheckCircle, Clock, Plus } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function PainelTrabalhador() {
  const { profile } = useAuth();
  const [colaborador, setColaborador] = useState<any>(null);
  const [vendas, setVendas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    (async () => {
      try {
        const colabs = await apiColaboradores.list();
        const found = colabs.find((c: any) => c.profile_id === profile.id || c.nome === profile.nome);
        if (found) {
          setColaborador(found);
          const allVendas = await apiVendas.list();
          setVendas(allVendas.filter((x: any) => x.vendedor_id === found.id));
        } else {
          const allVendas = await apiVendas.list();
          setVendas(allVendas.filter((x: any) => x.vendedor_id === null));
        }
      } catch { /* silent */ }
      setLoading(false);
    })();
  }, [profile]);

  const inicio = startOfMonth(new Date()).toISOString();
  const totalVendasMes = vendas.filter((v: any) => v.data_venda >= inicio).reduce((s: number, v: any) => s + v.valor_final, 0);

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin h-10 w-10 border-4 border-primary-500 border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-gray-900">Meu Painel</h1><p className="text-gray-500 mt-1">{colaborador ? `${colaborador.nome} — ${colaborador.matricula}` : profile?.nome}</p></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="card flex items-center gap-4"><div className="w-11 h-11 rounded-xl bg-green-100 flex items-center justify-center text-green-600"><DollarSign size={22} /></div><div><p className="text-sm text-gray-500">Vendas no Mês</p><p className="text-xl font-bold">R$ {totalVendasMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p></div></div>
        <div className="card flex items-center gap-4"><div className="w-11 h-11 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600"><Factory size={22} /></div><div><p className="text-sm text-gray-500">Minhas Vendas</p><p className="text-xl font-bold">{vendas.length} pedidos</p></div></div>
        <div className="card flex items-center gap-4"><div className="w-11 h-11 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600"><Target size={22} /></div><div><p className="text-sm text-gray-500">Performance</p><p className="text-xl font-bold">{totalVendasMes > 0 ? 'Ativo' : 'Iniciante'}</p></div></div>
      </div>
      <div className="card">
        <div className="flex items-center gap-2 mb-4"><TrendingUp size={18} className="text-green-600" /><h3 className="font-semibold">Minhas Vendas Recentes</h3></div>
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {vendas.slice(0, 15).map((v: any) => (
            <div key={v.id} className="flex justify-between items-center text-sm bg-gray-50 rounded-lg p-3">
              <div><p className="font-medium text-xs font-mono">{v.numero_pedido}</p><p className="text-xs text-gray-400">{format(new Date(v.data_venda), 'dd/MM HH:mm')} — {v.cliente_nome || 'Consumidor'}</p></div>
              <div className="text-right"><p className="font-semibold">R$ {v.valor_final.toFixed(2)}</p><span className="badge-neutral text-[10px] capitalize">{v.status}</span></div>
            </div>
          ))}
          {vendas.length === 0 && <p className="text-gray-400 text-sm text-center py-6">Nenhuma venda registrada</p>}
        </div>
      </div>
    </div>
  );
}