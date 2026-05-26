-- ============================================================
-- GESTÃO ERP - SCHEMA COMPLETO PARA SUPABASE (CORRIGIDO)
-- ============================================================

-- 1. EXTENSÕES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_cron";

-- 2. ENUMS
CREATE TYPE user_role AS ENUM ('admin', 'gerente', 'supervisor', 'trabalhador');
CREATE TYPE status_funcionario AS ENUM ('ativo', 'ferias', 'afastado', 'desligado');
CREATE TYPE tipo_movimentacao AS ENUM ('entrada', 'saida', 'perda', 'ajuste', 'producao');
CREATE TYPE status_pedido AS ENUM ('pendente', 'aprovado', 'em_separacao', 'enviado', 'entregue', 'cancelado');
CREATE TYPE tipo_alerta AS ENUM ('estoque_baixo', 'estoque_excesso', 'validade', 'perda', 'demanda');

-- 3. PERFIS (estende auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome VARCHAR(200) NOT NULL,
  email VARCHAR(200) UNIQUE NOT NULL,
  role user_role NOT NULL DEFAULT 'trabalhador',
  avatar_url TEXT,
  telefone VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 4. CARGOS
CREATE TABLE cargos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome VARCHAR(150) NOT NULL,
  descricao TEXT,
  salario_base DECIMAL(12,2) NOT NULL DEFAULT 0,
  carga_horaria_semanal INT NOT NULL DEFAULT 40,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. COLABORADORES
CREATE TABLE colaboradores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  cargo_id UUID REFERENCES cargos(id) ON DELETE SET NULL,
  matricula VARCHAR(50) UNIQUE NOT NULL,
  nome VARCHAR(200) NOT NULL,
  cpf VARCHAR(14) UNIQUE,
  data_admissao DATE NOT NULL DEFAULT CURRENT_DATE,
  data_desligamento DATE,
  status status_funcionario NOT NULL DEFAULT 'ativo',
  salario DECIMAL(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. REGISTRO DE PONTO
CREATE TABLE registros_ponto (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  colaborador_id UUID NOT NULL REFERENCES colaboradores(id) ON DELETE CASCADE,
  data DATE NOT NULL,
  entrada TIMETZ,
  saida_almoco TIMETZ,
  volta_almoco TIMETZ,
  saida TIMETZ,
  horas_trabalhadas DECIMAL(5,2) DEFAULT 0,
  observacao TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(colaborador_id, data)
);

-- 7. FALTAS / AFASTAMENTOS
CREATE TABLE faltas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  colaborador_id UUID NOT NULL REFERENCES colaboradores(id) ON DELETE CASCADE,
  data DATE NOT NULL,
  tipo VARCHAR(50) NOT NULL DEFAULT 'falta',
  justificativa TEXT,
  abonada BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. CATEGORIAS DE PRODUTOS
CREATE TABLE categorias_produto (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome VARCHAR(150) NOT NULL,
  descricao TEXT,
  icone TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 9. FORNECEDORES
CREATE TABLE fornecedores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome VARCHAR(200) NOT NULL,
  cnpj VARCHAR(20) UNIQUE,
  inscricao_estadual VARCHAR(20),
  contato_nome VARCHAR(200),
  contato_telefone VARCHAR(20),
  contato_email VARCHAR(200),
  endereco TEXT,
  cidade VARCHAR(100),
  estado VARCHAR(2),
  observacao TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE fornecedores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Qualquer um pode ver fornecedores" ON fornecedores FOR SELECT USING (true);
CREATE POLICY "Admin/gerente pode gerenciar fornecedores" ON fornecedores FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'gerente'))
);

-- 10. CLIENTES
CREATE TABLE clientes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome VARCHAR(200) NOT NULL,
  documento VARCHAR(20),
  telefone VARCHAR(20),
  email VARCHAR(200),
  endereco TEXT,
  cidade VARCHAR(100),
  estado VARCHAR(2),
  observacao TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Qualquer um pode ver clientes" ON clientes FOR SELECT USING (true);
CREATE POLICY "Admin/gerente pode gerenciar clientes" ON clientes FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'gerente'))
);

