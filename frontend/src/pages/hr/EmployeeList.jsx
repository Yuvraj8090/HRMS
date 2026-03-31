import React, { useState, useEffect, useCallback } from 'react';
import EmployeeTable from './components/EmployeeTable';
import { employeeAPI, departmentAPI, designationAPI } from '../../services/api';
import useDebounce from '../../hooks/useDebounce';
// Assume these exist, or we will build them next
// import BulkImportModal from './components/BulkImportModal';
// import EmployeeFormModal from './components/EmployeeFormModal';

export default function EmployeeList() {
  // ─── Data State ─────────────────────────────────────────────────────────────
  const [employees, setEmployees] = useState([]);
  const [designations, setDesignations] = useState([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // ─── Table & Pagination State ───────────────────────────────────────────────
  const [totalRecords, setTotalRecords] = useState(0);
  const [pageCount, setPageCount] = useState(0);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [sorting, setSorting] = useState([]);
  
  // ─── Filter & Search State ──────────────────────────────────────────────────
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 500);
  
  const [filters, setFilters] = useState({
    department: '',
    designation: '',
    status: ''
  });

  // ─── Modal States ───────────────────────────────────────────────────────────
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  // ─── Fetch Master Data (Dropdowns) ──────────────────────────────────────────
  useEffect(() => {
    const fetchMasters = async () => {
      try {
        const [deptRes, desigRes] = await Promise.all([
          departmentAPI.getAll(),
          designationAPI.getAll()
        ]);
        setDepartments(deptRes.data.data || []);
        setDesignations(desigRes.data.data || []);
      } catch (err) {
        console.error('Failed to load master data', err);
      }
    };
    fetchMasters();
  }, []);

  // ─── Fetch Employee Data ────────────────────────────────────────────────────
  const fetchEmployees = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Build query params based on your backend API contract
      const params = {
        page: pagination.pageIndex + 1, // React table is 0-indexed, API is 1-indexed
        limit: pagination.pageSize,
        search: debouncedSearch,
        department: filters.department,
        status: filters.status,
        // Add sorting if your backend supports it
        ...(sorting.length > 0 && { 
          sortBy: sorting[0].id, 
          sortDesc: sorting[0].desc 
        })
      };

      const response = await employeeAPI.getAll(params);
      
      setEmployees(response.data.data);
      setTotalRecords(response.data.total);
      setPageCount(response.data.pages);
    } catch (err) {
      setError(err.message || 'Failed to fetch employees');
      // In a real app, integrate your ToastContext here
    } finally {
      setIsLoading(false);
    }
  }, [pagination, debouncedSearch, filters, sorting]);

  // Trigger fetch when dependencies change
  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  // Reset to page 0 if filters or search change
  useEffect(() => {
    setPagination(prev => ({ ...prev, pageIndex: 0 }));
  }, [debouncedSearch, filters]);

  // ─── Handlers ───────────────────────────────────────────────────────────────
  const handleEdit = (employee) => {
    setSelectedEmployee(employee);
    setIsFormModalOpen(true);
  };

  const handleAddNew = () => {
    setSelectedEmployee(null);
    setIsFormModalOpen(true);
  };

  return (
    <div className="page-container p-6">
      {/* Header Area */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Personnel Roster</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage contractual staff, view statuses, and handle U-Prepare project assignments.
          </p>
        </div>
        
        <div className="flex gap-4">
          <button 
            className="btn btn-secondary flex items-center gap-2 border border-gray-300 px-4 py-2 rounded shadow-sm hover:bg-gray-50"
            onClick={() => setIsImportModalOpen(true)}
          >
            {/* Insert your Icon component here */}
            <span>Bulk Import (Excel)</span>
          </button>
          
          <button 
            className="btn btn-primary flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded shadow-sm hover:bg-blue-700"
            onClick={handleAddNew}
          >
            <span>+ Add Employee</span>
          </button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded mb-6 border border-red-200">
          {error}
        </div>
      )}

      {/* Table Component */}
      <EmployeeTable 
        data={employees}
        isLoading={isLoading}
        pageCount={pageCount}
        totalRecords={totalRecords}
        pagination={pagination}
        setPagination={setPagination}
        sorting={sorting}
        setSorting={setSorting}
        searchInput={searchInput}
        setSearchInput={setSearchInput}
        filters={filters}
        setFilters={setFilters}
        departments={departments}
        designations={designations}
        onEdit={handleEdit}
      />

      {/* Modals (Placeholders for next step) */}
      {/* <BulkImportModal 
        isOpen={isImportModalOpen} 
        onClose={() => setIsImportModalOpen(false)} 
        onSuccess={fetchEmployees}
      />
      <EmployeeFormModal 
        isOpen={isFormModalOpen} 
        employee={selectedEmployee} 
        onClose={() => setIsFormModalOpen(false)} 
        onSuccess={fetchEmployees}
      /> 
      */}
    </div>
  );
}