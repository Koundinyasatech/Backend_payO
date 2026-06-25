import { useState, useEffect } from 'react';
import { getAllUsers } from '../apis/adminApi';

const COLORS = ['#6C63FF','#FF6584','#43E97B','#FA8231','#E74C3C','#3498DB','#9B59B6','#1ABC9C','#E67E22','#2ECC71'];
function getInitials(name) { if (!name) return '?'; return name.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2); }

function maskAccount(num) {
  if (!num) return '—';
  const s = String(num);
  return s.length <= 4 ? s : '•••• •••• ' + s.slice(-4);
}

function kycLabel(v)  { return v ? 'Verified' : 'Pending'; }
function kycClass(v)  { return v ? 'b-approved' : 'b-pending'; }
function getCreationDate(u) {
  if (u.createdAt) return new Date(u.createdAt);
  if (u._id) return new Date(parseInt(String(u._id).substring(0, 8), 16) * 1000);
  return null;
}

// ── KYC Quick Modal ────────────────────────────────────────────────────────
function KycQuickModal({ u, onClose }) {
  const [kycDocs,  setKycDocs]  = useState(null);
  const [bankLive, setBankLive] = useState(null);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    if (!u) return;
    setLoading(true);
    setKycDocs(null);
    setBankLive(null);
    const token = localStorage.getItem('payo_token');
    const headers = { 'Authorization': `Bearer ${token}`, 'ngrok-skip-browser-warning': 'true' };
    const BASE = 'https://shadily-hazard-widget.ngrok-free.dev';

    Promise.allSettled([
      fetch(`${BASE}/api/admin/user-details/${u._id}/kyc`, { headers })
        .then(r => r.ok ? r.json() : null)
        .then(data => data?.kyc || data?.data || null)
        .catch(() => null),
      fetch(`${BASE}/api/admin/auth/user-bank-details/${u._id}`, { headers })
        .then(r => r.ok ? r.json() : null)
        .then(data => data?.bankDetails || null)
        .catch(() => null),
    ]).then(([kycRes, bankRes]) => {
      setKycDocs(kycRes.status === 'fulfilled' ? kycRes.value : null);
      setBankLive(bankRes.status === 'fulfilled' ? bankRes.value : null);
    }).finally(() => setLoading(false));
  }, [u]);

  if (!u) return null;

  const isVerified     = u.kycVerified === true;
  const isSubmitted    = !!(kycDocs);
  const bank           = bankLive || null;
  const hasBankDetails = !!(bank && (bank.bankName || bank.accountNumber));

  let kycStatusLabel, kycStatusColor, kycStatusBg, kycStatusBorder, kycIconBg, kycIcon, kycSubtext;
  if (isSubmitted && isVerified) {
    kycStatusLabel = '✓ Verified'; kycStatusColor = '#15803D'; kycStatusBg = '#DCFCE7';
    kycStatusBorder = '#86EFAC'; kycIconBg = '#DCFCE7'; kycIcon = '✅';
    kycSubtext = kycDocs?.reviewedAt
      ? `Verified on ${new Date(kycDocs.reviewedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`
      : 'KYC approved & wallet activated';
  } else if (isSubmitted && !isVerified) {
    kycStatusLabel = '⏳ Pending'; kycStatusColor = '#854D0E'; kycStatusBg = '#FEF9C3';
    kycStatusBorder = '#FDE68A'; kycIconBg = '#FEF9C3'; kycIcon = '⏳';
    kycSubtext = kycDocs?.createdAt
      ? `Submitted on ${new Date(kycDocs.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} · Awaiting review`
      : 'Documents uploaded · Awaiting review';
  } else {
    kycStatusLabel = '✗ Not Submitted'; kycStatusColor = '#94A3B8'; kycStatusBg = '#F1F5F9';
    kycStatusBorder = '#E2E8F0'; kycIconBg = '#F1F5F9'; kycIcon = '📄';
    kycSubtext = 'User has not uploaded KYC documents yet';
  }

  const bankStatusLabel  = hasBankDetails ? '✓ Added'  : '✗ Not Added';
  const bankStatusColor  = hasBankDetails ? '#15803D'  : '#94A3B8';
  const bankStatusBg     = hasBankDetails ? '#DCFCE7'  : '#F1F5F9';
  const bankStatusBorder = hasBankDetails ? '#86EFAC'  : '#E2E8F0';
  const bankIconBg       = hasBankDetails ? '#DCFCE7'  : '#F1F5F9';
  const bankSubtext      = hasBankDetails
    ? `${bank.bankName || 'Bank'} · ••••${String(bank.accountNumber || '').slice(-4) || '****'}`
    : 'No bank account linked yet';

  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 440 }}>
        <div className="modal-head">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 42, height: 42, borderRadius: 11, background: u.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
              {u.initials}
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 15, color: 'var(--navy)' }}>{u.name || 'Unknown'}</h3>
              <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 2 }}>KYC &amp; Bank Status</div>
            </div>
          </div>
          <button className="btn btn-ghost icon-btn" onClick={onClose}>
            <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="modal-body" style={{ padding: '20px 22px' }}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[1, 2, 3].map(i => (
                <div key={i} style={{ height: 76, borderRadius: 14, background: 'linear-gradient(90deg,var(--skeleton-a,#E2E8F0) 25%,var(--skeleton-b,#F1F5F9) 50%,var(--skeleton-a,#E2E8F0) 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }}/>
              ))}
              <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 2 }}>KYC Documents</div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderRadius: 14, border: `1.5px solid ${isSubmitted ? '#86EFAC' : '#E2E8F0'}`, background: isSubmitted ? '#F0FDF4' : 'var(--gray-50,#F8FAFC)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, fontSize: 18, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: isSubmitted ? '#DCFCE7' : '#F1F5F9' }}>📄</div>
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--navy)' }}>Documents Submitted</div>
                    <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 3 }}>
                      {isSubmitted
                        ? `Submitted on ${kycDocs?.createdAt ? new Date(kycDocs.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}`
                        : 'No documents uploaded yet'}
                    </div>
                  </div>
                </div>
                <div style={{ padding: '4px 11px', borderRadius: 20, fontSize: 11.5, fontWeight: 700, flexShrink: 0, background: isSubmitted ? '#DCFCE7' : '#F1F5F9', color: isSubmitted ? '#15803D' : '#94A3B8' }}>
                  {isSubmitted ? '✓ Submitted' : '✗ Pending'}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderRadius: 14, border: `1.5px solid ${kycStatusBorder}`, background: isVerified ? '#F0FDF4' : isSubmitted ? '#FFFBEB' : 'var(--gray-50,#F8FAFC)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, fontSize: 18, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: kycIconBg }}>{kycIcon}</div>
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--navy)' }}>KYC Verification</div>
                    <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 3 }}>{kycSubtext}</div>
                  </div>
                </div>
                <div style={{ padding: '4px 11px', borderRadius: 20, fontSize: 11.5, fontWeight: 700, flexShrink: 0, background: kycStatusBg, color: kycStatusColor }}>
                  {kycStatusLabel}
                </div>
              </div>

              <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.8px', marginTop: 6, marginBottom: 2 }}>Bank Details</div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderRadius: 14, border: `1.5px solid ${bankStatusBorder}`, background: hasBankDetails ? '#F0FDF4' : 'var(--gray-50,#F8FAFC)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, fontSize: 18, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: bankIconBg }}>🏦</div>
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--navy)' }}>Bank Details</div>
                    <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 3 }}>{bankSubtext}</div>
                  </div>
                </div>
                <div style={{ padding: '4px 11px', borderRadius: 20, fontSize: 11.5, fontWeight: 700, flexShrink: 0, background: bankStatusBg, color: bankStatusColor }}>
                  {bankStatusLabel}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="modal-foot">
          <button className="btn btn-outline" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

