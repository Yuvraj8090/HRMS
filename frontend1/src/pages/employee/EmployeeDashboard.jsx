// src/pages/employee/EmployeeDashboard.jsx
import { useState, useEffect } from 'react';
import { attendAPI, leaveAPI, projectAPI } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { StatCard, Badge, Spinner, ProgressBar, fmt } from '../../components/common/index.jsx';

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const [today, setToday]     = useState(null);
  const [balance, setBalance] = useState([]);
  const [leaves, setLeaves]   = useState([]);
  const [projects,setProjects]= useState([]);
  const [time, setTime]       = useState(new Date());

  useEffect(() => { const t = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(t); }, []);

  useEffect(() => {
    Promise.allSettled([
      attendAPI.getToday(), leaveAPI.getMyBalance({}), leaveAPI.getMyLeaves({ limit: 3 }), projectAPI.getAll(),
    ]).then(([t, b, l, p]) => {
      if (t.status==='fulfilled') setToday(t.value.data.data);
      if (b.status==='fulfilled') setBalance(b.value.data.data||[]);
      if (l.status==='fulfilled') setLeaves(l.value.data.data||[]);
      if (p.status==='fulfilled') setProjects(p.value.data.data||[]);
    });
  }, []);

  const hours = today ? fmt.hours(today.clockIn, today.clockOut) : null;

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="rounded-2xl bg-gradient-to-r from-primary-800 to-primary-600 p-6 text-white">
        <p className="text-primary-200 text-xs font-700 uppercase tracking-widest mb-1">{user?.position || user?.role}</p>
        <h2 className="font-display text-2xl font-800">Good {time.getHours()<12?'morning':time.getHours()<17?'afternoon':'evening'}, {user?.firstName}!</h2>
        <p className="text-primary-300 text-4xl font-display font-800 mt-3 tabular-nums">{time.toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}</p>
        <p className="text-primary-300 text-sm">{time.toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long'})}</p>
        {today ? (
          <div className="mt-3 inline-flex items-center gap-2 bg-white/15 rounded-full px-4 py-1.5 text-sm">
            <span className="w-2 h-2 bg-success-400 rounded-full animate-pulse" />
            Clocked in at {fmt.time(today.clockIn)}{today.clockOut?` · Out at ${fmt.time(today.clockOut)}`:''}
          </div>
        ) : (
          <div className="mt-3 inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 text-sm opacity-80">Not clocked in yet</div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon="clock"    label="Hours Today"  value={hours ? `${hours}h` : '—'} color="text-primary-600" bg="bg-primary-50" />
        <StatCard icon="calendar" label="Leave Balance" value={balance.find(b=>b.categoryCode==='CL')?.currentBalance??'—'} color="text-success-700" bg="bg-success-50" delay={50} />
        <StatCard icon="briefcase"label="Projects"      value={projects.length} color="text-purple-600" bg="bg-purple-50" delay={100} />
        <StatCard icon="doc"      label="Pending Leaves"value={leaves.filter(l=>l.status==='Pending').length} color="text-warning-600" bg="bg-warning-50" delay={150} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Leave Balance */}
        <div className="card">
          <div className="card-hd"><span className="section-title">Leave Balance ({new Date().getFullYear()})</span></div>
          <div className="card-bd space-y-3">
            {balance.length === 0 ? <p className="text-sm text-gray-400">No leave allocations yet.</p>
            : balance.map(b => (
              <div key={b._id}>
                <div className="flex justify-between items-center mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-700 bg-gray-100 px-2 py-0.5 rounded">{b.categoryCode}</span>
                    <span className="text-xs text-gray-500">{b.leaveCategory?.name}</span>
                  </div>
                  <span className="text-sm font-800 text-gray-900">{b.currentBalance} <span className="text-xs text-gray-400">/ {b.totalBalance}</span></span>
                </div>
                <ProgressBar value={b.totalBalance > 0 ? (b.currentBalance / b.totalBalance) * 100 : 0} />
              </div>
            ))}
          </div>
        </div>

        {/* Recent Leaves */}
        <div className="card">
          <div className="card-hd"><span className="section-title">Recent Leaves</span></div>
          {leaves.length === 0 ? <div className="py-8 text-center text-sm text-gray-400">No leave applications yet.</div>
          : leaves.map(l => (
            <div key={l._id} className="flex items-center gap-3 px-5 py-3 border-b border-gray-100 last:border-0">
              <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600 text-xs font-800">{l.categoryCode}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-700">{l.numberOfDays} day{l.numberOfDays!==1?'s':''} — {l.leaveCategory?.name}</p>
                <p className="text-xs text-gray-400">{fmt.date(l.fromDate)} → {fmt.date(l.toDate)}</p>
              </div>
              <Badge label={l.status} />
            </div>
          ))}
        </div>
      </div>

      {/* Projects */}
      {projects.length > 0 && (
        <div>
          <h3 className="section-title mb-3">My Projects</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.slice(0,4).map(p => (
              <div key={p._id} className="card p-4 hover:shadow-md transition-all">
                <div className="flex justify-between items-start mb-2">
                  <div><div className="text-xs text-gray-400 font-700">{p.code}</div><div className="font-800 text-gray-900">{p.name}</div></div>
                  <Badge label={p.status} />
                </div>
                <div className="flex justify-between text-xs text-gray-400 mb-1.5">
                  <span>Progress</span><span className="font-700">{p.completionPercentage}%</span>
                </div>
                <ProgressBar value={p.completionPercentage} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
