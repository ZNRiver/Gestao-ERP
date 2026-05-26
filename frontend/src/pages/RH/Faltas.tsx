import { useEffect, useState } from 'react';
import { apiFaltas, apiColaboradores } from '../../lib/api';
import { format } from 'date-fns';
import { Plus, Search, CheckCircle, XCircle } from 'lucide-react';

export default function RHFaltas() {
  const [faltas, setFaltas] = useState<any[]>([]);
  const [colaboradores, setColaboradores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ colaborador_id: '', data: format(new Date(), 'yyyy-MM-dd'), tipo: 'falta', justificativa: '', abonada: false });

  useEffect(() => { loadData(); }, []);

  async function loadData() { const [f, c] = await Promise.all([apiFaltas.list(), apiColaboradores.list()]); setFaltas(f); setColaboradores(c); setLoading(false); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); await apiFaltas.create(form); setShowForm(false); loadData();
  }

  async function toggleAbonada(f: any) { await apiFaltas.abonar(f.id); loadData(); }

  const filtered = faltas.filter((f: any) => f.colaborador?.nome?.toLowerCase().includes(search.toLowerCase()) || f.tipo.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin h-10 w-10 border-4 border-primary-500 border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-gray-900">Faltas e Afastamentos</h1><p className="text-gray-500 mt-1">Controle de ausências dos colaboradores</p></div>
        <button onClick={() => setShowForm(true)} className="btn-primary"><Plus size={18} /> Registrar Falta</button>
      </div>
      <div className="relative"><Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input className="input pl-10" placeholder="Buscar por colaborador ou tipo..." value={search} onChange={e => setSearch(e.target.value)} /></div>
      <div className="card overflow-hidden !p-0">
        <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="bg-gray-50 text-left"><th className="px-4 py-3 font-medium text-gray-500">Colaborador</th><th className="px-4 py-3 font-medium text-gray-500">Data</th><th className="px-4 py-3 font-medium text-gray-500">Tipo</th><th className="px-4 py-3 font-medium text-gray-500">Justificativa</th><th className="px-4 py-3 font-medium text-gray-500">Abonada</th><th className="px-4 py-3 font-medium text-gray-500">Ação</th></tr></thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((f: any) => (
              <tr key={f.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{f.colaborador?.nome}</td>
                <td className="px-4 py-3">{format(new Date(f.data + 'T00:00:00'), 'dd/MM/yyyy')}</td>
                <td className="px-4 py-3"><span className="badge-neutral capitalize">{f.tipo}</span></td>
                <td className="px-4 py-3 text-gray-500 max-w-[200px] truncate">{f.justificativa || '—'}</td>
                <td className="px-4 py-3">{f.abonada ? <CheckCircle size={16} className="text-green-500" /> : <XCircle size={16} className="text-red-400" />}</td>
                <td className="px-4 py-3"><button onClick={() => toggleAbonada(f)} className="btn-ghost btn-sm text-xs">{f.abonada ? 'Desabonar' : 'Abonar'}</button></td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-400">Nenhuma falta registrada</td></tr>}
          </tbody></table></div>
      </div>
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 animate-fade-in" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-5 border-b border-gray-100"><h2 className="text-lg font-semibold">Registrar Falta</h2></div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div><label className="label">Colaborador</label><select className="input" value={form.colaborador_id} onChange={e => setForm({ ...form, colaborador_id: e.target.value })} required><option value="">Selecione...</option>{colaboradores.filter((c: any) => c.status === 'ativo').map((c: any) => <option key={c.id} value={c.id}>{c.nome}</option>)}</select></div>
              <div><label className="label">Data</label><input type="date" className="input" value={form.data} onChange={e => setForm({ ...form, data: e.target.value })} required /></div>
              <div><label className="label">Tipo</label><select className="input" value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })}><option value="falta">Falta</option><option value="atestado">Atestado Médico</option><option value="ferias">Férias</option><option value="licenca">Licença</option></select></div>
              <div><label className="label">Justificativa</label><textarea className="input" rows={2} value={form.justificativa} onChange={e => setForm({ ...form, justificativa: e.target.value })} /></div>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.abonada} onChange={e => setForm({ ...form, abonada: e.target.checked })} className="rounded border-gray-300" /> Falta abonada</label>
              <div className="flex justify-end gap-3 pt-2"><button type="button" onClick={() => setShowForm(false)} className="btn-outline">Cancelar</button><button type="submit" className="btn-primary">Registrar</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}