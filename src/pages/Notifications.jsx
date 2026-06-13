import React, { useEffect, useState } from 'react';
import api, { formatDateTime } from '../api.js';

export default function Notifications() {
  const [notifs, setNotifs]   = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.get('/api/notifications').then(r => setNotifs(r.data)).catch(()=>{}).finally(()=>setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const markRead = async (id) => {
    try { await api.put(`/api/notifications/${id}/read`); load(); } catch {}
  };
  const markAll = async () => {
    try { await api.put('/api/notifications/read-all'); load(); } catch {}
  };

  const unread = notifs.filter(n => n.status === 'Unread').length;

  const typeIcon = (type) => {
    const icons = {
      ClaimSubmitted: '📋', ClaimApproved: '✅', ClaimRejected: '❌', ClaimDisbursed: '💰',
      MemberEnrolled: '👤', RemittanceReceived: '💳', ReconciliationDone: '🔄',
    };
    return icons[type] || '🔔';
  };

  return (
    <div className="page-body">
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-title">Notifications</div>
          <div className="page-desc">{unread} unread notification{unread !== 1 ? 's' : ''}</div>
        </div>
        {unread > 0 && (
          <button className="btn btn-outline" onClick={markAll}>
            Mark all as read
          </button>
        )}
      </div>

      <div className="table-card p-0">
        {loading ? <div style={{padding:60}}><div className="spinner"/></div> : (
          notifs.length === 0 ? (
            <div className="empty-state">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
              <p>No notifications</p>
            </div>
          ) : (
            <div className="notif-list">
              {notifs.map(n => (
                <div key={n.notificationId} className={`notif-item${n.status === 'Read' ? ' read' : ' unread'}`}>
                  <span className="notif-dot-ind" />
                  <span style={{fontSize:18,flexShrink:0}}>{typeIcon(n.category)}</span>
                  <div style={{flex:1,minWidth:0}}>
                    <div className="notif-msg">{n.message}</div>
                    <div className="notif-time">{formatDateTime(n.createdDate)}</div>
                    {n.status === 'Unread' && (
                      <div className="notif-actions">
                        <button className="btn btn-sm btn-outline" onClick={() => markRead(n.notificationId)}>Mark read</button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}
