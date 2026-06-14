import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import api, { formatINR } from '../api.js';
import { useAuth } from '../context.jsx';

const INV_COLORS = ['#3b82f6','#22c55e','#f59e0b','#a855f7','#06b6d4'];

function StatCard({ label, value, icon, color, trend, trendUp, onClick }) {
  return (
    <div className="stat-card" onClick={onClick} style={onClick ? {cursor:'pointer'} : undefined}>
      <div className="stat-card-top">
        <div className={`stat-icon ${color}`}>{icon}</div>
        {trend && <span className={`stat-trend ${trendUp ? 'up' : 'down'}`}>{trendUp ? '↑' : '↓'} {trend}</span>}
      </div>
      <div>
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div style={{background:'var(--card-bg)',border:'1px solid var(--card-border)',borderRadius:'var(--radius-md)',padding:'10px 14px'}}>
        <p style={{fontSize:12,color:'var(--text-muted)',marginBottom:4}}>{label}</p>
        <p style={{fontSize:14,fontWeight:700,color:'var(--accent)'}}>{formatINR(payload[0].value)}</p>
      </div>
    );
  }
  return null;
};

function StatusBadge({ s }) {
  const map = { Submitted:'badge-blue', UnderReview:'badge-amber', Approved:'badge-green', Rejected:'badge-red', Disbursed:'badge-purple' };
  return <span className={`badge ${map[s] || 'badge-gray'}`}>{s}</span>;
}

export default function Dashboard() {
  const { user } = useAuth();
  const role = user?.role || 'Guest';

  if (role === 'Member') return <MemberDashboard />;
  if (role === 'Employer') return <EmployerDashboard />;
  if (role === 'InvestmentOfficer') return <InvestmentDashboard />;
  return <AdminDashboard />;
}

