import React, { useEffect, useState } from 'react';
import api, { formatINR, formatDate } from '../api.js';

function StatusBadge({ s }) {
  const str = typeof s === 'number' ? ['Received','Reconciled','Shortfall','Default'][s] : s;
  const map = { Received:'badge-amber', Reconciled:'badge-green', Shortfall:'badge-red' };
  return <span className={`badge ${map[str]||'badge-gray'}`}>{str}</span>;
}

export default function Remittances() {
  const [remits, setRemits]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setModal] = useState(false);
  const [members, setMembers] = useState([]);
  const [form, setForm]       = useState({ memberId:'', payrollPeriod:'', employeeContribution:'', employerContribution:'' });
  const [saving, setSaving]   = useState(false);
  const [view, setView]       = useState('All');
  const [showReport, setShowReport] = useState(null);

  const load = async (v = view) => {
    setLoading(true);
    try {
      let ep = '/api/remittances';
      if (v === 'Defaulters') ep = '/api/remittances/defaulters';
      if (v === 'Overdue') ep = '/api/remittances/overdue';
      const [r, m] = await Promise.all([api.get(ep), api.get('/api/members')]);
      setRemits(r.data); setMembers(m.data);
    } finally { setLoading(false); }
  };
  useEffect(() => { load(view); }, [view]);

  const reconcile = async (id) => {
    try { await api.post(`/api/remittances/${id}/reconcile`); load(); } catch {}
  };

  const viewReport = async (id) => {
    try {
      const res = await api.get(`/api/remittances/${id}/reconciliation-report`);
      setShowReport(res.data);
    } catch {}
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setErr(''); setSaving(true);
    try {
      await api.post('/api/remittances', {
        employerId: "00000000-0000-0000-0000-000000000000",
        remittancePeriod: form.payrollPeriod,
        totalEmployeeShare: parseFloat(form.employeeContribution),
        totalEmployerShare: parseFloat(form.employerContribution),
        coverageCount: 1,
        memberContributions: [
          {
            memberId: form.memberId,
            employeeAmount: parseFloat(form.employeeContribution),
            employerAmount: parseFloat(form.employerContribution)
          }
        ]
      });
      setModal(false);
      setForm({ memberId:'', payrollPeriod:'', employeeContribution:'', employerContribution:'' });
      load();
    } catch (er) { setErr(er.response?.data?.message || 'Failed to submit remittance.'); }
    finally { setSaving(false); }
  };

  const totals = remits.reduce((acc, r) => ({
    emp: acc.emp + (r.totalEmployeeShare || 0),
    emr: acc.emr + (r.totalEmployerShare || 0),
    ttl: acc.ttl + (r.totalAmount || 0),
  }), { emp:0, emr:0, ttl:0 });

  return (
    <div className="page-body">
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-title">Remittances</div>
          <div className="page-desc">Payroll contributions and reconciliation</div>
        </div>
        <button className="btn btn-primary" onClick={() => setModal(true)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Submit Remittance
        </button>
      </div>

      {/* Summary cards */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16,marginBottom:24}}>
        {[
          { label:'Total Employee Contribution', value: formatINR(totals.emp), color:'blue' },
          { label:'Total Employer Contribution', value: formatINR(totals.emr), color:'green' },
          { label:'Total Corpus', value: formatINR(totals.ttl), color:'purple' },
        ].map(c => (
          <div key={c.label} className="stat-card">
            <div className="stat-label">{c.label}</div>
            <div className="stat-value" style={{fontSize:20,marginTop:8}}>{c.value}</div>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div style={{display:'flex',gap:4,marginBottom:16}}>
        {['All','Overdue','Defaulters'].map(s => (
          <button key={s} onClick={() => setView(s)}
            className="btn btn-sm"
            style={{ background: view===s ? 'var(--accent)' : 'var(--card-bg)', color: view===s ? '#fff' : 'var(--text-secondary)', border:'1px solid', borderColor: view===s ? 'var(--accent)' : 'var(--card-border)' }}>
            {s}
          </button>
        ))}
      </div>

      <div className="table-card">
        <div className="table-header"><span className="table-title">{view} Remittances</span></div>
        {loading ? <div style={{padding:40}}><div className="spinner"/></div> : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Employer</th><th>Period</th><th>Employee (₹)</th><th>Employer (₹)</th><th>Total (₹)</th><th>Date</th><th>Status</th><th>Action</th></tr></thead>
              <tbody>
                {remits.length === 0
                  ? <tr><td colSpan={8} style={{textAlign:'center',padding:40,color:'var(--text-muted)'}}>No remittances found</td></tr>
                  : remits.map(r => (
                  <tr key={r.remittanceId}>
                    <td className="bold">{r.employerName}</td>
                    <td>{r.remittancePeriod}</td>
                    <td className="amount">{formatINR(r.totalEmployeeShare)}</td>
                    <td className="amount">{formatINR(r.totalEmployerShare)}</td>
                    <td className="amount amount-positive">{formatINR(r.totalAmount)}</td>
                    <td>{formatDate(r.remittanceDate)}</td>
                    <td><StatusBadge s={r.status} /></td>
                    <td>
                      <div style={{display:'flex', gap:4}}>
                        {(r.status === 'Received' || r.status === 0 || r.status === 'Pending') && <button className="btn btn-sm btn-success" onClick={() => reconcile(r.remittanceId)}>Reconcile</button>}
                        {r.status === 'Reconciled' && <button className="btn btn-sm btn-outline" onClick={() => viewReport(r.remittanceId)}>Report</button>}
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
              <span className="modal-title">Submit Remittance</span>
              <button className="icon-btn" onClick={() => setModal(false)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {err && <div className="login-error" style={{marginBottom:16}}>{err}</div>}
                <div className="form-group">
                  <label className="form-label">Member *</label>
                  <select className="form-input" value={form.memberId} onChange={e => setForm({...form,memberId:e.target.value})} required>
                    <option value="">Select member</option>
                    {members.map(m => <option key={m.memberId} value={m.memberId}>{m.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Payroll Period *</label>
                  <input className="form-input" placeholder="e.g. June 2026" value={form.payrollPeriod} onChange={e => setForm({...form,payrollPeriod:e.target.value})} required />
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Employee Contribution (₹) *</label>
                    <input className="form-input" type="number" min="0" step="0.01" placeholder="0.00" value={form.employeeContribution} onChange={e => setForm({...form,employeeContribution:e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Employer Contribution (₹) *</label>
                    <input className="form-input" type="number" min="0" step="0.01" placeholder="0.00" value={form.employerContribution} onChange={e => setForm({...form,employerContribution:e.target.value})} required />
                  </div>
                </div>
              </div>
              <div className="modal-foot">
                <button type="button" className="btn btn-outline" onClick={() => setModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <span className="spinner" style={{width:14,height:14,margin:0}} /> : 'Submit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showReport && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowReport(null)}>
          <div className="modal">
            <div className="modal-head">
              <span className="modal-title">Reconciliation Report</span>
              <button className="icon-btn" onClick={() => setShowReport(null)}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
            </div>
            <div className="modal-body">
              <div style={{background:'var(--card-border)', padding:16, borderRadius:'var(--radius-md)'}}>
                <div style={{fontSize:14, marginBottom:8}}><span className="bold">Period:</span> {showReport.remittancePeriod}</div>
                <div style={{fontSize:14, marginBottom:8}}><span className="bold">Status:</span> <StatusBadge s={showReport.status} /></div>
                <div style={{fontSize:14, marginBottom:8}}><span className="bold">Headcount:</span> {showReport.reconciledCount} / {showReport.expectedCount} Processed</div>
                <div style={{fontSize:14}}><span className="bold">Amount:</span> {formatINR(showReport.totalReconciledAmount)} / {formatINR(showReport.totalExpectedAmount)} Processed</div>
              </div>
            </div>
            <div className="modal-foot">
              <button type="button" className="btn btn-outline" onClick={() => setShowReport(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
