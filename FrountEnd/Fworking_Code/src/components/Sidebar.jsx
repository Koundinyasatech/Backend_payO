import { useState, useEffect, useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { AppCtx, ROLE_ACCESS, ROLE_LABELS } from '../App';
import { getAllSubmissions } from '../apis/adminApi';

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

// Role badge dot colours
const ROLE_BADGE_STYLE = {
  super_admin:      { dot: '#F59E0B' },
  kyc_admin:        { dot: '#3B82F6' },
  operations_admin: { dot: '#22C55E' },
  support_admin:    { dot: '#8B5CF6' },
};

const NavGroup = ({ items }) =>
  items.map(item => (
    <NavLink key={item.to} to={item.to} end={!!item.exact} style={{ textDecoration: 'none' }}>
      {({ isActive }) => (
        <div className={`nav-item ${isActive ? 'active' : ''}`}>
          {item.icon}
          <span style={{ flex: 1 }}>{item.label}</span>
          {item.badge > 0 && <span className="nav-badge">{item.badge}</span>}
        </div>
      )}
    </NavLink>
  ));

export default function Sidebar({ onLogout }) {
  const { adminRole } = useContext(AppCtx);
  const [pendingKycCount,  setPendingKycCount]  = useState(0);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);

  useEffect(() => {
    const canSeeKyc   = ROLE_ACCESS['/kyc']?.includes(adminRole);
    const canSeeNotif = ROLE_ACCESS['/notifications']?.includes(adminRole);
    if (!canSeeKyc && !canSeeNotif) return;

    getAllSubmissions()
      .then(res => {
        const arr = res.data?.kycs || [];
        if (canSeeKyc) {
          setPendingKycCount(
            arr.filter(r => r.status === 'under_review' || r.status === 'documents_uploaded').length
          );
        }
        if (canSeeNotif) {
          setUnreadNotifCount(
            arr.filter(r => normalizeStatus(r.status) === 'Pending').length
          );
        }
      })
      .catch(err => console.error('Failed to load badge counts', err));
  }, [adminRole]);

  // All possible nav items
  const allNavMain = [
    {
      to: '/', label: 'Dashboard', exact: true,
      icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>,
    },
    {
      to: '/kyc', label: 'KYC Review', badge: pendingKycCount,
      icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="10"/></svg>,
    },
    {
      to: '/users', label: 'Users',
      icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>,
    },
    {
      to: '/wallets', label: 'Wallets',
      icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"/><path d="M16 3H8L4 7h16l-4-4z"/><circle cx="17" cy="13" r="1"/></svg>,
    },
    {
      to: '/transactions', label: 'Transactions',
      icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 014-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 01-4 4H3"/></svg>,
    },
    {
      to: '/referrals', label: 'Referrals',
      icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>,
    },
  ];

  const allNavReports = [
    {
      to: '/analytics', label: 'Analytics',
      icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
    },
    {
      to: '/audit', label: 'Audit Log',
      icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
    },
    {
      to: '/notifications', label: 'Notifications', badge: unreadNotifCount,
      icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>,
    },
    {
      to: '/reports', label: 'Reports',
      icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
    },
  ];

  // Only show items this role is allowed to access
  const navMain    = allNavMain.filter(item    => ROLE_ACCESS[item.to]?.includes(adminRole));
  const navReports = allNavReports.filter(item => ROLE_ACCESS[item.to]?.includes(adminRole));

  const roleDot   = ROLE_BADGE_STYLE[adminRole]?.dot || '#94A3B8';
  const roleLabel = ROLE_LABELS[adminRole] || 'Admin';

  return (
    <aside className="sidebar">

      {/* Logo */}
      <div style={{
        padding: '16px 16px 14px',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <img
          src={process.env.PUBLIC_URL + "/images/payo-wide-logo-removebg-preview.png"}
          alt="PayO Admin Portal"
          style={{ width: '100%', maxWidth: 200, height: 'auto', objectFit: 'contain', display: 'block' }}
        />
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        <div className="nav-section-label">Main</div>
        <NavGroup items={navMain} />
        <div className="nav-section-label">Reports</div>
        <NavGroup items={navReports} />
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">

        {/* Role badge */}
        <div style={{
          margin: '0 10px 10px',
          padding: '8px 12px',
          borderRadius: 10,
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.08)',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <div style={{
            width: 8, height: 8, borderRadius: '50%',
            background: roleDot, flexShrink: 0,
            boxShadow: `0 0 6px ${roleDot}`,
          }}/>
          <div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
              Logged in as
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', fontWeight: 700, marginTop: 1 }}>
              {roleLabel}
            </div>
          </div>
        </div>

        {/* Logout */}
        <div className="logout-btn" onClick={onLogout}>
          <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
          </svg>
          Logout
        </div>
      </div>
    </aside>
  );
}