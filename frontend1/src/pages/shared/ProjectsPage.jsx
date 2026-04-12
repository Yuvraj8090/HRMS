// src/pages/shared/ProjectsPage.jsx
import { useState, useEffect } from 'react';
import { projectAPI, deptAPI } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { Badge, Modal, Spinner, EmptyState, Icon, ProgressBar, ConfirmDialog, fmt } from '../../components/common/index.jsx';

function ProjectModal({ project, depts, userId, onClose }) {
  const toast = useToast();
  const [form, setForm] = useState({
    name:project?.name||'', code:project?.code||'', description:project?.description||'',
    department:project?.department?._id||'', startDate:project?.startDate?.slice(0,10)||new Date().toISOString().slice(0,10),
    deadline:project?.deadline?.slice(0,10)||'', status:project?.status||'Planning',
    priority:project?.priority||'Medium', completionPercentage:project?.completionPercentage||0,
  });
  const [loading,setLoading]=useState(false);
  const ch=f=>e=>setForm(p=>({...p,[f]:e.target.value}));
  const submit=async()=>{
    if(!form.name||!form.code)return toast.error('Name and code required.');
    setLoading(true);
    try{
      if(project)await projectAPI.update(project._id,form); else await projectAPI.create({...form,projectManager:userId});
      toast.success(project?'Updated.':'Project created.'); onClose(true);
    }catch(e){toast.error(e.message);} setLoading(false);
  };
  return (
    <Modal title={project?'Edit Project':'New Project'} onClose={()=>onClose(false)} size="lg"
      footer={<><button className="btn btn-secondary" onClick={()=>onClose(false)}>Cancel</button><button className="btn btn-primary" onClick={submit} disabled={loading}>{loading?<Spinner size="sm"/>:project?'Update':'Create'}</button></>}>
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 form-group"><label className="form-label">Project Name *</label><input className="form-control" value={form.name} onChange={ch('name')} placeholder="e.g. USDMA PREP Initiative"/></div>
        <div className="form-group"><label className="form-label">Code *</label><input className="form-control" value={form.code} onChange={e=>setForm(p=>({...p,code:e.target.value.toUpperCase()}))} placeholder="USDMA-001"/></div>
        <div className="form-group"><label className="form-label">Department</label><select className="form-control" value={form.department} onChange={ch('department')}><option value="">None</option>{depts.map(d=><option key={d._id} value={d._id}>{d.name}</option>)}</select></div>
        <div className="form-group"><label className="form-label">Status</label><select className="form-control" value={form.status} onChange={ch('status')}>{['Planning','Active','On Hold','Completed','Cancelled'].map(s=><option key={s}>{s}</option>)}</select></div>
        <div className="form-group"><label className="form-label">Priority</label><select className="form-control" value={form.priority} onChange={ch('priority')}>{['Low','Medium','High','Critical'].map(s=><option key={s}>{s}</option>)}</select></div>
        <div className="form-group"><label className="form-label">Start Date</label><input type="date" className="form-control" value={form.startDate} onChange={ch('startDate')}/></div>
        <div className="form-group"><label className="form-label">Deadline</label><input type="date" className="form-control" value={form.deadline} onChange={ch('deadline')}/></div>
      </div>
      <div className="form-group"><label className="form-label">Description</label><textarea className="form-control" rows={2} value={form.description} onChange={ch('description')}/></div>
      <div className="form-group"><label className="form-label">Progress: {form.completionPercentage}%</label>
        <input type="range" min={0} max={100} value={form.completionPercentage} onChange={ch('completionPercentage')} className="w-full accent-primary-600"/>
      </div>
    </Modal>
  );
}

export default function ProjectsPage() {
  const toast = useToast();
  const { hasRole, user } = useAuth();
  const canManage = hasRole('Admin','HR');
  const [projects, setProjects] = useState([]);
  const [depts,    setDepts]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [modal,    setModal]    = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [statusF,  setStatusF]  = useState('');

  useEffect(()=>{if(canManage)deptAPI.getAll().then(r=>setDepts(r.data.data||[])).catch(()=>{});},[canManage]);
  const load = async()=>{setLoading(true);try{const r=await projectAPI.getAll(statusF?{status:statusF}:{});setProjects(r.data.data||[]);}catch{}setLoading(false);};
  useEffect(()=>{load();},[statusF]);
  const handleDelete=async()=>{try{await projectAPI.archive(deleting._id);toast.success('Archived.');setDeleting(null);load();}catch(e){toast.error(e.message);}};

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h2 className="page-title">{canManage?'Projects':'My Projects'}</h2><p className="text-sm text-gray-400">{projects.length} project{projects.length!==1?'s':''}</p></div>
        {canManage&&<button className="btn btn-primary" onClick={()=>setModal({})}><Icon name="plus" size={14}/>New Project</button>}
      </div>
      <div className="flex gap-2 flex-wrap">
        {['','Planning','Active','On Hold','Completed'].map(s=><button key={s} className={`btn btn-sm ${statusF===s?'btn-primary':'btn-secondary'}`} onClick={()=>setStatusF(s)}>{s||'All'}</button>)}
      </div>
      {loading?<div className="flex justify-center pt-10"><Spinner size="lg"/></div>
      :projects.length===0?<EmptyState icon="📁" title="No projects" sub="No projects found." action={canManage&&<button className="btn btn-primary btn-sm" onClick={()=>setModal({})}>New Project</button>}/>
      :<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {projects.map(p=>(
          <div key={p._id} className="card p-5 hover:-translate-y-0.5 hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-2">
              <div><div className="text-[10px] font-700 text-gray-400 uppercase tracking-widest">{p.code}</div><h3 className="font-800 text-gray-900 text-sm leading-tight">{p.name}</h3></div>
              <div className="flex flex-col items-end gap-1"><Badge label={p.status}/><Badge label={p.priority}/></div>
            </div>
            {p.description&&<p className="text-xs text-gray-400 line-clamp-2 mb-3">{p.description}</p>}
            <div className="flex justify-between text-xs text-gray-400 mb-1"><span>Progress</span><span className="font-700">{p.completionPercentage}%</span></div>
            <ProgressBar value={p.completionPercentage}/>
            <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
              <div className="text-xs text-gray-400"><Icon name="users" size={12} className="inline mr-1"/>{p.teamSize} member{p.teamSize!==1?'s':''}</div>
              {p.deadline&&<span className="text-xs text-gray-400">Due {fmt.dateShort(p.deadline)}</span>}
            </div>
            {canManage&&<div className="flex gap-2 mt-3">
              <button className="btn btn-secondary btn-sm" onClick={()=>setModal(p)}><Icon name="edit" size={12}/>Edit</button>
              <button className="btn btn-danger btn-sm" onClick={()=>setDeleting(p)}><Icon name="trash" size={12}/></button>
            </div>}
          </div>
        ))}
      </div>}
      {modal!==null&&<ProjectModal project={modal?._id?modal:null} depts={depts} userId={user?._id} onClose={r=>{setModal(null);if(r)load();}}/>}
      {deleting&&<ConfirmDialog title="Archive Project" message={`Archive "${deleting.name}"?`} danger onConfirm={handleDelete} onCancel={()=>setDeleting(null)}/>}
    </div>
  );
}
