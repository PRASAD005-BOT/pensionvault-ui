import React, { useEffect, useState } from 'react';
import api, { formatINR, formatDate, formatDateTime } from '../api.js';
import { useAuth } from '../context.jsx';

export default function Reports() {
  const { user } = useAuth();
  const [tab, setTab]       = useState('statutory');
  const [loading, setLoading] = useState(false);

  // Statutory Returns
  const [statutory, setStatutory]     = useState([]);
  const [periodFilter, setPeriodFilter] = useState('');

  // Defaults
  const [defaults, setDefaults] = useState([]);

  // Audit Trail
  const [logs, setLogs]           = useState([]);
  const [auditSearch, setAuditSearch] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [fromDate, setFromDate]   = useState('');
  const [toDate, setToDate]       = useState('');
  const [auditPage, setAuditPage] = useState(1);
  const PER_PAGE = 20;

  const isFundAdmin = user?.role === 'FundAdmin' || user?.role === 'Admin';
  const isCompliance = user?.role === 'Compliance' || user?.role === 'Admin';

  // Load statutory returns on tab or filter change
  useEffect(() => {
    if (tab === 'statutory') loadStatutory();
    if (tab === 'defaults')  loadDefaults();
    if (tab === 'audit')     loadAudit();
  }, [tab]);

  const loadStatutory = async () => {
    setLoading(true);
    try {
      const url = periodFilter ? `/api/reports/statutory-returns?period=${periodFilter}` : '/api/reports/statutory-returns';
      const r = await api.get(url);
      setStatutory(r.data);
    } catch { setStatutory([]); }
    setLoading(false);
  };

  const loadDefaults = async () => {
    setLoading(true);
    try {
      const r = await api.get('/api/reports/contribution-defaults');
      setDefaults(r.data);
    } catch { setDefaults([]); }
    setLoading(false);
  };

  const loadAudit = async () => {
    setLoading(true);
    try {
      let url = '/api/reports/audit-trail?';
      if (entityFilter) url += `entityType=${entityFilter}&`;
      if (fromDate) url += `from=${fromDate}&`;
      if (toDate)   url += `to=${toDate}&`;
      const r = await api.get(url);
      setLogs(r.data);
    } catch { setLogs([]); }
    setLoading(false);
  };

  const filteredLogs = logs.filter(l =>
    l.action?.toLowerCase().includes(auditSearch.toLowerCase()) ||
    l.entityType?.toLowerCase().includes(auditSearch.toLowerCase()) ||
    l.userName?.toLowerCase().includes(auditSearch.toLowerCase())
  );
  const pagedLogs    = filteredLogs.slice((auditPage-1)*PER_PAGE, auditPage*PER_PAGE);
  const totalPages   = Math.ceil(filteredLogs.length / PER_PAGE);

  const tabs = [
    { id: 'statutory', label: 'Statutory Returns' },
    { id: 'defaults',  label: 'Contribution Defaults' },
    { id: 'audit',     label: 'Audit Trail' },
  ];

  return (
    <div className="page-body">
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-title">Reports</div>
          <div className="page-desc">Statutory returns, contribution defaults and audit trail</div>
        </div>
      </div>

      {/* Tab Bar */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '2px solid var(--card-border)', paddingBottom: 0 }}>
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: '10px 20px',
              background: 'none',
              border: 'none',
              borderBottom: tab === t.id ? '2px solid var(--primary)' : '2px solid transparent',
              color: tab === t.id ? 'var(--primary)' : 'var(--text-muted)',
              fontWeight: tab === t.id ? 600 : 400,
              cursor: 'pointer',
              fontSize: 14,
              marginBottom: -2,
              transition: 'all 0.2s',
            }}
          >{t.label}</button>
        ))}
      </div>

      {/* ── STATUTORY RETURNS ── */}
      {tab === 'statutory' && (
        <div className="table-card">
          <div className="table-header">
            <span className="table-title">Statutory Returns — Contribution Summary</span>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                className="form-input"
                type="month"
                value={periodFilter}
                onChange={e => setPeriodFilter(e.target.value)}
                style={{ height: 32, width: 160 }}
                placeholder="Filter by period"
              />
              <button className="btn btn-primary" style={{ height: 32 }} onClick={loadStatutory}>Load</button>
            </div>
          </div>
          {loading ? <div style={{padding:40}}><div className="spinner"/></div> : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Period</th>
                    <th>Employers</th>
                    <th>Members Covered</th>
                    <th style={{textAlign:'right'}}>Employee Share (₹)</th>
                    <th style={{textAlign:'right'}}>Employer Share (₹)</th>
                    <th style={{textAlign:'right'}}>Total Amount (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {statutory.length === 0
                    ? <tr><td colSpan={6} style={{textAlign:'center',padding:40,color:'var(--text-muted)'}}>No data — Submit a remittance first, then click Load.</td></tr>
                    : statutory.map((r, i) => (
                      <tr key={i}>
                        <td className="bold">{r.period}</td>
                        <td>{r.totalEmployers}</td>
                        <td>{r.totalCoveredMembers}</td>
                        <td style={{textAlign:'right'}} className="amount">{formatINR(r.totalEmployeeShare)}</td>
                        <td style={{textAlign:'right'}} className="amount">{formatINR(r.totalEmployerShare)}</td>
                        <td style={{textAlign:'right'}} className="amount amount-positive bold">{formatINR(r.totalAmount)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── CONTRIBUTION DEFAULTS ── */}
      {tab === 'defaults' && (
        <div className="table-card">
          <div className="table-header">
            <span className="table-title">Contribution Defaults & Shortfalls</span>
            <button className="btn btn-primary" style={{ height: 32 }} onClick={loadDefaults}>Refresh</button>
          </div>
          {loading ? <div style={{padding:40}}><div className="spinner"/></div> : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Period</th>
                    <th>Employer</th>
                    <th style={{textAlign:'right'}}>Total Amount (₹)</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {defaults.length === 0
                    ? <tr><td colSpan={5} style={{textAlign:'center',padding:40,color:'var(--text-muted)'}}>No defaults or shortfalls found. ✅</td></tr>
                    : defaults.map((d, i) => (
                      <tr key={i}>
                        <td className="bold">{d.remittancePeriod}</td>
                        <td>{d.employerName}</td>
                        <td style={{textAlign:'right'}} className="amount amount-negative">{formatINR(d.totalAmount)}</td>
                        <td><span className={`badge ${d.status === 'Default' ? 'badge-red' : 'badge-yellow'}`}>{d.status}</span></td>
                        <td>{formatDate(d.remittanceDate)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── AUDIT TRAIL ── */}
      {tab === 'audit' && (
        <div className="table-card">
          <div className="table-header">
            <span className="table-title">Audit Trail ({filteredLogs.length} entries)</span>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <input className="form-input" placeholder="Entity type…" value={entityFilter} onChange={e => setEntityFilter(e.target.value)} style={{ height: 32, width: 140 }} />
              <input className="form-input" type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} style={{ height: 32, width: 140 }} title="From date" />
              <input className="form-input" type="date" value={toDate} onChange={e => setToDate(e.target.value)} style={{ height: 32, width: 140 }} title="To date" />
              <button className="btn btn-primary" style={{ height: 32 }} onClick={loadAudit}>Search</button>
            </div>
          </div>
          <div style={{ padding: '8px 20px', borderBottom: '1px solid var(--card-border)' }}>
            <div className="topbar-search" style={{ height: 30 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-muted)' }}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input placeholder="Search action, entity, user…" value={auditSearch} onChange={e => { setAuditSearch(e.target.value); setAuditPage(1); }} style={{ width: 260 }} />
            </div>
          </div>
          {loading ? <div style={{padding:40}}><div className="spinner"/></div> : (
            <>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr><th>Timestamp</th><th>Action</th><th>Entity</th><th>Entity ID</th><th>Performed By</th></tr>
                  </thead>
                  <tbody>
                    {pagedLogs.length === 0
                      ? <tr><td colSpan={5} style={{textAlign:'center',padding:40,color:'var(--text-muted)'}}>No audit logs found. Actions taken in the system will appear here.</td></tr>
                      : pagedLogs.map((l, i) => (
                        <tr key={l.auditId || i}>
                          <td className="mono" style={{ fontSize: 11 }}>{formatDateTime(l.timestamp)}</td>
                          <td><span className={`badge ${l.action?.includes('Delete') ? 'badge-red' : l.action?.includes('Create') ? 'badge-green' : 'badge-blue'}`}>{l.action}</span></td>
                          <td>{l.entityType}</td>
                          <td className="mono" style={{ fontSize: 11 }}>{l.recordId?.slice(0, 8)}…</td>
                          <td className="bold">{l.userName}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
              {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 8, padding: '12px 20px', borderTop: '1px solid var(--card-border)' }}>
                  <button className="btn btn-sm btn-outline" disabled={auditPage === 1} onClick={() => setAuditPage(p => p - 1)}>← Prev</button>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Page {auditPage} of {totalPages}</span>
                  <button className="btn btn-sm btn-outline" disabled={auditPage === totalPages} onClick={() => setAuditPage(p => p + 1)}>Next →</button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
