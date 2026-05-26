import { useEffect, useState, useCallback } from 'react';
import { apiPrevisao, apiProdutos } from '../../lib/api';
import { format, getDay } from 'date-fns';
import { TrendingUp, TrendingDown, Brain, Calendar, AlertTriangle, Zap, Sun, BrainCircuit, RefreshCw, BarChart3, LineChart as LineChartIcon } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const FATORES_DIA = [0.6, 1.15, 1.15, 1.15, 1.15, 1.15, 0.85];

export default function PrevisaoDemanda() {
  const [produtos, setProdutos] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [resultados, setResultados] = useState<Map<string, any>>(new Map());
  const [eventos, setEventos] = useState<any[]>([]);
  const [recomendacoes, setRecomendacoes] = useState<any>(null);
  const [recomendacoesIA, setRecomendacoesIA] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [analisando, setAnalisando] = useState(false);

  const previsao = selectedId ? resultados.get(selectedId) : null;

  const fetchCache = useCallback(async () => {
    const cache = await apiPrevisao.cache().catch(() => null);
    if (!cache) return;
    const map = new Map<string, any>();
    cache.resultados?.forEach((r: any) => map.set(r.produto_id, r));
    setResultados(map);
    setEventos(cache.eventos || []);
    setAnalisando(cache.analisando);
  }, []);

  const analisarTodos = useCallback(async () => {
    setAnalisando(true);
    await apiPrevisao.analisarTodos().catch(() => {});
    await fetchCache();
  }, [fetchCache]);

  useEffect(() => {
    let mounted = true;
    Promise.all([
      apiProdutos.list(),
      apiPrevisao.recomendacoesGlobais(),
      apiPrevisao.cache(),
    ]).then(([p, r, cache]) => {
      if (!mounted) return;
      setProdutos(p);
      setRecomendacoes(r);
      if (cache?.resultados?.length) {
        const map = new Map<string, any>();
        cache.resultados.forEach((res: any) => map.set(res.produto_id, res));
        setResultados(map);
        setEventos(cache.eventos || []);
      }
      setLoading(false);
    });
    apiPrevisao.recomendacoesIA().then(setRecomendacoesIA).catch(() => {});
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (resultados.size > 0 && !selectedId) {
      const first = Array.from(resultados.keys())[0];
      if (first) setSelectedId(first);
    }
  }, [resultados, selectedId]);

  const carregando = loading || (analisando && resultados.size === 0);
  const resultadoAtual = selectedId ? resultados.get(selectedId) : null;

  const historicoData = resultadoAtual?.chartData?.filter((d: any) => d.historico !== null) || [];
  const previsaoData = resultadoAtual?.chartData?.filter((d: any) => d.previsao !== null) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Previsão Inteligente de Demanda</h1>
          <p className="text-gray-500 mt-1">Motor preditivo baseado em histórico, sazonalidade e eventos externos</p>
        </div>
        <button onClick={analisarTodos} disabled={analisando} className="btn btn-secondary flex items-center gap-2 text-sm">
          <RefreshCw size={16} className={analisando ? 'animate-spin' : ''} />
          {analisando ? 'Analisando...' : 'Reanalisar Todos'}
        </button>
      </div>

      {resultados.size > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2">
          {Array.from(resultados.entries()).map(([id, r]) => (
            <button key={id} onClick={() => setSelectedId(id)}
              className={`rounded-lg p-3 text-left text-sm border transition-all ${selectedId === id ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-200' : 'border-gray-200 bg-white hover:border-purple-300 hover:shadow-sm'}`}>
              <p className="font-medium text-gray-800 truncate">{r.produto_nome}</p>
              <div className="flex gap-2 mt-1.5 text-[11px]">
                <span className="text-blue-600 font-semibold">7d: {r.previsao7dias}</span>
                <span className="text-purple-600 font-semibold">30d: {r.previsao30dias}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <div className="card">
            <div className="flex items-center gap-2 mb-4"><Brain size={20} className="text-purple-600" /><h3 className="font-semibold">Motor de Previsão</h3></div>
            <div className="mb-4">
              <label className="label">Produto</label>
              <select className="input" value={selectedId} onChange={e => setSelectedId(e.target.value)}>
                {produtos.map((p: any) => (
                  <option key={p.id} value={p.id}>
                    {p.descricao}{resultados.has(p.id) ? '' : ' (aguardando...)'}
                  </option>
                ))}
              </select>
            </div>
            {carregando && resultados.size === 0 && (
              <div className="space-y-4 animate-pulse">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-200 rounded-lg p-3 h-[72px]" />
                  <div className="bg-gray-200 rounded-lg p-3 h-[72px]" />
                </div>
                <div className="bg-gray-100 rounded-lg p-3 space-y-3">
                  {[1,2,3,4,5].map(i => <div key={i} className="h-4 bg-gray-200 rounded w-full" />)}
                </div>
                <div className="rounded-lg p-4 bg-gray-100 h-20" />
              </div>
            )}
            {!carregando && resultadoAtual && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-blue-50 rounded-lg p-3 text-center"><p className="text-xs text-blue-600 font-medium">7 dias</p><p className="text-2xl font-bold text-blue-800">{resultadoAtual.previsao7dias}</p></div>
                  <div className="bg-purple-50 rounded-lg p-3 text-center"><p className="text-xs text-purple-600 font-medium">30 dias</p><p className="text-2xl font-bold text-purple-800">{resultadoAtual.previsao30dias}</p></div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">Estoque Atual</span><span className="font-semibold">{resultadoAtual.estoque_atual}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Média Prevista</span><span className="font-semibold">{(resultadoAtual.previsao30dias / 30).toFixed(1)} un./dia</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Cobertura</span><span className="font-semibold">{resultadoAtual.estoque_atual > 0 && resultadoAtual.previsao30dias > 0 ? Math.round(resultadoAtual.estoque_atual / (resultadoAtual.previsao30dias / 30)) : '-'} dias</span></div>
                  {resultadoAtual.fatorIA !== undefined && (
                    <div className="flex justify-between" title="Previsão gerada por IA">
                      <span className="text-gray-500">IA <span className="text-[10px] text-gray-400">(OpenRouter)</span></span>
                      <span className="font-semibold text-purple-600">{(resultadoAtual.fatorIA * 100).toFixed(0)}%</span>
                    </div>
                  )}
                </div>
                {resultadoAtual.historicoResumo && resultadoAtual.historicoResumo.diasComDados > 0 && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-gray-600 mb-2">Histórico Real (últimos 84 dias)</p>
                    <div className="space-y-1.5 text-sm">
                      <div className="flex justify-between"><span className="text-gray-500">Total vendido</span><span className="font-semibold">{resultadoAtual.historicoResumo.total} un.</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Média real/dia</span><span className="font-semibold">{resultadoAtual.historicoResumo.mediaDiaria.toFixed(1)} un.</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Dias com vendas</span><span className="font-semibold">{resultadoAtual.historicoResumo.diasComDados}</span></div>
                    </div>
                    <div className="mt-3 pt-2 border-t border-gray-200">
                      <p className="text-[10px] font-medium text-gray-500 mb-1.5">Últimos 7 dias:</p>
                      <div className="grid grid-cols-7 gap-1">
                        {resultadoAtual.historicoResumo.ultimos7.map((d: any, i: number) => (
                          <div key={i} className="text-center">
                            <div className="text-[9px] text-gray-400">{format(new Date(d.data + 'T00:00:00'), 'dd/MM')}</div>
                            <div className="text-xs font-bold text-blue-700">{d.quantidade}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                <div className={`rounded-lg p-4 border-l-4 ${resultadoAtual.recomendacao === 'aumentar' ? 'border-green-500 bg-green-50' : resultadoAtual.recomendacao === 'reduzir' ? 'border-amber-500 bg-amber-50' : 'border-blue-500 bg-blue-50'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    {resultadoAtual.recomendacao === 'aumentar' ? <TrendingUp size={16} className="text-green-600" /> : resultadoAtual.recomendacao === 'reduzir' ? <TrendingDown size={16} className="text-amber-600" /> : <Zap size={16} className="text-blue-600" />}
                    <span className="font-semibold text-sm capitalize">{resultadoAtual.recomendacao === 'aumentar' ? 'Aumentar' : resultadoAtual.recomendacao === 'reduzir' ? 'Reduzir' : 'Manter'}</span>
                  </div>
                  <p className="text-xs text-gray-700">{resultadoAtual.sugestao}</p>
                </div>
              </div>
            )}
            {!carregando && !resultadoAtual && (
              <div className="text-center py-8 text-gray-400 text-sm">
                {resultados.size === 0 ? 'Analisando todos os produtos...' : 'Nenhum resultado disponível'}
              </div>
            )}
          </div>
          <div className="card">
            <div className="flex items-center gap-2 mb-3"><Calendar size={18} className="text-amber-500" /><h3 className="font-semibold text-sm">Calendário Real</h3></div>
            <div className="mb-3">
              <p className="text-xs text-gray-500 mb-2">Intensidade por dia da semana:</p>
              <div className="flex gap-1">
                {DIAS_SEMANA.map((d, i) => (
                  <div key={d} className={`flex-1 text-center rounded p-1 text-[10px] font-medium ${FATORES_DIA[i] >= 1.15 ? 'bg-green-100 text-green-700' : FATORES_DIA[i] <= 0.7 ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'}`}>
                    <div>{d}</div>
                    <div className="text-[9px] opacity-75">{FATORES_DIA[i]}x</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2 mb-2"><Sun size={14} className="text-amber-500" /><p className="text-xs font-semibold text-gray-600">Eventos Próximos</p></div>
            <div className="space-y-2">
              {eventos.slice(0, 5).map((ev: any) => {
                const dataEvento = new Date(ev.data_inicio + 'T00:00:00');
                const diaSem = getDay(dataEvento);
                return (
                  <div key={ev.id || ev.nome} className="flex items-start gap-2 text-sm">
                    <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${ev.tipo === 'feriado' ? 'bg-red-400' : ev.tipo === 'promocao' ? 'bg-green-400' : 'bg-amber-400'}`} />
                    <div>
                      <p className="font-medium text-xs">{ev.nome}</p>
                      <p className="text-[11px] text-gray-500">{format(dataEvento, 'dd/MM')} ({DIAS_SEMANA[diaSem]}) · {ev.tipo === 'feriado' ? '🔴 Feriado' : ev.tipo === 'promocao' ? '🟢 Promoção' : '🟡 Evento'} · impacto {ev.impacto_estimado}x</p>
                      {ev.data_fim && dataEvento.toISOString() !== ev.data_fim && <p className="text-[11px] text-gray-400">até {format(new Date(ev.data_fim + 'T00:00:00'), 'dd/MM')}</p>}
                    </div>
                  </div>
                );
              })}
              {eventos.length === 0 && <p className="text-gray-400 text-sm">Nenhum evento próximo</p>}
            </div>
          </div>
        </div>
        <div className="lg:col-span-2 space-y-4">
          <div className="card">
            <div className="flex items-center gap-2 mb-4"><BarChart3 size={20} className="text-blue-600" /><h3 className="font-semibold">Histórico Real de Vendas</h3></div>
            {carregando && resultados.size === 0 ? (
              <div className="flex items-center justify-center h-[250px]">
                <div className="text-center">
                  <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-3" />
                  <p className="text-sm text-gray-400">Carregando dados históricos...</p>
                </div>
              </div>
            ) : historicoData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={historicoData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="data" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="historico" stroke="#3b82f6" strokeWidth={2} dot={false} name="Vendas Reais" />
                </LineChart>
              </ResponsiveContainer>
            ) : <div className="flex items-center justify-center h-[250px] text-gray-400">Nenhum dado histórico disponível</div>}
          </div>
          <div className="card">
            <div className="flex items-center gap-2 mb-4"><LineChartIcon size={20} className="text-purple-600" /><h3 className="font-semibold">Previsão de Demanda (7 dias)</h3></div>
            {carregando && resultados.size === 0 ? (
              <div className="flex items-center justify-center h-[250px]">
                <div className="text-center">
                  <div className="animate-spin h-8 w-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-3" />
                  <p className="text-sm text-gray-400">IA gerando previsões...</p>
                </div>
              </div>
            ) : previsaoData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={previsaoData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="data" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="previsao" stroke="#8b5cf6" strokeWidth={2.5} strokeDasharray="6 4" dot={{ r: 4, fill: '#8b5cf6' }} name="Previsão" />
                </LineChart>
              </ResponsiveContainer>
            ) : <div className="flex items-center justify-center h-[250px] text-gray-400">Nenhuma previsão disponível</div>}
          </div>
        </div>
      </div>
      <div className="card">
        <div className="flex items-center gap-2 mb-4"><BrainCircuit size={20} className="text-purple-600" /><h3 className="font-semibold">Recomendações da IA</h3></div>
        <div className="space-y-3">
          {recomendacoesIA.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {recomendacoesIA.map((r: any, i: number) => (
                <div key={i} className={`rounded-lg p-4 border-l-4 ${r.recomendacao === 'aumentar' ? 'border-green-500 bg-green-50' : r.recomendacao === 'reduzir' ? 'border-red-500 bg-red-50' : 'border-blue-500 bg-blue-50'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-sm">{r.produto_nome}</h4>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${r.urgencia === 'alta' ? 'bg-red-200 text-red-800' : r.urgencia === 'media' ? 'bg-amber-200 text-amber-800' : 'bg-blue-100 text-blue-700'}`}>{r.urgencia}</span>
                  </div>
                  <div className="flex items-center gap-1.5 mb-1">
                    {r.recomendacao === 'aumentar' ? <TrendingUp size={14} className="text-green-600" /> : r.recomendacao === 'reduzir' ? <TrendingDown size={14} className="text-red-600" /> : <Zap size={14} className="text-blue-600" />}
                    <span className="text-xs font-medium capitalize">{r.recomendacao} estoque</span>
                  </div>
                  <p className="text-xs font-semibold text-gray-800 mb-0.5">{r.acao}</p>
                  <p className="text-[11px] text-gray-600">{r.motivo}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {recomendacoes?.baixos?.map((p: any) => (
                <div key={p.id} className="flex items-center gap-3 bg-red-50 rounded-lg p-3"><AlertTriangle size={18} className="text-red-500 shrink-0" /><div><p className="text-sm font-medium text-red-800">{p.descricao}</p><p className="text-xs text-red-600">Estoque baixo: {p.estoque_atual}/{p.estoque_minimo}</p></div></div>
              ))}
              {recomendacoes?.excessos?.map((p: any) => (
                <div key={p.id} className="flex items-center gap-3 bg-amber-50 rounded-lg p-3"><AlertTriangle size={18} className="text-amber-500 shrink-0" /><div><p className="text-sm font-medium text-amber-800">{p.descricao}</p><p className="text-xs text-amber-600">Excesso: {p.estoque_atual}/{p.estoque_maximo}</p></div></div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
