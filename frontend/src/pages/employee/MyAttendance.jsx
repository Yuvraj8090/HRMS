// src/pages/employee/MyAttendance.jsx
import { useState, useEffect } from 'react';
import { attendanceAPI } from '../../services/api';
import { Badge, EmptyState, Spinner, fmtDate, fmtTime, Icon } from '../../components/common/index.jsx';

export default function MyAttendance() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState({ from: '', to: '' });

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filter.from) params.from = filter.from;
      if (filter.to)   params.to   = filter.to;
      const { data } = await attendanceAPI.getHistory(params);
      setRecords(data.data || []);
    } catch { setRecords([]); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const totalHours = records.reduce((acc, r) => {
    if (r.clockIn && r.clockOut) {
      acc += (new Date(r.clockOut) - new Date(r.clockIn)) / 3600000;
    }
    return acc;
  }, 0);

  const presentCount = records.filter(r => r.status === 'Present').length;

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <div className="flex justify-between items-start flex-wrap gap-16 mb-24">
        <div>
          <h2 className="page-title">My Attendance</h2>
          <p className="page-sub">Track your clock-in/out history</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px,1fr))', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Total Records', value: records.length, color: 'var(--blue-600)', bg: 'var(--blue-50)' },
          { label: 'Present Days',  value: presentCount,   color: 'var(--green-600)', bg: 'var(--green-50)' },
          { label: 'Total Hours',   value: `${totalHours.toFixed(1)}h`, color: 'var(--purple-600)', bg: 'var(--purple-50)' },
          { label: 'Avg Hours/Day', value: presentCount ? `${(totalHours/presentCount).toFixed(1)}h` : '—', color: 'var(--amber-600)', bg: 'var(--amber-50)' },
        ].map(({ label, value, color, bg }, i) => (
          <div key={i} className="card" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color, fontSize: 20, fontWeight: 800, flexShrink: 0, fontFamily: 'var(--font-display)' }}>
              {typeof value === 'string' && value.includes('h') ? <Icon name="clock" size={18} color={color}/> : <Icon name="chart" size={18} color={color}/>}
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, color: 'var(--gray-900)', marginTop: 2 }}>{value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card mb-20">
        <div className="card-body" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div>
            <label className="form-label">From Date</label>
            <input type="date" className="form-control" style={{ width: 'auto' }}
              value={filter.from} onChange={e => setFilter(p => ({ ...p, from: e.target.value }))}/>
          </div>
          <div>
            <label className="form-label">To Date</label>
            <input type="date" className="form-control" style={{ width: 'auto' }}
              value={filter.to} onChange={e => setFilter(p => ({ ...p, to: e.target.value }))}/>
          </div>
          <button className="btn btn-primary btn-sm" onClick={load}><Icon name="filter" size={13}/>Apply</button>
          <button className="btn btn-secondary btn-sm" onClick={() => { setFilter({ from: '', to: '' }); setTimeout(load, 50); }}>Clear</button>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="card-header">
          <span className="section-title">Attendance Records</span>
          <span style={{ fontSize: 12, color: 'var(--gray-400)' }}>{records.length} records</span>
        </div>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spinner large/></div>
        ) : records.length === 0 ? (
          <EmptyState icon="📅" title="No records found" sub="Try changing your date filter"/>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Clock In</th>
                  <th>Clock Out</th>
                  <th>Hours Worked</th>
                  <th>Mode</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {records.map(r => {
                  const hrs = r.clockIn && r.clockOut
                    ? ((new Date(r.clockOut) - new Date(r.clockIn)) / 3600000).toFixed(1) : null;
                  return (
                    <tr key={r._id}>
                      <td style={{ fontWeight: 600 }}>{fmtDate(r.date)}</td>
                      <td>{fmtTime(r.clockIn)}</td>
                      <td>{r.clockOut ? fmtTime(r.clockOut) : <span style={{ color: 'var(--gray-300)' }}>—</span>}</td>
                      <td>{hrs ? <span style={{ fontWeight: 700, color: 'var(--green-700)' }}>{hrs}h</span> : <span style={{ color: 'var(--gray-300)' }}>—</span>}</td>
                      <td><span style={{ fontSize: 12, color: 'var(--gray-500)' }}>{r.workMode}</span></td>
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
