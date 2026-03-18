import { useState } from 'react';
import { Modal, Spinner } from '../../../components/common/index.jsx';

export default function EmployeeFormModal({
  isOpen,
  onClose,
  mode,
  formData,
  setFormData,
  departments = [],
  designations = [],
  onSubmit,
  isSubmitting
}) {
  const [activeTab, setActiveTab] = useState('identity');

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const footer = (
    <>
      <button type="button" onClick={onClose} className="btn btn-secondary">
        Cancel
      </button>
      <button type="submit" form="employee-master-form" disabled={isSubmitting} className="btn btn-primary" style={{ minWidth: 120 }}>
        {isSubmitting ? <Spinner /> : (mode === 'create' ? 'Create Profile' : 'Save Changes')}
      </button>
    </>
  );

  return (
    <Modal 
      title={mode === 'create' ? 'Register New Staff' : `Editing: ${formData.firstName} ${formData.lastName}`} 
      onClose={onClose} 
      footer={footer}
      wide
    >
      {/* Custom Tab Navigation */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--gray-200)', marginBottom: 20 }}>
        {['identity', 'job', 'additional'].map(tab => (
          <button 
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1,
              padding: '12px 0',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === tab ? '2px solid var(--blue-600)' : '2px solid transparent',
              color: activeTab === tab ? 'var(--blue-700)' : 'var(--gray-500)',
              fontWeight: 700,
              fontSize: 13,
              textTransform: 'capitalize',
              transition: 'all 0.2s',
            }}
          >
            {tab} Info
          </button>
        ))}
      </div>

      <form id="employee-master-form" onSubmit={onSubmit}>
        
        {activeTab === 'identity' && (
          <div className="grid-2" style={{ animation: 'fadeIn 0.2s ease' }}>
            <div className="form-group">
              <label className="form-label">First Name *</label>
              <input required name="firstName" className="form-control" value={formData.firstName} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Last Name *</label>
              <input required name="lastName" className="form-control" value={formData.lastName} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Email Address *</label>
              <input type="email" required name="email" className="form-control" value={formData.email} onChange={handleChange} disabled={mode === 'edit'} />
            </div>
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input name="phone" className="form-control" value={formData.phone} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Gender</label>
              <select name="gender" className="form-control" value={formData.gender} onChange={handleChange}>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Date of Birth</label>
              <input type="date" name="dateOfBirth" className="form-control" value={formData.dateOfBirth?.split('T')[0] || ''} onChange={handleChange} />
            </div>
          </div>
        )}

        {activeTab === 'job' && (
          <div className="grid-2" style={{ animation: 'fadeIn 0.2s ease' }}>
            <div className="form-group">
              <label className="form-label">Employee ID *</label>
              <input required name="employeeId" className="form-control" value={formData.employeeId} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Department / Unit *</label>
              <select required name="department" className="form-control" value={formData.department} onChange={handleChange}>
                <option value="">Select Department...</option>
                {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Designation *</label>
              <select required name="designation" className="form-control" value={formData.designation} onChange={handleChange}>
                <option value="">Select Title...</option>
                {designations.map(d => <option key={d._id} value={d._id}>{d.title}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Employment Type</label>
              <select name="employmentType" className="form-control" value={formData.employmentType} onChange={handleChange}>
                <option value="Full-Time">Full-Time</option>
                <option value="Contract">Contract</option>
                <option value="Intern">Intern</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Current Salary (₹) *</label>
              <input type="number" required name="currentSalary" className="form-control" value={formData.currentSalary} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Joining Date *</label>
              <input type="date" required name="joiningDate" className="form-control" value={formData.joiningDate?.split('T')[0] || ''} onChange={handleChange} />
            </div>
          </div>
        )}

        {activeTab === 'additional' && (
          <div className="grid-2" style={{ animation: 'fadeIn 0.2s ease' }}>
            <div className="form-group">
              <label className="form-label">Project</label>
              <input name="project" className="form-control" value={formData.project} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Office Location</label>
              <input name="officeLocation" className="form-control" value={formData.officeLocation} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Education</label>
              <input name="education" className="form-control" value={formData.education} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Years of Experience</label>
              <input type="number" name="yearsOfExperience" className="form-control" value={formData.yearsOfExperience} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Current Status</label>
              <select name="status" className="form-control" value={formData.status} onChange={handleChange}>
                <option value="Active">Active</option>
                <option value="On Leave">On Leave</option>
                <option value="Resigned">Resigned</option>
                <option value="Terminated">Terminated</option>
              </select>
            </div>
          </div>
        )}
      </form>
    </Modal>
  );
}