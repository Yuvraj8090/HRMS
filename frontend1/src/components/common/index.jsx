// src/components/common/index.jsx
import { useEffect } from 'react';

/* ── Icons ── */
const P = {
  home:     ['M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z','M9 22V12h6v10'],
  users:    ['M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2','M23 21v-2a4 4 0 0 0-3-3.87','M16 3.13a4 4 0 0 1 0 7.75'],
  user:     ['M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2','M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8'],
  clock:    ['M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20','M12 6v6l4 2'],
  briefcase:['M21 13.255A23.931 23.931 0 0 1 12 15c-3.183 0-6.22-.62-9-1.745','M16 6V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2','M22 8H2a1 1 0 0 0-1 1v9a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2V9a1 1 0 0 0-1-1'],
  trending: ['M23 6l-9.5 9.5-5-5L1 18'],
  check:    ['M20 6L9 17l-5-5'],
  x:        ['M18 6L6 18','M6 6l12 12'],
  building: ['M3 21h18','M9 21V7a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v14','M3 7h4v4H3z','M17 7h4v4h-4z'],
  layers:   ['M12 2L2 7l10 5 10-5-10-5','M2 17l10 5 10-5','M2 12l10 5 10-5'],
  calendar: ['M3 4h18v18H3z','M16 2v4','M8 2v4','M3 10h18'],
  logout:   ['M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4','M16 17l5-5-5-5','M21 12H9'],
  bell:     ['M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9','M13.73 21a2 2 0 0 1-3.46 0'],
  search:   ['M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z','M21 21l-4.35-4.35'],
  plus:     ['M12 5v14','M5 12h14'],
  edit:     ['M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7','M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z'],
  trash:    ['M3 6h18','M19 6l-1 14H6L5 6','M8 6V4h8v2'],
  eye:      ['M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z','M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6'],
  upload:   ['M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4','M17 8l-5-5-5 5','M12 3v12'],
  download: ['M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4','M7 10l5 5 5-5','M12 15V3'],
  dollar:   ['M12 2v20','M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6'],
  filter:   ['M22 3H2l8 9.46V19l4 2v-8.54L22 3'],
  refresh:  ['M23 4v6h-6','M1 20v-6h6','M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15'],
  award:    ['M12 15a7 7 0 1 0 0-14 7 7 0 0 0 0 14z','M8.21 13.89L7 23l5-3 5 3-1.21-9.12'],
  shield:   ['M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z'],
  info:     ['M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20','M12 16v-4','M12 8h.01'],
  pin:      ['M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z','M12 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6'],
  tag:      ['M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z','M7 7h.01'],
  doc:      ['M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z','M14 2v6h6','M16 13H8','M16 17H8','M10 9H8'],
};

export function Icon({ name, size = 18, color = 'currentColor', className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      className={`flex-shrink-0 ${className}`}>
      {(P[name] || []).map((d, i) => <path key={i} d={d} />)}
    </svg>
  );
}

/* ── Badge ── */
const BM = {
  Pending:'badge-amber','Under Review':'badge-blue',Approved:'badge-green',Rejected:'badge-red',
  Recommended:'badge-purple',Cancelled:'badge-gray',
  Active:'badge-green',Expiring:'badge-amber',Expired:'badge-red',Renewed:'badge-blue',
  Planning:'badge-blue','On Hold':'badge-amber',Completed:'badge-green',
  Critical:'badge-red',High:'badge-amber',Medium:'badge-blue',Low:'badge-gray',
  Admin:'badge-purple',HR:'badge-blue',Employee:'badge-gray',
  'Full-Time':'badge-green','Part-Time':'badge-amber',Contract:'badge-blue',Contractual:'badge-blue',
  Intern:'badge-purple',Deputation:'badge-purple',
  Present:'badge-green',Absent:'badge-red',Late:'badge-amber','On Leave':'badge-purple','Half-Day':'badge-blue',
  Draft:'badge-gray',Processed:'badge-blue',Paid:'badge-green',
  General:'badge-gray',Policy:'badge-blue',Holiday:'badge-green',Event:'badge-purple',Urgent:'badge-red',
  Junior:'badge-gray',Mid:'badge-blue',Senior:'badge-green',Lead:'badge-purple',Manager:'badge-amber',
};
export function Badge({ label }) {
  return <span className={`badge ${BM[label] || 'badge-gray'}`}>{label}</span>;
}

