// src/pages/hr/EmployeeList.jsx
import { useState, useEffect, useCallback } from 'react';
import { empAPI, deptAPI } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { Icon, Spinner, EmptyState, ConfirmDialog } from '../../components/common/index.jsx';
import EmployeeTable from './components/EmployeeTable.jsx';
import EmployeeFormModal from './components/EmployeeFormModal.jsx';
import useDebounce from '../../hooks/useDebounce.js';

export default function EmployeeList() {
  const toast = useToast();
  const { isAdmin } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [depts,     setDepts]     = useState([]);
  const [total,     setTotal]     = useState(0);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState('');
  const [dept,      setDept]      = useState('');
  const [page,      setPage]      = useState(1);
  const [modal,     setModal]     = useState(null); // null | {} | employee object
  const [deacting,  setDeacting]  = useState(null);
  const LIMIT = 15;
  const dSearch = useDebounce(search, 400);

  useEffect(() => { deptAPI.getAll().then(r => setDepts(r.data.data || [])).catch(() => {}); }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p = { page, limit: LIMIT };
      if (dSearch) p.search = dSearch;
      if (dept)    p.department = dept;
      const r = await empAPI.getAll(p);
      setEmployees(r.data.data || []); setTotal(r.data.total || 0);
    } catch {}
    setLoading(false);
  }, [page, dSearch, dept]);

  useEffect(() => { load(); }, [load]);
  const handleDeactivate = async () => {
    try { await empAPI.deactivate(deacting._id); toast.success('Employee deactivated.'); setDeacting(null); load(); } catch (e) { toast.error(e.message); }
  };

  const pages = Math.ceil(total / LIMIT);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h2 className="page-title">Employees</h2><p className="text-sm text-gray-400 mt-0.5">{total} total</p></div>
        <button className="btn btn-primary" onClick={() => setModal({})}><Icon name="plus" size={14} />Add Employee</button>
      </div>
      {/* Filters */}
      <div className="card card-bd flex gap-3 flex-wrap items-end">
        <div className="flex-1 min-w-[180px]">
          <label className="form-label">Search</label>
          <div className="relative"><Icon name="search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input className="form-control pl-8" placeholder="Name, email, ID…" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} /></div>
        </div>
        <div>
          <label className="form-label">Department</label>
          <select className="form-control min-w-[160px]" value={dept} onChange={e => { setDept(e.target.value); setPage(1); }}>
            <option value="">All Departments</option>{depts.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
          </select>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={() => { setSearch(''); setDept(''); setPage(1); }}>Clear</button>
      </div>
      {/* Table */}
      <div className="card">
        {loading ? <div className="flex justify-center py-14"><Spinner size="lg" /></div>
        : employees.length === 0 ? <EmptyState icon="👥" title="No employees found" sub="Try adjusting filters." />
        : <EmployeeTable employees={employees} onEdit={e => setModal(e)} canDeactivate={isAdmin} onDeactivate={e => setDeacting(e)} />}
        {pages > 1 && (
          <div className="flex justify-between items-center px-5 py-3 border-t border-gray-100">
            <span className="text-xs text-gray-400">Page {page} of {pages}</span>
            <div className="flex gap-2">
              <button className="btn btn-secondary btn-sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
              <button className="btn btn-secondary btn-sm" disabled={page >= pages} onClick={() => setPage(p => p + 1)}>Next →</button>
            </div>
          </div>
        )}
      </div>
      {modal !== null && <EmployeeFormModal employee={modal?._id ? modal : null} onClose={r => { setModal(null); if (r) load(); }} />}
      {deacting && <ConfirmDialog title="Deactivate Employee" message={`Deactivate ${deacting.firstName} ${deacting.lastName}? They will lose system access.`} danger onConfirm={handleDeactivate} onCancel={() => setDeacting(null)} />}
    </div>
  );
}
