import React, { useEffect, useState } from 'react';
import api, { formatINR, formatDate } from '../api.js';
import { useAuth } from '../context.jsx';

function StatusBadge({ s }) {
  const names = { 0:'Active', 1:'Resigned', 2:'Retired', 3:'Deceased', 4:'Transferred' };
  const str = typeof s === 'number' ? names[s] : s;
  const map = { Active:'badge-green', Resigned:'badge-red', Retired:'badge-purple', Deceased:'badge-gray', Transferred:'badge-amber' };
  return <span className={`badge ${map[str] || 'badge-gray'}`}>{str}</span>;
}

export default function Members() {
  const { user } = useAuth();
  const [members, setMembers]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [showModal, setModal]   = useState(false);
  const [employers, setEmp]     = useState([]);
  const [form, setForm]         = useState({ membershipNumber:'', name:'', dateOfBirth:'', gender:'Male', nationalIdRef:'', employerId:'', joiningDate:'', userId:'' });
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');
  const [detailMember, setDetail] = useState(null);
  const [fundAccounts, setFundAcc] = useState([]);
  const [loadingDetail, setLoadDetail] = useState(false);


  const load = async () => {
    setLoading(true);
    try {
      const [m, e] = await Promise.all([
        api.get('/api/members'), 
        user?.role === 'Employer' ? api.get('/api/employers/me') : api.get('/api/employers')
      ]);
      setMembers(m.data);
      const emps = user?.role === 'Employer' ? [e.data] : e.data;
      setEmp(emps);
      if (user?.role === 'Employer' && emps.length > 0) {
        setForm(f => ({ ...f, employerId: emps[0].employerId }));
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load members or employers. " + (err.response?.data?.message || err.message));
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = members.filter(m =>
    m.name?.toLowerCase().includes(search.toLowerCase()) ||
    m.membershipNumber?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      if (form.memberId) {
        // Approve workflow
        await api.put(`/api/members/${form.memberId}/approve`, {
          membershipNumber: form.membershipNumber,
          employerId: form.employerId
        });
      } else {
        // Direct creation workflow
        if (!form.userId) throw new Error("User ID is required. Please paste the User ID of the registered employee.");
        await api.post('/api/members', { ...form, dateOfBirth: new Date(form.dateOfBirth).toISOString(), joiningDate: new Date(form.joiningDate).toISOString() });
      }
      setModal(false);
      setForm({ 
        memberId:'', membershipNumber:'', name:'', dateOfBirth:'', gender:'Male', 
        nationalIdRef:'', 
        employerId: user?.role === 'Employer' && employers.length > 0 ? employers[0].employerId : '', 
        joiningDate:'', userId:'' 
      });
      load();
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Failed to process member.');
    } finally { setSaving(false); }
  };

  const openDetail = async (m) => {
    setDetail(m);
    setFundAcc([]);
    setLoadDetail(true);
    try {
      const r = await api.get(`/api/members/${m.memberId}/fund-accounts`);
      setFundAcc(r.data);
    } catch { setFundAcc([]); }
    setLoadDetail(false);
  };

  return (
    <div className="page-body">
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-title">Members</div>
          <div className="page-desc">{members.length} enrolled members</div>
        </div>
        <button className="btn btn-primary" onClick={() => {
          setForm({ 
            memberId:'', membershipNumber:'', name:'', dateOfBirth:'', gender:'Male', 
            nationalIdRef:'', 
            employerId: user?.role === 'Employer' && employers.length > 0 ? employers[0].employerId : '', 
            joiningDate:'', userId:'' 
          });
          setModal(true);
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Enroll Member
        </button>
      </div>

      <div className="table-card">
        <div className="table-header">
          <span className="table-title">All Members</span>
          <div className="topbar-search" style={{height:30}}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{color:'var(--text-muted)'}}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input placeholder="Search name or number…" value={search} onChange={e => setSearch(e.target.value)} style={{width:180}} />
          </div>
        </div>
        {loading ? <div style={{padding:40}}><div className="spinner" /></div> : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Membership No</th><th>Name</th><th>Employer</th><th>Joining Date</th><th>Status</th><th>Fund Account</th></tr></thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={6} style={{textAlign:'center',padding:40,color:'var(--text-muted)'}}>No members found</td></tr>
                ) : filtered.map(m => (
                  <tr key={m.memberId}>
                    <td className="mono" style={{color: m.membershipNumber.startsWith('PENDING') ? 'var(--alert)' : ''}}>
                      {m.membershipNumber.startsWith('PENDING') ? 'Pending Approval' : m.membershipNumber}
                    </td>
                    <td className="bold">{m.name}</td>
                    <td>{m.employerName}</td>
                    <td>{formatDate(m.joiningDate)}</td>
                    <td>
                      <StatusBadge s={m.membershipNumber.startsWith('PENDING') ? 'Pending' : m.status} />
                      {m.membershipNumber.startsWith('PENDING') && (
                        <button className="btn btn-sm btn-outline" style={{marginLeft:8,fontSize:11}} onClick={() => {
                          setForm({ memberId:m.memberId, membershipNumber:'', name:m.name, dateOfBirth:m.dateOfBirth?.split('T')[0]||'', gender:m.gender||'Male', nationalIdRef:m.nationalIdRef||'', employerId:m.employerId||'', joiningDate:m.joiningDate?.split('T')[0]||'', userId:m.userId||'' });
                          setModal(true);
                        }}>Approve</button>
                      )}
                    </td>
                    <td>
                      <button className="btn btn-sm btn-outline" onClick={() => openDetail(m)}>
                        View Account
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="modal">
            <div className="modal-head">
              <span className="modal-title">{form.memberId ? 'Approve Member Profile' : 'Enroll New Member'}</span>
              <button className="icon-btn" onClick={() => setModal(false)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                {error && <div className="login-error" style={{marginBottom:16}}>{error}</div>}
                
                {form.memberId && (
                  <div style={{padding: '12px 16px', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: 8, marginBottom: 20}}>
                    <p style={{margin: 0, fontSize: 14, color: 'var(--text)'}}>
                      This employee submitted their details. Please review and assign a <strong>Membership Number</strong> to approve.
                    </p>
                  </div>
                )}

                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Membership Number *</label>
                    <input className="form-input" placeholder="e.g., PV-2026-00003" value={form.membershipNumber} onChange={e => setForm({...form, membershipNumber:e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Full Name *</label>
                    <input className="form-input" placeholder="Full name" value={form.name} onChange={e => setForm({...form, name:e.target.value})} required disabled={!!form.memberId} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Date of Birth *</label>
                    <input className="form-input" type="date" value={form.dateOfBirth} onChange={e => setForm({...form, dateOfBirth:e.target.value})} required disabled={!!form.memberId} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Gender</label>
                    <select className="form-input" value={form.gender} onChange={e => setForm({...form, gender:e.target.value})} disabled={!!form.memberId}>
                      <option>Male</option><option>Female</option><option>Other</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">National ID (Aadhaar/PAN)</label>
                    <input className="form-input" placeholder="AAAPK1234C" value={form.nationalIdRef} onChange={e => setForm({...form, nationalIdRef:e.target.value})} disabled={!!form.memberId} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Employer *</label>
                    <select className="form-input" value={form.employerId} onChange={e => setForm({...form, employerId:e.target.value})} required disabled={user?.role === 'Employer'}>
                      <option value="">Select employer</option>
                      {employers.map(emp => <option key={emp.employerId} value={emp.employerId}>{emp.companyName}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Joining Date *</label>
                    <input className="form-input" type="date" value={form.joiningDate} onChange={e => setForm({...form, joiningDate:e.target.value})} required disabled={!!form.memberId} />
                  </div>
                  {!form.memberId && (
                    <div className="form-group">
                      <label className="form-label">User ID (GUID) <span style={{color:'red'}}>*</span></label>
                      <input className="form-input" placeholder="Required User ID (from Registration)" value={form.userId} onChange={e => setForm({...form, userId: e.target.value})} required />
                      <div style={{fontSize: 11, color: 'var(--text-muted)', marginTop: 4}}>Paste the exact User ID generated when you registered this employee.</div>
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-foot">
                <button type="button" className="btn btn-outline" onClick={() => setModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <span className="spinner" style={{width:14,height:14,margin:0}} /> : 'Enroll Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Fund Account Detail Modal ── */}
      {detailMember && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setDetail(null)}>
          <div className="modal" style={{maxWidth: 600}}>
            <div className="modal-head">
              <span className="modal-title">Fund Account — {detailMember.name}</span>
              <button className="icon-btn" onClick={() => setDetail(null)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="modal-body">
              {/* Member Info */}
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:20, padding:16, background:'var(--bg)', borderRadius:8, border:'1px solid var(--card-border)'}}>
                <div><div style={{fontSize:11,color:'var(--text-muted)',marginBottom:2}}>Membership Number</div><div className="mono" style={{fontWeight:600}}>{detailMember.membershipNumber}</div></div>
                <div><div style={{fontSize:11,color:'var(--text-muted)',marginBottom:2}}>Status</div><StatusBadge s={detailMember.status} /></div>
                <div><div style={{fontSize:11,color:'var(--text-muted)',marginBottom:2}}>Employer</div><div>{detailMember.employerName || '—'}</div></div>
                <div><div style={{fontSize:11,color:'var(--text-muted)',marginBottom:2}}>Joining Date</div><div>{formatDate(detailMember.joiningDate)}</div></div>
              </div>

              {/* Fund Accounts */}
              <div style={{fontWeight:600, marginBottom:10, fontSize:14}}>Fund Accounts</div>
              {loadingDetail ? <div style={{padding:20,textAlign:'center'}}><div className="spinner"/></div> : (
                fundAccounts.length === 0 ? (
                  <div style={{padding:24, textAlign:'center', color:'var(--text-muted)', background:'var(--bg)', borderRadius:8, border:'1px solid var(--card-border)'}}>
                    No fund account found for this member.
                  </div>
                ) : fundAccounts.map(acc => (
                  <div key={acc.accountId} style={{border:'1px solid var(--card-border)', borderRadius:10, padding:16, marginBottom:12, background:'var(--bg)'}}>
                    <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12}}>
                      <div><div style={{fontSize:11,color:'var(--text-muted)',marginBottom:2}}>Account ID</div><div className="mono" style={{fontSize:11}}>{acc.accountId}</div></div>
                      <div><div style={{fontSize:11,color:'var(--text-muted)',marginBottom:2}}>Scheme</div><div style={{fontWeight:600}}>{acc.schemeName || '—'}</div></div>
                      <div>
                        <div style={{fontSize:11,color:'var(--text-muted)',marginBottom:2}}>Total Balance</div>
                        <div style={{fontSize:20, fontWeight:700, color:'var(--primary)'}}>{formatINR(acc.totalBalance ?? 0)}</div>
                      </div>
                      <div><div style={{fontSize:11,color:'var(--text-muted)',marginBottom:2}}>Vesting %</div><div style={{fontWeight:600}}>{acc.vestingPercent ?? 0}%</div></div>
                      <div><div style={{fontSize:11,color:'var(--text-muted)',marginBottom:2}}>Employee Contribution</div><div>{formatINR(acc.employeeContribution ?? 0)}</div></div>
                      <div><div style={{fontSize:11,color:'var(--text-muted)',marginBottom:2}}>Employer Contribution</div><div>{formatINR(acc.employerContribution ?? 0)}</div></div>
                      <div><div style={{fontSize:11,color:'var(--text-muted)',marginBottom:2}}>Interest Earned</div><div style={{color:'var(--success)'}}>{formatINR(acc.interestEarned ?? 0)}</div></div>
                      <div><div style={{fontSize:11,color:'var(--text-muted)',marginBottom:2}}>Opening Balance</div><div>{formatINR(acc.openingBalance ?? 0)}</div></div>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="modal-foot">
              <button className="btn btn-outline" onClick={() => setDetail(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
