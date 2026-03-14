// src/pages/hr/EmployeeList.jsx
import { useState, useEffect, useCallback } from 'react';
import { employeeAPI, departmentAPI, designationAPI } from '../../services/api';
import { Badge, Spinner, EmptyState, Avatar, Icon, fmtDate, currency } from '../../components/common/index.jsx';

const INITIAL_FORM_STATE = {
  firstName: '', lastName: '', email: '', employeeId: '',
  department: '', designation: '', joiningDate: '', currentSalary: '', status: 'Active'
};

export default function EmployeeList() {
  // --- Data & Listing State ---
  const [employees, setEmployees] = useState([]);
  const [departments, setDepts] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const LIMIT = 15;

  // --- Modal & Form State ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formMode, setFormMode] = useState('create'); // 'create' | 'edit'
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [editingId, setEditingId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // --- Initial Data Fetch ---
  useEffect(() => {
    Promise.all([
      departmentAPI.getAll().catch(() => ({ data: { data: [] } })),
      designationAPI.getAll().catch(() => ({ data: { data: [] } }))
    ]).then(([deptRes, desigRes]) => {
      setDepts(deptRes.data.data || []);
      setDesignations(desigRes.data.data || []);
    });
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: LIMIT };
      if (search) params.search = search;
      if (deptFilter) params.department = deptFilter;
      const { data } = await employeeAPI.getAll(params);
      setEmployees(data.data || []);
      setTotal(data.total || 0);
    } catch {
      setEmployees([]);
    }
    setLoading(false);
  }, [page, search, deptFilter]);

  useEffect(() => { load(); }, [load]);

  // --- Handlers ---
  const handleSearch = (e) => { e.preventDefault(); setPage(1); load(); };

  const openCreateModal = () => {
    setFormMode('create');
    setFormData(INITIAL_FORM_STATE);
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (employee) => {
    setFormMode('edit');
    setEditingId(employee.user?._id); // Map this to your specific route ID requirement (Profile ID vs User ID)
    
    // Safely populate format for HTML inputs
    const formattedDate = employee.joiningDate ? new Date(employee.joiningDate).toISOString().split('T')[0] : '';
    
    setFormData({
      firstName: employee.user?.firstName || '',
      lastName: employee.user?.lastName || '',
      email: employee.user?.email || '',
      employeeId: employee.employeeId || '',
      department: employee.department?._id || '',
      designation: employee.designation?._id || '',
      joiningDate: formattedDate,
      currentSalary: employee.currentSalary || '',
      status: employee.status || 'Active'
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError('');

    try {
      if (formMode === 'create') {
        await employeeAPI.create(formData);
      } else {
        await employeeAPI.update(editingId, formData);
      }
      setIsModalOpen(false);
      load(); // Refresh grid
    } catch (err) {
      setFormError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const pages = Math.ceil(total / LIMIT);

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      {/* Header section with Create Button */}
      <div className="flex justify-between items-start flex-wrap gap-16 mb-24">
        <div>
          <h2 className="page-title">Employees</h2>
          <p className="page-sub">{total} total employees</p>
        </div>
        <button className="btn btn-primary" onClick={openCreateModal}>
          <Icon name="plus" size={16} /> Add Employee
        </button>
      </div>

      {/* Filters */}
      <div className="card mb-20">
        <div className="card-body flex gap-12 flex-wrap items-end">
          <form onSubmit={handleSearch} className="flex gap-8 items-end">
            <div>
              <label className="form-label">Search</label>
              <div style={{ position: 'relative' }}>
                <Icon name="search" size={14} color="var(--gray-400)" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
                <input className="form-control" style={{ paddingLeft: 34, width: 220 }}
                  placeholder="Name or email…" value={search}
                  onChange={e => setSearch(e.target.value)} />
              </div>
            </div>
            <button type="submit" className="btn btn-primary btn-sm"><Icon name="search" size={13} /> Search</button>
          </form>
          <div>
            <label className="form-label">Department</label>
            <select className="form-control" style={{ width: 180 }} value={deptFilter} onChange={e => { setDeptFilter(e.target.value); setPage(1); }}>
              <option value="">All Departments</option>
              {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
            </select>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => { setSearch(''); setDeptFilter(''); setPage(1); }}>Clear</button>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="card-header flex justify-between items-center">
          <span className="section-title">Employee Directory</span>
          <span style={{ fontSize: 12, color: 'var(--gray-400)' }}>Showing {employees.length} of {total}</span>
        </div>
        
        {loading ? (
          <div className="flex justify-center p-40"><Spinner large /></div>
        ) : employees.length === 0 ? (
          <EmptyState icon="👥" title="No employees found" sub="Try adjusting your search or filters" />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>ID</th>
                  <th>Department</th>
                  <th>Designation</th>
                  <th>Joined</th>
                  <th>Salary</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {employees.map(e => (
                  <tr key={e._id}>
                    <td>
                      <div className="flex items-center gap-8">
                        <Avatar name={`${e.user?.firstName} ${e.user?.lastName}`} size={32} />
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--gray-900)', fontSize: 13 }}>{e.user?.firstName} {e.user?.lastName}</div>
                          <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>{e.user?.email}</div>
                        </div>
                      </div>
                    </td>
                    <td><code style={{ fontSize: 11, background: 'var(--gray-100)', padding: '2px 6px', borderRadius: 4 }}>{e.employeeId}</code></td>
                    <td style={{ fontSize: 12 }}>{e.department?.name || '—'}</td>
                    <td style={{ fontSize: 12 }}>{e.designation?.title || '—'}</td>
                    <td style={{ fontSize: 12 }}>{fmtDate(e.joiningDate)}</td>
                    <td style={{ fontWeight: 700, fontSize: 13 }}>{currency(e.currentSalary)}</td>
                    <td><Badge label={e.status || 'Active'} type={e.status === 'Active' ? 'success' : 'neutral'}/></td>
                    <td style={{ textAlign: 'right' }}>
                       <button className="btn btn-secondary btn-sm" onClick={() => openEditModal(e)}>
                         Edit
                       </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex justify-between items-center" style={{ padding: '14px 20px', borderTop: '1px solid var(--gray-100)' }}>
            <span style={{ fontSize: 12, color: 'var(--gray-400)' }}>Page {page} of {pages}</span>
            <div className="flex gap-8">
              <button className="btn btn-secondary btn-sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</button>
              <button className="btn btn-secondary btn-sm" disabled={page >= pages} onClick={() => setPage(p => p + 1)}>Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Unified Create/Edit Modal Overlay */}
      {isModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: 'fadeIn 0.2s ease'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: 600, maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            
            <div className="card-header border-b" style={{ padding: '20px 24px' }}>
              <h3 style={{ margin: 0, fontSize: 18, color: 'var(--gray-900)' }}>
                {formMode === 'create' ? 'Add New Employee' : 'Edit Employee'}
              </h3>
            </div>

            <div className="card-body" style={{ overflowY: 'auto', padding: '24px' }}>
              {formError && (
                <div style={{ background: '#FEE2E2', color: '#991B1B', padding: '10px 14px', borderRadius: 6, marginBottom: 20, fontSize: 14 }}>
                  {formError}
                </div>
              )}

              <form id="employee-form" onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                
                {/* Personal Info */}
                <div className="grid grid-cols-2 gap-16">
                  <div>
                    <label className="form-label">First Name *</label>
                    <input required className="form-control" value={formData.firstName} onChange={e => setFormData({ ...formData, firstName: e.target.value })} />
                  </div>
                  <div>
                    <label className="form-label">Last Name *</label>
                    <input required className="form-control" value={formData.lastName} onChange={e => setFormData({ ...formData, lastName: e.target.value })} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-16">
                  <div>
                    <label className="form-label">Email *</label>
                    <input type="email" required disabled={formMode === 'edit'} className="form-control" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} 
                           style={formMode === 'edit' ? { background: 'var(--gray-50)', cursor: 'not-allowed' } : {}}/>
                  </div>
                  <div>
                    <label className="form-label">Employee ID *</label>
                    <input required disabled={formMode === 'edit'} className="form-control" value={formData.employeeId} onChange={e => setFormData({ ...formData, employeeId: e.target.value })} 
                           style={formMode === 'edit' ? { background: 'var(--gray-50)', cursor: 'not-allowed' } : {}}/>
                  </div>
                </div>

                {/* Professional Info */}
                <div className="grid grid-cols-2 gap-16">
                  <div>
                    <label className="form-label">Department *</label>
                    <select required className="form-control" value={formData.department} onChange={e => setFormData({ ...formData, department: e.target.value })}>
                      <option value="">Select Department</option>
                      {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Designation *</label>
                    <select required className="form-control" value={formData.designation} onChange={e => setFormData({ ...formData, designation: e.target.value })}>
                      <option value="">Select Designation</option>
                      {designations.map(d => <option key={d._id} value={d._id}>{d.title}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-16">
                  <div>
                    <label className="form-label">Joining Date *</label>
                    <input type="date" required className="form-control" value={formData.joiningDate} onChange={e => setFormData({ ...formData, joiningDate: e.target.value })} />
                  </div>
                  <div>
                    <label className="form-label">Salary *</label>
                    <input type="number" required min="0" className="form-control" value={formData.currentSalary} onChange={e => setFormData({ ...formData, currentSalary: e.target.value })} />
                  </div>
                  {formMode === 'edit' && (
                    <div>
                      <label className="form-label">Status</label>
                      <select className="form-control" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                        <option value="Resigned">Resigned</option>
                        <option value="Terminated">Terminated</option>
                      </select>
                    </div>
                  )}
                </div>
              </form>
            </div>

            <div className="card-footer border-t bg-gray-50 flex justify-end gap-12" style={{ padding: '16px 24px' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>
                Cancel
              </button>
              <button type="submit" form="employee-form" className="btn btn-primary" disabled={isSubmitting}>
                {isSubmitting ? <Spinner size={16} /> : (formMode === 'create' ? 'Create Employee' : 'Save Changes')}
              </button>
            </div>
            
          </div>
        </div>
      )}
    </div>
  );
}