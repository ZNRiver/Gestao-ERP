import { useEffect, useState } from 'react';
import { apiMovimentacoes, apiProdutos } from '../../lib/api';
import { format } from 'date-fns';
import { Plus, ArrowDownToLine, ArrowUpFromLine, Trash2, Wrench, Factory } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { formatCurrency, parseCurrency, centsFromReais } from '../../lib/format';

const icons: Record<string, React.ReactNode> = {
  entrada: <ArrowDownToLine size={16} className="text-green-600" />,
  saida: <ArrowUpFromLine size={16} className="text-red-600" />,
  perda: <Trash2 size={16} className="text-amber-600" />,
  ajuste: <Wrench size={16} className="text-blue-600" />,
  producao: <Factory size={16} className="text-purple-600" />
};

export default function EstoqueMovimentacoes() {
  const { isGerenteOuAcima } = useAuth();
  const [movs, setMovs] = useState<any[]>([]);
  const [produtos, setProdutos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ produto_id: '', tipo: 'entrada', quantidade: '1', valor_unitario: '0', motivo: '' });

  useEffect(() => {
    Promise.all([apiMovimentacoes.list(), apiProdutos.list()]).then(([m, p]) => { setMovs(m); setProdutos(p.filter((x: any) => x.ativo)); if (p.length > 0) setForm(f => ({ ...f, produto_id: p[0].id })); setLoading(false); });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();     await apiMovimentacoes.create({ ...form, quantidade: parseInt(form.quantidade), valor_unitario: parseCurrency(form.valor_unitario) }); setShowForm(false); apiMovimentacoes.list().then(setMovs);
  }

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin h-10 w-10 border-4 border-primary-500 border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-gray-900">Movimentações de Estoque</h1><p className="text-gray-500 mt-1">Entradas, saídas, perdas e ajustes</p></div>
        {isGerenteOuAcima && <button onClick={() => setShowForm(true)} className="btn-primary"><Plus size={18} /> Nova Movimentação</button>}
      </div>
      <div className="card overflow-hidden !p-0"><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="bg-gray-50 text-left"><th className="px-4 py-3 font-medium text-gray-500">Data</th><th className="px-4 py-3 font-medium text-gray-500">Tipo</th><th className="px-4 py-3 font-medium text-gray-500">Produto</th><th className="px-4 py-3 font-medium text-gray-500">Estoque</th><th className="px-4 py-3 font-medium text-gray-500">Qtd</th><th className="px-4 py-3 font-medium text-gray-500">Valor</th><th className="px-4 py-3 font-medium text-gray-500">Motivo</th></tr></thead>
        <tbody className="divide-y divide-gray-100">
          {movs.map((m: any) => (
            <tr key={m.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{format(new Date(m.created_at), 'dd/MM/yy HH:mm')}</td>
              <td className="px-4 py-3"><span className="inline-flex items-center gap-1 capitalize text-xs font-medium">{icons[m.tipo]} {m.tipo}</span></td>
              <td className="px-4 py-3 font-medium">{m.produto?.descricao || '—'}</td>
              <td className="px-4 py-3 font-mono text-xs text-gray-500">{m.produto?.estoque_atual ?? '—'}</td>
              <td className={`px-4 py-3 font-mono font-medium ${m.quantidade < 0 ? 'text-red-600' : 'text-green-600'}`}>{m.quantidade > 0 ? '+' : ''}{m.quantidade}</td>
              <td className="px-4 py-3 font-medium">R$ {(m.valor_total || 0).toFixed(2)}</td>
              <td className="px-4 py-3 text-gray-500 max-w-[150px] truncate">{m.motivo || '—'}</td>
            </tr>
          ))}
          {movs.length === 0 && <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-400">Nenhuma movimentação</td></tr>}
        </tbody></table></div></div>
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 animate-fade-in" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-5 border-b border-gray-100"><h2 className="text-lg font-semibold">Nova Movimentação</h2></div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div><label className="label">Produto</label><select className="input" value={form.produto_id} onChange={e => { const p = produtos.find(x => x.id === e.target.value); setForm({ ...form, produto_id: e.target.value, valor_unitario: formatCurrency(centsFromReais(p?.preco_custo || 0)) }); }} required>{produtos.map((p: any) => <option key={p.id} value={p.id}>{p.descricao} (Estoque: {p.estoque_atual})</option>)}</select></div>
              <div><label className="label">Tipo</label><div className="grid grid-cols-3 gap-2">{['entrada', 'saida', 'producao', 'perda', 'ajuste'].map(t => <button key={t} type="button" onClick={() => setForm({ ...form, tipo: t })} className={`btn-sm rounded-lg border text-xs capitalize ${form.tipo === t ? 'bg-primary-50 border-primary-300 text-primary-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>{t}</button>)}</div></div>
              <div className="grid grid-cols-2 gap-4"><div><label className="label">Quantidade</label><input type="number" min="1" className="input" value={form.quantidade} onChange={e => setForm({ ...form, quantidade: e.target.value })} required /></div><div><label className="label">Valor Unit.</label><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">R$</span><input className="input pl-9" placeholder="0,00" value={form.valor_unitario} onChange={e => setForm({ ...form, valor_unitario: formatCurrency(e.target.value) })} /></div></div></div>
              <div className="flex justify-end gap-3 pt-2"><button type="button" onClick={() => setShowForm(false)} className="btn-outline">Cancelar</button><button type="submit" className="btn-primary">Registrar</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}