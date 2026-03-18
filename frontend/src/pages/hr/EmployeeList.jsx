import { useState, useEffect, useCallback } from 'react';
import { employeeAPI, departmentAPI, designationAPI } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Icon } from '../../components/common/index.jsx';
import { useDebounce } from '../../hooks/useDebounce';
import EmployeeTable from './components/EmployeeTable';
import EmployeeFormModal from './components/EmployeeFormModal';
import BulkImportModal from './components/BulkImportModal';

const INITIAL_FORM = {
  firstName: '', lastName: '', email: '', phone: '', gender: 'Male', 
  dateOfBirth: '', employeeId: '', department: '', designation: '', 
  employmentType: 'Full-Time', currentSalary: '', joiningDate: '', 
  project: '', officeLocation: '', education: '', yearsOfExperience: '', status: 'Active'
};

export default function EmployeeList() {
  const toast = useToast();
  
  // -- Domain Data State --
  const [data, setData] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [pageCount, setPageCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  
  // -- Auxiliary Data State (for Form Dropdowns) --
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  
  // -- Interface / Pagination State --
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 400);
  const [sorting, setSorting] = useState([]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

  // -- Modal States --
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState('create');
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [selectedUserId, setSelectedUserId] = useState(null); // CRITICAL FIX: Track User ID, not Profile ID
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importFile, setImportFile] = useState(null);

  // Reset pagination when search changes
  useEffect(() => {
    setPagination(prev => ({ ...prev, pageIndex: 0 }));
  }, [debouncedSearch]);

  // -- Infrastructure / Data Fetching --
  const loadDirectory = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = {
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
        search: debouncedSearch || undefined,
      };

      const [empRes, deptRes, desigRes] = await Promise.all([
        employeeAPI.getAll(params),
        departmentAPI.getAll().catch(() => ({ data: { data: [] } })),
        designationAPI.getAll().catch(() => ({ data: { data: [] } }))
      ]);

      if (empRes.data?.success) {
        setData(empRes.data.data || []);
        setTotalRecords(empRes.data.total || 0);
        setPageCount(empRes.data.pages || 0);
      }
      if (deptRes.data?.success) setDepartments(deptRes.data.data);
      if (desigRes.data?.success) setDesignations(desigRes.data.data);

    } catch (err) {
      toast.error('Failed to synchronize directory. Please check network logs.');
    } finally {
      setIsLoading(false);
    }
  }, [pagination.pageIndex, pagination.pageSize, debouncedSearch, toast]);

  useEffect(() => { loadDirectory(); }, [loadDirectory]);

  // -- Handlers: Form Modal --
  const handleOpenCreate = () => {
    setFormMode('create');
    setFormData(INITIAL_FORM);
    setSelectedUserId(null);
    setIsFormOpen(true);
  };

  const handleEditClick = useCallback((employeeInfo) => {
    setFormMode('edit');
    
    // CRITICAL FIX: The backend route PUT /employees/:id expects the USER ID, not the Profile ID.
    // Ensure we grab the nested user._id for the update payload.
    setSelectedUserId(employeeInfo.user?._id);
    
    // Map nested MongoDB structure to flat React Form structure
    setFormData({
      firstName: employeeInfo.user?.firstName || '',
      lastName: employeeInfo.user?.lastName || '',
      email: employeeInfo.user?.email || '',
      phone: employeeInfo.user?.phone || '',
      gender: employeeInfo.gender || 'Male',
      dateOfBirth: employeeInfo.dateOfBirth || '',
      employeeId: employeeInfo.employeeId || '',
      department: employeeInfo.department?._id || '',
      designation: employeeInfo.designation?._id || '',
      employmentType: employeeInfo.employmentType || 'Full-Time',
      currentSalary: employeeInfo.currentSalary || '',
      joiningDate: employeeInfo.joiningDate || '',
      project: employeeInfo.project || '',
      officeLocation: employeeInfo.officeLocation || '',
      education: employeeInfo.education || '',
      yearsOfExperience: employeeInfo.yearsOfExperience || '',
      status: employeeInfo.status || 'Active'
    });
    
    setIsFormOpen(true);
  }, []);

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (formMode === 'create') {
        await employeeAPI.create(formData);
        toast.success('Employee profile created successfully.');
      } else {
        // Use the extracted User ID for the update call
        await employeeAPI.update(selectedUserId, formData);
        toast.success('Employee profile updated successfully.');
      }
      setIsFormOpen(false);
      loadDirectory(); // Refresh the table
    } catch (err) {
      toast.error(err.message || 'Failed to save employee profile.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // -- Handlers: Import Modal --
  const handleImportSubmit = async (e) => {
    e.preventDefault();
    if (!importFile) return toast.error('Please select a file first.');
    
    const formDataObj = new FormData();
    formDataObj.append('file', importFile);

    setIsSubmitting(true);
    try {
      await employeeAPI.importAll(formDataObj);
      toast.success('Roster imported successfully.');
      setIsImportOpen(false);
      setImportFile(null);
      loadDirectory(); 
    } catch (err) {
      toast.error(err.message || 'Import failed. Please check the file format.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      
      {/* Header Section */}
      <div className="flex items-center justify-between mb-24 flex-wrap gap-16">
        <div>
          <h2 className="page-title">Staff Directory</h2>
          <p className="page-sub">Project: U-Prepare · {totalRecords} Total Personnel</p>
        </div>
        
        <div className="flex items-center gap-12">
          <button className="btn btn-secondary" onClick={() => setIsImportOpen(true)}>
            <Icon name="upload" size={16} />
            <span>Bulk Import</span>
          </button>
          <button className="btn btn-primary" onClick={handleOpenCreate}>
            <Icon name="plus" size={16} />
            <span>Add Employee</span>
          </button>
        </div>
      </div>

      {/* Presentational Table Component */}
      <EmployeeTable 
        data={data} 
        isLoading={isLoading}
        pageCount={pageCount}
        totalRecords={totalRecords}
        pagination={pagination}
        setPagination={setPagination}
        sorting={sorting}
        setSorting={setSorting}
        searchInput={searchInput}
        setSearchInput={setSearchInput}
        onEdit={handleEditClick}
      />

      {/* Modals */}
      <EmployeeFormModal 
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        mode={formMode}
        formData={formData}
        setFormData={setFormData}
        departments={departments}
        designations={designations}
        onSubmit={handleFormSubmit}
        isSubmitting={isSubmitting}
      />

      <BulkImportModal 
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onSubmit={handleImportSubmit}
        onFileChange={(e) => setImportFile(e.target.files[0])}
        isSubmitting={isSubmitting}
        file={importFile}
      />

    </div>
  );
}