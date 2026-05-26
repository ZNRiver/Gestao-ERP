import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import RHColaboradores from './pages/RH/Colaboradores';
import RHPonto from './pages/RH/Ponto';
import RHFaltas from './pages/RH/Faltas';
import RHCargos from './pages/RH/Cargos';
import RHAcesso from './pages/RH/Acesso';
import EstoqueProdutos from './pages/Estoque/Produtos';
import EstoqueMovimentacoes from './pages/Estoque/Movimentacoes';
import CadFornecedores from './pages/Cadastros/Fornecedores';
import CadClientes from './pages/Cadastros/Clientes';
import VendasLista from './pages/Vendas/Lista';
import VendasNova from './pages/Vendas/Nova';
import PrevisaoDemanda from './pages/Previsao/Demanda';
import PainelTrabalhador from './pages/Trabalhador/Painel';
import Alertas from './pages/Alertas';
import { JSX } from 'react';

function PrivateRoute({ children }: { children: JSX.Element }) {
  const { profile, loading } = useAuth();
  if (loading) return <div className="flex h-screen items-center justify-center"><div className="animate-spin h-10 w-10 border-4 border-primary-500 border-t-transparent rounded-full" /></div>;
  return profile ? children : <Navigate to="/login" />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
          <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="rh/colaboradores" element={<RHColaboradores />} />
            <Route path="rh/ponto" element={<RHPonto />} />
            <Route path="rh/faltas" element={<RHFaltas />} />
            <Route path="rh/cargos" element={<RHCargos />} />
            <Route path="rh/acesso" element={<RHAcesso />} />
            <Route path="estoque/produtos" element={<EstoqueProdutos />} />
            <Route path="estoque/movimentacoes" element={<EstoqueMovimentacoes />} />
            <Route path="fornecedores" element={<CadFornecedores />} />
            <Route path="clientes" element={<CadClientes />} />
            <Route path="vendas" element={<VendasLista />} />
            <Route path="vendas/nova" element={<VendasNova />} />
            <Route path="previsao" element={<PrevisaoDemanda />} />
            <Route path="painel" element={<PainelTrabalhador />} />
            <Route path="alertas" element={<Alertas />} />
          </Route>
          </Routes>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}