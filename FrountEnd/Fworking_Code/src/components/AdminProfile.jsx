import { useState, useRef, useEffect, useContext } from 'react';
import { changePassword, getAllAdmins, createSubAdmin, revokeAdminAccess, updateAdminRole } from '../apis/adminApi';
import { AppCtx, ROLE_LABELS } from '../App';

const SUB_ADMIN_ROLES = [
  { value: 'kyc_admin',        label: 'KYC Admin',        desc: 'Manage KYC approvals' },
  { value: 'operations_admin', label: 'Operations Admin',  desc: 'Monitor transactions' },
  { value: 'support_admin',    label: 'Support Admin',     desc: 'Handle user issues' },
];

const ROLE_DOT = {
  super_admin:      '#F59E0B',
  kyc_admin:        '#3B82F6',
  operations_admin: '#22C55E',
  support_admin:    '#8B5CF6',
};

function Toast({ msg, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div style={{
      position: 'fixed', bottom: 28, right: 28, zIndex: 9999,
      background: type === 'ok' ? '#10B981' : '#EF4444',
      color: '#fff', padding: '13px 18px', borderRadius: 12,
      fontSize: 14, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 9,
      boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
      animation: 'tIn 0.3s ease', fontFamily: "'Inter',sans-serif",
    }}>
      {type === 'ok' ? '✅' : '❌'} {msg}
    </div>
  );
}

function InputField({ label, value, onChange, type = 'text', disabled = false, icon }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 6 }}>{label}</label>
      <div style={{ position: 'relative' }}>
        {icon && (
          <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)', display: 'flex', alignItems: 'center' }}>{icon}</div>
        )}
        <input
          type={type} value={value}
          onChange={e => onChange(e.target.value)}
          disabled={disabled}
          style={{
            width: '100%',
            padding: icon ? '10px 12px 10px 38px' : '10px 12px',
            background: disabled ? 'var(--profile-input-disabled,#F8FAFC)' : 'var(--profile-input-bg,#fff)',
            border: '1.5px solid var(--profile-input-border,#E2E8F0)',
            borderRadius: 9, fontSize: 13.5, color: 'var(--gray-800)',
            outline: 'none', fontFamily: "'Inter',sans-serif",
            cursor: disabled ? 'not-allowed' : 'text',
            opacity: disabled ? 0.7 : 1, transition: 'border-color 0.2s',
          }}
          onFocus={e => { if (!disabled) e.target.style.borderColor = '#2563EB'; }}
          onBlur={e => { e.target.style.borderColor = 'var(--profile-input-border,#E2E8F0)'; }}
        />
      </div>
    </div>
  );
}

const Toggle = ({ checked, onChange }) => (
  <div onClick={() => onChange(!checked)} style={{ width: 44, height: 24, borderRadius: 12, background: checked ? '#2563EB' : 'var(--toggle-off,#CBD5E1)', position: 'relative', cursor: 'pointer', flexShrink: 0, transition: 'background 0.2s' }}>
    <div style={{ position: 'absolute', top: 3, left: checked ? 23 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.2)', transition: 'left 0.2s' }}/>
  </div>
);

const PasswordInput = ({ label, value, onChange, show, onToggle }) => (
  <div style={{ marginBottom: 16 }}>
    <label style={{ display:'block', fontSize:11, fontWeight:600, color:'var(--gray-400)', textTransform:'uppercase', letterSpacing:'0.7px', marginBottom:6 }}>{label}</label>
    <div style={{ position: 'relative' }}>
      <input type={show ? 'text' : 'password'} value={value} onChange={e => onChange(e.target.value)}
        style={{ width:'100%', padding:'10px 40px 10px 12px', background:'var(--profile-input-bg,#fff)', border:'1.5px solid var(--profile-input-border,#E2E8F0)', borderRadius:9, fontSize:13.5, color:'var(--gray-800)', outline:'none', fontFamily:"'Inter',sans-serif", transition:'border-color 0.2s' }}
        onFocus={e => e.target.style.borderColor='#2563EB'}
        onBlur={e => e.target.style.borderColor='var(--profile-input-border,#E2E8F0)'}
      />
      <button type="button" onClick={onToggle} style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'var(--gray-400)', fontSize:15, padding:0, display:'flex', alignItems:'center' }}>
        {show ? '🙈' : '👁️'}
      </button>
    </div>
  </div>
);

