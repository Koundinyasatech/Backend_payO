import { useState, useEffect } from 'react';
import { getDashboardStats, getAllSubmissions } from '../apis/adminApi';

function Skeleton({ w='100%', h=16, radius=6, style={} }) {
  return <div style={{ width:w, height:h, borderRadius:radius, background:'linear-gradient(90deg,var(--skeleton-a,#E2E8F0) 25%,var(--skeleton-b,#F1F5F9) 50%,var(--skeleton-a,#E2E8F0) 75%)', backgroundSize:'200% 100%', animation:'shimmer 1.4s infinite', ...style }}/>;
}

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

export default function Analytics() {
  const [stats, setStats]       = useState(null);
  const [allKyc, setAllKyc]     = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([
      getDashboardStats(),
      getAllSubmissions(),
    ]).then(([sRes, kRes]) => {
      // Backend stats response: { success, stats: {...} }
      const s = sRes.data?.stats || {};
      setStats(s);
      // Backend submissions response: { success, total, page, totalPages, kycs: [...] }
      const arr = kRes.data?.kycs || [];
      setAllKyc(Array.isArray(arr) ? arr : []);
    }).catch(()=>{}).finally(()=>setLoading(false));
  }, []);

  // Backend stats field names: totalSubmissions, notStarted, docsUploaded, underReview, approved, rejected
  const approved  = stats?.approved  || 0;
  const pending   = (stats?.underReview || 0) + (stats?.docsUploaded || 0) + (stats?.notStarted || 0);
  const rejected  = stats?.rejected  || 0;
  const total     = stats?.totalSubmissions || (approved + pending + rejected) || 1;
  const successRate = ((approved / total) * 100).toFixed(1);
  const rejRate     = ((rejected / total) * 100).toFixed(1);

  // Build monthly data from all submissions (backend field: createdAt)
  const monthlyMap = {};
  allKyc.forEach(r => {
    const date = new Date(r.createdAt || Date.now());
    const key  = date.toLocaleString('en-IN', { month:'short' });
    if (!monthlyMap[key]) monthlyMap[key] = { approved:0, pending:0, rejected:0 };
    const st = normalizeStatus(r.status);
    if (st==='Approved') monthlyMap[key].approved++;
    else if (st==='Pending'||st==='In Review') monthlyMap[key].pending++;
    else monthlyMap[key].rejected++;
  });
  const monthOrder = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const monthlyData = monthOrder.filter(m=>monthlyMap[m]).map(m=>({ month:m, ...monthlyMap[m] }));
  const MAX = Math.max(...(monthlyData.length ? monthlyData.map(d=>d.approved+d.pending+d.rejected) : [1]));
  const H = 160;

  const kpis = [
    { label:'Success Rate',        value: loading ? '—' : `${successRate}%`,   change:`vs all time`, up:true,  e:'✅', bg:'#F0FDF4' },
    { label:'Rejection Rate',      value: loading ? '—' : `${rejRate}%`,       change:`vs all time`, up:false, e:'❌', bg:'#FEF2F2' },
    { label:'Pending Review',      value: loading ? '—' : pending.toLocaleString(), change:'awaiting action', up:true, e:'⏱️', bg:'#EFF6FF' },
    { label:'Total Submissions',   value: loading ? '—' : total.toLocaleString(),   change:'all time',        up:true, e:'📋', bg:'#FFF7ED' },
  ];

  const dist = [
    { label:'Approved',  value:approved, total, c:'#10B981', bg:'#F0FDF4' },
    { label:'Pending',   value:pending,  total, c:'#F59E0B', bg:'#FFFBEB' },
    { label:'Failed',    value:rejected, total, c:'#EF4444', bg:'#FEF2F2' },
  ];

  return (
    <div className="page">
      <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
      <div className="page-header"><div className="page-header-left"><h2>Analytics</h2><p>KYC performance metrics and trends.</p></div></div>

      <div className="stats-row" style={{ marginBottom:22 }}>
        {kpis.map(k=>(
          <div className="stat-card" key={k.label}>
            <div className="stat-top">
              <div>
                <div className="stat-label">{k.label}</div>
                {loading ? <Skeleton w={80} h={24} radius={6} style={{ marginTop:6, marginBottom:4 }}/> : <div className="stat-value" style={{ fontSize:20 }}>{k.value}</div>}
                <div className={`stat-change ${k.up?'up':'down'}`} style={{ fontSize:11 }}>{k.change}</div>
              </div>
              <div className="stat-icon" style={{ background:k.bg, fontSize:21 }}>{k.e}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="analytics-grid">
        {/* Bar chart */}
        <div className="chart-card">
          <h3>Monthly KYC Submissions</h3>
          {loading ? (
            <div style={{ display:'flex', alignItems:'flex-end', gap:10, height:H, padding:'0 10px', marginTop:16 }}>
              {Array(6).fill(0).map((_,i)=><Skeleton key={i} w={40} h={Math.random()*H*0.8+H*0.2} radius={6} style={{ flexShrink:0 }}/>)}
            </div>
          ) : monthlyData.length === 0 ? (
            <div className="empty" style={{ marginTop:16 }}>No monthly data available yet.</div>
          ) : (
            <>
              <div className="bar-wrap">
                {monthlyData.map(d=>{
                  const ah=Math.round((d.approved/MAX)*H);
                  const ph=Math.round((d.pending/MAX)*H);
                  const rh=Math.round((d.rejected/MAX)*H);
                  return (
                    <div className="bar-group" key={d.month}>
                      <div className="bar-stack">
                        <div className="bar-seg" style={{ height:ah, background:'#10B981' }} title={`Approved: ${d.approved}`}/>
                        <div className="bar-seg" style={{ height:ph, background:'#F59E0B' }} title={`Pending: ${d.pending}`}/>
                        <div className="bar-seg" style={{ height:rh, background:'#EF4444' }} title={`Rejected: ${d.rejected}`}/>
                      </div>
                      <div className="bar-label">{d.month}</div>
                    </div>
                  );
                })}
              </div>
              <div style={{ display:'flex', gap:14, marginTop:12, justifyContent:'center' }}>
                {[['#10B981','Approved'],['#F59E0B','Pending'],['#EF4444','Rejected']].map(([c,l])=>(
                  <div key={l} style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, color:'var(--gray-600)' }}>
                    <div style={{ width:10, height:10, borderRadius:3, background:c }}/>{l}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Status distribution */}
        <div className="chart-card">
          <h3>Status Distribution</h3>
          <div style={{ display:'flex', flexDirection:'column', gap:14, marginTop:16 }}>
            {dist.map(d=>{
              const pct = d.total > 0 ? ((d.value/d.total)*100).toFixed(1) : '0.0';
              return (
                <div key={d.label}>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, fontWeight:600, color:'var(--navy)', marginBottom:6 }}>
                    <span>{d.label}</span>
                    <span>{loading ? '—' : `${d.value.toLocaleString()} (${pct}%)`}</span>
                  </div>
                  <div style={{ height:8, background:'var(--gray-100)', borderRadius:20, overflow:'hidden' }}>
                    {!loading && <div style={{ height:'100%', width:`${pct}%`, background:d.c, borderRadius:20, transition:'width 0.6s ease' }}/>}
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop:28, padding:'16px', background:'var(--gray-50,#F8FAFC)', borderRadius:12, border:'1px solid var(--gray-200)' }}>
            <div style={{ fontSize:11, fontWeight:700, color:'var(--gray-400)', textTransform:'uppercase', letterSpacing:'0.7px', marginBottom:12 }}>Summary</div>
            {[
              ['Total Users Submitted', total.toLocaleString()],
              ['KYC Approved', `${approved.toLocaleString()} (${successRate}%)`],
              ['KYC Rejected', `${rejected.toLocaleString()} (${rejRate}%)`],
              ['Currently Pending', pending.toLocaleString()],
            ].map(([l,v])=>(
              <div key={l} style={{ display:'flex', justifyContent:'space-between', fontSize:13, padding:'6px 0', borderBottom:'1px solid var(--gray-100)' }}>
                <span style={{ color:'var(--gray-600)' }}>{l}</span>
                <span style={{ fontWeight:700, color:'var(--navy)' }}>{loading?'—':v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
