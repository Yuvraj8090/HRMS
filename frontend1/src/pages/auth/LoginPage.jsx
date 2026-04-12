// src/pages/auth/LoginPage.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { Icon, Spinner } from '../../components/common/index.jsx';

const DEMO = {
  Admin:    { email: 'admin@hrms.local',   password: 'Admin@123456' },
  HR:       { email: 'hr@hrms.local',      password: 'Hr@123456'   },
  Employee: { email: 'ashok@hrms.local',   password: 'Emp@123456'  },
};

export default function LoginPage() {
  const { login }  = useAuth();
  const toast      = useToast();
  const navigate   = useNavigate();
  const [form,    setForm]    = useState({ email: '', password: '' });
  const [showPw,  setShowPw]  = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors,  setErrors]  = useState({});

  const ch = f => e => { setForm(p => ({ ...p, [f]: e.target.value })); setErrors(p => ({ ...p, [f]: '' })); };

  const submit = async e => {
    e.preventDefault();
    const errs = {};
    if (!form.email)    errs.email    = 'Email required';
    if (!form.password) errs.password = 'Password required';
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`Welcome back, ${user.firstName}!`);
      const dest = user.role === 'Admin' ? '/admin/dashboard' : user.role === 'HR' ? '/hr/dashboard' : '/employee/dashboard';
      navigate(dest, { replace: true });
    } catch (err) {
      toast.error(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-[420px]">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-gradient-to-br from-primary-700 to-primary-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Icon name="shield" size={28} color="white" />
          </div>
          <h1 className="font-display text-3xl font-800 text-gray-900 tracking-tight">HRMS</h1>
          <p className="text-gray-400 text-sm mt-1">Human Resource Management System</p>
        </div>

        {/* Card */}
        <div className="card p-8 animate-slide-up">
          <form onSubmit={submit} noValidate>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input type="email" className={`form-control ${errors.email ? 'border-danger-500' : ''}`}
                placeholder="you@company.com" value={form.email} onChange={ch('email')} autoComplete="email" />
              {errors.email && <div className="form-error">{errors.email}</div>}
            </div>
            <div className="form-group mb-6">
              <label className="form-label">Password</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} className={`form-control pr-10 ${errors.password ? 'border-danger-500' : ''}`}
                  placeholder="••••••••" value={form.password} onChange={ch('password')} autoComplete="current-password" />
                <button type="button" onClick={() => setShowPw(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <Icon name="eye" size={16} />
                </button>
              </div>
              {errors.password && <div className="form-error">{errors.password}</div>}
            </div>
            <button type="submit" className="btn btn-primary btn-lg w-full justify-center" disabled={loading}>
              {loading ? <><Spinner size="sm" />Signing in…</> : 'Sign In'}
            </button>
          </form>

          {/* Demo */}
          <div className="mt-6 pt-5 border-t border-gray-100">
            <p className="text-[11px] font-700 text-gray-400 uppercase tracking-widest text-center mb-3">Quick Demo Access</p>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(DEMO).map(([role, creds]) => (
                <button key={role} type="button"
                  onClick={() => { setForm(creds); setErrors({}); }}
                  className="text-xs font-700 py-2 px-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-600 hover:border-primary-400 hover:text-primary-700 hover:bg-primary-50 transition-all">
                  {role}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-gray-300 text-center mt-2">Click a role to autofill credentials</p>
          </div>
        </div>
      </div>
    </div>
  );
}
