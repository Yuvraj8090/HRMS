import React, { useEffect, useState, useMemo } from 'react';
import Layout from '../components/Layout';
import { employeeService } from '../services/employeeService';
import { companyService } from '../services/companyService';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Plus, Search, Edit, Eye, Trash2, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';

// --- Utility to handle FastAPI 422 Errors safely ---
const getErrorMessage = (error) => {
  const detail = error.response?.data?.detail;
  if (Array.isArray(detail)) {
    // It's a Pydantic Validation Error (Array of objects)
    return detail.map(err => `${err.loc[1]}: ${err.msg}`).join(', ');
  }
  // It's a standard HTTP Exception (String)
  return detail || 'An unexpected error occurred';
};

const INITIAL_STATE = {
  employee_code: '',
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  designation: '',
  department_id: '',
  employment_type: 'full_time',
  date_of_joining: '',
};

const Employees = () => {
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal State Management
  const [dialogMode, setDialogMode] = useState(null); // 'add' | 'edit' | 'view'
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [formData, setFormData] = useState(INITIAL_STATE);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const [employeesData, departmentsData] = await Promise.all([
        employeeService.getEmployees(),
        // Only fetch departments if we have a company ID
        user?.company_id ? companyService.getDepartments(user.company_id) : Promise.resolve([]),
      ]);
      setEmployees(employeesData || []);
      setDepartments(departmentsData || []);
    } catch (error) {
      toast.error('Failed to load data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const openDialog = (mode, employee = null) => {
    setDialogMode(mode);
    if (employee) {
      setSelectedEmployee(employee);
      // Populate form (handle nulls to avoid uncontrolled input warnings)
      setFormData({
        ...INITIAL_STATE,
        ...employee,
        department_id: employee.department_id || '',
        phone: employee.phone || '',
        designation: employee.designation || '',
      });
    } else {
      setFormData(INITIAL_STATE);
    }
  };

  const closeDialog = () => {
    setDialogMode(null);
    setSelectedEmployee(null);
    setFormData(INITIAL_STATE);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      
      // Filter out empty strings for optional fields to keep Pydantic happy
      const cleanData = Object.fromEntries(
        Object.entries(formData).filter(([_, v]) => v !== '' && v !== null)
      );

      const payload = { 
        ...cleanData, 
        company_id: user.company_id 
      };

      if (dialogMode === 'edit') {
        await employeeService.updateEmployee(selectedEmployee.id, payload);
        toast.success('Employee updated successfully');
      } else {
        await employeeService.createEmployee(payload);
        toast.success('Employee created successfully');
      }
      
      closeDialog();
      loadData();
    } catch (error) {
      // THIS FIXED YOUR CRASH:
      const msg = getErrorMessage(error);
      toast.error(msg);
    }
  };

  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) =>
      emp.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.employee_code?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [employees, searchTerm]);

  if (loading) {
    return (
      <Layout>
        <div className="flex h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-700" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 font-manrope">
              Employees
            </h2>
            <p className="text-sm text-slate-600">Manage your organization's workforce</p>
          </div>
          <Button onClick={() => openDialog('add')} className="bg-indigo-700 hover:bg-indigo-800">
            <Plus className="mr-2 h-4 w-4" /> Add Employee
          </Button>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search by name, code or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white"
          />
        </div>

        {/* Employee Table */}
        <div className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 uppercase tracking-wider text-xs font-semibold">
                <tr>
                  <th className="px-6 py-4">Employee Details</th>
                  <th className="px-6 py-4">Contact</th>
                  <th className="px-6 py-4">Job Role</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredEmployees.length > 0 ? (
                  filteredEmployees.map((employee) => (
                    <tr key={employee.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900">{employee.first_name} {employee.last_name}</div>
                        <div className="text-xs text-slate-500 font-mono">{employee.employee_code}</div>
                      </td>
                      <td className="px-6 py-4 text-slate-600">{employee.email}</td>
                      <td className="px-6 py-4">
                        <div className="text-slate-900">{employee.designation || '-'}</div>
                        <div className="text-xs text-slate-500">
                          {departments.find(d => d.id === employee.department_id)?.name}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize
                          ${employee.employment_status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}`}>
                          {employee.employment_status?.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => openDialog('view', employee)} className="p-1 text-slate-500 hover:text-indigo-600">
                            <Eye className="h-4 w-4" />
                          </button>
                          <button onClick={() => openDialog('edit', employee)} className="p-1 text-slate-500 hover:text-indigo-600">
                            <Edit className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                      No employees found matching your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Consolidated Dialog (Add / Edit / View) */}
        <Dialog open={!!dialogMode} onOpenChange={closeDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {dialogMode === 'add' && 'Add New Employee'}
                {dialogMode === 'edit' && 'Edit Employee Details'}
                {dialogMode === 'view' && 'Employee Profile'}
              </DialogTitle>
            </DialogHeader>

            {dialogMode === 'view' ? (
              // --- READ ONLY VIEW ---
              <div className="grid grid-cols-2 gap-y-6 pt-4 text-sm">
                <div className="col-span-2 flex items-center gap-4 pb-4 border-b border-slate-100">
                  <div className="h-16 w-16 rounded-full bg-indigo-100 flex items-center justify-center text-xl font-bold text-indigo-700">
                    {selectedEmployee?.first_name?.[0]}{selectedEmployee?.last_name?.[0]}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">{selectedEmployee?.first_name} {selectedEmployee?.last_name}</h3>
                    <p className="text-slate-500">{selectedEmployee?.email}</p>
                  </div>
                </div>
                <div>
                   <Label className="text-xs text-slate-500 uppercase">Code</Label>
                   <p className="font-medium text-slate-900">{selectedEmployee?.employee_code}</p>
                </div>
                <div>
                   <Label className="text-xs text-slate-500 uppercase">Phone</Label>
                   <p className="font-medium text-slate-900">{selectedEmployee?.phone || 'N/A'}</p>
                </div>
                <div>
                   <Label className="text-xs text-slate-500 uppercase">Designation</Label>
                   <p className="font-medium text-slate-900">{selectedEmployee?.designation || 'N/A'}</p>
                </div>
                <div>
                   <Label className="text-xs text-slate-500 uppercase">Department</Label>
                   <p className="font-medium text-slate-900">
                     {departments.find(d => d.id === selectedEmployee?.department_id)?.name || 'N/A'}
                   </p>
                </div>
                <div>
                   <Label className="text-xs text-slate-500 uppercase">Type</Label>
                   <p className="font-medium text-slate-900 capitalize">{selectedEmployee?.employment_type?.replace('_', ' ')}</p>
                </div>
                <div>
                   <Label className="text-xs text-slate-500 uppercase">Date Joined</Label>
                   <p className="font-medium text-slate-900">{selectedEmployee?.date_of_joining || 'N/A'}</p>
                </div>
              </div>
            ) : (
              // --- ADD / EDIT FORM ---
              <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="employee_code">Employee Code <span className="text-red-500">*</span></Label>
                    <Input
                      id="employee_code"
                      required
                      value={formData.employee_code}
                      onChange={(e) => setFormData({ ...formData, employee_code: e.target.value })}
                      disabled={dialogMode === 'edit'} // Usually ID shouldn't change
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email <span className="text-red-500">*</span></Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="first_name">First Name <span className="text-red-500">*</span></Label>
                    <Input
                      id="first_name"
                      required
                      value={formData.first_name}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last_name">Last Name <span className="text-red-500">*</span></Label>
                    <Input
                      id="last_name"
                      required
                      value={formData.last_name}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="designation">Designation</Label>
                    <Input
                      id="designation"
                      value={formData.designation}
                      onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Department</Label>
                    <Select
                      value={formData.department_id}
                      onValueChange={(value) => setFormData({ ...formData, department_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Department" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map((dept) => (
                          <SelectItem key={dept.id} value={dept.id}>
                            {dept.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Employment Type</Label>
                    <Select
                      value={formData.employment_type}
                      onValueChange={(value) => setFormData({ ...formData, employment_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full_time">Full Time</SelectItem>
                        <SelectItem value="part_time">Part Time</SelectItem>
                        <SelectItem value="contract">Contract</SelectItem>
                        <SelectItem value="intern">Intern</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date_of_joining">Date of Joining</Label>
                    <Input
                      id="date_of_joining"
                      type="date"
                      value={formData.date_of_joining ? formData.date_of_joining.split('T')[0] : ''}
                      onChange={(e) => setFormData({ ...formData, date_of_joining: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <Button type="button" variant="outline" onClick={closeDialog}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-indigo-700 hover:bg-indigo-800">
                    {dialogMode === 'edit' ? 'Update Employee' : 'Add Employee'}
                  </Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default Employees;