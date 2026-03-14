// src/App.jsx — Main router, all pages wired per role
import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth }   from './context/AuthContext';
import { ToastProvider }           from './context/ToastContext';
import AppLayout                   from './components/layout/AppLayout';
import { PageSpinner }             from './components/common/index.jsx';

// ── Pages ──────────────────────────────────────────────────────────────────────
import LoginPage          from './pages/auth/LoginPage';

// Employee
import EmployeeDashboard  from './pages/employee/EmployeeDashboard';
import MyAttendance       from './pages/employee/MyAttendance';
import MyRequests         from './pages/employee/MyRequests';

// HR
import HRDashboard        from './pages/hr/HRDashboard';
import PendingRequests    from './pages/hr/PendingRequests';
import EmployeeList       from './pages/hr/EmployeeList';
import AttendanceOverview from './pages/hr/AttendanceOverview';

// Admin
import AdminDashboard     from './pages/admin/AdminDashboard';
import DepartmentsPage    from './pages/admin/DepartmentsPage';

// Shared
import ProjectsPage       from './pages/shared/ProjectsPage';

// ── Page Titles ────────────────────────────────────────────────────────────────
const PAGE_TITLES = {
  dashboard:   'Dashboard',
  attendance:  'Attendance',
  projects:    'Projects',
  requests:    'Requests',
  employees:   'Employees',
  departments: 'Departments',
};

// ── Portal (inner app after login) ────────────────────────────────────────────
function Portal() {
  const { role, isAuthenticated, loading } = useAuth();
  const [activePage, setActivePage] = useState('dashboard');

  if (loading)        return <PageSpinner/>;
  if (!isAuthenticated) return <Navigate to="/login" replace/>;

  const renderPage = () => {
    // Employee pages
    if (role === 'Employee') {
      switch (activePage) {
        case 'dashboard':  return <EmployeeDashboard/>;
        case 'attendance': return <MyAttendance/>;
        case 'projects':   return <ProjectsPage/>;
        case 'requests':   return <MyRequests/>;
        default:           return <EmployeeDashboard/>;
      }
    }
    // HR pages
    if (role === 'HR') {
      switch (activePage) {
        case 'dashboard':  return <HRDashboard/>;
        case 'employees':  return <EmployeeList/>;
        case 'projects':   return <ProjectsPage/>;
        case 'requests':   return <PendingRequests/>;
        case 'attendance': return <AttendanceOverview/>;
        default:           return <HRDashboard/>;
      }
    }
    // Admin pages
    if (role === 'Admin') {
      switch (activePage) {
        case 'dashboard':   return <AdminDashboard/>;
        case 'employees':   return <EmployeeList/>;
        case 'projects':    return <ProjectsPage/>;
        case 'requests':    return <PendingRequests/>;
        case 'attendance':  return <AttendanceOverview/>;
        case 'departments': return <DepartmentsPage/>;
        default:            return <AdminDashboard/>;
      }
    }
    return <div style={{ padding: 40 }}>Unknown role</div>;
  };

  return (
    <AppLayout
      activePage={activePage}
      onNavigate={setActivePage}
      title={PAGE_TITLES[activePage] || 'HRMS'}
    >
      {renderPage()}
    </AppLayout>
  );
}

// ── Auth Guard for /login ──────────────────────────────────────────────────────
function LoginGuard() {
  const { isAuthenticated, loading } = useAuth();
  if (loading)         return <PageSpinner/>;
  if (isAuthenticated) return <Navigate to="/app" replace/>;
  return <LoginPage/>;
}

// ── Root ───────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route path="/login" element={<LoginGuard/>}/>
            <Route path="/app"   element={<Portal/>}/>
            <Route path="/app/*" element={<Portal/>}/>
            <Route path="/"      element={<Navigate to="/login" replace/>}/>
            <Route path="*"      element={<Navigate to="/login" replace/>}/>
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
