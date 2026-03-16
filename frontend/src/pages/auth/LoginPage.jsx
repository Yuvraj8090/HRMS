// src/pages/auth/LoginPage.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Icon, Spinner } from '../../components/common/index.jsx';

const DEMO = {
  Admin:    { email: 'admin@hrms.local',    password: 'Admin@123456' },
  HR:       { email: 'hr@hrms.local',       password: 'Hr@123456' },
  Employee: { email: 'employee@hrms.local', password: 'Emp@123456' },
};

export default function LoginPage() {
  const { login } = useAuth();
  const toast     = useToast();
  const navigate  = useNavigate();

  const [form,    setForm]    = useState({ email: '', password: '' });
  const [showPw,  setShowPw]  = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors,  setErrors]  = useState({});

  const validate = () => {
    const e = {};
    if (!form.email)    e.email    = 'Email is required';
    if (!form.password) e.password = 'Password is required';
    return e;
  };

  const handleChange = (e) => {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));
    setErrors(p => ({ ...p, [e.target.name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`Welcome back, ${user.firstName}!`);
      const routes = { Admin: '/admin/dashboard', HR: '/hr/dashboard', Employee: '/employee/dashboard' };
      navigate(routes[user.role] || '/employee/dashboard');
    } catch (err) {
      toast.error(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="login-page">
      <div style={{ width: '100%', maxWidth: 440 }}>

        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            width: 52, height: 52,
            background: 'linear-gradient(135deg, var(--blue-700), var(--blue-500))',
            borderRadius: 16,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 16,
            boxShadow: '0 8px 24px rgba(37,99,235,0.3)',
          }}>
            <Icon name="layers" size={24} color="#fff"/>
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: 'var(--gray-900)', letterSpacing: '-0.5px', marginBottom: 6 }}>
            HRMS Portal
          </h1>
          <p style={{ color: 'var(--gray-400)', fontSize: 14 }}>Sign in to access your workspace</p>
        </div>

        {/* Card */}
        <div className="login-card">
          <form onSubmit={handleSubmit} noValidate>

            {/* Email */}
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@company.com"
                className={`form-control ${errors.email ? 'error' : ''}`}
                autoComplete="email"
              />
              {errors.email && <div className="form-error">{errors.email}</div>}
            </div>

            {/* Password */}
            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPw ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className={`form-control ${errors.password ? 'error' : ''}`}
                  style={{ paddingRight: 42 }}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(p => !p)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--gray-400)', cursor: 'pointer', padding: 0 }}
                >
                  <Icon name="eye" size={16}/>
                </button>
              </div>
              {errors.password && <div className="form-error">{errors.password}</div>}
            </div>

            <div style={{ marginBottom: 24 }}/>

            <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={loading}>
              {loading ? <><Spinner/> Signing in…</> : 'Sign In'}
            </button>
          </form>

          {/* Demo Credentials */}
          <div className="divider" style={{ margin: '24px 0' }}/>
          <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.07em', textAlign: 'center', marginBottom: 12 }}>
            Quick Demo Access
          </p>
          <div className="flex gap-8">
            {Object.entries(DEMO).map(([role, creds]) => (
              <button
                key={role}
                type="button"
                onClick={() => { setForm(creds); setErrors({}); }}
                style={{
                  flex: 1, padding: '8px 4px', fontSize: 12, fontWeight: 600,
                  border: '1.5px solid var(--gray-200)', borderRadius: 'var(--radius-md)',
                  background: 'var(--gray-50)', color: 'var(--gray-600)', cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor='var(--blue-400)'; e.currentTarget.style.color='var(--blue-700)'; e.currentTarget.style.background='var(--blue-50)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor='var(--gray-200)'; e.currentTarget.style.color='var(--gray-600)'; e.currentTarget.style.background='var(--gray-50)'; }}
              >
                {role}
              </button>
            ))}
          </div>

          <p style={{ fontSize: 11, color: 'var(--gray-300)', textAlign: 'center', marginTop: 16 }}>
            Click a role above to fill credentials, then sign in.
          </p>
        </div>
      </div>
    </div>
  );
}
