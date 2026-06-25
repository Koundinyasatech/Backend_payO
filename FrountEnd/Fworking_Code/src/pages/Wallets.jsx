// import { useState, useEffect, useContext } from 'react';
// import { AppCtx } from '../App';
// import { getAllSubmissions } from '../apis/adminApi';

// function Skeleton({ w='100%', h=16, radius=6, style={} }) {
//   return <div style={{ width:w, height:h, borderRadius:radius, background:'linear-gradient(90deg,var(--skeleton-a,#E2E8F0) 25%,var(--skeleton-b,#F1F5F9) 50%,var(--skeleton-a,#E2E8F0) 75%)', backgroundSize:'200% 100%', animation:'shimmer 1.4s infinite', ...style }}/>;
// }

// const COLORS = ['#6C63FF','#FF6584','#43E97B','#FA8231','#E74C3C','#3498DB','#9B59B6','#1ABC9C'];
// function getInitials(name) { if (!name) return '?'; return name.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2); }

// /* Normalize backend KYC status → display status
//    Backend enum: not_started | documents_uploaded | under_review | approved | rejected */
// function normalizeStatus(s) {
//   if (!s) return 'Pending';
//   const m = {
//     not_started:        'Pending',
//     documents_uploaded: 'In Review',
//     under_review:       'In Review',
//     approved:           'Approved',
//     rejected:           'Failed',
//   };
//   return m[s] || s;
// }

// function WalletModal({ w, onClose, onToggle }) {
//   if (!w) return null;
//   const isActive = w.status === 'Active';
//   return (
//     <div className="overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
//       <div className="modal" style={{ maxWidth:520 }}>
//         <div className="modal-head">
//           <div style={{ display:'flex', alignItems:'center', gap:12 }}>
//             <div className="avatar" style={{ background:w.color, width:42, height:42, borderRadius:11, fontSize:15 }}>{w.initials}</div>
//             <div><h3>{w.user}</h3><div style={{ fontSize:12, color:'var(--gray-400)', marginTop:1 }}>{String(w.userId).slice(-12)}</div></div>
//           </div>
//           <button className="btn btn-ghost icon-btn" onClick={onClose}>
//             <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
//           </button>
//         </div>
//         <div className="modal-body">
//           <div style={{ background:isActive?'linear-gradient(135deg,#0D1B3E,#1E3A6E)':'linear-gradient(135deg,#374151,#4B5563)', borderRadius:14, padding:'22px 24px', marginBottom:20, color:'#fff', position:'relative', overflow:'hidden' }}>
//             <div style={{ position:'absolute', top:-20, right:-20, width:100, height:100, borderRadius:'50%', background:'rgba(255,255,255,0.05)' }}/>
//             <div style={{ fontSize:11, fontWeight:600, opacity:0.6, letterSpacing:'1px', textTransform:'uppercase', marginBottom:6 }}>PYO Token Balance</div>
//             <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:32, fontWeight:700, letterSpacing:'-1px' }}>
//               {w.tokens.toLocaleString()} <span style={{ fontSize:18, opacity:0.7 }}>PYO</span>
//             </div>
//             <div style={{ display:'flex', justifyContent:'space-between', marginTop:16, opacity:0.65, fontSize:12 }}>
//               <span>KYC: {w.kycStatus}</span>
//               <span style={{ background:isActive?'rgba(16,185,129,0.25)':'rgba(239,68,68,0.25)', padding:'2px 10px', borderRadius:20, color:isActive?'#6EE7B7':'#FCA5A5', fontWeight:600 }}>
//                 {isActive ? '● Active' : '● Deactivated'}
//               </span>
//             </div>
//           </div>
//           <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:20 }}>
//             {[['Email', w.email||'—'],['Mobile', w.mobile||'—']].map(([l,v])=>(
//               <div key={l} style={{ background:'var(--gray-100)', borderRadius:10, padding:'12px' }}>
//                 <div style={{ fontSize:10.5, color:'var(--gray-400)', fontWeight:600, marginBottom:3 }}>{l}</div>
//                 <div style={{ fontSize:12.5, fontWeight:600, color:'var(--navy)', wordBreak:'break-all' }}>{v}</div>
//               </div>
//             ))}
//           </div>
//         </div>
//         <div className="modal-foot">
//           <button className="btn btn-outline" onClick={onClose}>Close</button>
//           <button className={`btn ${isActive?'btn-danger':'btn-success'}`} onClick={()=>{onToggle(w.userId);onClose();}}>
//             {isActive ? '🔒 Deactivate Wallet' : '🔓 Activate Wallet'}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default function Wallets() {
//   const { confirm } = useContext(AppCtx);
//   const [wallets, setWallets] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [sel, setSel]         = useState(null);
//   const [tab, setTab]         = useState('active');
//   const [search, setSearch]   = useState('');

