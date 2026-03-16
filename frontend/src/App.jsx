// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import AppLayout from './components/layout/AppLayout';
import { PageSpinner } from './components/common/index.jsx';

// ── Pages ──────────────────────────────────────────────────────────────────────
import LoginPage from './pages/auth/LoginPage';
import EmployeeDashboard from './pages/employee/EmployeeDashboard';
import MyAttendance from './pages/employee/MyAttendance';
import MyRequests from './pages/employee/MyRequests';
import HRDashboard from './pages/hr/HRDashboard';
import PendingRequests from './pages/hr/PendingRequests';
import EmployeeList from './pages/hr/EmployeeList';
import AttendanceOverview from './pages/hr/AttendanceOverview';
import AdminDashboard from './pages/admin/AdminDashboard';
import DepartmentsPage from './pages/admin/DepartmentsPage';
import ProjectsPage from './pages/shared/ProjectsPage';

// ── Security Guards ────────────────────────────────────────────────────────────

// 1. Prevents unauthenticated access
const RequireAuth = () => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) return <PageSpinner />;
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />;
  
  return <Outlet />; 
};

// 2. Prevents authenticated users from accessing unauthorized roles (Case-Insensitive)
const RequireRole = ({ allowedRoles }) => {
  const { role, loading } = useAuth();
  
  if (loading) return <PageSpinner />;
  
  const normalizedUserRole = (role || '').toLowerCase();
  const normalizedAllowedRoles = allowedRoles.map(r => r.toLowerCase());

  if (!normalizedAllowedRoles.includes(normalizedUserRole)) {
    return <Navigate to="/unauthorized" replace />;
  }
  
  return <Outlet />;
};

// 3. Smart Redirect for Root Path based on Role (Case-Insensitive)
const RoleBasedRedirect = () => {
  const { role, loading } = useAuth();
  
  if (loading) return <PageSpinner />;
  
  const normalizedRole = (role || '').toLowerCase();
  
  if (normalizedRole === 'admin') return <Navigate to="/admin/dashboard" replace />;
  if (normalizedRole === 'hr') return <Navigate to="/hr/dashboard" replace />;
  if (normalizedRole === 'employee') return <Navigate to="/employee/dashboard" replace />;
  
  // If the user has a token but an invalid/missing role, they go to unauthorized.
  // This prevents the infinite redirect loop back to /login.
  return <Navigate to="/unauthorized" replace />;
};

// 4. Prevents logged-in users from seeing the login page
const RedirectIfAuthenticated = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <PageSpinner />;
  if (isAuthenticated) return <RoleBasedRedirect />;
  return children;
};

// ── Root Application ───────────────────────────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={
              <RedirectIfAuthenticated>
                <LoginPage />
              </RedirectIfAuthenticated>
            } />

            {/* Protected Routes */}
            <Route element={<RequireAuth />}>
              <Route element={<AppLayout />}>
                
                {/* Auto-routing based on role when hitting "/" */}
                <Route index element={<RoleBasedRedirect />} />

                {/* --- ADMIN ROUTES --- */}
                <Route path="admin" element={<RequireRole allowedRoles={['admin']} />}>
                  <Route path="dashboard" element={<AdminDashboard />} />
                  <Route path="departments" element={<DepartmentsPage />} />
                  <Route path="employees" element={<EmployeeList />} />
                  <Route path="attendance" element={<AttendanceOverview />} />
                  <Route path="requests" element={<PendingRequests />} />
                  <Route path="projects" element={<ProjectsPage />} />
                </Route>

                {/* --- HR ROUTES --- */}
                <Route path="hr" element={<RequireRole allowedRoles={['hr', 'admin']} />}>
                  <Route path="dashboard" element={<HRDashboard />} />
                  <Route path="employees" element={<EmployeeList />} />
                  <Route path="attendance" element={<AttendanceOverview />} />
                  <Route path="requests" element={<PendingRequests />} />
                  <Route path="projects" element={<ProjectsPage />} />
                </Route>

                {/* --- EMPLOYEE ROUTES --- */}
                <Route path="employee" element={<RequireRole allowedRoles={['employee', 'hr', 'admin']} />}>
                  <Route path="dashboard" element={<EmployeeDashboard />} />
                  <Route path="attendance" element={<MyAttendance />} />
                  <Route path="requests" element={<MyRequests />} />
                  <Route path="projects" element={<ProjectsPage />} />
                </Route>

              </Route>
            </Route>

            {/* Fallbacks */}
            <Route path="/unauthorized" element={
              <div style={{ padding: 40, textAlign: 'center' }}>
                <h2>Unauthorized Access</h2>
                <p>Your account role does not have permission to view this page.</p>
              </div>
            } />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}