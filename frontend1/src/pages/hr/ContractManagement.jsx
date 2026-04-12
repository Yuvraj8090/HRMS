// src/pages/hr/ContractManagement.jsx
import { useState, useEffect, useCallback } from 'react';
import { contractAPI, empAPI } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import { Badge, Modal, Spinner, EmptyState, Avatar, Icon, ConfirmDialog, fmt, StatCard } from '../../components/common/index.jsx';

function ContractModal({ contract, employees, onClose }) {
  const toast = useToast();
  const isEdit = !!contract?._id;
  const [form, setForm] = useState({
    employee: contract?.employee?._id||'', contractDate: contract?.contractDate?.slice(0,10)||new Date().toISOString().slice(0,10),
    startDate: contract?.startDate?.slice(0,10)||'', endDate: contract?.endDate?.slice(0,10)||'',
    renewalDate: contract?.renewalDate?.slice(0,10)||'', contractType: contract?.contractType||'Contractual', notes: contract?.notes||'',
  });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const ch = f => e => setForm(p=>({...p,[f]:e.target.value}));
  const submit = async () => {
    if (!form.employee||!form.startDate||!form.endDate) return toast.error('Employee, start date, end date required.');
    setLoading(true);
    try {
      const fd = new FormData(); Object.entries(form).forEach(([k,v])=>v&&fd.append(k,v));
      if (file) fd.append('contractDocument', file);
      if (isEdit) await contractAPI.renewJson(contract._id, form); else await contractAPI.createJson(form);
      toast.success(isEdit?'Contract renewed.':'Contract created.');
      onClose(true);
    } catch(e){toast.error(e.message);}
    setLoading(false);
  };
  return (
    <Modal title={isEdit?'Renew Contract':'New Contract'} onClose={()=>onClose(false)} size="md"
      footer={<><button className="btn btn-secondary" onClick={()=>onClose(false)}>Cancel</button><button className="btn btn-primary" onClick={submit} disabled={loading}>{loading?<Spinner size="sm"/>:isEdit?'Renew':'Create'}</button></>}>
      {!isEdit && <div className="form-group"><label className="form-label">Employee *</label><select className="form-control" value={form.employee} onChange={ch('employee')}><option value="">Select employee…</option>{employees.map(e=><option key={e._id} value={e._id}>{e.firstName} {e.lastName} ({e.employeeNumber||e.payCode})</option>)}</select></div>}
      <div className="grid grid-cols-2 gap-4">
        <div className="form-group"><label className="form-label">Contract Date</label><input type="date" className="form-control" value={form.contractDate} onChange={ch('contractDate')} /></div>
        <div className="form-group"><label className="form-label">Type</label><select className="form-control" value={form.contractType} onChange={ch('contractType')}>{['Full-Time','Part-Time','Contractual','Deputation','Adhoc'].map(t=><option key={t}>{t}</option>)}</select></div>
        <div className="form-group"><label className="form-label">Start Date *</label><input type="date" className="form-control" value={form.startDate} onChange={ch('startDate')} /></div>
        <div className="form-group"><label className="form-label">End Date *</label><input type="date" className="form-control" value={form.endDate} onChange={ch('endDate')} /></div>
      </div>
      <div className="form-group"><label className="form-label">Renewal Date</label><input type="date" className="form-control" value={form.renewalDate} onChange={ch('renewalDate')} /></div>
      <div className="form-group"><label className="form-label">Notes</label><textarea className="form-control" rows={2} value={form.notes} onChange={ch('notes')} /></div>
      <div className="form-group"><label className="form-label">Contract Document (PDF)</label><input type="file" accept=".pdf,.doc,.docx" onChange={e=>setFile(e.target.files[0])} className="text-sm text-gray-500" /></div>
    </Modal>
  );
}

