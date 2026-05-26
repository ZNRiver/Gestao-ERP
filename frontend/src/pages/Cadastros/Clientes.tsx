import { useEffect, useState } from 'react';
import { apiClientes } from '../../lib/api';
import { Plus, Edit, Trash2, Search, Users, Phone, Mail, MapPin, FileText } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function CadClientes() {
  const { isGerenteOuAcima } = useAuth();
  const [clientes, setClientes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [confirmDelete, setConfirmDelete] = useState<any>(null);
  const [form, setForm] = useState({ nome: '', documento: '', telefone: '', email: '', endereco: '', cidade: '', estado: '', observacao: '' });

  useEffect(() => { apiClientes.list().then(d => { setClientes(d); setLoading(false); }); }, []);

  function openNew() { setEditing(null); setForm({ nome: '', documento: '', telefone: '', email: '', endereco: '', cidade: '', estado: '', observacao: '' }); setShowForm(true); }
  function openEdit(c: any) { setEditing(c); setForm({ nome: c.nome, documento: c.documento || '', telefone: c.telefone || '', email: c.email || '', endereco: c.endereco || '', cidade: c.cidade || '', estado: c.estado || '', observacao: c.observacao || '' }); setShowForm(true); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editing) await apiClientes.update(editing.id, form);
    else await apiClientes.create(form);
    setShowForm(false);
    apiClientes.list().then(setClientes);
  }

  async function handleDelete() {
    if (!confirmDelete) return;
    await apiClientes.remove(confirmDelete.id);
    setConfirmDelete(null);
    apiClientes.list().then(setClientes);
  }

  const filtered = clientes.filter(c => c.nome.toLowerCase().includes(search.toLowerCase()) || c.documento?.includes(search) || c.email?.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin h-10 w-10 border-4 border-primary-500 border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-gray-900">Clientes</h1><p className="text-gray-500 mt-1">{clientes.length} cliente{clientes.length !== 1 ? 's' : ''} cadastrado{clientes.length !== 1 ? 's' : ''}</p></div>
        {isGerenteOuAcima && <button onClick={openNew} className="btn-primary"><Plus size={18} /> Novo Cliente</button>}
      </div>
      <div className="relative"><Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input className="input pl-10" placeholder="Buscar por nome, documento ou email..." value={search} onChange={e => setSearch(e.target.value)} /></div>
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(c => (
          <div key={c.id} className="card">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center"><Users size={20} className="text-blue-700" /></div>
                <div><p className="font-semibold">{c.nome}</p>{c.documento && <p className="text-xs text-gray-400 font-mono">{c.documento}</p>}</div>
              </div>
              {isGerenteOuAcima && <div className="flex gap-1"><button onClick={() => openEdit(c)} className="btn-ghost btn-sm text-primary-600"><Edit size={14} /></button><button onClick={() => setConfirmDelete(c)} className="btn-ghost btn-sm text-red-500"><Trash2 size={14} /></button></div>}
            </div>
            <div className="space-y-1 text-sm text-gray-600">
              {c.telefone && <p className="flex items-center gap-2"><Phone size={14} className="text-gray-400" /> {c.telefone}</p>}
              {c.email && <p className="flex items-center gap-2"><Mail size={14} className="text-gray-400" /> {c.email}</p>}
              {(c.cidade || c.estado) && <p className="flex items-center gap-2"><MapPin size={14} className="text-gray-400" /> {[c.cidade, c.estado].filter(Boolean).join(' - ')}</p>}
            </div>
          </div>
        ))}
        {filtered.length === 0 && <div className="col-span-full text-center py-10 text-gray-400">Nenhum cliente encontrado</div>}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 animate-fade-in max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-5 border-b border-gray-100"><h2 className="text-lg font-semibold">{editing ? 'Editar Cliente' : 'Novo Cliente'}</h2></div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2"><label className="label">Nome</label><input className="input" value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} required /></div>
                <div><label className="label">CPF/CNPJ</label><input className="input" value={form.documento} onChange={e => setForm({ ...form, documento: e.target.value })} /></div>
                <div><label className="label">Telefone</label><input className="input" value={form.telefone} onChange={e => setForm({ ...form, telefone: e.target.value })} /></div>
              </div>
              <div><label className="label">Email</label><input type="email" className="input" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
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
            <h2 className="text-lg font-semibold mb-2">Remover Cliente</h2>
            <p className="text-gray-500 mb-6">Tem certeza que deseja remover <strong>{confirmDelete.nome}</strong>?</p>
            <div className="flex justify-end gap-3"><button onClick={() => setConfirmDelete(null)} className="btn-outline">Cancelar</button><button onClick={handleDelete} className="btn-danger">Remover</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
