import { useState, useEffect } from 'react';
import { departmentAPI } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Modal, Spinner, EmptyState, Icon, ConfirmDialog, Skeleton } from '../../components/common/index.jsx';

// ── Department Form Modal ──────────────────────────────────────────────────
function DeptModal({ dept, onClose }) {
  const toast = useToast();
  const [form, setForm] = useState({ 
    name: dept?.name || '', 
    code: dept?.code || '', 
    description: dept?.description || '' 
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors]   = useState({});

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Department name is required';
    if (!form.code.trim()) e.code = 'Department code is required';
    return e;
  };

  const submit = async () => {
    const errs = validate();
    if (Object.keys(errs).length) { 
      setErrors(errs); 
      return; 
    }
    
    setLoading(true);
    try {
      if (dept) { 
        await departmentAPI.update(dept._id, form); 
        toast.success('Department updated successfully!'); 
      } else { 
        await departmentAPI.create(form);          
        toast.success('New department created!'); 
      }
      onClose(true); // pass true to trigger reload
    } catch (e) { 
      toast.error(e.message || 'Failed to save department.'); 
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal 
      title={dept ? 'Edit Department' : 'Create New Department'} 
      onClose={() => onClose(false)}
      footer={
        <>
          <button className="btn btn-secondary" onClick={() => onClose(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={submit} disabled={loading} style={{ minWidth: 100 }}>
            {loading ? <Spinner /> : (dept ? 'Save Changes' : 'Create')}
          </button>
        </>
      }
    >
      <div style={{ animation: 'fadeIn 0.2s ease', padding: '10px 0' }}>
        <div className="form-group">
          <label className="form-label">Department Name *</label>
          <input 
            className={`form-control ${errors.name ? 'error' : ''}`} 
            placeholder="e.g. Engineering & Development"
            value={form.name} 
            onChange={e => { 
              setForm(p => ({ ...p, name: e.target.value })); 
              if (errors.name) setErrors(p => ({ ...p, name: '' })); 
            }}
          />
          {errors.name && <div className="form-error">{errors.name}</div>}
        </div>
        
        <div className="form-group">
          <label className="form-label">Unit Code *</label>
          <input 
            className={`form-control ${errors.code ? 'error' : ''}`} 
            placeholder="e.g. ENG-01" 
            style={{ textTransform: 'uppercase', fontFamily: 'monospace' }}
            value={form.code} 
            onChange={e => { 
              setForm(p => ({ ...p, code: e.target.value.toUpperCase() })); 
              if (errors.code) setErrors(p => ({ ...p, code: '' })); 
            }}
          />
          {errors.code && <div className="form-error">{errors.code}</div>}
          <span style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 4, display: 'block' }}>
            A short, unique identifier for system references.
          </span>
        </div>
        
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Description (Optional)</label>
          <textarea 
            className="form-control" 
            rows={3} 
            placeholder="Briefly describe the functions of this unit..."
            value={form.description} 
            onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
          />
        </div>
      </div>
    </Modal>
  );
}

// ── Main Page Component ────────────────────────────────────────────────────
export default function DepartmentsPage() {
  const toast = useToast();
  const [depts, setDepts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal & Dialog States
  const [showModal, setShowModal] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  const [deletingDept, setDeletingDept] = useState(null);

  const loadDirectory = async () => {
    setLoading(true);
    try {
      const { data } = await departmentAPI.getAll();
      setDepts(data.data || []);
    } catch { 
      toast.error("Failed to load departments.");
      setDepts([]); 
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadDirectory(); }, []);

  const handleDelete = async () => {
    try {
      await departmentAPI.delete(deletingDept._id);
      toast.success(`${deletingDept.name} archived successfully.`);
      setDeletingDept(null);
      loadDirectory();
    } catch (e) { 
      toast.error(e.message || "Failed to delete department."); 
    }
  };

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      
      {/* Page Header */}
      <header className="flex items-center justify-between flex-wrap gap-16 mb-24">
        <div>
          <p className="page-sub">Manage departments and codes · {depts.length} active units</p>
        </div>
        <button 
          className="btn btn-primary" 
          onClick={() => { setEditingDept(null); setShowModal(true); }}
        >
          <Icon name="plus" size={16} />
          <span>Add Department</span>
        </button>
      </header>

      {/* Content Area */}
      {loading ? (
        // UI Enhancement: Skeleton Grid Loading
        <div className="grid-auto">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={`skeleton-${i}`} className="card">
              <div className="card-body">
                <div className="flex justify-between items-start mb-16">
                  <Skeleton height={46} width="46px" style={{ borderRadius: 'var(--radius-md)' }} />
                  <Skeleton height={22} width="60px" style={{ borderRadius: 'var(--radius-full)' }} />
                </div>
                <Skeleton height={20} width="70%" style={{ marginBottom: 12 }} />
                <Skeleton height={12} width="100%" style={{ marginBottom: 8 }} />
                <Skeleton height={12} width="80%" />
              </div>
              <div style={{ padding: '14px 20px', borderTop: '1px solid var(--gray-100)', display: 'flex', gap: 10 }}>
                <Skeleton height={32} width="50%" style={{ borderRadius: 'var(--radius-md)' }} />
                <Skeleton height={32} width="50%" style={{ borderRadius: 'var(--radius-md)' }} />
              </div>
            </div>
          ))}
        </div>
      ) : depts.length === 0 ? (
        // Empty State
        <div className="card" style={{ padding: '60px 20px' }}>
          <EmptyState 
            icon="🏢" 
            title="No departments configured" 
            sub="Set up your organizational structure by adding your first unit." 
            action={
              <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                <Icon name="plus" size={14} /> Add Department
              </button>
            }
          />
        </div>
      ) : (
        // Department Grid View
        <div className="grid-auto">
          {depts.map(d => (
            <article 
              key={d._id} 
              className="card" 
              style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
            >
              <div className="card-body" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div className="flex justify-between items-start mb-16">
                  <div style={{ 
                    width: 46, height: 46, 
                    borderRadius: 'var(--radius-md)', 
                    background: 'var(--blue-50)', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: 'inset 0 0 0 1px var(--blue-100)'
                  }}>
                    <Icon name="building" size={22} color="var(--blue-600)" />
                  </div>
                  <span className="badge badge-gray" style={{ fontFamily: 'monospace', fontSize: 12 }}>
                    {d.code}
                  </span>
                </div>
                
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 800, color: 'var(--gray-900)', marginBottom: 6 }}>
                  {d.name}
                </h3>
                
                <p style={{ fontSize: 13, color: 'var(--gray-500)', lineHeight: 1.5, flex: 1 }}>
                  {d.description || <span style={{ fontStyle: 'italic', opacity: 0.6 }}>No functional description provided.</span>}
                </p>
              </div>
              
              {/* Card Footer Actions */}
              <div style={{ 
                padding: '14px 20px', 
                borderTop: '1px solid var(--gray-100)', 
                background: 'var(--gray-50)', 
                display: 'flex', gap: 10,
                borderRadius: '0 0 var(--radius-lg) var(--radius-lg)'
              }}>
                <button 
                  className="btn btn-secondary btn-sm flex-1" 
                  style={{ justifyContent: 'center' }}
                  onClick={() => { setEditingDept(d); setShowModal(true); }}
                >
                  <Icon name="edit" size={14} /> Edit
                </button>
                <button 
                  className="btn btn-danger btn-sm flex-1" 
                  style={{ justifyContent: 'center' }}
                  onClick={() => setDeletingDept(d)}
                >
                  <Icon name="trash" size={14} /> Archive
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Modals & Dialogs */}
      {showModal && (
        <DeptModal 
          dept={editingDept} 
          onClose={(shouldReload) => { 
            setShowModal(false); 
            setEditingDept(null); 
            if (shouldReload) loadDirectory(); 
          }}
        />
      )}
      
      {deletingDept && (
        <ConfirmDialog 
          title="Archive Department" 
          message={`Are you sure you want to archive "${deletingDept.name}"? This will not delete the employees assigned to this unit, but you will need to reassign them.`} 
          danger 
          onConfirm={handleDelete} 
          onCancel={() => setDeletingDept(null)}
        />
      )}

    </div>
  );
}