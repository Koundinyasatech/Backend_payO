import { useState, useEffect, useCallback, useRef } from 'react';
import { getTransactions, getTransactionDetails } from '../apis/adminApi';

// ── Helpers ───────────────────────────────────────────────────────────────────
function Skeleton({ w = '100%', h = 14, r = 6, style = {} }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: r,
      background: 'linear-gradient(90deg,var(--skeleton-a,#E2E8F0) 25%,var(--skeleton-b,#F1F5F9) 50%,var(--skeleton-a,#E2E8F0) 75%)',
      backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite', ...style,
    }}/>
  );
}

function useCopy() {
  const [copied, setCopied] = useState('');
  const copy = useCallback((val, key) => {
    navigator.clipboard.writeText(val).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(''), 2000);
    }).catch(() => {});
  }, []);
  return [copied, copy];
}

function truncateWallet(addr) {
  if (!addr || addr === '—' || addr === 'REFERRAL_BONUS') return addr || '—';
  if (addr.length <= 18) return addr;
  return addr.slice(0, 10) + '…' + addr.slice(-6);
}

function formatDate(str, full = false) {
  if (!str) return '—';
  const d = new Date(str);
  if (full) {
    return d.toLocaleString('en-IN', {
      day: '2-digit', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
  }
  return d.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// Status config
const STATUS_CFG = {
  success: { cls: 'b-approved', label: 'Success', color: '#059669', dot: '#10B981' },
  pending: { cls: 'b-pending',  label: 'Pending', color: '#D97706', dot: '#F59E0B' },
  failed:  { cls: 'b-failed',   label: 'Failed',  color: '#DC2626', dot: '#EF4444' },
};
function getStatus(s) {
  return STATUS_CFG[String(s || '').toLowerCase()] ||
    { cls: 'b-review', label: s || '—', color: '#2563EB', dot: '#3B82F6' };
}

// Type config — derived from senderWallet since Transaction model has no type field
// REFERRAL_BONUS = reward, otherwise = transfer
const TYPE_CFG = {
  reward:   { icon: '★', label: 'Reward',   grad: 'linear-gradient(135deg,#B45309,#F59E0B)', glow: 'rgba(245,158,11,0.3)',  credit: true  },
  transfer: { icon: '⇄', label: 'Transfer', grad: 'linear-gradient(135deg,#1D4ED8,#3B82F6)', glow: 'rgba(59,130,246,0.3)',  credit: false },
};
function deriveType(txn) {
  if ((txn.senderWallet || '').toUpperCase() === 'REFERRAL_BONUS') return 'reward';
  return 'transfer';
}
function getType(txn) {
  return TYPE_CFG[deriveType(txn)];
}

const PAGE_SIZE = 10;

// Date filter options — mapped to what backend supports
const DATE_OPTS = [
  { label: 'All Time',    value: 'all'   },
  { label: 'Today',       value: 'today' },
  { label: 'Last 7 Days', value: 'week'  },
  { label: 'Last 30 Days',value: 'month' },
];

// ── CopyField ─────────────────────────────────────────────────────────────────
function CopyField({ val, copyId, copied, onCopy, truncate = false }) {
  if (!val || val === '—') return <span style={{ fontSize: 13, color: 'var(--gray-400)' }}>—</span>;
  const display = truncate ? truncateWallet(val) : val;
  const ok = copied === copyId;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
      <span style={{ fontFamily: 'monospace', fontSize: 12.5, color: 'var(--navy)', userSelect: 'text' }} title={val}>
        {display}
      </span>
      <button
        onClick={e => { e.stopPropagation(); onCopy(val, copyId); }}
        title="Copy"
        style={{
          flexShrink: 0, width: 24, height: 24, borderRadius: 7,
          border: `1.5px solid ${ok ? '#86EFAC' : 'var(--gray-200)'}`,
          background: ok ? '#F0FDF4' : 'var(--gray-100,#F1F5F9)',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.15s',
        }}
      >
        {ok
          ? <svg width="10" height="10" fill="none" stroke="#059669" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
          : <svg width="10" height="10" fill="none" stroke="var(--gray-400)" strokeWidth="2" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
        }
      </button>
    </div>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon, iconBg, color, sub, loading }) {
  return (
    <div className="stat-card" style={{ borderRadius: 16, padding: '20px 22px' }}>
      <div className="stat-top">
        <div>
          <div className="stat-label">{label}</div>
          <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 28, fontWeight: 800, color: 'var(--stat-card-value,#0D1B3E)', letterSpacing: '-1px', lineHeight: 1, marginTop: 6 }}>
            {loading ? <Skeleton w={80} h={28} r={6}/> : value}
          </div>
          {sub && !loading && (
            <div style={{ fontSize: 11.5, color, fontWeight: 600, marginTop: 5 }}>{sub}</div>
          )}
        </div>
        <div style={{ width: 44, height: 44, borderRadius: 13, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
          {icon}
        </div>
      </div>
    </div>
  );
}

// ── Date dropdown ─────────────────────────────────────────────────────────────
function DateDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  const selected = DATE_OPTS.find(o => o.value === value) || DATE_OPTS[0];
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 7,
          padding: '8px 14px', borderRadius: 9,
          background: open ? '#EEF2FF' : 'var(--filter-btn-bg,#F5F3FF)',
          border: '1.5px solid var(--filter-btn-border,#C7D2FE)',
          color: 'var(--filter-btn-color,#4F46E5)',
          fontSize: 13, fontWeight: 600, cursor: 'pointer',
          fontFamily: "'Inter',sans-serif", whiteSpace: 'nowrap',
        }}
      >
        <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <rect x="3" y="4" width="18" height="18" rx="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        {selected.label}
        {value !== 'all' && (
          <span style={{ background: '#4F46E5', color: '#fff', borderRadius: 20, padding: '1px 6px', fontSize: 10, fontWeight: 700 }}>1</span>
        )}
        <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.18s' }}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0,
          background: 'var(--dropdown-bg,#fff)', border: '1.5px solid var(--dropdown-border,#E2E8F0)',
          borderRadius: 12, padding: 6, minWidth: 175,
          boxShadow: '0 12px 40px rgba(0,0,0,0.12)', zIndex: 500,
        }}>
          {DATE_OPTS.map(opt => (
            <div
              key={opt.value}
              onClick={() => { onChange(opt.value); setOpen(false); }}
              style={{
                padding: '9px 12px', borderRadius: 8, fontSize: 13, cursor: 'pointer',
                fontWeight: value === opt.value ? 600 : 400,
                color: value === opt.value ? '#4F46E5' : 'var(--dropdown-text,#374151)',
                background: value === opt.value ? '#EEF2FF' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}
              onMouseEnter={e => { if (value !== opt.value) e.currentTarget.style.background = 'var(--dropdown-hover,#F9FAFB)'; }}
              onMouseLeave={e => { if (value !== opt.value) e.currentTarget.style.background = 'transparent'; }}
            >
              {opt.label}
              {value === opt.value && (
                <svg width="13" height="13" fill="none" stroke="#4F46E5" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
              )}
            </div>
          ))}
          {value !== 'all' && (
            <div style={{ borderTop: '1px solid var(--dropdown-border,#E2E8F0)', marginTop: 4, paddingTop: 4 }}>
              <div
                onClick={() => { onChange('all'); setOpen(false); }}
                style={{ padding: '8px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, color: '#EF4444', cursor: 'pointer', textAlign: 'center' }}
                onMouseEnter={e => e.currentTarget.style.background = '#FEF2F2'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                Clear filter
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Transaction Detail Modal ───────────────────────────────────────────────────
// Opens with list data immediately, fetches full details (incl. blockchainHash) in background
function TxnModal({ txn, onClose }) {
  const [copied, copy] = useCopy();
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(true);

  useEffect(() => {
    if (!txn?.transactionId) { setDetailLoading(false); return; }
    setDetailLoading(true);
    getTransactionDetails(txn.transactionId)
      .then(res => setDetail(res.data?.transaction || null))
      .catch(() => setDetail(null))
      .finally(() => setDetailLoading(false));
  }, [txn?.transactionId]);

  if (!txn) return null;

  const tc     = getType(txn);
  const sc     = getStatus(txn.status);
  const amt    = Math.abs(txn.amount ?? 0);
  const txId   = txn.transactionId || '—';
  // blockchainHash only available from detail endpoint
  const hash   = detail?.blockchainHash || '';
  const sender = txn.senderWallet   || '—';
  const recvr  = txn.receiverWallet || '—';
  const senderName = detail?.sender?.name || txn.senderName || null;
  const recvrName  = detail?.receiver?.name || txn.receiverName || null;
  const ts     = formatDate(txn.createdAt, true);

  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 580 }}>

        {/* Header */}
        <div className="modal-head" style={{ padding: '20px 24px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 50, height: 50, borderRadius: 15, background: tc.grad,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, color: '#fff', fontWeight: 900, flexShrink: 0,
              boxShadow: `0 6px 20px ${tc.glow}`,
            }}>
              {tc.icon}
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 16 }}>Transaction Detail</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                <span style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--gray-400)' }}>
                  #{String(txId).slice(-12)}
                </span>
                <span className={`badge ${sc.cls}`}>{sc.label}</span>
              </div>
            </div>
          </div>
          <button className="btn btn-ghost icon-btn" onClick={onClose}>
            <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Amount hero */}
        <div style={{
          margin: '0 20px 4px', borderRadius: 16,
          background: tc.credit
            ? 'linear-gradient(135deg,#022c22,#065F46)'
            : 'linear-gradient(135deg,#1c0101,#7F1D1D)',
          padding: '22px 24px', color: '#fff', position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: -40, right: -40, width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }}/>
          <div style={{ position: 'relative' }}>
            <div style={{ fontSize: 10, fontWeight: 700, opacity: 0.5, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 6 }}>
              {tc.credit ? 'Reward Amount' : 'Transfer Amount'}
            </div>
            <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 40, fontWeight: 900, letterSpacing: '-2px', lineHeight: 1 }}>
              {tc.credit ? '+' : ''}{amt.toLocaleString()}
              <span style={{ fontSize: 16, opacity: 0.4, marginLeft: 10, fontWeight: 600, letterSpacing: 0 }}>PYO</span>
            </div>
            <div style={{ marginTop: 16, display: 'flex', gap: 0 }}>
              {[
                ['Type',   tc.label],
                ['Status', sc.label],
                ['Date',   txn.createdAt ? new Date(txn.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'],
              ].map(([l, v], i, a) => (
                <div key={l} style={{ paddingRight: 20, marginRight: 20, borderRight: i < a.length - 1 ? '1px solid rgba(255,255,255,0.15)' : 'none' }}>
                  <div style={{ fontSize: 9, opacity: 0.45, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 2 }}>{l}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, opacity: 0.95, textTransform: 'capitalize' }}>{v}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Detail fields */}
        <div className="modal-body" style={{ padding: '18px 20px' }}>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 12 }}>
            Transaction Data
          </div>

          <div style={{ borderRadius: 13, border: '1.5px solid var(--gray-200)', overflow: 'hidden' }}>
            {[
              {
                label: 'Transaction ID',
                content: <CopyField val={txId} copyId="txid" copied={copied} onCopy={copy}/>,
              },
              {
                label: 'Blockchain Hash',
                content: detailLoading ? (
                  <Skeleton w={200} h={14} r={4}/>
                ) : hash ? (
                  <div>
                    <CopyField val={hash} copyId="hash" copied={copied} onCopy={copy} truncate/>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 5 }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981', boxShadow: '0 0 5px #10B981' }}/>
                      <span style={{ fontSize: 10.5, color: '#059669', fontWeight: 600 }}>Confirmed on-chain</span>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#F59E0B' }}/>
                    <span style={{ fontSize: 12.5, color: 'var(--gray-400)' }}>Pending blockchain confirmation</span>
                  </div>
                ),
              },
              {
                label: 'Sender Wallet',
                content: (
                  <div>
                    <CopyField val={sender === 'REFERRAL_BONUS' ? 'REFERRAL_BONUS' : sender} copyId="sender" copied={copied} onCopy={copy} truncate/>
                    {senderName && (
                      <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 3 }}>{senderName}</div>
                    )}
                  </div>
                ),
              },
              {
                label: 'Receiver Wallet',
                content: (
                  <div>
                    <CopyField val={recvr} copyId="recvr" copied={copied} onCopy={copy} truncate/>
                    {recvrName && (
                      <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 3 }}>{recvrName}</div>
                    )}
                  </div>
                ),
              },
              {
                label: 'Amount',
                content: (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 18, fontWeight: 800, color: tc.credit ? '#059669' : '#2563EB' }}>
                      {tc.credit ? '+' : ''}{amt.toLocaleString()}
                    </span>
                    <span style={{ background: tc.credit ? '#DCFCE7' : '#DBEAFE', color: tc.credit ? '#15803D' : '#1D4ED8', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 6 }}>
                      PYO
                    </span>
                    {txn.failureReason && (
                      <span style={{ fontSize: 11, color: '#DC2626', fontWeight: 500, marginLeft: 4 }}>
                        — {txn.failureReason}
                      </span>
                    )}
                  </div>
                ),
              },
              {
                label: 'Timestamp',
                content: <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--navy)' }}>{ts}</span>,
              },
            ].map(({ label, content }, i, arr) => (
              <div
                key={label}
                style={{
                  display: 'grid', gridTemplateColumns: '160px 1fr',
                  padding: '13px 16px',
                  borderBottom: i < arr.length - 1 ? '1px solid var(--gray-200)' : 'none',
                  background: i % 2 === 0 ? 'var(--gray-100,#F8FAFC)' : '#fff',
                  alignItems: 'start',
                }}
              >
                <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.7px', paddingTop: 2 }}>
                  {label}
                </div>
                <div>{content}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="modal-foot">
          <button className="btn btn-outline" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  MAIN PAGE — server-side filtering + pagination
// ════════════════════════════════════════════════════════════════════════════
export default function Transactions() {
  const [txns,      setTxns]      = useState([]);
  const [summary,   setSummary]   = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');
  const [sel,       setSel]       = useState(null);
  const [totalRows, setTotalRows] = useState(0);
  const [totalPages,setTotalPages]= useState(1);

  // Filters
  const [search,    setSearch]    = useState('');
  const [fStatus,   setFStatus]   = useState('all');
  const [fDate,     setFDate]     = useState('all');
  const [fWallet,   setFWallet]   = useState('');
  const [page,      setPage]      = useState(1);

  // Debounce search so we don't hammer the API on every keystroke
  const searchTimer = useRef(null);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [debouncedWallet, setDebouncedWallet] = useState('');

  const handleSearchChange = v => {
    setSearch(v);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => { setDebouncedSearch(v); setPage(1); }, 400);
  };
  const handleWalletChange = v => {
    setFWallet(v);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => { setDebouncedWallet(v); setPage(1); }, 400);
  };

  // Combine search + wallet into one search param for backend
  const combinedSearch = debouncedSearch || debouncedWallet;

  const fetchData = useCallback(() => {
    setLoading(true);
    setError('');

    const params = { page, limit: PAGE_SIZE };
    if (fStatus !== 'all')   params.status     = fStatus;
    if (fDate   !== 'all')   params.dateFilter  = fDate;
    if (combinedSearch)      params.search      = combinedSearch;

    getTransactions(params)
      .then(res => {
        const data = res.data;
        setTxns(Array.isArray(data?.transactions) ? data.transactions : []);
        setSummary(data?.summary || null);
        setTotalRows(data?.total  || 0);
        setTotalPages(data?.totalPages || 1);
      })
      .catch(err => {
        console.error('Transactions fetch failed:', err);
        setError(err.response?.data?.message || 'Failed to load transactions. Please try again.');
        setTxns([]);
        setSummary(null);
      })
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, fStatus, fDate, combinedSearch]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Reset to page 1 when filters change
  useEffect(() => { setPage(1); }, [fStatus, fDate]);

  // Stats from backend summary (not calculated locally — backend has full dataset)
  const totalTxns  = summary?.totalTransactions ?? totalRows;
  const succCount  = summary?.successCount ?? 0;
  const pendCount  = summary?.pendingCount ?? 0;
  const failCount  = summary?.failedCount  ?? 0;
  const volume     = summary?.totalVolume  ?? 0;
  const successRate= summary?.successRate  ?? '—';

  // Active filter count for "Clear" button
  const activeFilters = (fStatus !== 'all' ? 1 : 0) + (fDate !== 'all' ? 1 : 0) + (fWallet ? 1 : 0) + (search ? 1 : 0);

  return (
    <div className="page">
      <style>{`
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @keyframes rowFadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin { to{transform:rotate(360deg)} }
        .txn-row { transition: background 0.15s; }
        .txn-row:hover { background: var(--txn-row-hover, #F0F7FF) !important; }
        body.dark { --txn-row-hover: #1a2235; }
        .txn-type-icon { transition: transform 0.2s; }
        .txn-row:hover .txn-type-icon { transform: scale(1.12) rotate(-4deg); }
        .status-tab { padding: 11px 18px; border: none; background: none; font-size: 13px; font-weight: 600; cursor: pointer; font-family: 'Inter',sans-serif; color: var(--gray-400); border-bottom: 2.5px solid transparent; transition: all 0.18s; white-space: nowrap; }
        .status-tab.act { color: #2563EB; border-bottom-color: #2563EB; }
        .status-tab:hover:not(.act) { color: var(--navy); }
      `}</style>

      {/* ── Page Header ── */}
      <div className="page-header">
        <div className="page-header-left">
          <h2>Transaction Monitoring</h2>
          <p>Monitor all platform transactions in real-time.</p>
        </div>
        <button
          className="btn btn-outline"
          onClick={fetchData}
          disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: 7 }}
        >
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
            style={{ animation: loading ? 'spin 0.8s linear infinite' : 'none' }}>
            <polyline points="23 4 23 10 17 10"/>
            <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/>
          </svg>
          {loading ? 'Loading…' : 'Refresh'}
        </button>
      </div>

      {/* ── Error Banner ── */}
      {error && !loading && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: '#FEF2F2', border: '1.5px solid #FECACA',
          borderRadius: 12, padding: '13px 18px', marginBottom: 18,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <svg width="18" height="18" fill="none" stroke="#DC2626" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#DC2626' }}>{error}</span>
          </div>
          <button
            onClick={fetchData}
            style={{ background: '#DC2626', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Stat Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 22 }}>
        <StatCard
          label="Total Transactions" value={totalTxns.toLocaleString()}
          sub={`${volume.toLocaleString()} PYO total volume`}
          icon={<svg width="20" height="20" fill="none" stroke="#3B82F6" strokeWidth="2" viewBox="0 0 24 24"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 014-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 01-4 4H3"/></svg>}
          iconBg="rgba(59,130,246,0.12)" color="#3B82F6" loading={loading}
        />
        <StatCard
          label="Successful" value={succCount.toLocaleString()}
          sub={`${successRate} success rate`}
          icon={<svg width="20" height="20" fill="none" stroke="#10B981" strokeWidth="2" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>}
          iconBg="rgba(16,185,129,0.12)" color="#10B981" loading={loading}
        />
        <StatCard
          label="Pending" value={pendCount.toLocaleString()}
          sub="Awaiting confirmation"
          icon={<svg width="20" height="20" fill="none" stroke="#F59E0B" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}
          iconBg="rgba(245,158,11,0.12)" color="#D97706" loading={loading}
        />
        <StatCard
          label="Failed" value={failCount.toLocaleString()}
          sub="Requires attention"
          icon={<svg width="20" height="20" fill="none" stroke="#EF4444" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>}
          iconBg="rgba(239,68,68,0.12)" color="#DC2626" loading={loading}
        />
      </div>

      {/* ── Table Card ── */}
      <div className="card">

        {/* Status tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--gray-200)', paddingLeft: 8, overflowX: 'auto' }}>
          {[
            { key: 'all',     label: 'All',     count: totalTxns  },
            { key: 'success', label: 'Success', count: succCount   },
            { key: 'pending', label: 'Pending', count: pendCount   },
            { key: 'failed',  label: 'Failed',  count: failCount   },
          ].map(tab => (
            <button
              key={tab.key}
              className={`status-tab${fStatus === tab.key ? ' act' : ''}`}
              onClick={() => { setFStatus(tab.key); setPage(1); }}
            >
              {tab.label}
              <span style={{
                marginLeft: 7, borderRadius: 20, padding: '2px 8px',
                fontSize: 11, fontWeight: 700,
                background: fStatus === tab.key ? '#DBEAFE' : 'var(--gray-100)',
                color: fStatus === tab.key ? '#2563EB' : 'var(--gray-400)',
              }}>
                {loading ? '—' : tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Filter bar */}
        <div className="filter-bar" style={{ gap: 10, flexWrap: 'wrap' }}>

          {/* Search by TX ID */}
          <div className="search-field" style={{ flex: 1, minWidth: 200, maxWidth: 300 }}>
            <svg width="13" height="13" fill="none" stroke="var(--gray-400)" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              placeholder="Search Transaction ID…"
              value={search}
              onChange={e => handleSearchChange(e.target.value)}
            />
          </div>

          {/* Wallet address filter */}
          <div className="search-field" style={{ flex: 1, minWidth: 200, maxWidth: 280 }}>
            <svg width="13" height="13" fill="none" stroke="var(--gray-400)" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"/>
              <path d="M16 3H8L4 7h16l-4-4z"/>
            </svg>
            <input
              placeholder="Filter by wallet address…"
              value={fWallet}
              onChange={e => handleWalletChange(e.target.value)}
            />
          </div>

          {/* Date range dropdown */}
          <DateDropdown value={fDate} onChange={v => { setFDate(v); setPage(1); }}/>

          {/* Clear filters */}
          {activeFilters > 0 && (
            <button
              className="btn btn-outline"
              style={{ fontSize: 12, padding: '6px 12px' }}
              onClick={() => {
                setSearch(''); setFStatus('all'); setFDate('all');
                setFWallet(''); setDebouncedSearch(''); setDebouncedWallet(''); setPage(1);
              }}
            >
              Clear ({activeFilters})
            </button>
          )}

          <div className="filter-count">
            {!loading && (
              <><strong style={{ color: 'var(--navy)' }}>{totalRows}</strong> transaction{totalRows !== 1 ? 's' : ''}</>
            )}
          </div>
        </div>

        {/* ── Table ── */}
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Transaction ID</th>
                <th>Sender</th>
                <th>Receiver</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
                <th style={{ textAlign: 'center' }}>Detail</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array(PAGE_SIZE).fill(0).map((_, i) => (
                    <tr key={i}>
                      <td><div style={{ display: 'flex', alignItems: 'center', gap: 9 }}><Skeleton w={32} h={32} r={9}/><div><Skeleton w={100} h={12} r={4}/><Skeleton w={55} h={9} r={4} style={{ marginTop: 5 }}/></div></div></td>
                      <td><Skeleton w={120} h={12} r={4}/></td>
                      <td><Skeleton w={120} h={12} r={4}/></td>
                      <td><Skeleton w={90} h={16} r={4}/></td>
                      <td><Skeleton w={70} h={22} r={20}/></td>
                      <td><Skeleton w={110} h={12} r={4}/></td>
                      <td><Skeleton w={60} h={28} r={20} style={{ margin: '0 auto' }}/></td>
                    </tr>
                  ))
                : txns.map((t, idx) => {
                    const tc     = getType(t);
                    const sc     = getStatus(t.status);
                    const txId   = t.transactionId || '—';
                    const sender = t.senderWallet  || '—';
                    const recvr  = t.receiverWallet || '—';
                    const amt    = Math.abs(t.amount ?? 0);

                    return (
                      <tr
                        key={txId + idx}
                        className="txn-row"
                        style={{ animation: `rowFadeIn 0.3s ease both`, animationDelay: `${idx * 0.04}s` }}
                      >
                        {/* Transaction ID */}
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div
                              className="txn-type-icon"
                              style={{
                                width: 34, height: 34, borderRadius: 10,
                                background: tc.grad, flexShrink: 0,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 15, color: '#fff', fontWeight: 900,
                                boxShadow: `0 2px 10px ${tc.glow}`,
                              }}
                            >
                              {tc.icon}
                            </div>
                            <div>
                              <div style={{ fontFamily: 'monospace', fontSize: 12.5, fontWeight: 700, color: 'var(--navy)' }}>
                                #{String(txId).slice(-12)}
                              </div>
                              <div style={{ fontSize: 10.5, color: 'var(--gray-400)', marginTop: 1 }}>
                                {tc.label}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Sender */}
                        <td>
                          <div>
                            <span style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--gray-600)', display: 'block' }} title={sender}>
                              {sender === 'REFERRAL_BONUS' ? (
                                <span style={{ background: '#FEF3C7', color: '#92400E', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 6 }}>
                                  REFERRAL BONUS
                                </span>
                              ) : truncateWallet(sender)}
                            </span>
                            {t.senderName && (
                              <span style={{ fontSize: 11, color: 'var(--gray-400)' }}>{t.senderName}</span>
                            )}
                          </div>
                        </td>

                        {/* Receiver */}
                        <td>
                          <div>
                            <span style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--gray-600)', display: 'block' }} title={recvr}>
                              {truncateWallet(recvr)}
                            </span>
                            {t.receiverName && (
                              <span style={{ fontSize: 11, color: 'var(--gray-400)' }}>{t.receiverName}</span>
                            )}
                          </div>
                        </td>

                        {/* Amount */}
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <span style={{
                              fontFamily: "'Space Grotesk',sans-serif", fontSize: 15, fontWeight: 800,
                              color: tc.credit ? '#059669' : '#2563EB',
                            }}>
                              {tc.credit ? '+' : ''}{amt.toLocaleString()}
                            </span>
                            <span style={{ background: 'var(--gray-100)', fontSize: 10, fontWeight: 700, color: 'var(--gray-400)', padding: '2px 6px', borderRadius: 6 }}>
                              PYO
                            </span>
                          </div>
                        </td>

                        {/* Status */}
                        <td><span className={`badge ${sc.cls}`}>{sc.label}</span></td>

                        {/* Date */}
                        <td style={{ fontSize: 12.5, color: 'var(--gray-400)', whiteSpace: 'nowrap' }}>
                          {formatDate(t.createdAt)}
                        </td>

                        {/* View */}
                        <td style={{ textAlign: 'center' }}>
                          <button
                            onClick={e => { e.stopPropagation(); setSel(t); }}
                            style={{
                              padding: '6px 16px', borderRadius: 20, cursor: 'pointer',
                              background: 'linear-gradient(135deg,#2563EB,#3B82F6)',
                              border: 'none', color: '#fff',
                              fontSize: 12, fontWeight: 600,
                              fontFamily: "'Inter',sans-serif",
                              boxShadow: '0 2px 8px rgba(37,99,235,0.28)',
                              transition: 'all 0.18s',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(37,99,235,0.4)'; }}
                            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(37,99,235,0.28)'; }}
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })
              }
            </tbody>
          </table>

          {/* Empty states */}
          {!loading && txns.length === 0 && !error && (
            <div className="empty">
              <div style={{ fontSize: 44, marginBottom: 14 }}>📋</div>
              <div style={{ fontWeight: 700, color: 'var(--navy)', fontSize: 15, marginBottom: 6 }}>
                {activeFilters > 0 ? 'No transactions match your filters' : 'No transactions yet'}
              </div>
              <div style={{ fontSize: 13 }}>
                {activeFilters > 0
                  ? 'Try adjusting the date range, status, or wallet address.'
                  : 'Transactions will appear here once users start transacting on the platform.'}
              </div>
            </div>
          )}
        </div>

        {/* Pagination — server-side */}
        {!loading && totalPages > 1 && (
          <div className="pagination">
            <div className="pag-info">
              Showing {Math.min((page - 1) * PAGE_SIZE + 1, totalRows)}–{Math.min(page * PAGE_SIZE, totalRows)} of {totalRows} transactions
            </div>
            <div className="pag-btns">
              <button className="pag-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>‹</button>
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                const p = totalPages <= 7 ? i + 1
                  : page <= 4 ? i + 1
                  : page >= totalPages - 3 ? totalPages - 6 + i
                  : page - 3 + i;
                return (
                  <button key={p} className={`pag-btn${page === p ? ' act' : ''}`} onClick={() => setPage(p)}>{p}</button>
                );
              })}
              <button className="pag-btn" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>›</button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {sel && <TxnModal txn={sel} onClose={() => setSel(null)}/>}
    </div>
  );
}