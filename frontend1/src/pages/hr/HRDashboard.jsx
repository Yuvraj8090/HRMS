// src/pages/hr/HRDashboard.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { empAPI, leaveAPI, contractAPI, attendAPI } from '../../services/api.js';
import { StatCard, Badge, Avatar, Spinner, fmt } from '../../components/common/index.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

export default function HRDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({});
  const [pendingLeaves, setPending] = useState([]);
  const [todayAtt, setTodayAtt] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      empAPI.getStats(), leaveAPI.getStats(),
      leaveAPI.getAll({ status: 'Pending', limit: 5 }),
      attendAPI.getOverview(),
    ]).then(([s, ls, l, a]) => {
      if (s.status === 'fulfilled')  setStats({ ...s.value.data.data, ...ls.value?.data?.data });
      if (l.status === 'fulfilled')  setPending(l.value.data.data || []);
      if (a.status === 'fulfilled')  setTodayAtt(a.value.data.data || []);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="flex justify-center pt-20"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-gradient-to-r from-primary-800 to-primary-600 p-6 text-white">
        <p className="text-primary-200 text-xs font-700 uppercase tracking-widest mb-1">HR Manager</p>
        <h2 className="font-display text-2xl font-800">Hello, {user?.firstName}!</h2>
        <p className="text-primary-300 text-sm mt-0.5">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon="users"    label="Active Staff"    value={stats.active    ?? '—'} color="text-primary-600" bg="bg-primary-50" />
        <StatCard icon="calendar" label="Pending Leaves"  value={stats.pending   ?? '—'} color="text-warning-600" bg="bg-warning-50" delay={50} />
        <StatCard icon="clock"    label="Present Today"   value={todayAtt.length} color="text-success-700" bg="bg-success-50" delay={100} />
        <StatCard icon="doc"      label="Expiring Soon"   value={stats.expiring  ?? '—'} color="text-danger-600" bg="bg-danger-50" delay={150} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card">
          <div className="card-hd"><span className="section-title">Pending Leaves</span><button className="text-xs text-primary-600 font-700" onClick={() => navigate('/hr/leaves')}>View all →</button></div>
          {pendingLeaves.length === 0 ? <div className="py-8 text-center text-sm text-gray-400">All clear! No pending leaves 🎉</div>
          : pendingLeaves.map(l => (
            <div key={l._id} className="flex items-center gap-3 px-5 py-3 border-b border-gray-100 last:border-0">
              <Avatar name={`${l.applicant?.firstName} ${l.applicant?.lastName}`} size={8} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-700 text-gray-900 truncate">{l.applicant?.firstName} {l.applicant?.lastName}</p>
                <p className="text-xs text-gray-400">{l.categoryCode} · {l.numberOfDays} day(s) · From {fmt.date(l.fromDate)}</p>
              </div>
              <Badge label={l.status} />
            </div>
          ))}
        </div>
        <div className="card">
          <div className="card-hd"><span className="section-title">Today's Attendance</span><button className="text-xs text-primary-600 font-700" onClick={() => navigate('/hr/attendance')}>View all →</button></div>
          {todayAtt.length === 0 ? <div className="py-8 text-center text-sm text-gray-400">No check-ins yet today</div>
          : todayAtt.slice(0, 5).map(a => (
            <div key={a._id} className="flex items-center gap-3 px-5 py-3 border-b border-gray-100 last:border-0">
              <Avatar name={`${a.employee?.firstName} ${a.employee?.lastName}`} size={8} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-700 truncate">{a.employee?.firstName} {a.employee?.lastName}</p>
                <p className="text-xs text-gray-400">In: {fmt.time(a.clockIn)}{a.clockOut ? ` · Out: ${fmt.time(a.clockOut)}` : ' · Still in'}</p>
              </div>
              <Badge label={a.status} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
