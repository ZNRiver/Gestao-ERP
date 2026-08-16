import { fileURLToPath } from 'url';
import { pool } from '../lib/db.js';

// ============================================================
// Schema PostgreSQL do ERP (idempotente)
// ============================================================
const SCHEMA_SQL = `
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY,
  nome TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'trabalhador',
  avatar_url TEXT,
  telefone TEXT,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cargos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descricao TEXT,
  salario_base NUMERIC(12,2) NOT NULL DEFAULT 0,
  carga_horaria_semanal NUMERIC(5,1) NOT NULL DEFAULT 44,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS colaboradores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  cargo_id UUID REFERENCES cargos(id) ON DELETE SET NULL,
  matricula TEXT NOT NULL,
  nome TEXT NOT NULL,
  cpf TEXT,
  data_admissao DATE,
  data_desligamento DATE,
  status TEXT NOT NULL DEFAULT 'ativo',
  salario NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS registros_ponto (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  colaborador_id UUID NOT NULL REFERENCES colaboradores(id) ON DELETE CASCADE,
  data DATE NOT NULL,
  entrada TEXT,
  saida_almoco TEXT,
  volta_almoco TEXT,
  saida TEXT,
  horas_trabalhadas NUMERIC(6,2) NOT NULL DEFAULT 0,
  observacao TEXT,
  UNIQUE (colaborador_id, data)
);

CREATE TABLE IF NOT EXISTS faltas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  colaborador_id UUID NOT NULL REFERENCES colaboradores(id) ON DELETE CASCADE,
  data DATE NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'sem_justificativa',
  justificativa TEXT,
  abonada BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS categorias_produto (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descricao TEXT,
  icone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS fornecedores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  cnpj TEXT,
  inscricao_estadual TEXT,
  contato_nome TEXT,
  contato_telefone TEXT,
  contato_email TEXT,
  endereco TEXT,
  cidade TEXT,
  estado TEXT,
  observacao TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  documento TEXT,
  telefone TEXT,
  email TEXT,
  endereco TEXT,
  cidade TEXT,
  estado TEXT,
  observacao TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS produtos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT,
  descricao TEXT NOT NULL,
  categoria_id UUID REFERENCES categorias_produto(id) ON DELETE SET NULL,
  fornecedor_id UUID REFERENCES fornecedores(id) ON DELETE SET NULL,
  preco_custo NUMERIC(12,2) NOT NULL DEFAULT 0,
  preco_venda NUMERIC(12,2) NOT NULL DEFAULT 0,
  estoque_atual NUMERIC(12,3) NOT NULL DEFAULT 0,
  estoque_minimo NUMERIC(12,3) NOT NULL DEFAULT 0,
  estoque_maximo NUMERIC(12,3) NOT NULL DEFAULT 0,
  unidade TEXT NOT NULL DEFAULT 'un',
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS movimentacoes_estoque (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  produto_id UUID NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,
  quantidade NUMERIC(12,3) NOT NULL,
  valor_unitario NUMERIC(12,2) NOT NULL DEFAULT 0,
  valor_total NUMERIC(12,2) NOT NULL DEFAULT 0,
  motivo TEXT,
  colaborador_id UUID REFERENCES colaboradores(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS vendas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_pedido TEXT,
  vendedor_id UUID REFERENCES colaboradores(id) ON DELETE SET NULL,
  cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL,
  cliente_nome TEXT,
  cliente_documento TEXT,
  valor_total NUMERIC(12,2) NOT NULL DEFAULT 0,
  desconto NUMERIC(12,2) NOT NULL DEFAULT 0,
  valor_final NUMERIC(12,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'aprovado',
  observacao TEXT,
  data_venda DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS itens_venda (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venda_id UUID NOT NULL REFERENCES vendas(id) ON DELETE CASCADE,
  produto_id UUID NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
  quantidade NUMERIC(12,3) NOT NULL,
  valor_unitario NUMERIC(12,2) NOT NULL,
  valor_total NUMERIC(12,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS metas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  colaborador_id UUID REFERENCES colaboradores(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  descricao TEXT,
  tipo TEXT,
  valor_meta NUMERIC(12,2) NOT NULL DEFAULT 0,
  valor_atual NUMERIC(12,2) NOT NULL DEFAULT 0,
  unidade TEXT,
  data_inicio DATE,
  data_fim DATE,
  atingida BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS producoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  colaborador_id UUID NOT NULL REFERENCES colaboradores(id) ON DELETE CASCADE,
  produto_id UUID REFERENCES produtos(id) ON DELETE SET NULL,
  quantidade NUMERIC(12,3) NOT NULL DEFAULT 0,
  valor_unitario NUMERIC(12,2) NOT NULL DEFAULT 0,
  valor_total NUMERIC(12,2) NOT NULL DEFAULT 0,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  observacao TEXT
);

CREATE TABLE IF NOT EXISTS eventos_externos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  tipo TEXT,
  data_inicio DATE NOT NULL,
  data_fim DATE,
  impacto_estimado NUMERIC(12,2),
  categoria_produto_id UUID REFERENCES categorias_produto(id) ON DELETE SET NULL,
  descricao TEXT
);

CREATE TABLE IF NOT EXISTS funcoes (
  role TEXT PRIMARY KEY,
  nome_exibicao TEXT NOT NULL,
  descricao TEXT,
  permissoes JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS alertas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo TEXT NOT NULL,
  titulo TEXT NOT NULL,
  mensagem TEXT,
  produto_id UUID REFERENCES produtos(id) ON DELETE CASCADE,
  lido BOOLEAN NOT NULL DEFAULT false,
  gravidade TEXT NOT NULL DEFAULT 'media',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS previsao_demanda (
  produto_id UUID PRIMARY KEY REFERENCES produtos(id) ON DELETE CASCADE,
  previsao7dias NUMERIC(12,2) NOT NULL DEFAULT 0,
  previsao30dias NUMERIC(12,2) NOT NULL DEFAULT 0,
  recomendacao TEXT,
  sugestao TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vendas_data_venda ON vendas (data_venda);
CREATE INDEX IF NOT EXISTS idx_itens_venda_produto ON itens_venda (produto_id);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_produto ON movimentacoes_estoque (produto_id);
`;

export async function runMigrations() {
  await pool.query(SCHEMA_SQL);
  console.log('[DB] ✅ Schema PostgreSQL verificado/criado');
}

// Executa direto quando chamado via CLI (bun run db:migrate)
const isMain = process.argv[1] && fileURLToPath(import.meta.url).replace(/\\/g, '/') === process.argv[1].replace(/\\/g, '/');
if (isMain) {
  runMigrations()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[DB] ❌ Falha ao migrar:', err.message);
      process.exit(1);
    });
}
