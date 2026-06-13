import React, { useEffect, useState } from 'react';
import api, { formatINR, formatDate } from '../api.js';

export default function Schemes() {
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setModal] = useState(false);
  const [form, setForm] = useState({ schemeName:'', schemeCode:'', contributionRate:'', schemeType:'EPF', description:'' });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const load = () => {
    setLoading(true);
    api.get('/api/schemes').then(r => setSchemes(r.data)).catch(()=>{}).finally(()=>setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const handleSave = async (e) => {
    e.preventDefault(); setErr(''); setSaving(true);
    try {
      await api.post('/api/schemes', { 
        schemeName: form.schemeName,
        schemeCode: form.schemeCode,
        schemeType: form.schemeType,
        description: form.description,
        employeeContributionRate: parseFloat(form.contributionRate),
        employerContributionRate: parseFloat(form.contributionRate)
      });
      setModal(false);
      setForm({ schemeName:'', schemeCode:'', contributionRate:'', schemeType:'EPF', description:'' });
      load();
    } catch (er) { setErr(er.response?.data?.message || 'Failed to create scheme.'); }
    finally { setSaving(false); }
  };

  const colors = { EPF:'blue', Gratuity:'green', NPS:'purple', Pension:'amber' };

  return (
    <div className="page-body">
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-title">Fund Schemes</div>
          <div className="page-desc">Configured pension and provident fund schemes</div>
        </div>
        <button className="btn btn-primary" onClick={() => setModal(true)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add Scheme
        </button>
      </div>

      {loading ? <div style={{padding:60}}><div className="spinner"/></div> : (
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:16}}>
          {schemes.length === 0 ? (
            <div className="empty-state" style={{gridColumn:'1/-1'}}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
              <p>No schemes created yet.</p>
            </div>
          ) : schemes.map(s => (
            <div key={s.schemeId} className="stat-card" style={{gap:16}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                <span className={`badge badge-${colors[s.schemeType]||'blue'}`}>{s.schemeType}</span>
                <span style={{fontSize:11,color:'var(--text-muted)'}}>{s.schemeCode}</span>
              </div>
              <div>
                <div style={{fontSize:16,fontWeight:700,color:'var(--text-primary)',marginBottom:4}}>{s.schemeName}</div>
                <div style={{fontSize:12,color:'var(--text-muted)',lineHeight:1.5}}>{s.description || 'No description.'}</div>
              </div>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',paddingTop:8,borderTop:'1px solid var(--card-border)'}}>
                <div>
                  <div style={{fontSize:10,color:'var(--text-muted)',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.5px'}}>Contribution Rate</div>
                  <div style={{fontSize:18,fontWeight:800,color:'var(--accent)'}}>{s.employeeContributionRate || s.employerContributionRate || 0}%</div>
                </div>
                <span className={`badge ${s.status==='Active'||s.status===0?'badge-green':'badge-gray'}`}>{s.status==='Active'||s.status===0?'Active':'Inactive'}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="modal">
            <div className="modal-head">
              <span className="modal-title">Add Fund Scheme</span>
              <button className="icon-btn" onClick={() => setModal(false)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                {err && <div className="login-error" style={{marginBottom:16}}>{err}</div>}
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Scheme Name *</label>
                    <input className="form-input" value={form.schemeName} onChange={e=>setForm({...form,schemeName:e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Scheme Code *</label>
                    <input className="form-input" placeholder="EPF-2026" value={form.schemeCode} onChange={e=>setForm({...form,schemeCode:e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Type</label>
                    <select className="form-input" value={form.schemeType} onChange={e=>setForm({...form,schemeType:e.target.value})}>
                      <option>EPF</option><option>Gratuity</option><option>NPS</option><option>Pension</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Contribution Rate (%)</label>
                    <input className="form-input" type="number" min="0" max="100" step="0.01" value={form.contributionRate} onChange={e=>setForm({...form,contributionRate:e.target.value})} required />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <input className="form-input" placeholder="Brief description" value={form.description} onChange={e=>setForm({...form,description:e.target.value})} />
                </div>
              </div>
              <div className="modal-foot">
                <button type="button" className="btn btn-outline" onClick={() => setModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <span className="spinner" style={{width:14,height:14,margin:0}} /> : 'Create Scheme'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
