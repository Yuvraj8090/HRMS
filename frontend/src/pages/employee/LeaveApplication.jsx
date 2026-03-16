import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { leaveAPI } from '../../services/api';
import { Spinner } from '../../components/common/index.jsx';

export default function LeaveApplication() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(false);
  const [categories] = useState([
    { _id: 'CL_ID', code: 'CL', name: 'Casual Leave' },
    { _id: 'PL_ID', code: 'PL', name: 'Privilege Leave' },
    { _id: 'RL_ID', code: 'RL', name: 'Restricted Leave' },
    { _id: 'LWP_ID', code: 'LWP', name: 'Leave Without Pay' },
    { _id: 'MED_ID', code: 'MEDICAL', name: 'Medical Leave' },
  ]);

  const [formData, setFormData] = useState({
    leaveCategoryId: '', fromDate: '', toDate: '', numberOfDays: '',
    reason: '', stationLeavePermission: 'false', contactDetailsWhileOnLeave: '', leaveLetter: null,
  });

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData((prev) => ({ ...prev, [name]: files ? files[0] : value }));
  };

  useEffect(() => {
    if (formData.fromDate && formData.toDate) {
      const diffTime = Math.abs(new Date(formData.toDate) - new Date(formData.fromDate));
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      if (diffDays > 0) setFormData((prev) => ({ ...prev, numberOfDays: diffDays }));
    }
  }, [formData.fromDate, formData.toDate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const submitData = new FormData();
      Object.keys(formData).forEach(key => {
        if (formData[key] !== null) submitData.append(key, formData[key]);
      });

      await leaveAPI.apply(submitData);
      showToast('Leave application submitted successfully.', 'success');
      setFormData({
        leaveCategoryId: '', fromDate: '', toDate: '', numberOfDays: '',
        reason: '', stationLeavePermission: 'false', contactDetailsWhileOnLeave: '', leaveLetter: null
      });
      document.getElementById('leaveLetterInput').value = '';
    } catch (error) {
      showToast(error.message || 'Failed to submit application.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-container animate-fade-in">
      <header className="dashboard-banner">
        <div className="banner-decoration-top" />
        <div className="banner-decoration-bottom" />
        <div className="banner-content">
          <p className="banner-subtitle">Employee Workspace</p>
          <h1 className="banner-title">Apply for Leave</h1>
          <p className="banner-date">Submit your application well in advance.</p>
        </div>
      </header>

      <section className="mb-24">
        <article className="card" style={{ maxWidth: '800px', margin: '0 auto' }}>
          <header className="card-header">
            <div>
              <h2 className="section-title">Leave Details</h2>
              <span className="section-subtitle">Fill out the required information</span>
            </div>
          </header>
          
          <div className="card-body" style={{ padding: '24px' }}>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--gray-700)' }}>Type of Leave *</label>
                  <select name="leaveCategoryId" required value={formData.leaveCategoryId} onChange={handleChange} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--gray-300)' }}>
                    <option value="" disabled>Select Leave Type...</option>
                    {categories.map((cat) => <option key={cat.code} value={cat._id}>{cat.name} ({cat.code})</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--gray-700)' }}>Number of Days *</label>
                  <input type="number" name="numberOfDays" required step="0.5" min="0.5" value={formData.numberOfDays} onChange={handleChange} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--gray-300)' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--gray-700)' }}>From Date *</label>
                  <input type="date" name="fromDate" required value={formData.fromDate} onChange={handleChange} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--gray-300)' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--gray-700)' }}>To Date *</label>
                  <input type="date" name="toDate" required value={formData.toDate} onChange={handleChange} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--gray-300)' }} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--gray-700)' }}>Reasons for taking leave *</label>
                <textarea name="reason" required rows={3} value={formData.reason} onChange={handleChange} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--gray-300)' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--gray-700)' }}>Station Leave Permission?</label>
                  <select name="stationLeavePermission" value={formData.stationLeavePermission} onChange={handleChange} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--gray-300)' }}>
                    <option value="false">No</option>
                    <option value="true">Yes</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--gray-700)' }}>Contact while on leave</label>
                  <input type="text" name="contactDetailsWhileOnLeave" value={formData.contactDetailsWhileOnLeave} onChange={handleChange} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--gray-300)' }} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--gray-700)' }}>Upload Leave Application (Optional)</label>
                <input id="leaveLetterInput" type="file" name="leaveLetter" onChange={handleChange} accept=".pdf,.doc,.docx,.jpg,.png" style={{ width: '100%', padding: '8px', border: '1px dashed var(--gray-400)', borderRadius: '6px', background: 'var(--gray-50)' }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px', borderTop: '1px solid var(--gray-200)', paddingTop: '20px' }}>
                <button type="submit" disabled={loading} style={{ background: 'var(--blue-600)', color: '#fff', padding: '10px 20px', borderRadius: '6px', fontWeight: 600, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {loading && <Spinner />} {loading ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </form>
          </div>
        </article>
      </section>
    </div>
  );
}