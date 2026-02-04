import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { employeeService } from '../services/employeeService';
import { attendanceService } from '../services/attendanceService';
import { leaveService } from '../services/leaveService';
import { Users, Clock, Calendar, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalEmployees: 0,
    activeEmployees: 0,
    todayAttendance: 0,
    pendingLeaves: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [employees, attendance, leaves] = await Promise.all([
        employeeService.getEmployees(),
        attendanceService.getAttendance(),
        leaveService.getLeaves({ status: 'pending' }),
      ]);

      setStats({
        totalEmployees: employees.length,
        activeEmployees: employees.filter((e) => e.employment_status === 'active').length,
        todayAttendance: attendance.length,
        pendingLeaves: leaves.length,
      });
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      name: 'Total Employees',
      value: stats.totalEmployees,
      icon: Users,
      color: 'bg-indigo-100 text-indigo-700',
      testId: 'stat-total-employees',
    },
    {
      name: 'Active Employees',
      value: stats.activeEmployees,
      icon: TrendingUp,
      color: 'bg-green-100 text-green-700',
      testId: 'stat-active-employees',
    },
    {
      name: "Today's Attendance",
      value: stats.todayAttendance,
      icon: Clock,
      color: 'bg-blue-100 text-blue-700',
      testId: 'stat-attendance',
    },
    {
      name: 'Pending Leaves',
      value: stats.pendingLeaves,
      icon: Calendar,
      color: 'bg-amber-100 text-amber-700',
      testId: 'stat-pending-leaves',
    },
  ];

  const attendanceData = [
    { name: 'Mon', present: 45, absent: 5 },
    { name: 'Tue', present: 48, absent: 2 },
    { name: 'Wed', present: 47, absent: 3 },
    { name: 'Thu', present: 46, absent: 4 },
    { name: 'Fri', present: 49, absent: 1 },
  ];

  const departmentData = [
    { name: 'Engineering', value: 35, color: '#4338ca' },
    { name: 'Sales', value: 25, color: '#10b981' },
    { name: 'Marketing', value: 20, color: '#f59e0b' },
    { name: 'HR', value: 10, color: '#3b82f6' },
    { name: 'Finance', value: 10, color: '#8b5cf6' },
  ];

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
      <div data-testid="dashboard-page">
        <div className="mb-6">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900" style={{ fontFamily: 'Manrope, sans-serif' }}>
            Welcome back, {user?.email?.split('@')[0]}!
          </h2>
          <p className="mt-1 text-sm text-slate-600">Here's what's happening with your organization today.</p>
        </div>

        {/* Stats Grid */}
        <div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.name}
                data-testid={stat.testId}
                className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow duration-200"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">{stat.name}</p>
                    <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{stat.value}</p>
                  </div>
                  <div className={`rounded-lg p-3 ${stat.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Charts Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Attendance Chart */}
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-slate-900" style={{ fontFamily: 'Manrope, sans-serif' }}>
              Weekly Attendance
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={attendanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#64748b" style={{ fontSize: '12px' }} />
                <YAxis stroke="#64748b" style={{ fontSize: '12px' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="present" fill="#4338ca" radius={[4, 4, 0, 0]} />
                <Bar dataKey="absent" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Department Distribution */}
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-slate-900" style={{ fontFamily: 'Manrope, sans-serif' }}>
              Department Distribution
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={departmentData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => entry.name}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {departmentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
