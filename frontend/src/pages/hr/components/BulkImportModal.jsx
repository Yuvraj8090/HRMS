import { Modal, Spinner, Icon } from '../../../components/common/index.jsx';

export default function BulkImportModal({
  isOpen,
  onClose,
  onSubmit,
  onFileChange,
  isSubmitting,
  file
}) {
  if (!isOpen) return null;

  const footer = (
    <>
      <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
      <button type="submit" form="bulk-import-form" disabled={isSubmitting || !file} className="btn btn-primary" style={{ minWidth: 120 }}>
        {isSubmitting ? <Spinner /> : 'Start Import'}
      </button>
    </>
  );

  return (
    <Modal title="Bulk Import Employees" onClose={onClose} footer={footer}>
      <form id="bulk-import-form" onSubmit={onSubmit} style={{ padding: '10px 0' }}>
        
        <div style={{ 
          border: '2px dashed var(--gray-300)', 
          borderRadius: 'var(--radius-lg)', 
          padding: '40px 20px', 
          textAlign: 'center',
          background: 'var(--gray-50)',
          cursor: 'pointer'
        }}>
          <div style={{ display: 'inline-flex', background: 'var(--white)', padding: 12, borderRadius: '50%', boxShadow: 'var(--shadow-sm)', marginBottom: 16 }}>
            <Icon name="upload" size={24} color="var(--blue-500)" />
          </div>
          
          <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--gray-800)', marginBottom: 8 }}>
            Upload Employee Roster
          </h3>
          <p style={{ fontSize: 12, color: 'var(--gray-500)', marginBottom: 20 }}>
            Supports .csv, .xls, and .xlsx formats. Ensure columns match the system template.
          </p>
          
          <input 
            type="file" 
            onChange={onFileChange} 
            accept=".xlsx,.xls,.csv" 
            required 
            style={{ 
              fontSize: 13, 
              color: 'var(--gray-600)',
              width: '100%',
              maxWidth: 240,
              margin: '0 auto'
            }} 
          />
        </div>

      </form>
    </Modal>
  );
}