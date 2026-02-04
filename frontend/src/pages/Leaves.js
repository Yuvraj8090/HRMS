import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { leaveService } from '../services/leaveService';
import { employeeService } from '../services/employeeService';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Plus, CheckCircle, XCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';

const Leaves = () => {
  const [leaves, setLeaves] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const user = JSON.parse(localStorage.getItem('user'));
  const [formData, setFormData] = useState({
    leave_type: 'annual',
    start_date: '',
    end_date: '',
    reason: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [leavesData, employeesData] = await Promise.all([
        leaveService.getLeaves(),
        employeeService.getEmployees(),
      ]);
      setLeaves(leavesData);
      setEmployees(employeesData);
    } catch (error) {
      toast.error('Failed to load leaves');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const startDate = new Date(formData.start_date);
      const endDate = new Date(formData.end_date);
      const daysCount = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;

      await leaveService.createLeave({
        employee_id: user.employee_id,
        company_id: user.company_id,
        leave_type: formData.leave_type,
        start_date: formData.start_date,
        end_date: formData.end_date,
        days_count: daysCount,
        reason: formData.reason,
      });
      toast.success('Leave request submitted successfully');
      setShowAddDialog(false);
      setFormData({
        leave_type: 'annual',
        start_date: '',
        end_date: '',
        reason: '',
      });
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to submit leave request');
    }
  };

  const handleApprove = async (leaveId) => {
    try {
      await leaveService.updateLeave(leaveId, { status: 'approved' });
      toast.success('Leave approved');
      loadData();
    } catch (error) {
      toast.error('Failed to approve leave');
    }
  };

  const handleReject = async (leaveId) => {
    try {
      await leaveService.updateLeave(leaveId, { status: 'rejected', rejection_reason: 'Rejected by manager' });
      toast.success('Leave rejected');
      loadData();
    } catch (error) {
      toast.error('Failed to reject leave');
    }
  };

  const getEmployeeName = (employeeId) => {
    const employee = employees.find((emp) => emp.id === employeeId);
    return employee ? `${employee.first_name} ${employee.last_name}` : 'Unknown';
  };

  const canManageLeaves = ['super_admin', 'company_admin', 'manager'].includes(user.role);

  if (loading) {
    return (
      <Layout>
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-700 border-t-transparent"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div data-testid="leaves-page">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900" style={{ fontFamily: 'Manrope, sans-serif' }}>
              Leave Management
            </h2>
            <p className="mt-1 text-sm text-slate-600">Request and manage employee leaves</p>
          </div>
          {user.employee_id && (
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button data-testid="apply-leave-btn" className="bg-indigo-700 hover:bg-indigo-800">
                  <Plus className="mr-2 h-4 w-4" />
                  Apply Leave
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Apply for Leave</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="leave_type">Leave Type</Label>
                    <Select
                      value={formData.leave_type}
                      onValueChange={(value) => setFormData({ ...formData, leave_type: value })}
                    >
                      <SelectTrigger data-testid="leave-type-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="annual">Annual Leave</SelectItem>
                        <SelectItem value="sick">Sick Leave</SelectItem>
                        <SelectItem value="casual">Casual Leave</SelectItem>
                        <SelectItem value="maternity">Maternity Leave</SelectItem>
                        <SelectItem value="paternity">Paternity Leave</SelectItem>
                        <SelectItem value="unpaid">Unpaid Leave</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="start_date">Start Date</Label>
                      <Input
                        id="start_date"
                        type="date"
                        data-testid="leave-start-date"
                        required
                        value={formData.start_date}
                        onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="end_date">End Date</Label>
                      <Input
                        id="end_date"
                        type="date"
                        data-testid="leave-end-date"
                        required
                        value={formData.end_date}
                        onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="reason">Reason</Label>
                    <Textarea
                      id="reason"
                      data-testid="leave-reason"
                      required
                      rows={3}
                      value={formData.reason}
                      onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    />
                  </div>
                  <div className="flex justify-end gap-3">
                    <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" data-testid="submit-leave-btn" className="bg-indigo-700 hover:bg-indigo-800">
                      Submit Request
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Leaves Table */}
        <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-700">
                    Employee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-700">
                    Leave Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-700">
                    Start Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-700">
                    End Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-700">
                    Days
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-700">
                    Status
                  </th>
                  {canManageLeaves && (
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-700">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {leaves.map((leave) => (
                  <tr key={leave.id} className="hover:bg-slate-50" data-testid={`leave-row-${leave.id}`}>
                    <td className="px-6 py-4 text-sm text-slate-900">{getEmployeeName(leave.employee_id)}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {leave.leave_type.replace('_', ' ').toUpperCase()}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{leave.start_date}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{leave.end_date}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{leave.days_count}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${
                          leave.status === 'approved'
                            ? 'bg-green-100 text-green-800'
                            : leave.status === 'rejected'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {leave.status === 'approved' && <CheckCircle className="h-3 w-3" />}
                        {leave.status === 'rejected' && <XCircle className="h-3 w-3" />}
                        {leave.status === 'pending' && <Clock className="h-3 w-3" />}
                        {leave.status}
                      </span>
                    </td>
                    {canManageLeaves && (
                      <td className="px-6 py-4">
                        {leave.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleApprove(leave.id)}
                              data-testid={`approve-leave-${leave.id}`}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleReject(leave.id)}
                              data-testid={`reject-leave-${leave.id}`}
                              className="border-red-200 text-red-600 hover:bg-red-50"
                            >
                              Reject
                            </Button>
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {leaves.length === 0 && (
          <div className="mt-8 text-center">
            <p className="text-slate-600">No leave requests found</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Leaves;
