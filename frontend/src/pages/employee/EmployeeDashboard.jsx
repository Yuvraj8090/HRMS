// src/pages/employee/EmployeeDashboard.jsx
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { attendanceAPI, projectAPI, requestAPI } from '../../services/api';
import {
  StatCard, Badge, Modal, EmptyState, ProgressBar,
  Icon, Spinner, currency, fmtDate, fmtTime, Avatar,
} from '../../components/common/index.jsx';

// ── Live Clock ────────────────────────────────────────────────────────────────
function useLiveClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return time;
}

// ── Attendance Widget ─────────────────────────────────────────────────────────
function AttendanceWidget() {
  const toast = useToast();
  const time  = useLiveClock();
  const [record,  setRecord]  = useState(null);
  const [loading, setLoading] = useState(true);
  const [acting,  setActing]  = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await attendanceAPI.getToday();
      setRecord(data.data);
    } catch { setRecord(null); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleClockIn = async () => {
    setActing(true);
    try {
      await attendanceAPI.clockIn({ workMode: 'Office' });
      toast.success('Clocked in! Have a productive day 🚀');
      load();
    } catch (e) { toast.error(e.message); }
    setActing(false);
  };

  const handleClockOut = async () => {
    setActing(true);
    try {
      await attendanceAPI.clockOut();
      toast.success('Clocked out. Great work today! 🎉');
      load();
    } catch (e) { toast.error(e.message); }
    setActing(false);
  };

  const hoursWorked = record?.clockIn
    ? ((( record.clockOut ? new Date(record.clockOut) : new Date()) - new Date(record.clockIn)) / 3600000).toFixed(1)
    : null;

  const hasIn  = !!record?.clockIn;
  const hasOut = !!record?.clockOut;

  return (
    <div className="attendance-widget">
      <div className="attendance-inner">
        {/* Top row */}
        <div className="flex justify-between items-start mb-16">
          <div>
            <div style={{ fontSize: 11, opacity: 0.7, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>
              Today's Attendance
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 800, letterSpacing: '-0.5px', lineHeight: 1 }}>
              {time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
            <div style={{ fontSize: 12, opacity: 0.65, marginTop: 4 }}>
              {time.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
          </div>
          {hoursWorked && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 10, opacity: 0.65, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {hasOut ? 'Total' : 'Live'}
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800 }}>{hoursWorked}h</div>
            </div>
          )}
        </div>

        {/* Time chips */}
        {hasIn && (
          <div className="flex gap-8 mb-16">
            <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 10, padding: '8px 14px' }}>
              <div style={{ fontSize: 10, opacity: 0.7 }}>Clock In</div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>{fmtTime(record.clockIn)}</div>
            </div>
            {hasOut && (
              <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 10, padding: '8px 14px' }}>
                <div style={{ fontSize: 10, opacity: 0.7 }}>Clock Out</div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{fmtTime(record.clockOut)}</div>
              </div>
            )}
          </div>
        )}

        {/* CTA */}
        {loading ? (
          <Spinner/>
        ) : hasOut ? (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'rgba(255,255,255,0.2)', borderRadius: 10, padding: '10px 18px', fontSize: 13, fontWeight: 700 }}>
            <Icon name="check" size={15}/> Day Complete
          </div>
        ) : hasIn ? (
          <button
            className="btn"
            onClick={handleClockOut}
            disabled={acting}
            style={{ background: 'rgba(255,255,255,0.95)', color: 'var(--red-600)', fontWeight: 700 }}
          >
            {acting ? <Spinner/> : <Icon name="x" size={15} color="var(--red-500)"/>}
            Clock Out
          </button>
        ) : (
          <button
            className="btn"
            onClick={handleClockIn}
            disabled={acting}
            style={{ background: 'var(--white)', color: 'var(--blue-700)', fontWeight: 700 }}
          >
            {acting ? <Spinner/> : <Icon name="clock" size={15} color="var(--blue-600)"/>}
            Clock In
          </button>
        )}
      </div>
    </div>
  );
}

