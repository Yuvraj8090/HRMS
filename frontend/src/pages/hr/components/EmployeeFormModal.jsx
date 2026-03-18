import { useState } from 'react';
import { Icon, Spinner } from '../../../components/common/index.jsx';

export default function EmployeeFormModal({
  isOpen,
  onClose,
  mode,
  formData,
  setFormData,
  departments,
  designations,
  onSubmit,
  isSubmitting
}) {
  const [activeTab, setActiveTab] = useState('identity');

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[1000] p-4 backdrop-blur-sm animate-fade-in">
      <article className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-scale-up">
        
        {/* Modal Header */}
        <header className="border-b border-gray-100 flex justify-between items-center p-6 bg-gray-50/50">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {mode === 'create' ? 'Register New Staff' : 'Edit Profile'}
            </h2>
            <span className="text-sm text-gray-500 font-medium mt-1 block">
              {mode === 'edit' ? `Editing: ${formData.firstName} ${formData.lastName}` : 'Enter all required organizational details'}
            </span>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500">
            <Icon name="close" size={20} />
          </button>
        </header>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 bg-gray-50">
          {['identity', 'job', 'additional'].map(tab => (
            <button 
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-4 text-sm font-bold capitalize transition-colors border-b-2 ${
                activeTab === tab 
                  ? 'border-blue-600 text-blue-600 bg-blue-50/30' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              {tab} Info
            </button>
          ))}
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <form id="employee-master-form" onSubmit={onSubmit} className="flex flex-col gap-6">
            
            {activeTab === 'identity' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">First Name *</label>
                  <input required name="firstName" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow" value={formData.firstName} onChange={handleChange} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Last Name *</label>
                  <input required name="lastName" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow" value={formData.lastName} onChange={handleChange} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address *</label>
                  <input type="email" required name="email" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow disabled:bg-gray-100 disabled:text-gray-500" value={formData.email} onChange={handleChange} disabled={mode === 'edit'} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
                  <input name="phone" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow" value={formData.phone} onChange={handleChange} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Gender</label>
                  <select name="gender" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow bg-white" value={formData.gender} onChange={handleChange}>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Date of Birth</label>
                  <input type="date" name="dateOfBirth" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow" value={formData.dateOfBirth} onChange={handleChange} />
                </div>
              </div>
            )}

            {activeTab === 'job' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Employee ID *</label>
                  <input required name="employeeId" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-shadow" value={formData.employeeId} onChange={handleChange} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Department / Unit *</label>
                  <select required name="department" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-shadow bg-white" value={formData.department} onChange={handleChange}>
                    <option value="">Select Department...</option>
                    {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Designation *</label>
                  <select required name="designation" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-shadow bg-white" value={formData.designation} onChange={handleChange}>
                    <option value="">Select Title...</option>
                    {designations.map(d => <option key={d._id} value={d._id}>{d.title}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Employment Type</label>
                  <select name="employmentType" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-shadow bg-white" value={formData.employmentType} onChange={handleChange}>
                    <option value="Full-Time">Full-Time</option>
                    <option value="Contract">Contract</option>
                    <option value="Intern">Intern</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Current Salary *</label>
                  <input type="number" required name="currentSalary" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-shadow" value={formData.currentSalary} onChange={handleChange} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Joining Date *</label>
                  <input type="date" required name="joiningDate" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-shadow" value={formData.joiningDate} onChange={handleChange} />
                </div>
              </div>
            )}

            {activeTab === 'additional' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Project</label>
                  <input name="project" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={formData.project} onChange={handleChange} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Office Location</label>
                  <input name="officeLocation" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={formData.officeLocation} onChange={handleChange} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Education</label>
                  <input name="education" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={formData.education} onChange={handleChange} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Years of Experience</label>
                  <input type="number" name="yearsOfExperience" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={formData.yearsOfExperience} onChange={handleChange} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Current Status</label>
                  <select name="status" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white" value={formData.status} onChange={handleChange}>
                    <option value="Active">Active</option>
                    <option value="On Leave">On Leave</option>
                    <option value="Resigned">Resigned</option>
                    <option value="Terminated">Terminated</option>
                  </select>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Modal Footer */}
        <footer className="border-t border-gray-100 bg-gray-50 flex justify-end gap-3 p-6">
          <button type="button" onClick={onClose} className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg font-bold hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button type="submit" form="employee-master-form" disabled={isSubmitting} className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors disabled:opacity-70 flex items-center justify-center min-w-[140px]">
            {isSubmitting ? <Spinner size={18} color="#fff" /> : (mode === 'create' ? 'Create Profile' : 'Save Changes')}
          </button>
        </footer>
      </article>
    </div>
  );
}