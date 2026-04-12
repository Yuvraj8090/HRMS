// src/pages/hr/components/EmployeeFormModal.jsx
import { useState, useEffect } from 'react';
import { empAPI, deptAPI, desigAPI } from '../../../services/api.js';
import { useToast } from '../../../context/ToastContext.jsx';
import { Modal, Spinner } from '../../../components/common/index.jsx';

export default function EmployeeFormModal({ employee, onClose }) {
  const toast = useToast();
  const isEdit = !!employee;
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', password: '', role: 'Employee',
    employeeNumber: '', phone: '', gender: '', dateOfBirth: '',
    department: '', designation: '', joiningDate: '',
    currentSalary: '', employmentType: 'Full-Time',
    office: '', unit: '', position: '', payCode: '', cardNo: '',
    yearsOfExperience: '',
    ...employee,
    department:   employee?.department?._id  || employee?.department  || '',
    designation:  employee?.designation?._id || employee?.designation || '',
    dateOfBirth:  employee?.dateOfBirth ? new Date(employee.dateOfBirth).toISOString().slice(0,10) : '',
    joiningDate:  employee?.joiningDate  ? new Date(employee.joiningDate).toISOString().slice(0,10) : '',
  });
  const [depts,   setDepts]   = useState([]);
  const [desigs,  setDesigs]  = useState([]);
  const [loading, setLoading] = useState(false);
  const [tab,     setTab]     = useState('basic');

  useEffect(() => {
    deptAPI.getAll().then(r => setDepts(r.data.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (form.department) desigAPI.getAll({ department: form.department }).then(r => setDesigs(r.data.data || [])).catch(() => {});
    else setDesigs([]);
  }, [form.department]);

  const ch = f => e => setForm(p => ({ ...p, [f]: e.target.value }));

  const submit = async () => {
    if (!form.firstName || !form.lastName || !form.email) return toast.error('First name, last name, email required.');
    setLoading(true);
    try {
      const payload = { ...form };
      if (!payload.password) delete payload.password;
      if (isEdit) await empAPI.update(employee._id, payload);
      else        await empAPI.create(payload);
      toast.success(isEdit ? 'Employee updated.' : 'Employee created successfully!');
      onClose(true);
    } catch (e) { toast.error(e.message); }
    setLoading(false);
  };

  const T = ({ id, label }) => (
    <button type="button" onClick={() => setTab(id)}
      className={`px-4 py-2 text-xs font-700 rounded-lg transition-all ${tab === id ? 'bg-primary-600 text-white' : 'text-gray-500 hover:bg-gray-100'}`}>
      {label}
    </button>
  );

  return (
    <Modal title={isEdit ? 'Edit Employee' : 'Add New Employee'} onClose={() => onClose(false)} size="lg"
      footer={<><button className="btn btn-secondary" onClick={() => onClose(false)}>Cancel</button><button className="btn btn-primary" onClick={submit} disabled={loading}>{loading ? <Spinner size="sm" /> : isEdit ? 'Update' : 'Create Employee'}</button></>}>
      {/* Tabs */}
      <div className="flex gap-1 mb-5 p-1 bg-gray-100 rounded-xl w-fit">
        <T id="basic" label="Basic Info" /><T id="employment" label="Employment" /><T id="personal" label="Personal" />
      </div>

      {tab === 'basic' && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group"><label className="form-label">First Name *</label><input className="form-control" value={form.firstName} onChange={ch('firstName')} placeholder="Rahul" /></div>
            <div className="form-group"><label className="form-label">Last Name *</label><input className="form-control" value={form.lastName} onChange={ch('lastName')} placeholder="Kumar" /></div>
          </div>
          <div className="form-group"><label className="form-label">Email *</label><input type="email" className="form-control" value={form.email} onChange={ch('email')} placeholder="rahul@company.com" /></div>
          {!isEdit && <div className="form-group"><label className="form-label">Password (blank = auto)</label><input type="password" className="form-control" value={form.password} onChange={ch('password')} placeholder="Leave blank to auto-generate" /></div>}
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group"><label className="form-label">Role</label><select className="form-control" value={form.role} onChange={ch('role')}><option value="Employee">Employee</option><option value="HR">HR</option></select></div>
            <div className="form-group"><label className="form-label">Phone</label><input className="form-control" value={form.phone} onChange={ch('phone')} placeholder="+91 98765 43210" /></div>
          </div>
        </>
      )}

      {tab === 'employment' && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group"><label className="form-label">Employee Number</label><input className="form-control" value={form.employeeNumber} onChange={ch('employeeNumber')} placeholder="EMP001" /></div>
            <div className="form-group"><label className="form-label">Pay Code</label><input className="form-control" value={form.payCode} onChange={ch('payCode')} placeholder="U-PREP75" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group"><label className="form-label">Department</label>
              <select className="form-control" value={form.department} onChange={e => { ch('department')(e); setForm(p => ({ ...p, designation: '' })); }}>
                <option value="">Select department</option>{depts.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
              </select>
            </div>
            <div className="form-group"><label className="form-label">Designation</label>
              <select className="form-control" value={form.designation} onChange={ch('designation')} disabled={!form.department}>
                <option value="">Select designation</option>{desigs.map(d => <option key={d._id} value={d._id}>{d.title}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group"><label className="form-label">Joining Date</label><input type="date" className="form-control" value={form.joiningDate} onChange={ch('joiningDate')} /></div>
            <div className="form-group"><label className="form-label">Employment Type</label>
              <select className="form-control" value={form.employmentType} onChange={ch('employmentType')}>
                {['Full-Time','Part-Time','Contract','Intern','Deputation'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group"><label className="form-label">Current Salary (₹ annual)</label><input type="number" className="form-control" value={form.currentSalary} onChange={ch('currentSalary')} placeholder="800000" /></div>
            <div className="form-group"><label className="form-label">Card No</label><input className="form-control" value={form.cardNo} onChange={ch('cardNo')} placeholder="CARD001" /></div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="form-group"><label className="form-label">Office</label><input className="form-control" value={form.office} onChange={ch('office')} placeholder="HQ" /></div>
            <div className="form-group"><label className="form-label">Unit</label><input className="form-control" value={form.unit} onChange={ch('unit')} placeholder="Engineering" /></div>
            <div className="form-group"><label className="form-label">Position</label><input className="form-control" value={form.position} onChange={ch('position')} placeholder="Senior Developer" /></div>
          </div>
        </>
      )}

      {tab === 'personal' && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group"><label className="form-label">Date of Birth</label><input type="date" className="form-control" value={form.dateOfBirth} onChange={ch('dateOfBirth')} /></div>
            <div className="form-group"><label className="form-label">Gender</label>
              <select className="form-control" value={form.gender} onChange={ch('gender')}>
                <option value="">Select</option>{['Male','Female','Non-Binary','Prefer not to say'].map(g => <option key={g}>{g}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group"><label className="form-label">Years of Experience</label><input type="number" className="form-control" value={form.yearsOfExperience} onChange={ch('yearsOfExperience')} placeholder="5" /></div>
        </>
      )}
    </Modal>
  );
}
