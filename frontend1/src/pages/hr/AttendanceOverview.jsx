// src/pages/hr/AttendanceOverview.jsx
import { useState, useEffect, useCallback } from 'react';
import { attendAPI } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import { Badge, Spinner, EmptyState, Avatar, Icon, fmt } from '../../components/common/index.jsx';
import BulkImportModal from './components/BulkImportModal.jsx';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function AttendanceOverview() {
  const [records,  setRecords]  = useState([]);
  const [monthly,  setMonthly]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [tab,      setTab]      = useState('today');
  const [showImport,setImport]  = useState(false);
  const [mFilter,  setMFilter]  = useState({ month: new Date().getMonth()+1, year: new Date().getFullYear() });

  const loadToday   = useCallback(async () => { setLoading(true); try { const r = await attendAPI.getOverview(); setRecords(r.data.data||[]); } catch {} setLoading(false); }, []);
  const loadMonthly = useCallback(async () => { setLoading(true); try { const r = await attendAPI.getMonthly(mFilter); setMonthly(r.data.data||[]); } catch {} setLoading(false); }, [mFilter]);
  useEffect(() => { tab==='today' ? loadToday() : loadMonthly(); }, [tab]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h2 className="page-title">Attendance</h2></div>
        <button className="btn btn-primary" onClick={() => setImport(true)}><Icon name="upload" size={14} />Import Excel</button>
      </div>
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        <button onClick={() => setTab('today')} className={`px-4 py-1.5 text-xs font-700 rounded-lg transition-all ${tab==='today'?'bg-white shadow-sm text-gray-900':'text-gray-500'}`}>Today</button>
        <button onClick={() => setTab('monthly')} className={`px-4 py-1.5 text-xs font-700 rounded-lg transition-all ${tab==='monthly'?'bg-white shadow-sm text-gray-900':'text-gray-500'}`}>Monthly</button>
      </div>
      {tab === 'monthly' && (
        <div className="card card-bd flex gap-3 items-end flex-wrap">
          <div><label className="form-label">Month</label><select className="form-control" value={mFilter.month} onChange={e=>setMFilter(p=>({...p,month:+e.target.value}))}>{MONTHS.map((m,i)=><option key={m} value={i+1}>{m}</option>)}</select></div>
          <div><label className="form-label">Year</label><input type="number" className="form-control w-24" value={mFilter.year} onChange={e=>setMFilter(p=>({...p,year:+e.target.value}))} /></div>
          <button className="btn btn-primary btn-sm" onClick={loadMonthly}><Icon name="refresh" size={13} />Load</button>
        </div>
      )}
      <div className="card">
        <div className="card-hd"><span className="section-title">{tab==='today'?'Today\'s Check-ins':'Monthly Report — '+MONTHS[mFilter.month-1]+' '+mFilter.year}</span></div>
        {loading ? <div className="flex justify-center py-14"><Spinner size="lg" /></div>
        : (tab==='today'?records:monthly).length===0 ? <EmptyState icon="📋" title="No records" sub={tab==='today'?'No check-ins today yet.':'No attendance records for this period.'} />
        : (
          <div className="tbl-wrap">
            <table className="tbl">
              <thead><tr><th>Employee</th>{tab==='monthly'&&<th>Date</th>}<th>Clock In</th><th>Clock Out</th><th>Hours</th><th>Mode</th><th>Status</th></tr></thead>
              <tbody>
                {(tab==='today'?records:monthly).map(r => (
                  <tr key={r._id}>
                    <td><div className="flex items-center gap-2"><Avatar name={`${r.employee?.firstName} ${r.employee?.lastName}`} size={7} /><span className="text-sm font-700">{r.employee?.firstName} {r.employee?.lastName}</span></div></td>
                    {tab==='monthly'&&<td className="text-sm font-700">{fmt.date(r.date)}</td>}
                    <td className="font-700">{fmt.time(r.clockIn)}</td>
                    <td>{r.clockOut?fmt.time(r.clockOut):<span className="text-xs text-warning-600 font-700">Still in</span>}</td>
                    <td>{fmt.hours(r.clockIn,r.clockOut)??'—'}h</td>
                    <td className="text-xs text-gray-500">{r.workMode}</td>
                    <td><Badge label={r.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {showImport && <BulkImportModal onClose={() => { setImport(false); loadToday(); }} />}
    </div>
  );
}
