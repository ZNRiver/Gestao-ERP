import { useEffect, useState } from 'react';
import { apiColaboradores, apiProdutos, apiVendas, apiClientes } from '../../lib/api';
import { Plus, Trash2, ShoppingCart, Minus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { formatCurrency, parseCurrency } from '../../lib/format';

interface CartItem { produto_id: string; nome: string; quantidade: number; valor_unitario: number; valor_total: number; }

export default function VendasNova() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [produtos, setProdutos] = useState<any[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [clienteNome, setClienteNome] = useState('');
  const [desconto, setDesconto] = useState('0');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [vendedorId, setVendedorId] = useState<string | null>(null);
  const [clientes, setClientes] = useState<any[]>([]);
  const [clienteId, setClienteId] = useState('');

  useEffect(() => {
    Promise.all([
      apiProdutos.list().then(p => setProdutos(p.filter((x: any) => x.ativo))),
      apiColaboradores.list().then(d => {
        const found = d.find((c: any) => c.profile_id === profile?.id || c.nome === profile?.nome);
        if (found) setVendedorId(found.id);
      }),
      apiClientes.list().then(setClientes),
    ]).finally(() => setLoading(false));
  }, [profile]);

  function addToCart(p: any) {
    const existing = cart.find(i => i.produto_id === p.id);
    if (existing) setCart(cart.map(i => i.produto_id === p.id ? { ...i, quantidade: i.quantidade + 1, valor_total: (i.quantidade + 1) * i.valor_unitario } : i));
    else setCart([...cart, { produto_id: p.id, nome: p.descricao, quantidade: 1, valor_unitario: p.preco_venda, valor_total: p.preco_venda }]);
  }

  function updateQty(pid: string, d: number) {
    setCart(cart.map(i => i.produto_id !== pid ? i : { ...i, quantidade: Math.max(0, i.quantidade + d), valor_total: Math.max(0, i.quantidade + d) * i.valor_unitario }).filter(i => i.quantidade > 0));
  }

  const subtotal = cart.reduce((s, i) => s + i.valor_total, 0);
  const total = Math.max(0, subtotal - parseCurrency(desconto));

  async function finalizar() {
    if (cart.length === 0) return alert('Adicione ao menos um produto');
    setSubmitting(true);
    try {
      await apiVendas.create({ vendedor_id: vendedorId, cliente_id: clienteId || undefined, cliente_nome: clienteNome || null, desconto: parseCurrency(desconto), itens: cart.map(i => ({ produto_id: i.produto_id, quantidade: i.quantidade, valor_unitario: i.valor_unitario })) });
      navigate('/vendas');
    } catch { alert('Erro ao criar venda'); }
    setSubmitting(false);
  }

  const filtered = produtos.filter((p: any) => p.descricao.toLowerCase().includes(search.toLowerCase()) || p.codigo?.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin h-10 w-10 border-4 border-primary-500 border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-gray-900">Nova Venda</h1><p className="text-gray-500 mt-1">Registre uma venda de forma rápida</p></div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <input className="input" placeholder="Buscar produto..." value={search} onChange={e => setSearch(e.target.value)} />
          <div className="card overflow-hidden !p-0 max-h-[500px] overflow-y-auto"><table className="w-full text-sm"><thead><tr className="bg-gray-50 text-left sticky top-0"><th className="px-3 py-2 font-medium text-gray-500">Produto</th><th className="px-3 py-2 font-medium text-gray-500">Preço</th><th className="px-3 py-2 font-medium text-gray-500">Estoque</th><th className="px-3 py-2"></th></tr></thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((p: any) => (
                <tr key={p.id} className="hover:bg-gray-50"><td className="px-3 py-2"><span className="font-medium">{p.descricao}</span><span className="text-xs text-gray-400 ml-2">{p.codigo}</span></td><td className="px-3 py-2 font-medium">R$ {p.preco_venda.toFixed(2)}</td><td className="px-3 py-2"><span className={p.estoque_atual <= p.estoque_minimo ? 'text-red-600' : 'text-gray-500'}>{p.estoque_atual}</span></td><td className="px-3 py-2"><button onClick={() => addToCart(p)} className="btn-primary btn-sm" disabled={p.estoque_atual <= 0}><Plus size={14} /></button></td></tr>
              ))}
            </tbody></table></div>
        </div>
        <div className="card flex flex-col">
          <div className="flex items-center gap-2 mb-4"><ShoppingCart size={20} className="text-primary-600" /><h3 className="font-semibold">Carrinho</h3><span className="badge-info ml-auto">{cart.length} itens</span></div>
          <div className="space-y-3 flex-1 max-h-[350px] overflow-y-auto mb-4">
            {cart.map(item => (
              <div key={item.produto_id} className="flex items-center justify-between gap-2 bg-gray-50 rounded-lg p-3">
                <div className="min-w-0 flex-1"><p className="text-sm font-medium truncate">{item.nome}</p><p className="text-xs text-gray-500">R$ {item.valor_unitario.toFixed(2)} x {item.quantidade}</p></div>
                <div className="flex items-center gap-1"><button onClick={() => updateQty(item.produto_id, -1)} className="btn-ghost btn-sm p-1"><Minus size={14} /></button><span className="w-6 text-center text-sm font-medium">{item.quantidade}</span><button onClick={() => updateQty(item.produto_id, 1)} className="btn-ghost btn-sm p-1"><Plus size={14} /></button></div>
                <p className="text-sm font-semibold w-20 text-right">R$ {item.valor_total.toFixed(2)}</p>
              </div>
            ))}
            {cart.length === 0 && <p className="text-gray-400 text-sm text-center py-8">Carrinho vazio</p>}
          </div>
            <div className="border-t border-gray-100 pt-4 space-y-3">
              <div><label className="label text-xs">Cliente</label>
                <div className="flex gap-2">
                  <select className="input flex-1" value={clienteId} onChange={e => { setClienteId(e.target.value); const c = clientes.find(x => x.id === e.target.value); setClienteNome(c?.nome || ''); }}>
                    <option value="">Sem cliente</option>
                    {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                  </select>
                </div>
                {!clienteId && <input className="input mt-2" placeholder="Ou digite o nome (opcional)" value={clienteNome} onChange={e => setClienteNome(e.target.value)} />}
              </div>
            <div><label className="label text-xs">Desconto</label><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">R$</span><input className="input pl-9" placeholder="0,00" value={desconto} onChange={e => setDesconto(formatCurrency(e.target.value))} /></div></div>
            <div className="flex justify-between font-medium text-sm py-1"><span>Subtotal</span><span>R$ {subtotal.toFixed(2)}</span></div>
            {parseCurrency(desconto) > 0 && <div className="flex justify-between text-sm text-green-600"><span>Desconto</span><span>- R$ {parseCurrency(desconto).toFixed(2)}</span></div>}
            <div className="flex justify-between font-bold text-lg border-t border-gray-200 pt-2"><span>Total</span><span className="text-primary-700">R$ {total.toFixed(2)}</span></div>
            <button onClick={finalizar} disabled={submitting || cart.length === 0} className="btn-success w-full btn-lg">{submitting ? 'Processando...' : 'Finalizar Venda'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}