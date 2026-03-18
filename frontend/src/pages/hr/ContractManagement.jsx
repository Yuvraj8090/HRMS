import React, { useState, useEffect } from 'react';
import { useToast } from '../../context/ToastContext';
import { contractAPI, employeeAPI } from '../../services/api';
import { Avatar, Badge, Spinner, fmtDate, Icon, Modal, EmptyState, Skeleton } from '../../components/common/index.jsx';

export default function ContractManagement() {
  const toast = useToast();
  
  // -- Data State --
  const [contracts, setContracts] = useState([]);
  const [employees, setEmployees] = useState([]); // Needed for the dropdown
  const [loading, setLoading] = useState(true);
  
  // -- Modal States --
  const [selectedContract, setSelectedContract] = useState(null); // For Renewals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false); // For New Contracts
  const [isSubmitting, setIsSubmitting] = useState(false);

  // -- Form States --
  const [renewalState, setRenewalState] = useState({ newStartDate: '', newEndDate: '', contractDoc: null });
  const [createState, setCreateState] = useState({ employeeId: '', startDate: '', endDate: '', contractDoc: null });

  useEffect(() => { 
    fetchInitialData(); 
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      // Fetch expiring contracts AND a list of all employees for the dropdown simultaneously
      const [contractsRes, employeesRes] = await Promise.all([
        contractAPI.getExpiring(),
        employeeAPI.getAll({ limit: 1000 }) // Fetching a large limit for the dropdown
      ]);
      
      setContracts(contractsRes.data?.data || []);
      setEmployees(employeesRes.data?.data || []);
    } catch (error) {
      toast.error('Failed to load contract data.');
    } finally {
      setLoading(false);
    }
  };

  // ── Handlers: Renew Existing Contract ─────────────────────────────────────
  const handleRenewSubmit = async (e) => {
    e.preventDefault();
    if (!renewalState.contractDoc) return toast.error('Please upload the signed contract document.');
    if (new Date(renewalState.newStartDate) > new Date(renewalState.newEndDate)) return toast.error('Start date cannot be after the end date.');

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('newStartDate', renewalState.newStartDate);
      formData.append('newEndDate', renewalState.newEndDate);
      formData.append('contractDoc', renewalState.contractDoc);

      await contractAPI.renew(selectedContract._id, formData);
      toast.success('Contract renewed successfully.');
      
      setContracts(prev => prev.filter(c => c._id !== selectedContract._id));
      closeRenewModal();
    } catch (error) {
      toast.error(error.message || 'Failed to renew contract.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Handlers: Create New Contract (Fresh Employee) ────────────────────────
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!createState.employeeId) return toast.error('Please select an employee.');
    if (!createState.contractDoc) return toast.error('Please upload the signed contract document.');
    if (new Date(createState.startDate) > new Date(createState.endDate)) return toast.error('Start date cannot be after the end date.');

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('employeeId', createState.employeeId);
      formData.append('startDate', createState.startDate);
      formData.append('endDate', createState.endDate);
      formData.append('contractDoc', createState.contractDoc);

      await contractAPI.create(formData);
      toast.success('New contract created and assigned successfully.');
      
      closeCreateModal();
    } catch (error) {
      toast.error(error.message || 'Failed to create contract. They may already have an active one.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Modal Controllers ──────────────────────────────────────────────────────
  const openRenewModal = (contract) => {
    setSelectedContract(contract);
    const nextDay = new Date(contract.endDate);
    nextDay.setDate(nextDay.getDate() + 1);
    setRenewalState({ newStartDate: nextDay.toISOString().split('T')[0], newEndDate: '', contractDoc: null });
  };

  const closeRenewModal = () => {
    setSelectedContract(null);
    setRenewalState({ newStartDate: '', newEndDate: '', contractDoc: null });
  };

  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
    setCreateState({ employeeId: '', startDate: '', endDate: '', contractDoc: null });
  };

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      
      {/* Dashboard Banner */}
      <header className="dashboard-banner flex items-center justify-between flex-wrap gap-16 mb-24">
        <div className="banner-decoration-top" />
        <div className="banner-decoration-bottom" />
        <div className="banner-content">
          <p className="banner-subtitle">HR Operations</p>
          <h1 className="banner-title">Contract Management</h1>
          <p className="banner-date">Manage employee agreements and upcoming renewals.</p>
        </div>
        
        <div className="banner-content">
  <button 
    className="btn" 
    onClick={() => setIsCreateModalOpen(true)}
    style={{ 
      background: 'rgb(255, 255, 255)', 
      color: 'var(--blue-700)', 
      boxShadow: 'var(--shadow-md)', 
      padding: '12px 24px', 
      fontSize: '14px' 
    }}
  >
    <Icon name="plus" size={18} />
    Assign New Contract
  </button>
</div>
      </header>

      {/* Expiring Contracts List */}
      <section className="card">
        <header className="card-header">
          <div>
            <h2 className="section-title">Action Required: Expiring Contracts</h2>
            <span className="section-subtitle">{contracts.length} contracts ending within 30 days</span>
          </div>
        </header>
        
        <div className="card-body" style={{ padding: 0 }}>
          {loading ? (
            <div style={{ padding: 20 }}>
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-12" style={{ marginBottom: 20 }}>
                  <Skeleton height={40} width="40px" style={{ borderRadius: '50%' }} />
                  <div style={{ flex: 1 }}>
                    <Skeleton height={14} width="150px" style={{ marginBottom: 8 }} />
                    <Skeleton height={10} width="100px" />
                  </div>
                  <Skeleton height={30} width="80px" style={{ borderRadius: 'var(--radius-md)' }} />
                </div>
              ))}
            </div>
          ) : contracts.length === 0 ? (
            <div style={{ padding: '60px 20px' }}>
              <EmptyState 
                icon="🎉" 
                title="All caught up!" 
                sub="There are no active contracts expiring within the next 30 days." 
              />
            </div>
          ) : (
            <ul className="list-group">
              {contracts.map(contract => {
                const isExpired = new Date(contract.endDate) < new Date();
                const empName = `${contract.employee?.user?.firstName || 'Unknown'} ${contract.employee?.user?.lastName || ''}`.trim();
                
                return (
                  <li key={contract._id} className="list-item" style={{ padding: '16px 20px' }}>
                    <Avatar name={empName} size={42} />
                    <div className="list-item-content">
                      <p className="item-title" style={{ fontSize: 14 }}>{empName}</p>
                      <p className="item-meta" style={{ marginTop: 4 }}>
                        Current End Date: <strong style={{ color: isExpired ? 'var(--red-600)' : 'var(--gray-700)' }}>{fmtDate(contract.endDate)}</strong>
                      </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <Badge label={isExpired ? 'Expired' : 'Expiring Soon'} className={isExpired ? 'badge-red' : 'badge-amber'} />
                      <button onClick={() => openRenewModal(contract)} className="btn btn-primary btn-sm">
                        <Icon name="layers" size={14} /> Renew
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      {/* 1. Modal: Assign NEW Contract */}
      {isCreateModalOpen && (
        <Modal 
          title="Assign Contract to Fresh Employee" 
          onClose={!isSubmitting ? closeCreateModal : undefined}
          footer={
            <>
              <button type="button" className="btn btn-secondary" onClick={closeCreateModal} disabled={isSubmitting}>Cancel</button>
              <button type="submit" form="create-contract-form" className="btn btn-primary" disabled={isSubmitting || !createState.employeeId || !createState.startDate || !createState.endDate || !createState.contractDoc} style={{ minWidth: 140 }}>
                {isSubmitting ? <Spinner /> : 'Create Contract'}
              </button>
            </>
          }
        >
          <div style={{ marginBottom: 20 }}>
            <span className="section-subtitle">Select an employee and upload their finalized agreement.</span>
          </div>

          <form id="create-contract-form" onSubmit={handleCreateSubmit} style={{ paddingBottom: 10 }}>
            
            <div className="form-group">
              <label className="form-label">Select Employee *</label>
              <select 
                className="form-control" 
                required 
                value={createState.employeeId} 
                onChange={e => setCreateState(p => ({ ...p, employeeId: e.target.value }))}
              >
                <option value="">-- Choose Employee --</option>
                {employees.map(emp => (
                  <option key={emp._id} value={emp._id}>
                    {emp.user?.firstName} {emp.user?.lastName} ({emp.employeeId})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Start Date *</label>
                <input type="date" required className="form-control" value={createState.startDate} onChange={e => setCreateState(p => ({ ...p, startDate: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">End Date *</label>
                <input type="date" required className="form-control" value={createState.endDate} onChange={e => setCreateState(p => ({ ...p, endDate: e.target.value }))} />
              </div>
            </div>

            <div className="form-group" style={{ marginTop: 10, marginBottom: 0 }}>
              <label className="form-label">Upload Signed Contract Document *</label>
              <div style={{ border: '2px dashed var(--gray-300)', borderRadius: 'var(--radius-lg)', padding: '24px 20px', textAlign: 'center', background: 'var(--gray-50)', marginTop: 8 }}>
                <div style={{ display: 'inline-flex', background: 'var(--white)', padding: 10, borderRadius: '50%', boxShadow: 'var(--shadow-sm)', marginBottom: 12 }}>
                  <Icon name="file" size={20} color="var(--purple-500)" />
                </div>
                <p style={{ fontSize: 11, color: 'var(--gray-500)', marginBottom: 16 }}>Upload the executed contract (.pdf, .doc, .docx).</p>
                <input type="file" required accept=".pdf,.doc,.docx" onChange={e => setCreateState(p => ({ ...p, contractDoc: e.target.files[0] }))} style={{ fontSize: 12, color: 'var(--gray-600)', width: '100%', maxWidth: 220, margin: '0 auto' }} />
              </div>
            </div>

          </form>
        </Modal>
      )}

      {/* 2. Modal: Renew EXISTING Contract */}
      {selectedContract && (
        <Modal 
          title="Renew Employee Contract" 
          onClose={!isSubmitting ? closeRenewModal : undefined}
          footer={
            <>
              <button type="button" className="btn btn-secondary" onClick={closeRenewModal} disabled={isSubmitting}>Cancel</button>
              <button type="submit" form="renew-contract-form" className="btn btn-primary" disabled={isSubmitting || !renewalState.newStartDate || !renewalState.newEndDate || !renewalState.contractDoc} style={{ minWidth: 140 }}>
                {isSubmitting ? <Spinner /> : 'Finalize Renewal'}
              </button>
            </>
          }
        >
          <div style={{ marginBottom: 20 }}>
            <span className="section-subtitle">
              Drafting a new contract for <strong>{selectedContract.employee?.user?.firstName} {selectedContract.employee?.user?.lastName}</strong>.
            </span>
          </div>

          <form id="renew-contract-form" onSubmit={handleRenewSubmit} style={{ paddingBottom: 10 }}>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">New Start Date *</label>
                <input type="date" required className="form-control" value={renewalState.newStartDate} onChange={e => setRenewalState(p => ({ ...p, newStartDate: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">New End Date *</label>
                <input type="date" required className="form-control" value={renewalState.newEndDate} onChange={e => setRenewalState(p => ({ ...p, newEndDate: e.target.value }))} />
              </div>
            </div>

            <div className="form-group" style={{ marginTop: 10, marginBottom: 0 }}>
              <label className="form-label">Upload Signed Contract Document *</label>
              <div style={{ border: '2px dashed var(--gray-300)', borderRadius: 'var(--radius-lg)', padding: '24px 20px', textAlign: 'center', background: 'var(--gray-50)', marginTop: 8 }}>
                <div style={{ display: 'inline-flex', background: 'var(--white)', padding: 10, borderRadius: '50%', boxShadow: 'var(--shadow-sm)', marginBottom: 12 }}>
                  <Icon name="file" size={20} color="var(--blue-500)" />
                </div>
                <input type="file" required accept=".pdf,.doc,.docx" onChange={e => setRenewalState(p => ({ ...p, contractDoc: e.target.files[0] }))} style={{ fontSize: 12, color: 'var(--gray-600)', width: '100%', maxWidth: 220, margin: '0 auto' }} />
              </div>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}