// ── Manage Admins Tab (super_admin only) ──────────────────────────────────────
function ManageAdminsTab({ showToast }) {
  const [admins, setAdmins]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [view, setView]           = useState('list'); // 'list' | 'create'
  const [changingRole, setChangingRole] = useState(null); // adminId being changed

  // Create form state
  const [cName,     setCName]     = useState('');
  const [cEmail,    setCEmail]    = useState('');
  const [cMobile,   setCMobile]   = useState('');
  const [cPassword, setCPassword] = useState('');
  const [cRole,     setCRole]     = useState('kyc_admin');
  const [creating,  setCreating]  = useState(false);

  const fetchAdmins = () => {
    setLoading(true);
    getAllAdmins()
      .then(res => setAdmins(res.data?.admins || []))
      .catch(() => showToast('Failed to load admins', 'err'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAdmins(); }, []); // eslint-disable-line

  const handleCreate = async () => {
    if (!cName.trim() || !cEmail.trim() || !cMobile.trim() || !cPassword.trim()) {
      showToast('All fields are required', 'err'); return;
    }
    if (cPassword.length < 8) { showToast('Password must be at least 8 characters', 'err'); return; }
    setCreating(true);
    try {
      await createSubAdmin({ name: cName, email: cEmail, mobile: cMobile, password: cPassword, adminRole: cRole });
      showToast(`${ROLE_LABELS[cRole]} created successfully!`);
      setCName(''); setCEmail(''); setCMobile(''); setCPassword(''); setCRole('kyc_admin');
      setView('list');
      fetchAdmins();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to create admin', 'err');
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async (adminId, adminName) => {
    if (!window.confirm(`Delete admin account for ${adminName}? This action cannot be undone.`)) return;
    try {
      await revokeAdminAccess(adminId);
      showToast(`${adminName}'s admin account has been deleted`);
      fetchAdmins();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete admin', 'err');
    }
  };

  const handleRoleChange = async (adminId, newRole) => {
    setChangingRole(adminId);
    try {
      await updateAdminRole(adminId, newRole);
      showToast('Role updated successfully!');
      setAdmins(prev => prev.map(a => a._id === adminId ? { ...a, adminRole: newRole } : a));
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update role', 'err');
    } finally {
      setChangingRole(null);
    }
  };

  const inputStyle = {
    width: '100%', padding: '9px 12px',
    background: 'var(--profile-input-bg,#fff)',
    border: '1.5px solid var(--profile-input-border,#E2E8F0)',
    borderRadius: 9, fontSize: 13, color: 'var(--gray-800)',
    outline: 'none', fontFamily: "'Inter',sans-serif",
    marginBottom: 12, boxSizing: 'border-box',
  };

  if (view === 'create') {
    return (
      <>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:18 }}>
          <button onClick={() => setView('list')} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--gray-400)', display:'flex', alignItems:'center', gap:4, fontSize:13, padding:0 }}>
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
            Back
          </button>
          <div style={{ fontSize:13.5, fontWeight:700, color:'var(--navy)' }}>Create Sub Admin</div>
        </div>

        <input style={inputStyle} placeholder="Full Name" value={cName} onChange={e => setCName(e.target.value)}
          onFocus={e=>e.target.style.borderColor='#2563EB'} onBlur={e=>e.target.style.borderColor='var(--profile-input-border,#E2E8F0)'}/>
        <input style={inputStyle} placeholder="Email Address" type="email" value={cEmail} onChange={e => setCEmail(e.target.value)}
          onFocus={e=>e.target.style.borderColor='#2563EB'} onBlur={e=>e.target.style.borderColor='var(--profile-input-border,#E2E8F0)'}/>
        <input style={inputStyle} placeholder="Mobile Number" value={cMobile} onChange={e => setCMobile(e.target.value)}
          onFocus={e=>e.target.style.borderColor='#2563EB'} onBlur={e=>e.target.style.borderColor='var(--profile-input-border,#E2E8F0)'}/>
        <input style={inputStyle} placeholder="Password (min 8 chars)" type="password" value={cPassword} onChange={e => setCPassword(e.target.value)}
          onFocus={e=>e.target.style.borderColor='#2563EB'} onBlur={e=>e.target.style.borderColor='var(--profile-input-border,#E2E8F0)'}/>

        {/* Role selector */}
        <div style={{ fontSize:11, fontWeight:600, color:'var(--gray-400)', textTransform:'uppercase', letterSpacing:'0.7px', marginBottom:8 }}>Admin Role</div>
        <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:16 }}>
          {SUB_ADMIN_ROLES.map(r => (
            <div key={r.value} onClick={() => setCRole(r.value)}
              style={{
                padding: '10px 14px', borderRadius: 10, cursor: 'pointer',
                border: `1.5px solid ${cRole === r.value ? '#2563EB' : 'var(--profile-input-border,#E2E8F0)'}`,
                background: cRole === r.value ? '#EFF6FF' : 'var(--profile-input-bg,#fff)',
                display: 'flex', alignItems: 'center', gap: 10, transition: 'all 0.15s',
              }}>
              <div style={{ width:10, height:10, borderRadius:'50%', background: ROLE_DOT[r.value], flexShrink:0 }}/>
              <div>
                <div style={{ fontSize:13, fontWeight:600, color: cRole===r.value?'#2563EB':'var(--navy)' }}>{r.label}</div>
                <div style={{ fontSize:11, color:'var(--gray-400)', marginTop:1 }}>{r.desc}</div>
              </div>
              {cRole === r.value && (
                <svg style={{ marginLeft:'auto' }} width="14" height="14" fill="none" stroke="#2563EB" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
              )}
            </div>
          ))}
        </div>

        <button onClick={handleCreate} disabled={creating} style={{
          width:'100%', padding:'11px',
          background: creating ? 'rgba(37,99,235,0.4)' : 'linear-gradient(135deg,#2563EB,#3B82F6)',
          border:'none', borderRadius:10, color:'#fff',
          fontSize:14, fontWeight:600, cursor: creating ? 'not-allowed' : 'pointer',
          fontFamily:"'Inter',sans-serif", boxShadow:'0 4px 16px rgba(37,99,235,0.3)',
        }}>
          {creating ? 'Creating...' : `Create ${ROLE_LABELS[cRole]}`}
        </button>
      </>
    );
  }

  // List view
  return (
    <>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
        <div style={{ fontSize:12, fontWeight:700, color:'var(--gray-400)', textTransform:'uppercase', letterSpacing:'0.7px' }}>
          Sub Admins ({admins.filter(a => a.adminRole !== 'super_admin').length})
        </div>
        <button onClick={() => setView('create')} style={{
          display:'flex', alignItems:'center', gap:6, padding:'7px 13px',
          background:'linear-gradient(135deg,#2563EB,#3B82F6)',
          border:'none', borderRadius:8, color:'#fff',
          fontSize:12, fontWeight:600, cursor:'pointer',
          fontFamily:"'Inter',sans-serif",
        }}>
          <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add Admin
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign:'center', padding:'24px', color:'var(--gray-400)', fontSize:13 }}>Loading admins...</div>
      ) : admins.filter(a => a.adminRole !== 'super_admin').length === 0 ? (
        <div style={{ textAlign:'center', padding:'24px', color:'var(--gray-400)', fontSize:13 }}>
          <div style={{ fontSize:28, marginBottom:8 }}>👥</div>
          No sub-admins yet. Click "Add Admin" to create one.
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {admins.filter(a => a.adminRole !== 'super_admin').map(a => {
            const dot = ROLE_DOT[a.adminRole] || '#94A3B8';
            const label = ROLE_LABELS[a.adminRole] || 'Admin';
            const isChanging = changingRole === a._id;
            return (
              <div key={a._id} style={{
                border: '1.5px solid var(--profile-input-border,#E2E8F0)',
                borderRadius: 12, padding: '12px 14px',
                background: 'var(--profile-input-bg,#fff)',
              }}>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                  <div style={{
                    width:34, height:34, borderRadius:9,
                    background:'linear-gradient(135deg,#4F46E5,#7C3AED)',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    color:'#fff', fontWeight:700, fontSize:13, flexShrink:0,
                  }}>
                    {(a.name||'?').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13.5, fontWeight:700, color:'var(--navy)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{a.name}</div>
                    <div style={{ fontSize:11, color:'var(--gray-400)', marginTop:1, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{a.email}</div>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:5, background:'var(--gray-100)', borderRadius:20, padding:'3px 9px', flexShrink:0 }}>
                    <div style={{ width:6, height:6, borderRadius:'50%', background:dot }}/>
                    <span style={{ fontSize:11, fontWeight:600, color:'var(--navy)' }}>{label}</span>
                  </div>
                </div>

                {/* Change role dropdown */}
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <select
                    value={a.adminRole || ''}
                    onChange={e => handleRoleChange(a._id, e.target.value)}
                    disabled={isChanging}
                    style={{
                      flex:1, padding:'7px 10px', fontSize:12, fontWeight:500,
                      border:'1.5px solid var(--profile-input-border,#E2E8F0)',
                      borderRadius:8, background:'var(--profile-input-bg,#fff)',
                      color:'var(--gray-800)', outline:'none', cursor: isChanging?'not-allowed':'pointer',
                      fontFamily:"'Inter',sans-serif",
                    }}>
                    {SUB_ADMIN_ROLES.map(r => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>

                  <button
                    onClick={() => handleRevoke(a._id, a.name)}
                    title="Delete admin account"
                    style={{
                      padding:'7px 10px', background:'#FEF2F2',
                      border:'1.5px solid #FECACA', borderRadius:8,
                      color:'#DC2626', fontSize:11, fontWeight:600,
                      cursor:'pointer', fontFamily:"'Inter',sans-serif",
                      whiteSpace:'nowrap', flexShrink:0,
                    }}>
                    Delete
                  </button>
                </div>
                {isChanging && (
                  <div style={{ fontSize:11, color:'#2563EB', marginTop:6, textAlign:'center' }}>Updating role...</div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

// ── Main AdminProfile Component ───────────────────────────────────────────────
export default function AdminProfile({ admin, onUpdate, onLogout, dark }) {
  const { adminRole } = useContext(AppCtx);
  const isSuperAdmin  = adminRole === 'super_admin';

  const [open, setOpen]   = useState(false);
  const [tab, setTab]     = useState('profile');
  const [toast, setToast] = useState(null);
  const panelRef          = useRef(null);

  // Profile fields
  const [name,     setName]     = useState(admin?.name  || 'Admin User');
  const [email,    setEmail]    = useState(admin?.email || 'admin@payo.com');
  const [phone,    setPhone]    = useState(admin?.phone || '+91 98765 43210');
  const [role]                  = useState(admin?.role  || 'Admin');
  const [department, setDept]   = useState('KYC Operations');
  const [location, setLocation] = useState('Hyderabad, India');

  // Security fields
  const [curPw,  setCurPw]  = useState('');
  const [newPw,  setNewPw]  = useState('');
  const [confPw, setConfPw] = useState('');
  const [showCur,  setShowCur]  = useState(false);
  const [showNew,  setShowNew]  = useState(false);
  const [showConf, setShowConf] = useState(false);
  const [twoFA,       setTwoFA]       = useState(true);
  const [loginAlerts, setLoginAlerts] = useState(true);

  // Preferences
  const [emailNotifs,  setEmailNotifs]  = useState(true);
  const [kycAlerts,    setKycAlerts]    = useState(true);
  const [weeklyReport, setWeeklyReport] = useState(false);

  const initials   = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const roleLabel  = ROLE_LABELS[adminRole] || role;
  const showToast  = (msg, type = 'ok') => setToast({ msg, type });

  // Close panel on outside click
  useEffect(() => {
    const h = (e) => { if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const saveProfile = () => {
    if (!name.trim() || !email.trim()) { showToast('Name and email are required.', 'err'); return; }
    if (!/\S+@\S+\.\S+/.test(email)) { showToast('Please enter a valid email.', 'err'); return; }
    onUpdate?.({ ...admin, name, email, phone });
    showToast('Profile updated successfully!');
  };

  const savePassword = async () => {
    if (!curPw) { showToast('Enter your current password.', 'err'); return; }
    if (newPw.length < 8) { showToast('New password must be at least 8 characters.', 'err'); return; }
    if (newPw !== confPw) { showToast('New passwords do not match.', 'err'); return; }
    try {
      await changePassword(curPw, newPw);
      setCurPw(''); setNewPw(''); setConfPw('');
      showToast('Password changed successfully!');
    } catch (err) {
      showToast(err.response?.data?.message || 'Password change failed', 'err');
    }
  };

  const pwStrength = (pw) => {
    if (!pw) return null;
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    if (score <= 1) return { label:'Weak',   color:'#EF4444', width:'25%' };
    if (score === 2) return { label:'Fair',   color:'#F59E0B', width:'50%' };
    if (score === 3) return { label:'Good',   color:'#3B82F6', width:'75%' };
    return            { label:'Strong', color:'#10B981', width:'100%' };
  };
  const strength = pwStrength(newPw);

  // Build tabs list — manage tab only for super_admin
  const tabs = [
    { key:'profile',     emoji:'👤', label:'Profile' },
    { key:'security',    emoji:'🔒', label:'Security' },
    { key:'preferences', emoji:'⚙️', label:'Preferences' },
    ...(isSuperAdmin ? [{ key:'manage', emoji:'👥', label:'Admins' }] : []),
  ];

  return (
    <div ref={panelRef} style={{ position: 'relative' }}>
      {/* ── Trigger chip ── */}
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          display:'flex', alignItems:'center', gap:9,
          background:'var(--gray-100)',
          border:`1.5px solid ${open ? 'var(--blue)' : 'var(--gray-200)'}`,
          borderRadius:10, padding:'6px 12px 6px 6px',
          cursor:'pointer', transition:'all 0.18s', userSelect:'none',
        }}
      >
        <div style={{
          width:32, height:32,
          background:'linear-gradient(135deg,#2563EB,#8B5CF6)',
          borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center',
          color:'#fff', fontWeight:700, fontSize:12,
          fontFamily:"'Space Grotesk',sans-serif",
        }}>{initials}</div>
        <div>
          <div style={{ fontSize:13, fontWeight:600, color:'var(--navy)', lineHeight:1.2 }}>{name}</div>
          <div style={{ fontSize:11, color:'var(--gray-400)', lineHeight:1.2 }}>{roleLabel}</div>
        </div>
        <svg width="14" height="14" fill="none" stroke="var(--gray-400)" strokeWidth="2" viewBox="0 0 24 24"
          style={{ transition:'transform 0.18s', transform: open ? 'rotate(180deg)' : 'rotate(0)' }}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </div>

      {/* ── Panel ── */}
      {open && (
        <div style={{
          position:'fixed', top:68, right:20,
          width:420, maxHeight:'calc(100vh - 90px)', overflowY:'auto',
          background:'var(--profile-panel-bg,#fff)',
          border:'1.5px solid var(--profile-panel-border,#E2E8F0)',
          borderRadius:18, boxShadow:'0 20px 60px rgba(0,0,0,0.15)',
          zIndex:800, animation:'slideUp 0.22s ease',
        }}>

          {/* Header */}
          <div style={{ background:'linear-gradient(135deg,#0D1B3E 0%,#1E3A6E 100%)', borderRadius:'16px 16px 0 0', padding:'28px 24px 24px', position:'relative' }}>
            <button onClick={() => setOpen(false)} style={{ position:'absolute', top:14, right:14, background:'rgba(255,255,255,0.12)', border:'none', borderRadius:8, width:30, height:30, cursor:'pointer', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>×</button>

            <div style={{ display:'flex', alignItems:'center', gap:16 }}>
              <div style={{ width:64, height:64, background:'linear-gradient(135deg,#2563EB,#8B5CF6)', borderRadius:18, display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, fontWeight:800, color:'#fff', fontFamily:"'Space Grotesk',sans-serif", border:'3px solid rgba(255,255,255,0.2)', boxShadow:'0 4px 20px rgba(0,0,0,0.3)', flexShrink:0 }}>{initials}</div>
              <div>
                <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:18, fontWeight:700, color:'#fff', letterSpacing:'-0.3px' }}>{name}</div>
                <div style={{ fontSize:12, color:'rgba(255,255,255,0.55)', marginTop:3 }}>{email}</div>
                <div style={{ marginTop:8, display:'flex', alignItems:'center', gap:6 }}>
                  <span style={{ background:'rgba(16,185,129,0.2)', color:'#6EE7B7', fontSize:11, fontWeight:600, padding:'3px 10px', borderRadius:20, border:'1px solid rgba(16,185,129,0.3)' }}>
                    ● {roleLabel}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginTop:20 }}>
              {[['KYC Reviewed','142'],['Approved','128'],['Rejected','14']].map(([l,v])=>(
                <div key={l} style={{ background:'rgba(255,255,255,0.08)', borderRadius:10, padding:'10px 12px', textAlign:'center' }}>
                  <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:18, fontWeight:700, color:'#fff' }}>{v}</div>
                  <div style={{ fontSize:10, color:'rgba(255,255,255,0.45)', fontWeight:500, marginTop:2 }}>{l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display:'flex', borderBottom:'1px solid var(--profile-panel-border,#E2E8F0)', padding:'0 8px' }}>
            {tabs.map(({ key, emoji, label }) => (
              <button key={key} onClick={() => setTab(key)} style={{
                flex:1, padding:'12px 6px', border:'none', background:'none',
                fontSize:12, fontWeight: tab===key?700:500,
                color: tab===key ? '#2563EB' : 'var(--gray-400)',
                cursor:'pointer', fontFamily:"'Inter',sans-serif",
                borderBottom: tab===key ? '2px solid #2563EB' : '2px solid transparent',
                transition:'all 0.18s', display:'flex', alignItems:'center', justifyContent:'center', gap:4,
              }}>
                <span>{emoji}</span>{label}
              </button>
            ))}
          </div>

          {/* Body */}
          <div style={{ padding:'22px 22px 18px' }}>

            {/* ── PROFILE TAB ── */}
            {tab === 'profile' && (
              <>
                <div style={{ fontSize:12, fontWeight:700, color:'var(--gray-400)', textTransform:'uppercase', letterSpacing:'0.7px', marginBottom:14 }}>Personal Information</div>
                <InputField label="Full Name" value={name} onChange={setName} icon={<svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>}/>
                <InputField label="Email Address" value={email} onChange={setEmail} type="email" icon={<svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>}/>
                <InputField label="Phone Number" value={phone} onChange={setPhone} icon={<svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.8 19.79 19.79 0 011 1.22 2 2 0 012.96 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L7.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>}/>
                <InputField label="Department" value={department} onChange={setDept} icon={<svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></svg>}/>
                <InputField label="Location" value={location} onChange={setLocation} icon={<svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>}/>
                <InputField label="Role" value={roleLabel} onChange={() => {}} disabled icon={<svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>}/>
                <button onClick={saveProfile} style={{ width:'100%', padding:'11px', marginTop:4, background:'linear-gradient(135deg,#2563EB,#3B82F6)', border:'none', borderRadius:10, color:'#fff', fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:"'Inter',sans-serif", boxShadow:'0 4px 16px rgba(37,99,235,0.3)', transition:'all 0.18s' }}>
                  Save Changes
                </button>
              </>
            )}

            {/* ── SECURITY TAB ── */}
            {tab === 'security' && (
              <>
                <div style={{ fontSize:12, fontWeight:700, color:'var(--gray-400)', textTransform:'uppercase', letterSpacing:'0.7px', marginBottom:14 }}>Change Password</div>
                <PasswordInput label="Current Password" value={curPw} onChange={setCurPw} show={showCur} onToggle={()=>setShowCur(p=>!p)}/>
                <PasswordInput label="New Password" value={newPw} onChange={setNewPw} show={showNew} onToggle={()=>setShowNew(p=>!p)}/>
                {newPw && strength && (
                  <div style={{ marginBottom:16, marginTop:-8 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                      <span style={{ fontSize:11, color:'var(--gray-400)' }}>Password strength</span>
                      <span style={{ fontSize:11, fontWeight:600, color:strength.color }}>{strength.label}</span>
                    </div>
                    <div style={{ height:4, background:'var(--gray-200)', borderRadius:4, overflow:'hidden' }}>
                      <div style={{ height:'100%', width:strength.width, background:strength.color, borderRadius:4, transition:'width 0.3s' }}/>
                    </div>
                  </div>
                )}
                <PasswordInput label="Confirm New Password" value={confPw} onChange={setConfPw} show={showConf} onToggle={()=>setShowConf(p=>!p)}/>
                {confPw && newPw !== confPw && <div style={{ fontSize:12, color:'#EF4444', marginTop:-10, marginBottom:12 }}>⚠️ Passwords do not match</div>}
                <button onClick={savePassword} style={{ width:'100%', padding:'11px', marginTop:4, background:'linear-gradient(135deg,#2563EB,#3B82F6)', border:'none', borderRadius:10, color:'#fff', fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:"'Inter',sans-serif", boxShadow:'0 4px 16px rgba(37,99,235,0.3)' }}>
                  Update Password
                </button>
                <div style={{ marginTop:24, borderTop:'1px solid var(--profile-panel-border,#E2E8F0)', paddingTop:20 }}>
                  <div style={{ fontSize:12, fontWeight:700, color:'var(--gray-400)', textTransform:'uppercase', letterSpacing:'0.7px', marginBottom:14 }}>Security Settings</div>
                  {[['Two-Factor Authentication','Add an extra layer of security',twoFA,setTwoFA],['Login Alerts','Get notified of new sign-ins',loginAlerts,setLoginAlerts]].map(([title,desc,val,setter])=>(
                    <div key={title} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 0', borderBottom:'1px solid var(--profile-panel-border,#E2E8F0)' }}>
                      <div style={{ flex:1, paddingRight:12 }}>
                        <div style={{ fontSize:13.5, fontWeight:600, color:'var(--navy)' }}>{title}</div>
                        <div style={{ fontSize:12, color:'var(--gray-400)', marginTop:2 }}>{desc}</div>
                      </div>
                      <Toggle checked={val} onChange={setter}/>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* ── PREFERENCES TAB ── */}
            {tab === 'preferences' && (
              <>
                <div style={{ fontSize:12, fontWeight:700, color:'var(--gray-400)', textTransform:'uppercase', letterSpacing:'0.7px', marginBottom:14 }}>Notifications</div>
                {[['Email Notifications','Receive updates via email',emailNotifs,setEmailNotifs,'📧'],['KYC Alerts','Get notified for new KYC submissions',kycAlerts,setKycAlerts,'🔔'],['Weekly Report','Receive a weekly summary report',weeklyReport,setWeeklyReport,'📊']].map(([title,desc,val,setter,emoji])=>(
                  <div key={title} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'13px 14px', background:'var(--pref-item-bg,#F8FAFC)', borderRadius:10, marginBottom:8, border:'1px solid var(--profile-panel-border,#E2E8F0)' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10, flex:1 }}>
                      <span style={{ fontSize:20 }}>{emoji}</span>
                      <div>
                        <div style={{ fontSize:13.5, fontWeight:600, color:'var(--navy)' }}>{title}</div>
                        <div style={{ fontSize:12, color:'var(--gray-400)', marginTop:1 }}>{desc}</div>
                      </div>
                    </div>
                    <Toggle checked={val} onChange={setter}/>
                  </div>
                ))}
                <button onClick={() => showToast('Preferences saved!')} style={{ width:'100%', padding:'11px', marginTop:16, background:'linear-gradient(135deg,#2563EB,#3B82F6)', border:'none', borderRadius:10, color:'#fff', fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:"'Inter',sans-serif" }}>
                  Save Preferences
                </button>
                <button onClick={onLogout} style={{ width:'100%', padding:'11px', marginTop:10, background:'transparent', border:'1.5px solid #EF4444', borderRadius:10, color:'#EF4444', fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:"'Inter',sans-serif", display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                  <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>
                  Sign Out
                </button>
              </>
            )}

            {/* ── MANAGE ADMINS TAB (super_admin only) ── */}
            {tab === 'manage' && isSuperAdmin && (
              <ManageAdminsTab showToast={showToast} />
            )}
          </div>
        </div>
      )}

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)}/>}
    </div>
  );
}