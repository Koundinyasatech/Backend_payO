import { BrowserRouter, Routes, Route, useLocation, useNavigate, Navigate } from 'react-router-dom';
import './App.css';
import { useState, useEffect, createContext, useContext } from 'react';
import Sidebar from './components/Sidebar';
import ConfirmDialog from './components/ConfirmDialog';
import AdminProfile from './components/AdminProfile';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import KYCReview from './pages/KYCReview';
import Users from './pages/Users';
import Wallets from './pages/Wallets';
import Analytics from './pages/Analytics';
import AuditLog from './pages/AuditLog';
import Notifications from './pages/Notifications';
import Transactions from './pages/Transactions';
import Referrals from './pages/Referrals';
import Reports from './pages/Reports';

export const AppCtx = createContext({});

// ── Role-based page access map ────────────────────────────────────────────────
// Defines which adminRoles are allowed to visit each route.
// Dashboard, Audit Log, Notifications are open to all admin roles.
export const ROLE_ACCESS = {
  '/':              ['super_admin', 'kyc_admin', 'operations_admin', 'support_admin'],
  '/kyc':           ['super_admin', 'kyc_admin'],
  '/users':         ['super_admin', 'operations_admin', 'support_admin'],
  '/wallets':       ['super_admin', 'operations_admin'],
  '/analytics':     ['super_admin', 'kyc_admin', 'operations_admin'],
  '/audit':         ['super_admin', 'kyc_admin', 'operations_admin', 'support_admin'],
  '/notifications': ['super_admin', 'kyc_admin', 'operations_admin', 'support_admin'],
  '/transactions':  ['super_admin', 'operations_admin'],
  '/referrals':     ['super_admin', 'operations_admin'],
  '/reports':       ['super_admin', 'kyc_admin', 'operations_admin', 'support_admin'],
};

// ── Human-readable role labels ────────────────────────────────────────────────
export const ROLE_LABELS = {
  super_admin:       'Super Admin',
  kyc_admin:         'KYC Admin',
  operations_admin:  'Operations Admin',
  support_admin:     'Support Admin',
};

// ── ProtectedRoute — redirects to / if role not allowed ──────────────────────
function ProtectedRoute({ path, children }) {
  const { adminRole } = useContext(AppCtx);
  const allowed = ROLE_ACCESS[path] || [];
  if (!adminRole || !allowed.includes(adminRole)) {
    return <Navigate to="/" replace />;
  }
  return children;
}

const titles = {
  '/': 'Dashboard', '/kyc': 'KYC Review', '/users': 'Users',
  '/wallets': 'Wallets', '/analytics': 'Analytics',
  '/audit':         'Audit Log',
  '/notifications': 'Notifications',
  '/transactions':  'Transactions',
  '/referrals':     'Referrals',
  '/reports':       'Reports',
};

function Topbar({ admin, onAdminUpdate, onLogout, dark, toggleDark }) {
  const loc   = useLocation();
  const nav   = useNavigate();
  const [search, setSearch] = useState('');
  const { confirm } = useContext(AppCtx);
  const title = titles[loc.pathname] || 'Dashboard';

  const handleLogout = () => {
    confirm({
      title: 'Sign Out',
      message: 'Are you sure you want to sign out of the PayO Admin Portal?',
      confirmLabel: 'Yes, Sign Out',
      cancelLabel: 'Stay',
      type: 'danger',
    }, onLogout);
  };

  return (
    <header className="topbar">
      <div className="topbar-title">{title}</div>

      <div className="topbar-search">
        <svg width="14" height="14" fill="none" stroke="var(--gray-400)" strokeWidth="2" viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input placeholder="Search user, document, status..." value={search} onChange={e => setSearch(e.target.value)}/>
      </div>

      <div className="topbar-right">
        <button className="dark-toggle" onClick={toggleDark} title={dark ? 'Light mode' : 'Dark mode'}>
          {dark ? '☀️' : '🌙'}
        </button>

        <button className="notif-btn" onClick={() => nav('/notifications')}>
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 01-3.46 0"/>
          </svg>
        </button>

        <AdminProfile
          admin={admin}
          onUpdate={onAdminUpdate}
          onLogout={handleLogout}
          dark={dark}
        />
      </div>
    </header>
  );
}

