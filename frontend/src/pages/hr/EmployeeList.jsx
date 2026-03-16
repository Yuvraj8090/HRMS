import { useState, useEffect, useCallback } from 'react';
import { employeeAPI, departmentAPI, designationAPI } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Badge, Spinner, Avatar, Icon, fmtDate, currency } from '../../components/common/index.jsx';

const INITIAL_FORM_STATE = {
  // Identity (User Model)
  firstName: '', lastName: '', email: '', password: '', role: 'Employee',
  // Professional (Profile Model)
  employeeId: '', department: '', designation: '', joiningDate: '', currentSalary: '',
  employmentType: 'Full-Time', status: 'Active', unit: '', project: 'U-Prepare',
  // Personal & HR
  phone: '', dateOfBirth: '', gender: 'Prefer not to say', education: '', 
  officeLocation: '', yearsOfExperience: 0
};

export default function EmployeeList() {
  const toast = useToast();
  
  // --- Data & Filtering ---
  const [employees, setEmployees] = useState([]);
  const [departments, setDepts] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [total, setTotal] = useState(0);

  // --- UI Control ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('identity'); // 'identity' | 'job' | 'additional'
  const [formMode, setFormMode] = useState('create');
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [editingId, setEditingId] = useState(null); // This stores the User ID
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [excelFile, setExcelFile] = useState(null);

  // --- Data Loading ---
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await employeeAPI.getAll({ search, department: deptFilter });
      setEmployees(data.data || []);
      setTotal(data.total || 0);
    } catch (err) {
      toast.error('Failed to sync employee directory.');
    } finally {
      setLoading(false);
    }
  }, [search, deptFilter, toast]);

  useEffect(() => {
    departmentAPI.getAll().then(res => setDepts(res.data.data || []));
    designationAPI.getAll().then(res => setDesignations(res.data.data || []));
    load();
  }, [load]);

  // --- Handlers ---
  const openEditModal = (emp) => {
    setFormMode('edit');
    setEditingId(emp.user?._id || emp.user); // CRITICAL: Store User ID for the API path
    setFormData({
      firstName: emp.user?.firstName || '',
      lastName: emp.user?.lastName || '',
      email: emp.user?.email || '',
      role: emp.user?.role || 'Employee',
      employeeId: emp.employeeId || '',
      department: emp.department?._id || '',
      designation: emp.designation?._id || '',
      joiningDate: emp.joiningDate ? new Date(emp.joiningDate).toISOString().split('T')[0] : '',
      currentSalary: emp.currentSalary || '',
      employmentType: emp.employmentType || 'Full-Time',
      status: emp.status || 'Active',
      unit: emp.unit || '',
      project: emp.project || 'U-Prepare',
      phone: emp.phone || '',
      dateOfBirth: emp.dateOfBirth ? new Date(emp.dateOfBirth).toISOString().split('T')[0] : '',
      gender: emp.gender || 'Prefer not to say',
      education: emp.education || '',
      officeLocation: emp.officeLocation || '',
      yearsOfExperience: emp.yearsOfExperience || 0
    });
    setActiveTab('identity');
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (formMode === 'create') {
        await employeeAPI.create(formData);
        toast.success('Personnel record created successfully.');
      } else {
        // FIX: Ensure editingId is the 24-char User ID string
        await employeeAPI.update(editingId, formData);
        toast.success('Personnel record updated.');
      }
      setIsModalOpen(false);
      load();
    } catch (err) {
      toast.error(err.message || 'Verification failed. Please check inputs.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImportSubmit = async (e) => {
    e.preventDefault();
    if (!excelFile) return toast.error('Please attach the U-Prepare CSV file.');
    setIsSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('file', excelFile);
      const res = await employeeAPI.importAll(fd);
      toast.success(res.data.message || 'Bulk import successful.');
      setIsImportModalOpen(false);
      load();
    } catch (err) {
      toast.error(err.message || 'Import failed. Check file formatting.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="dashboard-container animate-fade-in">
      
      {/* Banner Section */}
      <header className="dashboard-banner" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingRight: '40px' }}>
        <div className="banner-decoration-top" />
        <div className="banner-decoration-bottom" />
        <div className="banner-content">
          <p className="banner-subtitle">HR & Operations</p>
          <h1 className="banner-title">Staff Directory</h1>
          <p className="banner-date">{total} Total Profiles | Project: U-Prepare</p>
        </div>
        <div style={{ zIndex: 10, display: 'flex', gap: '12px' }}>
          <button onClick={() => setIsImportModalOpen(true)} className="btn-glass" style={{ background: 'var(--green-50)', color: 'var(--green-600)', border: '1px solid var(--green-200)', padding: '10px 18px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>
            <Icon name="upload" size={14} style={{ marginRight: 8 }} /> Import All
          </button>
          <button onClick={() => { setFormMode('create'); setFormData(INITIAL_FORM_STATE); setIsModalOpen(true); }} className="btn-primary-custom" style={{ background: '#fff', color: 'var(--blue-600)', padding: '10px 18px', borderRadius: '8px', fontWeight: 700, border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
            + Add Employee
          </button>
        </div>
      </header>

      {/* Control Bar */}
      <section className="mb-24">
        <article className="card">
          <div className="card-body flex gap-16" style={{ padding: '16px' }}>
            <div style={{ flex: 1, position: 'relative' }}>
               <input className="form-control" placeholder="Search by name, email or employee code..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: '38px', height: '44px' }} />
               <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }}><Icon name="search" size={15} color="var(--gray-400)" /></div>
            </div>
            <select className="form-control" style={{ width: '220px', height: '44px' }} value={deptFilter} onChange={e => setDeptFilter(e.target.value)}>
              <option value="">All PMU/PIU Units</option>
              {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
            </select>
          </div>
        </article>
      </section>

      {/* Directory List */}
      <section className="mb-24">
        <article className="card">
          <header className="card-header border-b">
            <div>
              <h2 className="section-title">Personnel Roster</h2>
              <span className="section-subtitle">Manage system access and employment details</span>
            </div>
          </header>
          
          <div className="card-body">
            {loading ? (
              <div className="flex-center p-48"><Spinner large /></div>
            ) : employees.length === 0 ? (
              <div className="empty-state p-48 text-center text-gray-500">No personnel records found matching filters.</div>
            ) : (
              <ul className="list-group">
                {employees.map(emp => (
                  <li key={emp._id} className="list-item" style={{ padding: '16px 20px' }}>
                    <Avatar name={`${emp.user?.firstName} ${emp.user?.lastName}`} size={42} />
                    <div className="list-item-content">
                      <p className="item-title" style={{ fontSize: '14px', fontWeight: 700 }}>{emp.user?.firstName} {emp.user?.lastName}</p>
                      <p className="item-meta">
                        <span style={{ color: 'var(--blue-600)', fontWeight: 600 }}>{emp.employeeId}</span> · {emp.designation?.title || 'Staff'} · {emp.department?.name || 'General'}
                      </p>
                    </div>
                    <div className="list-item-actions flex items-center gap-24">
                       <div className="text-right">
                          <p className="item-value" style={{ margin: 0, fontWeight: 700 }}>{currency(emp.currentSalary)}</p>
                          <p className="item-meta" style={{ margin: 0 }}>Joined {fmtDate(emp.joiningDate)}</p>
                       </div>
                       <Badge label={emp.status} style={{ 
                         background: emp.status === 'Active' ? 'var(--green-50)' : 'var(--red-50)', 
                         color: emp.status === 'Active' ? 'var(--green-600)' : 'var(--red-600)',
                         minWidth: '80px', textAlign: 'center'
                       }} />
                       <button onClick={() => openEditModal(emp)} className="btn-icon" style={{ background: 'var(--gray-50)', border: 'none', padding: '8px', borderRadius: '6px', cursor: 'pointer' }}>
                         <Icon name="edit" size={16} color="var(--blue-600)"/>
                       </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </article>
      </section>

      {/* --- PROFESSIONAL CRUD MODAL --- */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <article className="card animate-scale-up" style={{ width: '100%', maxWidth: '750px', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
             <header className="card-header border-b flex justify-between items-center" style={{ padding: '16px 24px' }}>
                <div>
                  <h2 className="section-title">{formMode === 'create' ? 'Register New Staff' : 'Edit Profile'}</h2>
                  <span className="section-subtitle">{formMode === 'edit' ? `Editing: ${formData.firstName} ${formData.lastName}` : 'Enter all required organizational details'}</span>
                </div>
                <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><Icon name="close" size={20}/></button>
             </header>

             {/* Tab Navigation */}
             <div className="flex border-b" style={{ background: 'var(--gray-50)' }}>
                {['identity', 'job', 'additional'].map(tab => (
                  <button 
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    style={{ 
                      padding: '12px 24px', fontSize: '13px', fontWeight: 600, border: 'none', cursor: 'pointer',
                      borderBottom: activeTab === tab ? '2px solid var(--blue-600)' : 'none',
                      color: activeTab === tab ? 'var(--blue-600)' : 'var(--gray-500)',
                      background: 'none', transition: '0.2s'
                    }}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)} Info
                  </button>
                ))}
             </div>

             <div className="card-body" style={{ overflowY: 'auto', padding: '24px' }}>
                <form id="employee-master-form" onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  
                  {activeTab === 'identity' && (
                    <div className="grid grid-cols-2 gap-16 animate-fade-in">
                      <div><label className="form-label">First Name *</label><input required className="form-control" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} /></div>
                      <div><label className="form-label">Last Name *</label><input required className="form-control" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} /></div>
                      <div><label className="form-label">Email Address *</label><input type="email" required className="form-control" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} disabled={formMode === 'edit'} /></div>
                      <div><label className="form-label">Phone Number</label><input className="form-control" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} /></div>
                      <div>
                        <label className="form-label">Gender</label>
                        <select className="form-control" value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})}>
                          <option value="Male">Male</option><option value="Female">Female</option><option value="Prefer not to say">Prefer not to say</option>
                        </select>
                      </div>
                      <div><label className="form-label">Date of Birth</label><input type="date" className="form-control" value={formData.dateOfBirth} onChange={e => setFormData({...formData, dateOfBirth: e.target.value})} /></div>
                    </div>
                  )}

                  {activeTab === 'job' && (
                    <div className="grid grid-cols-2 gap-16 animate-fade-in">
                      <div><label className="form-label">Employee ID (System Code) *</label><input required className="form-control" value={formData.employeeId} onChange={e => setFormData({...formData, employeeId: e.target.value})} /></div>
                      <div>
                        <label className="form-label">PMU / PIU Unit *</label>
                        <select required className="form-control" value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})}>
                          <option value="">Select Department...</option>
                          {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="form-label">Designation *</label>
                        <select required className="form-control" value={formData.designation} onChange={e => setFormData({...formData, designation: e.target.value})}>
                          <option value="">Select Title...</option>
                          {designations.map(d => <option key={d._id} value={d._id}>{d.title}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="form-label">Employment Type</label>
                        <select className="form-control" value={formData.employmentType} onChange={e => setFormData({...formData, employmentType: e.target.value})}>
                          <option value="Full-Time">Full-Time</option><option value="Contract">Contract</option><option value="Intern">Intern</option>
                        </select>
                      </div>
                      <div><label className="form-label">Present Salary (Annual/Monthly) *</label><input type="number" required className="form-control" value={formData.currentSalary} onChange={e => setFormData({...formData, currentSalary: e.target.value})} /></div>
                      <div><label className="form-label">Joining Date *</label><input type="date" required className="form-control" value={formData.joiningDate} onChange={e => setFormData({...formData, joiningDate: e.target.value})} /></div>
                    </div>
                  )}

                  {activeTab === 'additional' && (
                    <div className="grid grid-cols-2 gap-16 animate-fade-in">
                      <div><label className="form-label">Project (e.g., U-Prepare)</label><input className="form-control" value={formData.project} onChange={e => setFormData({...formData, project: e.target.value})} /></div>
                      <div><label className="form-label">Unit/Section</label><input className="form-control" value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} /></div>
                      <div><label className="form-label">Office Location</label><input className="form-control" value={formData.officeLocation} onChange={e => setFormData({...formData, officeLocation: e.target.value})} /></div>
                      <div><label className="form-label">Education Qualification</label><input className="form-control" value={formData.education} onChange={e => setFormData({...formData, education: e.target.value})} /></div>
                      <div><label className="form-label">Years of Experience</label><input type="number" className="form-control" value={formData.yearsOfExperience} onChange={e => setFormData({...formData, yearsOfExperience: e.target.value})} /></div>
                      <div>
                        <label className="form-label">Current Status</label>
                        <select className="form-control" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                          <option value="Active">Active</option><option value="On Leave">On Leave</option><option value="Resigned">Resigned</option><option value="Terminated">Terminated</option>
                        </select>
                      </div>
                    </div>
                  )}
                </form>
             </div>

             <footer className="card-footer border-t bg-gray-50 flex justify-end gap-12" style={{ padding: '16px 24px' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '10px 20px', background: '#fff', border: '1px solid var(--gray-300)', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" form="employee-master-form" disabled={isSubmitting} style={{ background: 'var(--blue-600)', color: '#fff', padding: '10px 24px', borderRadius: '6px', fontWeight: 700, border: 'none', cursor: 'pointer' }}>
                  {isSubmitting ? <Spinner size={16} /> : (formMode === 'create' ? 'Create Profile' : 'Save Changes')}
                </button>
             </footer>
          </article>
        </div>
      )}

      {/* --- BULK IMPORT MODAL --- */}
      {isImportModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <article className="card" style={{ width: '400px' }}>
             <header className="card-header border-b"><h2 className="section-title">Bulk Import Employees</h2></header>
             <div className="card-body" style={{ padding: '24px' }}>
                <form onSubmit={handleImportSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ padding: '24px', border: '2px dashed var(--gray-200)', borderRadius: '12px', textAlign: 'center' }}>
                    <Icon name="upload" size={32} color="var(--gray-300)" style={{ marginBottom: 12 }} />
                    <p style={{ fontSize: '13px', color: 'var(--gray-500)', marginBottom: 16 }}>Select the U-Prepare Current Strength CSV/Excel file.</p>
                    <input type="file" onChange={e => setExcelFile(e.target.files[0])} accept=".xlsx,.xls,.csv" required style={{ width: '100%', fontSize: '12px' }} />
                  </div>
                  <div className="flex justify-end gap-10">
                    <button type="button" onClick={() => setIsImportModalOpen(false)} style={{ padding: '8px 16px', background: '#fff', border: '1px solid var(--gray-300)', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
                    <button type="submit" disabled={isSubmitting} style={{ padding: '8px 20px', background: 'var(--green-600)', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 700, cursor: 'pointer' }}>
                      {isSubmitting ? 'Processing...' : 'Start Import'}
                    </button>
                  </div>
                </form>
             </div>
          </article>
        </div>
      )}
    </div>
  );
}