-- 11. PRODUTOS
CREATE TABLE produtos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  codigo VARCHAR(50) UNIQUE,
  descricao TEXT NOT NULL,
  categoria_id UUID REFERENCES categorias_produto(id) ON DELETE SET NULL,
  fornecedor_id UUID REFERENCES fornecedores(id) ON DELETE SET NULL,
  preco_custo DECIMAL(12,2) DEFAULT 0,
  preco_venda DECIMAL(12,2) NOT NULL DEFAULT 0,
  estoque_atual INT NOT NULL DEFAULT 0,
  estoque_minimo INT NOT NULL DEFAULT 10,
  estoque_maximo INT NOT NULL DEFAULT 500,
  unidade VARCHAR(20) DEFAULT 'un',
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 12. MOVIMENTAÇÕES DE ESTOQUE
CREATE TABLE movimentacoes_estoque (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  produto_id UUID NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
  tipo tipo_movimentacao NOT NULL,
  quantidade INT NOT NULL,
  valor_unitario DECIMAL(12,2),
  valor_total DECIMAL(12,2),
  motivo TEXT,
  colaborador_id UUID REFERENCES colaboradores(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 14. VENDAS
CREATE TABLE vendas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  numero_pedido VARCHAR(50) UNIQUE NOT NULL,
  vendedor_id UUID REFERENCES colaboradores(id),
  cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL,
  cliente_nome VARCHAR(200),
  cliente_documento VARCHAR(20),
  valor_total DECIMAL(12,2) NOT NULL DEFAULT 0,
  desconto DECIMAL(12,2) DEFAULT 0,
  valor_final DECIMAL(12,2) NOT NULL DEFAULT 0,
  status status_pedido NOT NULL DEFAULT 'pendente',
  observacao TEXT,
  data_venda TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 15. ITENS DA VENDA
CREATE TABLE itens_venda (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  venda_id UUID NOT NULL REFERENCES vendas(id) ON DELETE CASCADE,
  produto_id UUID NOT NULL REFERENCES produtos(id),
  quantidade INT NOT NULL,
  valor_unitario DECIMAL(12,2) NOT NULL,
  valor_total DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 16. METAS
CREATE TABLE metas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  colaborador_id UUID REFERENCES colaboradores(id),
  titulo VARCHAR(200) NOT NULL,
  descricao TEXT,
  tipo VARCHAR(50) NOT NULL,
  valor_meta DECIMAL(12,2) NOT NULL,
  valor_atual DECIMAL(12,2) DEFAULT 0,
  unidade VARCHAR(20) DEFAULT 'R$',
  data_inicio DATE NOT NULL,
  data_fim DATE NOT NULL,
  atingida BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 17. REGISTROS DE PRODUÇÃO
CREATE TABLE producao (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  colaborador_id UUID NOT NULL REFERENCES colaboradores(id),
  produto_id UUID REFERENCES produtos(id),
  quantidade INT NOT NULL,
  valor_unitario DECIMAL(12,2),
  valor_total DECIMAL(12,2),
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  observacao TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 18. PREVISÃO DE DEMANDA
CREATE TABLE previsao_demanda (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  produto_id UUID NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
  data_previsao DATE NOT NULL,
  quantidade_prevista INT NOT NULL,
  quantidade_real INT,
  intervalo_confianca_min INT,
  intervalo_confianca_max INT,
  fator_sazonalidade DECIMAL(5,3),
  fator_tendencia DECIMAL(5,3),
  evento_externo VARCHAR(200),
  acuracia DECIMAL(5,2),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(produto_id, data_previsao)
);

-- 19. EVENTOS EXTERNOS (para previsão)
CREATE TABLE eventos_externos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome VARCHAR(200) NOT NULL,
  tipo VARCHAR(50) NOT NULL,
  data_inicio DATE NOT NULL,
  data_fim DATE,
  impacto_estimado DECIMAL(5,3),
  categoria_produto_id UUID REFERENCES categorias_produto(id),
  descricao TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 20. ALERTAS
CREATE TABLE alertas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tipo tipo_alerta NOT NULL,
  titulo VARCHAR(200) NOT NULL,
  mensagem TEXT NOT NULL,
  produto_id UUID REFERENCES produtos(id),
  lido BOOLEAN DEFAULT false,
  gravidade VARCHAR(20) DEFAULT 'media',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- ÍNDICES
-- ============================================================
CREATE INDEX idx_movimentacoes_produto ON movimentacoes_estoque(produto_id, created_at);
CREATE INDEX idx_vendas_data ON vendas(data_venda);
CREATE INDEX idx_vendas_vendedor ON vendas(vendedor_id);
CREATE INDEX idx_itens_venda ON itens_venda(venda_id);
CREATE INDEX idx_ponto_colaborador ON registros_ponto(colaborador_id, data);
CREATE INDEX idx_faltas_colaborador ON faltas(colaborador_id, data);
CREATE INDEX idx_producao_data ON producao(data);
CREATE INDEX idx_previsao_produto ON previsao_demanda(produto_id, data_previsao);
CREATE INDEX idx_alertas_lido ON alertas(lido, created_at);
CREATE INDEX idx_metas_colaborador ON metas(colaborador_id);

-- ============================================================
-- FUNÇÕES AUTOMÁTICAS
-- ============================================================

-- Atualiza updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tg_produtos_updated_at BEFORE UPDATE ON produtos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tg_colaboradores_updated_at BEFORE UPDATE ON colaboradores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tg_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Gera número de pedido automático
CREATE OR REPLACE FUNCTION gerar_numero_pedido()
RETURNS TRIGGER AS $$
BEGIN
  NEW.numero_pedido := 'PED-' || to_char(NEW.created_at, 'YYYYMMDD') || '-' || 
    lpad(CAST(floor(random() * 9000 + 1000) AS TEXT), 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tg_gerar_numero_pedido BEFORE INSERT ON vendas
  FOR EACH ROW EXECUTE FUNCTION gerar_numero_pedido();

-- ============================================================
-- ALERTAS DE ESTOQUE (CORRIGIDO)
-- ============================================================

-- Trigger 1: dispara ao inserir/atualizar diretamente um produto
-- Aqui NEW é a própria linha de "produtos", usamos NEW.id diretamente
CREATE OR REPLACE FUNCTION verificar_estoque_produto()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.estoque_atual <= NEW.estoque_minimo THEN
    INSERT INTO alertas (tipo, titulo, mensagem, produto_id, gravidade)
    VALUES (
      'estoque_baixo',
      'Estoque Baixo',
      'Produto "' || NEW.descricao || '" está com ' || NEW.estoque_atual || 
      ' unidades (mínimo: ' || NEW.estoque_minimo || ')',
      NEW.id,
      'alta'
    );
  END IF;

  IF NEW.estoque_atual >= NEW.estoque_maximo THEN
    INSERT INTO alertas (tipo, titulo, mensagem, produto_id, gravidade)
    VALUES (
      'estoque_excesso',
      'Excesso de Estoque',
      'Produto "' || NEW.descricao || '" excedeu estoque máximo (' || NEW.estoque_maximo || ')',
      NEW.id,
      'media'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tg_verificar_estoque_produto
  AFTER INSERT OR UPDATE ON produtos
  FOR EACH ROW EXECUTE FUNCTION verificar_estoque_produto();

-- Trigger 2: dispara após movimentação de estoque (tabela que TEM produto_id)
CREATE OR REPLACE FUNCTION verificar_estoque_movimentacao()
RETURNS TRIGGER AS $$
DECLARE
  prod RECORD;
BEGIN
  SELECT id, descricao, estoque_atual, estoque_minimo, estoque_maximo
  INTO prod
  FROM produtos WHERE id = NEW.produto_id;

  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  IF prod.estoque_atual <= prod.estoque_minimo THEN
    INSERT INTO alertas (tipo, titulo, mensagem, produto_id, gravidade)
    VALUES (
      'estoque_baixo',
      'Estoque Baixo',
      'Produto "' || prod.descricao || '" está com ' || prod.estoque_atual ||
      ' unidades (mínimo: ' || prod.estoque_minimo || ')',
      prod.id,
      'alta'
    );
  END IF;

  IF prod.estoque_atual >= prod.estoque_maximo THEN
    INSERT INTO alertas (tipo, titulo, mensagem, produto_id, gravidade)
    VALUES (
      'estoque_excesso',
      'Excesso de Estoque',
      'Produto "' || prod.descricao || '" excedeu estoque máximo (' || prod.estoque_maximo || ')',
      prod.id,
      'media'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tg_verificar_estoque_mov
  AFTER INSERT ON movimentacoes_estoque
  FOR EACH ROW EXECUTE FUNCTION verificar_estoque_movimentacao();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Function to check admin role (SECURITY DEFINER to bypass RLS recursion)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin');
$$;

-- Profiles
CREATE POLICY "Usuarios veem proprio perfil" ON profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins veem todos perfis" ON profiles
  FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins inserem perfis" ON profiles
  FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admins atualizam perfis" ON profiles
  FOR UPDATE USING (public.is_admin());

-- Produtos
CREATE POLICY "Todos leem produtos" ON produtos FOR SELECT USING (true);
CREATE POLICY "Admin gerente inserem produtos" ON produtos
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'gerente'))
  );
CREATE POLICY "Admin gerente atualizam produtos" ON produtos
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'gerente'))
  );

-- Vendas e itens
CREATE POLICY "Todos leem vendas" ON vendas FOR SELECT USING (true);
CREATE POLICY "Todos inserem vendas" ON vendas FOR INSERT WITH CHECK (true);
CREATE POLICY "Todos leem itens" ON itens_venda FOR SELECT USING (true);
CREATE POLICY "Todos inserem itens" ON itens_venda FOR INSERT WITH CHECK (true);

-- Colaboradores
CREATE POLICY "Todos leem colaboradores" ON colaboradores FOR SELECT USING (true);
CREATE POLICY "Admin gerente gerenciam colaboradores" ON colaboradores
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'gerente'))
  );

