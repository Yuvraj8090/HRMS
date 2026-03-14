// src/pages/admin/AdminDashboard.jsx
import { useState, useEffect } from 'react';
import { employeeAPI, requestAPI, attendanceAPI, projectAPI, departmentAPI } from '../../services/api';
import { StatCard, Badge, Avatar, Spinner, fmtDate, currency, Icon } from '../../components/common/index.jsx';
import { useAuth } from '../../context/AuthContext';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState({ employees: 0, pending: 0, present: 0, projects: 0, departments: 0 });
  const [recentEmps, setRecentEmps] = useState([]);
  const [pendingReqs, setPendingReqs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const results = await Promise.allSettled([
          employeeAPI.getAll({ limit: 6 }),
          requestAPI.getPending({ limit: 5 }),
          attendanceAPI.getDailyOverview(),
          projectAPI.getAll({ limit: 1 }),
          departmentAPI.getAll(),
        ]);

        if (results[0].status === 'fulfilled') {
          setData(p => ({ ...p, employees: results[0].value.data.total }));
          setRecentEmps(results[0].value.data.data || []);
        }
        if (results[1].status === 'fulfilled') {
          setData(p => ({ ...p, pending: results[1].value.data.total }));
          setPendingReqs(results[1].value.data.data?.slice(0,4) || []);
        }
        if (results[2].status === 'fulfilled') {
          setData(p => ({ ...p, present: results[2].value.data.count }));
        }
        if (results[3].status === 'fulfilled') {
          setData(p => ({ ...p, projects: results[3].value.data.total }));
        }
        if (results[4].status === 'fulfilled') {
          setData(p => ({ ...p, departments: (results[4].value.data.data || []).length }));
        }
      } catch {}
      setLoading(false);
    };
    load();
  }, []);

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      {/* Greeting Banner */}
      <div style={{
        background: 'linear-gradient(135deg, var(--blue-900) 0%, var(--blue-700) 50%, var(--blue-500) 100%)',
        borderRadius: 'var(--radius-xl)',
        padding: '28px 32px',
        color: 'white',
        marginBottom: 24,
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -30, right: -20, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }}/>
        <div style={{ position: 'absolute', bottom: -40, right: 80, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }}/>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: 12, opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>System Administrator</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800, marginBottom: 6 }}>Welcome back, {user?.firstName}</div>
          <div style={{ fontSize: 13, opacity: 0.7 }}>
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        </div>
      </div>

      {/* Stat Grid */}
      <div className="stat-grid mb-24">
        <StatCard icon="users"      label="Employees"    value={data.employees}   color="var(--blue-600)"   bg="var(--blue-50)"   delay={0}/>
        <StatCard icon="trending"   label="Pending"      value={data.pending}     color="var(--amber-600)"  bg="var(--amber-50)"  delay={60}/>
        <StatCard icon="clock"      label="Present Today"value={data.present}     color="var(--green-600)"  bg="var(--green-50)"  delay={120}/>
        <StatCard icon="briefcase"  label="Projects"     value={data.projects}    color="var(--purple-600)" bg="var(--purple-50)" delay={180}/>
        <StatCard icon="building"   label="Departments"  value={data.departments} color="var(--gray-600)"   bg="var(--gray-100)"  delay={240}/>
      </div>

      <div className="grid-2">
        {/* Recent Employees */}
        <div className="card">
          <div className="card-header">
            <span className="section-title">Recent Employees</span>
            <span style={{ fontSize: 12, color: 'var(--gray-400)' }}>Latest additions</span>
          </div>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}><Spinner large/></div>
          ) : recentEmps.map(emp => (
            <div key={emp._id} className="flex items-center gap-12" style={{ padding: '11px 20px', borderBottom: '1px solid var(--gray-100)' }}>
              <Avatar name={`${emp.user?.firstName} ${emp.user?.lastName}`} size={36}/>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, color: 'var(--gray-900)', fontSize: 13 }}>{emp.user?.firstName} {emp.user?.lastName}</div>
                <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>{emp.designation?.title || '—'} · {emp.department?.name || '—'}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 700, fontSize: 12 }}>{currency(emp.currentSalary)}</div>
                <div style={{ fontSize: 10, color: 'var(--gray-400)' }}>{fmtDate(emp.joiningDate)}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Pending Requests */}
        <div className="card">
          <div className="card-header">
            <span className="section-title">Pending Requests</span>
            <span style={{ fontSize: 12, color: 'var(--gray-400)' }}>{data.pending} awaiting</span>
          </div>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}><Spinner large/></div>
          ) : pendingReqs.length === 0 ? (
            <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--gray-400)', fontSize: 13 }}>No pending requests 🎉</div>
          ) : pendingReqs.map(req => (
            <div key={req._id} className="flex items-center gap-12" style={{ padding: '12px 20px', borderBottom: '1px solid var(--gray-100)' }}>
              <Avatar name={`${req.requestedBy?.firstName} ${req.requestedBy?.lastName}`} size={34}/>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, color: 'var(--gray-900)', fontSize: 13 }}>{req.requestedBy?.firstName} {req.requestedBy?.lastName}</div>
                <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>
                  {req.type} Request · {fmtDate(req.createdAt)}
                  {req.increment?.requestedSalary ? ` · ${currency(req.increment.requestedSalary)}` : ''}
                </div>
              </div>
              <Badge label={req.status}/>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
