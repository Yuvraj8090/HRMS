// src/pages/admin/DepartmentsPage.jsx
import { useState, useEffect } from 'react';
import { deptAPI, empAPI } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import { Icon, Modal, Spinner, EmptyState, ConfirmDialog, Badge } from '../../components/common/index.jsx';

function DeptModal({ dept, onClose }) {
  const toast = useToast();
  const [form, setForm] = useState({ name: dept?.name || '', code: dept?.code || '', description: dept?.description || '' });
  const [loading, setLoading] = useState(false);
  const ch = f => e => setForm(p => ({ ...p, [f]: e.target.value }));
  const submit = async () => {
    if (!form.name || !form.code) return toast.error('Name and code required.');
    setLoading(true);
    try {
      if (dept) await deptAPI.update(dept._id, form); else await deptAPI.create(form);
      toast.success(dept ? 'Department updated.' : 'Department created.');
      onClose(true);
    } catch (e) { toast.error(e.message); }
    setLoading(false);
  };
  return (
    <Modal title={dept ? 'Edit Department' : 'New Department'} onClose={() => onClose(false)} size="sm"
      footer={<><button className="btn btn-secondary" onClick={() => onClose(false)}>Cancel</button><button className="btn btn-primary" onClick={submit} disabled={loading}>{loading ? <Spinner size="sm" /> : dept ? 'Update' : 'Create'}</button></>}>
      <div className="form-group"><label className="form-label">Name *</label><input className="form-control" value={form.name} onChange={ch('name')} placeholder="e.g. Engineering" /></div>
      <div className="form-group"><label className="form-label">Code *</label><input className="form-control" value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value.toUpperCase() }))} placeholder="e.g. ENG" /></div>
      <div className="form-group"><label className="form-label">Description</label><textarea className="form-control" rows={3} value={form.description} onChange={ch('description')} placeholder="Brief description…" /></div>
    </Modal>
  );
}

export default function DepartmentsPage() {
  const toast = useToast();
  const [depts, setDepts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const load = async () => { setLoading(true); try { const r = await deptAPI.getAll(); setDepts(r.data.data || []); } catch {} setLoading(false); };
  useEffect(() => { load(); }, []);

  const handleDelete = async () => {
    try { await deptAPI.remove(deleting._id); toast.success('Department archived.'); setDeleting(null); load(); } catch (e) { toast.error(e.message); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h2 className="page-title">Departments</h2><p className="text-sm text-gray-400 mt-0.5">{depts.length} departments</p></div>
        <button className="btn btn-primary" onClick={() => setModal({})}><Icon name="plus" size={14} />New Department</button>
      </div>
      {loading ? <div className="flex justify-center pt-10"><Spinner size="lg" /></div> : depts.length === 0 ? (
        <EmptyState icon="🏢" title="No departments yet" sub="Create your first department." action={<button className="btn btn-primary btn-sm" onClick={() => setModal({})}>Add</button>} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {depts.map(d => (
            <div key={d._id} className="card p-5 hover:-translate-y-0.5 hover:shadow-md transition-all">
              <div className="flex justify-between items-start mb-3">
                <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center"><Icon name="building" size={18} className="text-primary-600" /></div>
                <span className="text-xs font-700 bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">{d.code}</span>
              </div>
              <h3 className="font-display text-base font-800 text-gray-900">{d.name}</h3>
              {d.description && <p className="text-xs text-gray-400 mt-1 line-clamp-2">{d.description}</p>}
              <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100">
                <button className="btn btn-secondary btn-sm" onClick={() => setModal(d)}><Icon name="edit" size={12} />Edit</button>
                <button className="btn btn-danger btn-sm" onClick={() => setDeleting(d)}><Icon name="trash" size={12} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
      {modal !== null && <DeptModal dept={modal?._id ? modal : null} onClose={r => { setModal(null); if (r) load(); }} />}
      {deleting && <ConfirmDialog title="Archive Department" message={`Archive "${deleting.name}"? This cannot be undone.`} danger onConfirm={handleDelete} onCancel={() => setDeleting(null)} />}
    </div>
  );
}
