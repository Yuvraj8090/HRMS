import React, { useState, useEffect } from 'react';
import { useToast } from '../../context/ToastContext';
import { leaveAPI } from '../../services/api';
import { Spinner, StatCard } from '../../components/common/index.jsx';

export default function LeaveApplication() {
  const toast = useToast();

  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  
  // Real data from DB
  const [categories, setCategories] = useState([]);
  const [balances, setBalances] = useState([]);

  const [formData, setFormData] = useState({
    leaveCategoryId: '', 
    fromDate: '', 
    toDate: '', 
    numberOfDays: '',
    reason: '', 
    stationLeavePermission: 'false', 
    contactDetailsWhileOnLeave: '', 
    leaveLetter: null,
  });

  // Fetch dynamic categories and balances on mount
  useEffect(() => {
    const initData = async () => {
      try {
        const [catRes, balRes] = await Promise.all([
          leaveAPI.getCategories(),
          leaveAPI.getMyBalances().catch(() => ({ data: { data: [] } }))
        ]);
        setCategories(catRes.data?.data || []);
        setBalances(balRes.data?.data || []);
      } catch (err) {
        toast.error('Failed to load leave categories.');
      } finally {
        setFetchingData(false);
      }
    };
    initData();
  }, [toast]);

  // Auto-calculate days when dates change
  useEffect(() => {
    if (formData.fromDate && formData.toDate) {
      const start = new Date(formData.fromDate);
      const end = new Date(formData.toDate);
      if (end >= start) {
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        setFormData(prev => ({ ...prev, numberOfDays: diffDays }));
      }
    }
  }, [formData.fromDate, formData.toDate]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData(prev => ({ ...prev, [name]: files ? files[0] : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // STRICT VALIDATION
    if (!formData.leaveCategoryId) {
      return toast.error('Please select a Leave Type.');
    }
    if (new Date(formData.fromDate) > new Date(formData.toDate)) {
      return toast.error('From Date cannot be after To Date.');
    }

    setLoading(true);
    try {
      const submitData = new FormData();
      Object.keys(formData).forEach(key => {
        if (formData[key] !== null && formData[key] !== '') {
          submitData.append(key, formData[key]);
        }
      });

      await leaveAPI.apply(submitData);
      toast.success('Leave application submitted successfully.');
      
      // Reset form
      setFormData({
        leaveCategoryId: '', fromDate: '', toDate: '', numberOfDays: '',
        reason: '', stationLeavePermission: 'false', contactDetailsWhileOnLeave: '', leaveLetter: null
      });
      const fileInput = document.getElementById('leaveLetterInput');
      if (fileInput) fileInput.value = '';
      
      // Refresh balances
      const balRes = await leaveAPI.getMyBalances();
      setBalances(balRes.data?.data || []);
    } catch (error) {
      toast.error(error.message || 'Failed to submit application.');
    } finally {
      setLoading(false);
    }
  };

  if (fetchingData) {
    return <div className="flex" style={{ minHeight: '50vh', alignItems: 'center', justifyContent: 'center' }}><Spinner large /></div>;
  }

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      
      <header className="dashboard-banner mb-24">
        <div className="banner-decoration-top" />
        <div className="banner-decoration-bottom" />
        <div className="banner-content">
          <p className="banner-subtitle">Employee Workspace</p>
          <h1 className="banner-title">Leave Management</h1>
          <p className="banner-date">Review your balances and submit time-off requests.</p>
        </div>
      </header>

      <div className="grid-2">
        {/* Left Column: Balances */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h2 className="section-title">My Leave Balances ({new Date().getFullYear()})</h2>
          {balances.length === 0 ? (
            <div className="card card-body text-muted text-sm text-center">
              No leave balances initialized for this year.
            </div>
          ) : (
            balances.map(b => (
              <StatCard 
                key={b._id}
                icon="calendar"
                label={b.leaveCategory?.name || 'Leave'}
                value={`${b.currentBalance} Days Left`}
                color="var(--blue-600)"
                bg="var(--blue-50)"
              />
            ))
          )}
        </div>

        {/* Right Column: Application Form */}
        <article className="card">
          <header className="card-header">
            <div>
              <h2 className="section-title">Apply for Leave</h2>
              <span className="section-subtitle">Submit your application well in advance</span>
            </div>
          </header>
          
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Type of Leave *</label>
                  <select 
                    name="leaveCategoryId" 
                    required 
                    className="form-control bg-white" 
                    value={formData.leaveCategoryId} 
                    onChange={handleChange}
                  >
                    <option value="">Select Leave Type...</option>
                    {categories.map(cat => (
                      <option key={cat._id} value={cat._id}>{cat.name} ({cat.code})</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Number of Days *</label>
                  <input type="number" name="numberOfDays" required step="0.5" min="0.5" className="form-control" value={formData.numberOfDays} onChange={handleChange} />
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">From Date *</label>
                  <input type="date" name="fromDate" required className="form-control" value={formData.fromDate} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">To Date *</label>
                  <input type="date" name="toDate" required className="form-control" value={formData.toDate} onChange={handleChange} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Reason for taking leave *</label>
                <textarea name="reason" required rows={3} className="form-control" value={formData.reason} onChange={handleChange} placeholder="Briefly explain your reason..." />
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Station Leave Permission?</label>
                  <select name="stationLeavePermission" className="form-control bg-white" value={formData.stationLeavePermission} onChange={handleChange}>
                    <option value="false">No (Staying in HQ)</option>
                    <option value="true">Yes (Leaving HQ)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Contact while on leave</label>
                  <input type="text" name="contactDetailsWhileOnLeave" className="form-control" value={formData.contactDetailsWhileOnLeave} onChange={handleChange} placeholder="Phone or location..." />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Upload Document (If applicable)</label>
                <input id="leaveLetterInput" type="file" name="leaveLetter" onChange={handleChange} accept=".pdf,.doc,.docx,.jpg,.png" style={{ fontSize: 13, color: 'var(--gray-600)', width: '100%', padding: '10px', border: '1px dashed var(--gray-400)', borderRadius: 'var(--radius-md)', background: 'var(--gray-50)' }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24, borderTop: '1px solid var(--gray-100)', paddingTop: 20 }}>
                <button type="submit" disabled={loading} className="btn btn-primary" style={{ minWidth: 160 }}>
                  {loading ? <Spinner /> : 'Submit Application'}
                </button>
              </div>

            </form>
          </div>
        </article>
      </div>
    </div>
  );
}