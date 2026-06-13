import React, { useEffect, useState } from 'react';
import api, { formatINR, formatDate } from '../api.js';

export default function Annuity() {
  const [plans, setPlans]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setModal] = useState(false);
  const [showDisburse, setShowDisburse] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [historyData, setHistoryData] = useState([]);
  const [selectedAnnuity, setSelectedAnnuity] = useState(null);
  const [members, setMembers] = useState([]);
  const [form, setForm]       = useState({ memberId:'', annuityType:'LifeAnnuity', monthlyAmount:'', startDate:'', endDate:'' });
  const [disburseForm, setDisburseForm] = useState({ month: new Date().getMonth() + 1, year: new Date().getFullYear(), taxDeducted: 0 });
  const [saving, setSaving]   = useState(false);
  const [err, setErr]         = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [a, m] = await Promise.all([api.get('/api/annuity'), api.get('/api/members')]);
      setPlans(a.data); setMembers(m.data);
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const handleSave = async (e) => {
    e.preventDefault(); setErr(''); setSaving(true);
    try {
      await api.post('/api/annuity', {
        memberId: form.memberId,
        planType: form.annuityType,
        purchaseValue: 0,
        monthlyPension: parseFloat(form.monthlyAmount),
        annuityStartDate: new Date(form.startDate).toISOString()
      });
      setModal(false); load();
    } catch (er) { setErr(er.response?.data?.message || 'Failed to create annuity plan.'); }
    finally { setSaving(false); }
  };

  const handleDisburse = async (e) => {
    e.preventDefault(); setErr(''); setSaving(true);
    try {
      await api.post(`/api/annuity/${selectedAnnuity.annuityId}/disburse`, {
        month: parseInt(disburseForm.month),
        year: parseInt(disburseForm.year),
        taxDeducted: parseFloat(disburseForm.taxDeducted)
      });
      setShowDisburse(false); load();
      viewHistory(selectedAnnuity); // Automatically show history after success!
    } catch (er) { setErr(er.response?.data?.message || 'Failed to process disbursement.'); }
    finally { setSaving(false); }
  };

  const viewHistory = async (plan) => {
    setSelectedAnnuity(plan);
    setShowHistory(true);
    try {
      const res = await api.get(`/api/annuity/${plan.annuityId}/disbursements`);
      setHistoryData(res.data);
    } catch (er) { setHistoryData([]); }
  };

  const getStatusName = (s) => typeof s === 'number' ? {0:'Active', 1:'Suspended', 2:'Terminated'}[s] || s : s;
  const totalMonthly = plans.filter(p => getStatusName(p.status) === 'Active').reduce((s,p)=>s+(p.monthlyPension||0),0);

  return (
    <div className="page-body">
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-title">Annuity</div>
          <div className="page-desc">Retirement annuity plans and monthly disbursements</div>
        </div>
        <button className="btn btn-primary" onClick={() => setModal(true)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Create Plan
        </button>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16,marginBottom:24}}>
        <div className="stat-card">
          <div className="stat-label">Total Annuity Plans</div>
          <div className="stat-value" style={{fontSize:22,marginTop:8}}>{plans.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Active Plans</div>
          <div className="stat-value" style={{fontSize:22,marginTop:8}}>{plans.filter(p=>getStatusName(p.status)==='Active').length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Monthly Disbursement Liability</div>
          <div className="stat-value" style={{fontSize:20,marginTop:8}}>{formatINR(totalMonthly)}</div>
        </div>
      </div>

      <div className="table-card">
        <div className="table-header"><span className="table-title">Annuity Plans</span></div>
        {loading ? <div style={{padding:40}}><div className="spinner"/></div> : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Member</th><th>Type</th><th>Monthly Amount (₹)</th><th>Start Date</th><th>End Date</th><th>Status</th><th>Action</th></tr></thead>
              <tbody>
                {plans.length===0
                  ? <tr><td colSpan={6} style={{textAlign:'center',padding:40,color:'var(--text-muted)'}}>No annuity plans created</td></tr>
                  : plans.map(p => (
                    <tr key={p.annuityId}>
                      <td className="bold">{p.memberName}</td>
                      <td>{p.planType}</td>
                      <td className="amount amount-positive">{formatINR(p.monthlyPension)}</td>
                      <td>{formatDate(p.annuityStartDate)}</td>
                      <td>∞ Lifetime</td>
                      <td><span className={`badge ${getStatusName(p.status)==='Active'?'badge-green':'badge-gray'}`}>{getStatusName(p.status)}</span></td>
                      <td>
                        <div style={{display:'flex', gap:8}}>
                          {getStatusName(p.status) === 'Active' && (
                            <button className="btn btn-sm btn-success" onClick={() => { setSelectedAnnuity(p); setShowDisburse(true); }}>Disburse</button>
                          )}
                          <button className="btn btn-sm btn-outline" onClick={() => viewHistory(p)}>History</button>
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
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setModal(false)}>
          <div className="modal">
            <div className="modal-head">
              <span className="modal-title">Create Annuity Plan</span>
              <button className="icon-btn" onClick={()=>setModal(false)}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                {err && <div className="login-error" style={{marginBottom:16}}>{err}</div>}
                <div className="form-group">
                  <label className="form-label">Member *</label>
                  <select className="form-input" value={form.memberId} onChange={e=>setForm({...form,memberId:e.target.value})} required>
                    <option value="">Select member</option>
                    {members.map(m=><option key={m.memberId} value={m.memberId}>{m.name}</option>)}
                  </select>
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Annuity Type</label>
                    <select className="form-input" value={form.annuityType} onChange={e=>setForm({...form,annuityType:e.target.value})}>
                      <option value="LifeAnnuity">Life Annuity</option>
                      <option value="TemporaryAnnuity">Temporary Annuity</option>
                      <option value="JointAnnuity">Joint Annuity</option>
                      <option value="GuaranteedAnnuity">Guaranteed Annuity</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Monthly Amount (₹) *</label>
                    <input className="form-input" type="number" min="0" step="0.01" value={form.monthlyAmount} onChange={e=>setForm({...form,monthlyAmount:e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Start Date *</label>
                    <input className="form-input" type="date" value={form.startDate} onChange={e=>setForm({...form,startDate:e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">End Date (optional)</label>
                    <input className="form-input" type="date" value={form.endDate} onChange={e=>setForm({...form,endDate:e.target.value})} />
                  </div>
                </div>
              </div>
              <div className="modal-foot">
                <button type="button" className="btn btn-outline" onClick={()=>setModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <span className="spinner" style={{width:14,height:14,margin:0}} /> : 'Create Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDisburse && selectedAnnuity && (
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setShowDisburse(false)}>
          <div className="modal">
            <div className="modal-head">
              <span className="modal-title">Process Monthly Disbursement</span>
              <button className="icon-btn" onClick={()=>setShowDisburse(false)}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
            </div>
            <form onSubmit={handleDisburse}>
              <div className="modal-body">
                {err && <div className="login-error" style={{marginBottom:16}}>{err}</div>}
                <div style={{background:'var(--card-border)', padding:16, borderRadius:'var(--radius-md)', marginBottom:20}}>
                  <div style={{fontSize:13, color:'var(--text-muted)'}}>Plan Details</div>
                  <div style={{fontSize:16, fontWeight:600}}>{selectedAnnuity.memberName} - {selectedAnnuity.planType}</div>
                  <div style={{fontSize:14, marginTop:4}}>Gross Amount: <span className="bold amount-positive">{formatINR(selectedAnnuity.monthlyPension)}</span></div>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Month (1-12) *</label>
                    <input className="form-input" type="number" min="1" max="12" value={disburseForm.month} onChange={e=>setDisburseForm({...disburseForm,month:e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Year *</label>
                    <input className="form-input" type="number" min="2020" value={disburseForm.year} onChange={e=>setDisburseForm({...disburseForm,year:e.target.value})} required />
                  </div>
                </div>
                <div className="form-group" style={{marginTop:16}}>
                  <label className="form-label">Tax Deducted (₹) *</label>
                  <input className="form-input" type="number" min="0" step="0.01" value={disburseForm.taxDeducted} onChange={e=>setDisburseForm({...disburseForm,taxDeducted:e.target.value})} required />
                </div>
              </div>
              <div className="modal-foot">
                <button type="button" className="btn btn-outline" onClick={()=>setShowDisburse(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <span className="spinner" style={{width:14,height:14,margin:0}} /> : 'Process Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showHistory && selectedAnnuity && (
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setShowHistory(false)}>
          <div className="modal" style={{maxWidth: 700}}>
            <div className="modal-head">
              <span className="modal-title">Disbursement History - {selectedAnnuity.memberName}</span>
              <button className="icon-btn" onClick={()=>setShowHistory(false)}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
            </div>
            <div className="modal-body">
              {historyData.length === 0 ? (
                <div style={{padding:40, textAlign:'center', color:'var(--text-muted)'}}>No disbursements recorded yet.</div>
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr><th>Period</th><th>Gross (₹)</th><th>Tax (₹)</th><th>Net Paid (₹)</th><th>Date</th></tr>
                    </thead>
                    <tbody>
                      {historyData.map(h => (
                        <tr key={h.disbursementId}>
                          <td className="bold">{h.month}/{h.year}</td>
                          <td className="amount">{formatINR(h.grossAmount)}</td>
                          <td className="amount amount-negative">{formatINR(h.taxDeducted)}</td>
                          <td className="amount amount-positive bold">{formatINR(h.netAmount)}</td>
                          <td>{formatDate(h.disbursedDate)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
