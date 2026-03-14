// src/pages/hr/HRDashboard.jsx
import { useState, useEffect } from 'react';
import { employeeAPI, requestAPI, attendanceAPI } from '../../services/api';
import { StatCard, Badge, Spinner, Avatar, fmtDate, currency, Icon } from '../../components/common/index.jsx';
import { useAuth } from '../../context/AuthContext';

export default function HRDashboard() {
  const { user } = useAuth();
  const [stats,     setStats]     = useState({ employees: 0, pending: 0, todayPresent: 0 });
  const [pending,   setPending]   = useState([]);
  const [overview,  setOverview]  = useState([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [empRes, reqRes, attRes] = await Promise.allSettled([
          employeeAPI.getAll({ limit: 1 }),
          requestAPI.getPending({ limit: 5 }),
          attendanceAPI.getDailyOverview(),
        ]);
        if (empRes.status === 'fulfilled') setStats(p => ({ ...p, employees: empRes.value.data.total }));
        if (reqRes.status === 'fulfilled') {
          setPending(reqRes.value.data.data || []);
          setStats(p => ({ ...p, pending: reqRes.value.data.total }));
        }
        if (attRes.status === 'fulfilled') {
          setOverview(attRes.value.data.data || []);
          setStats(p => ({ ...p, todayPresent: attRes.value.data.count }));
        }
      } catch {}
      setLoading(false);
    };
    load();
  }, []);

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <div className="mb-24">
        <h2 className="page-title">HR Dashboard</h2>
        <p className="page-sub">Welcome back, {user?.firstName}. Here's today's overview.</p>
      </div>

      {/* Stats */}
      <div className="stat-grid mb-24">
        <StatCard icon="users"     label="Total Employees"   value={stats.employees}    color="var(--blue-600)"   bg="var(--blue-50)"   delay={0}/>
        <StatCard icon="trending"  label="Pending Requests"  value={stats.pending}      color="var(--amber-600)"  bg="var(--amber-50)"  delay={60}/>
        <StatCard icon="clock"     label="Present Today"     value={stats.todayPresent} color="var(--green-600)"  bg="var(--green-50)"  delay={120}/>
        <StatCard icon="award"     label="Your Role"         value="HR"                 color="var(--purple-600)" bg="var(--purple-50)" delay={180}/>
      </div>

      <div className="grid-2">
        {/* Pending Requests */}
        <div className="card">
          <div className="card-header">
            <span className="section-title">Pending Requests</span>
            <span style={{ fontSize: 12, color: 'var(--gray-400)' }}>{stats.pending} total</span>
          </div>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}><Spinner large/></div>
          ) : pending.length === 0 ? (
            <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--gray-400)', fontSize: 13 }}>
              No pending requests 🎉
            </div>
          ) : (
            pending.map(req => (
              <div key={req._id} className="flex items-center gap-12" style={{ padding: '12px 20px', borderBottom: '1px solid var(--gray-100)' }}>
                <Avatar name={`${req.requestedBy?.firstName} ${req.requestedBy?.lastName}`} size={34}/>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-900)' }}>
                    {req.requestedBy?.firstName} {req.requestedBy?.lastName}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>
                    {req.type} · {fmtDate(req.createdAt)}
                    {req.increment?.requestedSalary ? ` · ${currency(req.increment.requestedSalary)}` : ''}
                  </div>
                </div>
                <Badge label={req.status}/>
              </div>
            ))
          )}
        </div>

        {/* Today's Attendance */}
        <div className="card">
          <div className="card-header">
            <span className="section-title">Today's Check-ins</span>
            <span style={{ fontSize: 12, color: 'var(--gray-400)' }}>{overview.length} checked in</span>
          </div>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}><Spinner large/></div>
          ) : overview.length === 0 ? (
            <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--gray-400)', fontSize: 13 }}>
              No check-ins yet today
            </div>
          ) : (
            overview.slice(0, 7).map(att => (
              <div key={att._id} className="flex items-center gap-12" style={{ padding: '10px 20px', borderBottom: '1px solid var(--gray-100)' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: att.clockOut ? 'var(--gray-300)' : 'var(--green-500)', flexShrink: 0 }}/>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-900)' }}>
                    {att.employee?.firstName} {att.employee?.lastName}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>
                    In: {att.clockIn ? new Date(att.clockIn).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}
                    {att.clockOut ? ` · Out: ${new Date(att.clockOut).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}` : ' · Still working'}
                  </div>
                </div>
                <Badge label={att.status}/>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
