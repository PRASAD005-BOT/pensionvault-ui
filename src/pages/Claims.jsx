import React, { useEffect, useState } from 'react';
import api, { formatINR, formatDate } from '../api.js';
import { useAuth } from '../context.jsx';

function StatusBadge({ s }) {
  const map = { Submitted:'badge-blue', UnderReview:'badge-amber', Approved:'badge-green', Rejected:'badge-red', Disbursed:'badge-purple' };
  return <span className={`badge ${map[s] || 'badge-gray'}`}>{s}</span>;
}

export default function Claims() {
  const { user } = useAuth();
  const isAdminOrFundAdmin = user?.role === 'Admin' || user?.role === 'FundAdmin';
  const [claims, setClaims]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [filter, setFilter]   = useState('All');
  const [saving, setSaving]   = useState({});
  const [showModal, setModal] = useState(false);
  const [members, setMembers] = useState([]);
  const [form, setForm]       = useState({ memberId:'', claimType:'PartialWithdrawal', remarks:'', eligibleAmount:'' });
  const [formErr, setFormErr] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [c, m] = await Promise.all([api.get('/api/claims'), api.get('/api/members')]);
      setClaims(c.data); setMembers(m.data);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const statuses = ['All','Submitted','UnderReview','Approved','Rejected','Disbursed'];
  const filtered = claims.filter(c =>
    (filter === 'All' || c.status === filter) &&
    (c.memberName?.toLowerCase().includes(search.toLowerCase()) || c.claimType?.toLowerCase().includes(search.toLowerCase()))
  );

  const action = async (claimId, endpoint) => {
    setSaving(s => ({ ...s, [claimId]: true }));
    try { await api.put(endpoint); await load(); } finally { setSaving(s => ({ ...s, [claimId]: false })); }
  };

  const handleDisburse = async (c) => {
    setSaving(s => ({ ...s, [c.claimId]: true }));
    try {
      const tax = c.eligibleAmount * 0.1;
      if (c.claimType === 'PartialWithdrawal') {
        await api.post(`/api/claims/${c.claimId}/disburse-partial-withdrawal`, {
          disbursedAmount: c.eligibleAmount,
          bankAccountRef: 'Auto-Disbursed via UI'
        });
      } else {
        await api.post(`/api/claims/${c.claimId}/disburse`, {
          disbursedAmount: c.eligibleAmount,
          taxDeducted: tax,
          bankAccountRef: 'Auto-Disbursed via UI'
        });
      }
      await load();
    } finally { setSaving(s => ({ ...s, [c.claimId]: false })); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setFormErr('');
    try {
      if (form.claimType === 'PartialWithdrawal') {
        await api.post('/api/claims/partial-withdrawal', {
          memberId: form.memberId,
          requestedAmount: parseFloat(form.eligibleAmount) || 0,
          reason: form.remarks || 'Standard partial withdrawal'
        });
      } else {
        await api.post('/api/claims', { ...form, eligibleAmount: parseFloat(form.eligibleAmount) || 0, claimDate: new Date().toISOString() });
      }
      setModal(false); load();
    } catch (err) { setFormErr(err.response?.data?.message || 'Failed to submit claim.'); }
  };

  return (
    <div className="page-body">
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-title">Claims</div>
          <div className="page-desc">Manage benefit claims and disbursements</div>
        </div>
        <button className="btn btn-primary" onClick={() => setModal(true)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          New Claim
        </button>
      </div>

      {/* Filter Tabs */}
      <div style={{display:'flex',gap:4,marginBottom:16,flexWrap:'wrap'}}>
        {statuses.map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className="btn btn-sm"
            style={{ background: filter===s ? 'var(--accent)' : 'var(--card-bg)', color: filter===s ? '#fff' : 'var(--text-secondary)', border:'1px solid', borderColor: filter===s ? 'var(--accent)' : 'var(--card-border)' }}>
            {s}
          </button>
        ))}
        <div className="topbar-search" style={{height:26,marginLeft:'auto'}}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{color:'var(--text-muted)'}}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} style={{width:140}} />
        </div>
      </div>

      <div className="table-card">
        <div className="table-header">
          <span className="table-title">{filter} Claims ({filtered.length})</span>
        </div>
        {loading ? <div style={{padding:40}}><div className="spinner"/></div> : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Claim ID</th><th>Member</th><th>Type</th><th>Eligible Amount</th><th>Claim Date</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} style={{textAlign:'center',padding:40,color:'var(--text-muted)'}}>No claims found</td></tr>
                ) : filtered.map(c => (
                  <tr key={c.claimId}>
                    <td className="mono">{c.claimId?.slice(0,8)}…</td>
                    <td className="bold">{c.memberName}</td>
                    <td>{c.claimType}</td>
                    <td className="amount">{formatINR(c.eligibleAmount)}</td>
                    <td>{formatDate(c.claimDate)}</td>
                    <td><StatusBadge s={c.status} /></td>
                    <td>
                      <div style={{display:'flex',gap:4}}>
                        {c.status === 'Submitted' && isAdminOrFundAdmin && <button className="btn btn-sm btn-outline" disabled={saving[c.claimId]} onClick={() => action(c.claimId, `/api/claims/${c.claimId}/review`)}>Review</button>}
                        {c.status === 'UnderReview' && isAdminOrFundAdmin && <>
                          <button className="btn btn-sm btn-success" disabled={saving[c.claimId]} onClick={() => action(c.claimId, `/api/claims/${c.claimId}/approve`)}>Approve</button>
                          <button className="btn btn-sm btn-danger" disabled={saving[c.claimId]} onClick={() => action(c.claimId, `/api/claims/${c.claimId}/reject`)}>Reject</button>
                        </>}
                        {c.status === 'Approved' && isAdminOrFundAdmin && <button className="btn btn-sm btn-primary" disabled={saving[c.claimId]} onClick={() => handleDisburse(c)}>Disburse</button>}
                      </div>
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
              <span className="modal-title">Submit New Claim</span>
              <button className="icon-btn" onClick={() => setModal(false)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {formErr && <div className="login-error" style={{marginBottom:16}}>{formErr}</div>}
                <div className="form-group">
                  <label className="form-label">Member *</label>
                  <select className="form-input" value={form.memberId} onChange={e => setForm({...form, memberId:e.target.value})} required>
                    <option value="">Select member</option>
                    {members.map(m => <option key={m.memberId} value={m.memberId}>{m.name} — {m.membershipNumber}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Claim Type *</label>
                  <select className="form-input" value={form.claimType} onChange={e => setForm({...form, claimType:e.target.value})}>
                    <option value="PartialWithdrawal">Partial Withdrawal</option>
                    <option value="Retirement">Retirement</option>
                    <option value="Resignation">Resignation</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Amount (₹) *</label>
                  <input type="number" className="form-input" required placeholder="Amount to claim" value={form.eligibleAmount} onChange={e => setForm({...form, eligibleAmount:e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Remarks</label>
                  <input className="form-input" placeholder="Optional remarks" value={form.remarks} onChange={e => setForm({...form, remarks:e.target.value})} />
                </div>
              </div>
              <div className="modal-foot">
                <button type="button" className="btn btn-outline" onClick={() => setModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Submit Claim</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
