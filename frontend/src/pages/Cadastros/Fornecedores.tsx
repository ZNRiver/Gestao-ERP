import { useEffect, useState } from 'react';
import { apiFornecedores } from '../../lib/api';
import { Plus, Edit, Trash2, Search, Building2, Phone, Mail, MapPin } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function CadFornecedores() {
  const { isGerenteOuAcima } = useAuth();
  const [fornecedores, setFornecedores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [confirmDelete, setConfirmDelete] = useState<any>(null);
  const [form, setForm] = useState({ nome: '', cnpj: '', inscricao_estadual: '', contato_nome: '', contato_telefone: '', contato_email: '', endereco: '', cidade: '', estado: '', observacao: '' });

  useEffect(() => { apiFornecedores.list().then(d => { setFornecedores(d); setLoading(false); }); }, []);

  function openNew() { setEditing(null); setForm({ nome: '', cnpj: '', inscricao_estadual: '', contato_nome: '', contato_telefone: '', contato_email: '', endereco: '', cidade: '', estado: '', observacao: '' }); setShowForm(true); }
  function openEdit(f: any) { setEditing(f); setForm({ nome: f.nome, cnpj: f.cnpj || '', inscricao_estadual: f.inscricao_estadual || '', contato_nome: f.contato_nome || '', contato_telefone: f.contato_telefone || '', contato_email: f.contato_email || '', endereco: f.endereco || '', cidade: f.cidade || '', estado: f.estado || '', observacao: f.observacao || '' }); setShowForm(true); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editing) await apiFornecedores.update(editing.id, form);
    else await apiFornecedores.create(form);
    setShowForm(false);
    apiFornecedores.list().then(setFornecedores);
  }

  async function handleDelete() {
    if (!confirmDelete) return;
    await apiFornecedores.remove(confirmDelete.id);
    setConfirmDelete(null);
    apiFornecedores.list().then(setFornecedores);
  }

  const filtered = fornecedores.filter(f => f.nome.toLowerCase().includes(search.toLowerCase()) || f.cnpj?.includes(search) || f.contato_nome?.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin h-10 w-10 border-4 border-primary-500 border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-gray-900">Fornecedores</h1><p className="text-gray-500 mt-1">{fornecedores.length} fornecedor{fornecedores.length !== 1 ? 'es' : ''} cadastrado{fornecedores.length !== 1 ? 's' : ''}</p></div>
        {isGerenteOuAcima && <button onClick={openNew} className="btn-primary"><Plus size={18} /> Novo Fornecedor</button>}
      </div>
      <div className="relative"><Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input className="input pl-10" placeholder="Buscar por nome, CNPJ ou contato..." value={search} onChange={e => setSearch(e.target.value)} /></div>
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(f => (
          <div key={f.id} className="card">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center"><Building2 size={20} className="text-primary-700" /></div>
                <div><p className="font-semibold">{f.nome}</p>{f.cnpj && <p className="text-xs text-gray-400 font-mono">{f.cnpj}</p>}</div>
              </div>
              {isGerenteOuAcima && <div className="flex gap-1"><button onClick={() => openEdit(f)} className="btn-ghost btn-sm text-primary-600"><Edit size={14} /></button><button onClick={() => setConfirmDelete(f)} className="btn-ghost btn-sm text-red-500"><Trash2 size={14} /></button></div>}
            </div>
            <div className="space-y-1 text-sm text-gray-600">
              {f.contato_nome && <p className="flex items-center gap-2"><UserIcon size={14} className="text-gray-400" /> {f.contato_nome}</p>}
              {f.contato_telefone && <p className="flex items-center gap-2"><Phone size={14} className="text-gray-400" /> {f.contato_telefone}</p>}
              {f.contato_email && <p className="flex items-center gap-2"><Mail size={14} className="text-gray-400" /> {f.contato_email}</p>}
              {(f.cidade || f.estado) && <p className="flex items-center gap-2"><MapPin size={14} className="text-gray-400" /> {[f.cidade, f.estado].filter(Boolean).join(' - ')}</p>}
            </div>
          </div>
        ))}
        {filtered.length === 0 && <div className="col-span-full text-center py-10 text-gray-400">Nenhum fornecedor encontrado</div>}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-4 animate-fade-in max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-5 border-b border-gray-100"><h2 className="text-lg font-semibold">{editing ? 'Editar Fornecedor' : 'Novo Fornecedor'}</h2></div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2"><label className="label">Nome</label><input className="input" value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} required /></div>
                <div><label className="label">CNPJ</label><input className="input" value={form.cnpj} onChange={e => setForm({ ...form, cnpj: e.target.value })} /></div>
                <div><label className="label">Inscrição Estadual</label><input className="input" value={form.inscricao_estadual} onChange={e => setForm({ ...form, inscricao_estadual: e.target.value })} /></div>
              </div>
              <div className="border-t border-gray-100 pt-4"><h3 className="text-sm font-semibold text-gray-700 mb-3">Contato</h3></div>
              <div className="grid grid-cols-3 gap-4">
                <div><label className="label">Nome do Contato</label><input className="input" value={form.contato_nome} onChange={e => setForm({ ...form, contato_nome: e.target.value })} /></div>
                <div><label className="label">Telefone</label><input className="input" value={form.contato_telefone} onChange={e => setForm({ ...form, contato_telefone: e.target.value })} /></div>
                <div><label className="label">Email</label><input type="email" className="input" value={form.contato_email} onChange={e => setForm({ ...form, contato_email: e.target.value })} /></div>
              </div>
              <div className="border-t border-gray-100 pt-4"><h3 className="text-sm font-semibold text-gray-700 mb-3">Endereço</h3></div>
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2"><label className="label">Endereço</label><input className="input" value={form.endereco} onChange={e => setForm({ ...form, endereco: e.target.value })} /></div>
                <div><label className="label">Cidade</label><input className="input" value={form.cidade} onChange={e => setForm({ ...form, cidade: e.target.value })} /></div>
                <div><label className="label">Estado</label><input className="input" maxLength={2} placeholder="UF" value={form.estado} onChange={e => setForm({ ...form, estado: e.target.value })} /></div>
              </div>
              <div><label className="label">Observação</label><textarea className="input" rows={2} value={form.observacao} onChange={e => setForm({ ...form, observacao: e.target.value })} /></div>
              <div className="flex justify-end gap-3 pt-4"><button type="button" onClick={() => setShowForm(false)} className="btn-outline">Cancelar</button><button type="submit" className="btn-primary">{editing ? 'Salvar' : 'Cadastrar'}</button></div>
            </form>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setConfirmDelete(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6 animate-fade-in" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-semibold mb-2">Remover Fornecedor</h2>
            <p className="text-gray-500 mb-6">Tem certeza que deseja remover <strong>{confirmDelete.nome}</strong>?</p>
            <div className="flex justify-end gap-3"><button onClick={() => setConfirmDelete(null)} className="btn-outline">Cancelar</button><button onClick={handleDelete} className="btn-danger">Remover</button></div>
          </div>
        </div>
      )}
    </div>
  );
}

function UserIcon(props: any) { return <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>; }
