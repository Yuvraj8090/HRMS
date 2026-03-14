// src/pages/hr/PendingRequests.jsx
import { useState, useEffect, useCallback } from 'react';
import { requestAPI } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Badge, Modal, Spinner, EmptyState, Avatar, Icon, fmtDate, currency } from '../../components/common/index.jsx';

function ActionModal({ request, onClose }) {
  const toast = useToast();
  const [form, setForm] = useState({ status: 'Approved', decisionNotes: '', approvedSalary: '' });
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    try {
      const payload = { status: form.status, decisionNotes: form.decisionNotes };
      if (form.status === 'Approved' && request.type === 'Increment') {
        payload.approvedSalary = Number(form.approvedSalary) || request.increment?.requestedSalary;
      }
      await requestAPI.updateStatus(request._id, payload);
      toast.success(`Request ${form.status.toLowerCase()} successfully!`);
      onClose(true);
    } catch (e) { toast.error(e.message); }
    setLoading(false);
  };

  const emp = request.requestedBy;
  const inc = request.increment;

  return (
    <Modal title="Review Request" onClose={() => onClose(false)}
      footer={<>
        <button className="btn btn-secondary" onClick={() => onClose(false)}>Cancel</button>
        <button
          className={`btn ${form.status === 'Approved' ? 'btn-success' : 'btn-danger'}`}
          onClick={submit} disabled={loading}
        >
          {loading ? <Spinner/> : form.status === 'Approved' ? <><Icon name="check" size={14}/>Approve</> : <><Icon name="x" size={14}/>Reject</>}
        </button>
      </>}
    >
      {/* Employee info */}
      <div style={{ background: 'var(--gray-50)', borderRadius: 'var(--radius-md)', padding: '14px 16px', marginBottom: 18 }}>
        <div className="flex items-center gap-12 mb-12">
          <Avatar name={`${emp?.firstName} ${emp?.lastName}`} size={40}/>
          <div>
            <div style={{ fontWeight: 700, color: 'var(--gray-900)', fontSize: 15 }}>{emp?.firstName} {emp?.lastName}</div>
            <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>{emp?.email}</div>
          </div>
        </div>
        {inc && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div style={{ background: 'var(--white)', borderRadius: 8, padding: '10px 12px', border: '1px solid var(--gray-200)' }}>
              <div style={{ fontSize: 10, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>Current</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--gray-900)' }}>{currency(inc.currentSalary)}</div>
            </div>
            <div style={{ background: 'var(--blue-50)', borderRadius: 8, padding: '10px 12px', border: '1px solid var(--blue-100)' }}>
              <div style={{ fontSize: 10, color: 'var(--blue-500)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>Requested</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--blue-700)' }}>{currency(inc.requestedSalary)}</div>
            </div>
          </div>
        )}
        <div style={{ marginTop: 10, fontSize: 12, color: 'var(--gray-600)', lineHeight: 1.5 }}>
          <strong>Notes:</strong> {request.requestNotes}
        </div>
      </div>

      {/* Decision */}
      <div className="form-group">
        <label className="form-label">Decision</label>
        <select className="form-control" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
          <option value="Approved">Approve</option>
          <option value="Rejected">Reject</option>
          <option value="Under Review">Mark Under Review</option>
        </select>
      </div>

      {form.status === 'Approved' && request.type === 'Increment' && (
        <div className="form-group">
          <label className="form-label">Approved Salary (₹) — leave blank to use requested</label>
          <input type="number" className="form-control"
            placeholder={inc?.requestedSalary?.toString() || ''}
            value={form.approvedSalary}
            onChange={e => setForm(p => ({ ...p, approvedSalary: e.target.value }))}/>
        </div>
      )}

      <div className="form-group">
        <label className="form-label">Decision Notes</label>
        <textarea className="form-control" rows={3}
          placeholder="Add a note for the employee..."
          value={form.decisionNotes}
          onChange={e => setForm(p => ({ ...p, decisionNotes: e.target.value }))}/>
      </div>
    </Modal>
  );
}

export default function PendingRequests() {
  const [requests, setRequests] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [selected, setSelected] = useState(null);
  const [typeFilter, setTypeFilter] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (typeFilter) params.type = typeFilter;
      const { data } = await requestAPI.getPending(params);
      setRequests(data.data || []);
    } catch { setRequests([]); }
    setLoading(false);
  }, [typeFilter]);

  useEffect(() => { load(); }, [load]);

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <div className="flex justify-between items-start flex-wrap gap-16 mb-24">
        <div>
          <h2 className="page-title">Pending Requests</h2>
          <p className="page-sub">Review and action employee requests</p>
        </div>
        <div className="flex gap-8">
          {['', 'Increment', 'Appraisal'].map(t => (
            <button key={t} className={`btn btn-sm ${typeFilter === t ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setTypeFilter(t)}>
              {t || 'All Types'}
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="section-title">Awaiting Action</span>
          <span style={{ fontSize: 12, color: 'var(--gray-400)' }}>{requests.length} requests</span>
        </div>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spinner large/></div>
        ) : requests.length === 0 ? (
          <EmptyState icon="✅" title="All clear!" sub="No pending requests at this time."/>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Type</th>
                  <th>Submitted</th>
                  <th>Current Salary</th>
                  <th>Requested</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {requests.map(r => (
                  <tr key={r._id}>
                    <td>
                      <div className="flex items-center gap-8">
                        <Avatar name={`${r.requestedBy?.firstName} ${r.requestedBy?.lastName}`} size={30}/>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--gray-900)', fontSize: 13 }}>{r.requestedBy?.firstName} {r.requestedBy?.lastName}</div>
                          <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>{r.requestedBy?.email}</div>
                        </div>
                      </div>
                    </td>
                    <td><span style={{ fontWeight: 600 }}>{r.type}</span></td>
                    <td style={{ fontSize: 12 }}>{fmtDate(r.createdAt)}</td>
                    <td style={{ fontSize: 12 }}>{r.increment?.currentSalary ? currency(r.increment.currentSalary) : '—'}</td>
                    <td style={{ fontWeight: 700 }}>{r.increment?.requestedSalary ? currency(r.increment.requestedSalary) : '—'}</td>
                    <td><Badge label={r.status}/></td>
                    <td>
                      <button className="btn btn-primary btn-sm" onClick={() => setSelected(r)}>
                        <Icon name="edit" size={12}/>Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected && <ActionModal request={selected} onClose={(reload) => { setSelected(null); if (reload) load(); }}/>}
    </div>
  );
}
