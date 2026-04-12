// src/pages/employee/MyRequests.jsx
import { useState, useEffect } from 'react';
import { requestAPI } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { Badge, Modal, Spinner, EmptyState, Icon, fmt } from '../../components/common/index.jsx';

function IncrementModal({ currentSalary, onClose }) {
  const toast = useToast();
  const [form, setForm] = useState({ requestedSalary: '', requestedPercentage: '', requestNotes: '' });
  const [loading, setLoading] = useState(false);
  const preview = form.requestedSalary ? +form.requestedSalary : form.requestedPercentage ? Math.round(currentSalary*(1+form.requestedPercentage/100)) : null;
  const submit = async () => {
    if (!form.requestNotes) return toast.error('Please provide a reason for the request.');
    if (!form.requestedSalary && !form.requestedPercentage) return toast.error('Provide a salary amount or percentage.');
    setLoading(true);
    try { await requestAPI.submitIncrement({ ...form, requestedSalary: form.requestedSalary||undefined, requestedPercentage: form.requestedPercentage?+form.requestedPercentage:undefined }); toast.success('Increment request submitted.'); onClose(true); }
    catch(e){toast.error(e.message);} setLoading(false);
  };
  return (
    <Modal title="Request Salary Increment" onClose={()=>onClose(false)} size="md"
      footer={<><button className="btn btn-secondary" onClick={()=>onClose(false)}>Cancel</button><button className="btn btn-primary" onClick={submit} disabled={loading}>{loading?<Spinner size="sm"/>:'Submit Request'}</button></>}>
      <div className="bg-gray-50 rounded-xl p-4 mb-4">
        <div className="text-xs text-gray-400">Current Annual CTC</div>
        <div className="font-display text-2xl font-800 text-gray-900">{fmt.currency(currentSalary)}</div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="form-group"><label className="form-label">Requested Salary (₹)</label><input type="number" className="form-control" value={form.requestedSalary} onChange={e=>setForm(p=>({...p,requestedSalary:e.target.value,requestedPercentage:''}))} placeholder="e.g. 1200000" /></div>
        <div className="form-group"><label className="form-label">— or — % Increase</label><input type="number" className="form-control" value={form.requestedPercentage} onChange={e=>setForm(p=>({...p,requestedPercentage:e.target.value,requestedSalary:''}))} placeholder="e.g. 20" /></div>
      </div>
      {preview && <div className="text-sm font-700 text-success-700 bg-success-50 px-3 py-2 rounded-lg mb-4">Requested: {fmt.currency(preview)} ({preview>currentSalary?'+':''}{((preview-currentSalary)/currentSalary*100).toFixed(1)}%)</div>}
      <div className="form-group"><label className="form-label">Justification *</label><textarea className="form-control" rows={4} value={form.requestNotes} onChange={e=>setForm(p=>({...p,requestNotes:e.target.value}))} placeholder="Describe your contributions and reason for the increment…" /></div>
    </Modal>
  );
}

export default function MyRequests() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal,setModal] = useState(false);
  const load = async () => { setLoading(true); try { const r=await requestAPI.getMy({}); setRequests(r.data.data||[]); } catch {} setLoading(false); };
  useEffect(()=>{load();},[]);
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h2 className="page-title">My Requests</h2><p className="text-sm text-gray-400">{requests.length} total</p></div>
        <button className="btn btn-primary" onClick={()=>setModal(true)}><Icon name="trending" size={14}/>Request Increment</button>
      </div>
      <div className="card">
        {loading?<div className="flex justify-center py-14"><Spinner size="lg"/></div>
        :requests.length===0?<EmptyState icon="📝" title="No requests yet" sub="Submit a salary increment request." action={<button className="btn btn-primary btn-sm" onClick={()=>setModal(true)}>Request Increment</button>}/>
        :<div className="tbl-wrap"><table className="tbl">
          <thead><tr><th>Type</th><th>Current</th><th>Requested</th><th>Status</th><th>Submitted</th><th>Decision</th></tr></thead>
          <tbody>{requests.map(r=>(
            <tr key={r._id}>
              <td><Badge label={r.type}/></td>
              <td>{r.increment?.currentSalary?fmt.currency(r.increment.currentSalary):'—'}</td>
              <td className="font-700">{r.increment?.requestedSalary?fmt.currency(r.increment.requestedSalary):'—'}</td>
              <td><Badge label={r.status}/></td>
              <td className="text-xs text-gray-400">{fmt.date(r.createdAt)}</td>
              <td className="text-xs text-gray-500">{r.decisionNotes||'—'}</td>
            </tr>
          ))}</tbody>
        </table></div>}
      </div>
      {showModal&&<IncrementModal currentSalary={user?.currentSalary||0} onClose={r=>{setModal(false);if(r)load();}}/>}
    </div>
  );
}
