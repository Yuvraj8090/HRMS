import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { attendanceService } from '../services/attendanceService';
import { employeeService } from '../services/employeeService';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Clock, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

const Attendance = () => {
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [todayRecord, setTodayRecord] = useState(null);
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [attendanceData, employeesData] = await Promise.all([
        attendanceService.getAttendance(),
        employeeService.getEmployees(),
      ]);
      setAttendanceRecords(attendanceData);
      setEmployees(employeesData);

      const today = new Date().toISOString().split('T')[0];
      const userAttendance = attendanceData.find(
        (record) => record.employee_id === user.employee_id && record.date === today
      );
      setTodayRecord(userAttendance);
    } catch (error) {
      toast.error('Failed to load attendance');
    } finally {
      setLoading(false);
    }
  };

  const handleClockIn = async () => {
    try {
      await attendanceService.clockIn({
        employee_id: user.employee_id,
        company_id: user.company_id,
      });
      toast.success('Clocked in successfully');
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to clock in');
    }
  };

  const handleClockOut = async () => {
    try {
      await attendanceService.clockOut({
        attendance_id: todayRecord.id,
      });
      toast.success('Clocked out successfully');
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to clock out');
    }
  };

  const getEmployeeName = (employeeId) => {
    const employee = employees.find((emp) => emp.id === employeeId);
    return employee ? `${employee.first_name} ${employee.last_name}` : 'Unknown';
  };

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
      <div data-testid="attendance-page">
        <div className="mb-6">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900" style={{ fontFamily: 'Manrope, sans-serif' }}>
            Attendance
          </h2>
          <p className="mt-1 text-sm text-slate-600">Track employee attendance and working hours</p>
        </div>

        {/* Clock In/Out Card */}
        {user.role === 'employee' && (
          <div className="mb-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-slate-900" style={{ fontFamily: 'Manrope, sans-serif' }}>
              Today's Attendance
            </h3>
            <div className="flex items-center justify-between">
              <div>
                {todayRecord ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="text-sm font-medium text-slate-900">
                        Clock In: {todayRecord.clock_in ? format(new Date(todayRecord.clock_in), 'hh:mm a') : '-'}
                      </span>
                    </div>
                    {todayRecord.clock_out && (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span className="text-sm font-medium text-slate-900">
                          Clock Out: {format(new Date(todayRecord.clock_out), 'hh:mm a')}
                        </span>
                      </div>
                    )}
                    {todayRecord.working_hours && (
                      <p className="text-sm text-slate-600">
                        Working Hours: <span className="font-semibold">{todayRecord.working_hours}h</span>
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-slate-600">You haven't clocked in today</p>
                )}
              </div>
              <div className="flex gap-3">
                {!todayRecord && (
                  <Button
                    onClick={handleClockIn}
                    data-testid="clock-in-btn"
                    className="bg-indigo-700 hover:bg-indigo-800"
                  >
                    <Clock className="mr-2 h-4 w-4" />
                    Clock In
                  </Button>
                )}
                {todayRecord && !todayRecord.clock_out && (
                  <Button
                    onClick={handleClockOut}
                    data-testid="clock-out-btn"
                    variant="outline"
                  >
                    <Clock className="mr-2 h-4 w-4" />
                    Clock Out
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Attendance Table */}
        <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-700">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-700">
                    Employee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-700">
                    Clock In
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-700">
                    Clock Out
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-700">
                    Working Hours
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-700">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {attendanceRecords.slice(0, 20).map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50" data-testid={`attendance-row-${record.id}`}>
                    <td className="px-6 py-4 text-sm text-slate-900">{record.date}</td>
                    <td className="px-6 py-4 text-sm text-slate-900">{getEmployeeName(record.employee_id)}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {record.clock_in ? format(new Date(record.clock_in), 'hh:mm a') : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {record.clock_out ? format(new Date(record.clock_out), 'hh:mm a') : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {record.working_hours ? `${record.working_hours}h` : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                          record.status === 'present'
                            ? 'bg-green-100 text-green-800'
                            : record.status === 'absent'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-slate-100 text-slate-800'
                        }`}
                      >
                        {record.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {attendanceRecords.length === 0 && (
          <div className="mt-8 text-center">
            <p className="text-slate-600">No attendance records found</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Attendance;
