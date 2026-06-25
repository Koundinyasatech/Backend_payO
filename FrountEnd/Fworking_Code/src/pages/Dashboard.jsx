import { useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { getDashboardStats, getAllSubmissions, getAllUsers, getDashboardWidgetStats } from '../apis/adminApi';

/* ── Skeleton loader ── */
function Skeleton({ w = '100%', h = 16, radius = 6, style = {} }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: radius,
      background: 'linear-gradient(90deg, var(--skeleton-a,#E2E8F0) 25%, var(--skeleton-b,#F1F5F9) 50%, var(--skeleton-a,#E2E8F0) 75%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.4s infinite',
      ...style,
    }}/>
  );
}

/* ── Sparkline SVG ── */
function Sparkline({ points, color }) {
  const w = 100, h = 36;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const step = w / (points.length - 1);
  const coords = points.map((v, i) => [i * step, h - ((v - min) / range) * (h - 6) - 3]);
  const d = coords.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const fill = d + ` L${w},${h} L0,${h} Z`;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block' }}>
      <defs>
        <linearGradient id={`sg-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <path d={fill} fill={`url(#sg-${color.replace('#','')})`}/>
      <path d={d} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

/* ── Stat Card ── */
function StatCard({ label, value, change, up, color, iconBg, icon, sparkData, loading }) {
  return (
    <div style={{
      background: 'var(--stat-card-bg, #ffffff)',
      border: '1px solid var(--stat-card-border, #E2E8F0)',
      borderRadius: 16, padding: '22px 22px 18px',
      display: 'flex', flexDirection: 'column', gap: 0,
      minHeight: 170, position: 'relative', overflow: 'hidden',
      transition: 'transform 0.2s, box-shadow 0.2s', cursor: 'default',
    }}
    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.3)'; }}
    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
    >
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:14 }}>
        <div style={{ fontSize:11, fontWeight:700, color:'var(--stat-card-label, #94A3B8)', textTransform:'uppercase', letterSpacing:'0.8px' }}>{label}</div>
        <div style={{ width:38, height:38, borderRadius:10, background:iconBg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>{icon}</div>
      </div>
      {loading
        ? <><Skeleton h={34} radius={8} style={{ marginBottom:12 }}/><Skeleton w="60%" h={14} radius={6} style={{ marginBottom:10 }}/><Skeleton h={14} w="40%" radius={6}/></>
        : <>
            <div style={{ fontFamily:"'Space Grotesk', sans-serif", fontSize:34, fontWeight:700, color:'var(--stat-card-value, #0D1B3E)', letterSpacing:'-1px', lineHeight:1, marginBottom:12 }}>{value}</div>
            <div style={{ marginBottom:10 }}><Sparkline points={sparkData} color={color}/></div>
            <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, fontWeight:600, color: up ? '#10B981' : '#EF4444' }}>
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                {up ? <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/> : <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/>}
              </svg>
              {change}
            </div>
          </>
      }
    </div>
  );
}