// ── Full User Detail Modal ─────────────────────────────────────────────────
function UserModal({ u, onClose }) {
  const [tab, setTab] = useState('details');
  const [txns, setTxns]                       = useState([]);
  const [txnLoading, setTxnLoading]           = useState(false);
  const [referralData, setReferralData]       = useState(null);
  const [referralLoading, setReferralLoading] = useState(false);
  const [bankData, setBankData]               = useState(null);
  const [bankLoading, setBankLoading]         = useState(false);

  useEffect(() => {
    if (!u || tab !== 'transactions') return;
    setTxns([]);
    setTxnLoading(true);
    const token = localStorage.getItem('payo_token');
    fetch(`https://shadily-hazard-widget.ngrok-free.dev/api/admin/user-details/${u._id}/transactions`, {
      headers: { 'Authorization': `Bearer ${token}`, 'ngrok-skip-browser-warning': 'true' }
    })
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then(data => {
        const arr = data?.transactions || [];
        setTxns(Array.isArray(arr) ? arr : []);
      })
      .catch(err => { console.error('Transactions fetch failed:', err); setTxns([]); })
      .finally(() => setTxnLoading(false));
  }, [tab, u]);

  useEffect(() => {
    if (!u || tab !== 'referral') return;
    setReferralLoading(true);
    const token = localStorage.getItem('payo_token');
    fetch(`https://shadily-hazard-widget.ngrok-free.dev/api/admin/user-details/${u._id}/referral`, {
      headers: { 'Authorization': `Bearer ${token}`, 'ngrok-skip-browser-warning': 'true' }
    })
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then(data => { setReferralData(data?.referral || null); })
      .catch(err => { console.error('Referrals fetch failed:', err); setReferralData(null); })
      .finally(() => setReferralLoading(false));
  }, [tab, u]);

  useEffect(() => {
    if (!u || tab !== 'bank') return;
    setBankData(null);
    setBankLoading(true);
    const token = localStorage.getItem('payo_token');
    fetch(`https://shadily-hazard-widget.ngrok-free.dev/api/admin/auth/user-bank-details/${u._id}`, {
      headers: { 'Authorization': `Bearer ${token}`, 'ngrok-skip-browser-warning': 'true' }
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => setBankData(data?.bankDetails || null))
      .catch(() => setBankData(null))
      .finally(() => setBankLoading(false));
  }, [tab, u]);

  if (!u) return null;

  const isVerified = u.kycVerified === true;
  const bank       = bankData || u.bankDetails || null;
  const creationDt = getCreationDate(u);

  const TABS = [
    ['details',      '👤 Details'],
    ['bank',         '🏦 Bank Details'],
    ['wallet',       '💰 Wallet'],
    ['referral',     '🎁 Referral Info'],
    ['transactions', '💸 Transactions'],
  ];

  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 580 }}>

        <div className="modal-head">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: u.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, fontWeight: 700, color: '#fff' }}>
              {u.initials}
            </div>
            <div>
              <h3 style={{ margin: 0 }}>{u.name || 'Unknown'}</h3>
              <div style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 7 }}>
                <span>{String(u._id).slice(-10)}</span>
                <span className={`badge ${kycClass(isVerified)}`} style={{ fontSize: 10 }}>{kycLabel(isVerified)}</span>
              </div>
            </div>
          </div>
          <button className="btn btn-ghost icon-btn" onClick={onClose}>
            <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="modal-tabs" style={{ overflowX: 'auto', display: 'flex', whiteSpace: 'nowrap' }}>
          {TABS.map(([k, l]) => (
            <button key={k} className={`mtab${tab === k ? ' act' : ''}`} onClick={() => setTab(k)}>{l}</button>
          ))}
        </div>

        <div className="modal-body">

          {/* DETAILS TAB */}
          {tab === 'details' && (
            <div>
              <div className="section-title" style={{ marginBottom: 12 }}>Personal Information</div>
              <div className="detail-grid">
                {[
                  ['Full Name',      u.name    || '—'],
                  ['Email',          u.email   || '—'],
                  ['Mobile',         u.mobile  || '—'],
                  ['Role',           u.role    || 'user'],
                  ['KYC Status',     kycLabel(isVerified)],
                  ['Wallet Address', u.walletAddress || '—'],
                  ['Wallet Balance', `${(u.walletBalance ?? 0).toLocaleString()} PYO`],
                  ['Joined',         creationDt ? creationDt.toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) : '—'],
                ].map(([l, v]) => (
                  <div className="detail-item" key={l}>
                    <label>{l}</label>
                    <span style={{ wordBreak: 'break-all' }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* BANK DETAILS TAB */}
          {tab === 'bank' && (
            <div>
              {bankLoading ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--gray-400)', fontSize: 13 }}>
                  Loading bank details...
                </div>
              ) : bank ? (
                <>
                  <div style={{ background: 'linear-gradient(135deg,#1E3A6E,#0D1B3E)', borderRadius: 14, padding: '20px 22px', marginBottom: 20, color: '#fff', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: -25, right: -25, width: 110, height: 110, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }}/>
                    <div style={{ position: 'absolute', bottom: -20, left: -10, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }}/>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 600, opacity: 0.6, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 4 }}>Bank Name</div>
                        <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 17, fontWeight: 700 }}>{bank.bankName}</div>
                      </div>
                      <div style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 8, padding: '4px 10px', fontSize: 12, fontWeight: 600 }}>{bank.accountType}</div>
                    </div>
                    <div style={{ marginBottom: 14 }}>
                      <div style={{ fontSize: 10, fontWeight: 600, opacity: 0.6, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 4 }}>Account Number</div>
                      <div style={{ fontFamily: 'monospace', fontSize: 16, fontWeight: 600, letterSpacing: '2px' }}>{maskAccount(bank.accountNumber)}</div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 600, opacity: 0.6, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 3 }}>Account Holder</div>
                        <div style={{ fontSize: 14, fontWeight: 600 }}>{bank.accountHolderName}</div>
                      </div>
                      <div style={{ background: bank.isTpinCreated ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.2)', borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600, color: bank.isTpinCreated ? '#6EE7B7' : '#FCA5A5' }}>
                        {bank.isTpinCreated ? '🔐 TPIN Set' : '⚠️ No TPIN'}
                      </div>
                    </div>
                  </div>
                  <div className="section-title" style={{ marginBottom: 12 }}>Bank Details</div>
                  <div className="detail-grid">
                    {[
                      ['Account Holder', bank.accountHolderName],
                      ['Bank Name',      bank.bankName],
                      ['Account No.',    maskAccount(bank.accountNumber)],
                      ['IFSC Code',      bank.ifscCode],
                      ['Account Type',   bank.accountType],
                      ['Mobile (Bank)',  bank.mobileNumber],
                      ['TPIN Created',   bank.isTpinCreated ? 'Yes ✓' : 'No'],
                      ['Added On',       bank.createdAt ? new Date(bank.createdAt).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) : '—'],
                    ].map(([l, v]) => (
                      <div className="detail-item" key={l}><label>{l}</label><span>{v}</span></div>
                    ))}
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                  <div style={{ fontSize: 36, marginBottom: 12 }}>🏦</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--navy)', marginBottom: 6 }}>No Bank Account Added</div>
                  <div style={{ fontSize: 13, color: 'var(--gray-400)', lineHeight: 1.6 }}>This user has not linked a bank account yet.</div>
                </div>
              )}
            </div>
          )}

          {/* WALLET TAB */}
          {tab === 'wallet' && (
            <div>
              <div style={{ background: isVerified ? 'linear-gradient(135deg,#0D1B3E,#1E3A6E)' : 'linear-gradient(135deg,#374151,#4B5563)', borderRadius: 14, padding: '22px 24px', marginBottom: 20, color: '#fff', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }}/>
                <div style={{ fontSize: 11, fontWeight: 600, opacity: 0.6, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 6 }}>PYO Token Balance</div>
                <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 32, fontWeight: 700, letterSpacing: '-1px' }}>
                  {(u.walletBalance ?? 0).toLocaleString()}
                  <span style={{ fontSize: 18, opacity: 0.65, marginLeft: 8 }}>PYO</span>
                </div>
                <div style={{ marginTop: 14, display: 'flex', justifyContent: 'space-between', fontSize: 12, opacity: 0.65 }}>
                  <span>KYC: {kycLabel(isVerified)}</span>
                  <span style={{ background: isVerified ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)', padding: '2px 10px', borderRadius: 20, color: isVerified ? '#6EE7B7' : '#FCA5A5', fontWeight: 600 }}>
                    {isVerified ? '● Active' : '● Inactive'}
                  </span>
                </div>
              </div>
              <div className="section-title" style={{ marginBottom: 12 }}>Wallet Information</div>
              <div className="detail-grid">
                {[
                  ['Wallet Status',  isVerified ? 'Active' : 'Inactive'],
                  ['Balance',        `${(u.walletBalance ?? 0).toLocaleString()} PYO`],
                  ['KYC Verified',   isVerified ? 'Yes ✓' : 'No'],
                  ['Wallet Address', u.walletAddress || '—'],
                ].map(([l, v]) => (
                  <div className="detail-item" key={l}>
                    <label>{l}</label>
                    <span style={{ wordBreak: 'break-all', fontSize: l === 'Wallet Address' ? 11 : 'inherit' }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* REFERRAL TAB */}
          {tab === 'referral' && (
            <div>
              {referralLoading ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--gray-400)' }}>Loading referral data...</div>
              ) : (
                <>
                  <div style={{ background: 'linear-gradient(135deg,#0D1B3E,#152347,#1E3A6E)', borderRadius: 14, padding: '20px 22px', marginBottom: 20, color: '#fff', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position:'absolute', top:-20, right:-20, width:100, height:100, borderRadius:'50%', background:'rgba(255,255,255,0.05)' }}/>
                    <div style={{ position:'absolute', bottom:-30, left:-10, width:80, height:80, borderRadius:'50%', background:'rgba(255,255,255,0.03)' }}/>
                    <div style={{ fontSize: 11, fontWeight: 600, opacity: 0.6, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 6 }}>Referral Code</div>
                    <div style={{ fontFamily: 'monospace', fontSize: 24, fontWeight: 700, letterSpacing: '3px' }}>
                      {referralData?.myReferralCode || u.referralCode || '—'}
                    </div>
                    <div style={{ marginTop: 12, fontSize: 12, opacity: 0.7 }}>
                      Total Referrals: <strong>{referralData?.totalReferrals ?? u.referralCount ?? '—'}</strong>
                    </div>
                  </div>
                  <div className="section-title" style={{ marginBottom: 12 }}>Referral Information</div>
                  <div className="detail-grid">
                    {[
                      ['Referral Code',
                        referralData?.myReferralCode || u.referralCode || '—'],
                      ['Referred By',
                        referralData?.referredByUser
                          ? (referralData.referredByUser.name || referralData.referredByUser.mobile || referralData.referredByCode || '—')
                          : (referralData?.referredByCode || u.referredBy || '—')],
                      ['Total Referrals',
                        referralData?.totalReferrals ?? u.referralCount ?? '—'],
                      ['Referral Earnings',
                        referralData?.referralEarnings != null
                          ? `${Number(referralData.referralEarnings).toLocaleString()} PYO`
                          : u.referralEarnings != null
                            ? `${Number(u.referralEarnings).toLocaleString()} PYO`
                            : '0 PYO'],
                    ].map(([l, v]) => (
                      <div className="detail-item" key={l}><label>{l}</label><span>{String(v)}</span></div>
                    ))}
                  </div>
                  {Array.isArray(referralData?.referredUsers) && referralData.referredUsers.length > 0 && (
                    <>
                      <div className="section-title" style={{ margin: '20px 0 12px' }}>Referred Users</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {referralData.referredUsers.map((ref, i) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: 10, border: '1.5px solid var(--gray-200)', background: 'var(--gray-50,#F8FAFC)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{ width: 32, height: 32, borderRadius: 9, background: 'linear-gradient(135deg,#6C63FF,#8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                                {(ref.name || ref.mobile || '?').charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--navy)' }}>{ref.name || ref.mobile || '—'}</div>
                                <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 2 }}>
                                  {ref.joinedAt ? new Date(ref.joinedAt).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) : '—'}
                                </div>
                              </div>
                            </div>
                            <div style={{ fontSize: 11, fontWeight: 600, color: '#7C3AED', background: '#F5F3FF', padding: '3px 10px', borderRadius: 20 }}>
                              Referred
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                  {referralData && (!Array.isArray(referralData?.referredUsers) || referralData.referredUsers.length === 0) && (
                    <div style={{ textAlign: 'center', padding: '16px', color: 'var(--gray-400)', fontSize: 12 }}>
                      No users referred yet
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* TRANSACTIONS TAB */}
          {tab === 'transactions' && (
            <div>
              {txnLoading ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--gray-400)' }}>Loading transactions...</div>
              ) : txns.length > 0 ? (
                <>
                  <div className="section-title" style={{ marginBottom: 12 }}>Transaction History</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {txns.map((t, i) => {
                      const isReferralBonus = t.senderWallet === 'REFERRAL_BONUS';
                      const isReceived      = isReferralBonus || t.direction === 'received';
                      const isCredit        = isReceived;
                      const counterparty    = isReferralBonus
                        ? 'Referral Bonus'
                        : isReceived
                          ? (t.senderName   || (t.senderWallet   ? t.senderWallet.slice(0, 8) + '...'   : 'Unknown'))
                          : (t.receiverName || (t.receiverWallet ? t.receiverWallet.slice(0, 8) + '...' : 'Unknown'));

                      return (
                        <div key={t.transactionId || t._id || i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 14px', borderRadius: 10, border: '1.5px solid var(--gray-200)', background: 'var(--gray-50,#F8FAFC)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 34, height: 34, borderRadius: 10, background: isCredit ? '#F0FDF4' : '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: isCredit ? '#059669' : '#DC2626', flexShrink: 0 }}>
                              {isCredit ? '↓' : '↑'}
                            </div>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--navy)' }}>
                                {isCredit ? 'Received from' : 'Sent to'} {counterparty}
                              </div>
                              <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                                {t.createdAt ? new Date(t.createdAt).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) : '—'}
                                {t.status && (
                                  <span style={{ background: t.status === 'success' ? '#DCFCE7' : t.status === 'pending' ? '#FEF9C3' : '#FEE2E2', color: t.status === 'success' ? '#15803D' : t.status === 'pending' ? '#854D0E' : '#DC2626', padding: '1px 7px', borderRadius: 20, fontSize: 10, fontWeight: 600 }}>
                                    {t.status}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: isCredit ? '#059669' : '#DC2626', flexShrink: 0 }}>
                            {isCredit ? '+' : '-'}{Math.abs(t.amount ?? 0).toLocaleString()} PYO
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                  <div style={{ fontSize: 36, marginBottom: 12 }}>📋</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--navy)', marginBottom: 6 }}>No Transactions Yet</div>
                  <div style={{ fontSize: 13, color: 'var(--gray-400)' }}>This user has no transaction history.</div>
                </div>
              )}
            </div>
          )}

        </div>

        <div className="modal-foot">
          <button className="btn btn-outline" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

// ── Main Users Page ────────────────────────────────────────────────────────
export default function Users() {
  const [users, setUsers]     = useState([]);
  const [totals, setTotals]   = useState({ total:0, verified:0, pending:0 });
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [search, setSearch]   = useState('');
  const [fKYC, setFKYC]       = useState('All');
  const [sel, setSel]         = useState(null);
  const [kycSel, setKycSel]   = useState(null);
  const [page, setPage]       = useState(1);
  const per = 8;

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const res = await getAllUsers();
        const arr = res.data?.users || res.data?.data?.users || res.data?.result?.users || [];

        const updatedUsers = await Promise.all(
          arr.map(async (u, idx) => {
            try {
              const token = localStorage.getItem('payo_token');
              const response = await fetch(
                `https://shadily-hazard-widget.ngrok-free.dev/api/wallet/profile?userId=${u._id}`,
                { method: 'GET', headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true', 'Authorization': `Bearer ${token}` } }
              );
              if (!response.ok) throw new Error(`HTTP ${response.status}`);
              const walletRes = await response.json();
              return {
                ...u,
                walletAddress:    u.walletAddress    || walletRes?.data?.walletAddress    || '—',
                walletBalance:    u.walletBalance    ?? walletRes?.data?.balance          ?? 0,
                referralCode:     walletRes?.data?.referralCode   || '—',
                referredBy:       walletRes?.data?.referredBy     || u.referredBy         || '—',
                referralCount:    walletRes?.data?.referralCount  ?? u.referralCount      ?? 0,
                referralEarnings: walletRes?.data?.referralEarnings ?? u.referralEarnings ?? 0,
                transactionCount: walletRes?.data?.transactionCount ?? 0,
                bankDetails:      walletRes?.data?.bankDetails    || walletRes?.bankDetails || null,
                initials: getInitials(u.name),
                color: COLORS[idx % COLORS.length],
              };
            } catch {
              return {
                ...u,
                walletAddress: '—', walletBalance: u.walletBalance ?? 0,
                referralCode: u.referralCode || '—', referredBy: u.referredBy || '—',
                referralCount: u.referralCount ?? 0, referralEarnings: u.referralEarnings ?? 0,
                transactionCount: 0, initials: getInitials(u.name), color: COLORS[idx % COLORS.length],
              };
            }
          })
        );

        setUsers(updatedUsers);
        setTotals({ total: res.data?.total ?? arr.length, verified: res.data?.verified ?? 0, pending: res.data?.pending ?? 0 });
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load users');
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const filtered = users.filter(u => {
    const mk = fKYC === 'All' || (fKYC === 'Verified' && u.kycVerified === true) || (fKYC === 'Pending' && u.kycVerified === false);
    const q  = search.toLowerCase();
    const ms = !search || (u.name||'').toLowerCase().includes(q) || (u.email||'').toLowerCase().includes(q) || (u.mobile||'').toLowerCase().includes(q) || String(u._id).toLowerCase().includes(q);
    return mk && ms;
  });

  const tp    = Math.max(1, Math.ceil(filtered.length / per));
  const paged = filtered.slice((page - 1) * per, page * per);

  return (
    <div className="page">
      <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>

      <div className="page-header">
        <div className="page-header-left">
          <h2>Users</h2>
          <p>All registered PayO users with KYC status, wallet balance and bank details.</p>
        </div>
        <div style={{ display:'flex', gap:10 }}>
          {[
            { label:'Total',    val:totals.total,    color:'#2563EB', bg:'#EFF6FF' },
            { label:'Verified', val:totals.verified, color:'#059669', bg:'#F0FDF4' },
            { label:'Pending',  val:totals.pending,  color:'#D97706', bg:'#FFFBEB' },
          ].map(s => (
            <div key={s.label} style={{ background:s.bg, border:`1.5px solid ${s.color}33`, borderRadius:10, padding:'9px 16px', textAlign:'center', minWidth:70 }}>
              <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:18, fontWeight:800, color:s.color }}>{loading ? '—' : s.val.toLocaleString()}</div>
              <div style={{ fontSize:11, color:s.color, fontWeight:600, opacity:0.8 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div style={{ background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:10, padding:'12px 16px', marginBottom:18, color:'#DC2626', fontSize:13 }}>
          Error: {error}
        </div>
      )}

      <div className="card">
        <div className="filter-bar">
          <div className="search-field">
            <svg width="14" height="14" fill="none" stroke="var(--gray-400)" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input placeholder="Search by name, email, mobile or ID..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}/>
          </div>
          <select className="filter-select" value={fKYC} onChange={e => { setFKYC(e.target.value); setPage(1); }}>
            <option value="All">All Users</option>
            <option value="Verified">KYC Verified</option>
            <option value="Pending">KYC Pending</option>
          </select>
          <div className="filter-count">{loading ? '—' : `${filtered.length} users`}</div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Mobile</th>
                <th>Wallet Address</th>
                <th>Balance</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paged.map(u => (
                <tr key={u._id}>
                  <td>
                    <div className="user-cell">
                      <div className="avatar" style={{ background: u.color }}>{u.initials}</div>
                      <div>
                        <div className="uname">{u.name || '—'}</div>
                        <div className="uid">{String(u._id).slice(-10)}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontSize:13, color:'var(--gray-600)' }}>{u.email || '—'}</td>
                  <td style={{ fontSize:13, color:'var(--gray-600)' }}>{u.mobile || '—'}</td>
                  <td style={{ fontSize:12, fontFamily:'monospace', maxWidth:160, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {u.walletAddress || '—'}
                  </td>
                  <td>
                    <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                      <span style={{ fontWeight:700, fontSize:13, color:(u.walletBalance??0)>0?'var(--navy)':'var(--gray-400)' }}>
                        {(u.walletBalance ?? 0).toLocaleString()}
                      </span>
                      <span style={{ fontSize:10, fontWeight:600, color:'var(--gray-400)', background:'var(--gray-100)', padding:'1px 5px', borderRadius:5 }}>PYO</span>
                    </div>
                  </td>
                  <td>
                    <div className="act-group">
                      <button
                        onClick={() => setSel(u)}
                        style={{ fontSize:12, fontWeight:600, padding:'5px 14px', borderRadius:20, cursor:'pointer', background:'#EFF6FF', border:'1.5px solid #93C5FD', color:'#2563EB', transition:'all 0.18s', fontFamily:"'Inter',sans-serif" }}
                        onMouseEnter={e => { e.currentTarget.style.background='#2563EB'; e.currentTarget.style.color='#fff'; e.currentTarget.style.borderColor='#2563EB'; }}
                        onMouseLeave={e => { e.currentTarget.style.background='#EFF6FF'; e.currentTarget.style.color='#2563EB'; e.currentTarget.style.borderColor='#93C5FD'; }}
                      >
                        View
                      </button>
                      <button
                        onClick={() => setKycSel(u)}
                        style={{ fontSize:12, fontWeight:600, padding:'5px 14px', borderRadius:20, cursor:'pointer', background:'#F5F3FF', border:'1.5px solid #C4B5FD', color:'#7C3AED', transition:'all 0.18s', fontFamily:"'Inter',sans-serif" }}
                        onMouseEnter={e => { e.currentTarget.style.background='#7C3AED'; e.currentTarget.style.color='#fff'; e.currentTarget.style.borderColor='#7C3AED'; }}
                        onMouseLeave={e => { e.currentTarget.style.background='#F5F3FF'; e.currentTarget.style.color='#7C3AED'; e.currentTarget.style.borderColor='#C4B5FD'; }}
                      >
                        KYC
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && paged.length === 0 && <div className="empty">No users found matching your filters.</div>}
        </div>

        {!loading && filtered.length > 0 && (
          <div className="pagination">
            <div className="pag-info">Showing {Math.min((page-1)*per+1, filtered.length)}-{Math.min(page*per, filtered.length)} of {filtered.length}</div>
            <div className="pag-btns">
              <button className="pag-btn" disabled={page===1} onClick={() => setPage(p=>p-1)}>&#8249;</button>
              {Array.from({ length:tp }, (_,i) => (
                <button key={i+1} className={`pag-btn${page===i+1?' act':''}`} onClick={() => setPage(i+1)}>{i+1}</button>
              ))}
              <button className="pag-btn" disabled={page===tp} onClick={() => setPage(p=>p+1)}>&#8250;</button>
            </div>
          </div>
        )}
      </div>

      {sel    && <UserModal     u={sel}    onClose={() => setSel(null)}    />}
      {kycSel && <KycQuickModal u={kycSel} onClose={() => setKycSel(null)} />}
    </div>
  );
}