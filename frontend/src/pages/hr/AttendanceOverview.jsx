import React, { useState, useEffect } from 'react';
import { useToast } from '../../context/ToastContext';
import { attendanceAPI } from '../../services/api';
import { Avatar, Badge, Spinner, fmtDate } from '../../components/common/index.jsx';

export default function AttendanceOverview() {
  const toast = useToast();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [excelFile, setExcelFile] = useState(null);
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => { fetchTodayOverview(); }, []);

  const fetchTodayOverview = async () => {
    try {
      setLoading(true);
      const response = await attendanceAPI.getDailyOverview();
      setRecords(response.data?.data || []);
    } catch (error) {
      // FIX: Updated to use the correct toast method
      toast.error('Failed to fetch today\'s attendance.');
    } finally {
      setLoading(false);
    }
  };

  const handleImportSubmit = async (e) => {
    e.preventDefault();
    if (!excelFile) return toast.error('Please select a file first.'); // FIX applied here

    setIsImporting(true);
    try {
      const formData = new FormData();
      formData.append('file', excelFile);
      await attendanceAPI.importExcel(formData);
      
      // FIX: Updated to use toast.success
      toast.success('Attendance imported successfully.');
      
      setExcelFile(null);
      setIsImportModalOpen(false);
      fetchTodayOverview();
    } catch (error) {
      // FIX: Updated to use toast.error
      toast.error(error.message || 'Failed to import attendance.');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="dashboard-container animate-fade-in">
      <header className="dashboard-banner" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingRight: '40px' }}>
        <div className="banner-decoration-top" />
        <div className="banner-decoration-bottom" />
        <div className="banner-content">
          <p className="banner-subtitle">HR Operations</p>
          <h1 className="banner-title">Daily Attendance</h1>
          <p className="banner-date">{fmtDate(new Date())}</p>
        </div>
        <div style={{ zIndex: 10 }}>
          <button 
            onClick={() => setIsImportModalOpen(true)}
            style={{ background: '#fff', color: 'var(--green-600)', padding: '10px 20px', borderRadius: '6px', fontWeight: 600, border: 'none', cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
          >
            + Import Excel
          </button>
        </div>
      </header>

      <section className="mb-24">
        <article className="card">
          <header className="card-header">
            <div>
              <h2 className="section-title">Today's Roster</h2>
              <span className="section-subtitle">Real-time clock-ins and outs</span>
            </div>
          </header>
          
          <div className="card-body">
            {loading ? (
              <div className="flex-center p-32"><Spinner large /></div>
            ) : records.length === 0 ? (
              <p className="empty-state">No attendance records for today.</p>
            ) : (
              <ul className="list-group">
                {records.map(record => (
                  <li key={record._id} className="list-item">
                    <Avatar name={`${record.employee?.firstName} ${record.employee?.lastName}`} size={40} />
                    <div className="list-item-content">
                      <p className="item-title">{record.employee?.firstName} {record.employee?.lastName}</p>
                      <p className="item-meta">
                        In: {record.clockIn ? new Date(record.clockIn).toLocaleTimeString() : '--:--'} | 
                        Out: {record.clockOut ? new Date(record.clockOut).toLocaleTimeString() : '--:--'}
                      </p>
                    </div>
                    <div className="list-item-actions">
                      <Badge label={record.status} style={{ background: record.status === 'Present' ? 'var(--green-50)' : 'var(--red-50)', color: record.status === 'Present' ? 'var(--green-600)' : 'var(--red-600)' }} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </article>
      </section>

      {/* Import Modal */}
      {isImportModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <article className="card" style={{ width: '100%', maxWidth: '400px' }}>
            <header className="card-header">
              <div>
                <h2 className="section-title">Bulk Import</h2>
                <span className="section-subtitle">Upload .xlsx or .csv</span>
              </div>
            </header>
            <div className="card-body" style={{ padding: '20px' }}>
              <form onSubmit={handleImportSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <input type="file" onChange={e => setExcelFile(e.target.files[0])} accept=".xlsx,.xls,.csv" style={{ width: '100%', padding: '20px', border: '2px dashed var(--gray-300)', borderRadius: '6px', textAlign: 'center' }} />
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                  <button type="button" onClick={() => setIsImportModalOpen(false)} style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid var(--gray-300)', background: '#fff', cursor: 'pointer' }}>Cancel</button>
                  <button type="submit" disabled={isImporting || !excelFile} style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', background: 'var(--green-600)', color: '#fff', cursor: 'pointer' }}>{isImporting ? 'Processing...' : 'Upload'}</button>
                </div>
              </form>
            </div>
          </article>
        </div>
      )}
    </div>
  );
}