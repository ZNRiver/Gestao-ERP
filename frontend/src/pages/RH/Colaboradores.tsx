import { useEffect, useState } from 'react';
import { apiColaboradores, apiCargos } from '../../lib/api';
import { format } from 'date-fns';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { formatCurrency, parseCurrency, centsFromReais, formatCPF } from '../../lib/format';

export default function RHColaboradores() {
  const { isGerenteOuAcima } = useAuth();
  const [colaboradores, setColaboradores] = useState<any[]>([]);
  const [cargosOpt, setCargosOpt] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [deleting, setDeleting] = useState<any>(null);
  const [form, setForm] = useState({ nome: '', cpf: '', matricula: gerarMatricula(), cargo_id: '', salario: '0', data_admissao: format(new Date(), 'yyyy-MM-dd'), status: 'ativo' });

  function gerarMatricula() { return 'MAT-' + Date.now().toString().slice(-6); }


  useEffect(() => {
    Promise.all([apiColaboradores.list(), apiCargos.list()]).then(([c, ca]) => {
      setColaboradores(c); setCargosOpt(ca); setLoading(false);
    });
  }, []);

  function openNew() {
    const firstCargo = cargosOpt[0];
    setEditing(null);
    setForm({ nome: '', cpf: '', matricula: gerarMatricula(), cargo_id: firstCargo?.id || '', salario: formatCurrency(centsFromReais(firstCargo?.salario_base || 0)), data_admissao: format(new Date(), 'yyyy-MM-dd'), status: 'ativo' });
    setShowForm(true);
  }
  function openEdit(c: any) { setEditing(c); setForm({ nome: c.nome, cpf: c.cpf || '', matricula: c.matricula, cargo_id: c.cargo_id || '', salario: formatCurrency(centsFromReais(c.salario)), data_admissao: c.data_admissao, status: c.status }); setShowForm(true); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = { ...form, cpf: form.cpf.replace(/\D/g, ''), salario: parseCurrency(form.salario) };
    if (editing) { await apiColaboradores.update(editing.id, payload); }
    else { await apiColaboradores.create(payload); }
    setShowForm(false);
    const data = await apiColaboradores.list(); setColaboradores(data);
  }

  async function handleDelete() {
    if (!deleting) return;
    await apiColaboradores.delete(deleting.id);
    setDeleting(null);
    const data = await apiColaboradores.list(); setColaboradores(data);
  }

  const filtered = colaboradores.filter((c: any) => c.nome.toLowerCase().includes(search.toLowerCase()) || c.matricula.toLowerCase().includes(search.toLowerCase()) || c.cpf?.includes(search));
  const sb = (s: string) => ({ ativo: 'badge-success', ferias: 'badge-info', afastado: 'badge-warning', desligado: 'badge-danger' } as any)[s] || 'badge-neutral';

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin h-10 w-10 border-4 border-primary-500 border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-gray-900">Colaboradores</h1><p className="text-gray-500 mt-1">{colaboradores.length} colaboradores cadastrados</p></div>
        {isGerenteOuAcima && <button onClick={openNew} className="btn-primary"><Plus size={18} /> Novo Colaborador</button>}
      </div>
      <div className="relative"><Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input className="input pl-10" placeholder="Buscar por nome, matrícula ou CPF..." value={search} onChange={e => setSearch(e.target.value)} /></div>
      <div className="card overflow-hidden !p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50 text-left"><th className="px-4 py-3 font-medium text-gray-500">Matrícula</th><th className="px-4 py-3 font-medium text-gray-500">Nome</th><th className="px-4 py-3 font-medium text-gray-500">Cargo</th><th className="px-4 py-3 font-medium text-gray-500">Admissão</th><th className="px-4 py-3 font-medium text-gray-500">Salário</th><th className="px-4 py-3 font-medium text-gray-500">Status</th><th className="px-4 py-3 font-medium text-gray-500">Ações</th></tr></thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((c: any) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{c.matricula}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{c.nome}</td>
                  <td className="px-4 py-3 text-gray-600">{c.cargo?.nome || '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{format(new Date(c.data_admissao + 'T00:00:00'), 'dd/MM/yyyy')}</td>
                  <td className="px-4 py-3 font-medium">R$ {c.salario.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                  <td className="px-4 py-3"><span className={sb(c.status)}>{c.status}</span></td>
                  <td className="px-4 py-3">
                    {isGerenteOuAcima && (
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEdit(c)} className="btn-ghost btn-sm text-primary-600"><Edit size={14} /> Editar</button>
                        <button onClick={() => setDeleting(c)} className="btn-ghost btn-sm text-red-600"><Trash2 size={14} /> Excluir</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-400">Nenhum colaborador encontrado</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setDeleting(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 animate-fade-in p-6" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Excluir Colaborador</h2>
            <p className="text-gray-500 mb-6">Tem certeza que deseja excluir <strong>{deleting.nome}</strong>? Esta ação não pode ser desfeita.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleting(null)} className="btn-outline">Cancelar</button>
              <button onClick={handleDelete} className="btn-danger">Excluir</button>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 animate-fade-in max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-5 border-b border-gray-100"><h2 className="text-lg font-semibold">{editing ? 'Editar Colaborador' : 'Novo Colaborador'}</h2></div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div><label className="label">Nome Completo</label><input className="input" value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} required /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label">CPF</label><input className="input" placeholder="000.000.000-00" value={form.cpf} onChange={e => setForm({ ...form, cpf: formatCPF(e.target.value) })} /></div>
                <div><label className="label">Matrícula</label><input className="input bg-gray-50 text-gray-500 cursor-not-allowed" value={form.matricula} readOnly /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label">Cargo</label><select className="input" value={form.cargo_id} onChange={e => { const cargo = cargosOpt.find(c => c.id === e.target.value); setForm({ ...form, cargo_id: e.target.value, salario: formatCurrency(centsFromReais(cargo?.salario_base || 0)) }); }}><option value="">Selecione...</option>{cargosOpt.map((c: any) => <option key={c.id} value={c.id}>{c.nome}</option>)}</select></div>
                <div><label className="label">Status</label><select className="input" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}><option value="ativo">Ativo</option><option value="ferias">Férias</option><option value="afastado">Afastado</option><option value="desligado">Desligado</option></select></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label">Admissão</label><input type="date" className="input" value={form.data_admissao} onChange={e => setForm({ ...form, data_admissao: e.target.value })} /></div>
                <div><label className="label">Salário</label><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">R$</span><input className="input pl-9" placeholder="0,00" value={form.salario} onChange={e => setForm({ ...form, salario: formatCurrency(e.target.value) })} /></div></div>
              </div>
              <div className="flex justify-end gap-3 pt-4"><button type="button" onClick={() => setShowForm(false)} className="btn-outline">Cancelar</button><button type="submit" className="btn-primary">{editing ? 'Salvar' : 'Cadastrar'}</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}