//   // Backend has no /api/admin/wallets endpoint. Derive wallet view from KYC submissions.
//   // Wallet is "Active" only for users with kycStatus === Approved (backend sets walletActivated:true on approve).
//   // Token balance comes from the Wallet model, but isn't currently exposed via an admin endpoint —
//   // shown as 0 until backend exposes it.
//   useEffect(() => {
//     getAllSubmissions()
//       .then(res => {
//         const arr = res.data?.kycs || [];
//         const mapped = (Array.isArray(arr) ? arr : []).map((r, idx) => {
//           const name      = r.fullName || r.userId?.name || 'Unknown';
//           const kycStatus = normalizeStatus(r.status);
//           const isActive  = kycStatus === 'Approved';
//           return {
//             userId:    r.userId?._id || r._id || String(idx),
//             user:      name,
//             initials:  getInitials(name),
//             color:     COLORS[idx % COLORS.length],
//             kycStatus,
//             status:    isActive ? 'Active' : 'Deactivated',
//             tokens:    0,  // Backend doesn't expose wallet balance via admin API yet
//             email:     r.userId?.email  || '—',
//             mobile:    r.userId?.mobile || '—',
//           };
//         });
//         setWallets(mapped);
//       })
//       .catch(()=>{})
//       .finally(()=>setLoading(false));
//   }, []);

//   // Local-only toggle (backend has no admin wallet toggle endpoint yet)
//   const toggle = (userId) => {
//     const wallet  = wallets.find(w => w.userId === userId);
//     const isActive = wallet?.status === 'Active';
//     confirm({
//       title: isActive ? 'Deactivate Wallet' : 'Activate Wallet',
//       message: isActive
//         ? `Are you sure you want to deactivate ${wallet?.user}'s wallet?`
//         : `Activate ${wallet?.user}'s wallet? They will be able to transact PYO tokens.`,
//       confirmLabel: isActive ? '🔒 Yes, Deactivate' : '🔓 Yes, Activate',
//       cancelLabel: 'Cancel',
//       type: isActive ? 'danger' : 'success',
//     }, () => {
//       setWallets(p => p.map(w => w.userId===userId ? {...w, status: w.status==='Active'?'Deactivated':'Active'} : w));
//     });
//   };

//   const active      = wallets.filter(w=>w.status==='Active');
//   const deactivated = wallets.filter(w=>w.status==='Deactivated');
//   const list = (tab==='active' ? active : deactivated).filter(w => {
//     const q = search.toLowerCase();
//     return !search
//       || w.user.toLowerCase().includes(q)
//       || String(w.userId).toLowerCase().includes(q)
//       || w.email.toLowerCase().includes(q)
//       || w.mobile.toLowerCase().includes(q);
//   });

//   return (
//     <div className="page">
//       <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
//       <div className="page-header">
//         <div className="page-header-left"><h2>Wallets</h2><p>Monitor PayO token wallets and user activity.</p></div>
//       </div>

//       <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16, marginBottom:22 }}>
//         {[
//           { label:'Active Wallets',      value:active.length,      bg:'#F0FDF4', e:'✅', color:'#059669' },
//           { label:'Deactivated Wallets', value:deactivated.length, bg:'#FEF2F2', e:'🔒', color:'#DC2626' },
//           { label:'Total Users',         value:wallets.length,     bg:'#EFF6FF', e:'👥', color:'#2563EB' },
//         ].map(s=>(
//           <div className="stat-card" key={s.label}>
//             <div className="stat-top">
//               <div>
//                 <div className="stat-label">{s.label}</div>
//                 <div className="stat-value" style={{ fontSize:26 }}>{loading ? '—' : s.value}</div>
//               </div>
//               <div className="stat-icon" style={{ background:s.bg, fontSize:22 }}>{s.e}</div>
//             </div>
//           </div>
//         ))}
//       </div>

