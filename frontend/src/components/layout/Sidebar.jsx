import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Icon, Avatar } from '../common/index.jsx';

// ── Navigation Configuration (Domain-Driven Sections) ─────────────────────────
const NAV = {
  Admin: [
    { section: 'Overview', items: [
      { id: 'dashboard',    label: 'Dashboard',    icon: 'home' },
    ]},
    { section: 'Management', items: [
      { id: 'employees',    label: 'Employees',    icon: 'users' },
      { id: 'projects',     label: 'Projects',     icon: 'briefcase' },
      { id: 'departments',  label: 'Departments',  icon: 'building' },
      { id: 'designations', label: 'Designations', icon: 'award' }, // <-- NEW: Added Designations
      { id: 'contracts',    label: 'Contracts',    icon: 'layers' },
    ]},
    { section: 'HR Ops', items: [
      { id: 'requests',     label: 'Appraisals',   icon: 'trending' },
      { id: 'attendance',   label: 'Attendance',   icon: 'clock' },
      { id: 'leaves',       label: 'Manage Leaves',icon: 'calendar' },
    ]},
  ],
  HR: [
    { section: 'Overview', items: [
      { id: 'dashboard',    label: 'Dashboard',    icon: 'home' },
    ]},
    { section: 'Management', items: [
      { id: 'employees',    label: 'Employees',    icon: 'users' },
      { id: 'projects',     label: 'Projects',     icon: 'briefcase' },
      { id: 'contracts',    label: 'Contracts',    icon: 'layers' },
    ]},
    { section: 'HR Ops', items: [
      { id: 'requests',     label: 'Appraisals',   icon: 'trending' },
      { id: 'attendance',   label: 'Attendance',   icon: 'clock' },
      { id: 'leaves',       label: 'Manage Leaves',icon: 'calendar' },
    ]},
  ],
  Employee: [
    { section: 'My Workspace', items: [
      { id: 'dashboard',    label: 'Dashboard',    icon: 'home' },
      { id: 'attendance',   label: 'My Attendance',icon: 'clock' },
      { id: 'projects',     label: 'My Projects',  icon: 'briefcase' },
      { id: 'requests',     label: 'My Appraisals',icon: 'trending' },
      { id: 'leaves/apply', label: 'Apply Leave',  icon: 'calendar' },
    ]},
  ],
};

const roleBadgeColor = { Admin: 'var(--purple-600)', HR: 'var(--blue-600)', Employee: 'var(--green-600)' };
const roleBadgeBg    = { Admin: 'var(--purple-50)',  HR: 'var(--blue-50)',   Employee: 'var(--green-50)' };

export default function Sidebar() {
  const { user, role, logout } = useAuth();
  
  // Guard against undefined roles during initial load
  const nav = role && NAV[role] ? NAV[role] : [];
  
  // Construct the base path dynamically
  const basePath = role ? `/${role.toLowerCase()}` : '';

  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div className="sidebar-brand">
        <div className="brand-logo">
          <Icon name="layers" size={17} color="#fff"/>
        </div>
        <span className="brand-name">U-Prepare HRMS</span>
      </div>

      {/* Navigation Links */}
      <nav className="sidebar-nav">
        {nav.map(({ section, items }) => (
          <div key={section} className="nav-section">
            <div className="nav-section-label">{section}</div>
            {items.map(({ id, label, icon }) => (
              <NavLink
                key={id}
                to={`${basePath}/${id}`}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              >
                <Icon name={icon} size={16}/>
                {label}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* User Session Footer */}
      <div className="sidebar-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 10px', marginBottom: 8 }}>
          {/* Integration: Using our deterministic common Avatar component */}
          <Avatar 
            name={`${user?.firstName || 'User'} ${user?.lastName || ''}`} 
            size={36} 
          />
          
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ 
              fontSize: 13, 
              fontWeight: 700, 
              color: 'var(--gray-900)', 
              whiteSpace: 'nowrap', 
              overflow: 'hidden', 
              textOverflow: 'ellipsis' 
            }}>
              {user?.firstName} {user?.lastName}
            </div>
            
            {role && (
              <div style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                padding: '2px 8px', 
                borderRadius: 'var(--radius-full)', 
                fontSize: 10, 
                fontWeight: 800, 
                background: roleBadgeBg[role], 
                color: roleBadgeColor[role], 
                marginTop: 4,
                textTransform: 'uppercase'
              }}>
                {role}
              </div>
            )}
          </div>
        </div>

        <button 
          className="nav-item logout-btn" 
          onClick={logout} 
          style={{ 
            color: 'var(--red-600)', 
            width: '100%', 
            border: 'none', 
            background: 'none', 
            textAlign: 'left',
            cursor: 'pointer'
          }}
        >
          <Icon name="logout" size={15} color="var(--red-500)"/>
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
}