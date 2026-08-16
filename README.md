# Gestão ERP

Sistema ERP completo para gestão empresarial, com módulos de RH, Estoque, Vendas, Previsão de Demanda e Alertas.

## Estrutura

```
backend/   — API REST (Express + TypeScript + Supabase)
frontend/  — SPA React (Vite + TypeScript + Tailwind)
```

## Tecnologias

**Backend:** Node.js, Express, TypeScript, Supabase, JWT, Zod
**Frontend:** React 18, TypeScript, Vite, Tailwind CSS, React Router, Recharts, Lucide Icons

## Início rápido

```bash
# Backend
cd backend
cp .env.example .env   # configurar DATABASE_URL e JWT_SECRET
bun install
bun run dev

# Frontend
cd frontend
cp .env.example .env   # configurar VITE_API_URL
bun install
bun run dev
```

## Docker

Os arquivos Docker ficam na raiz do projeto:

```
docker-compose.yml    — orquestração (backend + frontend)
backend.Dockerfile    — imagem da API (Bun)
frontend.Dockerfile   — build do frontend + Nginx
nginx/default.conf    — proxy reverso (/api → backend:3001)
```

### Subir os containers

```bash
# 1. Configurar o .env na raiz (obrigatório: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, JWT_SECRET)
cp backend/.env.example .env   # ou use seu backend/.env existente

# 2. Construir e iniciar
cd .
docker compose build --pull
docker compose up -d
```

A aplicação fica disponível em http://localhost (frontend na porta 80, com `/api` redirecionado para o backend).

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