-- Alertas
CREATE POLICY "Todos leem alertas" ON alertas FOR SELECT USING (true);
CREATE POLICY "Admin gerente gerenciam alertas" ON alertas
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'gerente'))
  );

-- ============================================================
-- DADOS DE EXEMPLO
-- ============================================================

INSERT INTO categorias_produto (nome, descricao, icone) VALUES
  ('Matéria-Prima', 'Insumos para produção', 'https://cdn.jsdelivr.net/npm/lucide-static@0.454.0/icons/package.svg'),
  ('Produto', 'Produtos prontos para venda', 'https://cdn.jsdelivr.net/npm/lucide-static@0.454.0/icons/shopping-bag.svg'),
  ('Embalagens', 'Materiais de embalagem', 'https://cdn.jsdelivr.net/npm/lucide-static@0.454.0/icons/box.svg'),
  ('Limpeza', 'Produtos de limpeza e higiene', 'https://cdn.jsdelivr.net/npm/lucide-static@0.454.0/icons/spray-can.svg'),
  ('Escritório', 'Material de escritório', 'https://cdn.jsdelivr.net/npm/lucide-static@0.454.0/icons/briefcase.svg');

INSERT INTO cargos (nome, descricao, salario_base, carga_horaria_semanal) VALUES
  ('Gerente Geral', 'Responsável pela gestão geral', 8000.00, 44),
  ('Supervisor de Produção', 'Supervisiona a linha de produção', 4500.00, 44),
  ('Vendedor', 'Atendimento e vendas', 2200.00, 40),
  ('Operador de Produção', 'Opera máquinas e produz', 2000.00, 44),
  ('Analista de Estoque', 'Controla entrada e saída de produtos', 3200.00, 40),
  ('Auxiliar Administrativo', 'Suporte administrativo', 1800.00, 40);

