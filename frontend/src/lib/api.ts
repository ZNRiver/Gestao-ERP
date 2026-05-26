// ============================================================
// API Client – Comunicação com o Backend ERP
// ============================================================

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

let authToken: string | null = localStorage.getItem('erp_token');

export function setToken(token: string | null) {
  authToken = token;
  if (token) localStorage.setItem('erp_token', token);
  else localStorage.removeItem('erp_token');
}

export function getToken() { return authToken; }

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: 'Erro desconhecido' }));
    throw new Error(body.error || `Erro ${res.status}`);
  }

  const json = await res.json();
  return json.data ?? json;
}

// ============================================================
// Auth
// ============================================================
export const apiAuth = {
  login: (email: string, password: string) =>
    request<{ token: string; profile: any }>('/auth/login', {
      method: 'POST', body: JSON.stringify({ email, password }),
    }),
  me: () => request<any>('/auth/me'),
  profiles: () => request<any[]>('/auth/profiles'),
  createUser: (data: { nome: string; email: string; password: string; role: string; colaborador_id?: string }) =>
    request<any>('/auth/users', { method: 'POST', body: JSON.stringify(data) }),
  deleteUser: (id: string) =>
    request<any>(`/auth/users/${id}`, { method: 'DELETE' }),
};

// ============================================================
// Funções (Papéis / Permissões)
// ============================================================
export const apiFuncoes = {
  list: () => request<any[]>('/funcoes'),
  create: (data: { role: string; nome_exibicao: string; descricao?: string; permissoes?: string[] }) =>
    request<any>('/funcoes', { method: 'POST', body: JSON.stringify(data) }),
  update: (role: string, data: any) =>
    request<any>(`/funcoes/${role}`, { method: 'PUT', body: JSON.stringify(data) }),
  remove: (role: string) =>
    request<any>(`/funcoes/${role}`, { method: 'DELETE' }),
};

// ============================================================
// Dashboard
// ============================================================
export const apiDashboard = {
  get: () => request<any>('/dashboard'),
};

// ============================================================
// RH - Colaboradores
// ============================================================
export const apiColaboradores = {
  list: () => request<any[]>('/rh/colaboradores'),
  getById: (id: string) => request<any>(`/rh/colaboradores/${id}`),
  create: (data: any) => request<any>('/rh/colaboradores', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => request<any>(`/rh/colaboradores/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => request<any>(`/rh/colaboradores/${id}`, { method: 'DELETE' }),
};

// ============================================================
// RH - Cargos
// ============================================================
export const apiCargos = {
  list: () => request<any[]>('/rh/cargos'),
  create: (data: any) => request<any>('/rh/cargos', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => request<any>(`/rh/cargos/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
};

// ============================================================
// RH - Ponto
// ============================================================
export const apiPonto = {
  list: (colabId: string, mes: string) => request<any[]>(`/rh/ponto/${colabId}?mes=${mes}`),
  bater: (colaborador_id: string, tipo: string) =>
    request<any>('/rh/ponto', { method: 'POST', body: JSON.stringify({ colaborador_id, tipo }) }),
  update: (id: string, data: any) =>
    request<any>(`/rh/ponto/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
};

// ============================================================
// RH - Faltas
// ============================================================
export const apiFaltas = {
  list: () => request<any[]>('/rh/faltas'),
  create: (data: any) => request<any>('/rh/faltas', { method: 'POST', body: JSON.stringify(data) }),
  abonar: (id: string) => request<any>(`/rh/faltas/${id}/abonar`, { method: 'PUT' }),
};

// ============================================================
// Estoque - Produtos
// ============================================================
export const apiProdutos = {
  list: () => request<any[]>('/estoque/produtos'),
  create: (data: any) => request<any>('/estoque/produtos', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => request<any>(`/estoque/produtos/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => request<any>(`/estoque/produtos/${id}`, { method: 'DELETE' }),
};

// ============================================================
// Estoque - Categorias
// ============================================================
export const apiCategorias = {
  list: () => request<any[]>('/estoque/categorias'),
  create: (data: any) => request<any>('/estoque/categorias', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => request<any>(`/estoque/categorias/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  remove: (id: string) => request<any>(`/estoque/categorias/${id}`, { method: 'DELETE' }),
};

// ============================================================
// Estoque - Movimentações
// ============================================================
export const apiMovimentacoes = {
  list: (limit = 100) => request<any[]>(`/estoque/movimentacoes?limit=${limit}`),
  create: (data: any) => request<any>('/estoque/movimentacoes', { method: 'POST', body: JSON.stringify(data) }),
};

// ============================================================
// Vendas
// ============================================================
export const apiVendas = {
  list: (limit = 100) => request<any[]>(`/vendas?limit=${limit}`),
  create: (data: any) => request<any>('/vendas', { method: 'POST', body: JSON.stringify(data) }),
  updateStatus: (id: string, status: string) =>
    request<any>(`/vendas/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
};

// ============================================================
// Previsão
// ============================================================
export const apiPrevisao = {
  cache: () => request<{ resultados: any[] | null; eventos: any[] | null; ultimaAtualizacao: string | null; analisando: boolean }>('/previsao/cache'),
  analisarTodos: () => request<any[]>('/previsao/analisar-todos', { method: 'POST' }),
  get: (produtoId: string) => request<any>(`/previsao/${produtoId}`),
  eventosProximos: () => request<any[]>('/previsao/eventos/proximos'),
  recomendacoesGlobais: () => request<{ baixos: any[]; excessos: any[] }>('/previsao/recomendacoes/globais'),
  recomendacoesIA: () => request<any[]>('/previsao/recomendacoes/ia'),
};

// ============================================================
// Alertas
// ============================================================
export const apiAlertas = {
  list: (limit = 100) => request<any[]>(`/alertas?limit=${limit}`),
  marcarLido: (id: string) => request<any>(`/alertas/${id}/lido`, { method: 'PUT' }),
  marcarTodosLidos: () => request<any>('/alertas/todos/lidos', { method: 'PUT' }),
};

// ============================================================
// Fornecedores
// ============================================================
export const apiFornecedores = {
  list: () => request<any[]>('/fornecedores'),
  getById: (id: string) => request<any>(`/fornecedores/${id}`),
  create: (data: any) => request<any>('/fornecedores', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => request<any>(`/fornecedores/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  remove: (id: string) => request<any>(`/fornecedores/${id}`, { method: 'DELETE' }),
};

// ============================================================
// Clientes
// ============================================================
export const apiClientes = {
  list: () => request<any[]>('/clientes'),
  getById: (id: string) => request<any>(`/clientes/${id}`),
  create: (data: any) => request<any>('/clientes', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => request<any>(`/clientes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  remove: (id: string) => request<any>(`/clientes/${id}`, { method: 'DELETE' }),
};