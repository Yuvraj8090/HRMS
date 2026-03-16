// src/components/layout/AppLayout.jsx
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Icon } from '../common/index.jsx';

// Dynamic Title Map based on URL path segments
const ROUTE_TITLES = {
  dashboard: 'Dashboard',
  attendance: 'Attendance',
  projects: 'Projects',
  requests: 'Requests',
  employees: 'Employees',
  departments: 'Departments',
};

export default function AppLayout() {
  const location = useLocation();

  // Extract the last part of the URL path for the title (e.g., "/admin/dashboard" -> "dashboard")
  const pathSegment = location.pathname.split('/').pop();
  const title = ROUTE_TITLES[pathSegment] || 'HRMS';

  return (
    <div className="app-layout">
      {/* Sidebar now controls its own active state via the URL */}
      <Sidebar />
      
      <div className="main-content">
        <header className="topbar">
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, color: 'var(--gray-900)', letterSpacing: '-0.3px', textTransform: 'capitalize' }}>
            {title}
          </h1>
          <div className="flex items-center gap-12">
            <button style={{ background: 'none', border: 'none', color: 'var(--gray-400)', cursor: 'pointer', padding: 4 }}>
              <Icon name="bell" size={18}/>
            </button>
          </div>
        </header>
        
        <main className="page-content">
          {/* <Outlet /> is where React Router injects the matched child route component */}
          <Outlet />
        </main>
      </div>
    </div>
  );
}