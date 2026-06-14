import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api.js';
import { useAuth } from '../context.jsx';

export default function Login() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole]         = useState('Member');
  const [loginRole, setLoginRole] = useState('Member');
  const [employeeId, setEmployeeId] = useState('');
  const [showPwd, setShowPwd]   = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const { login }  = useAuth();
  const navigate   = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isSignUp) {
        await api.post('/api/auth/register', { name, email, password, role, employeeId });
      }
      const res = await api.post('/api/auth/login', { email, password });
      login(res.data);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || (isSignUp ? 'Registration failed.' : 'Invalid email or password.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="lp-root">

      {/* ── LEFT: Branding panel ── */}
      <div className="lp-left">
        <div className="lp-left-inner">

          {/* Logo */}
          <div className="lp-logo">
            <div className="lp-logo-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <span className="lp-logo-text">PensionVault</span>
          </div>

          {/* Headline */}
          <div className="lp-headline">
            <h1 className="lp-headline-h">Pension &amp; Provident Fund Administration</h1>
            <p className="lp-headline-p">A unified platform to manage member enrolment, employer contributions, benefit claims, investments and statutory compliance.</p>
          </div>

          {/* Features */}
          <ul className="lp-features">
            {[
              {
                icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
                title: 'Member & Employer Management',
                desc: 'Enrol members, manage employers and track full service history',
              },
              {
                icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3h12"/><path d="M6 8h12"/><path d="m6 13 8.5 8"/><path d="M6 13h3"/><path d="M9 13c6.667 0 6.667-10 0-10"/></svg>,
                title: 'Fund Corpus & Investments',
                desc: 'Real-time corpus tracking, portfolio allocation and ledger',
              },
              {
                icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
                title: 'Claims & Settlements',
                desc: 'End-to-end PF withdrawal, gratuity and pension disbursement',
              },
              {
                icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
                title: 'Compliance & Audit Trail',
                desc: 'Full audit logs and statutory reporting for regulatory bodies',
              },
            ].map(f => (
              <li key={f.title} className="lp-feature">
                <div className="lp-feature-icon">{f.icon}</div>
                <div>
                  <div className="lp-feature-title">{f.title}</div>
                  <div className="lp-feature-desc">{f.desc}</div>
                </div>
              </li>
            ))}
          </ul>

          {/* Security note */}
          <div className="lp-security">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            Enterprise-grade security &amp; data encryption
          </div>

        </div>
      </div>

      {/* ── RIGHT: Login form panel ── */}
      <div className="lp-right">
        <div className="lp-form-box">

          {/* Mobile logo — only visible on small screens */}
          <div className="lp-mobile-logo">
            <div className="lp-logo-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <span className="lp-logo-text">PensionVault</span>
          </div>

          <div className="lp-form-head">
            <h2 className="lp-form-title">{isSignUp ? 'Create an account' : `Sign in as ${loginRole}`}</h2>
            <p className="lp-form-sub">{isSignUp ? 'Register as a new member' : 'Access your PensionVault account'}</p>
          </div>

          {error && (
            <div className="lp-error">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}>
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {!isSignUp && (
               <div className="form-group">
                 <label className="form-label">Login As</label>
                 <select className="form-input" value={loginRole} onChange={e => setLoginRole(e.target.value)}>
                   <option value="Member">Member (Employee)</option>
                   <option value="Employer">Employer (Company)</option>
                   <option value="Fund Admin">Fund Administrator</option>
                   <option value="Investment Officer">Investment Officer</option>
                   <option value="Compliance">Compliance Auditor</option>
                   <option value="System Admin">System Admin</option>
                 </select>
               </div>
            )}
            {isSignUp && (
              <>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input
                    className="form-input"
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required autoFocus={isSignUp}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Register As</label>
                  <select
                    className="form-input"
                    value={role}
                    onChange={e => setRole(e.target.value)}
                    style={{ appearance: 'auto' }}
                  >
                    <option value="Member">Member (Employee)</option>
                    <option value="Employer">Employer (Company)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Employee ID (Optional)</label>
                  <input
                    className="form-input"
                    type="text"
                    placeholder="e.g. EMP-1234"
                    value={employeeId}
                    onChange={e => setEmployeeId(e.target.value)}
                  />
                </div>
              </>
            )}
            <div className="form-group">
              <label className="form-label">Email address</label>
              <input
                className="form-input"
                type="email"
                placeholder="name@organisation.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required autoFocus autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  className="form-input"
                  type={showPwd ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required autoComplete="current-password"
                  style={{ paddingRight: 42 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(s => !s)}
                  style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', padding:0, display:'flex', alignItems:'center', lineHeight:1 }}
                  tabIndex={-1}
                >
                  {showPwd
                    ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  }
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width:'100%', height:42, justifyContent:'center', fontSize:14, fontWeight:600, marginTop:4, gap:8 }}
              disabled={loading}
            >
              {loading
                ? <><span className="spinner" style={{width:15,height:15,margin:0}}/> {isSignUp ? 'Creating...' : 'Signing in...'}</>
                : (isSignUp ? 'Create Account' : 'Sign in to PensionVault')}
            </button>
          </form>

          <div className="lp-form-footer" style={{ marginTop: 24, textAlign: 'center' }}>
            {isSignUp ? (
              <>Already have an account? <span style={{color:'var(--primary)', cursor:'pointer', fontWeight:500}} onClick={() => setIsSignUp(false)}>Sign in</span></>
            ) : (
              <>New employee? <span style={{color:'var(--primary)', cursor:'pointer', fontWeight:500}} onClick={() => setIsSignUp(true)}>Register here</span></>
            )}
          </div>

        </div>
      </div>

    </div>
  );
}
