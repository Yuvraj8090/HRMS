import { useState, useEffect, useCallback } from 'react';
import { employeeAPI, departmentAPI, designationAPI } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Icon } from '../../components/common/index.jsx';
import { useDebounce } from '../../hooks/useDebounce';
import EmployeeTable from './components/EmployeeTable';
import EmployeeFormModal from './components/EmployeeFormModal'; // <-- Extract your modal here later

export default function EmployeeList() {
  const toast = useToast();
  
  // -- Domain State --
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // -- Table Interface State --
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 300);
  const [sorting, setSorting] = useState([]);

  // -- Infrastructure / Data Fetching --
  const loadDirectory = useCallback(async () => {
    setIsLoading(true);
    try {
      const [empRes] = await Promise.all([
        employeeAPI.getAll(),
        // Note: Depts/Designations fetched here if needed for the Form Modal later
      ]);
      setData(empRes.data?.data || []);
    } catch (err) {
      toast.error('Failed to synchronize directory. Check network logs.');
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => { 
    loadDirectory(); 
  }, [loadDirectory]);

  // -- Application Handlers --
  const handleEditClick = useCallback((employeeInfo) => {
    // Open modal logic goes here
    console.log("Edit requested for:", employeeInfo.employeeId);
  }, []);

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto animate-fade-in space-y-6">
      
      {/* Page Header Component */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end bg-gradient-to-r from-blue-700 to-indigo-800 p-8 rounded-2xl text-white shadow-xl gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Staff Directory</h1>
          <p className="opacity-80 mt-2 font-medium">Project: U-Prepare | {data.length} Total Personnel</p>
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <button className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl font-semibold transition-all backdrop-blur-sm border border-white/20">
            <Icon name="upload" size={16} /> Import
          </button>
          <button className="flex-1 md:flex-none bg-white text-blue-700 px-6 py-3 rounded-xl font-bold hover:bg-blue-50 transition-all shadow-lg">
            + Add Employee
          </button>
        </div>
      </header>

      {/* Presentational Table Component */}
      <EmployeeTable 
        data={data} 
        isLoading={isLoading}
        sorting={sorting}
        setSorting={setSorting}
        globalFilter={debouncedSearch}
        setGlobalFilter={setSearchInput}
        searchInput={searchInput}
        onEdit={handleEditClick}
      />

    </div>
  );
}