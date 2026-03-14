# HRMS Frontend

Clean, production-ready React 18 + Vite frontend for the HRMS system.
No Tailwind build complexity — pure CSS with design tokens.

## Quick Start

```bash
# 1. Install
npm install

# 2. Configure API URL (copy .env.example → .env)
cp .env.example .env
# Edit VITE_API_URL if your backend runs on a different port

# 3. Run
npm run dev        # → http://localhost:3000
```

> The Vite proxy automatically forwards `/api/*` to `http://localhost:5000`
> so you don't need CORS issues during development.

## Demo Login Credentials

| Role     | Email                   | Password      |
|----------|-------------------------|---------------|
| Admin    | admin@hrms.local        | Admin@123456  |
| HR       | hr@hrms.local           | Hr@123456     |
| Employee | employee@hrms.local     | Emp@123456    |

Click the role buttons on the login screen to auto-fill.

## Pages by Role

### Employee
- **Dashboard** — Live clock, attendance widget, project grid, increment request modal
- **My Attendance** — Full clock-in/out history with date filters
- **My Projects** — Projects assigned to you
- **My Requests** — Increment request history and status

### HR
- **Dashboard** — KPI cards, pending requests preview, today's attendance
- **Employees** — Full directory with search + department filter
- **Projects** — Create/edit/archive projects
- **Requests** — Review & approve/reject increment requests with salary input
- **Attendance** — Live overview of all employee check-ins

### Admin
- **Dashboard** — System-wide KPIs, recent employees, pending requests
- **Employees** — Full employee directory
- **Projects** — Full project management
- **Requests** — Approve/reject all request types
- **Attendance** — Daily overview
- **Departments** — Create/edit/archive departments

## File Structure

```
src/
├── index.css                  ← All design tokens + utility CSS
├── main.jsx                   ← Entry point
├── App.jsx                    ← Router + all pages wired per role
├── context/
│   ├── AuthContext.jsx         ← JWT auth state, role helpers
│   └── ToastContext.jsx        ← Global toast notifications
├── services/
│   └── api.js                 ← Axios + JWT interceptor + all API methods
├── components/
│   ├── common/index.jsx       ← Icon, Badge, Modal, Spinner, StatCard, etc.
│   └── layout/
│       ├── AppLayout.jsx      ← Main layout wrapper
│       └── Sidebar.jsx        ← Role-based navigation sidebar
└── pages/
    ├── auth/LoginPage.jsx
    ├── employee/
    │   ├── EmployeeDashboard.jsx
    │   ├── MyAttendance.jsx
    │   └── MyRequests.jsx
    ├── hr/
    │   ├── HRDashboard.jsx
    │   ├── PendingRequests.jsx
    │   ├── EmployeeList.jsx
    │   └── AttendanceOverview.jsx
    ├── admin/
    │   ├── AdminDashboard.jsx
    │   └── DepartmentsPage.jsx
    └── shared/
        └── ProjectsPage.jsx   ← Used by all 3 roles
```

## API Integration

Every page calls the backend via typed helpers in `src/services/api.js`:

```js
import { attendanceAPI, projectAPI, requestAPI } from '../services/api';

// Employee clocks in
await attendanceAPI.clockIn({ workMode: 'Office' });

// HR gets pending requests
const { data } = await requestAPI.getPending({ type: 'Increment' });

// HR approves with new salary
await requestAPI.updateStatus(id, { status: 'Approved', approvedSalary: 1200000 });
```

JWT is automatically injected into every request by the Axios interceptor.
On 401, the user is auto-logged-out and redirected to /login.
