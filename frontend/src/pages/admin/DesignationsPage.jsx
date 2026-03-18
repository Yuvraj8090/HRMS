import { useState, useEffect } from 'react';
import { designationAPI, departmentAPI } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Modal, Spinner, EmptyState, Icon, ConfirmDialog, Skeleton, currency } from '../../components/common/index.jsx';

// ── Designation Form Modal ─────────────────────────────────────────────────
function DesignationModal({ desig, departments, onClose }) {
  const toast = useToast();
  const [form, setForm] = useState({ 
    title: desig?.title || '', 
    department: desig?.department?._id || desig?.department || '', 
    level: desig?.level || 'Junior',
    salaryMin: desig?.salaryRange?.min || '',
    salaryMax: desig?.salaryRange?.max || ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors]   = useState({});

  const LEVELS = ['Junior', 'Mid', 'Senior', 'Lead', 'Manager', 'Director', 'VP', 'C-Level'];

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = 'Job title is required';
    if (!form.department) e.department = 'Department selection is required';
    if (Number(form.salaryMin) > Number(form.salaryMax)) e.salaryMax = 'Max salary must be ≥ Min salary';
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
      // Map flat form state back to nested backend schema
      const payload = {
        title: form.title,
        department: form.department,
        level: form.level,
        salaryRange: {
          min: Number(form.salaryMin) || 0,
          max: Number(form.salaryMax) || 0
        }
      };

      if (desig) { 
        await designationAPI.update(desig._id, payload); 
        toast.success('Designation updated successfully!'); 
      } else { 
        await designationAPI.create(payload);          
        toast.success('New designation created!'); 
      }
      onClose(true); // true triggers table reload
    } catch (e) { 
      toast.error(e.message || 'Failed to save designation. Title might already exist in this unit.'); 
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal 
      title={desig ? 'Edit Designation' : 'Create New Designation'} 
      onClose={() => onClose(false)}
      wide
      footer={
        <>
          <button className="btn btn-secondary" onClick={() => onClose(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={submit} disabled={loading} style={{ minWidth: 100 }}>
            {loading ? <Spinner /> : (desig ? 'Save Changes' : 'Create')}
          </button>
        </>
      }
    >
      <div style={{ animation: 'fadeIn 0.2s ease', padding: '10px 0' }}>
        
        <div className="grid-2">
          <div className="form-group">
            <label className="form-label">Job Title *</label>
            <input 
              className={`form-control ${errors.title ? 'error' : ''}`} 
              placeholder="e.g. Senior Frontend Engineer"
              value={form.title} 
              onChange={e => { 
                setForm(p => ({ ...p, title: e.target.value })); 
                if (errors.title) setErrors(p => ({ ...p, title: '' })); 
              }}
            />
            {errors.title && <div className="form-error">{errors.title}</div>}
          </div>
          
          <div className="form-group">
            <label className="form-label">Department *</label>
            <select 
              className={`form-control ${errors.department ? 'error' : ''}`} 
              value={form.department} 
              onChange={e => {
                setForm(p => ({ ...p, department: e.target.value }));
                if (errors.department) setErrors(p => ({ ...p, department: '' })); 
              }}
            >
              <option value="">Select Department...</option>
              {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
            </select>
            {errors.department && <div className="form-error">{errors.department}</div>}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Seniority Level</label>
          <select 
            className="form-control" 
            value={form.level} 
            onChange={e => setForm(p => ({ ...p, level: e.target.value }))}
          >
            {LEVELS.map(lvl => <option key={lvl} value={lvl}>{lvl}</option>)}
          </select>
        </div>

        <div style={{ borderTop: '1px solid var(--gray-100)', marginTop: 24, paddingTop: 16 }}>
          <span className="section-title" style={{ display: 'block', marginBottom: 16 }}>Compensation Band (₹)</span>
          <div className="grid-2">
            <div className="form-group mb-0">
              <label className="form-label">Minimum Salary</label>
              <input 
                type="number"
                className="form-control" 
                placeholder="0"
                value={form.salaryMin} 
                onChange={e => setForm(p => ({ ...p, salaryMin: e.target.value }))}
              />
            </div>
            <div className="form-group mb-0">
              <label className="form-label">Maximum Salary</label>
              <input 
                type="number"
                className={`form-control ${errors.salaryMax ? 'error' : ''}`} 
                placeholder="0"
                value={form.salaryMax} 
                onChange={e => {
                  setForm(p => ({ ...p, salaryMax: e.target.value }));
                  if (errors.salaryMax) setErrors(p => ({ ...p, salaryMax: '' }));
                }}
              />
              {errors.salaryMax && <div className="form-error">{errors.salaryMax}</div>}
            </div>
          </div>
        </div>

      </div>
    </Modal>
  );
}

// ── Main Page Component ────────────────────────────────────────────────────
export default function DesignationsPage() {
  const toast = useToast();
  const [designations, setDesignations] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Interface Filters
  const [selectedDept, setSelectedDept] = useState('');

  // Modal & Dialog States
  const [showModal, setShowModal] = useState(false);
  const [editingDesig, setEditingDesig] = useState(null);
  const [deletingDesig, setDeletingDesig] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      // Fetch both simultaneously. Apply department filter if selected.
      const params = selectedDept ? { department: selectedDept } : {};
      const [desigRes, deptRes] = await Promise.all([
        designationAPI.getAll(params),
        departmentAPI.getAll().catch(() => ({ data: { data: [] } })) // Fallback if depts fail
      ]);
      
      setDesignations(desigRes.data.data || []);
      
      // Only set departments on initial load to preserve the filter dropdown
      if (departments.length === 0 && deptRes.data?.data) {
        setDepartments(deptRes.data.data);
      }
    } catch { 
      toast.error("Failed to load designations.");
    } finally {
      setLoading(false);
    }
  };

  // Reload when the department filter changes
  useEffect(() => { 
    loadData(); 
  }, [selectedDept]);

  const handleDelete = async () => {
    try {
      await designationAPI.delete(deletingDesig._id);
      toast.success(`${deletingDesig.title} archived successfully.`);
      setDeletingDesig(null);
      loadData();
    } catch (e) { 
      toast.error(e.message || "Failed to delete designation."); 
    }
  };

  // Helper to color-code levels
  const getLevelColor = (level) => {
    const map = {
      'Junior': 'var(--gray-500)', 'Mid': 'var(--blue-600)', 
      'Senior': 'var(--green-600)', 'Lead': 'var(--amber-600)', 
      'Manager': 'var(--purple-600)', 'Director': 'var(--red-500)', 
      'VP': 'var(--red-600)', 'C-Level': 'var(--gray-900)'
    };
    return map[level] || 'var(--gray-500)';
  };

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      
      {/* Page Header */}
      <header className="flex items-center justify-between flex-wrap gap-16 mb-24">
        <div>
          <h2 className="page-title">Job Designations</h2>
          <p className="page-sub">Manage job titles, levels, and salary bands</p>
        </div>
        
        <div className="flex items-center gap-12 flex-wrap">
          {/* Department Filter */}
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)', display: 'flex' }}>
              <Icon name="filter" size={14} />
            </div>
            <select 
              className="form-control" 
              style={{ width: 220, paddingLeft: 34, paddingRight: 32, fontSize: 13, backgroundColor: 'var(--white)' }}
              value={selectedDept}
              onChange={e => setSelectedDept(e.target.value)}
            >
              <option value="">All Departments</option>
              {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
            </select>
          </div>

          <button 
            className="btn btn-primary" 
            onClick={() => { setEditingDesig(null); setShowModal(true); }}
          >
            <Icon name="plus" size={16} />
            <span>Add Designation</span>
          </button>
        </div>
      </header>

      {/* Content Area */}
      {loading ? (
        // Skeleton Grid Loading
        <div className="grid-auto">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={`skeleton-${i}`} className="card">
              <div className="card-body">
                <Skeleton height={20} width="60%" style={{ marginBottom: 12 }} />
                <Skeleton height={14} width="40%" style={{ marginBottom: 20 }} />
                <div className="flex justify-between">
                  <Skeleton height={24} width="70px" style={{ borderRadius: 'var(--radius-full)' }} />
                  <Skeleton height={14} width="100px" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : designations.length === 0 ? (
        // Empty State
        <div className="card" style={{ padding: '60px 20px' }}>
          <EmptyState 
            icon="👔" 
            title="No designations found" 
            sub={selectedDept ? "This department doesn't have any job titles configured yet." : "Set up your organizational roles by adding your first designation."} 
            action={
              <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                <Icon name="plus" size={14} /> Add Designation
              </button>
            }
          />
        </div>
      ) : (
        // Designations Grid View
        <div className="grid-auto">
          {designations.map(d => (
            <article 
              key={d._id} 
              className="card" 
              style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
            >
              <div className="card-body" style={{ flex: 1 }}>
                
                {/* Title & Department */}
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 800, color: 'var(--gray-900)', marginBottom: 4, lineHeight: 1.3 }}>
                  {d.title}
                </h3>
                <div className="flex items-center gap-8 mb-16">
                  <Icon name="building" size={12} color="var(--gray-400)" />
                  <span style={{ fontSize: 12, color: 'var(--gray-500)', fontWeight: 500 }}>
                    {d.department?.name || 'Unassigned Unit'}
                  </span>
                </div>
                
                {/* Level & Salary Band */}
                <div className="flex items-center justify-between" style={{ background: 'var(--gray-50)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
                  <div className="flex flex-col gap-4">
                    <span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--gray-400)', fontWeight: 700 }}>Seniority</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: getLevelColor(d.level) }}>
                      • {d.level}
                    </span>
                  </div>
                  <div className="flex flex-col gap-4" style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--gray-400)', fontWeight: 700 }}>Salary Band</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-800)' }}>
                      {d.salaryRange?.min || d.salaryRange?.max 
                        ? `${currency(d.salaryRange.min)} - ${currency(d.salaryRange.max)}` 
                        : 'Not Defined'}
                    </span>
                  </div>
                </div>

              </div>
              
              {/* Card Footer Actions */}
              <div style={{ 
                padding: '12px 20px', 
                borderTop: '1px solid var(--gray-100)', 
                display: 'flex', gap: 10,
              }}>
                <button 
                  className="btn btn-secondary btn-sm flex-1" 
                  style={{ justifyContent: 'center' }}
                  onClick={() => { setEditingDesig(d); setShowModal(true); }}
                >
                  <Icon name="edit" size={14} /> Edit
                </button>
                <button 
                  className="btn btn-danger btn-sm flex-1" 
                  style={{ justifyContent: 'center' }}
                  onClick={() => setDeletingDesig(d)}
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
        <DesignationModal 
          desig={editingDesig} 
          departments={departments}
          onClose={(shouldReload) => { 
            setShowModal(false); 
            setEditingDesig(null); 
            if (shouldReload) loadData(); 
          }}
        />
      )}
      
      {deletingDesig && (
        <ConfirmDialog 
          title="Archive Designation" 
          message={`Are you sure you want to archive the "${deletingDesig.title}" role? Employees currently holding this title will not be deleted.`} 
          danger 
          onConfirm={handleDelete} 
          onCancel={() => setDeletingDesig(null)}
        />
      )}

    </div>
  );
}