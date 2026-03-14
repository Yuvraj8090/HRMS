// src/pages/shared/ProjectsPage.jsx
import { useState, useEffect, useCallback } from 'react';
import { projectAPI, employeeAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Badge, Modal, Spinner, EmptyState, ProgressBar, Avatar, Icon, ConfirmDialog, fmtDate } from '../../components/common/index.jsx';

function ProjectModal({ project, onClose }) {
  const toast = useToast();
  const { user } = useAuth();
  const [form, setForm] = useState(project ? {
    name: project.name, code: project.code, description: project.description || '',
    status: project.status, priority: project.priority,
    startDate: project.startDate?.slice(0,10) || '',
    deadline: project.deadline?.slice(0,10) || '',
    completionPercentage: project.completionPercentage || 0,
    projectManager: project.projectManager?._id || project.projectManager || user._id,
  } : {
    name: '', code: '', description: '', status: 'Planning', priority: 'Medium',
    startDate: '', deadline: '', completionPercentage: 0, projectManager: user._id,
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors]   = useState({});

  const validate = () => {
    const e = {};
    if (!form.name) e.name = 'Name required';
    if (!form.code) e.code = 'Code required';
    if (!form.startDate) e.startDate = 'Start date required';
    return e;
  };

  const submit = async () => {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      if (project) {
        await projectAPI.update(project._id, form);
        toast.success('Project updated!');
      } else {
        await projectAPI.create(form);
        toast.success('Project created!');
      }
      onClose(true);
    } catch (e) { toast.error(e.message); }
    setLoading(false);
  };

  const f = (field) => ({
    value: form[field],
    onChange: (e) => { setForm(p => ({ ...p, [field]: e.target.value })); setErrors(p => ({ ...p, [field]: '' })); },
    className: `form-control ${errors[field] ? 'error' : ''}`,
  });

  return (
    <Modal title={project ? 'Edit Project' : 'New Project'} onClose={() => onClose(false)} wide
      footer={<>
        <button className="btn btn-secondary" onClick={() => onClose(false)}>Cancel</button>
        <button className="btn btn-primary" onClick={submit} disabled={loading}>{loading ? <Spinner/> : project ? 'Update' : 'Create'}</button>
      </>}
    >
      <div className="grid-2">
        <div className="form-group">
          <label className="form-label">Project Name *</label>
          <input {...f('name')} placeholder="e.g. Website Redesign"/>
          {errors.name && <div className="form-error">{errors.name}</div>}
        </div>
        <div className="form-group">
          <label className="form-label">Project Code *</label>
          <input {...f('code')} placeholder="e.g. WEB-001" style={{ textTransform: 'uppercase' }}/>
          {errors.code && <div className="form-error">{errors.code}</div>}
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">Description</label>
        <textarea {...f('description')} rows={3} placeholder="Brief project description…"/>
      </div>
      <div className="grid-2">
        <div className="form-group">
          <label className="form-label">Status</label>
          <select {...f('status')}>
            {['Planning','Active','On Hold','Completed','Cancelled'].map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Priority</label>
          <select {...f('priority')}>
            {['Low','Medium','High','Critical'].map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
      </div>
      <div className="grid-2">
        <div className="form-group">
          <label className="form-label">Start Date *</label>
          <input type="date" {...f('startDate')}/>
          {errors.startDate && <div className="form-error">{errors.startDate}</div>}
        </div>
        <div className="form-group">
          <label className="form-label">Deadline</label>
          <input type="date" {...f('deadline')}/>
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">Progress: {form.completionPercentage}%</label>
        <input type="range" min={0} max={100} value={form.completionPercentage}
          onChange={e => setForm(p => ({ ...p, completionPercentage: Number(e.target.value) }))}
          style={{ width: '100%' }}/>
      </div>
    </Modal>
  );
}

function ProjectCard({ project, canManage, onEdit, onDelete }) {
  return (
    <div className="card" style={{ transition: 'all 0.2s' }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-lg)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
    >
      <div className="card-body">
        <div className="flex justify-between items-start mb-8">
          <div style={{ flex: 1, minWidth: 0, marginRight: 8 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{project.code}</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 800, color: 'var(--gray-900)', marginTop: 2, lineHeight: 1.2 }}>{project.name}</div>
          </div>
          <div className="flex gap-8">
            <Badge label={project.status}/>
            <Badge label={project.priority}/>
          </div>
        </div>

        {project.description && (
          <p style={{ fontSize: 12, color: 'var(--gray-500)', lineHeight: 1.5, marginBottom: 12, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {project.description}
          </p>
        )}

        <div style={{ marginBottom: 12 }}>
          <div className="flex justify-between mb-4">
            <span style={{ fontSize: 11, color: 'var(--gray-400)' }}>Progress</span>
            <span style={{ fontSize: 11, fontWeight: 700 }}>{project.completionPercentage ?? 0}%</span>
          </div>
          <ProgressBar value={project.completionPercentage ?? 0}/>
        </div>

        <div className="flex justify-between items-center">
          <div className="flex items-center gap-6">
            <Icon name="users" size={12} color="var(--gray-400)"/>
            <span style={{ fontSize: 11, color: 'var(--gray-400)' }}>{project.members?.length ?? 0} members</span>
          </div>
          {project.deadline && (
            <span style={{ fontSize: 11, color: 'var(--gray-400)' }}>Due {fmtDate(project.deadline)}</span>
          )}
        </div>

        {canManage && (
          <div className="flex gap-8 mt-12" style={{ borderTop: '1px solid var(--gray-100)', paddingTop: 12 }}>
            <button className="btn btn-secondary btn-sm" onClick={() => onEdit(project)}><Icon name="edit" size={12}/>Edit</button>
            <button className="btn btn-danger btn-sm" onClick={() => onDelete(project)}><Icon name="trash" size={12}/>Archive</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProjectsPage() {
  const { hasRole } = useAuth();
  const toast = useToast();
  const canManage = hasRole(['Admin', 'HR']);

  const [projects,  setProjects]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing,   setEditing]   = useState(null);
  const [deleting,  setDeleting]  = useState(null);
  const [statusFilter, setStatusFilter] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const { data } = await projectAPI.getAll(params);
      setProjects(data.data || []);
    } catch { setProjects([]); }
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async () => {
    try {
      await projectAPI.delete(deleting._id);
      toast.success('Project archived.');
      setDeleting(null);
      load();
    } catch (e) { toast.error(e.message); }
  };

  const statuses = ['', 'Planning', 'Active', 'On Hold', 'Completed'];

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <div className="flex justify-between items-start flex-wrap gap-16 mb-24">
        <div>
          <h2 className="page-title">Projects</h2>
          <p className="page-sub">{projects.length} project{projects.length !== 1 ? 's' : ''} found</p>
        </div>
        {canManage && (
          <button className="btn btn-primary" onClick={() => { setEditing(null); setShowModal(true); }}>
            <Icon name="plus" size={15}/>New Project
          </button>
        )}
      </div>

      {/* Status filter */}
      <div className="flex gap-8 flex-wrap mb-20">
        {statuses.map(s => (
          <button key={s} className={`btn btn-sm ${statusFilter === s ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setStatusFilter(s)}>
            {s || 'All'}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Spinner large/></div>
      ) : projects.length === 0 ? (
        <EmptyState icon="📁" title="No projects found" sub="Create your first project to get started."
          action={canManage ? <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}><Icon name="plus" size={13}/>New Project</button> : null}/>
      ) : (
        <div className="grid-auto">
          {projects.map(p => (
            <ProjectCard key={p._id} project={p} canManage={canManage}
              onEdit={(proj) => { setEditing(proj); setShowModal(true); }}
              onDelete={(proj) => setDeleting(proj)}/>
          ))}
        </div>
      )}

      {showModal && (
        <ProjectModal project={editing} onClose={(reload) => { setShowModal(false); setEditing(null); if (reload) load(); }}/>
      )}

      {deleting && (
        <ConfirmDialog
          title="Archive Project"
          message={`Archive "${deleting.name}"? It won't be permanently deleted.`}
          danger
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}/>
      )}
    </div>
  );
}
