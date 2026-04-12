// src/components/layout/AppLayout.jsx
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import { Icon } from '../common/index.jsx';

const TITLES = {
  dashboard:'Dashboard', employees:'Employees', departments:'Departments',
  designations:'Designations', attendance:'Attendance', 'my-attendance':'My Attendance',
  leaves:'Leave Management', 'my-leaves':'My Leaves', contracts:'Contracts',
  requests:'Requests', 'my-requests':'My Requests', projects:'Projects', 'my-projects':'My Projects',
  payslips:'My Payslips',
};

export default function AppLayout() {
  const { pathname } = useLocation();
  const segment = pathname.split('/').pop();
  const title = TITLES[segment] || 'HRMS';

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="ml-60 flex-1 flex flex-col min-h-screen">
        {/* Topbar */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-7 h-[60px] flex items-center justify-between shadow-sm">
          <h1 className="font-display text-lg font-800 text-gray-900 tracking-tight">{title}</h1>
          <div className="flex items-center gap-3">
            <button className="btn-ghost btn-sm p-2 rounded-lg"><Icon name="bell" size={18} /></button>
          </div>
        </header>
        {/* Page content */}
        <main className="flex-1 p-7 animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