function Portal({ admin, onAdminUpdate, onLogout, dark, toggleDark }) {
  const { confirm } = useContext(AppCtx);

  const handleLogout = () => {
    confirm({
      title: 'Sign Out',
      message: 'Are you sure you want to sign out of the PayO Admin Portal?',
      confirmLabel: 'Yes, Sign Out',
      cancelLabel: 'Stay',
      type: 'danger',
    }, onLogout);
  };

  return (
    <div className="layout">
      <Sidebar onLogout={handleLogout} />
      <div className="main">
        <Topbar
          admin={admin}
          onAdminUpdate={onAdminUpdate}
          onLogout={onLogout}
          dark={dark}
          toggleDark={toggleDark}
        />
        <Routes>
          <Route index element={<Dashboard />} />
          <Route path="/" element={<Dashboard />} />

          <Route path="/kyc" element={
            <ProtectedRoute path="/kyc"><KYCReview /></ProtectedRoute>
          } />
          <Route path="/users" element={
            <ProtectedRoute path="/users"><Users /></ProtectedRoute>
          } />
          <Route path="/wallets" element={
            <ProtectedRoute path="/wallets"><Wallets /></ProtectedRoute>
          } />
          <Route path="/analytics" element={
            <ProtectedRoute path="/analytics"><Analytics /></ProtectedRoute>
          } />
          <Route path="/audit" element={
            <ProtectedRoute path="/audit"><AuditLog /></ProtectedRoute>
          } />
          <Route path="/notifications" element={
            <ProtectedRoute path="/notifications"><Notifications /></ProtectedRoute>
          } />
          <Route path="/transactions" element={
            <ProtectedRoute path="/transactions"><Transactions /></ProtectedRoute>
          } />
          <Route path="/referrals" element={
            <ProtectedRoute path="/referrals"><Referrals /></ProtectedRoute>
          } />
          <Route path="/reports" element={
            <ProtectedRoute path="/reports"><Reports /></ProtectedRoute>
          } />
        </Routes>
      </div>
    </div>
  );
}

function AppInner() {
  const navigate = useNavigate();
  const [admin, setAdmin]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [dark, setDark] = useState(() => {
    try { return localStorage.getItem('payo-dark') === 'true'; } catch { return false; }
  });
  const [dlg, setDlg] = useState(null);

  // Restore session on page refresh
  useEffect(() => {
    try {
      const token = localStorage.getItem('payo_token');
      const saved = localStorage.getItem('payo_admin');
      if (token && saved) {
        setAdmin(JSON.parse(saved));
      }
    } catch {
      localStorage.removeItem('payo_token');
      localStorage.removeItem('payo_admin');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    document.body.classList.toggle('dark', dark);
    try { localStorage.setItem('payo-dark', dark); } catch {}
  }, [dark]);

  const handleLogin = (adminData, token) => {
    localStorage.setItem('payo_token', token);
    localStorage.setItem('payo_admin', JSON.stringify(adminData));
    setAdmin(adminData);
    setTimeout(() => { navigate('/'); }, 100);
  };

  const handleLogout = () => {
    localStorage.removeItem('payo_token');
    localStorage.removeItem('payo_admin');
    setAdmin(null);
  };

  const confirm     = (config, onConfirm) => setDlg({ config, onConfirm });
  const closeDialog = () => setDlg(null);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0A0A0A' }}>
        <div style={{ textAlign: 'center' }}>
          <img src={process.env.PUBLIC_URL + "/images/payo-icon-logo-removebg-preview.png"} alt="PayO" style={{ width: 72, height: 72, objectFit: 'contain', marginBottom: 20, opacity: 0.8 }}/>
          <div style={{ width: 32, height: 32, border: '3px solid rgba(255,255,255,0.15)', borderTopColor: '#3B82F6', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' }}/>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      </div>
    );
  }

  // adminRole is stored inside the admin object in localStorage
  const adminRole = admin?.adminRole || null;

  return (
    <AppCtx.Provider value={{ confirm, dark, adminRole }}>
      {!admin
        ? <Login onLogin={handleLogin} />
        : <Portal
            admin={admin}
            onAdminUpdate={(updated) => {
              setAdmin(updated);
              localStorage.setItem('payo_admin', JSON.stringify(updated));
            }}
            onLogout={handleLogout}
            dark={dark}
            toggleDark={() => setDark(d => !d)}
          />
      }
      <ConfirmDialog
        config={dlg?.config}
        onConfirm={() => { dlg?.onConfirm?.(); closeDialog(); }}
        onCancel={closeDialog}
      />
    </AppCtx.Provider>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppInner />
    </BrowserRouter>
  );
}