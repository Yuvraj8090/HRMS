// src/pages/admin/DesignationsPage.jsx
import { useState, useEffect } from 'react';
import { desigAPI, deptAPI } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import { Icon, Modal, Spinner, EmptyState, ConfirmDialog, Badge, fmt } from '../../components/common/index.jsx';

const LEVELS = ['Junior','Mid','Senior','Lead','Manager','Director','VP','C-Level'];

function DesigModal({ desig, depts, onClose }) {
  const toast = useToast();
  const [form, setForm] = useState({ title: desig?.title||'', department: desig?.department?._id||desig?.department||'', level: desig?.level||'Junior', salaryMin: desig?.salaryRange?.min||0, salaryMax: desig?.salaryRange?.max||0 });
  const [loading, setLoading] = useState(false);
  const submit = async () => {
    if (!form.title || !form.department) return toast.error('Title and department required.');
    setLoading(true);
    try {
      const payload = { title: form.title, department: form.department, level: form.level, salaryRange: { min: +form.salaryMin, max: +form.salaryMax } };
      if (desig) await desigAPI.update(desig._id, payload); else await desigAPI.create(payload);
      toast.success(desig ? 'Updated.' : 'Created.');
      onClose(true);
    } catch (e) { toast.error(e.message); }
    setLoading(false);
  };
  const ch = f => e => setForm(p => ({ ...p, [f]: e.target.value }));
  return (
    <Modal title={desig ? 'Edit Designation' : 'New Designation'} onClose={() => onClose(false)} size="md"
      footer={<><button className="btn btn-secondary" onClick={() => onClose(false)}>Cancel</button><button className="btn btn-primary" onClick={submit} disabled={loading}>{loading ? <Spinner size="sm" /> : desig ? 'Update' : 'Create'}</button></>}>
      <div className="form-group"><label className="form-label">Title *</label><input className="form-control" value={form.title} onChange={ch('title')} placeholder="e.g. Software Engineer" /></div>
      <div className="grid grid-cols-2 gap-4">
        <div className="form-group"><label className="form-label">Department *</label>
          <select className="form-control" value={form.department} onChange={ch('department')}>
            <option value="">Select…</option>{depts.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
          </select>
        </div>
        <div className="form-group"><label className="form-label">Level</label>
          <select className="form-control" value={form.level} onChange={ch('level')}>{LEVELS.map(l => <option key={l}>{l}</option>)}</select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="form-group"><label className="form-label">Min Salary (₹)</label><input type="number" className="form-control" value={form.salaryMin} onChange={ch('salaryMin')} /></div>
        <div className="form-group"><label className="form-label">Max Salary (₹)</label><input type="number" className="form-control" value={form.salaryMax} onChange={ch('salaryMax')} /></div>
      </div>
    </Modal>
  );
}

export default function DesignationsPage() {
  const toast = useToast();
  const [desigs, setDesigs] = useState([]);
  const [depts, setDepts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [deptFilter, setDeptFilter] = useState('');

  useEffect(() => { deptAPI.getAll().then(r => setDepts(r.data.data || [])).catch(() => {}); }, []);
  const load = async () => { setLoading(true); try { const r = await desigAPI.getAll(deptFilter ? { department: deptFilter } : {}); setDesigs(r.data.data || []); } catch {} setLoading(false); };
  useEffect(() => { load(); }, [deptFilter]);

  const handleDelete = async () => {
    try { await desigAPI.remove(deleting._id); toast.success('Archived.'); setDeleting(null); load(); } catch (e) { toast.error(e.message); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h2 className="page-title">Designations</h2><p className="text-sm text-gray-400 mt-0.5">{desigs.length} designations</p></div>
        <button className="btn btn-primary" onClick={() => setModal({})}><Icon name="plus" size={14} />New Designation</button>
      </div>
      <div className="flex gap-2 flex-wrap">
        <button className={`btn btn-sm ${!deptFilter ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setDeptFilter('')}>All</button>
        {depts.map(d => <button key={d._id} className={`btn btn-sm ${deptFilter === d._id ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setDeptFilter(d._id)}>{d.name}</button>)}
      </div>
      <div className="card">
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th>Title</th><th>Department</th><th>Level</th><th>Salary Range</th><th></th></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={5} className="text-center py-10"><Spinner /></td></tr>
              : desigs.length === 0 ? <tr><td colSpan={5}><EmptyState icon="🏷️" title="No designations" /></td></tr>
              : desigs.map(d => (
                <tr key={d._id}>
                  <td className="font-700 text-gray-900">{d.title}</td>
                  <td>{d.department?.name || '—'}</td>
                  <td><Badge label={d.level} /></td>
                  <td className="text-xs text-gray-500">{d.salaryRange?.min ? `${fmt.currency(d.salaryRange.min)} – ${fmt.currency(d.salaryRange.max)}` : '—'}</td>
                  <td>
                    <div className="flex gap-2">
                      <button className="btn btn-secondary btn-sm" onClick={() => setModal(d)}><Icon name="edit" size={12} /></button>
                      <button className="btn btn-danger btn-sm" onClick={() => setDeleting(d)}><Icon name="trash" size={12} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {modal !== null && <DesigModal desig={modal?._id ? modal : null} depts={depts} onClose={r => { setModal(null); if (r) load(); }} />}
      {deleting && <ConfirmDialog title="Archive Designation" message={`Archive "${deleting.title}"?`} danger onConfirm={handleDelete} onCancel={() => setDeleting(null)} />}
    </div>
  );
}