//       <div className="card">
//         <div style={{ display:'flex', gap:0, borderBottom:'1px solid var(--gray-200)' }}>
//           {[['active','Active','#059669'],['deactivated','Deactivated','#DC2626']].map(([k,l,c])=>(
//             <button key={k} onClick={()=>setTab(k)} style={{ padding:'13px 20px', border:'none', background:'none', cursor:'pointer', fontFamily:'Inter,sans-serif', fontSize:13.5, fontWeight:tab===k?600:500, color:tab===k?c:'var(--gray-400)', borderBottom:tab===k?`2px solid ${c}`:'2px solid transparent', transition:'all 0.18s' }}>
//               {l} &nbsp;<span style={{ background:tab===k?c+'22':'var(--gray-100)', color:tab===k?c:'var(--gray-400)', borderRadius:20, padding:'1px 7px', fontSize:11, fontWeight:700 }}>
//                 {k==='active'?active.length:deactivated.length}
//               </span>
//             </button>
//           ))}
//           <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'flex-end', padding:'0 14px' }}>
//             <div className="search-field" style={{ maxWidth:200 }}>
//               <svg width="13" height="13" fill="none" stroke="var(--gray-400)" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
//               <input placeholder="Search..." value={search} onChange={e=>setSearch(e.target.value)}/>
//             </div>
//           </div>
//         </div>

//         <div className="table-wrap">
//           <table>
//             <thead><tr><th>User</th><th>User ID</th><th>KYC Status</th><th>Token Balance</th><th>Actions</th></tr></thead>
//             <tbody>
//               {loading
//                 ? Array(5).fill(0).map((_,i)=>(
//                     <tr key={i}>
//                       <td><div style={{ display:'flex', alignItems:'center', gap:10 }}><Skeleton w={34} h={34} radius={8}/><Skeleton w={100} h={12} radius={4}/></div></td>
//                       <td><Skeleton w={100} h={12} radius={4}/></td>
//                       <td><Skeleton w={70} h={22} radius={20}/></td>
//                       <td><Skeleton w={80} h={14} radius={4}/></td>
//                       <td><div style={{ display:'flex', gap:6 }}><Skeleton w={50} h={28} radius={8}/><Skeleton w={80} h={28} radius={8}/></div></td>
//                     </tr>
//                   ))
//                 : list.map(w=>(
//                     <tr key={w.userId}>
//                       <td>
//                         <div className="user-cell">
//                           <div className="avatar" style={{ background:w.color }}>{w.initials}</div>
//                           <div><div className="uname">{w.user}</div><div className="uid">{w.email}</div></div>
//                         </div>
//                       </td>
//                       <td style={{ fontSize:12.5, color:'var(--gray-600)', fontFamily:'monospace' }}>{String(w.userId).slice(-14)}</td>
//                       <td>
//                         <span className={`badge ${w.kycStatus==='Approved'?'b-approved':w.kycStatus==='Failed'?'b-failed':'b-pending'}`}>{w.kycStatus}</span>
//                       </td>
//                       <td>
//                         <div style={{ display:'flex', alignItems:'center', gap:6 }}>
//                           <span style={{ fontWeight:700, fontSize:15, color:w.tokens>0?'var(--navy)':'var(--gray-400)' }}>{w.tokens.toLocaleString()}</span>
//                           <span style={{ fontSize:11, fontWeight:600, color:'var(--gray-400)', background:'var(--gray-100)', padding:'1px 6px', borderRadius:6 }}>PYO</span>
//                         </div>
//                       </td>
//                       <td>
//                         <div className="act-group">
//                           <button className="btn btn-outline" style={{ fontSize:12, padding:'5px 11px' }} onClick={()=>setSel(w)}>View</button>
//                           <button className={`btn ${w.status==='Active'?'btn-danger':'btn-success'}`} style={{ fontSize:12, padding:'5px 11px' }} onClick={()=>toggle(w.userId)}>
//                             {w.status==='Active'?'🔒 Deactivate':'🔓 Activate'}
//                           </button>
//                         </div>
//                       </td>
//                     </tr>
//                   ))
//               }
//             </tbody>
//           </table>
//           {!loading && list.length===0 && <div className="empty">No {tab} wallets found.</div>}
//         </div>
//       </div>

