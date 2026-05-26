import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

// Middleware
import { errorHandler } from './middleware/errorHandler.js';
import { optionalAuth } from './middleware/auth.js';

// Routes
import authRoutes from './routes/auth.js';
import dashboardRoutes from './routes/dashboard.js';
import rhRoutes from './routes/rh.js';
import pontoRoutes from './routes/ponto.js';
import estoqueRoutes from './routes/estoque.js';
import vendasRoutes from './routes/vendas.js';
import previsaoRoutes from './routes/previsao.js';
import alertasRoutes from './routes/alertas.js';
import funcoesRoutes from './routes/funcoes.js';
import fornecedoresRoutes from './routes/fornecedores.js';
import clientesRoutes from './routes/clientes.js';
import { previsaoService } from './services/previsaoService.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

// ============================================================
// Middleware Global
// ============================================================
app.use(cors({ origin: CORS_ORIGIN, credentials: true }));
app.use(express.json({ limit: '5mb' }));
app.use(optionalAuth);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Muitas requisições. Tente novamente mais tarde.' },
});
app.use('/api/', limiter);

// ============================================================
// Rotas
// ============================================================
app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'ERP Backend API - Online', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/rh', rhRoutes);
app.use('/api/rh', pontoRoutes);
app.use('/api/estoque', estoqueRoutes);
app.use('/api/vendas', vendasRoutes);
app.use('/api/previsao', previsaoRoutes);
app.use('/api/alertas', alertasRoutes);
app.use('/api', funcoesRoutes);
app.use('/api/fornecedores', fornecedoresRoutes);
app.use('/api/clientes', clientesRoutes);

// ============================================================
// Error handler (deve ser o último middleware)
// ============================================================
app.use(errorHandler);

// ============================================================
// Inicialização
// ============================================================
app.listen(PORT, () => {
  console.log('');
  console.log('╔══════════════════════════════════════════╗');
  console.log('║  🏢  ERP Backend API                     ║');
  console.log(`║  🚀  Rodando em http://localhost:${PORT}    ║`);
  console.log('║  📋  Health:  /api/health               ║');
  console.log('║  🔐  Auth:    /api/auth/*                ║');
  console.log('║  📊  Dash:    /api/dashboard             ║');
  console.log('║  👥  RH:      /api/rh/*                  ║');
  console.log('║  📦  Estoque: /api/estoque/*             ║');
  console.log('║  💰  Vendas:  /api/vendas/*              ║');
  console.log('║  🧠  Previsão:/api/previsao/*            ║');
  console.log('║  🔔  Alertas: /api/alertas/*             ║');
  console.log('╚══════════════════════════════════════════╝');
  console.log('');

  // Inicia análise preditiva em background para todos os produtos e calendário
  previsaoService.analisarTodosBackground().catch((err: any) =>
    console.error('[Previsao] Erro na análise inicial:', err.message)
  );
});

export default app;