export default function ContractManagement() {
  const toast = useToast();
  const [contracts,  setContracts]  = useState([]);
  const [employees,  setEmployees]  = useState([]);
  const [flagged,    setFlagged]    = useState({});
  const [loading,    setLoading]    = useState(true);
  const [modal,      setModal]      = useState(null);
  const [statusFilter,setFilter]    = useState('');

  useEffect(()=>{empAPI.getAll({limit:200}).then(r=>setEmployees(r.data.data||[])).catch(()=>{});contractAPI.getFlagged().then(r=>setFlagged(r.data.data||{})).catch(()=>{});}, []);
  const load = useCallback(async()=>{ setLoading(true); try{const r=await contractAPI.getAll(statusFilter?{status:statusFilter}:{}); setContracts(r.data.data||[]);}catch{}setLoading(false);}, [statusFilter]);
  useEffect(()=>{load();}, [load]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h2 className="page-title">Contract Management</h2></div>
        <button className="btn btn-primary" onClick={()=>setModal({})}><Icon name="plus" size={14}/>New Contract</button>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-danger-50 border border-danger-200 p-4"><div className="text-xs font-700 text-danger-600 uppercase tracking-wide">Expired</div><div className="font-display text-3xl font-800 text-danger-700 mt-1">{flagged.expired??0}</div></div>
        <div className="rounded-xl bg-warning-50 border border-warning-200 p-4"><div className="text-xs font-700 text-warning-600 uppercase tracking-wide">Expiring Soon</div><div className="font-display text-3xl font-800 text-warning-700 mt-1">{flagged.expiring??0}</div></div>
        <div className="rounded-xl bg-gray-50 border border-gray-200 p-4"><div className="text-xs font-700 text-gray-500 uppercase tracking-wide">No Contract</div><div className="font-display text-3xl font-800 text-gray-700 mt-1">{flagged.noContract??0}</div></div>
      </div>
      <div className="flex gap-2">
        {['','Active','Expiring','Expired','Renewed'].map(s=><button key={s} className={`btn btn-sm ${statusFilter===s?'btn-primary':'btn-secondary'}`} onClick={()=>setFilter(s)}>{s||'All'}</button>)}
      </div>
      <div className="card">
        {loading?<div className="flex justify-center py-14"><Spinner size="lg"/></div>
        :contracts.length===0?<EmptyState icon="📄" title="No contracts" sub="No contracts match the current filter."/>
        :<div className="tbl-wrap"><table className="tbl">
          <thead><tr><th>Employee</th><th>Type</th><th>Start</th><th>End</th><th>Renewal</th><th>Days Left</th><th>Status</th><th></th></tr></thead>
          <tbody>{contracts.map(c=>(
            <tr key={c._id}>
              <td><div className="flex items-center gap-2"><Avatar name={`${c.employee?.firstName} ${c.employee?.lastName}`} size={7}/><div><div className="text-sm font-700">{c.employee?.firstName} {c.employee?.lastName}</div><div className="text-xs text-gray-400">{c.employee?.payCode}</div></div></div></td>
              <td><Badge label={c.contractType}/></td>
              <td className="text-sm">{fmt.date(c.startDate)}</td>
              <td className="text-sm font-700">{fmt.date(c.endDate)}</td>
              <td className="text-sm text-gray-400">{fmt.date(c.renewalDate)}</td>
              <td><span className={`font-700 text-sm ${c.daysUntilExpiry<0?'text-danger-600':c.daysUntilExpiry<=30?'text-warning-600':'text-gray-700'}`}>{c.daysUntilExpiry!=null?`${c.daysUntilExpiry}d`:'—'}</span></td>
              <td><Badge label={c.status}/></td>
              <td><button className="btn btn-secondary btn-sm" onClick={()=>setModal(c)}><Icon name="refresh" size={12}/>Renew</button></td>
            </tr>
          ))}</tbody>
        </table></div>}
      </div>
      {modal!==null && <ContractModal contract={modal?._id?modal:null} employees={employees} onClose={r=>{setModal(null);if(r)load();}}/>}
    </div>
  );
}
