// src/pages/hr/AttendanceOverview.jsx
import { useState, useEffect } from 'react';
import { attendanceAPI } from '../../services/api';
import { Badge, Spinner, EmptyState, Avatar, Icon } from '../../components/common/index.jsx';

export default function AttendanceOverview() {
  const [records,  setRecords]  = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await attendanceAPI.getDailyOverview();
        setRecords(data.data || []);
      } catch { setRecords([]); }
      setLoading(false);
    };
    load();
  }, []);

  const formatTime = (d) => d ? new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—';
  const hours = (r) => r.clockIn && r.clockOut
    ? ((new Date(r.clockOut) - new Date(r.clockIn)) / 3600000).toFixed(1)
    : r.clockIn ? ((new Date() - new Date(r.clockIn)) / 3600000).toFixed(1) : null;

  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <div className="mb-24">
        <h2 className="page-title">Today's Attendance</h2>
        <p className="page-sub">{today}</p>
      </div>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Present',   count: records.filter(r=>r.status==='Present').length,   color: 'var(--green-600)', bg: 'var(--green-50)' },
          { label: 'Still In',  count: records.filter(r=>r.clockIn && !r.clockOut).length, color: 'var(--blue-600)', bg: 'var(--blue-50)' },
          { label: 'Completed', count: records.filter(r=>r.clockOut).length,             color: 'var(--purple-600)', bg: 'var(--purple-50)' },
          { label: 'Total',     count: records.length,                                    color: 'var(--gray-600)', bg: 'var(--gray-100)' },
        ].map(({ label, count, color, bg }) => (
          <div key={label} className="card" style={{ padding: '16px 18px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{label}</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800, color }}>{count}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-header">
          <span className="section-title">Employee Check-ins</span>
          <span style={{ fontSize: 12, color: 'var(--gray-400)' }}>{records.length} records</span>
        </div>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spinner large/></div>
        ) : records.length === 0 ? (
          <EmptyState icon="📋" title="No check-ins yet" sub="Employees haven't clocked in today"/>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Clock In</th>
                  <th>Clock Out</th>
                  <th>Hours</th>
                  <th>Mode</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {records.map(r => {
                  const h = hours(r);
                  const stillin = r.clockIn && !r.clockOut;
                  return (
                    <tr key={r._id}>
                      <td>
                        <div className="flex items-center gap-8">
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: stillin ? 'var(--green-500)' : 'var(--gray-300)', flexShrink: 0, boxShadow: stillin ? '0 0 0 3px rgba(34,197,94,0.2)' : 'none' }}/>
                          <Avatar name={`${r.employee?.firstName} ${r.employee?.lastName}`} size={30}/>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 13 }}>{r.employee?.firstName} {r.employee?.lastName}</div>
                            <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>{r.employee?.email}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ fontWeight: 600 }}>{formatTime(r.clockIn)}</td>
                      <td>{r.clockOut ? formatTime(r.clockOut) : <span style={{ color: 'var(--gray-300)' }}>Active</span>}</td>
                      <td>{h ? <span style={{ fontWeight: 700, color: Number(h) >= 8 ? 'var(--green-600)' : 'var(--amber-600)' }}>{h}h</span> : '—'}</td>
                      <td style={{ fontSize: 12, color: 'var(--gray-500)' }}>{r.workMode}</td>
                      <td><Badge label={r.status}/></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