INSERT INTO produtos (codigo, descricao, categoria_id, preco_custo, preco_venda, estoque_atual, estoque_minimo, estoque_maximo, unidade) VALUES
  ('MP-001', 'Aço Carbono 1020 — Barra de aço carbono', (SELECT id FROM categorias_produto WHERE nome = 'Matéria-Prima' LIMIT 1), 45.00, 75.00, 120, 30, 300, 'kg'),
  ('MP-002', 'Resina Poliéster — Resina para laminação', (SELECT id FROM categorias_produto WHERE nome = 'Matéria-Prima' LIMIT 1), 28.00, 48.00, 8, 20, 200, 'kg'),
  ('PA-001', 'Peça Usinada Tipo A — Peça final usinada', (SELECT id FROM categorias_produto WHERE nome = 'Produto' LIMIT 1), 85.00, 150.00, 45, 15, 150, 'un'),
  ('PA-002', 'Conjunto Montado B — Conjunto completo montado', (SELECT id FROM categorias_produto WHERE nome = 'Produto' LIMIT 1), 210.00, 380.00, 22, 10, 80, 'un'),
  ('EMB-001', 'Caixa Papelão 40x30 — Caixa de papelão ondulado', (SELECT id FROM categorias_produto WHERE nome = 'Embalagens' LIMIT 1), 2.50, 5.00, 300, 100, 1000, 'un'),
  ('PA-003', 'Kit Ferramentas — Kit com 5 ferramentas', (SELECT id FROM categorias_produto WHERE nome = 'Produto' LIMIT 1), 55.00, 99.90, 3, 20, 100, 'un');

