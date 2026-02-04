import React, { useState, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  Building2,
  Clock,
  Calendar,
  DollarSign,
  UserPlus,
  TrendingUp,
  LogOut,
  Menu,
  X,
} from 'lucide-react';

const NAVIGATION_ITEMS = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['super_admin', 'company_admin', 'manager', 'employee'] },
  { name: 'Employees', href: '/employees', icon: Users, roles: ['super_admin', 'company_admin', 'manager'] },
  { name: 'Organization', href: '/organization', icon: Building2, roles: ['super_admin', 'company_admin'] },
  { name: 'Attendance', href: '/attendance', icon: Clock, roles: ['super_admin', 'company_admin', 'manager', 'employee'] },
  { name: 'Leave Management', href: '/leaves', icon: Calendar, roles: ['super_admin', 'company_admin', 'manager', 'employee'] },
  { name: 'Payroll', href: '/payroll', icon: DollarSign, roles: ['super_admin', 'company_admin'] },
  { name: 'Recruitment', href: '/recruitment', icon: UserPlus, roles: ['super_admin', 'company_admin', 'manager'] },
  { name: 'Performance', href: '/performance', icon: TrendingUp, roles: ['super_admin', 'company_admin', 'manager'] },
];

const Layout = ({ children }) => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Memoize filtered nav to prevent unnecessary recalculations
  const filteredNavigation = useMemo(() => {
    return NAVIGATION_ITEMS.filter((item) => item.roles.includes(user?.role));
  }, [user?.role]);

  const activePageName = useMemo(() => {
    return NAVIGATION_ITEMS.find((item) => item.href === pathname)?.name || 'Dashboard';
  }, [pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans">
      {/* Sidebar */}
      <aside 
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } flex flex-col border-r border-slate-200 bg-white transition-all duration-300 ease-in-out`}
      >
        <div className="flex h-16 items-center justify-between border-b border-slate-200 px-4">
          {sidebarOpen && (
            <span className="text-xl font-bold tracking-tight text-indigo-700">
              Nexus HR
            </span>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="rounded-md p-2 hover:bg-slate-100 text-slate-500"
            aria-label="Toggle Sidebar"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {filteredNavigation.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon; // Correctly referencing the icon component
            
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon size={20} className={isActive ? 'text-indigo-600' : 'text-slate-400'} />
                {sidebarOpen && <span className="truncate">{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-slate-200 p-4">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut size={20} />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Header */}
        <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-8">
          <h2 className="text-lg font-semibold text-slate-800">
            {activePageName}
          </h2>
          
          <div className="flex items-center gap-4">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-semibold text-slate-900 leading-none">
                {user?.email?.split('@')[0]}
              </p>
              <p className="mt-1 text-xs font-medium text-slate-500 uppercase tracking-wider">
                {user?.role?.replace('_', ' ')}
              </p>
            </div>
            <div className="h-10 w-10 rounded-full bg-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-200">
              <span className="text-sm font-bold">
                {user?.email?.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
        </header>

        {/* Dynamic Content */}
        <main className="flex-1 overflow-y-auto p-8">
          <div className="mx-auto max-w-7xl text-slate-700">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;