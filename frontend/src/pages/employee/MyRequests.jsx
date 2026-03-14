// src/pages/employee/MyRequests.jsx
import { useState, useEffect, useCallback } from 'react';
import { requestAPI } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Badge, Modal, Spinner, EmptyState, Icon, fmtDate, currency } from '../../components/common/index.jsx';

function IncrementModal({ onClose }) {
  const toast = useToast();
  const [form, setForm] = useState({ requestedSalary: '', requestNotes: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.requestedSalary) e.requestedSalary = 'Salary is required';
    if (form.requestNotes.length < 20) e.requestNotes = 'Minimum 20 characters';
    return e;
  };

  const submit = async () => {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      await requestAPI.submitIncrement({ requestedSalary: Number(form.requestedSalary), requestNotes: form.requestNotes });
      toast.success('Increment request submitted!');
      onClose(true);
    } catch (e) { toast.error(e.message); }
    setLoading(false);
  };

  return (
    <Modal title="Request Salary Increment" onClose={() => onClose(false)}
      footer={<>
        <button className="btn btn-secondary" onClick={() => onClose(false)}>Cancel</button>
        <button className="btn btn-primary" onClick={submit} disabled={loading}>
          {loading ? <><Spinner/> Submitting…</> : 'Submit'}
        </button>
      </>}>
      <div className="form-group">
        <label className="form-label">Requested Annual Salary (₹)</label>
        <input type="number" className={`form-control ${errors.requestedSalary ? 'error' : ''}`}
          placeholder="e.g. 1200000" value={form.requestedSalary}
          onChange={e => { setForm(p => ({ ...p, requestedSalary: e.target.value })); setErrors(p => ({ ...p, requestedSalary: '' })); }}/>
        {errors.requestedSalary && <div className="form-error">{errors.requestedSalary}</div>}
      </div>
      <div className="form-group">
        <label className="form-label">Justification</label>
        <textarea className={`form-control ${errors.requestNotes ? 'error' : ''}`} rows={5}
          placeholder="Describe achievements and reasons..." value={form.requestNotes}
          onChange={e => { setForm(p => ({ ...p, requestNotes: e.target.value })); setErrors(p => ({ ...p, requestNotes: '' })); }}/>
        {errors.requestNotes && <div className="form-error">{errors.requestNotes}</div>}
      </div>
    </Modal>
  );
}

export default function MyRequests() {
  const [requests, setRequests] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [showModal, setShowModal] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await requestAPI.getMy();
      setRequests(data.data || []);
    } catch { setRequests([]); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const hasPending = requests.some(r => ['Pending', 'Under Review'].includes(r.status));

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <div className="flex justify-between items-start flex-wrap gap-16 mb-24">
        <div>
          <h2 className="page-title">My Requests</h2>
          <p className="page-sub">Track your increment and appraisal requests</p>
        </div>
        <button className="btn btn-primary" disabled={hasPending} onClick={() => setShowModal(true)}>
          <Icon name="plus" size={15}/>
          {hasPending ? 'Request Pending' : 'New Request'}
        </button>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="section-title">All Requests</span>
          <span style={{ fontSize: 12, color: 'var(--gray-400)' }}>{requests.length} total</span>
        </div>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spinner large/></div>
        ) : requests.length === 0 ? (
          <EmptyState icon="📝" title="No requests yet" sub="Submit your first increment request." action={
            <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}><Icon name="plus" size={13}/>New Request</button>
          }/>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Submitted</th>
                  <th>Current Salary</th>
                  <th>Requested</th>
                  <th>Approved</th>
                  <th>Status</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {requests.map(r => (
                  <tr key={r._id}>
                    <td><span style={{ fontWeight: 600 }}>{r.type}</span></td>
                    <td>{fmtDate(r.createdAt)}</td>
                    <td>{r.increment?.currentSalary ? currency(r.increment.currentSalary) : '—'}</td>
                    <td>{r.increment?.requestedSalary ? <span style={{ fontWeight: 700 }}>{currency(r.increment.requestedSalary)}</span> : '—'}</td>
                    <td>{r.increment?.approvedSalary ? <span className="text-green" style={{ fontWeight: 700 }}>{currency(r.increment.approvedSalary)}</span> : '—'}</td>
                    <td><Badge label={r.status}/></td>
                    <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 12, color: 'var(--gray-500)' }}>{r.decisionNotes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && <IncrementModal onClose={(reload) => { setShowModal(false); if (reload) load(); }}/>}
    </div>
  );
}
