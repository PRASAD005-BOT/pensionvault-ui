import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context.jsx';
import api from '../api.js';

const titles = {
  '/': 'Dashboard',
  '/members': 'Members',
  '/employers': 'Employers',
  '/claims': 'Claims',
  '/remittances': 'Remittances',
  '/ledger': 'Ledger',
  '/schemes': 'Fund Schemes',
  '/investments': 'Investments',
  '/annuity': 'Annuity',
  '/reports': 'Reports',
  '/notifications': 'Notifications',
};

export default function Topbar({ isCollapsed, setIsCollapsed, isMobileOpen, setIsMobileOpen }) {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const title = titles[pathname] || 'PensionVault';
  const initials = user?.name?.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase() || 'PV';

  const [unreadCount, setUnreadCount] = useState(0);
  useEffect(() => {
    if (user) {
      api.get('/api/notifications').then(r => {
        setUnreadCount(r.data.filter(n => n.status === 'Unread').length);
      }).catch(()=>{});
    }
  }, [user, pathname]);

  return (
    <header className="topbar">
      <button className="mobile-menu-btn" onClick={() => setIsMobileOpen(true)} aria-label="Open Menu">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
      </button>

      <span className="topbar-title">{title}</span>

      <div className="topbar-search">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{color:'var(--text-muted)'}}>
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input placeholder="Search..." />
      </div>

      <button className="icon-btn" title="Notifications" onClick={() => window.location.href='/notifications'} style={{ position: 'relative' }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        {unreadCount > 0 && (
          <span className="notif-dot" style={{ position: 'absolute', top: 2, right: 2, width: 14, height: 14, background: 'var(--danger)', color: '#fff', fontSize: 9, fontWeight: 700, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <div style={{ display:'flex', alignItems:'center', gap:8, padding:'4px 10px', background:'var(--input-bg)', border:'1px solid var(--input-border)', borderRadius:'var(--radius-md)', cursor:'default' }}>
        <div className="avatar" style={{width:22,height:22,fontSize:9}}>{initials}</div>
        <span style={{fontSize:12,fontWeight:600,color:'var(--text-primary)'}}>{user?.name}</span>
        <span style={{fontSize:11,color:'var(--text-muted)',background:'var(--card-border)',padding:'1px 6px',borderRadius:3}}>{user?.role}</span>
      </div>
    </header>
  );
}
