import React, { useState, useEffect } from 'react';
import { useToast } from '../../context/ToastContext';
import { leaveAPI } from '../../services/api';
import { Avatar, Badge, Spinner, fmtDate } from '../../components/common/index.jsx';

export default function ManageLeaves() {
  const { showToast } = useToast();
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [processingState, setProcessingState] = useState({ decision: 'Approved', remarks: '', approvalDoc: null });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => { fetchPendingLeaves(); }, []);

  const fetchPendingLeaves = async () => {
    try {
      setLoading(true);
      const response = await leaveAPI.getAllPending();
      setLeaves(response.data?.data || []);
    } catch (error) {
      showToast('Failed to fetch pending leaves.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleProcessSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('decision', processingState.decision);
      formData.append('remarks', processingState.remarks);
      if (processingState.approvalDoc) formData.append('approvalDoc', processingState.approvalDoc);

      await leaveAPI.process(selectedLeave._id, formData);
      showToast(`Leave ${processingState.decision.toLowerCase()} successfully.`, 'success');
      setLeaves(leaves.filter(l => l._id !== selectedLeave._id));
      setSelectedLeave(null);
    } catch (error) {
      showToast(error.message || 'Failed to process leave.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="dashboard-container animate-fade-in">
      <header className="dashboard-banner">
        <div className="banner-decoration-top" />
        <div className="banner-decoration-bottom" />
        <div className="banner-content">
          <p className="banner-subtitle">HR Operations</p>
          <h1 className="banner-title">Manage Leave Applications</h1>
          <p className="banner-date">{leaves.length} pending requests require your attention.</p>
        </div>
      </header>

      <section className="mb-24">
        <article className="card">
          <header className="card-header">
            <div>
              <h2 className="section-title">Pending Approvals</h2>
              <span className="section-subtitle">Review and process employee leaves</span>
            </div>
          </header>
          
          <div className="card-body">
            {loading ? (
              <div className="flex-center p-32"><Spinner large /></div>
            ) : leaves.length === 0 ? (
              <p className="empty-state">No pending leave applications found.</p>
            ) : (
              <ul className="list-group">
                {leaves.map(leave => (
                  <li key={leave._id} className="list-item">
                    <Avatar name={`${leave.employee?.user?.firstName} ${leave.employee?.user?.lastName}`} size={40} />
                    <div className="list-item-content">
                      <p className="item-title">{leave.employee?.user?.firstName} {leave.employee?.user?.lastName}</p>
                      <p className="item-meta">
                        {leave.leaveCategory?.name} · {leave.numberOfDays} Days · {fmtDate(leave.fromDate)} to {fmtDate(leave.toDate)}
                      </p>
                    </div>
                    <div className="list-item-actions" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <Badge label={leave.status} />
                      <button 
                        onClick={() => setSelectedLeave(leave)}
                        style={{ padding: '6px 12px', background: 'var(--blue-50)', color: 'var(--blue-600)', borderRadius: '6px', fontWeight: 600, border: 'none', cursor: 'pointer' }}
                      >
                        Process
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </article>
      </section>

      {/* Simplified Modal logic using standard HTML overlays since no Modal component was provided in common */}
      {selectedLeave && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <article className="card" style={{ width: '100%', maxWidth: '500px' }}>
            <header className="card-header">
              <div>
                <h2 className="section-title">Process Leave</h2>
                <span className="section-subtitle">{selectedLeave.employee?.user?.firstName}'s Request</span>
              </div>
            </header>
            <div className="card-body" style={{ padding: '20px' }}>
              <form onSubmit={handleProcessSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Decision</label>
                  <select value={processingState.decision} onChange={e => setProcessingState(p => ({...p, decision: e.target.value}))} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--gray-300)' }}>
                    <option value="Approved">Approve</option>
                    <option value="Rejected">Reject</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>HR Remarks</label>
                  <textarea required rows="3" value={processingState.remarks} onChange={e => setProcessingState(p => ({...p, remarks: e.target.value}))} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--gray-300)' }} />
                </div>
                {processingState.decision === 'Approved' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Upload Approval Doc</label>
                    <input type="file" onChange={e => setProcessingState(p => ({...p, approvalDoc: e.target.files[0]}))} style={{ width: '100%', padding: '8px', border: '1px dashed var(--gray-400)', borderRadius: '6px' }} />
                  </div>
                )}
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                  <button type="button" onClick={() => setSelectedLeave(null)} style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid var(--gray-300)', background: '#fff', cursor: 'pointer' }}>Cancel</button>
                  <button type="submit" disabled={isSubmitting} style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', background: 'var(--blue-600)', color: '#fff', cursor: 'pointer' }}>{isSubmitting ? 'Saving...' : 'Confirm'}</button>
                </div>
              </form>
            </div>
          </article>
        </div>
      )}
    </div>
  );
}