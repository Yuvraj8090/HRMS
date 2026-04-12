// src/pages/hr/ManageLeaves.jsx
import { useState, useEffect, useCallback } from 'react';
import { leaveAPI } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { Badge, Modal, Spinner, EmptyState, Avatar, Icon, fmt } from '../../components/common/index.jsx';

function ActionModal({ leave, role, onClose }) {
  const toast = useToast();
  const isAdmin = role === 'Admin';
  const [form, setForm] = useState({ decision: 'Approved', note: '' });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    try {
      if (!isAdmin) {
        // HR recommends
        await leaveAPI.recommend(leave._id, { note: form.note });
        toast.success('Leave recommended to Admin.');
      } else {
        // Admin approves/rejects
        const fd = new FormData();
        fd.append('decision', form.decision);
        fd.append('note', form.note);
        if (file) fd.append('approvedDocument', file);
        await leaveAPI.action(leave._id, fd);
        toast.success(`Leave ${form.decision.toLowerCase()}.`);
      }
      onClose(true);
    } catch (e) { toast.error(e.message); }
    setLoading(false);
  };

  return (
    <Modal title={isAdmin ? 'Final Decision' : 'Recommend Leave'} onClose={() => onClose(false)} size="md"
      footer={<><button className="btn btn-secondary" onClick={() => onClose(false)}>Cancel</button><button className={`btn ${form.decision === 'Rejected' ? 'btn-danger' : 'btn-success'}`} onClick={submit} disabled={loading}>{loading ? <Spinner size="sm" /> : isAdmin ? (form.decision === 'Approved' ? '✓ Approve' : '✕ Reject') : '✓ Recommend'}</button></>}>
      {/* Leave summary */}
      <div className="bg-gray-50 rounded-xl p-4 mb-4 space-y-2">
        <div className="flex items-center gap-3">
          <Avatar name={`${leave.applicant?.firstName} ${leave.applicant?.lastName}`} size={9} />
          <div>
            <p className="font-700 text-sm">{leave.applicant?.firstName} {leave.applicant?.lastName} <Badge label={leave.applicant?.role} /></p>
            <p className="text-xs text-gray-400">{leave.applicant?.employeeNumber} · {leave.applicant?.office}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-white rounded-lg px-3 py-2"><span className="text-gray-400">Type</span><div className="font-700">{leave.categoryCode} — {leave.leaveCategory?.name}</div></div>
          <div className="bg-white rounded-lg px-3 py-2"><span className="text-gray-400">Days</span><div className="font-700">{leave.numberOfDays}</div></div>
          <div className="bg-white rounded-lg px-3 py-2"><span className="text-gray-400">From</span><div className="font-700">{fmt.date(leave.fromDate)}</div></div>
          <div className="bg-white rounded-lg px-3 py-2"><span className="text-gray-400">To</span><div className="font-700">{fmt.date(leave.toDate)}</div></div>
        </div>
        <div className="bg-white rounded-lg px-3 py-2 text-xs"><span className="text-gray-400">Reason: </span><span className="font-600">{leave.reason}</span></div>
        {leave.stationLeavePermission && <div className="text-xs text-warning-700 bg-warning-50 px-3 py-1.5 rounded-lg font-700">⚠ Station leave permission requested</div>}
        {leave.contactWhileOnLeave?.phone && <div className="text-xs text-gray-500">Contact: {leave.contactWhileOnLeave.phone}</div>}
        {leave.leaveLetterUrl && <a href={leave.leaveLetterUrl} target="_blank" rel="noreferrer" className="text-xs text-primary-600 font-700 flex items-center gap-1"><Icon name="doc" size={12} />View Leave Letter</a>}
      </div>

      {isAdmin && (
        <div className="form-group">
          <label className="form-label">Decision</label>
          <select className="form-control" value={form.decision} onChange={e => setForm(p => ({ ...p, decision: e.target.value }))}>
            <option value="Approved">Approve</option>
            <option value="Rejected">Reject</option>
          </select>
        </div>
      )}
      <div className="form-group">
        <label className="form-label">{isAdmin ? 'Note to Employee' : 'Recommendation Note'}</label>
        <textarea className="form-control" rows={3} placeholder="Add a note…" value={form.note} onChange={e => setForm(p => ({ ...p, note: e.target.value }))} />
      </div>
      {isAdmin && form.decision === 'Approved' && (
        <div className="form-group">
          <label className="form-label">Upload Approval Document (optional)</label>
          <input type="file" accept=".pdf,.doc,.docx" onChange={e => setFile(e.target.files[0])} className="text-sm text-gray-500" />
        </div>
      )}
    </Modal>
  );
}

