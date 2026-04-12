// src/App.jsx
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import { PageSpinner } from './components/common/index.jsx';
import AppLayout from './components/layout/AppLayout.jsx';

// Pages
import LoginPage         from './pages/auth/LoginPage.jsx';
import AdminDashboard    from './pages/admin/AdminDashboard.jsx';
import DepartmentsPage   from './pages/admin/DepartmentsPage.jsx';
import DesignationsPage  from './pages/admin/DesignationsPage.jsx';
import HRDashboard       from './pages/hr/HRDashboard.jsx';
import EmployeeList      from './pages/hr/EmployeeList.jsx';
import ManageLeaves      from './pages/hr/ManageLeaves.jsx';
import AttendanceOverview from './pages/hr/AttendanceOverview.jsx';
import ContractManagement from './pages/hr/ContractManagement.jsx';
import PendingRequests   from './pages/hr/PendingRequests.jsx';
import ProjectsPage      from './pages/shared/ProjectsPage.jsx';
import EmployeeDashboard from './pages/employee/EmployeeDashboard.jsx';
import LeaveApplication  from './pages/employee/LeaveApplication.jsx';
import MyAttendance      from './pages/employee/MyAttendance.jsx';
import MyRequests        from './pages/employee/MyRequests.jsx';

function ProtectedRoute({ children, roles }) {
  const { isAuthenticated, role, loading } = useAuth();
  if (loading) return <PageSpinner />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(role)) return <Navigate to={role === 'Admin' ? '/admin/dashboard' : role === 'HR' ? '/hr/dashboard' : '/employee/dashboard'} replace />;
  return children;
}

function RootRedirect() {
  const { isAuthenticated, role, loading } = useAuth();
  if (loading) return <PageSpinner />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (role === 'Admin')    return <Navigate to="/admin/dashboard" replace />;
  if (role === 'HR')       return <Navigate to="/hr/dashboard" replace />;
  return <Navigate to="/employee/dashboard" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<RootRedirect />} />

      {/* ── Admin ── */}
      <Route path="/admin" element={<ProtectedRoute roles={['Admin']}><AppLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard"    element={<AdminDashboard />} />
        <Route path="employees"    element={<EmployeeList />} />
        <Route path="departments"  element={<DepartmentsPage />} />
        <Route path="designations" element={<DesignationsPage />} />
        <Route path="attendance"   element={<AttendanceOverview />} />
        <Route path="leaves"       element={<ManageLeaves />} />
        <Route path="contracts"    element={<ContractManagement />} />
        <Route path="requests"     element={<PendingRequests />} />
        <Route path="projects"     element={<ProjectsPage />} />
      </Route>

      {/* ── HR ── */}
      <Route path="/hr" element={<ProtectedRoute roles={['HR']}><AppLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard"  element={<HRDashboard />} />
        <Route path="employees"  element={<EmployeeList />} />
        <Route path="attendance" element={<AttendanceOverview />} />
        <Route path="leaves"     element={<ManageLeaves />} />
        <Route path="my-leaves"  element={<LeaveApplication />} />
        <Route path="contracts"  element={<ContractManagement />} />
        <Route path="requests"   element={<PendingRequests />} />
        <Route path="projects"   element={<ProjectsPage />} />
      </Route>

      {/* ── Employee ── */}
      <Route path="/employee" element={<ProtectedRoute roles={['Employee']}><AppLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard"  element={<EmployeeDashboard />} />
        <Route path="attendance" element={<MyAttendance />} />
        <Route path="leaves"     element={<LeaveApplication />} />
        <Route path="requests"   element={<MyRequests />} />
        <Route path="projects"   element={<ProjectsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppRoutes />
      </ToastProvider>
    </AuthProvider>
  );
}
