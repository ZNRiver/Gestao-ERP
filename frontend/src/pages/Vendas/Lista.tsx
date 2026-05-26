import { useEffect, useState } from 'react';
import { apiVendas } from '../../lib/api';
import { format } from 'date-fns';
import { Search, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function VendasLista() {
  const [vendas, setVendas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => { apiVendas.list().then(setVendas).finally(() => setLoading(false)); }, []);

  const sm: Record<string, string> = { pendente: 'badge-neutral', aprovado: 'badge-info', em_separacao: 'badge-warning', enviado: 'badge-info', entregue: 'badge-success', cancelado: 'badge-danger' };
  const filtered = vendas.filter((v: any) => v.numero_pedido?.toLowerCase().includes(search.toLowerCase()) || v.cliente_nome?.toLowerCase().includes(search.toLowerCase()) || v.vendedor?.nome?.toLowerCase().includes(search.toLowerCase()));
  const total = filtered.reduce((s: number, v: any) => s + v.valor_final, 0);

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin h-10 w-10 border-4 border-primary-500 border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-gray-900">Vendas</h1><p className="text-gray-500 mt-1">Total: <span className="font-semibold text-primary-700">R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></p></div>
        <Link to="/vendas/nova" className="btn-primary"><Plus size={18} /> Nova Venda</Link>
      </div>
      <div className="relative"><Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input className="input pl-10" placeholder="Buscar por número, cliente ou vendedor..." value={search} onChange={e => setSearch(e.target.value)} /></div>
      <div className="card overflow-hidden !p-0"><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="bg-gray-50 text-left"><th className="px-4 py-3 font-medium text-gray-500">Pedido</th><th className="px-4 py-3 font-medium text-gray-500">Data</th><th className="px-4 py-3 font-medium text-gray-500">Cliente</th><th className="px-4 py-3 font-medium text-gray-500">Vendedor</th><th className="px-4 py-3 font-medium text-gray-500">Itens</th><th className="px-4 py-3 font-medium text-gray-500">Total</th><th className="px-4 py-3 font-medium text-gray-500">Status</th></tr></thead>
        <tbody className="divide-y divide-gray-100">
          {filtered.map((v: any) => (
            <tr key={v.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 font-mono font-medium text-xs">{v.numero_pedido}</td>
              <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{format(new Date(v.data_venda), 'dd/MM/yy HH:mm')}</td>
              <td className="px-4 py-3 font-medium">{v.cliente?.nome || v.cliente_nome || 'Consumidor'}</td>
              <td className="px-4 py-3 text-gray-500">{v.vendedor?.nome || '—'}</td>
              <td className="px-4 py-3">{v.itens?.length || 0}</td>
              <td className="px-4 py-3 font-semibold">R$ {v.valor_final.toFixed(2)}</td>
              <td className="px-4 py-3"><span className={`${sm[v.status] || 'badge-neutral'} capitalize`}>{v.status?.replace('_', ' ')}</span></td>
            </tr>
          ))}
          {filtered.length === 0 && <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-400">Nenhuma venda encontrada</td></tr>}
        </tbody></table></div></div>
    </div>
  );
}