export default function ManageLeaves() {
  const toast = useToast();
  const { role } = useAuth();
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [tab, setTab] = useState('Pending');
  const [stats, setStats] = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (tab !== 'All') params.status = tab;
      const [lr, sr] = await Promise.all([leaveAPI.getAll(params), leaveAPI.getStats()]);
      setLeaves(lr.data.data || []);
      setStats(sr.data.data || {});
    } catch {}
    setLoading(false);
  }, [tab]);

  useEffect(() => { load(); }, [load]);

  const TABS = role === 'Admin'
    ? ['Pending', 'Recommended', 'Approved', 'Rejected', 'All']
    : ['Pending', 'Recommended', 'Approved', 'Rejected', 'All'];

  const canAction = l => {
    if (role === 'HR' && l.applicantRole === 'Employee' && l.status === 'Pending') return true;
    if (role === 'Admin') {
      if (l.applicantRole === 'HR'    && l.status === 'Pending')     return true;
      if (l.applicantRole === 'Employee' && l.status === 'Recommended') return true;
      if (l.applicantRole === 'Admin' && l.status === 'Pending')     return true;
    }
    return false;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h2 className="page-title">Leave Management</h2><p className="text-sm text-gray-400 mt-0.5">{stats.pending || 0} pending action</p></div>
      </div>
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[['Pending', stats.pending||0, 'bg-warning-50 text-warning-700'], ['Approved (YTD)', stats.approved||0, 'bg-success-50 text-success-700']].map(([l,v,cls]) => (
          <div key={l} className={`rounded-xl px-4 py-3 ${cls}`}><div className="text-xs font-700 uppercase tracking-wide opacity-70">{l}</div><div className="font-display text-2xl font-800">{v}</div></div>
        ))}
      </div>
      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {TABS.map(t => <button key={t} onClick={() => setTab(t)} className={`px-3 py-1.5 text-xs font-700 rounded-lg transition-all ${tab === t ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}>{t}</button>)}
      </div>
      <div className="card">
        {loading ? <div className="flex justify-center py-14"><Spinner size="lg" /></div>
        : leaves.length === 0 ? <EmptyState icon="📋" title="No leave requests" sub={`No ${tab.toLowerCase()} leaves found.`} />
        : (
          <div className="tbl-wrap">
            <table className="tbl">
              <thead><tr><th>Employee</th><th>Type</th><th>From</th><th>To</th><th>Days</th><th>Status</th><th>Applied</th><th></th></tr></thead>
              <tbody>
                {leaves.map(l => (
                  <tr key={l._id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <Avatar name={`${l.applicant?.firstName} ${l.applicant?.lastName}`} size={7} />
                        <div>
                          <div className="text-sm font-700">{l.applicant?.firstName} {l.applicant?.lastName}</div>
                          <div className="text-xs text-gray-400"><Badge label={l.applicant?.role} /></div>
                        </div>
                      </div>
                    </td>
                    <td><span className="text-xs font-700 bg-gray-100 px-2 py-0.5 rounded">{l.categoryCode}</span></td>
                    <td className="font-700 text-sm">{fmt.date(l.fromDate)}</td>
                    <td className="text-sm">{fmt.date(l.toDate)}</td>
                    <td className="font-700">{l.numberOfDays}{l.isHalfDay ? ' ½' : ''}</td>
                    <td><Badge label={l.status} /></td>
                    <td className="text-xs text-gray-400">{fmt.date(l.createdAt)}</td>
                    <td>
                      {canAction(l) ? (
                        <button className="btn btn-primary btn-sm" onClick={() => setSelected(l)}>
                          <Icon name="edit" size={12} />{role === 'HR' ? 'Recommend' : 'Review'}
                        </button>
                      ) : l.approvedDocumentUrl ? (
                        <a href={l.approvedDocumentUrl} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm"><Icon name="eye" size={12} />Doc</a>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {selected && <ActionModal leave={selected} role={role} onClose={r => { setSelected(null); if (r) load(); }} />}
    </div>
  );
}
