import React, { useState, useEffect } from 'react';
import { useToast } from '../../context/ToastContext';
import { leaveAPI } from '../../services/api';
import { Avatar, Badge, Spinner, fmtDate, Icon, Modal, EmptyState } from '../../components/common/index.jsx';

export default function ManageLeaves() {
  const toast = useToast();
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [selectedLeave, setSelectedLeave] = useState(null);
  // Fixed state to use 'decision' and perfectly match backend expectations
  const [processingState, setProcessingState] = useState({ decision: 'Approved', remarks: '', approvalDoc: null });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => { fetchPendingLeaves(); }, []);

  const fetchPendingLeaves = async () => {
    try {
      setLoading(true);
      const response = await leaveAPI.getAllPending();
      setLeaves(response.data?.data || []);
    } catch (error) {
      toast.error('Failed to fetch pending leaves.');
    } finally {
      setLoading(false);
    }
  };

  const handleProcessSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      // Send 'decision' as the key to match backend: const { decision, remarks } = req.body;
      formData.append('decision', processingState.decision); 
      formData.append('remarks', processingState.remarks);
      if (processingState.approvalDoc) {
        formData.append('approvalDocument', processingState.approvalDoc);
      }

      await leaveAPI.process(selectedLeave._id, formData);
      toast.success(`Leave ${processingState.decision.toLowerCase()} successfully.`);
      
      setLeaves(prev => prev.filter(l => l._id !== selectedLeave._id));
      closeModal();
    } catch (error) {
      toast.error(error.message || 'Failed to process leave.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openModal = (leave) => {
    setSelectedLeave(leave);
    setProcessingState({ decision: 'Approved', remarks: '', approvalDoc: null });
  };

  const closeModal = () => {
    setSelectedLeave(null);
  };

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      
      <header className="dashboard-banner mb-24">
        <div className="banner-decoration-top" />
        <div className="banner-decoration-bottom" />
        <div className="banner-content">
          <p className="banner-subtitle">HR Operations</p>
          <h1 className="banner-title">Manage Leave Applications</h1>
          <p className="banner-date">{leaves.length} pending requests require your attention.</p>
        </div>
      </header>

      <section className="card">
        <header className="card-header">
          <div>
            <h2 className="section-title">Pending Approvals</h2>
            <span className="section-subtitle">Review and process employee leaves</span>
          </div>
        </header>
        
        <div className="card-body" style={{ padding: 0 }}>
          {loading ? (
            <div className="flex-center p-32"><Spinner large /></div>
          ) : leaves.length === 0 ? (
            <div style={{ padding: '60px 20px' }}>
              <EmptyState 
                icon="🌴" 
                title="Inbox Zero!" 
                sub="There are no pending leave requests to process at this time."
              />
            </div>
          ) : (
            <ul className="list-group">
              {leaves.map(leave => {
                const empName = `${leave.employee?.user?.firstName || ''} ${leave.employee?.user?.lastName || ''}`.trim();
                return (
                  <li key={leave._id} className="list-item" style={{ padding: '16px 20px' }}>
                    <Avatar name={empName} size={42} />
                    <div className="list-item-content">
                      <p className="item-title" style={{ fontSize: 14 }}>{empName}</p>
                      <p className="item-meta" style={{ marginTop: 4 }}>
                        <strong style={{ color: 'var(--gray-700)' }}>{leave.leaveCategory?.name}</strong> · {leave.numberOfDays} Days · {fmtDate(leave.fromDate)} to {fmtDate(leave.toDate)}
                      </p>
                      {leave.leaveLetterUrl && (
                        <a 
                          href={`${import.meta.env.VITE_API_URL?.replace('/api', '')}/${leave.leaveLetterUrl}`} 
                          target="_blank" rel="noopener noreferrer"
                          style={{ fontSize: 11, color: 'var(--blue-600)', display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 6 }}
                        >
                          <Icon name="file" size={12} /> View Attached Document
                        </a>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <Badge label={leave.status} className="badge-amber" />
                      <button onClick={() => openModal(leave)} className="btn btn-secondary btn-sm">
                        Process
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      {/* Process Leave Modal */}
      {selectedLeave && (
        <Modal 
          title="Process Leave Request" 
          onClose={!isSubmitting ? closeModal : undefined}
          footer={
            <>
              <button type="button" className="btn btn-secondary" onClick={closeModal} disabled={isSubmitting}>Cancel</button>
              <button type="submit" form="process-leave-form" className="btn btn-primary" disabled={isSubmitting || !processingState.remarks} style={{ minWidth: 120 }}>
                {isSubmitting ? <Spinner /> : 'Confirm'}
              </button>
            </>
          }
        >
          <div style={{ marginBottom: 20 }}>
            <span className="section-subtitle">
              Reviewing request for <strong>{selectedLeave.employee?.user?.firstName} {selectedLeave.employee?.user?.lastName}</strong>.
            </span>
            <div style={{ background: 'var(--gray-50)', padding: 12, borderRadius: 'var(--radius-md)', marginTop: 12, fontSize: 13, color: 'var(--gray-700)' }}>
              <strong>Reason provided:</strong> {selectedLeave.reason}
            </div>
          </div>

          <form id="process-leave-form" onSubmit={handleProcessSubmit} style={{ paddingBottom: 10 }}>
            
            <div className="form-group">
              <label className="form-label">Decision *</label>
              <select 
                className="form-control bg-white" 
                value={processingState.decision} 
                onChange={e => setProcessingState(p => ({ ...p, decision: e.target.value }))}
              >
                {/* Values are strictly capitalized now */}
                <option value="Approved">Approve Request</option>
                <option value="Rejected">Reject Request</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">HR Remarks *</label>
              <textarea 
                required 
                rows="3" 
                className="form-control"
                placeholder="Reason for approval or rejection..."
                value={processingState.remarks} 
                onChange={e => setProcessingState(p => ({ ...p, remarks: e.target.value }))} 
              />
            </div>

            {processingState.decision === 'Approved' && (
              <div className="form-group mb-0" style={{ marginTop: 16 }}>
                <label className="form-label">Upload Approval Document (Optional)</label>
                <input 
                  type="file" 
                  onChange={e => setProcessingState(p => ({ ...p, approvalDoc: e.target.files[0] }))} 
                  style={{ fontSize: 13, color: 'var(--gray-600)', width: '100%', padding: '8px', border: '1px dashed var(--gray-400)', borderRadius: 'var(--radius-md)' }} 
                />
              </div>
            )}
          </form>
        </Modal>
      )}
    </div>
  );
}