//       {sel && <WalletModal w={sel} onClose={()=>setSel(null)} onToggle={toggle}/>}
//     </div>
//   );
// }





import { useState, useEffect, useContext } from 'react';
import { AppCtx } from '../App';
import { getAllSubmissions } from '../apis/adminApi';

function Skeleton({ w='100%', h=16, radius=6, style={} }) {
  return <div style={{ width:w, height:h, borderRadius:radius, background:'linear-gradient(90deg,var(--skeleton-a,#E2E8F0) 25%,var(--skeleton-b,#F1F5F9) 50%,var(--skeleton-a,#E2E8F0) 75%)', backgroundSize:'200% 100%', animation:'shimmer 1.4s infinite', ...style }}/>;
}

const COLORS = ['#6C63FF','#FF6584','#43E97B','#FA8231','#E74C3C','#3498DB','#9B59B6','#1ABC9C'];
function getInitials(name) { if (!name) return '?'; return name.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2); }

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

function WalletModal({ w, onClose, onToggle }) {
  if (!w) return null;
  const isActive = w.status === 'Active';
  return (
    <div className="overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal" style={{ maxWidth:520 }}>
        <div className="modal-head">
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div className="avatar" style={{ background:w.color, width:42, height:42, borderRadius:11, fontSize:15 }}>{w.initials}</div>
            <div><h3>{w.user}</h3><div style={{ fontSize:12, color:'var(--gray-400)', marginTop:1 }}>{String(w.userId).slice(-12)}</div></div>
          </div>
          <button className="btn btn-ghost icon-btn" onClick={onClose}>
            <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div className="modal-body">
          <div style={{ background:isActive?'linear-gradient(135deg,#0D1B3E,#1E3A6E)':'linear-gradient(135deg,#374151,#4B5563)', borderRadius:14, padding:'22px 24px', marginBottom:20, color:'#fff', position:'relative', overflow:'hidden' }}>
            <div style={{ position:'absolute', top:-20, right:-20, width:100, height:100, borderRadius:'50%', background:'rgba(255,255,255,0.05)' }}/>
            <div style={{ fontSize:11, fontWeight:600, opacity:0.6, letterSpacing:'1px', textTransform:'uppercase', marginBottom:6 }}>PYO Token Balance</div>
            <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:32, fontWeight:700, letterSpacing:'-1px' }}>
              {w.tokens.toLocaleString()} <span style={{ fontSize:18, opacity:0.7 }}>PYO</span>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', marginTop:16, opacity:0.65, fontSize:12 }}>
              <span>KYC: {w.kycStatus}</span>
              <span style={{ background:isActive?'rgba(16,185,129,0.25)':'rgba(239,68,68,0.25)', padding:'2px 10px', borderRadius:20, color:isActive?'#6EE7B7':'#FCA5A5', fontWeight:600 }}>
                {isActive ? '● Active' : '● Deactivated'}
              </span>
            </div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:20 }}>
            {[['Email', w.email||'—'],['Mobile', w.mobile||'—']].map(([l,v])=>(
              <div key={l} style={{ background:'var(--gray-100)', borderRadius:10, padding:'12px' }}>
                <div style={{ fontSize:10.5, color:'var(--gray-400)', fontWeight:600, marginBottom:3 }}>{l}</div>
                <div style={{ fontSize:12.5, fontWeight:600, color:'var(--navy)', wordBreak:'break-all' }}>{v}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="modal-foot">
          <button className="btn btn-outline" onClick={onClose}>Close</button>
          <button className={`btn ${isActive?'btn-danger':'btn-success'}`} onClick={()=>{onToggle(w.userId);onClose();}}>
            {isActive ? '🔒 Deactivate Wallet' : '🔓 Activate Wallet'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Wallets() {
  const { confirm } = useContext(AppCtx);
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sel, setSel]         = useState(null);
  const [tab, setTab]         = useState('active');
  const [search, setSearch]   = useState('');

  useEffect(() => {
    setLoading(true);
    getAllSubmissions()
      .then(async (res) => {
        const arr = res.data?.kycs || [];
        const mapped = (Array.isArray(arr) ? arr : []).map((r, idx) => {
          const name      = r.fullName || r.userId?.name || 'Unknown';
          const kycStatus = normalizeStatus(r.status);
          const isActive  = kycStatus === 'Approved';
          return {
            userId:    r.userId?._id || r._id || String(idx),
            user:      name,
            initials:  getInitials(name),
            color:     COLORS[idx % COLORS.length],
            kycStatus,
            status:    isActive ? 'Active' : 'Deactivated',
            tokens:    0, // Initial static state while dynamically fetching
            email:     r.userId?.email  || '—',
            mobile:    r.userId?.mobile || '—',
          };
        });

        // Set initial data to unblock UI
        setWallets(mapped);
        setLoading(false);

        // Fetch dynamic balances for all wallets via API
        const token = localStorage.getItem('payo_token');
        if (mapped.length > 0) {
          const walletsWithBalances = await Promise.all(
            mapped.map(async (w) => {
              try {
                const balRes = await fetch(`https://shadily-hazard-widget.ngrok-free.dev/api/wallet/profile?userId=${w.userId}`, {
                  method: 'GET',
                  headers: {
                    'Content-Type': 'application/json',
                    'ngrok-skip-browser-warning': 'true',
                    'Authorization': `Bearer ${token}`
                  }
                });
                if (balRes.ok) {
                  const data = await balRes.json();
                  const bal = data?.data?.balance ?? data?.balance ?? 0;
                  return { ...w, tokens: bal };
                }
              } catch (err) {
                console.error('Failed to fetch dynamic balance for userId:', w.userId, err);
              }
              return w; // Fallback to original if fetch fails
            })
          );
          setWallets(walletsWithBalances);
        }
      })
      .catch((err) => {
        console.error('Error fetching submissions:', err);
        setLoading(false);
      });
  }, []);

  // Local-only toggle (backend has no admin wallet toggle endpoint yet)
  const toggle = (userId) => {
    const wallet  = wallets.find(w => w.userId === userId);
    const isActive = wallet?.status === 'Active';
    confirm({
      title: isActive ? 'Deactivate Wallet' : 'Activate Wallet',
      message: isActive
        ? `Are you sure you want to deactivate ${wallet?.user}'s wallet?`
        : `Activate ${wallet?.user}'s wallet? They will be able to transact PYO tokens.`,
      confirmLabel: isActive ? '🔒 Yes, Deactivate' : '🔓 Yes, Activate',
      cancelLabel: 'Cancel',
      type: isActive ? 'danger' : 'success',
    }, () => {
      setWallets(p => p.map(w => w.userId===userId ? {...w, status: w.status==='Active'?'Deactivated':'Active'} : w));
    });
  };

  const active      = wallets.filter(w=>w.status==='Active');
  const deactivated = wallets.filter(w=>w.status==='Deactivated');
  const list = (tab==='active' ? active : deactivated).filter(w => {
    const q = search.toLowerCase();
    return !search
      || w.user.toLowerCase().includes(q)
      || String(w.userId).toLowerCase().includes(q)
      || w.email.toLowerCase().includes(q)
      || w.mobile.toLowerCase().includes(q);
  });

  return (
    <div className="page">
      <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
      <div className="page-header">
        <div className="page-header-left"><h2>Wallets</h2><p>Monitor PayO token wallets and user activity.</p></div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16, marginBottom:22 }}>
        {[
          { label:'Active Wallets',      value:active.length,      bg:'#F0FDF4', e:'✅', color:'#059669' },
          { label:'Deactivated Wallets', value:deactivated.length, bg:'#FEF2F2', e:'🔒', color:'#DC2626' },
          { label:'Total Users',         value:wallets.length,     bg:'#EFF6FF', e:'👥', color:'#2563EB' },
        ].map(s=>(
          <div className="stat-card" key={s.label}>
            <div className="stat-top">
              <div>
                <div className="stat-label">{s.label}</div>
                <div className="stat-value" style={{ fontSize:26 }}>{loading ? '—' : s.value}</div>
              </div>
              <div className="stat-icon" style={{ background:s.bg, fontSize:22 }}>{s.e}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <div style={{ display:'flex', gap:0, borderBottom:'1px solid var(--gray-200)' }}>
          {[['active','Active','#059669'],['deactivated','Deactivated','#DC2626']].map(([k,l,c])=>(
            <button key={k} onClick={()=>setTab(k)} style={{ padding:'13px 20px', border:'none', background:'none', cursor:'pointer', fontFamily:'Inter,sans-serif', fontSize:13.5, fontWeight:tab===k?600:500, color:tab===k?c:'var(--gray-400)', borderBottom:tab===k?`2px solid ${c}`:'2px solid transparent', transition:'all 0.18s' }}>
              {l} &nbsp;<span style={{ background:tab===k?c+'22':'var(--gray-100)', color:tab===k?c:'var(--gray-400)', borderRadius:20, padding:'1px 7px', fontSize:11, fontWeight:700 }}>
                {k==='active'?active.length:deactivated.length}
              </span>
            </button>
          ))}
          <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'flex-end', padding:'0 14px' }}>
            <div className="search-field" style={{ maxWidth:200 }}>
              <svg width="13" height="13" fill="none" stroke="var(--gray-400)" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input placeholder="Search..." value={search} onChange={e=>setSearch(e.target.value)}/>
            </div>
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead><tr><th>User</th><th>User ID</th><th>KYC Status</th><th>Token Balance</th><th>Actions</th></tr></thead>
            <tbody>
              {loading
                ? Array(5).fill(0).map((_,i)=>(
                    <tr key={i}>
                      <td><div style={{ display:'flex', alignItems:'center', gap:10 }}><Skeleton w={34} h={34} radius={8}/><Skeleton w={100} h={12} radius={4}/></div></td>
                      <td><Skeleton w={100} h={12} radius={4}/></td>
                      <td><Skeleton w={70} h={22} radius={20}/></td>
                      <td><Skeleton w={80} h={14} radius={4}/></td>
                      <td><div style={{ display:'flex', gap:6 }}><Skeleton w={50} h={28} radius={8}/><Skeleton w={80} h={28} radius={8}/></div></td>
                    </tr>
                  ))
                : list.map(w=>(
                    <tr key={w.userId}>
                      <td>
                        <div className="user-cell">
                          <div className="avatar" style={{ background:w.color }}>{w.initials}</div>
                          <div><div className="uname">{w.user}</div><div className="uid">{w.email}</div></div>
                        </div>
                      </td>
                      <td style={{ fontSize:12.5, color:'var(--gray-600)', fontFamily:'monospace' }}>{String(w.userId).slice(-14)}</td>
                      <td>
                        <span className={`badge ${w.kycStatus==='Approved'?'b-approved':w.kycStatus==='Failed'?'b-failed':'b-pending'}`}>{w.kycStatus}</span>
                      </td>
                      <td>
                        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                          <span style={{ fontWeight:700, fontSize:15, color:w.tokens>0?'var(--navy)':'var(--gray-400)' }}>{w.tokens.toLocaleString()}</span>
                          <span style={{ fontSize:11, fontWeight:600, color:'var(--gray-400)', background:'var(--gray-100)', padding:'1px 6px', borderRadius:6 }}>PYO</span>
                        </div>
                      </td>
                      <td>
                        <div className="act-group">
                          <button className="btn btn-outline" style={{ fontSize:12, padding:'5px 11px' }} onClick={()=>setSel(w)}>View</button>
                          <button className={`btn ${w.status==='Active'?'btn-danger':'btn-success'}`} style={{ fontSize:12, padding:'5px 11px' }} onClick={()=>toggle(w.userId)}>
                            {w.status==='Active'?'🔒 Deactivate':'🔓 Activate'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
          {!loading && list.length===0 && <div className="empty">No {tab} wallets found.</div>}
        </div>
      </div>

      {sel && <WalletModal w={sel} onClose={()=>setSel(null)} onToggle={toggle}/>}
    </div>
  );
}
