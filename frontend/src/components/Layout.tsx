import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import {
  LayoutDashboard, Users, Clock, AlertTriangle, Briefcase, KeyRound,
  Package, ArrowRightLeft, ShoppingCart, PlusCircle,
  TrendingUp, Gauge, Bell, ChevronLeft, ChevronRight,
  LogOut, Menu, X, Building2, UserPlus, Truck,
  Sun, Moon
} from 'lucide-react';

interface NavItem { to: string; label: string; icon: React.ReactNode; roles: string[]; end?: boolean; }

const navSections: { title: string; items: NavItem[] }[] = [
  { title: 'Principal', items: [
    { to: '/', label: 'Dashboard', icon: <LayoutDashboard size={20} />, roles: ['admin', 'gerente', 'supervisor'], end: true },
    { to: '/painel', label: 'Meu Painel', icon: <Gauge size={20} />, roles: ['admin', 'gerente', 'supervisor', 'trabalhador'] },
    { to: '/alertas', label: 'Alertas', icon: <Bell size={20} />, roles: ['admin', 'gerente', 'supervisor', 'trabalhador'] },
  ]},
  { title: 'RH', items: [
    { to: '/rh/colaboradores', label: 'Colaboradores', icon: <Users size={20} />, roles: ['admin', 'gerente'] },
    { to: '/rh/ponto', label: 'Registro de Ponto', icon: <Clock size={20} />, roles: ['admin', 'gerente', 'supervisor'] },
    { to: '/rh/faltas', label: 'Faltas', icon: <AlertTriangle size={20} />, roles: ['admin', 'gerente', 'supervisor'] },
    { to: '/rh/cargos', label: 'Cargos', icon: <Briefcase size={20} />, roles: ['admin', 'gerente'] },
    { to: '/rh/acesso', label: 'Acessos', icon: <KeyRound size={20} />, roles: ['admin'] },
  ]},
  { title: 'Cadastros', items: [
    { to: '/fornecedores', label: 'Fornecedores', icon: <Truck size={20} />, roles: ['admin', 'gerente', 'supervisor'] },
    { to: '/clientes', label: 'Clientes', icon: <UserPlus size={20} />, roles: ['admin', 'gerente', 'supervisor'] },
  ]},
  { title: 'Estoque', items: [
    { to: '/estoque/produtos', label: 'Produtos', icon: <Package size={20} />, roles: ['admin', 'gerente', 'supervisor'] },
    { to: '/estoque/movimentacoes', label: 'Movimentações', icon: <ArrowRightLeft size={20} />, roles: ['admin', 'gerente', 'supervisor'] },
  ]},
  { title: 'Vendas', items: [
    { to: '/vendas', label: 'Histórico', icon: <ShoppingCart size={20} />, roles: ['admin', 'gerente', 'supervisor', 'trabalhador'], end: true },
    { to: '/vendas/nova', label: 'Nova Venda', icon: <PlusCircle size={20} />, roles: ['admin', 'gerente', 'supervisor', 'trabalhador'] },
  ]},
  { title: 'Inteligência', items: [
    { to: '/previsao', label: 'Previsão de Demanda', icon: <TrendingUp size={20} />, roles: ['admin', 'gerente'] },
  ]},
];

export default function Layout() {
  const { profile, signOut } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const userRole = profile?.role || 'trabalhador';

  const filteredSections = navSections.map(s => ({ ...s, items: s.items.filter(i => i.roles.includes(userRole)) })).filter(s => s.items.length > 0);

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all ${isActive ? 'bg-primary-50 text-primary-700 font-semibold' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'} ${collapsed ? 'justify-center px-2' : ''}`;

  const { dark, toggle: toggleTheme } = useTheme();
  const handleSignOut = () => { signOut(); navigate('/login'); };

  const sidebar = (
    <div className={`flex flex-col h-full bg-white border-r border-gray-200 transition-all duration-200 ${collapsed ? 'w-[68px]' : 'w-[250px]'}`}>
      <div className="flex items-center gap-3 px-4 h-16 border-b border-gray-100">
        <Building2 size={28} className="text-primary-600 shrink-0" />
        {!collapsed && <span className="font-bold text-lg text-gray-900">Gestão ERP</span>}
      </div>
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-6">
        {filteredSections.map((section, i) => (
          <div key={i}>
            {!collapsed && <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{section.title}</p>}
            <div className="space-y-0.5">
              {section.items.map(item => (
                <NavLink key={item.to} to={item.to} end={item.end} className={linkClass} onClick={() => setMobileOpen(false)}>
                  {item.icon}
                  {!collapsed && <span>{item.label}</span>}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>
      <div className="border-t border-gray-100 p-2">
        {!collapsed && (
          <div className="px-3 py-2 mb-2">
            <p className="text-sm font-medium text-gray-900 truncate">{profile?.nome}</p>
            <p className="text-xs text-gray-500 capitalize">{profile?.role}</p>
          </div>
        )}
        <button onClick={handleSignOut} className="flex items-center gap-3 w-full rounded-lg px-3 py-2.5 text-sm text-gray-600 hover:bg-gray-100 hover:text-danger-600">
          <LogOut size={20} /> {!collapsed && 'Sair'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="hidden md:flex flex-col">
        {sidebar}
        <button onClick={() => setCollapsed(!collapsed)} className="hidden md:flex items-center justify-center h-8 border-t border-gray-100 bg-white hover:bg-gray-50 text-gray-400">
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setMobileOpen(false)}>
          <div className="w-[250px] h-full" onClick={e => e.stopPropagation()}>{sidebar}</div>
        </div>
      )}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center gap-4 px-4 md:px-6 shrink-0">
          <button className="md:hidden btn-ghost p-2" onClick={() => setMobileOpen(true)}><Menu size={22} /></button>
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            <button onClick={toggleTheme} className="btn-ghost p-2" title={dark ? 'Modo claro' : 'Modo escuro'}>
              {dark ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <NavLink to="/alertas" className="relative btn-ghost p-2">
              <Bell size={20} />
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-danger-500 rounded-full border-2 border-white" />
            </NavLink>
            <div className="hidden sm:flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold text-sm">
                {profile?.nome?.charAt(0)?.toUpperCase()}
              </div>
              <span className="text-sm font-medium text-gray-700">{profile?.nome}</span>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6 animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  );
}