import { useState, useEffect } from 'react';
import { getAllSubmissions } from '../apis/adminApi';

/* Normalize backend KYC status → display status
   Backend enum: not_started | documents_uploaded | under_review | approved | rejected */
function normalizeStatus(s) {
  if (!s) return 'Pending';
  const m = {
    not_started:        'Pending',
    documents_uploaded: 'In Review',
    under_review:       'In Review',
    approved:           'Approved',
    rejected:           'Failed',
  };
  return m[s] || s;
}

const tCfg = {
  kyc_request:  { bg:'#EFF6FF', e:'🔔' },
  kyc_approved: { bg:'#F0FDF4', e:'✅' },
  kyc_rejected: { bg:'#FEF2F2', e:'❌' },
  system:       { bg:'#FFFBEB', e:'⚠️' },
};

function buildNotifFromKYC(r, idx) {
  // Backend KYC fields: _id, userId: {name, mobile, email}, fullName, status, createdAt, rejectionReason
  const name   = r.fullName || r.userId?.name || 'Unknown';
  const status = normalizeStatus(r.status);
  let type, title, message;
  if (status === 'Approved') {
    type = 'kyc_approved';
    title = `KYC Approved — ${name}`;
    message = 'Identity verified successfully. Wallet activated.';
  } else if (status === 'Failed') {
    type = 'kyc_rejected';
    title = `KYC Rejected — ${name}`;
    message = r.rejectionReason || 'Documents did not meet verification criteria.';
  } else {
    type = 'kyc_request';
    title = `New KYC Submission — ${name}`;
    message = 'Submitted identity documents for review.';
  }
  const date = new Date(r.createdAt || Date.now());
  const now  = new Date();
  const diff = Math.floor((now - date) / 60000);
  let time;
  if (diff < 1)      time = 'Just now';
  else if (diff < 60) time = `${diff} min ago`;
  else if (diff < 1440) time = `${Math.floor(diff/60)} hr ago`;
  else time = date.toLocaleDateString('en-IN', { day:'2-digit', month:'short' });
  return { id: r._id || idx, type, title, message, time, read: status !== 'Pending', raw: r };
}

export default function Notifications() {
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]  = useState('All');

  useEffect(() => {
    // Backend response: { success, total, page, totalPages, kycs: [...] }
    getAllSubmissions()
      .then(res => {
        const arr = res.data?.kycs || [];
        const built = (Array.isArray(arr) ? arr : [])
          .sort((a,b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
          .map(buildNotifFromKYC);
        setNotifs(built);
      })
      .catch(()=>{})
      .finally(()=>setLoading(false));
  }, []);

  const unread  = notifs.filter(n=>!n.read).length;
  const markAll = () => setNotifs(p=>p.map(n=>({...n,read:true})));
  const markOne = id => setNotifs(p=>p.map(n=>n.id===id?{...n,read:true}:n));
  const del     = id => setNotifs(p=>p.filter(n=>n.id!==id));

  const filtered = notifs.filter(n => {
    if (filter==='Unread')  return !n.read;
    if (filter==='Read')    return n.read;
    if (filter==='KYC')     return n.type.startsWith('kyc');
    if (filter==='System')  return n.type==='system';
    return true;
  });

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-header-left"><h2>Notifications</h2><p>{loading ? '...' : `${unread} unread notification${unread!==1?'s':''}.`}</p></div>
        {unread>0 && <button className="btn btn-outline" onClick={markAll}>
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
          Mark All Read
        </button>}
      </div>

      <div className="notif-tabs">
        {['All','Unread','Read','KYC','System'].map(t=>(
          <button key={t} className={`ntab${filter===t?' act':''}`} onClick={()=>setFilter(t)}>
            {t}{t==='Unread'&&unread>0?` (${unread})`:''}
          </button>
        ))}
      </div>

      <div className="card">
        {loading ? (
          <div style={{ padding:'24px 20px', display:'flex', flexDirection:'column', gap:16 }}>
            {Array(5).fill(0).map((_,i)=>(
              <div key={i} style={{ display:'flex', alignItems:'center', gap:14 }}>
                <div style={{ width:44, height:44, borderRadius:10, background:'#E2E8F0', flexShrink:0 }}/>
                <div style={{ flex:1 }}>
                  <div style={{ width:'50%', height:13, borderRadius:4, background:'#E2E8F0', marginBottom:6 }}/>
                  <div style={{ width:'70%', height:10, borderRadius:4, background:'#EFF3F7' }}/>
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length===0 ? <div className="empty">No notifications here.</div> : (
          <div>
            {filtered.map(n => {
              const c = tCfg[n.type] || tCfg.system;
              return (
                <div key={n.id} className={`notif-item${!n.read?' unread':''}`} onClick={()=>markOne(n.id)}>
                  <div className="notif-icon" style={{ background:c.bg }}>{c.e}</div>
                  <div style={{ flex:1 }}>
                    <div className="notif-title">{n.title}</div>
                    <div className="notif-msg">{n.message}</div>
                    <div className="notif-time">{n.time}</div>
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
                    {!n.read && <div className="unread-dot"/>}
                    <button className="btn btn-ghost icon-btn" style={{ width:28, height:28 }} onClick={e=>{e.stopPropagation();del(n.id);}}>
                      <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