/* ── Spinner ── */
export function Spinner({ size = 'md' }) {
  const sz = { sm: 'w-4 h-4', md: 'w-5 h-5', lg: 'w-9 h-9 border-[3px]' };
  return <span className={`spinner ${sz[size] || sz.md}`} />;
}
export function PageSpinner() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-3 bg-gray-50">
      <Spinner size="lg" />
      <span className="text-sm text-gray-400">Loading…</span>
    </div>
  );
}

/* ── Avatar ── */
export function Avatar({ name = '', size = 8 }) {
  const init = name.trim().split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?';
  const px   = Math.round(size * 4 * 0.36);
  return (
    <div
      className="rounded-full bg-gradient-to-br from-primary-600 to-primary-400 flex items-center justify-center text-white font-bold flex-shrink-0"
      style={{ width: size * 4, height: size * 4, fontSize: px }}>
      {init}
    </div>
  );
}

/* ── Modal ── */
export function Modal({ title, onClose, children, footer, size = 'md' }) {
  useEffect(() => {
    const fn = e => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', fn);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', fn); document.body.style.overflow = ''; };
  }, [onClose]);
  return (
    <div className="modal-bg" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={`modal-box modal-${size}`}>
        <div className="modal-hd">
          <span className="section-title">{title}</span>
          <button onClick={onClose} className="btn-ghost btn p-1 rounded-lg btn-sm"><Icon name="x" size={18} /></button>
        </div>
        <div className="modal-bd">{children}</div>
        {footer && <div className="modal-ft">{footer}</div>}
      </div>
    </div>
  );
}

/* ── ConfirmDialog ── */
export function ConfirmDialog({ title, message, onConfirm, onCancel, danger }) {
  return (
    <Modal title={title} onClose={onCancel} size="sm"
      footer={
        <>
          <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
          <button className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm}>Confirm</button>
        </>
      }>
      <p className="text-sm text-gray-600">{message}</p>
    </Modal>
  );
}

/* ── StatCard ── */
export function StatCard({ icon, label, value, color = 'text-primary-600', bg = 'bg-primary-50', delay = 0 }) {
  return (
    <div className="card flex items-center gap-3.5 p-5 animate-slide-up" style={{ animationDelay: `${delay}ms` }}>
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${bg}`}>
        <Icon name={icon} size={20} className={color} />
      </div>
      <div>
        <div className="text-xs font-bold text-gray-400 uppercase tracking-wide">{label}</div>
        <div className="text-2xl font-extrabold text-gray-900 mt-0.5">{value ?? '—'}</div>
      </div>
    </div>
  );
}

/* ── EmptyState ── */
export function EmptyState({ icon = '📭', title, sub, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 px-8 text-center">
      <div className="text-4xl mb-3">{icon}</div>
      {title && <div className="text-sm font-bold text-gray-800 mb-1">{title}</div>}
      {sub   && <div className="text-sm text-gray-400">{sub}</div>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/* ── ProgressBar ── */
export function ProgressBar({ value = 0 }) {
  return (
    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
      <div
        className="h-full bg-gradient-to-r from-primary-600 to-primary-400 rounded-full transition-all duration-500"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

/* ── Skeleton ── */
export function Skeleton({ className = '' }) {
  return <div className={`animate-pulse bg-gray-200 rounded-lg ${className}`} />;
}

/* ── Format helpers ── */
export const fmt = {
  date:      d => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—',
  dateShort: d => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—',
  time:      d => d ? new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—',
  currency:  n => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0),
  hours:     (ci, co) => {
    if (!ci) return null;
    const ms = (co ? new Date(co) : new Date()) - new Date(ci);
    return (ms / 3600000).toFixed(1);
  },
  initials:  name => (name || '').trim().split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase(),
};
