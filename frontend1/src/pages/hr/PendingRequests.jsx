// src/pages/hr/PendingRequests.jsx
import { useState, useEffect, useCallback } from 'react';
import { requestAPI } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import { Badge, Modal, Spinner, EmptyState, Avatar, Icon, fmt } from '../../components/common/index.jsx';

function ReviewModal({ req, onClose }) {
  const toast = useToast();
  const [form, setForm] = useState({ status: 'Approved', decisionNotes: '', approvedSalary: '' });
  const [loading, setLoading] = useState(false);
  const submit = async () => {
    setLoading(true);
    try {
      const payload = { status: form.status, decisionNotes: form.decisionNotes };
      if (form.status === 'Approved' && req.type === 'Increment' && form.approvedSalary) payload.approvedSalary = +form.approvedSalary;
      await requestAPI.updateStatus(req._id, payload);
      toast.success(`Request ${form.status.toLowerCase()}.`); onClose(true);
    } catch(e){toast.error(e.message);}
    setLoading(false);
  };
  return (
    <Modal title="Review Request" onClose={()=>onClose(false)} size="md"
      footer={<><button className="btn btn-secondary" onClick={()=>onClose(false)}>Cancel</button><button className={`btn ${form.status==='Approved'?'btn-success':'btn-danger'}`} onClick={submit} disabled={loading}>{loading?<Spinner size="sm"/>:form.status==='Approved'?'✓ Approve':'✕ Reject'}</button></>}>
      <div className="bg-gray-50 rounded-xl p-4 mb-4">
        <div className="flex items-center gap-3 mb-3"><Avatar name={`${req.requestedBy?.firstName} ${req.requestedBy?.lastName}`} size={9}/><div><p className="font-700">{req.requestedBy?.firstName} {req.requestedBy?.lastName}</p><p className="text-xs text-gray-400">{req.requestedBy?.email}</p></div><div className="ml-auto"><Badge label={req.type}/></div></div>
        {req.type==='Increment'&&<div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-white rounded-lg px-3 py-2"><div className="text-gray-400">Current CTC</div><div className="font-800 text-base">{fmt.currency(req.increment?.currentSalary)}</div></div>
          <div className="bg-primary-50 rounded-lg px-3 py-2"><div className="text-primary-500">Requested CTC</div><div className="font-800 text-base text-primary-700">{fmt.currency(req.increment?.requestedSalary)}</div></div>
        </div>}
        {req.requestNotes&&<p className="text-xs text-gray-500 mt-3 pt-3 border-t border-gray-200"><span className="font-700">Notes: </span>{req.requestNotes}</p>}
      </div>
      <div className="form-group"><label className="form-label">Decision</label><select className="form-control" value={form.status} onChange={e=>setForm(p=>({...p,status:e.target.value}))}><option value="Approved">Approve</option><option value="Rejected">Reject</option><option value="Under Review">Under Review</option></select></div>
      {form.status==='Approved'&&req.type==='Increment'&&<div className="form-group"><label className="form-label">Approved Salary (₹, blank = use requested)</label><input type="number" className="form-control" placeholder={req.increment?.requestedSalary} value={form.approvedSalary} onChange={e=>setForm(p=>({...p,approvedSalary:e.target.value}))}/></div>}
      <div className="form-group"><label className="form-label">Decision Notes</label><textarea className="form-control" rows={3} value={form.decisionNotes} onChange={e=>setForm(p=>({...p,decisionNotes:e.target.value}))}/></div>
    </Modal>
  );
}

export default function PendingRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [typeFilter, setType] = useState('');
  const load = useCallback(async()=>{setLoading(true);try{const r=await requestAPI.getPending(typeFilter?{type:typeFilter}:{});setRequests(r.data.data||[]);}catch{}setLoading(false);},[typeFilter]);
  useEffect(()=>{load();},[load]);
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h2 className="page-title">Requests</h2><p className="text-sm text-gray-400 mt-0.5">{requests.length} pending</p></div>
        <div className="flex gap-2">{['','Increment','Appraisal'].map(t=><button key={t} className={`btn btn-sm ${typeFilter===t?'btn-primary':'btn-secondary'}`} onClick={()=>setType(t)}>{t||'All Types'}</button>)}</div>
      </div>
      <div className="card">
        {loading?<div className="flex justify-center py-14"><Spinner size="lg"/></div>
        :requests.length===0?<EmptyState icon="✅" title="All clear!" sub="No pending requests."/>
        :<div className="tbl-wrap"><table className="tbl">
          <thead><tr><th>Employee</th><th>Type</th><th>Current</th><th>Requested</th><th>Date</th><th>Status</th><th></th></tr></thead>
          <tbody>{requests.map(r=>(
            <tr key={r._id}>
              <td><div className="flex items-center gap-2"><Avatar name={`${r.requestedBy?.firstName} ${r.requestedBy?.lastName}`} size={7}/><div><div className="text-sm font-700">{r.requestedBy?.firstName} {r.requestedBy?.lastName}</div><div className="text-xs text-gray-400">{r.requestedBy?.email}</div></div></div></td>
              <td><Badge label={r.type}/></td>
              <td className="text-sm">{r.increment?.currentSalary?fmt.currency(r.increment.currentSalary):'—'}</td>
              <td className="font-700 text-sm">{r.increment?.requestedSalary?fmt.currency(r.increment.requestedSalary):'—'}</td>
              <td className="text-xs text-gray-400">{fmt.date(r.createdAt)}</td>
              <td><Badge label={r.status}/></td>
              <td><button className="btn btn-primary btn-sm" onClick={()=>setSelected(r)}><Icon name="edit" size={12}/>Review</button></td>
            </tr>
          ))}</tbody>
        </table></div>}
      </div>
      {selected&&<ReviewModal req={selected} onClose={r=>{setSelected(null);if(r)load();}}/>}
    </div>
  );
}