INSERT INTO eventos_externos (nome, tipo, data_inicio, data_fim, impacto_estimado, descricao) VALUES
  ('Ano Novo', 'feriado', '2026-01-01', '2026-01-01', 0.6, 'Queda nas vendas e operações'),
  ('Carnaval', 'feriado', '2026-02-14', '2026-02-17', 0.5, 'Queda nas vendas e operações'),
  ('Páscoa', 'feriado', '2026-04-05', '2026-04-05', 1.5, 'Aumento em vendas de chocolates e alimentos'),
  ('Dia das Mães', 'evento', '2026-05-10', '2026-05-10', 1.6, 'Alta nas vendas de presentes e utilidades'),
  ('Dia dos Namorados', 'evento', '2026-06-12', '2026-06-12', 1.5, 'Alta nas vendas de presentes'),
  ('Férias Escolares', 'tendencia', '2026-07-01', '2026-07-31', 0.85, 'Redução na demanda industrial'),
  ('Dia dos Pais', 'evento', '2026-08-09', '2026-08-09', 1.3, 'Alta em vendas de ferramentas e eletrônicos'),
  ('Dia das Crianças', 'evento', '2026-10-12', '2026-10-12', 1.4, 'Alta em brinquedos e vestuário'),
  ('Finados', 'feriado', '2026-11-02', '2026-11-02', 0.7, 'Queda nas vendas'),
  ('Proclamação República', 'feriado', '2026-11-15', '2026-11-15', 0.8, 'Queda parcial nas vendas'),
  ('Black Friday', 'promocao', '2026-11-27', '2026-11-30', 2.5, 'Maior evento de vendas do ano'),
  ('Natal', 'feriado', '2026-12-21', '2026-12-25', 2.0, 'Período de compras natalinas'),
  ('Réveillon', 'feriado', '2026-12-31', '2026-12-31', 0.6, 'Queda nas operações');

-- ============================================================
-- 21. FUNÇÕES (papéis do sistema)
-- ============================================================
CREATE TABLE IF NOT EXISTS funcoes (
  role VARCHAR(50) PRIMARY KEY,
  nome_exibicao VARCHAR(100) NOT NULL,
  descricao TEXT,
  permissoes JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE funcoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Qualquer um pode ver funcoes"
  ON funcoes FOR SELECT USING (true);

CREATE POLICY "Admin pode gerenciar funcoes"
  ON funcoes FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Seed das funções
INSERT INTO funcoes (role, nome_exibicao, descricao, permissoes) VALUES
  ('admin', 'Administrador', 'Acesso total ao sistema', '["gerenciar_usuarios","gerenciar_produtos","gerenciar_vendas","gerenciar_colaboradores","gerenciar_financeiro","ver_relatorios"]'),
  ('gerente', 'Gerente', 'Gerencia operações e equipe', '["gerenciar_colaboradores","gerenciar_produtos","gerenciar_vendas","ver_relatorios"]'),
  ('supervisor', 'Supervisor', 'Supervisiona atividades diárias', '["gerenciar_produtos","ver_relatorios","registrar_ponto"]'),
  ('trabalhador', 'Trabalhador', 'Acesso básico para trabalho operacional', '["registrar_ponto","ver_produtos"]')
ON CONFLICT (role) DO NOTHING;