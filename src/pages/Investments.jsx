import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import api, { formatINR, formatDate } from '../api.js';

const COLORS = ['#3b82f6','#22c55e','#f59e0b','#a855f7','#06b6d4'];

export default function Investments() {
  const [portfolios, setPortfolios] = useState([]);
  const [corpus, setCorpus]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showModal, setModal]       = useState(false);
  const [showCorpusModal, setCorpusModal] = useState(false);
  const [form, setForm]             = useState({ assetClass:'GovernmentSecurities', investmentAmount:'', remarks:'' });
  const [corpusForm, setCorpusForm] = useState({ totalContributions:'', totalWithdrawals:'', investmentIncome:'', managementExpenses:'' });
  const [schemes, setSchemes]       = useState([]);
  const [saving, setSaving]         = useState(false);
  const [err, setErr]               = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [p, c, s] = await Promise.all([api.get('/api/portfolios'), api.get('/api/corpus'), api.get('/api/schemes').catch(()=>({data:[]}))]);
      setPortfolios(p.data); setCorpus(c.data); setSchemes(s.data);
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const handleSave = async (e) => {
    e.preventDefault(); setErr(''); setSaving(true);
    try {
      await api.post('/api/portfolios', {
        schemeId: schemes[0]?.schemeId || '00000000-0000-0000-0000-000000000000',
        assetClass: form.assetClass,
        investedValue: parseFloat(form.investmentAmount) || 0,
        currentValue: parseFloat(form.investmentAmount) || 0,
        yieldEarned: 0,
        allocationPercent: 0
      });
      setModal(false); load();
    } catch (er) { setErr(er.response?.data?.message || 'Failed to add investment.'); }
    finally { setSaving(false); }
  };

  const handleCorpusSave = async (e) => {
    e.preventDefault(); setErr(''); setSaving(true);
    try {
      await api.post('/api/corpus', {
        schemeId: schemes[0]?.schemeId || '00000000-0000-0000-0000-000000000000',
        recordDate: new Date().toISOString(),
        totalContributions: parseFloat(corpusForm.totalContributions) || 0,
        totalWithdrawals: parseFloat(corpusForm.totalWithdrawals) || 0,
        investmentIncome: parseFloat(corpusForm.investmentIncome) || 0,
        managementExpenses: parseFloat(corpusForm.managementExpenses) || 0
      });
      setCorpusModal(false); load();
    } catch (er) { setErr(er.response?.data?.message || 'Failed to add corpus record.'); }
    finally { setSaving(false); }
  };

  const toLabel = (s) => s ? String(s).replace(/([A-Z])/g, ' $1').trim() : 'Unknown';

  const chartData = portfolios.map((p, i) => ({
    name: toLabel(p.assetClass),
    value: p.currentValue || 0,
    color: COLORS[i % COLORS.length],
  }));

  const totalValue = portfolios.reduce((s,p) => s + (p.currentValue||0), 0);

  return (
    <div className="page-body">
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-title">Investments</div>
          <div className="page-desc">Fund portfolio allocation and corpus records</div>
        </div>
        <div style={{display:'flex',gap:8}}>
          <button className="btn btn-outline" onClick={() => setCorpusModal(true)}>
            Add Corpus Record
          </button>
          <button className="btn btn-primary" onClick={() => setModal(true)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add Investment
          </button>
        </div>
      </div>

      <div style={{display:'flex',gap:16,marginBottom:24,flexWrap:'wrap'}}>
        <div className="stat-card" style={{flex:'1 1 200px'}}>
          <div className="stat-label">Total Portfolio Value</div>
          <div className="stat-value" style={{fontSize:22,marginTop:8}}>{formatINR(totalValue)}</div>
        </div>
        {portfolios.map((p,i) => (
          <div key={p.portfolioId} className="stat-card" style={{flex:'1 1 160px'}}>
            <div style={{width:8,height:8,borderRadius:'50%',background:COLORS[i%COLORS.length],marginBottom:6}} />
            <div className="stat-label">{toLabel(p.assetClass)}</div>
            <div style={{fontSize:15,fontWeight:700,color:'var(--text-primary)',marginTop:6}}>{formatINR(p.currentValue)}</div>
            <div style={{fontSize:11,color:'var(--text-muted)'}}>{totalValue ? ((p.currentValue/totalValue)*100).toFixed(1) : 0}%</div>
          </div>
        ))}
      </div>

      <div className="charts-grid" style={{marginBottom:24}}>
        <div className="chart-card">
          <div className="chart-title">Portfolio Allocation by Asset Class</div>
          <div className="chart-sub">Current market value (₹)</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} margin={{top:4,right:4,bottom:0,left:0}}>
              <CartesianGrid stroke="var(--card-border)" strokeDasharray="3 3" vertical={false}/>
              <XAxis dataKey="name" tick={{fontSize:11,fill:'var(--text-muted)'}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fontSize:10,fill:'var(--text-muted)'}} axisLine={false} tickLine={false} tickFormatter={v=>`₹${(v/100000).toFixed(0)}L`} width={48}/>
              <Tooltip formatter={v => formatINR(v)} contentStyle={{background:'var(--card-bg)',border:'1px solid var(--card-border)',borderRadius:6,fontSize:12}}/>
              <Bar dataKey="value" radius={[4,4,0,0]}>
                {chartData.map((d,i)=><Cell key={i} fill={d.color}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="table-card" style={{marginBottom:0}}>
          <div className="table-header"><span className="table-title">Fund Corpus Records</span></div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Date</th><th style={{textAlign:'right'}}>Opening (₹)</th><th style={{textAlign:'right'}}>Closing (₹)</th></tr></thead>
              <tbody>
                {corpus.slice(0,8).map(c => (
                  <tr key={c.corpusId}>
                    <td>{formatDate(c.recordDate)}</td>
                    <td style={{textAlign:'right'}} className="amount">{formatINR(c.openingCorpus)}</td>
                    <td style={{textAlign:'right'}} className="amount amount-positive">{formatINR(c.closingCorpus)}</td>
                  </tr>
                ))}
                {corpus.length===0 && <tr><td colSpan={3} style={{textAlign:'center',padding:30,color:'var(--text-muted)'}}>No records</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target===e.currentTarget&&setModal(false)}>
          <div className="modal">
            <div className="modal-head">
              <span className="modal-title">Add Investment</span>
              <button className="icon-btn" onClick={()=>setModal(false)}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                {err && <div className="login-error" style={{marginBottom:16}}>{err}</div>}
                <div className="form-group">
                  <label className="form-label">Asset Class *</label>
                  <select className="form-input" value={form.assetClass} onChange={e=>setForm({...form,assetClass:e.target.value})}>
                    <option value="GovernmentSecurities">Government Securities</option>
                    <option value="CorporateBonds">Corporate Bonds</option>
                    <option value="Equity">Equity</option>
                    <option value="FixedDeposit">Fixed Deposit</option>
                    <option value="MoneyMarket">Money Market</option>
                    <option value="MutualFunds">Mutual Funds</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Investment Amount (₹) *</label>
                  <input className="form-input" type="number" min="0" step="0.01" value={form.investmentAmount} onChange={e=>setForm({...form,investmentAmount:e.target.value})} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Remarks</label>
                  <input className="form-input" placeholder="Optional notes" value={form.remarks} onChange={e=>setForm({...form,remarks:e.target.value})} />
                </div>
              </div>
              <div className="modal-foot">
                <button type="button" className="btn btn-outline" onClick={()=>setModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <span className="spinner" style={{width:14,height:14,margin:0}} /> : 'Add Investment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCorpusModal && (
        <div className="modal-overlay" onClick={e => e.target===e.currentTarget&&setCorpusModal(false)}>
          <div className="modal">
            <div className="modal-head">
              <span className="modal-title">Add Corpus Record</span>
              <button className="icon-btn" onClick={()=>setCorpusModal(false)}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
            </div>
            <form onSubmit={handleCorpusSave}>
              <div className="modal-body">
                {err && <div className="login-error" style={{marginBottom:16}}>{err}</div>}
                <div className="form-group">
                  <label className="form-label">Total Contributions (₹)</label>
                  <input className="form-input" type="number" min="0" step="0.01" value={corpusForm.totalContributions} onChange={e=>setCorpusForm({...corpusForm,totalContributions:e.target.value})} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Total Withdrawals (₹)</label>
                  <input className="form-input" type="number" min="0" step="0.01" value={corpusForm.totalWithdrawals} onChange={e=>setCorpusForm({...corpusForm,totalWithdrawals:e.target.value})} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Investment Income (₹)</label>
                  <input className="form-input" type="number" min="0" step="0.01" value={corpusForm.investmentIncome} onChange={e=>setCorpusForm({...corpusForm,investmentIncome:e.target.value})} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Management Expenses (₹)</label>
                  <input className="form-input" type="number" min="0" step="0.01" value={corpusForm.managementExpenses} onChange={e=>setCorpusForm({...corpusForm,managementExpenses:e.target.value})} required />
                </div>
              </div>
              <div className="modal-foot">
                <button type="button" className="btn btn-outline" onClick={()=>setCorpusModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <span className="spinner" style={{width:14,height:14,margin:0}} /> : 'Save Corpus'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
