// src/components/layout/Sidebar.jsx
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { Icon, Avatar } from '../common/index.jsx';

const NAV = {
  Admin: [
    { label: 'Overview', items: [
      { to: '/admin/dashboard',     icon: 'home',      label: 'Dashboard' },
    ]},
    { label: 'Organisation', items: [
      { to: '/admin/employees',     icon: 'users',     label: 'Employees' },
      { to: '/admin/departments',   icon: 'building',  label: 'Departments' },
      { to: '/admin/designations',  icon: 'tag',       label: 'Designations' },
      { to: '/admin/projects',      icon: 'briefcase', label: 'Projects' },
    ]},
    { label: 'HR Operations', items: [
      { to: '/admin/attendance',    icon: 'clock',     label: 'Attendance' },
      { to: '/admin/leaves',        icon: 'calendar',  label: 'Leave Management' },
      { to: '/admin/contracts',     icon: 'doc',       label: 'Contracts' },
      { to: '/admin/requests',      icon: 'trending',  label: 'Requests' },
    ]},
  ],
  HR: [
    { label: 'Overview', items: [
      { to: '/hr/dashboard',        icon: 'home',      label: 'Dashboard' },
    ]},
    { label: 'People', items: [
      { to: '/hr/employees',        icon: 'users',     label: 'Employees' },
      { to: '/hr/projects',         icon: 'briefcase', label: 'Projects' },
    ]},
    { label: 'HR Operations', items: [
      { to: '/hr/attendance',       icon: 'clock',     label: 'Attendance' },
      { to: '/hr/leaves',           icon: 'calendar',  label: 'Leave Management' },
      { to: '/hr/my-leaves',        icon: 'user',      label: 'My Leaves' },
      { to: '/hr/contracts',        icon: 'doc',       label: 'Contracts' },
      { to: '/hr/requests',         icon: 'trending',  label: 'Requests' },
    ]},
  ],
  Employee: [
    { label: 'My Workspace', items: [
      { to: '/employee/dashboard',  icon: 'home',      label: 'Dashboard' },
      { to: '/employee/attendance', icon: 'clock',     label: 'My Attendance' },
      { to: '/employee/leaves',     icon: 'calendar',  label: 'My Leaves' },
      { to: '/employee/requests',   icon: 'trending',  label: 'My Requests' },
      { to: '/employee/projects',   icon: 'briefcase', label: 'My Projects' },
    ]},
  ],
};

const roleColor = { Admin: 'text-purple-600 bg-purple-50', HR: 'text-primary-600 bg-primary-50', Employee: 'text-success-700 bg-success-50' };

export default function Sidebar() {
  const { user, role, logout } = useAuth();
  const sections = NAV[role] || [];

  return (
    <aside className="w-60 flex-shrink-0 fixed left-0 top-0 bottom-0 z-40 bg-white border-r border-gray-200 flex flex-col shadow-sm">
      {/* Brand */}
      <div className="px-4 py-4 border-b border-gray-100 flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-700 to-primary-500 flex items-center justify-center">
          <Icon name="shield" size={16} color="white" />
        </div>
        <span className="font-display text-lg font-800 text-gray-900">HRMS</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 overflow-y-auto space-y-5">
        {sections.map(sec => (
          <div key={sec.label}>
            <div className="text-[10px] font-700 text-gray-400 uppercase tracking-widest px-2 mb-1">{sec.label}</div>
            {sec.items.map(item => (
              <NavLink key={item.to} to={item.to}
                className={({ isActive }) => `sb-item mb-0.5 ${isActive ? 'active' : ''}`}>
                <Icon name={item.icon} size={15} />
                {item.label}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 py-3 border-t border-gray-100">
        <div className="flex items-center gap-2.5 px-2 py-2 mb-1">
          <Avatar name={`${user?.firstName} ${user?.lastName}`} size={8} />
          <div className="min-w-0">
            <div className="text-sm font-700 text-gray-900 truncate">{user?.firstName} {user?.lastName}</div>
            <span className={`text-[10px] font-700 px-2 py-0.5 rounded-full ${roleColor[role]}`}>{role}</span>
          </div>
        </div>
        <button className="sb-item text-danger-600 hover:bg-danger-50 hover:text-danger-700 w-full" onClick={logout}>
          <Icon name="logout" size={14} color="currentColor" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
