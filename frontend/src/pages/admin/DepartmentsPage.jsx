// src/pages/admin/DepartmentsPage.jsx
import { useState, useEffect } from 'react';
import { departmentAPI } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Modal, Spinner, EmptyState, Icon, ConfirmDialog } from '../../components/common/index.jsx';

function DeptModal({ dept, onClose }) {
  const toast = useToast();
  const [form, setForm] = useState({ name: dept?.name || '', code: dept?.code || '', description: dept?.description || '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors]   = useState({});

  const validate = () => {
    const e = {};
    if (!form.name) e.name = 'Name required';
    if (!form.code) e.code = 'Code required';
    return e;
  };

  const submit = async () => {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      if (dept) { await departmentAPI.update(dept._id, form); toast.success('Department updated!'); }
      else       { await departmentAPI.create(form);          toast.success('Department created!'); }
      onClose(true);
    } catch (e) { toast.error(e.message); }
    setLoading(false);
  };

  return (
    <Modal title={dept ? 'Edit Department' : 'New Department'} onClose={() => onClose(false)}
      footer={<>
        <button className="btn btn-secondary" onClick={() => onClose(false)}>Cancel</button>
        <button className="btn btn-primary" onClick={submit} disabled={loading}>{loading ? <Spinner/> : dept ? 'Update' : 'Create'}</button>
      </>}
    >
      <div className="form-group">
        <label className="form-label">Department Name *</label>
        <input className={`form-control ${errors.name ? 'error' : ''}`} placeholder="e.g. Engineering"
          value={form.name} onChange={e => { setForm(p => ({ ...p, name: e.target.value })); setErrors(p => ({ ...p, name: '' })); }}/>
        {errors.name && <div className="form-error">{errors.name}</div>}
      </div>
      <div className="form-group">
        <label className="form-label">Code *</label>
        <input className={`form-control ${errors.code ? 'error' : ''}`} placeholder="e.g. ENG" style={{ textTransform: 'uppercase' }}
          value={form.code} onChange={e => { setForm(p => ({ ...p, code: e.target.value.toUpperCase() })); setErrors(p => ({ ...p, code: '' })); }}/>
        {errors.code && <div className="form-error">{errors.code}</div>}
      </div>
      <div className="form-group">
        <label className="form-label">Description</label>
        <textarea className="form-control" rows={3} placeholder="Brief description…"
          value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}/>
      </div>
    </Modal>
  );
}

export default function DepartmentsPage() {
  const toast = useToast();
  const [depts,     setDepts]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing,   setEditing]   = useState(null);
  const [deleting,  setDeleting]  = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await departmentAPI.getAll();
      setDepts(data.data || []);
    } catch { setDepts([]); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async () => {
    try {
      await departmentAPI.delete(deleting._id);
      toast.success('Department archived.');
      setDeleting(null);
      load();
    } catch (e) { toast.error(e.message); }
  };

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <div className="flex justify-between items-start flex-wrap gap-16 mb-24">
        <div>
          <h2 className="page-title">Departments</h2>
          <p className="page-sub">{depts.length} departments configured</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditing(null); setShowModal(true); }}>
          <Icon name="plus" size={15}/>New Department
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Spinner large/></div>
      ) : depts.length === 0 ? (
        <EmptyState icon="🏢" title="No departments yet" sub="Create your first department." action={
          <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}><Icon name="plus" size={13}/>Add Department</button>
        }/>
      ) : (
        <div className="grid-3">
          {depts.map(d => (
            <div key={d._id} className="card" style={{ transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--shadow-lg)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = ''; e.currentTarget.style.transform = ''; }}
            >
              <div className="card-body">
                <div className="flex justify-between items-start mb-12">
                  <div style={{ width: 42, height: 42, borderRadius: 12, background: 'var(--blue-50)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name="building" size={20} color="var(--blue-600)"/>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, background: 'var(--gray-100)', color: 'var(--gray-600)', padding: '3px 10px', borderRadius: 'var(--radius-full)' }}>{d.code}</span>
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 800, color: 'var(--gray-900)', marginBottom: 4 }}>{d.name}</div>
                {d.description && <p style={{ fontSize: 12, color: 'var(--gray-500)', lineHeight: 1.4, marginBottom: 14 }}>{d.description}</p>}
                <div className="flex gap-8" style={{ borderTop: '1px solid var(--gray-100)', paddingTop: 12 }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => { setEditing(d); setShowModal(true); }}><Icon name="edit" size={12}/>Edit</button>
                  <button className="btn btn-danger btn-sm" onClick={() => setDeleting(d)}><Icon name="trash" size={12}/>Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && <DeptModal dept={editing} onClose={(reload) => { setShowModal(false); setEditing(null); if (reload) load(); }}/>}
      {deleting && <ConfirmDialog title="Archive Department" message={`Archive "${deleting.name}"?`} danger onConfirm={handleDelete} onCancel={() => setDeleting(null)}/>}
    </div>
  );
}
