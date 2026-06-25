import { useState, useEffect } from 'react';
import { getAuditLog } from '../apis/adminApi';

function Skeleton({ w='100%', h=16, radius=6, style={} }) {
  return <div style={{ width:w, height:h, borderRadius:radius, background:'linear-gradient(90deg,var(--skeleton-a,#E2E8F0) 25%,var(--skeleton-b,#F1F5F9) 50%,var(--skeleton-a,#E2E8F0) 75%)', backgroundSize:'200% 100%', animation:'shimmer 1.4s infinite', ...style }}/>;
}

const cfg = { approve:{bg:'#F0FDF4',e:'✅', actionText:'KYC Approved'}, reject:{bg:'#FEF2F2',e:'❌', actionText:'KYC Rejected'}, info:{bg:'#EFF6FF',e:'ℹ️', actionText:'KYC Updated'} };

/* Backend audit log item shape:
   { _id, status, rejectionReason, reviewedBy: {name, email} | null,
     reviewedAt, submissionCount, userId: {_id, name, mobile, email} } */
function getLogType(log) {
  const status = (log.status || '').toLowerCase();
  if (status === 'approved') return 'approve';
  if (status === 'rejected') return 'reject';
  return 'info';
}

export default function AuditLog() {
  const [logs, setLogs]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState('');
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');

  useEffect(() => {
    // Backend response: { success, total, page, totalPages, logs: [...] }
    getAuditLog()
      .then(res => {
        const arr = res.data?.logs || [];
        setLogs(Array.isArray(arr) ? arr : []);
      })
      .catch(() => setError('Failed to load audit log'))
      .finally(() => setLoading(false));
  }, []);

  const enriched = logs.map(l => ({ ...l, _type: getLogType(l) }));

  const counts = {
    All:     enriched.length,
    approve: enriched.filter(l=>l._type==='approve').length,
    reject:  enriched.filter(l=>l._type==='reject').length,
    info:    enriched.filter(l=>l._type==='info').length,
  };

  const filtered = enriched.filter(l => {
    const mf = filter==='All' || l._type===filter;
    const userName  = l.userId?.name   || '';
    const userMob   = l.userId?.mobile || '';
    const userEmail = l.userId?.email  || '';
    const admin     = l.reviewedBy?.name || l.reviewedBy?.email || 'Super Admin';
    const reason    = l.rejectionReason || '';
    const q = search.toLowerCase();
    const ms = !search
      || userName.toLowerCase().includes(q)
      || userMob.toLowerCase().includes(q)
      || userEmail.toLowerCase().includes(q)
      || admin.toLowerCase().includes(q)
      || reason.toLowerCase().includes(q);
    return mf && ms;
  });

  return (
    <div className="page">
      <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
      <div className="page-header">
        <div className="page-header-left"><h2>Audit Log</h2><p>Complete history of all admin actions and system events.</p></div>
        <button className="btn btn-outline" onClick={()=>window.print()}>
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
          Export
        </button>
      </div>

      <div className="chip-row">
        {[['All',counts.All],['approve',counts.approve],['reject',counts.reject],['info',counts.info]].map(([f,c])=>(
          <div key={f} className={`chip${filter===f?' act':''}`} onClick={()=>setFilter(f)}>
            {f==='All'?'📋':cfg[f]?.e} {f==='All'?'All':f[0].toUpperCase()+f.slice(1)}<span className="chip-count">{c}</span>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="filter-bar">
          <div className="search-field">
            <svg width="14" height="14" fill="none" stroke="var(--gray-400)" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input placeholder="Search by user, admin, or reason..." value={search} onChange={e=>setSearch(e.target.value)}/>
          </div>
          <div className="filter-count">{filtered.length} records</div>
        </div>

        {error && <div style={{ padding:'16px 20px', color:'#DC2626', fontSize:13 }}>⚠️ {error}</div>}

        <div>
          {loading
            ? Array(6).fill(0).map((_,i)=>(
                <div key={i} className="audit-item">
                  <Skeleton w={36} h={36} radius={10}/>
                  <div style={{ flex:1 }}><Skeleton w="60%" h={14} radius={4} style={{ marginBottom:6 }}/><Skeleton w="80%" h={10} radius={4}/></div>
                  <Skeleton w={80} h={10} radius={4}/>
                </div>
              ))
            : filtered.map((log) => {
                const c = cfg[log._type] || cfg.info;
                const action    = c.actionText;
                const userName  = log.userId?.name   || '—';
                const userMob   = log.userId?.mobile ? ` (${log.userId.mobile})` : '';
                const admin     = log.reviewedBy?.name || log.reviewedBy?.email || 'Super Admin';
                const reason    = log.rejectionReason || '';
                const timestamp = log.reviewedAt || '';
                const timeFormatted = timestamp ? new Date(timestamp).toLocaleString('en-IN', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' }) : '—';
                return (
                  <div className="audit-item" key={log._id || Math.random()}>
                    <div className="audit-icon" style={{ background:c.bg }}>{c.e}</div>
                    <div style={{ flex:1 }}>
                      <div className="audit-act">{action}</div>
                      <div className="audit-meta">User: <strong>{userName}{userMob}</strong> · Admin: <strong>{admin}</strong>{reason ? ` · Reason: ${reason}` : ''}</div>
                    </div>
                    <div className="audit-time">{timeFormatted}</div>
                  </div>
                );
              })
          }
          {!loading && filtered.length===0 && <div className="empty">No audit records found.</div>}
        </div>
      </div>
    </div>
  );
}
