import React, { useEffect, useState } from 'react';
import api, { formatINR, formatDate } from '../api.js';
import { useAuth } from '../context.jsx';

export default function Ledger() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');

  const { user } = useAuth();

  useEffect(() => {
    const fetchLedger = async () => {
      try {
        if (user?.role === 'Member') {
          const me = await api.get('/api/members/me');
          if (me.data && me.data.memberId) {
            const res = await api.get(`/api/members/${me.data.memberId}/ledger`);
            setEntries(res.data);
          }
        } else {
          const res = await api.get('/api/ledger');
          setEntries(res.data);
        }
      } catch (err) {}
      setLoading(false);
    };
    fetchLedger();
  }, [user]);

  const mappedEntries = entries.map(e => {
    const isCredit = String(e.entryType).includes('Credit');
    const typeStr = isCredit ? 'Credit' : 'Debit';
    const desc = String(e.entryType).replace(/([A-Z])/g, ' $1').trim() + ' (Ref: ' + (e.referenceId || 'N/A') + ')';
    return {
      entryId: e.entryId,
      transactionDate: e.entryDate,
      entryType: typeStr,
      description: desc,
      amount: e.amount,
      balance: e.balanceAfter
    };
  });

  const filtered = mappedEntries.filter(e =>
    e.description?.toLowerCase().includes(search.toLowerCase()) ||
    e.entryType?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page-body">
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-title">General Ledger</div>
          <div className="page-desc">All fund transactions and audit trail</div>
        </div>
      </div>
      <div className="table-card">
        <div className="table-header">
          <span className="table-title">Ledger Entries ({filtered.length})</span>
          <div className="topbar-search" style={{height:30}}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{color:'var(--text-muted)'}}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} style={{width:180}} />
          </div>
        </div>
        {loading ? <div style={{padding:40}}><div className="spinner"/></div> : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Date</th><th>Type</th><th>Description</th><th style={{textAlign:'right'}}>Debit (₹)</th><th style={{textAlign:'right'}}>Credit (₹)</th><th style={{textAlign:'right'}}>Balance (₹)</th></tr></thead>
              <tbody>
                {filtered.length === 0
                  ? <tr><td colSpan={6} style={{textAlign:'center',padding:40,color:'var(--text-muted)'}}>No entries found</td></tr>
                  : filtered.map((e,i) => (
                  <tr key={e.entryId || i}>
                    <td>{formatDate(e.transactionDate)}</td>
                    <td><span className={`badge ${e.entryType==='Credit'?'badge-green':'badge-red'}`}>{e.entryType}</span></td>
                    <td>{e.description}</td>
                    <td style={{textAlign:'right'}} className="amount amount-negative">{e.entryType==='Debit' ? formatINR(e.amount) : '—'}</td>
                    <td style={{textAlign:'right'}} className="amount amount-positive">{e.entryType==='Credit' ? formatINR(e.amount) : '—'}</td>
                    <td style={{textAlign:'right'}} className="amount bold">{formatINR(e.balance || 0)}</td>
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
