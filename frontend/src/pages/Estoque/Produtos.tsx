import { useEffect, useState } from 'react';
import { apiProdutos, apiCategorias, apiMovimentacoes } from '../../lib/api';
import { formatCurrency, parseCurrency, centsFromReais } from '../../lib/format';
import { Plus, Search, Edit, Trash2, PlusCircle, MinusCircle, AlertTriangle, TrendingDown, TrendingUp, Package, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const ICON_OPTIONS = [
  { label: 'Package', url: 'https://cdn.jsdelivr.net/npm/lucide-static@0.454.0/icons/package.svg' },
  { label: 'Shopping Bag', url: 'https://cdn.jsdelivr.net/npm/lucide-static@0.454.0/icons/shopping-bag.svg' },
  { label: 'Box', url: 'https://cdn.jsdelivr.net/npm/lucide-static@0.454.0/icons/box.svg' },
  { label: 'Spray Can', url: 'https://cdn.jsdelivr.net/npm/lucide-static@0.454.0/icons/spray-can.svg' },
  { label: 'Briefcase', url: 'https://cdn.jsdelivr.net/npm/lucide-static@0.454.0/icons/briefcase.svg' },
  { label: 'Truck', url: 'https://cdn.jsdelivr.net/npm/lucide-static@0.454.0/icons/truck.svg' },
  { label: 'Tag', url: 'https://cdn.jsdelivr.net/npm/lucide-static@0.454.0/icons/tag.svg' },
  { label: 'Star', url: 'https://cdn.jsdelivr.net/npm/lucide-static@0.454.0/icons/star.svg' },
  { label: 'Heart', url: 'https://cdn.jsdelivr.net/npm/lucide-static@0.454.0/icons/heart.svg' },
  { label: 'Shield', url: 'https://cdn.jsdelivr.net/npm/lucide-static@0.454.0/icons/shield.svg' },
];

type Tab = 'produtos' | 'categorias';

export default function EstoqueProdutos() {
  const { isGerenteOuAcima } = useAuth();
  const [tab, setTab] = useState<Tab>('produtos');
  const [produtos, setProdutos] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [confirmDelete, setConfirmDelete] = useState<any>(null);
  const [stockTarget, setStockTarget] = useState<any>(null);
  const [stockTipo, setStockTipo] = useState<'entrada' | 'saida'>('entrada');
  const [stockQtd, setStockQtd] = useState('1');
  const [stockMotivo, setStockMotivo] = useState('');
  const [form, setForm] = useState({ codigo: '', descricao: '', categoria_id: '', preco_custo: '0', preco_venda: '0', estoque_atual: '0', estoque_minimo: '10', estoque_maximo: '500', unidade: 'un' });

  // Categoria form state
  const [showCatForm, setShowCatForm] = useState(false);
  const [editingCat, setEditingCat] = useState<any>(null);
  const [catForm, setCatForm] = useState({ nome: '', descricao: '', icone: ICON_OPTIONS[0].url });

  useEffect(() => {
    Promise.all([apiProdutos.list(), apiCategorias.list()]).then(([p, c]) => { setProdutos(p); setCategorias(c); setLoading(false); });
  }, []);

  function loadCategorias() {
    apiCategorias.list().then(setCategorias);
  }

  function gerarCodigo() { return 'PROD-' + Math.random().toString(36).substring(2, 8).toUpperCase(); }

  function openNew() { setEditing(null); setForm({ codigo: gerarCodigo(), descricao: '', categoria_id: categorias[0]?.id || '', preco_custo: '0', preco_venda: '0', estoque_atual: '0', estoque_minimo: '10', estoque_maximo: '500', unidade: 'un' }); setShowForm(true); }
  function openEdit(p: any) { setEditing(p); setForm({ codigo: p.codigo || '', descricao: p.descricao, categoria_id: p.categoria_id || '', preco_custo: formatCurrency(centsFromReais(p.preco_custo)), preco_venda: formatCurrency(centsFromReais(p.preco_venda)), estoque_atual: String(p.estoque_atual), estoque_minimo: String(p.estoque_minimo), estoque_maximo: String(p.estoque_maximo), unidade: p.unidade }); setShowForm(true); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = { ...form, preco_custo: parseCurrency(form.preco_custo), preco_venda: parseCurrency(form.preco_venda), estoque_atual: parseInt(form.estoque_atual), estoque_minimo: parseInt(form.estoque_minimo), estoque_maximo: parseInt(form.estoque_maximo) };
    if (editing) await apiProdutos.update(editing.id, payload);
    else await apiProdutos.create(payload);
    setShowForm(false);
    apiProdutos.list().then(setProdutos);
  }

  async function handleDelete(id: string) {
    try {
      await apiProdutos.delete(id);
      setConfirmDelete(null);
      apiProdutos.list().then(setProdutos);
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir produto');
    }
  }

  function openStock(p: any, tipo: 'entrada' | 'saida') {
    setStockTarget(p);
    setStockTipo(tipo);
    setStockQtd('1');
    setStockMotivo('');
  }

  async function handleStockSubmit(e: React.FormEvent) {
    e.preventDefault();
    const qtd = parseInt(stockQtd);
    if (!qtd || qtd <= 0) return alert('Quantidade deve ser maior que zero');
    await apiMovimentacoes.create({ produto_id: stockTarget.id, tipo: stockTipo, quantidade: qtd, motivo: stockMotivo || undefined });
    setStockTarget(null);
    apiProdutos.list().then(setProdutos);
  }

  const filtered = produtos.filter((p: any) => {
    const matchesSearch = p.descricao.toLowerCase().includes(search.toLowerCase()) || p.codigo?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || p.categoria?.nome === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const countByCategory = (nome: string) => produtos.filter(p => p.categoria?.nome === nome).length;

  const st = (p: any) => p.estoque_atual <= p.estoque_minimo ? { cls: 'text-red-600 bg-red-50', icon: <AlertTriangle size={14} />, label: 'Baixo' } : p.estoque_atual >= p.estoque_maximo ? { cls: 'text-amber-600 bg-amber-50', icon: <TrendingUp size={14} />, label: 'Excesso' } : { cls: 'text-green-600 bg-green-50', icon: <TrendingDown size={14} />, label: 'Normal' };

  // Categoria handlers
  function openNewCat() {
    setEditingCat(null);
    setCatForm({ nome: '', descricao: '', icone: ICON_OPTIONS[0].url });
    setShowCatForm(true);
  }

  function openEditCat(c: any) {
    setEditingCat(c);
    setCatForm({ nome: c.nome, descricao: c.descricao || '', icone: c.icone || ICON_OPTIONS[0].url });
    setShowCatForm(true);
  }

  async function handleCatSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!catForm.nome.trim()) return alert('Nome da categoria é obrigatório');
    const payload = { nome: catForm.nome.trim(), descricao: catForm.descricao.trim() || null, icone: catForm.icone };
    if (editingCat) await apiCategorias.update(editingCat.id, payload);
    else await apiCategorias.create(payload);
    setShowCatForm(false);
    loadCategorias();
  }

  async function handleDeleteCat(id: string) {
    try {
      await apiCategorias.remove(id);
      setConfirmDelete(null);
      loadCategorias();
      apiProdutos.list().then(setProdutos);
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir categoria');
    }
  }

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin h-10 w-10 border-4 border-primary-500 border-t-transparent rounded-full" /></div>;

  const tabs: { key: Tab; label: string }[] = [
    { key: 'produtos', label: 'Produtos' },
    { key: 'categorias', label: 'Categorias' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex gap-1 border-b border-gray-200">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === t.key
                ? 'border-primary-600 text-primary-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'produtos' && (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div><h1 className="text-2xl font-bold text-gray-900">Produtos</h1><p className="text-gray-500 mt-1">{filtered.length} produto{filtered.length !== 1 ? 's' : ''} • {filtered.filter((p: any) => p.estoque_atual <= p.estoque_minimo).length} com estoque baixo</p></div>
            {isGerenteOuAcima && <button onClick={openNew} className="btn-primary"><Plus size={18} /> Novo Produto</button>}
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setCategoryFilter('all')}
              className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${categoryFilter === 'all' ? 'bg-primary-100 text-primary-700 ring-1 ring-primary-300' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
            >
              <Package size={16} />
              Todos
              <span className={`ml-1 text-xs px-1.5 py-0.5 rounded-full ${categoryFilter === 'all' ? 'bg-primary-200 text-primary-700' : 'bg-gray-200 text-gray-500'}`}>{produtos.length}</span>
            </button>
            {categorias.map((cat: any) => {
              const count = countByCategory(cat.nome);
              if (count === 0) return null;
              return (
                <button
                  key={cat.id}
                  onClick={() => setCategoryFilter(cat.nome)}
                  className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${categoryFilter === cat.nome ? 'bg-primary-100 text-primary-700 ring-1 ring-primary-300' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
                >
                  {cat.icone ? (
                    <img src={cat.icone} alt="" className="w-4 h-4" />
                  ) : (
                    <Package size={16} />
                  )}
                  {cat.nome}
                  <span className={`ml-1 text-xs px-1.5 py-0.5 rounded-full ${categoryFilter === cat.nome ? 'bg-primary-200 text-primary-700' : 'bg-gray-200 text-gray-500'}`}>{count}</span>
                </button>
              );
            })}
          </div>

          <div className="relative"><Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input className="input pl-10" placeholder="Buscar por nome ou código..." value={search} onChange={e => setSearch(e.target.value)} /></div>

          <div className="card overflow-hidden !p-0">
            <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="bg-gray-50 text-left"><th className="px-4 py-3 font-medium text-gray-500">Código</th><th className="px-4 py-3 font-medium text-gray-500">Produto</th><th className="px-4 py-3 font-medium text-gray-500">Categoria</th><th className="px-4 py-3 font-medium text-gray-500">Custo</th><th className="px-4 py-3 font-medium text-gray-500">Venda</th><th className="px-4 py-3 font-medium text-gray-500">Estoque</th><th className="px-4 py-3 font-medium text-gray-500">Status</th><th className="px-4 py-3 font-medium text-gray-500">Ações</th></tr></thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((p: any) => {
                  const s = st(p);
                  return (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">{p.codigo || '—'}</td>
                      <td className="px-4 py-3 font-medium">{p.descricao}</td>
                      <td className="px-4 py-3">
                        {p.categoria ? (
                          <div className="flex items-center gap-1.5">
                            {p.categoria.icone ? (
                              <img src={p.categoria.icone} alt="" className="w-4 h-4" />
                            ) : (
                              <Package size={14} className="text-gray-400" />
                            )}
                            <span>{p.categoria.nome}</span>
                          </div>
                        ) : <span className="text-gray-400">—</span>}
                      </td>
                      <td className="px-4 py-3">R$ {p.preco_custo.toFixed(2)}</td>
                      <td className="px-4 py-3 font-medium">R$ {p.preco_venda.toFixed(2)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2"><span className="font-mono font-medium">{p.estoque_atual}</span><span className="text-gray-400 text-xs">{p.unidade}</span></div>
                        <div className="w-full bg-gray-100 h-1 rounded-full mt-1"><div className={`h-1 rounded-full ${p.estoque_atual <= p.estoque_minimo ? 'bg-red-500' : p.estoque_atual >= p.estoque_maximo ? 'bg-amber-500' : 'bg-green-500'}`} style={{ width: `${Math.min(100, (p.estoque_atual / p.estoque_maximo) * 100)}%` }} /></div>
                      </td>
                      <td className="px-4 py-3"><span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${s.cls}`}>{s.icon} {s.label}</span></td>
                      <td className="px-4 py-3">{isGerenteOuAcima && <div className="flex items-center gap-1"><button onClick={() => openStock(p, 'entrada')} className="btn-ghost btn-sm text-green-600"><PlusCircle size={14} /> Adicionar</button><button onClick={() => openStock(p, 'saida')} className="btn-ghost btn-sm text-amber-600"><MinusCircle size={14} /> Subtrair</button><button onClick={() => openEdit(p)} className="btn-ghost btn-sm text-primary-600"><Edit size={14} /> Editar</button><button onClick={() => setConfirmDelete(p)} className="btn-ghost btn-sm text-red-600"><Trash2 size={14} /> Excluir</button></div>}</td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && <tr><td colSpan={8} className="px-4 py-10 text-center text-gray-400">Nenhum produto encontrado</td></tr>}
              </tbody></table></div>
          </div>
        </>
      )}

      {tab === 'categorias' && (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div><h1 className="text-2xl font-bold text-gray-900">Categorias</h1><p className="text-gray-500 mt-1">{categorias.length} categoria{categorias.length !== 1 ? 's' : ''} cadastrada{categorias.length !== 1 ? 's' : ''}</p></div>
            {isGerenteOuAcima && <button onClick={openNewCat} className="btn-primary"><Plus size={18} /> Nova Categoria</button>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categorias.map((cat: any) => {
              return (
                <div key={cat.id} className="card flex items-center gap-4 p-4">
                  <div className="w-16 h-16 rounded-xl flex items-center justify-center text-gray-600 bg-gray-100 shrink-0">
                    {cat.icone ? (
                      <img src={cat.icone} alt={cat.nome} className="w-8 h-8" />
                    ) : (
                      <Package size={24} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{cat.nome}</h3>
                    {cat.descricao && <p className="text-sm text-gray-500 truncate">{cat.descricao}</p>}
                    <p className="text-xs text-gray-400 mt-1">
                      {countByCategory(cat.nome)} produto{countByCategory(cat.nome) !== 1 ? 's' : ''}
                    </p>
                  </div>
                  {isGerenteOuAcima && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => openEditCat(cat)} className="btn-ghost btn-sm text-primary-600"><Edit size={14} /></button>
                      <button onClick={() => setConfirmDelete(cat)} className="btn-ghost btn-sm text-red-600"><Trash2 size={14} /></button>
                    </div>
                  )}
                </div>
              );
            })}
            {categorias.length === 0 && (
              <div className="col-span-full text-center py-16 text-gray-400">
                <Package size={48} className="mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium text-gray-500">Nenhuma categoria cadastrada</p>
                <p className="text-sm mt-1">Clique em "Nova Categoria" para começar</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Produto Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 animate-fade-in max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-5 border-b border-gray-100"><h2 className="text-lg font-semibold">{editing ? 'Editar Produto' : 'Novo Produto'}</h2></div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-3 gap-4"><div className="col-span-2"><label className="label">Descrição</label><input className="input" value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} required /></div><div><label className="label">Código</label><input className="input bg-gray-50 text-gray-500 cursor-not-allowed" value={form.codigo} readOnly /></div></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label">Categoria</label><select className="input" value={form.categoria_id} onChange={e => setForm({ ...form, categoria_id: e.target.value })}><option value="">Selecione...</option>{categorias.map((c: any) => <option key={c.id} value={c.id}>{c.nome}</option>)}</select></div>
                <div><label className="label">Unidade</label><select className="input" value={form.unidade} onChange={e => setForm({ ...form, unidade: e.target.value })}><option value="un">Unidade</option><option value="kg">Quilograma</option><option value="lt">Litro</option><option value="cx">Caixa</option></select></div>
              </div>
              <div className="grid grid-cols-2 gap-4"><div><label className="label">Preço Custo</label><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">R$</span><input className="input pl-9" placeholder="0,00" value={form.preco_custo} onChange={e => setForm({ ...form, preco_custo: formatCurrency(e.target.value) })} /></div></div><div><label className="label">Preço Venda</label><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">R$</span><input className="input pl-9" placeholder="0,00" value={form.preco_venda} onChange={e => setForm({ ...form, preco_venda: formatCurrency(e.target.value) })} /></div></div></div>
              {(() => {
                const custo = parseCurrency(form.preco_custo);
                const venda = parseCurrency(form.preco_venda);
                const margem = custo > 0 && venda > 0 ? ((venda - custo) / venda) * 100 : 0;
                const cor = margem >= 40 ? 'text-green-600' : margem >= 20 ? 'text-amber-600' : margem > 0 ? 'text-red-500' : 'text-gray-400';
                return (
                  <div className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3">
                    <span className="text-sm text-gray-600">Margem de lucro</span>
                    <span className={`text-sm font-bold ${cor}`}>{margem > 0 ? margem.toFixed(1) + '%' : '—'}</span>
                  </div>
                );
              })()}
              <div className="grid grid-cols-2 gap-4"><div><label className="label">Estoque Mínimo</label><input type="number" className="input" value={form.estoque_minimo} onChange={e => setForm({ ...form, estoque_minimo: e.target.value })} /></div><div><label className="label">Estoque Máximo</label><input type="number" className="input" value={form.estoque_maximo} onChange={e => setForm({ ...form, estoque_maximo: e.target.value })} /></div></div>
              <div className="flex justify-end gap-3 pt-4"><button type="button" onClick={() => setShowForm(false)} className="btn-outline">Cancelar</button><button type="submit" className="btn-primary">{editing ? 'Salvar' : 'Cadastrar'}</button></div>
            </form>
          </div>
        </div>
      )}

      {/* Categoria Form Modal */}
      {showCatForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowCatForm(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 animate-fade-in" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-5 border-b border-gray-100"><h2 className="text-lg font-semibold">{editingCat ? 'Editar Categoria' : 'Nova Categoria'}</h2></div>
            <form onSubmit={handleCatSubmit} className="p-6 space-y-4">
              <div>
                <label className="label">Nome <span className="text-red-500">*</span></label>
                <input className="input" placeholder="Ex: Matéria-Prima" value={catForm.nome} onChange={e => setCatForm({ ...catForm, nome: e.target.value })} required />
              </div>
              <div>
                <label className="label">Descrição <span className="text-gray-400 font-normal">(opcional)</span></label>
                <input className="input" placeholder="Breve descrição da categoria" value={catForm.descricao} onChange={e => setCatForm({ ...catForm, descricao: e.target.value })} />
              </div>
              <div>
                <label className="label">Ícone <span className="text-gray-400 font-normal">(URL ou escolha um)</span></label>
                <input className="input mb-3" placeholder="https://... ou selecione abaixo" value={catForm.icone} onChange={e => setCatForm({ ...catForm, icone: e.target.value })} />
                <div className="grid grid-cols-5 gap-2">
                  {ICON_OPTIONS.map(opt => (
                    <button
                      key={opt.url}
                      type="button"
                      onClick={() => setCatForm({ ...catForm, icone: opt.url })}
                      className={`flex flex-col items-center gap-1 p-2 rounded-lg border text-xs transition-colors ${
                        catForm.icone === opt.url
                          ? 'border-primary-500 bg-primary-50 text-primary-700'
                          : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <img src={opt.url} alt={opt.label} className="w-5 h-5" />
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowCatForm(false)} className="btn-outline">Cancelar</button>
                <button type="submit" className="btn-primary">{editingCat ? 'Salvar' : 'Cadastrar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Modal */}
      {stockTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setStockTarget(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 animate-fade-in" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-5 border-b border-gray-100"><h2 className="text-lg font-semibold">{stockTipo === 'entrada' ? 'Adicionar Estoque' : 'Subtrair Estoque'}</h2><p className="text-sm text-gray-500">{stockTarget.descricao} • Estoque atual: <strong>{stockTarget.estoque_atual}</strong></p></div>
            <form onSubmit={handleStockSubmit} className="p-6 space-y-4">
              <div><label className="label">Quantidade</label><input type="number" className="input" min={1} value={stockQtd} onChange={e => setStockQtd(e.target.value)} onFocus={e => e.target.select()} required /></div>
              <div><label className="label">Motivo <span className="text-gray-400 font-normal">(opcional)</span></label><input className="input" placeholder={stockTipo === 'entrada' ? 'Ex: Compra de fornecedor' : 'Ex: Transferência'} value={stockMotivo} onChange={e => setStockMotivo(e.target.value)} /></div>
              <div className="flex justify-end gap-3 pt-2"><button type="button" onClick={() => setStockTarget(null)} className="btn-outline">Cancelar</button><button type="submit" className={stockTipo === 'entrada' ? 'btn-success' : 'btn-danger'}>{stockTipo === 'entrada' ? 'Adicionar' : 'Subtrair'}</button></div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setConfirmDelete(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6 animate-fade-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4"><div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center"><AlertTriangle size={20} className="text-red-600" /></div><div><h2 className="text-lg font-semibold">Excluir {confirmDelete.codigo !== undefined ? 'Produto' : 'Categoria'}</h2><p className="text-sm text-gray-500">Esta ação não pode ser desfeita</p></div></div>
            <p className="text-sm text-gray-700 mb-6">
              Tem certeza que deseja excluir <strong>{confirmDelete.descricao || confirmDelete.nome}</strong>?
              {confirmDelete.codigo === undefined && <span className="block text-amber-600 mt-1">Produtos nesta categoria ficarão sem categoria.</span>}
            </p>
            <div className="flex justify-end gap-3"><button onClick={() => setConfirmDelete(null)} className="btn-outline">Cancelar</button><button onClick={() => confirmDelete.codigo !== undefined ? handleDelete(confirmDelete.id) : handleDeleteCat(confirmDelete.id)} className="btn-danger flex items-center gap-2"><Trash2 size={16} /> Excluir</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