function MemberDashboard() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [employers, setEmployers] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    nationalIdRef: '',
    dateOfBirth: '',
    gender: 'Male',
    employerId: '',
    nomineeDetails: ''
  });

  const { user } = useAuth();

  const loadProfile = async () => {
    try {
      setLoading(true);
      const me = await api.get('/api/members/me');
      setProfile(me.data);
      const accRes = await api.get(`/api/members/${me.data.memberId}/fund-accounts`);
      if (accRes.data && accRes.data.length > 0) {
        setBalance(accRes.data[0].totalBalance || 0);
      }
    } catch {
      setProfile(null);
      // Fetch employers for the form
      try {
        const empRes = await api.get('/api/employers');
        setEmployers(empRes.data);
      } catch (err) {
        console.error("Failed to load employers", err);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadProfile(); }, []);

  const handleSelfEnroll = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.post('/api/members/self-enroll', {
        ...form,
        dateOfBirth: new Date(form.dateOfBirth).toISOString()
      });
      await loadProfile(); // Reload to show pending state
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="page-body"><div className="spinner" style={{marginTop:40}} /></div>;

  const isPending = profile && profile.membershipNumber.startsWith('PENDING');

  if (profile && !isPending) {
    return (
      <div className="page-body">
        <div className="page-header">
          <div className="page-header-left">
            <div className="page-title">My Pension Account</div>
            <div className="page-desc">Welcome back, {profile.name}</div>
          </div>
        </div>
        <div className="stats-grid">
          <StatCard onClick={() => navigate('/ledger')} label="Total EPF Balance" value={formatINR(balance)} color="blue" icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3h12"/><path d="M6 8h12"/><path d="m6 13 8.5 8"/><path d="M6 13h3"/><path d="M9 13c6.667 0 6.667-10 0-10"/></svg>} />
          <StatCard label="Employer" value={profile.employerName || '—'} color="green" icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>} />
          <StatCard label="Joining Date" value={profile.joiningDate ? new Date(profile.joiningDate).toLocaleDateString() : '—'} color="purple" icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>} />
        </div>
      </div>
    );
  }

  if (isPending) {
    return (
      <div className="page-body">
        <div className="table-card" style={{padding: 40, textAlign: 'center', maxWidth: 600, margin: '40px auto'}}>
          <div style={{width: 50, height: 50, background: 'var(--card-border)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px'}}>
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{color: 'var(--accent)'}}><path d="M22 11.08V12a10 10 10 0 1-5.93 9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          </div>
          <h2 style={{fontSize: 20, fontWeight: 600, color: 'var(--text)', marginBottom: 8}}>Profile Submitted!</h2>
          <p style={{fontSize: 15, color: 'var(--text-muted)', margin: '0 auto 24px', lineHeight: 1.5}}>
            Your details have been successfully submitted to the Administrator for verification. You will receive your official Membership Number once approved.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-body">
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-title">Complete Your Profile</div>
          <div className="page-desc">Provide your employment details to officially enroll in the PensionVault scheme</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
        {/* Left Side: Info Card */}
        <div className="table-card" style={{ flex: 1, padding: 24 }}>
          <div style={{ width: 40, height: 40, background: 'var(--accent-subtle)', color: 'var(--accent)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </div>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>Identity Verification</h3>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 20 }}>
            To activate your digital EPF ledger, we need to verify your identity and map your account directly to your employer.
          </p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <li style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--text-secondary)' }}>
              <svg width="16" height="16" fill="none" stroke="var(--success)" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              Real-time Ledger Tracking
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--text-secondary)' }}>
              <svg width="16" height="16" fill="none" stroke="var(--success)" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              Seamless Claim Disbursements
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--text-secondary)' }}>
              <svg width="16" height="16" fill="none" stroke="var(--success)" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              256-bit Secure Encryption
            </li>
          </ul>
        </div>

        {/* Right Side: Form */}
        <div className="table-card" style={{ flex: 2.2, padding: 32 }}>
          <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 24 }}>Enrollment Form</h3>
          <form onSubmit={handleSelfEnroll}>
            {error && <div className="lp-error" style={{marginBottom:24, padding: 12, background: 'var(--danger-subtle)', color: 'var(--danger)', borderRadius: 'var(--radius-md)', fontSize: 13, fontWeight: 500}}>{error}</div>}
            
            <div className="form-group" style={{marginBottom: 20}}>
              <label className="form-label">Employer / Company *</label>
              <select className="form-input" value={form.employerId} onChange={e => setForm({...form, employerId:e.target.value})} required>
                <option value="">Select your company...</option>
                {employers.map(emp => <option key={emp.employerId} value={emp.employerId}>{emp.companyName}</option>)}
              </select>
            </div>

            <div className="form-group" style={{marginBottom: 20}}>
              <label className="form-label">National ID (Aadhaar / PAN) *</label>
              <input className="form-input" placeholder="e.g., AAAPK1234C" value={form.nationalIdRef} onChange={e => setForm({...form, nationalIdRef:e.target.value})} required />
            </div>

            <div style={{display: 'flex', gap: 20, marginBottom: 20}}>
              <div className="form-group" style={{flex: 1}}>
                <label className="form-label">Date of Birth *</label>
                <input className="form-input" type="date" value={form.dateOfBirth} onChange={e => setForm({...form, dateOfBirth:e.target.value})} required />
              </div>
              <div className="form-group" style={{flex: 1}}>
                <label className="form-label">Gender</label>
                <select className="form-input" value={form.gender} onChange={e => setForm({...form, gender:e.target.value})}>
                  <option>Male</option><option>Female</option><option>Other</option>
                </select>
              </div>
            </div>

            <div className="form-group" style={{marginBottom: 32}}>
              <label className="form-label">Nominee Details <span style={{fontWeight:400, color:'var(--text-muted)'}}>(Optional)</span></label>
              <input className="form-input" placeholder="Name, Relation, etc." value={form.nomineeDetails} onChange={e => setForm({...form, nomineeDetails:e.target.value})} />
            </div>

            <div style={{display: 'flex', justifyContent: 'flex-end'}}>
              <button type="submit" className="btn btn-primary" style={{ height: 40, padding: '0 24px' }} disabled={saving}>
                {saving ? <span className="spinner" style={{width:16,height:16,margin:0, borderTopColor: '#fff'}} /> : 'Submit Profile for Approval'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function EmployerDashboard() {
  const [profile, setProfile] = useState(null);
  const [remits, setRemits] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const empRes = await api.get('/api/employers/me');
        setProfile(empRes.data);
        
        const [mRes, rRes] = await Promise.allSettled([
          api.get('/api/members'),
          api.get(`/api/employers/${empRes.data.employerId}/remittances`)
        ]);
        
        if (mRes.value) setMembers(mRes.value.data || []);
        if (rRes.value) setRemits(rRes.value.data || []);
      } catch (err) {
        console.error("Failed to load employer dashboard data", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <div className="page-body"><div className="spinner" style={{marginTop:40}} /></div>;

  const totalRemitted = remits.reduce((sum, r) => sum + (r.totalAmount || 0), 0);
  const recentRemits = remits.slice(0, 5);

  return (
    <div className="page-body">
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-title">Employer Portal</div>
          <div className="page-desc">{profile?.companyName || 'Employer'} - Dashboard</div>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard label="Enrolled Members" value={profile?.enrolledMemberCount || members.length || 0} color="blue" icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>} />
        <StatCard label="Total Remittances" value={remits.length} color="purple" icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>} />
        <StatCard label="Total Amount Remitted" value={formatINR(totalRemitted)} color="green" icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3h12"/><path d="M6 8h12"/><path d="m6 13 8.5 8"/><path d="M6 13h3"/><path d="M9 13c6.667 0 6.667-10 0-10"/></svg>} />
      </div>

      <div className="table-card" style={{marginTop: 24}}>
        <div className="table-header">
          <span className="table-title">Recent Remittances</span>
        </div>
        {recentRemits.length === 0 ? (
          <div className="empty-state"><p>No recent remittances found</p></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr>
                <th>Period</th><th>Employee (₹)</th><th>Employer (₹)</th><th>Total (₹)</th><th>Date</th><th>Status</th>
              </tr></thead>
              <tbody>
                {recentRemits.map(r => (
                  <tr key={r.remittanceId}>
                    <td>{r.remittancePeriod}</td>
                    <td className="amount">{formatINR(r.totalEmployeeShare)}</td>
                    <td className="amount">{formatINR(r.totalEmployerShare)}</td>
                    <td className="amount amount-positive">{formatINR(r.totalAmount)}</td>
                    <td>{new Date(r.remittanceDate).toLocaleDateString('en-IN')}</td>
                    <td><StatusBadge s={r.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function InvestmentDashboard() {
  const [portfolios, setPortfolios] = useState([]);
  const [corpus, setCorpus] = useState(0);
  useEffect(() => {
    api.get('/api/portfolios').then(r => setPortfolios(r.data));
    api.get('/api/corpus').then(r => setCorpus(r.data?.[0]?.closingCorpus || 0));
  }, []);
  const pieData = portfolios.map(p => ({ name: p.assetClass.replace(/([A-Z])/g, ' $1').trim(), value: p.currentValue || 0 }));
  return (
    <div className="page-body">
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-title">Investment Portal</div>
          <div className="page-desc">Track and manage portfolio allocations</div>
        </div>
      </div>
      <div className="stats-grid">
        <StatCard label="Active Portfolios" value={portfolios.length} color="blue" icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>} />
        <StatCard label="Total Corpus" value={formatINR(corpus)} color="green" icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3h12"/><path d="M6 8h12"/><path d="m6 13 8.5 8"/><path d="M6 13h3"/><path d="M9 13c6.667 0 6.667-10 0-10"/></svg>} />
      </div>
      <div className="charts-grid" style={{marginTop:24}}>
        <div className="chart-card">
          <div className="chart-title">Asset Allocation</div>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="45%" outerRadius={90} innerRadius={50} dataKey="value" paddingAngle={2}>
                {pieData.map((_, i) => <Cell key={i} fill={INV_COLORS[i % INV_COLORS.length]} />)}
              </Pie>
              <Legend iconSize={8} iconType="circle" formatter={v => <span style={{fontSize:11,color:'var(--text-secondary)'}}>{v}</span>} />
              <Tooltip formatter={(v) => formatINR(v)} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function AdminDashboard() {
  const [stats, setStats] = useState({ members:0, corpus:0, claims:0, remittances:0 });
  const [portfolios, setPortfolios] = useState([]);
  const [activity, setActivity] = useState([]);
  const [corpusHistory, setCorpusHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [members, portfoliosRes, claimsRes, corpusRes, remittancesRes] = await Promise.allSettled([
          api.get('/api/members'),
          api.get('/api/portfolios'),
          api.get('/api/claims'),
          api.get('/api/corpus'),
          api.get('/api/remittances')
        ]);
        
        const currentMonth = new Date().getMonth();
        const thisMonthRemittances = remittancesRes.value?.data?.filter(r => 
          new Date(r.remittanceDate).getMonth() === currentMonth && r.status === 'Reconciled'
        ).reduce((sum, r) => sum + r.amount, 0) || 0;

        setStats({
          members: members.value?.data?.length || 0,
          corpus: corpusRes.value?.data?.[0]?.closingCorpus || 0,
          claims: claimsRes.value?.data?.filter(c => c.status === 'Submitted' || c.status === 'UnderReview').length || 0,
          remittances: thisMonthRemittances,
        });
        
        setPortfolios(portfoliosRes.value?.data || []);
        setActivity(claimsRes.value?.data?.slice(0,6) || []);
        
        const history = [...(corpusRes.value?.data || [])].reverse().map(c => ({
          month: new Date(c.recordDate).toLocaleString('default', { month: 'short' }),
          corpus: c.closingCorpus
        }));
        setCorpusHistory(history);
      } finally { setLoading(false); }
    };
    load();
  }, []);

  const toLabel = (s) => (s ? String(s).replace(/([A-Z])/g, ' $1').trim() : 'Unknown');
  const pieData = portfolios.map(p => ({ name: toLabel(p.assetClass), value: p.currentValue || 0 }));

  return (
    <div className="page-body">
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-title">Dashboard</div>
          <div className="page-desc">Overview of PensionVault fund administration</div>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard label="Total Members" value={loading ? '—' : stats.members.toLocaleString('en-IN')}
          color="blue" trend="12%" trendUp
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>}
        />
        <StatCard label="Fund Corpus" value={loading ? '—' : formatINR(stats.corpus)}
          color="green" trend="8.3%" trendUp
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3h12"/><path d="M6 8h12"/><path d="m6 13 8.5 8"/><path d="M6 13h3"/><path d="M9 13c6.667 0 6.667-10 0-10"/></svg>}
        />
        <StatCard label="Pending Claims" value={loading ? '—' : stats.claims}
          color="amber"
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>}
        />
        <StatCard label="Monthly Remittances" value={loading ? '—' : formatINR(stats.remittances)}
          color="purple" trend="5%" trendUp
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>}
        />
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <div className="chart-title">Fund Corpus Growth</div>
          <div className="chart-sub">2026 — monthly closing corpus (₹)</div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={corpusHistory} margin={{ top:4, right:4, bottom:0, left:0 }}>
              <defs>
                <linearGradient id="corpusGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--card-border)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize:11, fill:'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize:10, fill:'var(--text-muted)' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v/1000000).toFixed(1)}Cr`} width={60} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="corpus" stroke="#3b82f6" strokeWidth={2} fill="url(#corpusGrad)" dot={false} activeDot={{ r:4, fill:'#3b82f6' }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <div className="chart-title">Investment Allocation</div>
          <div className="chart-sub">Portfolio distribution by asset class</div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="45%" outerRadius={75} innerRadius={40} dataKey="value" paddingAngle={2}>
                {pieData.map((_, i) => <Cell key={i} fill={INV_COLORS[i % INV_COLORS.length]} />)}
              </Pie>
              <Legend iconSize={8} iconType="circle" formatter={v => <span style={{fontSize:11,color:'var(--text-secondary)'}}>{v}</span>} />
              <Tooltip formatter={(v) => formatINR(v)} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="table-card">
        <div className="table-header">
          <span className="table-title">Recent Claims Activity</span>
        </div>
        {activity.length === 0 ? (
          <div className="empty-state"><p>No recent activity</p></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr>
                <th>Claim ID</th><th>Member</th><th>Type</th>
                <th>Eligible Amount</th><th>Date</th><th>Status</th>
              </tr></thead>
              <tbody>
                {activity.map(c => (
                  <tr key={c.claimId}>
                    <td className="mono">{c.claimId?.slice(0,8)}…</td>
                    <td className="bold">{c.memberName}</td>
                    <td>{c.claimType}</td>
                    <td className="amount">{formatINR(c.eligibleAmount)}</td>
                    <td>{new Date(c.claimDate).toLocaleDateString('en-IN')}</td>
                    <td><StatusBadge s={c.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
