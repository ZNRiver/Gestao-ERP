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
npm install
npm run dev

# Frontend
cd frontend
cp .env.example .env   # configurar VITE_API_URL
npm install
npm run dev
```

## Funcionalidades

- **Dashboard** — KPIs, gráficos de vendas, alertas
- **RH** — Colaboradores, cargos, ponto eletrônico, faltas, controle de acesso
- **Estoque** — Produtos, categorias (com ícones personalizáveis), movimentações
- **Vendas** — Histórico e registro de vendas
- **Previsão** — Previsão de demanda com base em histórico e eventos externos
- **Alertas** — Notificações de estoque baixo, excesso e perdas
- **Tema escuro** — Alternância entre claro/escuro com persistência