// ── Project Card ──────────────────────────────────────────────────────────────
function ProjectCard({ project }) {
  return (
    <div className="card" style={{ cursor: 'pointer', transition: 'all 0.2s' }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-lg)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
    >
      <div className="card-body">
        <div className="flex justify-between items-start mb-8">
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{project.code}</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 800, color: 'var(--gray-900)', marginTop: 2 }}>{project.name}</div>
          </div>
          <Badge label={project.status}/>
        </div>
        {project.description && (
          <p style={{ fontSize: 12, color: 'var(--gray-500)', marginBottom: 12, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {project.description}
          </p>
        )}
        <div style={{ marginBottom: 10 }}>
          <div className="flex justify-between mb-4">
            <span style={{ fontSize: 11, color: 'var(--gray-400)' }}>Progress</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--gray-700)' }}>{project.completionPercentage ?? 0}%</span>
          </div>
          <ProgressBar value={project.completionPercentage ?? 0}/>
        </div>
        <div className="flex justify-between items-center">
          <Badge label={project.priority}/>
          {project.deadline && (
            <span style={{ fontSize: 11, color: 'var(--gray-400)' }}>Due {fmtDate(project.deadline)}</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Increment Modal ───────────────────────────────────────────────────────────
function IncrementModal({ onClose, currentSalary }) {
  const toast = useToast();
  const [form, setForm] = useState({ requestedSalary: '', requestNotes: '' });
  const [loading, setLoading] = useState(false);
  const [errors,  setErrors]  = useState({});

  const pct = form.requestedSalary && currentSalary
    ? (((Number(form.requestedSalary) - currentSalary) / currentSalary) * 100).toFixed(1)
    : null;

  const validate = () => {
    const e = {};
    if (!form.requestedSalary) e.requestedSalary = 'Please enter requested salary';
    else if (Number(form.requestedSalary) <= (currentSalary || 0)) e.requestedSalary = 'Must be higher than current salary';
    if (form.requestNotes.length < 20) e.requestNotes = 'Please provide at least 20 characters of justification';
    return e;
  };

  const submit = async () => {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      await requestAPI.submitIncrement({
        requestedSalary: Number(form.requestedSalary),
        requestNotes: form.requestNotes,
      });
      toast.success('Increment request submitted! HR will review it.');
      onClose();
    } catch (e) { toast.error(e.message); }
    setLoading(false);
  };

  return (
    <Modal
      title="Request Salary Increment"
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={submit} disabled={loading}>
            {loading ? <><Spinner/> Submitting…</> : 'Submit Request'}
          </button>
        </>
      }
    >
      {currentSalary && (
        <div style={{ background: 'var(--gray-50)', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius-md)', padding: '12px 16px', marginBottom: 18 }}>
          <div className="flex justify-between items-center">
            <span style={{ fontSize: 12, color: 'var(--gray-500)' }}>Current CTC</span>
            <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--gray-900)' }}>{currency(currentSalary)}</span>
          </div>
          {pct && (
            <div className="flex justify-between items-center" style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--gray-200)' }}>
              <span style={{ fontSize: 12, color: 'var(--gray-500)' }}>Requested increase</span>
              <span style={{ fontSize: 13, fontWeight: 800, color: Number(pct) > 0 ? 'var(--green-600)' : 'var(--red-600)' }}>
                {Number(pct) > 0 ? '+' : ''}{pct}%
              </span>
            </div>
          )}
        </div>
      )}

      <div className="form-group">
        <label className="form-label">Requested Annual CTC (₹) <span style={{ color: 'var(--red-500)' }}>*</span></label>
        <input
          type="number"
          value={form.requestedSalary}
          onChange={e => { setForm(p => ({ ...p, requestedSalary: e.target.value })); setErrors(p => ({ ...p, requestedSalary: '' })); }}
          placeholder="e.g. 1200000"
          className={`form-control ${errors.requestedSalary ? 'error' : ''}`}
        />
        {errors.requestedSalary && <div className="form-error">{errors.requestedSalary}</div>}
      </div>

      <div className="form-group">
        <label className="form-label">Justification <span style={{ color: 'var(--red-500)' }}>*</span></label>
        <textarea
          value={form.requestNotes}
          onChange={e => { setForm(p => ({ ...p, requestNotes: e.target.value })); setErrors(p => ({ ...p, requestNotes: '' })); }}
          placeholder="Describe your key achievements, contributions, and reasons for this increment request..."
          className={`form-control ${errors.requestNotes ? 'error' : ''}`}
          rows={5}
        />
        <div className="flex justify-between">
          {errors.requestNotes ? <div className="form-error">{errors.requestNotes}</div> : <span/>}
          <span style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 4 }}>{form.requestNotes.length}/2000</span>
        </div>
      </div>
    </Modal>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function EmployeeDashboard() {
  const { user } = useAuth();
  const [projects,     setProjects]     = useState([]);
  const [myRequests,   setMyRequests]   = useState([]);
  const [showModal,    setShowModal]    = useState(false);
  const [loadingProj,  setLoadingProj]  = useState(true);

  const load = useCallback(async () => {
    try {
      const [pRes, rRes] = await Promise.allSettled([
        projectAPI.getAll(),
        requestAPI.getMy({ type: 'Increment' }),
      ]);
      if (pRes.status === 'fulfilled') setProjects(pRes.value.data.data || []);
      if (rRes.status === 'fulfilled') setMyRequests(rRes.value.data.data || []);
    } catch {}
    setLoadingProj(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const hasPending   = myRequests.some(r => ['Pending','Under Review'].includes(r.status));
  const approvedReqs = myRequests.filter(r => r.status === 'Approved');
  const greeting     = () => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'; };

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      {/* Header */}
      <div className="flex justify-between items-start flex-wrap gap-16 mb-24">
        <div>
          <h2 className="page-title">{greeting()}, {user?.firstName} 👋</h2>
          <p className="page-sub">Here's your workspace for today.</p>
        </div>
        <button
          className={`btn ${hasPending ? 'btn-secondary' : 'btn-primary'}`}
          onClick={() => !hasPending && setShowModal(true)}
          disabled={hasPending}
          title={hasPending ? 'You already have a pending increment request' : ''}
        >
          <Icon name="trending" size={15}/>
          {hasPending ? 'Request Pending…' : 'Request Increment'}
        </button>
      </div>

      {/* Stats */}
      <div className="stat-grid mb-24">
        <StatCard icon="briefcase"  label="Assigned Projects"   value={projects.length}       color="var(--blue-600)"   bg="var(--blue-50)"   delay={0}/>
        <StatCard icon="trending"   label="Increment Requests"  value={myRequests.length}      color="var(--green-600)"  bg="var(--green-50)"  delay={60}/>
        <StatCard icon="check"      label="Approved"            value={approvedReqs.length}    color="var(--purple-600)" bg="var(--purple-50)" delay={120}/>
        <StatCard icon="award"      label="Role"                value={user?.role}             color="var(--amber-600)"  bg="var(--amber-50)"  delay={180}/>
      </div>

      {/* Two-column content */}
      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 24, alignItems: 'start' }}>
        {/* Left: Attendance + Requests */}
        <div className="flex-col gap-20" style={{ display: 'flex' }}>
          <AttendanceWidget/>

          {/* Recent Requests */}
          <div className="card">
            <div className="card-header">
              <span className="section-title">My Requests</span>
              <span style={{ fontSize: 12, color: 'var(--gray-400)' }}>{myRequests.length} total</span>
            </div>
            {myRequests.length === 0 ? (
              <div style={{ padding: '24px 20px', textAlign: 'center', color: 'var(--gray-400)', fontSize: 13 }}>
                No requests yet
              </div>
            ) : (
              <div>
                {myRequests.slice(0, 5).map(req => (
                  <div key={req._id} className="flex justify-between items-center" style={{ padding: '11px 20px', borderBottom: '1px solid var(--gray-100)' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-900)' }}>{req.type}</div>
                      <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 2 }}>{fmtDate(req.createdAt)}</div>
                    </div>
                    <Badge label={req.status}/>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Projects */}
        <div>
          <div className="flex justify-between items-center mb-16">
            <h3 className="section-title">Assigned Projects</h3>
            <span style={{ fontSize: 12, color: 'var(--gray-400)' }}>{projects.length} project{projects.length !== 1 ? 's' : ''}</span>
          </div>
          {loadingProj ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spinner large/></div>
          ) : projects.length === 0 ? (
            <div className="card"><EmptyState icon="📋" title="No projects assigned yet" sub="Your manager will assign projects soon."/></div>
          ) : (
            <div className="grid-auto">
              {projects.map(p => <ProjectCard key={p._id} project={p}/>)}
            </div>
          )}
        </div>
      </div>

      {showModal && <IncrementModal onClose={() => { setShowModal(false); load(); }} currentSalary={null}/>}
    </div>
  );
}
