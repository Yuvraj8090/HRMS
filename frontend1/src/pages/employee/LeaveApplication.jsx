// src/pages/employee/LeaveApplication.jsx
import { useState, useEffect } from 'react';
import { leaveAPI } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { Badge, Spinner, EmptyState, Icon, Modal, ProgressBar, fmt } from '../../components/common/index.jsx';

function ApplyModal({ categories, balance, onClose }) {
  const toast = useToast();
  const [form, setForm] = useState({ categoryId: '', fromDate: '', toDate: '', isHalfDay: false, reason: '', stationLeavePermission: false, contactPhone: '', contactAddress: '' });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const ch = f => e => setForm(p => ({ ...p, [f]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
  const numDays = form.fromDate && form.toDate ? (form.isHalfDay ? 0.5 : Math.floor((new Date(form.toDate) - new Date(form.fromDate)) / 86400000) + 1) : 0;
  const catBal  = balance.find(b => b.leaveCategory?._id === form.categoryId || b.leaveCategory === form.categoryId);

  const submit = async () => {
    if (!form.categoryId || !form.fromDate || !form.toDate || !form.reason) return toast.error('All fields required.');
    if (numDays <= 0) return toast.error('Invalid date range.');
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('categoryId', form.categoryId); fd.append('fromDate', form.fromDate); fd.append('toDate', form.toDate);
      fd.append('isHalfDay', form.isHalfDay); fd.append('reason', form.reason);
      fd.append('stationLeavePermission', form.stationLeavePermission);
      fd.append('contactWhileOnLeave', JSON.stringify({ phone: form.contactPhone, address: form.contactAddress }));
      if (file) fd.append('leaveLetter', file);
      await leaveAPI.apply(fd);
      toast.success('Leave application submitted successfully!');
      onClose(true);
    } catch(e){toast.error(e.message);}
    setLoading(false);
  };

  return (
    <Modal title="Apply for Leave" onClose={()=>onClose(false)} size="lg"
      footer={<><button className="btn btn-secondary" onClick={()=>onClose(false)}>Cancel</button><button className="btn btn-primary" onClick={submit} disabled={loading}>{loading?<Spinner size="sm"/>:<><Icon name="calendar" size={13}/>Submit Application</>}</button></>}>
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 form-group"><label className="form-label">Leave Type *</label>
          <select className="form-control" value={form.categoryId} onChange={ch('categoryId')}>
            <option value="">Select leave type…</option>
            {categories.map(c => <option key={c._id} value={c._id}>{c.code} — {c.name}{c.isPaid?'':' (Unpaid)'}</option>)}
          </select>
          {catBal && <div className="mt-1.5 text-xs text-success-700 font-700">Available balance: {catBal.currentBalance} days</div>}
        </div>
        <div className="form-group"><label className="form-label">From Date *</label><input type="date" className="form-control" value={form.fromDate} onChange={ch('fromDate')} min={new Date().toISOString().slice(0,10)} /></div>
        <div className="form-group"><label className="form-label">To Date *</label><input type="date" className="form-control" value={form.toDate} onChange={ch('toDate')} min={form.fromDate || new Date().toISOString().slice(0,10)} /></div>
      </div>
      {numDays > 0 && <div className="text-xs font-700 text-primary-700 bg-primary-50 px-3 py-2 rounded-lg mb-3 -mt-1">📅 {numDays} day{numDays!==1?'s':''} requested</div>}
      <div className="flex items-center gap-3 mb-4">
        <input type="checkbox" id="halfday" checked={form.isHalfDay} onChange={ch('isHalfDay')} className="w-4 h-4 accent-primary-600" />
        <label htmlFor="halfday" className="text-sm font-700 cursor-pointer">Half Day</label>
        <input type="checkbox" id="station" checked={form.stationLeavePermission} onChange={ch('stationLeavePermission')} className="w-4 h-4 accent-primary-600 ml-4" />
        <label htmlFor="station" className="text-sm font-700 cursor-pointer">Station Leave Permission</label>
      </div>
      <div className="form-group"><label className="form-label">Reason *</label><textarea className="form-control" rows={3} value={form.reason} onChange={ch('reason')} placeholder="Provide reason for leave…" /></div>
      <div className="grid grid-cols-2 gap-4">
        <div className="form-group"><label className="form-label">Contact Phone (while on leave)</label><input className="form-control" value={form.contactPhone} onChange={ch('contactPhone')} placeholder="+91 98765…" /></div>
        <div className="form-group"><label className="form-label">Contact Address</label><input className="form-control" value={form.contactAddress} onChange={ch('contactAddress')} placeholder="Home address" /></div>
      </div>
      <div className="form-group"><label className="form-label">Leave Letter (optional PDF/image)</label><input type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" onChange={e=>setFile(e.target.files[0])} className="text-sm text-gray-500" /></div>
    </Modal>
  );
}

export default function LeaveApplication() {
  const toast = useToast();
  const [leaves,     setLeaves]    = useState([]);
  const [categories, setCategories]= useState([]);
  const [balance,    setBalance]   = useState([]);
  const [loading,    setLoading]   = useState(true);
  const [showApply,  setShowApply] = useState(false);
  const [tab,        setTab]       = useState('Pending');

  const load = async () => {
    setLoading(true);
    try {
      const [l, c, b] = await Promise.all([leaveAPI.getMyLeaves({}), leaveAPI.getCategories(), leaveAPI.getMyBalance({})]);
      setLeaves(l.data.data||[]); setCategories(c.data.data||[]); setBalance(b.data.data||[]);
    } catch {}
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const displayed = tab === 'All' ? leaves : leaves.filter(l => l.status === tab);

  const handleCancel = async id => {
    try { await leaveAPI.cancel(id); toast.success('Leave cancelled.'); load(); } catch(e){toast.error(e.message);}
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h2 className="page-title">My Leaves</h2><p className="text-sm text-gray-400">{new Date().getFullYear()} leave record</p></div>
        <button className="btn btn-primary" onClick={()=>setShowApply(true)}><Icon name="plus" size={14}/>Apply for Leave</button>
      </div>
      {/* Balance cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {balance.map(b => (
          <div key={b._id} className="card p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-800 bg-gray-100 px-2 py-0.5 rounded">{b.categoryCode}</span>
              <span className="text-lg font-800 text-gray-900">{b.currentBalance}<span className="text-xs text-gray-400 font-500">/{b.totalBalance}</span></span>
            </div>
            <p className="text-xs text-gray-400 truncate mb-1.5">{b.leaveCategory?.name}</p>
            <ProgressBar value={b.totalBalance>0?(b.currentBalance/b.totalBalance)*100:0} />
          </div>
        ))}
      </div>
      {/* Tabs + table */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {['Pending','Recommended','Approved','Rejected','All'].map(t=><button key={t} onClick={()=>setTab(t)} className={`px-3 py-1.5 text-xs font-700 rounded-lg transition-all ${tab===t?'bg-white shadow-sm text-gray-900':'text-gray-500'}`}>{t}</button>)}
      </div>
      <div className="card">
        {loading?<div className="flex justify-center py-14"><Spinner size="lg"/></div>
        :displayed.length===0?<EmptyState icon="🌴" title={`No ${tab==='All'?'':tab.toLowerCase()+' '}leaves`} sub="Apply for leave using the button above." action={<button className="btn btn-primary btn-sm" onClick={()=>setShowApply(true)}>Apply Now</button>}/>
        :<div className="tbl-wrap"><table className="tbl">
          <thead><tr><th>Type</th><th>From</th><th>To</th><th>Days</th><th>Reason</th><th>Status</th><th>Applied</th><th></th></tr></thead>
          <tbody>{displayed.map(l=>(
            <tr key={l._id}>
              <td><span className="text-xs font-700 bg-gray-100 px-2 py-0.5 rounded">{l.categoryCode}</span></td>
              <td className="font-700">{fmt.date(l.fromDate)}</td><td>{fmt.date(l.toDate)}</td>
              <td className="font-700">{l.numberOfDays}{l.isHalfDay?' ½':''}</td>
              <td className="max-w-[180px] truncate text-xs text-gray-500">{l.reason}</td>
              <td><Badge label={l.status}/></td>
              <td className="text-xs text-gray-400">{fmt.date(l.createdAt)}</td>
              <td>{['Pending','Recommended'].includes(l.status)&&<button className="btn btn-danger btn-sm" onClick={()=>handleCancel(l._id)}>Cancel</button>}
                  {l.approvedDocumentUrl&&<a href={l.approvedDocumentUrl} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm ml-1"><Icon name="eye" size={12}/>Doc</a>}
              </td>
            </tr>
          ))}</tbody>
        </table></div>}
      </div>
      {showApply&&<ApplyModal categories={categories} balance={balance} onClose={r=>{setShowApply(false);if(r)load();}}/>}
    </div>
  );
}
