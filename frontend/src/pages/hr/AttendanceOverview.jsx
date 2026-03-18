import { useState, useEffect, useCallback } from 'react';
import { useToast } from '../../context/ToastContext';
import { attendanceAPI } from '../../services/api';
import { Icon, Modal, Spinner, fmtDate } from '../../components/common/index.jsx';
import AttendanceTable from './components/AttendanceTable';

export default function AttendanceOverview() {
  const toast = useToast();
  
  // -- Domain Data State --
  const [data, setData] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [pageCount, setPageCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  
  // -- Interface & Pagination State --
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [filters, setFilters] = useState({ month: '', year: new Date().getFullYear().toString() });

  // -- Modal State --
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importForm, setImportForm] = useState({ file: null, startDate: '', endDate: '' });

  // Reset pagination when filters change
  useEffect(() => {
    setPagination(prev => ({ ...prev, pageIndex: 0 }));
  }, [filters.month, filters.year]);

  // -- Infrastructure / Data Fetching --
  const loadSummaries = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = {
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
        month: filters.month || undefined,
        year: filters.year || undefined,
      };

      const response = await attendanceAPI.getAllSummaries(params);
      const payload = response.data;

      if (payload.success) {
        setData(payload.data || []);
        setTotalRecords(payload.total || 0);
        setPageCount(payload.pages || 0);
      }
    } catch (error) {
      toast.error('Failed to fetch attendance summaries. Check network logs.');
    } finally {
      setIsLoading(false);
    }
  }, [pagination.pageIndex, pagination.pageSize, filters, toast]);

  useEffect(() => { loadSummaries(); }, [loadSummaries]);

  // -- Handlers --
  const handleImportSubmit = async (e) => {
    e.preventDefault();
    if (!importForm.file) return toast.error('Please select an Excel/CSV file.');
    if (!importForm.startDate || !importForm.endDate) return toast.error('Start Date and End Date are required.');
    if (new Date(importForm.startDate) > new Date(importForm.endDate)) return toast.error('Start Date cannot be after End Date.');

    setIsImporting(true);
    try {
      const formData = new FormData();
      formData.append('file', importForm.file);
      formData.append('startDate', importForm.startDate);
      formData.append('endDate', importForm.endDate);

      await attendanceAPI.importExcel(formData);
      
      toast.success('Attendance records imported successfully.');
      
      setImportForm({ file: null, startDate: '', endDate: '' });
      setIsImportModalOpen(false);
      loadSummaries(); // Refresh table
    } catch (error) {
      toast.error(error.message || 'Failed to import attendance. Check file format.');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      
      {/* Dashboard Banner */}
      <header className="dashboard-banner flex items-center justify-between flex-wrap gap-16 mb-24">
        <div className="banner-decoration-top" />
        <div className="banner-decoration-bottom" />
        
        <div className="banner-content">
          <p className="banner-subtitle">HR Operations</p>
          <h1 className="banner-title">Monthly Attendance Summaries</h1>
          <p className="banner-date">Manage payroll-ready attendance metrics stored in AttendanceSummary</p>
        </div>
        
        <div className="banner-content">
          <button 
            className="btn" 
            onClick={() => setIsImportModalOpen(true)}
            style={{ background: '#fff', color: 'var(--blue-700)', boxShadow: 'var(--shadow-md)', padding: '12px 24px', fontSize: 14 }}
          >
           <Icon name="plus" size={18} />
            Bulk Import Excel
          </button>
        </div>
      </header>

      {/* Presentational Table Component */}
      <AttendanceTable 
        data={data}
        isLoading={isLoading}
        pageCount={pageCount}
        totalRecords={totalRecords}
        pagination={pagination}
        setPagination={setPagination}
        filters={filters}
        setFilters={setFilters}
      />

      {/* Excel Import Modal */}
      {isImportModalOpen && (
        <Modal 
          title="Import Monthly Attendance" 
          onClose={() => !isImporting && setIsImportModalOpen(false)}
          footer={
            <>
              <button type="button" className="btn btn-secondary" onClick={() => setIsImportModalOpen(false)} disabled={isImporting}>Cancel</button>
              <button type="submit" form="attendance-import-form" className="btn btn-primary" disabled={isImporting || !importForm.file || !importForm.startDate || !importForm.endDate} style={{ minWidth: 120 }}>
                {isImporting ? <Spinner /> : 'Upload & Process'}
              </button>
            </>
          }
        >
          <form id="attendance-import-form" onSubmit={handleImportSubmit} style={{ padding: '10px 0' }}>
            
            <div style={{ marginBottom: 24 }}>
              <span className="section-title" style={{ display: 'block', marginBottom: 16 }}>1. Select Reporting Period</span>
              <div className="grid-2">
                <div className="form-group mb-0">
                  <label className="form-label">Start Date *</label>
                  <input type="date" className="form-control" required value={importForm.startDate} onChange={e => setImportForm(prev => ({ ...prev, startDate: e.target.value }))} />
                </div>
                <div className="form-group mb-0">
                  <label className="form-label">End Date *</label>
                  <input type="date" className="form-control" required value={importForm.endDate} onChange={e => setImportForm(prev => ({ ...prev, endDate: e.target.value }))} />
                </div>
              </div>
            </div>

            <div className="divider" />

            <div>
              <span className="section-title" style={{ display: 'block', marginBottom: 16 }}>2. Upload Roster File</span>
              <div style={{ border: '2px dashed var(--gray-300)', borderRadius: 'var(--radius-lg)', padding: '30px 20px', textAlign: 'center', background: 'var(--gray-50)' }}>
                <div style={{ display: 'inline-flex', background: 'var(--white)', padding: 12, borderRadius: '50%', boxShadow: 'var(--shadow-sm)', marginBottom: 12 }}>
                  <Icon name="upload" size={24} color="var(--blue-500)" />
                </div>
                <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--gray-800)', marginBottom: 6 }}>Select .xlsx or .csv file</h3>
                <p style={{ fontSize: 12, color: 'var(--gray-500)', marginBottom: 16 }}>Ensure headers match the system template (Name, Present, Absent, etc.)</p>
                <input type="file" accept=".xlsx,.xls,.csv" required onChange={e => setImportForm(prev => ({ ...prev, file: e.target.files[0] }))} style={{ fontSize: 12, color: 'var(--gray-600)', width: '100%', maxWidth: 220, margin: '0 auto' }} />
              </div>
            </div>

          </form>
        </Modal>
      )}
    </div>
  );
}