import { useEffect, useState } from 'react';
import { apiAlertas } from '../lib/api';
import { Bell, CheckCircle, AlertTriangle, TrendingUp, TrendingDown, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';

const icons: Record<string, React.ReactNode> = { estoque_baixo: <AlertTriangle size={16} className="text-red-500" />, estoque_excesso: <TrendingUp size={16} className="text-amber-500" />, validade: <Clock size={16} className="text-orange-500" />, perda: <TrendingDown size={16} className="text-red-500" />, demanda: <TrendingUp size={16} className="text-blue-500" /> };
const gColors: Record<string, string> = { baixa: 'bg-gray-50 border-gray-200', media: 'bg-blue-50 border-blue-200', alta: 'bg-amber-50 border-amber-200', critica: 'bg-red-50 border-red-200' };

export default function Alertas() {
  const { isGerenteOuAcima } = useAuth();
  const [alertas, setAlertas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { apiAlertas.list().then(setAlertas).finally(() => setLoading(false)); }, []);

  async function marcarLido(id: string) { await apiAlertas.marcarLido(id); apiAlertas.list().then(setAlertas); }
  async function marcarTodos() { await apiAlertas.marcarTodosLidos(); apiAlertas.list().then(setAlertas); }

  const naoLidos = alertas.filter((a: any) => !a.lido).length;
  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin h-10 w-10 border-4 border-primary-500 border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-gray-900">Alertas</h1><p className="text-gray-500 mt-1">{naoLidos} alertas não lidos</p></div>
        {naoLidos > 0 && isGerenteOuAcima && <button onClick={marcarTodos} className="btn-outline"><CheckCircle size={16} /> Marcar todos lidos</button>}
      </div>
      <div className="space-y-3">
        {alertas.map((a: any) => (
          <div key={a.id} className={`card border-l-4 animate-slide-in ${gColors[a.gravidade]} ${a.lido ? 'opacity-60' : ''}`}>
            <div className="flex items-start gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${a.gravidade === 'critica' || a.gravidade === 'alta' ? 'bg-red-100' : 'bg-gray-100'}`}>{icons[a.tipo] || <Bell size={16} className="text-gray-500" />}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <h4 className="font-semibold text-gray-900">{a.titulo}</h4>
                  <span className={`badge ${a.gravidade === 'critica' ? 'badge-danger' : a.gravidade === 'alta' ? 'badge-warning' : a.gravidade === 'media' ? 'badge-info' : 'badge-neutral'} text-[10px]`}>{a.gravidade}</span>
                  {!a.lido && <span className="w-2 h-2 rounded-full bg-red-500" />}
                </div>
                <p className="text-sm text-gray-600">{a.mensagem}</p>
                {a.produto && <p className="text-xs text-gray-400 mt-1">Produto: {a.produto.descricao} {a.produto.codigo && `(${a.produto.codigo})`}</p>}
                <p className="text-xs text-gray-400 mt-1">{format(new Date(a.created_at), "dd/MM/yyyy 'às' HH:mm")}</p>
              </div>
              {!a.lido && <button onClick={() => marcarLido(a.id)} className="btn-ghost btn-sm text-gray-400 hover:text-green-600"><CheckCircle size={18} /></button>}
            </div>
          </div>
        ))}
        {alertas.length === 0 && <div className="text-center py-16"><Bell size={48} className="mx-auto text-gray-300 mb-4" /><p className="text-gray-400 text-lg">Nenhum alerta no momento</p></div>}
      </div>
    </div>
  );
}