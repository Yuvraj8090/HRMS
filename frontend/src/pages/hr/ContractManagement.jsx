import React, { useState, useEffect } from 'react';
import { useToast } from '../../context/ToastContext';
import { contractAPI } from '../../services/api';
import { Avatar, Badge, Spinner, fmtDate } from '../../components/common/index.jsx';

export default function ContractManagement() {
  const { showToast } = useToast();
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedContract, setSelectedContract] = useState(null);
  const [renewalState, setRenewalState] = useState({ newStartDate: '', newEndDate: '', contractDoc: null });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => { fetchExpiringContracts(); }, []);

  const fetchExpiringContracts = async () => {
    try {
      setLoading(true);
      const response = await contractAPI.getExpiring();
      setContracts(response.data?.data || []);
    } catch (error) {
      showToast('Failed to fetch expiring contracts.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRenewSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('newStartDate', renewalState.newStartDate);
      formData.append('newEndDate', renewalState.newEndDate);
      if (renewalState.contractDoc) formData.append('contractDoc', renewalState.contractDoc);

      await contractAPI.renew(selectedContract._id, formData);
      showToast('Contract renewed successfully.', 'success');
      setContracts(contracts.filter(c => c._id !== selectedContract._id));
      setSelectedContract(null);
    } catch (error) {
      showToast(error.message || 'Failed to renew contract.', 'error');
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
          <h1 className="banner-title">Contract Management</h1>
          <p className="banner-date">Review and renew expiring employee contracts.</p>
        </div>
      </header>

      <section className="mb-24">
        <article className="card">
          <header className="card-header">
            <div>
              <h2 className="section-title">Expiring Contracts</h2>
              <span className="section-subtitle">Contracts ending within 30 days</span>
            </div>
          </header>
          
          <div className="card-body">
            {loading ? (
              <div className="flex-center p-32"><Spinner large /></div>
            ) : contracts.length === 0 ? (
              <p className="empty-state">No contracts expiring soon.</p>
            ) : (
              <ul className="list-group">
                {contracts.map(contract => {
                  const isExpired = new Date(contract.endDate) < new Date();
                  return (
                    <li key={contract._id} className="list-item">
                      <Avatar name={`${contract.employee?.user?.firstName} ${contract.employee?.user?.lastName}`} size={40} />
                      <div className="list-item-content">
                        <p className="item-title">{contract.employee?.user?.firstName} {contract.employee?.user?.lastName}</p>
                        <p className="item-meta">Ends: {fmtDate(contract.endDate)}</p>
                      </div>
                      <div className="list-item-actions" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <Badge label={isExpired ? 'Expired' : 'Expiring Soon'} style={{ background: isExpired ? 'var(--red-50)' : 'var(--amber-50)', color: isExpired ? 'var(--red-600)' : 'var(--amber-600)' }} />
                        <button 
                          onClick={() => setSelectedContract(contract)}
                          style={{ padding: '6px 12px', background: 'var(--purple-50)', color: 'var(--purple-600)', borderRadius: '6px', fontWeight: 600, border: 'none', cursor: 'pointer' }}
                        >
                          Renew
                        </button>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </article>
      </section>

      {/* Renewal Modal */}
      {selectedContract && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <article className="card" style={{ width: '100%', maxWidth: '500px' }}>
            <header className="card-header">
              <div>
                <h2 className="section-title">Renew Contract</h2>
                <span className="section-subtitle">{selectedContract.employee?.user?.firstName}'s Contract</span>
              </div>
            </header>
            <div className="card-body" style={{ padding: '20px' }}>
              <form onSubmit={handleRenewSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>New Start Date</label>
                    <input type="date" required value={renewalState.newStartDate} onChange={e => setRenewalState(p => ({...p, newStartDate: e.target.value}))} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--gray-300)' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>New End Date</label>
                    <input type="date" required value={renewalState.newEndDate} onChange={e => setRenewalState(p => ({...p, newEndDate: e.target.value}))} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--gray-300)' }} />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Upload Signed Contract *</label>
                  <input type="file" required onChange={e => setRenewalState(p => ({...p, contractDoc: e.target.files[0]}))} accept=".pdf,.doc,.docx" style={{ width: '100%', padding: '8px', border: '1px dashed var(--gray-400)', borderRadius: '6px' }} />
                </div>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                  <button type="button" onClick={() => setSelectedContract(null)} style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid var(--gray-300)', background: '#fff', cursor: 'pointer' }}>Cancel</button>
                  <button type="submit" disabled={isSubmitting} style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', background: 'var(--purple-600)', color: '#fff', cursor: 'pointer' }}>{isSubmitting ? 'Saving...' : 'Renew Contract'}</button>
                </div>
              </form>
            </div>
          </article>
        </div>
      )}
    </div>
  );
}