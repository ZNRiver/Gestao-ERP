# Gestão ERP

Sistema ERP completo para gestão empresarial, com módulos de RH, Estoque, Vendas, Previsão de Demanda e Alertas.

## Estrutura

```
backend/   — API REST (Express + TypeScript + PostgreSQL)
frontend/  — SPA React (Vite + TypeScript + Tailwind)
```

## Tecnologias

**Backend:** Node.js, Express, TypeScript, PostgreSQL, JWT, Zod
**Frontend:** React 18, TypeScript, Vite, Tailwind CSS, React Router, Recharts, Lucide Icons

## Início rápido

```bash
# Backend (usa o .env global da raiz como fallback)
cd backend
bun install
bun run dev

# Frontend
cd frontend
bun install
bun run dev   # VITE_API_URL padrão: http://localhost:3001/api (override via variável de ambiente)
```

## Docker

Os arquivos Docker ficam na raiz do projeto:

```
docker-compose.yml    — orquestração (postgres + backend + frontend)
backend.Dockerfile    — imagem da API (Bun)
frontend.Dockerfile   — build do frontend + Nginx
nginx/default.conf    — proxy reverso (/api → backend:3001)
```

O banco é **PostgreSQL** (container `postgres`, exposto em `localhost:5433`, usuário/senha `erp`/`erp123`, database `erp`). O schema é criado automaticamente na subida do backend (`db/migrate.ts`).

### Subir os containers

```bash
# 1. Configurar o .env na raiz (obrigatório: JWT_SECRET; opcionais: ADMIN_*, NVIDIA_API_KEY)
#    Referência: variáveis usadas pelo backend (DATABASE_URL, JWT_SECRET, CORS_ORIGIN, NVIDIA_API_KEY, ADMIN_*)

# 2. Construir e iniciar
cd .
docker compose build --pull
docker compose up -d
```

A aplicação fica disponível em http://localhost (frontend na porta 80, com `/api` redirecionado para o backend). O banco PostgreSQL sobe junto e o schema é criado automaticamente.

Para criar o primeiro usuário admin:

```bash
docker compose exec backend bun run dist/scripts/create-admin.js
```

### Parar e limpar

```bash
docker compose stop                                        # parar os containers
docker compose down --remove-orphans --volumes             # remover containers, redes e volumes
```

## Funcionalidades

- **Dashboard** — KPIs, gráficos de vendas, alertas
- **RH** — Colaboradores, cargos, ponto eletrônico, faltas, controle de acesso
- **Estoque** — Produtos, categorias (com ícones personalizáveis), movimentações
- **Vendas** — Histórico e registro de vendas
- **Previsão** — Previsão de demanda com base em histórico e eventos externos
- **Alertas** — Notificações de estoque baixo, excesso e perdas
- **Tema escuro** — Alternância entre claro/escuro com persistência
