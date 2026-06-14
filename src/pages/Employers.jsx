import React, { useEffect, useState } from 'react';
import api from '../api.js';

export default function Employers() {
  const [employers, setEmployers] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showModal, setModal]     = useState(false);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');
  
  const [form, setForm] = useState({
    companyName: '',
    registrationNumber: '',
    industry: '',
    remittanceFrequency: 0,
    contactEmail: '',
    contactPhone: ''
  });

  const load = () => {
    setLoading(true);
    api.get('/api/employers')
       .then(r => setEmployers(r.data))
       .catch(()=>{})
       .finally(()=>setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const contactDetails = [form.contactEmail, form.contactPhone].filter(Boolean).join(', ');
      await api.post('/api/employers', {
        companyName: form.companyName,
        registrationNumber: form.registrationNumber,
        industry: form.industry,
        remittanceFrequency: parseInt(form.remittanceFrequency, 10),
        contactDetails
      });
      setModal(false);
      setForm({ companyName:'', registrationNumber:'', industry:'', remittanceFrequency:0, contactEmail:'', contactPhone:'' });
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to register employer.');
    } finally {
      setSaving(false);
    }
  };

  const getStatusName = (s) => typeof s === 'number' ? {0:'Active', 1:'Inactive', 2:'Suspended'}[s] || s : s;
  const getFreqName = (f) => typeof f === 'number' ? {0:'Monthly', 1:'Quarterly', 2:'Annually'}[f] || f : f;

  const formatContact = (str) => {
    if (!str) return '—';
    try {
      const obj = JSON.parse(str);
      return Object.values(obj).filter(Boolean).join(' • ');
    } catch {
      return str;
    }
  };

  return (
    <div className="page-body">
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-title">Employers</div>
          <div className="page-desc">Manage registered companies and entities</div>
        </div>
        <button className="btn btn-primary" onClick={() => setModal(true)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add Employer
        </button>
      </div>

      {loading ? <div style={{padding:80}}><div className="spinner"/></div> : employers.length === 0 ? (
        <div className="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
          <p>No employers registered.</p>
        </div>
      ) : (
        <div className="table-card">
          <div className="table-header"><span className="table-title">Registered Employers</span></div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Company Name</th><th>Registration No</th><th>Industry</th><th>Contact Details</th><th>Remittance Freq</th><th>Enrolled Members</th><th>Status</th></tr></thead>
              <tbody>
                {employers.map(emp => (
                  <tr key={emp.employerId}>
                    <td className="bold">{emp.companyName}</td>
                    <td className="mono">{emp.registrationNumber}</td>
                    <td>{emp.industry || '—'}</td>
                    <td>{formatContact(emp.contactDetails)}</td>
                    <td>{getFreqName(emp.remittanceFrequency)}</td>
                    <td>{emp.enrolledMemberCount}</td>
                    <td><span className={`badge ${getStatusName(emp.status)==='Active'?'badge-green':'badge-red'}`}>{getStatusName(emp.status)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="modal" style={{ maxWidth: 500 }}>
            <div className="modal-head">
              <span className="modal-title">Register Employer</span>
              <button className="icon-btn" onClick={() => setModal(false)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                {error && <div className="lp-error" style={{marginBottom:16}}>{error}</div>}
                
                <div className="form-group">
                  <label className="form-label">Company Name</label>
                  <input className="form-input" required value={form.companyName} onChange={e=>setForm({...form, companyName: e.target.value})} placeholder="Acme Corp" />
                </div>
                
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
                  <div className="form-group">
                    <label className="form-label">Registration No (CIN)</label>
                    <input className="form-input" required value={form.registrationNumber} onChange={e=>setForm({...form, registrationNumber: e.target.value})} placeholder="U74999MH..." />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Industry</label>
                    <input className="form-input" value={form.industry} onChange={e=>setForm({...form, industry: e.target.value})} placeholder="Technology" />
                  </div>
                </div>

                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
                  <div className="form-group">
                    <label className="form-label">Contact Email</label>
                    <input className="form-input" type="email" value={form.contactEmail} onChange={e=>setForm({...form, contactEmail: e.target.value})} placeholder="hr@company.com" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Contact Phone</label>
                    <input className="form-input" value={form.contactPhone} onChange={e=>setForm({...form, contactPhone: e.target.value})} placeholder="+91 9876543210" />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Remittance Frequency</label>
                  <select className="form-input" value={form.remittanceFrequency} onChange={e=>setForm({...form, remittanceFrequency: e.target.value})}>
                    <option value={0}>Monthly</option>
                    <option value={1}>Quarterly</option>
                    <option value={2}>Annually</option>
                  </select>
                </div>
              </div>
              <div className="modal-foot">
                <button type="button" className="btn btn-secondary" onClick={() => setModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Registering...' : 'Register Employer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
