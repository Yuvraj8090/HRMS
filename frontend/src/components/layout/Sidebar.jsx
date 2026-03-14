// src/components/layout/Sidebar.jsx
import { useAuth } from '../../context/AuthContext';
import { Icon } from '../common/index.jsx';

const NAV = {
  Admin: [
    { section: 'Overview', items: [
      { id: 'dashboard',   label: 'Dashboard',   icon: 'home' },
    ]},
    { section: 'Management', items: [
      { id: 'employees',   label: 'Employees',   icon: 'users' },
      { id: 'projects',    label: 'Projects',    icon: 'briefcase' },
      { id: 'departments', label: 'Departments', icon: 'building' },
    ]},
    { section: 'HR Ops', items: [
      { id: 'requests',    label: 'Requests',    icon: 'trending' },
      { id: 'attendance',  label: 'Attendance',  icon: 'clock' },
    ]},
  ],
  HR: [
    { section: 'Overview', items: [
      { id: 'dashboard',   label: 'Dashboard',   icon: 'home' },
    ]},
    { section: 'Management', items: [
      { id: 'employees',   label: 'Employees',   icon: 'users' },
      { id: 'projects',    label: 'Projects',    icon: 'briefcase' },
    ]},
    { section: 'HR Ops', items: [
      { id: 'requests',    label: 'Requests',    icon: 'trending' },
      { id: 'attendance',  label: 'Attendance',  icon: 'clock' },
    ]},
  ],
  Employee: [
    { section: 'My Workspace', items: [
      { id: 'dashboard',   label: 'Dashboard',   icon: 'home' },
      { id: 'attendance',  label: 'My Attendance',icon: 'clock' },
      { id: 'projects',    label: 'My Projects',  icon: 'briefcase' },
      { id: 'requests',    label: 'My Requests',  icon: 'trending' },
    ]},
  ],
};

const roleBadgeColor = { Admin: 'var(--purple-600)', HR: 'var(--blue-600)', Employee: 'var(--green-600)' };
const roleBadgeBg    = { Admin: 'var(--purple-50)',  HR: 'var(--blue-50)',   Employee: 'var(--green-50)' };

export default function Sidebar({ activePage, onNavigate }) {
  const { user, role, logout } = useAuth();
  const nav = NAV[role] || [];

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="brand-logo">
          <Icon name="layers" size={17} color="#fff"/>
        </div>
        <span className="brand-name">HRMS</span>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        {nav.map(({ section, items }) => (
          <div key={section} className="nav-section">
            <div className="nav-section-label">{section}</div>
            {items.map(({ id, label, icon }) => (
              <button
                key={id}
                className={`nav-item ${activePage === id ? 'active' : ''}`}
                onClick={() => onNavigate(id)}
              >
                <Icon name={icon} size={16}/>
                {label}
              </button>
            ))}
          </div>
        ))}
      </nav>

      {/* User Footer */}
      <div className="sidebar-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', marginBottom: 6 }}>
          <div className="avatar" style={{ width: 34, height: 34, fontSize: 12 }}>
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--gray-900)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.firstName} {user?.lastName}
            </div>
            <div style={{ display: 'inline-flex', alignItems: 'center', padding: '1px 7px', borderRadius: 'var(--radius-full)', fontSize: 10, fontWeight: 700, background: roleBadgeBg[role], color: roleBadgeColor[role], marginTop: 2 }}>
              {role}
            </div>
          </div>
        </div>
        <button className="nav-item" onClick={logout} style={{ color: 'var(--red-600)' }}>
          <Icon name="logout" size={15} color="var(--red-500)"/>
          Sign out
        </button>
      </div>
    </aside>
  );
}
