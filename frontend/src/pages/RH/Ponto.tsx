import { useEffect, useState } from 'react';
import { apiColaboradores, apiPonto } from '../../lib/api';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Clock, CheckCircle, XCircle, AlertCircle, Pencil } from 'lucide-react';

export default function RHPonto() {
  const [colaboradores, setColaboradores] = useState<any[]>([]);
  const [registros, setRegistros] = useState<any[]>([]);
  const [selectedColab, setSelectedColab] = useState('');
  const [dataRef, setDataRef] = useState(format(new Date(), 'yyyy-MM'));
  const [loading, setLoading] = useState(true);
  const [editRegistro, setEditRegistro] = useState<any>(null);
  const [editForm, setEditForm] = useState({ entrada: '', saida_almoco: '', volta_almoco: '', saida: '' });

  useEffect(() => {
    apiColaboradores.list().then(data => {
      const ativos = data.filter((c: any) => c.status === 'ativo');
      setColaboradores(ativos);
      if (ativos.length > 0) setSelectedColab(ativos[0].id);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!selectedColab) return;
    apiPonto.list(selectedColab, dataRef).then(setRegistros);
  }, [selectedColab, dataRef]);

  async function registrarPonto(tipo: string) {
    await apiPonto.bater(selectedColab, tipo);
    const data = await apiPonto.list(selectedColab, dataRef);
    setRegistros(data);
  }

  function openEdit(r: any) {
    setEditRegistro(r);
    setEditForm({
      entrada: r.entrada?.slice(0, 5) || '',
      saida_almoco: r.saida_almoco?.slice(0, 5) || '',
      volta_almoco: r.volta_almoco?.slice(0, 5) || '',
      saida: r.saida?.slice(0, 5) || '',
    });
  }

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload: Record<string, string> = {};
    if (editForm.entrada) payload.entrada = editForm.entrada + ':00';
    if (editForm.saida_almoco) payload.saida_almoco = editForm.saida_almoco + ':00';
    if (editForm.volta_almoco) payload.volta_almoco = editForm.volta_almoco + ':00';
    if (editForm.saida) payload.saida = editForm.saida + ':00';
    await apiPonto.update(editRegistro.id, payload);
    setEditRegistro(null);
    apiPonto.list(selectedColab, dataRef).then(setRegistros);
  }

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin h-10 w-10 border-4 border-primary-500 border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-gray-900">Registro de Ponto</h1><p className="text-gray-500 mt-1">Controle de jornada dos colaboradores</p></div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">Bater Ponto</h3>
          <div className="mb-4"><label className="label">Colaborador</label><select className="input" value={selectedColab} onChange={e => setSelectedColab(e.target.value)}>{colaboradores.map((c: any) => <option key={c.id} value={c.id}>{c.nome}</option>)}</select></div>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => registrarPonto('entrada')} className="btn-success"><Clock size={16} /> Entrada</button>
            <button onClick={() => registrarPonto('saida_almoco')} className="btn-outline"><Clock size={16} /> Saída Almoço</button>
            <button onClick={() => registrarPonto('volta_almoco')} className="btn-outline"><Clock size={16} /> Volta Almoço</button>
            <button onClick={() => registrarPonto('saida')} className="btn-danger"><Clock size={16} /> Saída</button>
          </div>
          <p className="text-xs text-gray-400 mt-4">Data: {format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
        </div>
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-4"><h3 className="font-semibold text-gray-900">Histórico de Pontos</h3><input type="month" className="input w-auto" value={dataRef} onChange={e => setDataRef(e.target.value)} /></div>
          <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-left bg-gray-50"><th className="px-3 py-2 font-medium text-gray-500">Data</th><th className="px-3 py-2 font-medium text-gray-500">Entrada</th><th className="px-3 py-2 font-medium text-gray-500">Saída Alm.</th><th className="px-3 py-2 font-medium text-gray-500">Volta Alm.</th><th className="px-3 py-2 font-medium text-gray-500">Saída</th><th className="px-3 py-2 font-medium text-gray-500">Status</th><th className="px-3 py-2 font-medium text-gray-500">Ações</th></tr></thead>
            <tbody className="divide-y divide-gray-100">
              {registros.map((r: any) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2 font-medium">{format(new Date(r.data + 'T00:00:00'), 'dd/MM')}</td>
                  <td className="px-3 py-2">{r.entrada ? r.entrada.slice(0, 5) : '—'}</td>
                  <td className="px-3 py-2">{r.saida_almoco ? r.saida_almoco.slice(0, 5) : '—'}</td>
                  <td className="px-3 py-2">{r.volta_almoco ? r.volta_almoco.slice(0, 5) : '—'}</td>
                  <td className="px-3 py-2">{r.saida ? r.saida.slice(0, 5) : '—'}</td>
                  <td className="px-3 py-2">{r.saida ? <CheckCircle size={16} className="text-green-500" /> : r.entrada ? <AlertCircle size={16} className="text-amber-500" /> : <XCircle size={16} className="text-red-400" />}</td>
                  <td className="px-3 py-2"><button onClick={() => openEdit(r)} className="btn-ghost btn-sm text-primary-600"><Pencil size={14} /> Editar</button></td>
                </tr>
              ))}
              {registros.length === 0 && <tr><td colSpan={7} className="px-3 py-8 text-center text-gray-400">Nenhum registro no período</td></tr>}
            </tbody></table></div>
        </div>
      </div>
      {editRegistro && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setEditRegistro(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 animate-fade-in" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-5 border-b border-gray-100"><h2 className="text-lg font-semibold">Editar Horários</h2><p className="text-sm text-gray-500">{format(new Date(editRegistro.data + 'T00:00:00'), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</p></div>
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div><label className="label">Entrada</label><input type="time" className="input" value={editForm.entrada} onChange={e => setEditForm({ ...editForm, entrada: e.target.value })} /></div>
              <div><label className="label">Saída Almoço</label><input type="time" className="input" value={editForm.saida_almoco} onChange={e => setEditForm({ ...editForm, saida_almoco: e.target.value })} /></div>
              <div><label className="label">Volta Almoço</label><input type="time" className="input" value={editForm.volta_almoco} onChange={e => setEditForm({ ...editForm, volta_almoco: e.target.value })} /></div>
              <div><label className="label">Saída</label><input type="time" className="input" value={editForm.saida} onChange={e => setEditForm({ ...editForm, saida: e.target.value })} /></div>
              <div className="flex justify-end gap-3 pt-4"><button type="button" onClick={() => setEditRegistro(null)} className="btn-outline">Cancelar</button><button type="submit" className="btn-primary">Salvar</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
