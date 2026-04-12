// src/pages/employee/MyAttendance.jsx
import { useState, useEffect, useCallback } from 'react';
import { attendAPI } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import { Badge, Spinner, EmptyState, Icon, fmt } from '../../components/common/index.jsx';

export default function MyAttendance() {
  const toast = useToast();
  const [today,   setToday]   = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [clocking,setClocking]= useState(false);
  const [filter, setFilter]   = useState({ from: '', to: '' });
  const [workMode,setWorkMode] = useState('Office');

  const loadToday = async () => { try { const r = await attendAPI.getToday(); setToday(r.data.data); } catch {} };
  const loadHist  = useCallback(async () => {
    setLoading(true);
    try { const r = await attendAPI.getMyHistory(filter); setRecords(r.data.data||[]); } catch {}
    setLoading(false);
  }, [filter]);

  useEffect(() => { loadToday(); }, []);
  useEffect(() => { loadHist(); }, [loadHist]);

  const clockIn = async () => {
    setClocking(true);
    try { await attendAPI.clockIn({ workMode }); toast.success('Clocked in!'); loadToday(); loadHist(); } catch(e){toast.error(e.message);}
    setClocking(false);
  };
  const clockOut = async () => {
    setClocking(true);
    try { await attendAPI.clockOut(); toast.success('Clocked out!'); loadToday(); loadHist(); } catch(e){toast.error(e.message);}
    setClocking(false);
  };

  const totalHours = records.reduce((s,r)=>{ const h=fmt.hours(r.clockIn,r.clockOut); return s+(h?parseFloat(h):0); },0);

  return (
    <div className="space-y-5">
      <h2 className="page-title">My Attendance</h2>
      {/* Clock widget */}
      <div className="card p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="flex-1">
            <p className="text-xs font-700 text-gray-400 uppercase tracking-wide mb-1">Today — {new Date().toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long'})}</p>
            {today ? (
              <div className="space-y-1">
                <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-success-500 animate-pulse"/><span className="text-sm font-700 text-success-700">Clocked in at {fmt.time(today.clockIn)}</span></div>
                {today.clockOut && <div className="text-sm text-gray-500">Clocked out at {fmt.time(today.clockOut)} · {fmt.hours(today.clockIn,today.clockOut)}h worked</div>}
                {!today.clockOut && <div className="text-sm text-gray-400">Duration: {fmt.hours(today.clockIn,null)}h ongoing</div>}
              </div>
            ) : <p className="text-sm text-gray-400">You haven't clocked in yet today.</p>}
          </div>
          <div className="flex items-end gap-3">
            {!today?.clockOut && (
              <>
                {!today && <div><label className="form-label">Work Mode</label><select className="form-control" value={workMode} onChange={e=>setWorkMode(e.target.value)}><option>Office</option><option>Remote</option><option>Hybrid</option></select></div>}
                <button className={`btn btn-lg ${today?'btn-secondary':'btn-primary'}`} onClick={today?clockOut:clockIn} disabled={clocking}>
                  {clocking?<Spinner size="sm"/>:<><Icon name={today?'logout':'clock'} size={16}/>{today?'Clock Out':'Clock In'}</>}
                </button>
              </>
            )}
            {today?.clockOut && <div className="text-sm text-gray-400 bg-gray-50 px-4 py-2.5 rounded-lg font-700">Day complete ✓</div>}
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4 text-center"><div className="font-display text-2xl font-800 text-gray-900">{records.length}</div><div className="text-xs text-gray-400">Days on Record</div></div>
        <div className="card p-4 text-center"><div className="font-display text-2xl font-800 text-success-700">{records.filter(r=>r.status==='Present').length}</div><div className="text-xs text-gray-400">Present</div></div>
        <div className="card p-4 text-center"><div className="font-display text-2xl font-800 text-primary-600">{totalHours.toFixed(1)}h</div><div className="text-xs text-gray-400">Total Hours</div></div>
      </div>

      {/* Filter */}
      <div className="card card-bd flex gap-3 items-end flex-wrap">
        <div><label className="form-label">From</label><input type="date" className="form-control" value={filter.from} onChange={e=>setFilter(p=>({...p,from:e.target.value}))}/></div>
        <div><label className="form-label">To</label><input type="date" className="form-control" value={filter.to} onChange={e=>setFilter(p=>({...p,to:e.target.value}))}/></div>
        <button className="btn btn-secondary btn-sm" onClick={()=>setFilter({from:'',to:''})}>Clear</button>
      </div>

      {/* History table */}
      <div className="card">
        <div className="card-hd"><span className="section-title">Attendance History</span><span className="text-xs text-gray-400">{records.length} records</span></div>
        {loading?<div className="flex justify-center py-14"><Spinner size="lg"/></div>
        :records.length===0?<EmptyState icon="📋" title="No records" sub="Attendance records will appear here."/>
        :<div className="tbl-wrap"><table className="tbl">
          <thead><tr><th>Date</th><th>Clock In</th><th>Clock Out</th><th>Hours</th><th>Mode</th><th>Status</th></tr></thead>
          <tbody>{records.map(r=>(
            <tr key={r._id}>
              <td className="font-700">{fmt.date(r.date)}</td>
              <td>{fmt.time(r.clockIn)}</td>
              <td>{r.clockOut?fmt.time(r.clockOut):<span className="text-warning-600 text-xs font-700">In progress</span>}</td>
              <td className="font-700">{fmt.hours(r.clockIn,r.clockOut)??'—'}h</td>
              <td className="text-xs text-gray-400">{r.workMode}</td>
              <td><Badge label={r.status}/></td>
            </tr>
          ))}</tbody>
        </table></div>}
      </div>
    </div>
  );
}
