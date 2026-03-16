// src/components/common/index.jsx
// All reusable UI primitives in one file

import { useEffect } from 'react';

// ── SVG Icons ──────────────────────────────────────────────────────────────
export const Icon = ({ name, size = 18, color = 'currentColor' }) => {
  const paths = {
    home:      ['M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z', 'M9 22V12h6v10'],
    users:     ['M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2','M23 21v-2a4 4 0 0 0-3-3.87','M16 3.13a4 4 0 0 1 0 7.75'],
    user:      ['M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2','M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8'],
    clock:     ['M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20','M12 6v6l4 2'],
    briefcase: ['M21 13.255A23.931 23.931 0 0 1 12 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2','M22 8H2a1 1 0 0 0-1 1v9a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2V9a1 1 0 0 0-1-1'],
    trending:  ['M23 6l-9.5 9.5-5-5L1 18'],
    check:     ['M20 6L9 17l-5-5'],
    x:         ['M18 6L6 18','M6 6l12 12'],
    building:  ['M3 21h18','M9 21V7a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v14','M3 7h4v4H3z','M17 7h4v4h-4z'],
    layers:    ['M12 2L2 7l10 5 10-5-10-5','M2 17l10 5 10-5','M2 12l10 5 10-5'],
    calendar:  ['M3 4h18v18H3z','M16 2v4','M8 2v4','M3 10h18'],
    logout:    ['M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4','M16 17l5-5-5-5','M21 12H9'],
    bell:      ['M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9','M13.73 21a2 2 0 0 1-3.46 0'],
    search:    ['M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z','M21 21l-4.35-4.35'],
    plus:      ['M12 5v14','M5 12h14'],
    edit:      ['M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7','M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z'],
    trash:     ['M3 6h18','M19 6l-1 14H6L5 6','M8 6V4h8v2'],
    eye:       ['M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z','M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6'],
    filter:    ['M22 3H2l8 9.46V19l4 2v-8.54L22 3'],
    award:     ['M12 15a7 7 0 1 0 0-14 7 7 0 0 0 0 14z','M8.21 13.89L7 23l5-3 5 3-1.21-9.12'],
    grid:      ['M3 3h7v7H3z','M14 3h7v7h-7z','M14 14h7v7h-7z','M3 14h7v7H3z'],
    chart:     ['M18 20V10','M12 20V4','M6 20v-6'],
    mail:      ['M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z','M22 6l-10 7L2 6'],
  };
  const d = paths[name] || [];
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      style={{ flexShrink: 0 }}>
      {d.map((p, i) => <path key={i} d={p}/>)}
    </svg>
  );
};

// ── Badge ──────────────────────────────────────────────────────────────────
const badgeMap = {
  // Status
  'Pending':      'badge-amber',
  'Under Review': 'badge-blue',
  'Approved':     'badge-green',
  'Rejected':     'badge-red',
  // Project
  'Active':       'badge-green',
  'Planning':     'badge-blue',
  'On Hold':      'badge-amber',
  'Completed':    'badge-green',
  'Cancelled':    'badge-red',
  // Priority
  'Critical':     'badge-red',
  'High':         'badge-amber',
  'Medium':       'badge-blue',
  'Low':          'badge-gray',
  // Role
  'Admin':        'badge-purple',
  'HR':           'badge-blue',
  'Employee':     'badge-gray',
  // Employment
  'Full-Time':    'badge-green',
  'Part-Time':    'badge-amber',
  'Contract':     'badge-blue',
  'Intern':       'badge-purple',
  // Attendance
  'Present':      'badge-green',
  'Absent':       'badge-red',
  'Late':         'badge-amber',
  'On Leave':     'badge-purple',
  'Half-Day':     'badge-blue',
};

export const Badge = ({ label }) => (
  <span className={`badge ${badgeMap[label] || 'badge-gray'}`}>{label}</span>
);

// ── Spinner ────────────────────────────────────────────────────────────────
export const Spinner = ({ large }) => (
  <span className={`spinner${large ? ' spinner-lg' : ''}`}/>
);

export const PageSpinner = () => (
  <div className="spinner-page">
    <Spinner large />
    <p style={{ color: 'var(--gray-400)', fontSize: 13 }}>Loading…</p>
  </div>
);

// ── Skeleton ───────────────────────────────────────────────────────────────
export const Skeleton = ({ height = 20, width = '100%', style }) => (
  <div className="skeleton" style={{ height, width, ...style }}/>
);

// ── Modal ──────────────────────────────────────────────────────────────────
export const Modal = ({ title, onClose, children, footer, wide }) => {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-box" style={{ maxWidth: wide ? 680 : 500 }}>
        <div className="modal-header">
          <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--gray-900)' }}>{title}</span>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
};

// ── Stat Card ──────────────────────────────────────────────────────────────
export const StatCard = ({ icon, label, value, color = 'var(--blue-600)', bg = 'var(--blue-50)', delay = 0 }) => (
  <div className="stat-card" style={{ animationDelay: `${delay}ms` }}>
    <div className="stat-icon" style={{ background: bg, color }}>
      <Icon name={icon} size={20} color={color} />
    </div>
    <div>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value ?? '—'}</div>
    </div>
  </div>
);

// ── Confirm Dialog ─────────────────────────────────────────────────────────
export const ConfirmDialog = ({ title, message, onConfirm, onCancel, danger }) => (
  <Modal title={title} onClose={onCancel}
    footer={
      <>
        <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
        <button className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm}>
          Confirm
        </button>
      </>
    }
  >
    <p style={{ color: 'var(--gray-600)', fontSize: 14 }}>{message}</p>
  </Modal>
);

// ── Empty State ────────────────────────────────────────────────────────────
export const EmptyState = ({ icon = '📭', title, sub, action }) => (
  <div className="empty-state">
    <div className="empty-icon">{icon}</div>
    <div className="empty-title">{title}</div>
    <div className="empty-sub">{sub}</div>
    {action && <div style={{ marginTop: 20 }}>{action}</div>}
  </div>
);

// ── Progress Bar ───────────────────────────────────────────────────────────
export const ProgressBar = ({ value = 0 }) => (
  <div className="progress-track">
    <div className="progress-fill" style={{ width: `${Math.min(100, value)}%` }}/>
  </div>
);

// ── Avatar ─────────────────────────────────────────────────────────────────
export const Avatar = ({ name = 'User', size = 40, src = null }) => {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // Deterministic color based on name string
  const colors = [
    '#2563eb', '#7c3aed', '#db2777', '#dc2626', 
    '#ea580c', '#ca8a04', '#16a34a', '#0891b2'
  ];
  const colorIndex = name.length % colors.length;
  const bgColor = colors[colorIndex];

  const style = {
    width: size,
    height: size,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: size * 0.4,
    fontWeight: 700,
    color: '#fff',
    backgroundColor: bgColor,
    flexShrink: 0,
    overflow: 'hidden',
    border: '2px solid #fff',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  };

  if (src) {
    return <img src={src} alt={name} style={style} />;
  }

  return <div style={style}>{initials}</div>;
};

// ── Currency formatter ─────────────────────────────────────────────────────
export const currency = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);

// ── Date formatter ─────────────────────────────────────────────────────────
export const fmtDate  = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
export const fmtTime  = (d) => d ? new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—';
export const fmtShort = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—';
