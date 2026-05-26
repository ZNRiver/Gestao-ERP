import { useEffect, useState } from 'react';
import { apiAuth, apiColaboradores, apiFuncoes } from '../../lib/api';
import { Plus, Trash2, Shield, User, Save, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

type Tab = 'usuarios' | 'funcoes';

const roleLabel: Record<string, string> = {
  admin: 'Administrador',
  gerente: 'Gerente',
  supervisor: 'Supervisor',
  trabalhador: 'Trabalhador',
};

const allPermissions = [
  { key: 'gerenciar_usuarios', label: 'Gerenciar Usuários' },
  { key: 'gerenciar_produtos', label: 'Gerenciar Produtos' },
  { key: 'gerenciar_vendas', label: 'Gerenciar Vendas' },
  { key: 'gerenciar_colaboradores', label: 'Gerenciar Colaboradores' },
  { key: 'gerenciar_financeiro', label: 'Gerenciar Financeiro' },
  { key: 'ver_relatorios', label: 'Ver Relatórios' },
  { key: 'registrar_ponto', label: 'Registrar Ponto' },
  { key: 'ver_produtos', label: 'Ver Produtos' },
];

const roleColors: Record<string, string> = {
  admin: 'border-purple-300 bg-purple-50',
  gerente: 'border-blue-300 bg-blue-50',
  supervisor: 'border-amber-300 bg-amber-50',
  trabalhador: 'border-gray-300 bg-gray-50',
};

const roleBadge: Record<string, string> = {
  admin: 'bg-purple-100 text-purple-700',
  gerente: 'bg-blue-100 text-blue-700',
  supervisor: 'bg-amber-100 text-amber-700',
  trabalhador: 'bg-gray-100 text-gray-700',
};

export default function RHAcesso() {
  const { isAdmin } = useAuth();
  const [tab, setTab] = useState<Tab>('usuarios');
  const [profiles, setProfiles] = useState<any[]>([]);
  const [colaboradores, setColaboradores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ colaborador_id: '', nome: '', email: '', password: '', role: 'trabalhador' });
  const [deleteTarget, setDeleteTarget] = useState<any>(null);

  // Funções state
  const [funcoes, setFuncoes] = useState<any[]>([]);
  const [editFuncao, setEditFuncao] = useState<any>(null);
  const [editFuncaoForm, setEditFuncaoForm] = useState({ nome_exibicao: '', descricao: '', permissoes: [] as string[] });
  const [newFuncao, setNewFuncao] = useState(false);
  const [newFuncaoForm, setNewFuncaoForm] = useState({ role: '', nome_exibicao: '', descricao: '', permissoes: [] as string[] });

  useEffect(() => {
    if (tab === 'usuarios') {
      Promise.all([apiAuth.profiles(), apiColaboradores.list(), apiFuncoes.list()]).then(([p, c, f]) => {
        setProfiles(p); setColaboradores(c); setFuncoes(f); setLoading(false);
      });
    } else {
      apiFuncoes.list().then(data => { setFuncoes(data); setLoading(false); });
    }
  }, [tab]);

  async function loadData() {
    const [p, c] = await Promise.all([apiAuth.profiles(), apiColaboradores.list()]);
    setProfiles(p); setColaboradores(c);
  }

  const semAcesso = colaboradores.filter((c: any) => !c.profile_id);

  function openNew(colab?: any) {
    setForm({ colaborador_id: colab?.id || '', nome: colab?.nome || '', email: '', password: '', role: 'trabalhador' });
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await apiAuth.createUser({ nome: form.nome, email: form.email, password: form.password, role: form.role, colaborador_id: form.colaborador_id || undefined });
    setShowForm(false);
    loadData();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    if (deleteTarget.funcao) {
      await apiFuncoes.remove(deleteTarget.role);
    } else {
      await apiAuth.deleteUser(deleteTarget.id);
    }
    setDeleteTarget(null);
    if (tab === 'funcoes') {
      apiFuncoes.list().then(setFuncoes);
    } else {
      loadData();
    }
  }

  function openEditFuncao(f: any) {
    setEditFuncao(f);
    setEditFuncaoForm({ nome_exibicao: f.nome_exibicao, descricao: f.descricao || '', permissoes: [...f.permissoes] });
  }

  async function handleEditFuncaoSubmit(e: React.FormEvent) {
    e.preventDefault();
    await apiFuncoes.update(editFuncao.role, editFuncaoForm);
    setEditFuncao(null);
    apiFuncoes.list().then(setFuncoes);
  }

  function togglePerm(key: string, form: 'edit' | 'new') {
    if (form === 'edit') {
      setEditFuncaoForm(prev => ({
        ...prev,
        permissoes: prev.permissoes.includes(key) ? prev.permissoes.filter(p => p !== key) : [...prev.permissoes, key],
      }));
    } else {
      setNewFuncaoForm(prev => ({
        ...prev,
        permissoes: prev.permissoes.includes(key) ? prev.permissoes.filter(p => p !== key) : [...prev.permissoes, key],
      }));
    }
  }

  async function handleNewFuncaoSubmit(e: React.FormEvent) {
    e.preventDefault();
    await apiFuncoes.create(newFuncaoForm);
    setNewFuncao(false);
    setNewFuncaoForm({ role: '', nome_exibicao: '', descricao: '', permissoes: [] });
    apiFuncoes.list().then(setFuncoes);
  }

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin h-10 w-10 border-4 border-primary-500 border-t-transparent rounded-full" /></div>;

  const tabs: { key: Tab; label: string }[] = [
    { key: 'usuarios', label: 'Usuários' },
    { key: 'funcoes', label: 'Funções' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-gray-900">Controle de Acesso</h1><p className="text-gray-500 mt-1">{tab === 'usuarios' ? `${profiles.length} usuários cadastrados` : `${funcoes.length} funções`}</p></div>
        {isAdmin && (
          tab === 'usuarios' ? <button onClick={() => openNew()} className="btn-primary"><Plus size={18} /> Novo Acesso</button>
          : <button onClick={() => setNewFuncao(true)} className="btn-primary"><Plus size={18} /> Nova Função</button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {tabs.map(t => (
          <button key={t.key} onClick={() => { setTab(t.key); setLoading(true); }} className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === t.key ? 'border-primary-600 text-primary-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>{t.label}</button>
        ))}
      </div>

      {tab === 'usuarios' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {profiles.map((p: any) => {
              const colab = colaboradores.find((c: any) => c.profile_id === p.id);
              return (
                <div key={p.id} className="card flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold">{p.nome.charAt(0).toUpperCase()}</div>
                    <div>
                      <p className="font-medium">{p.nome}</p>
                      <p className="text-sm text-gray-500">{p.email}</p>
                      {colab && <p className="text-xs text-gray-400">Colaborador: {colab.nome} ({colab.matricula})</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${p.role === 'admin' ? 'bg-purple-100 text-purple-700' : p.role === 'gerente' ? 'bg-blue-100 text-blue-700' : p.role === 'supervisor' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-700'}`}>
                      <Shield size={12} /> {roleLabel[p.role] || p.role}
                    </span>
                    {isAdmin && p.role !== 'admin' && (
                      <button onClick={() => setDeleteTarget(p)} className="btn-ghost btn-sm text-red-500"><Trash2 size={14} /></button>
                    )}
                  </div>
                </div>
              );
            })}
            {profiles.length === 0 && <div className="text-center py-10 text-gray-400">Nenhum usuário cadastrado</div>}
          </div>

          <div className="card">
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2"><User size={16} /> Colaboradores sem acesso</h3>
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {semAcesso.map((c: any) => (
                <div key={c.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                  <div>
                    <p className="text-sm font-medium">{c.nome}</p>
                    <p className="text-xs text-gray-400">{c.matricula} • {c.cargo?.nome || '—'}</p>
                  </div>
                  <button onClick={() => openNew(c)} className="btn-ghost btn-sm text-primary-600"><Plus size={14} /> Acesso</button>
                </div>
              ))}
              {semAcesso.length === 0 && <p className="text-sm text-gray-400 text-center py-4">Todos os colaboradores já têm acesso</p>}
            </div>
          </div>
        </div>
      )}

      {tab === 'funcoes' && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {funcoes.map(f => (
            <div key={f.role} className={`card border-2 ${roleColors[f.role] || 'border-gray-200'}`}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Shield size={18} className={f.role === 'admin' ? 'text-purple-600' : f.role === 'gerente' ? 'text-blue-600' : f.role === 'supervisor' ? 'text-amber-600' : 'text-gray-600'} />
                    <h3 className="font-semibold text-lg">{f.nome_exibicao}</h3>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${roleBadge[f.role] || 'bg-gray-100 text-gray-600'}`}>{f.role}</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">{f.descricao}</p>
                </div>
                <div className="flex items-center gap-1">
                  {isAdmin && <button onClick={() => openEditFuncao(f)} className="btn-ghost btn-sm text-primary-600">Editar</button>}
                  {isAdmin && f.role !== 'admin' && (
                    <button onClick={() => setDeleteTarget({ funcao: true, role: f.role, nome: f.nome_exibicao })} className="btn-ghost btn-sm text-red-500"><Trash2 size={14} /></button>
                  )}
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Permissões</p>
                <div className="flex flex-wrap gap-2">
                  {allPermissions.filter(p => f.permissoes.includes(p.key)).map(p => (
                    <span key={p.key} className="inline-flex items-center gap-1 px-2.5 py-1 bg-white rounded-full text-xs font-medium text-gray-700 border border-gray-200">{p.label}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal criar usuário */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 animate-fade-in" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-5 border-b border-gray-100"><h2 className="text-lg font-semibold">Criar Acesso</h2></div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="label">Colaborador</label>
                <select className="input" value={form.colaborador_id} onChange={e => {
                  const c = colaboradores.find(x => x.id === e.target.value);
                  setForm({ ...form, colaborador_id: e.target.value, nome: c?.nome || '' });
                }} required>
                  <option value="">Selecione...</option>
                  {semAcesso.map((c: any) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
              </div>
              <div><label className="label">Nome</label><input className="input" value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} required /></div>
              <div><label className="label">Email</label><input type="email" className="input" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required /></div>
              <div><label className="label">Senha</label><input type="password" className="input" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required /></div>
              <div><label className="label">Função</label><select className="input" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                {funcoes.map(f => <option key={f.role} value={f.role}>{f.nome_exibicao}</option>)}
              </select></div>
              <div className="flex justify-end gap-3 pt-2"><button type="button" onClick={() => setShowForm(false)} className="btn-outline">Cancelar</button><button type="submit" className="btn-primary">Cadastrar</button></div>
            </form>
          </div>
        </div>
      )}

      {/* Modal editar função */}
      {editFuncao && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setEditFuncao(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 animate-fade-in" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <div><h2 className="text-lg font-semibold">Editar Função</h2><p className="text-sm text-gray-500">{editFuncao.role}</p></div>
              <button onClick={() => setEditFuncao(null)} className="btn-ghost btn-sm"><X size={16} /></button>
            </div>
            <form onSubmit={handleEditFuncaoSubmit} className="p-6 space-y-4">
              <div><label className="label">Nome de Exibição</label><input className="input" value={editFuncaoForm.nome_exibicao} onChange={e => setEditFuncaoForm({ ...editFuncaoForm, nome_exibicao: e.target.value })} required /></div>
              <div><label className="label">Descrição</label><textarea className="input" rows={2} value={editFuncaoForm.descricao} onChange={e => setEditFuncaoForm({ ...editFuncaoForm, descricao: e.target.value })} /></div>
              <div><label className="label">Permissões</label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {allPermissions.map(p => (
                    <label key={p.key} className="flex items-center gap-2 p-2 rounded-lg border cursor-pointer hover:bg-gray-50 text-sm">
                      <input type="checkbox" checked={editFuncaoForm.permissoes.includes(p.key)} onChange={() => togglePerm(p.key, 'edit')} className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                      {p.label}
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4"><button type="button" onClick={() => setEditFuncao(null)} className="btn-outline">Cancelar</button><button type="submit" className="btn-primary"><Save size={16} /> Salvar</button></div>
            </form>
          </div>
        </div>
      )}

      {/* Modal nova função */}
      {newFuncao && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setNewFuncao(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 animate-fade-in" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Nova Função</h2>
              <button onClick={() => setNewFuncao(false)} className="btn-ghost btn-sm"><X size={16} /></button>
            </div>
            <form onSubmit={handleNewFuncaoSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label">Identificador (role)</label><input className="input font-mono text-sm" placeholder="ex: estagiario" value={newFuncaoForm.role} onChange={e => setNewFuncaoForm({ ...newFuncaoForm, role: e.target.value })} required /></div>
                <div><label className="label">Nome de Exibição</label><input className="input" placeholder="ex: Estagiário" value={newFuncaoForm.nome_exibicao} onChange={e => setNewFuncaoForm({ ...newFuncaoForm, nome_exibicao: e.target.value })} required /></div>
              </div>
              <div><label className="label">Descrição</label><textarea className="input" rows={2} placeholder="Opcional" value={newFuncaoForm.descricao} onChange={e => setNewFuncaoForm({ ...newFuncaoForm, descricao: e.target.value })} /></div>
              <div><label className="label">Permissões</label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {allPermissions.map(p => (
                    <label key={p.key} className="flex items-center gap-2 p-2 rounded-lg border cursor-pointer hover:bg-gray-50 text-sm">
                      <input type="checkbox" checked={newFuncaoForm.permissoes.includes(p.key)} onChange={() => togglePerm(p.key, 'new')} className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                      {p.label}
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4"><button type="button" onClick={() => setNewFuncao(false)} className="btn-outline">Cancelar</button><button type="submit" className="btn-primary"><Save size={16} /> Criar</button></div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setDeleteTarget(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 animate-fade-in p-6" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">{deleteTarget.funcao ? 'Remover Função' : 'Remover Acesso'}</h2>
            <p className="text-gray-500 mb-6">Tem certeza que deseja remover <strong>{deleteTarget.nome}</strong>?</p>
            <div className="flex justify-end gap-3"><button onClick={() => setDeleteTarget(null)} className="btn-outline">Cancelar</button><button onClick={handleDelete} className="btn-danger">Remover</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
