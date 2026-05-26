// ============================================================
// ERP Backend - Tipos Compartilhados
// ============================================================

export type UserRole = 'admin' | 'gerente' | 'supervisor' | 'trabalhador';
export type StatusFuncionario = 'ativo' | 'ferias' | 'afastado' | 'desligado';
export type TipoMovimentacao = 'entrada' | 'saida' | 'perda' | 'ajuste' | 'producao';
export type StatusPedido = 'pendente' | 'aprovado' | 'em_separacao' | 'enviado' | 'entregue' | 'cancelado';
export type TipoAlerta = 'estoque_baixo' | 'estoque_excesso' | 'validade' | 'perda' | 'demanda';
export type Gravidade = 'baixa' | 'media' | 'alta' | 'critica';

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  nome: string;
}

export interface Profile {
  id: string;
  nome: string;
  email: string;
  role: UserRole;
  avatar_url?: string;
  telefone?: string;
  created_at: string;
  updated_at: string;
}

export interface Cargo {
  id: string;
  nome: string;
  descricao?: string;
  salario_base: number;
  carga_horaria_semanal: number;
  created_at: string;
}

export interface Colaborador {
  id: string;
  profile_id?: string;
  cargo_id?: string;
  cargo?: Cargo;
  profile?: Profile;
  matricula: string;
  nome: string;
  cpf?: string;
  data_admissao: string;
  data_desligamento?: string;
  status: StatusFuncionario;
  salario: number;
  created_at: string;
  updated_at: string;
}

export interface RegistroPonto {
  id: string;
  colaborador_id: string;
  data: string;
  entrada?: string;
  saida_almoco?: string;
  volta_almoco?: string;
  saida?: string;
  horas_trabalhadas: number;
  observacao?: string;
  colaborador?: Colaborador;
}

export interface Falta {
  id: string;
  colaborador_id: string;
  data: string;
  tipo: string;
  justificativa?: string;
  abonada: boolean;
  colaborador?: Colaborador;
}

export interface CategoriaProduto {
  id: string;
  nome: string;
  descricao?: string;
  icone?: string;
  created_at: string;
}

export interface Fornecedor {
  id: string;
  nome: string;
  cnpj?: string;
  inscricao_estadual?: string;
  contato_nome?: string;
  contato_telefone?: string;
  contato_email?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  observacao?: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Cliente {
  id: string;
  nome: string;
  documento?: string;
  telefone?: string;
  email?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  observacao?: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Produto {
  id: string;
  codigo?: string;
  descricao: string;
  categoria_id?: string;
  categoria?: CategoriaProduto;
  fornecedor_id?: string;
  fornecedor?: Fornecedor;
  preco_custo: number;
  preco_venda: number;
  estoque_atual: number;
  estoque_minimo: number;
  estoque_maximo: number;
  unidade: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface MovimentacaoEstoque {
  id: string;
  produto_id: string;
  tipo: TipoMovimentacao;
  quantidade: number;
  valor_unitario?: number;
  valor_total?: number;
  motivo?: string;
  colaborador_id?: string;
  produto?: Produto;
  colaborador?: Colaborador;
  created_at: string;
}

export interface Venda {
  id: string;
  numero_pedido: string;
  vendedor_id?: string;
  cliente_id?: string;
  cliente?: Cliente;
  cliente_nome?: string;
  cliente_documento?: string;
  valor_total: number;
  desconto: number;
  valor_final: number;
  status: StatusPedido;
  observacao?: string;
  data_venda: string;
  vendedor?: Colaborador;
  itens?: ItemVenda[];
}

export interface ItemVenda {
  id: string;
  venda_id: string;
  produto_id: string;
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
  produto?: Produto;
}

export interface Meta {
  id: string;
  colaborador_id?: string;
  titulo: string;
  descricao?: string;
  tipo: string;
  valor_meta: number;
  valor_atual: number;
  unidade: string;
  data_inicio: string;
  data_fim: string;
  atingida: boolean;
  colaborador?: Colaborador;
}

export interface Producao {
  id: string;
  colaborador_id: string;
  produto_id?: string;
  quantidade: number;
  valor_unitario?: number;
  valor_total?: number;
  data: string;
  observacao?: string;
  colaborador?: Colaborador;
  produto?: Produto;
}

export interface EventoExterno {
  id: string;
  nome: string;
  tipo: string;
  data_inicio: string;
  data_fim?: string;
  impacto_estimado?: number;
  categoria_produto_id?: string;
  descricao?: string;
}

export interface Funcao {
  role: string;
  nome_exibicao: string;
  descricao?: string;
  permissoes: string[];
  created_at: string;
  updated_at: string;
}

export interface Alerta {
  id: string;
  tipo: TipoAlerta;
  titulo: string;
  mensagem: string;
  produto_id?: string;
  lido: boolean;
  gravidade: Gravidade;
  created_at: string;
  produto?: Produto;
}

export interface PrevisaoDemanda {
  produto_id: string;
  produto_nome: string;
  previsao7dias: number;
  previsao30dias: number;
  fatorSazonal: number;
  fatorTendencia: number;
  fatorIA?: number;
  estoque_atual: number;
  recomendacao: 'aumentar' | 'reduzir' | 'manter';
  sugestao: string;
  chartData: { data: string; historico: number | null; previsao: number | null }[];
  historicoResumo?: {
    total: number;
    mediaDiaria: number;
    diasComDados: number;
    ultimos7: { data: string; quantidade: number }[];
  };
}

export interface DashboardData {
  totalVendasMes: number;
  totalVendasMesAnterior: number;
  variacaoVendas: number;
  totalProdutos: number;
  produtosBaixoEstoque: number;
  totalColaboradores: number;
  colaboradoresAtivos: number;
  totalPerdasMes: number;
  alertasNaoLidos: number;
  vendasPorMes: { mes: string; valor: number }[];
}

// ============================================================
// Request / Response helpers
// ============================================================
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  search?: string;
  orderBy?: string;
  orderDir?: 'asc' | 'desc';
}
