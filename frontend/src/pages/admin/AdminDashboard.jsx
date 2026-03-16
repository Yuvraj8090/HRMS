import { useAuth } from '../../context/AuthContext';
import { useAdminDashboard } from './useAdminDashboard';
import { StatCard, Badge, Avatar, Spinner, fmtDate, currency } from '../../components/common/index.jsx';

// CRITICAL FIX: This is the default export that returns the actual JSX UI.
export default function AdminDashboard() {
  const { user } = useAuth();
  const { data, recentEmps, pendingReqs, loading, error } = useAdminDashboard();

  if (error) {
    return <div className="dashboard-error-state p-24 text-red-600">{error}</div>;
  }

  return (
    <div className="dashboard-container animate-fade-in">
      
      {/* Greeting Banner */}
      <header className="dashboard-banner">
        <div className="banner-decoration-top" />
        <div className="banner-decoration-bottom" />
        <div className="banner-content">
          <p className="banner-subtitle">System Administrator</p>
          <h1 className="banner-title">Welcome back, {user?.firstName || 'Admin'}</h1>
          <p className="banner-date">
            {new Date().toLocaleDateString('en-IN', { 
              weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' 
            })}
          </p>
        </div>
      </header>

      {/* Stat Grid */}
      <section className="stat-grid mb-24">
        <StatCard icon="users" label="Employees" value={data.employees} color="var(--blue-600)" bg="var(--blue-50)" delay={0} />
        <StatCard icon="trending" label="Pending" value={data.pending} color="var(--amber-600)" bg="var(--amber-50)" delay={60} />
        <StatCard icon="clock" label="Present Today" value={data.present} color="var(--green-600)" bg="var(--green-50)" delay={120} />
        <StatCard icon="briefcase" label="Projects" value={data.projects} color="var(--purple-600)" bg="var(--purple-50)" delay={180} />
        <StatCard icon="building" label="Departments" value={data.departments} color="var(--gray-600)" bg="var(--gray-100)" delay={240} />
      </section>

      <section className="grid-2">
        {/* Recent Employees */}
        <article className="card">
          <header className="card-header">
            <div>
                <h2 className="section-title">Recent Employees</h2>
                <span className="section-subtitle">Latest additions</span>
            </div>
          </header>
          
          <div className="card-body">
            {loading ? (
              <div className="flex-center p-32"><Spinner large data-testid="spinner" /></div>
            ) : recentEmps.length === 0 ? (
              <p className="empty-state">No recent employees found.</p>
            ) : (
              <ul className="list-group">
                {recentEmps.map(emp => (
                  <li key={emp._id} className="list-item">
                    <Avatar name={`${emp.user?.firstName} ${emp.user?.lastName}`} size={36} />
                    <div className="list-item-content">
                      <p className="item-title">{emp.user?.firstName} {emp.user?.lastName}</p>
                      <p className="item-meta">{emp.designation?.title || '—'} · {emp.department?.name || '—'}</p>
                    </div>
                    <div className="list-item-actions text-right">
                      <p className="item-value">{currency(emp.currentSalary)}</p>
                      <p className="item-meta">{fmtDate(emp.joiningDate)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </article>

        {/* Pending Requests */}
        <article className="card">
          <header className="card-header">
            <div>
                <h2 className="section-title">Pending Requests</h2>
                <span className="section-subtitle">{data.pending} awaiting</span>
            </div>
          </header>
          
          <div className="card-body">
            {loading ? (
              <div className="flex-center p-32"><Spinner large data-testid="spinner" /></div>
            ) : pendingReqs.length === 0 ? (
              <div className="empty-state p-32">No pending requests 🎉</div>
            ) : (
              <ul className="list-group">
                {pendingReqs.map(req => (
                  <li key={req._id} className="list-item">
                    <Avatar name={`${req.requestedBy?.firstName} ${req.requestedBy?.lastName}`} size={34} />
                    <div className="list-item-content">
                      <p className="item-title">{req.requestedBy?.firstName} {req.requestedBy?.lastName}</p>
                      <p className="item-meta">
                        {req.type} Request · {fmtDate(req.createdAt)}
                        {req.increment?.requestedSalary && ` · ${currency(req.increment.requestedSalary)}`}
                      </p>
                    </div>
                    <Badge label={req.status} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </article>
      </section>
    </div>
  );
}