/* ── Filter Dropdown ── */
function FilterDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const options = [
    { label: 'All Dates',    value: 'all' },
    { label: 'Today',        value: 'today' },
    { label: 'Yesterday',    value: 'yesterday' },
    { label: 'Last 7 Days',  value: '7days' },
    { label: 'Last 30 Days', value: '30days' },
    { label: 'This Month',   value: 'month' },
    { label: 'Last Month',   value: 'lastmonth' },
  ];
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  const selected = options.find(o => o.value === value) || options[0];
  return (
    <div ref={ref} style={{ position:'relative' }}>
      <button onClick={() => setOpen(o => !o)} style={{ display:'flex', alignItems:'center', gap:7, padding:'7px 14px', background: open?'#EEF2FF':'var(--filter-btn-bg, #F5F3FF)', border:'1.5px solid var(--filter-btn-border, #C7D2FE)', borderRadius:10, color:'var(--filter-btn-color, #4F46E5)', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:"'Inter',sans-serif", transition:'all 0.18s', whiteSpace:'nowrap' }}>
        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
        Filters
        {value !== 'all' && <span style={{ background:'#4F46E5', color:'#fff', borderRadius:20, padding:'1px 6px', fontSize:10, fontWeight:700 }}>1</span>}
        <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" style={{ transition:'transform 0.18s', transform: open?'rotate(180deg)':'rotate(0deg)' }}><polyline points="6 9 12 15 18 9"/></svg>
      </button>
      {open && (
        <div style={{ position:'absolute', top:'calc(100% + 8px)', right:0, background:'var(--dropdown-bg, #fff)', border:'1.5px solid var(--dropdown-border, #E2E8F0)', borderRadius:12, padding:'6px', minWidth:180, boxShadow:'0 8px 32px rgba(0,0,0,0.12)', zIndex:500 }}>
          {options.map(opt => (
            <div key={opt.value} onClick={() => { onChange(opt.value); setOpen(false); }}
              style={{ padding:'9px 12px', borderRadius:8, fontSize:13, fontWeight: value===opt.value?600:400, color: value===opt.value?'#4F46E5':'var(--dropdown-text, #374151)', background: value===opt.value?'#EEF2FF':'transparent', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'space-between' }}
              onMouseEnter={e => { if (value !== opt.value) e.currentTarget.style.background='var(--dropdown-hover, #F9FAFB)'; }}
              onMouseLeave={e => { if (value !== opt.value) e.currentTarget.style.background='transparent'; }}>
              {opt.label}
              {value === opt.value && <svg width="14" height="14" fill="none" stroke="#4F46E5" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>}
            </div>
          ))}
          {value !== 'all' && (
            <div style={{ borderTop:'1px solid var(--dropdown-border, #E2E8F0)', marginTop:4, paddingTop:4 }}>
              <div onClick={() => { onChange('all'); setOpen(false); }} style={{ padding:'8px 12px', borderRadius:8, fontSize:12, fontWeight:600, color:'#EF4444', cursor:'pointer', textAlign:'center' }} onMouseEnter={e=>e.currentTarget.style.background='#FEF2F2'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>Clear Filter</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Donut Chart ── */
function DonutChart({ stats }) {
  if (!stats) return <Skeleton h={176} radius={88} style={{ margin:'0 auto' }}/>;
  const total    = stats.total    || 1;
  const approved = stats.approved || 0;
  const pending  = stats.pending  || 0;
  const rejected = stats.rejected || 0;
  const r = 68, cx = 88, cy = 88, sw = 18;
  const c = 2 * Math.PI * r;
  const aPct = approved / total;
  const pPct = pending  / total;
  const successRate = total > 0 ? ((approved / total) * 100).toFixed(1) : '0.0';
  return (
    <div className="donut-wrap">
      <div style={{ position:'relative', display:'inline-block' }}>
        <svg width="176" height="176" viewBox="0 0 176 176">
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#FEE2E2" strokeWidth={sw}/>
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#FEF3C7" strokeWidth={sw}
            strokeDasharray={`${(aPct+pPct)*c} ${c}`} strokeDashoffset={-aPct*c} strokeLinecap="round"
            transform={`rotate(-90 ${cx} ${cy})`}/>
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#10B981" strokeWidth={sw}
            strokeDasharray={`${aPct*c} ${c}`} strokeLinecap="round"
            transform={`rotate(-90 ${cx} ${cy})`}/>
        </svg>
        <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', textAlign:'center' }}>
          <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:21, fontWeight:800, color:'var(--navy)' }}>{successRate}%</div>
          <div style={{ fontSize:10, color:'var(--gray-400)', fontWeight:600 }}>Success Rate</div>
        </div>
      </div>
      <div className="donut-legend">
        {[['#10B981','Approved',`${approved.toLocaleString()} (${successRate}%)`],['#F59E0B','Pending',`${pending.toLocaleString()}`],['#EF4444','Rejected',`${rejected.toLocaleString()}`]].map(([col,l,v]) => (
          <div className="legend-row" key={l}>
            <div className="l-label"><div className="l-dot" style={{ background:col }}/>{l}</div>
            <div className="l-val">{v}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

const statusBadge = s => {
  const m = { Pending:'b-pending','In Review':'b-review',Approved:'b-approved',Failed:'b-failed' };
  return <span className={`badge ${m[s]||'b-pending'}`}>{s}</span>;
};

/* Normalize backend KYC status → display status
   Backend enum: not_started | documents_uploaded | under_review | approved | rejected */
function normalizeStatus(s) {
  if (!s) return 'Pending';
  const map = {
    not_started:        'Pending',
    documents_uploaded: 'In Review',
    under_review:       'In Review',
    approved:           'Approved',
    rejected:           'Failed',
  };
  return map[s] || s;
}

/* Get initials from name */
function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

const COLORS = ['#6C63FF','#FF6584','#43E97B','#FA8231','#E74C3C','#3498DB','#9B59B6','#1ABC9C','#E67E22','#2ECC71'];

export default function Dashboard() {
  const navigate = useNavigate();
  const [dateFilter, setDateFilter] = useState('all');
  const [stats, setStats]           = useState(null);
  const [kycs, setKycs]             = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingKyc, setLoadingKyc]     = useState(true);
  const [error, setError]           = useState('');

  // New widget stats
  const [totalUsers,       setTotalUsers]       = useState(0);
  const [activeWallets,    setActiveWallets]    = useState(0);
  const [totalTxns,        setTotalTxns]        = useState(0);
  const [payoCirculation,  setPayoCirculation]  = useState(0);
  const [referralRewards,  setReferralRewards]  = useState(0);
  const [loadingWidgets,   setLoadingWidgets]   = useState(true);

  useEffect(() => {
    // ── KYC submissions (table only) ────────────────────────────────────────
    getAllSubmissions()
      .then(res => {
        const arr = res.data?.kycs || [];
        const safe = Array.isArray(arr) ? arr : [];
        setKycs(safe);
        // NOTE: Active Wallets count is now taken from getDashboardStats (approved field)
        // because getAllSubmissions may return a limited/paginated subset — not all records.
      })
      .catch(() => {})
      .finally(() => setLoadingKyc(false));

    // ── Users total ─────────────────────────────────────────────────────────
    // GET /api/admin/auth/users → { success, total, verified, pending, users: [] }
    getAllUsers()
      .then(res => {
        setTotalUsers(res.data?.total ?? (res.data?.users?.length ?? 0));
      })
      .catch(() => {});

    // ── Extended widget stats (transactions, PAYO, referrals) ───────────────
    // getDashboardWidgetStats() → GET /api/admin/stats/widgets
    // Expected response: { totalTransactions, payoInCirculation, referralRewardsDistributed }
    getDashboardWidgetStats()
      .then(res => {
        const d = res.data || {};
        setTotalTxns(d.totalTransactions       ?? 0);
        setPayoCirculation(d.payoInCirculation  ?? 0);
        setReferralRewards(d.referralRewardsDistributed ?? 0);
      })
      .catch(() => {})
      .finally(() => setLoadingWidgets(false));

    // ── Dashboard KYC stats (donut + active wallets) ────────────────────────
    // getDashboardStats does a full countDocuments on the DB — always accurate.
    // Use stats.approved here for Active Wallets instead of counting the submissions array.
    getDashboardStats()
      .then(res => {
        const s = res.data?.stats || {};
        setStats(s);
        // Fix: set Active Wallets from the full approved count, not the submissions slice
        setActiveWallets(s.approved || 0);
      })
      .catch(() => setError('Failed to load dashboard stats'))
      .finally(() => setLoadingStats(false));
  }, []);

  // Safety check
  if (!Array.isArray(kycs)) {
    return <div style={{ padding: 20 }}>Loading Dashboard...</div>;
  }

  // KYC overview data (still used by Donut + Quick Stats below)
  const totalSubmissions = stats?.totalSubmissions || 0;
  const pendingKYC       = (stats?.underReview || 0) + (stats?.docsUploaded || 0);
  const approvedKYC      = stats?.approved || 0;
  const rejectedKYC      = stats?.rejected || 0;

  // ── 5 new widget stat cards ───────────────────────────────────────────────
  const widgetLoading = loadingWidgets || loadingStats;
  const statCards = [
    {
      label: 'Total Users',
      value: totalUsers.toLocaleString(),
      change: '+8.4% this month', up: true,
      color: '#3B82F6', iconBg: 'rgba(59,130,246,0.15)',
      icon: (
        <svg width="20" height="20" fill="none" stroke="#3B82F6" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
        </svg>
      ),
      sparkData: [30,42,38,55,48,62,58,72,68,80,76,90],
      loading: widgetLoading,
    },
    {
      label: 'Total Active Wallets',
      value: activeWallets.toLocaleString(),
      change: '+12.1% this month', up: true,
      color: '#10B981', iconBg: 'rgba(16,185,129,0.15)',
      icon: (
        <svg width="20" height="20" fill="none" stroke="#10B981" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"/>
          <path d="M16 3H8L4 7h16l-4-4z"/>
          <circle cx="17" cy="13" r="1" fill="#10B981"/>
        </svg>
      ),
      sparkData: [20,35,30,48,42,58,55,70,65,80,78,92],
      loading: widgetLoading,
    },
    {
      label: 'Total Transactions',
      value: totalTxns.toLocaleString(),
      change: '+5.3% this month', up: true,
      color: '#8B5CF6', iconBg: 'rgba(139,92,246,0.15)',
      icon: (
        <svg width="20" height="20" fill="none" stroke="#8B5CF6" strokeWidth="2" viewBox="0 0 24 24">
          <polyline points="17 1 21 5 17 9"/>
          <path d="M3 11V9a4 4 0 014-4h14"/>
          <polyline points="7 23 3 19 7 15"/>
          <path d="M21 13v2a4 4 0 01-4 4H3"/>
        </svg>
      ),
      sparkData: [45,52,48,60,55,68,62,75,70,82,78,88],
      loading: widgetLoading,
    },
    {
      label: 'PAYO in Circulation',
      value: payoCirculation.toLocaleString(),
      change: '+3.7% this month', up: true,
      color: '#F59E0B', iconBg: 'rgba(245,158,11,0.15)',
      icon: (
        <svg width="20" height="20" fill="none" stroke="#F59E0B" strokeWidth="2" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 6v2m0 8v2M9.5 9.5A2.5 2.5 0 0112 8h.5a2.5 2.5 0 010 5H12a2.5 2.5 0 000 5h.5a2.5 2.5 0 002.5-2.5"/>
        </svg>
      ),
      sparkData: [60,55,70,65,80,72,85,78,90,84,95,88],
      loading: widgetLoading,
    },
    {
      label: 'Referral Rewards',
      value: referralRewards.toLocaleString(),
      change: '+18.6% this month', up: true,
      color: '#EC4899', iconBg: 'rgba(236,72,153,0.15)',
      icon: (
        <svg width="20" height="20" fill="none" stroke="#EC4899" strokeWidth="2" viewBox="0 0 24 24">
          <polyline points="20 12 20 22 4 22 4 12"/>
          <rect x="2" y="7" width="20" height="5"/>
          <line x1="12" y1="22" x2="12" y2="7"/>
          <path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z"/>
          <path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z"/>
        </svg>
      ),
      sparkData: [10,18,14,25,20,32,28,40,36,50,46,60],
      loading: widgetLoading,
    },
  ];

  // Filter KYC list by date (backend uses createdAt)
  const filteredKyc = (kycs || []).filter(r => {
    if (dateFilter === 'all') return true;
    const d = new Date(r.createdAt);
    const now = new Date();
    if (dateFilter === 'today')     { const t = new Date(); t.setHours(0,0,0,0); return d >= t; }
    if (dateFilter === 'yesterday') { const t = new Date(); t.setDate(t.getDate()-1); t.setHours(0,0,0,0); const e = new Date(t); e.setHours(23,59,59,999); return d >= t && d <= e; }
    if (dateFilter === '7days')     { const t = new Date(); t.setDate(t.getDate()-7); return d >= t; }
    if (dateFilter === '30days')    { const t = new Date(); t.setDate(t.getDate()-30); return d >= t; }
    if (dateFilter === 'month')     { return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); }
    if (dateFilter === 'lastmonth') { const lm = new Date(now.getFullYear(), now.getMonth()-1, 1); return d.getMonth() === lm.getMonth() && d.getFullYear() === lm.getFullYear(); }
    return true;
  });

  return (
    <div className="page">
      <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
      <div className="page-header">
        <div className="page-header-left">
          <h2>Dashboard</h2>
          <p>Welcome back, Admin! Here's what's happening with PayO KYC today.</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/kyc')}>
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="10"/></svg>
          Review KYC
        </button>
      </div>

      {error && <div style={{ background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:10, padding:'12px 16px', marginBottom:18, color:'#DC2626', fontSize:13 }}>⚠️ {error}</div>}

      {/* Stat Cards */}
      <div className="stats-widget-row" style={{ display:'grid', gridTemplateColumns:'repeat(5, 1fr)', gap:16, marginBottom:24 }}>
        {statCards.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      {/* Main Grid */}
      <div className="dash-grid">
        {/* KYC Table */}
        <div className="card">
          <div className="card-header">
            <h3>Recent KYC Requests</h3>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <FilterDropdown value={dateFilter} onChange={setDateFilter} />
              <button className="btn btn-outline" style={{ fontSize:12, padding:'5px 12px' }} onClick={() => navigate('/kyc')}>View All</button>
            </div>
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>User</th><th>Documents</th><th>Submitted</th><th>Status</th></tr></thead>
              <tbody>
                {loadingKyc
                  ? Array(5).fill(0).map((_,i) => (
                      <tr key={i}>
                        <td><div style={{ display:'flex', alignItems:'center', gap:10 }}><Skeleton w={34} h={34} radius={8}/><div><Skeleton w={100} h={12} radius={4} style={{ marginBottom:4 }}/><Skeleton w={60} h={10} radius={4}/></div></div></td>
                        <td><Skeleton w={120} h={20} radius={6}/></td>
                        <td><Skeleton w={80} h={12} radius={4}/></td>
                        <td><Skeleton w={60} h={22} radius={20}/></td>
                      </tr>
                    ))
                  : filteredKyc.slice(0, 7).map((r, idx) => {
                      // Backend KYC record fields:
                      //   _id, userId: {_id, name, mobile, email}, fullName, status, createdAt,
                      //   aadharFrontUrl, panCardUrl, selfieUrl, passportUrl, rejectionReason
                      const name      = r.fullName || r.userId?.name || 'Unknown';
                      const userIdStr = r.userId?._id || r._id || '';
                      const status    = normalizeStatus(r.status);
                      const initials  = getInitials(name);
                      const color     = COLORS[idx % COLORS.length];
                      const dateStr   = r.createdAt || '';
                      const formatted = dateStr ? new Date(dateStr).toLocaleString('en-IN', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' }) : '—';
                      // Build document badges from actually-present URLs
                      const docs = [];
                      if (r.aadharFrontUrl) docs.push('🪪 Aadhaar');
                      if (r.panCardUrl)     docs.push('💳 PAN');
                      if (r.passportUrl)    docs.push('📔 Passport');
                      if (r.selfieUrl)      docs.push('🤳 Selfie');
                      return (
                        <tr key={r._id || idx} style={{ cursor:'pointer' }} onClick={() => navigate('/kyc')}>
                          <td>
                            <div className="user-cell">
                              <div className="avatar" style={{ background:color }}>{initials}</div>
                              <div><div className="uname">{name}</div><div className="uid">{String(userIdStr).slice(-8)}</div></div>
                            </div>
                          </td>
                          <td>
                            <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                              {docs.length === 0
                                ? <span style={{ fontSize:12, color:'var(--gray-400)' }}>—</span>
                                : docs.map(d => <span key={d} className="doc-badge">{d}</span>)}
                            </div>
                          </td>
                          <td style={{ color:'var(--gray-400)', fontSize:13 }}>{formatted}</td>
                          <td>{statusBadge(status)}</td>
                        </tr>
                      );
                    })
                }
              </tbody>
            </table>
            {!loadingKyc && filteredKyc.length === 0 && <div className="empty">No KYC requests found.</div>}
          </div>
        </div>

        {/* Right column */}
        <div className="right-col">
          <div className="card">
            <div className="card-header"><h3>KYC Overview</h3></div>
            <DonutChart stats={loadingStats ? null : { total: (totalSubmissions || (approvedKYC + pendingKYC + rejectedKYC) || 1), approved: approvedKYC, pending: pendingKYC, rejected: rejectedKYC }}/>
          </div>

          <div className="card">
            <div className="card-header">
              <h3>Quick Stats</h3>
            </div>
            <div style={{ padding:'8px 20px 16px', display:'flex', flexDirection:'column', gap:12 }}>
              {loadingStats
                ? Array(3).fill(0).map((_,i) => <Skeleton key={i} h={36} radius={8}/>)
                : [
                    { label:'Total Submissions', value: totalSubmissions.toLocaleString(), color:'#3B82F6' },
                    { label:'Approval Rate',     value: totalSubmissions > 0 ? ((approvedKYC/totalSubmissions)*100).toFixed(1)+'%' : '—', color:'#10B981' },
                    { label:'Pending Review',    value: pendingKYC.toLocaleString(), color:'#F59E0B' },
                  ].map(item => (
                    <div key={item.label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:'1px solid var(--gray-100)' }}>
                      <span style={{ fontSize:13, color:'var(--gray-600)' }}>{item.label}</span>
                      <span style={{ fontSize:14, fontWeight:700, color:item.color }}>{item.value}</span>
                    </div>
                  ))
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}