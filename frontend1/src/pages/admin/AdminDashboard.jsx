// src/pages/admin/AdminDashboard.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { empAPI, leaveAPI, contractAPI, attendAPI } from '../../services/api.js';
import { StatCard, Badge, Avatar, Spinner, fmt } from '../../components/common/index.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats,    setStats]    = useState({});
  const [leaves,   setLeaves]   = useState([]);
  const [expiring, setExpiring] = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    Promise.allSettled([
      empAPI.getStats(),
      leaveAPI.getAll({ status: 'Pending', limit: 5 }),
      contractAPI.getAll({ status: 'Expiring', limit: 5 }),
      leaveAPI.getStats(),
    ]).then(([s, l, c, ls]) => {
      if (s.status === 'fulfilled')  setStats({ ...s.value.data.data, ...ls.value?.data?.data });
      if (l.status === 'fulfilled')  setLeaves(l.value.data.data || []);
      if (c.status === 'fulfilled')  setExpiring(c.value.data.data || []);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="flex justify-center pt-20"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="rounded-2xl bg-gradient-to-r from-primary-900 via-primary-800 to-primary-700 p-7 text-white relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/5" />
        <div className="absolute bottom-0 right-20 w-28 h-28 rounded-full bg-white/5" />
        <p className="text-primary-200 text-xs font-700 uppercase tracking-widest mb-1">System Administrator</p>
        <h2 className="font-display text-3xl font-800 tracking-tight">Welcome back, {user?.firstName}!</h2>
        <p className="text-primary-300 text-sm mt-1">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
        <div className="flex gap-2 mt-4 flex-wrap">
          {[['Employees', '/admin/employees'], ['Leaves', '/admin/leaves'], ['Contracts', '/admin/contracts']].map(([l, to]) => (
            <button key={to} onClick={() => navigate(to)}
              className="text-xs font-700 px-4 py-1.5 bg-white/15 hover:bg-white/25 rounded-full border border-white/20 transition-all">
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon="users"    label="Total Staff"   value={stats.active ?? '—'} color="text-primary-600" bg="bg-primary-50" />
        <StatCard icon="calendar" label="Pending Leaves" value={stats.pending ?? '—'} color="text-warning-600" bg="bg-warning-50" delay={50} />
        <StatCard icon="doc"      label="Expiring Contracts" value={expiring.length} color="text-danger-600" bg="bg-danger-50" delay={100} />
        <StatCard icon="trending" label="Approved Leaves (YTD)" value={stats.approved ?? '—'} color="text-success-700" bg="bg-success-50" delay={150} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Pending Leaves */}
        <div className="card">
          <div className="card-hd">
            <span className="section-title">Pending Leave Requests</span>
            <button className="text-xs text-primary-600 font-700 hover:underline" onClick={() => navigate('/admin/leaves')}>View all →</button>
          </div>
          {leaves.length === 0 ? (
            <div className="py-10 text-center text-sm text-gray-400">No pending leaves 🎉</div>
          ) : leaves.map(l => (
            <div key={l._id} className="flex items-center gap-3 px-5 py-3 border-b border-gray-100 last:border-0">
              <Avatar name={`${l.applicant?.firstName} ${l.applicant?.lastName}`} size={8} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-700 text-gray-900 truncate">{l.applicant?.firstName} {l.applicant?.lastName}</p>
                <p className="text-xs text-gray-400">{l.categoryCode} · {l.numberOfDays} day(s) · {fmt.date(l.fromDate)}</p>
              </div>
              <Badge label={l.status} />
            </div>
          ))}
        </div>

        {/* Expiring Contracts */}
        <div className="card">
          <div className="card-hd">
            <span className="section-title">Expiring Contracts</span>
            <button className="text-xs text-primary-600 font-700 hover:underline" onClick={() => navigate('/admin/contracts')}>View all →</button>
          </div>
          {expiring.length === 0 ? (
            <div className="py-10 text-center text-sm text-gray-400">No expiring contracts</div>
          ) : expiring.map(c => (
            <div key={c._id} className="flex items-center gap-3 px-5 py-3 border-b border-gray-100 last:border-0">
              <Avatar name={`${c.employee?.firstName} ${c.employee?.lastName}`} size={8} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-700 text-gray-900 truncate">{c.employee?.firstName} {c.employee?.lastName}</p>
                <p className="text-xs text-gray-400">Expires {fmt.date(c.endDate)} · {c.daysUntilExpiry} days left</p>
              </div>
              <Badge label={c.status} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
