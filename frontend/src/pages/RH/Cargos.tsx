import { useEffect, useState } from 'react';
import { apiCargos } from '../../lib/api';
import { Plus, Edit, Clock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { formatCurrency, parseCurrency, centsFromReais } from '../../lib/format';

export default function RHCargos() {
  const { isGerenteOuAcima } = useAuth();
  const [cargos, setCargos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ nome: '', descricao: '', salario_base: '0', carga_horaria_semanal: '40' });

  useEffect(() => { apiCargos.list().then(d => { setCargos(d); setLoading(false); }); }, []);

  function openNew() { setEditing(null); setForm({ nome: '', descricao: '', salario_base: '0', carga_horaria_semanal: '40' }); setShowForm(true); }
  function openEdit(c: any) { setEditing(c); setForm({ nome: c.nome, descricao: c.descricao || '', salario_base: formatCurrency(centsFromReais(c.salario_base)), carga_horaria_semanal: String(c.carga_horaria_semanal) }); setShowForm(true); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = { ...form, salario_base: parseCurrency(form.salario_base), carga_horaria_semanal: parseInt(form.carga_horaria_semanal) };
    if (editing) await apiCargos.update(editing.id, payload);
    else await apiCargos.create(payload);
    setShowForm(false);
    apiCargos.list().then(setCargos);
  }

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin h-10 w-10 border-4 border-primary-500 border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-gray-900">Cargos e Salários</h1><p className="text-gray-500 mt-1">{cargos.length} cargos cadastrados</p></div>
        {isGerenteOuAcima && <button onClick={openNew} className="btn-primary"><Plus size={18} /> Novo Cargo</button>}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cargos.map((c: any) => (
          <div key={c.id} className="card hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3"><h3 className="font-semibold text-gray-900">{c.nome}</h3>{isGerenteOuAcima && <button onClick={() => openEdit(c)} className="btn-ghost btn-sm text-primary-600"><Edit size={14} /></button>}</div>
            <p className="text-sm text-gray-500 mb-4">{c.descricao || 'Sem descrição'}</p>
            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <div><p className="text-xs text-gray-400">Salário Base</p><p className="font-semibold text-primary-700">R$ {c.salario_base.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p></div>
              <div className="flex items-center gap-1 text-sm text-gray-500"><Clock size={14} /> {c.carga_horaria_semanal}h/sem</div>
            </div>
          </div>
        ))}
      </div>
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 animate-fade-in" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-5 border-b border-gray-100"><h2 className="text-lg font-semibold">{editing ? 'Editar Cargo' : 'Novo Cargo'}</h2></div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div><label className="label">Nome</label><input className="input" value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} required /></div>
              <div><label className="label">Descrição</label><textarea className="input" rows={2} value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label">Salário Base</label><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">R$</span><input className="input pl-9" placeholder="0,00" value={form.salario_base} onChange={e => setForm({ ...form, salario_base: formatCurrency(e.target.value) })} /></div></div>
                <div><label className="label">Carga (h/sem)</label><input type="number" className="input" value={form.carga_horaria_semanal} onChange={e => setForm({ ...form, carga_horaria_semanal: e.target.value })} /></div>
              </div>
              <div className="flex justify-end gap-3 pt-2"><button type="button" onClick={() => setShowForm(false)} className="btn-outline">Cancelar</button><button type="submit" className="btn-primary">{editing ? 'Salvar' : 'Cadastrar'}</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}