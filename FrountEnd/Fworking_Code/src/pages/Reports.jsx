import { useState } from 'react';
import { getAllUsers, getTransactions, getReferrals } from '../apis/adminApi';

// ── Export helpers ───────────────────────────────────────────────────────────
function csvEscape(v) {
  const s = String(v ?? '');
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function doCSV(filename, headers, rows) {
  const csv = [headers, ...rows].map(r => r.map(csvEscape).join(',')).join('\r\n');
  triggerDownload(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' }), filename);
}

async function doExcel(filename, sheetName, headers, rows) {
  let XLSX;
  try {
    XLSX = await import('xlsx');
  } catch {
    alert('Excel export requires the xlsx package.\n\nRun: npm install xlsx');
    return;
  }
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  // Auto column widths
  ws['!cols'] = headers.map((h, i) => {
    const max = Math.max(h.length, ...rows.map(r => String(r[i] ?? '').length));
    return { wch: Math.min(max + 2, 40) };
  });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, filename);
}

async function doPDF(filename, title, headers, rows) {
  let jsPDF, autoTable;
  try {
    ({ jsPDF } = await import('jspdf'));
    ({ default: autoTable } = await import('jspdf-autotable'));
  } catch {
    alert('PDF export requires jspdf and jspdf-autotable.\n\nRun: npm install jspdf jspdf-autotable');
    return;
  }
  const landscape = headers.length > 6;
  const doc = new jsPDF({ orientation: landscape ? 'landscape' : 'portrait', unit: 'mm' });

  // Header block
  doc.setFillColor(13, 27, 62);
  doc.rect(0, 0, doc.internal.pageSize.getWidth(), 28, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont(undefined, 'bold');
  doc.text(title, 14, 13);
  doc.setFontSize(9);
  doc.setFont(undefined, 'normal');
  doc.setTextColor(180, 200, 230);
  doc.text(`Generated: ${new Date().toLocaleString('en-IN')}  ·  Total records: ${rows.length}`, 14, 22);

  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: 34,
    styles: { fontSize: 8, cellPadding: 3, overflow: 'linebreak' },
    headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold', halign: 'center' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    tableLineColor: [226, 232, 240],
    tableLineWidth: 0.3,
    margin: { left: 10, right: 10 },
  });

  // Footer on each page
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Page ${i} of ${totalPages}`, doc.internal.pageSize.getWidth() - 25, doc.internal.pageSize.getHeight() - 8);
    doc.text('PayO Admin Portal', 14, doc.internal.pageSize.getHeight() - 8);
  }

  doc.save(filename);
}

// ── Report definitions ────────────────────────────────────────────────────────
const fmtDate = d => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const REPORTS = [
  {
    id: 'users',
    title: 'User Report',
    icon: '👥',
    description: 'Full user list with KYC verification status, wallet balances, addresses, and registration details.',
    contains: ['User list', 'KYC status', 'Wallet balance & address', 'Join date'],
    color: '#2563EB',
    bg: '#EFF6FF',
    border: '#BFDBFE',
    sheetName: 'Users',
    headers: ['User ID', 'Name', 'Email', 'Mobile', 'KYC Status', 'Wallet Balance (PYO)', 'Wallet Address', 'Role', 'Joined Date'],
    async fetchData() {
      const res = await getAllUsers();
      return res.data?.users || [];
    },
    toRows(data) {
      return data.map(u => [
        String(u._id || ''),
        u.name || '',
        u.email || '',
        u.mobile || '',
        u.kycVerified ? 'Verified' : 'Pending',
        u.walletBalance ?? 0,
        u.walletAddress || '',
        u.role || 'user',
        fmtDate(u.createdAt),
      ]);
    },
  },
  {
    id: 'transactions',
    title: 'Transaction Report',
    icon: '💸',
    description: 'All transaction records including amounts, statuses, sender/receiver details, and timestamps.',
    contains: ['All transaction records', 'Sender & receiver info', 'Status & failure reasons', 'Transaction type'],
    color: '#059669',
    bg: '#F0FDF4',
    border: '#A7F3D0',
    sheetName: 'Transactions',
    headers: ['Transaction ID', 'Type', 'Sender', 'Receiver', 'Amount (PYO)', 'Status', 'Failure Reason', 'Date'],
    async fetchData() {
      const res = await getTransactions({ limit: 10000, page: 1 });
      return res.data?.transactions || [];
    },
    toRows(data) {
      return data.map(t => [
        String(t.transactionId || ''),
        t.senderWallet === 'REFERRAL_BONUS' ? 'Referral Bonus' : 'Transfer',
        t.senderWallet === 'REFERRAL_BONUS' ? 'System (Referral)' : (t.senderName || t.senderWallet || ''),
        t.receiverName || t.receiverWallet || '',
        t.amount ?? 0,
        t.status || '',
        t.failureReason || '',
        fmtDate(t.createdAt),
      ]);
    },
  },
  {
    id: 'referrals',
    title: 'Referral Report',
    icon: '🎁',
    description: 'Referral activity showing referrer details, referred users, reward amounts and payout statuses.',
    contains: ['Referral activity', 'Referrer & referred user info', 'Reward amounts', 'Reward status'],
    color: '#7C3AED',
    bg: '#F5F3FF',
    border: '#DDD6FE',
    sheetName: 'Referrals',
    headers: ['Referrer Name', 'Referrer Email', 'Referral Code', 'Referred User', 'Referred Email', 'Referred Mobile', 'Joined Date', 'Reward Amount (PYO)', 'Reward Status'],
    async fetchData() {
      const res = await getReferrals({ limit: 10000, page: 1 });
      return res.data?.referrals || [];
    },
    toRows(data) {
      return data.map(r => [
        r.referrer?.name || '',
        r.referrer?.email || '',
        r.referrer?.referralCode || '',
        r.referredUser?.name || '',
        r.referredUser?.email || '',
        r.referredUser?.mobile || '',
        fmtDate(r.referredUser?.joinedAt),
        r.rewardAmount ?? 0,
        r.rewardStatus || '',
      ]);
    },
  },
];

const FORMATS = [
  { id: 'csv',   label: 'CSV',   icon: '📄', color: '#059669', bg: '#F0FDF4', border: '#A7F3D0', hoverBg: '#059669' },
  { id: 'excel', label: 'Excel', icon: '📊', color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE', hoverBg: '#2563EB' },
  { id: 'pdf',   label: 'PDF',   icon: '📑', color: '#DC2626', bg: '#FEF2F2', border: '#FECACA', hoverBg: '#DC2626' },
];

// ── Component ────────────────────────────────────────────────────────────────
export default function Reports() {
  const [busy, setBusy] = useState({});   // key: `${reportId}-${format}`
  const [done, setDone] = useState({});   // flash ✓ after success
  const [counts, setCounts] = useState({}); // record counts from last export

  const handleExport = async (report, fmt) => {
    const key = `${report.id}-${fmt}`;
    if (busy[key]) return;
    setBusy(b => ({ ...b, [key]: true }));
    try {
      const data  = await report.fetchData();
      const rows  = report.toRows(data);
      const date  = new Date().toISOString().split('T')[0];
      const fname = `PayO_${report.title.replace(/\s+/g, '_')}_${date}`;

      setCounts(c => ({ ...c, [report.id]: data.length }));

      if (fmt === 'csv')   doCSV(`${fname}.csv`, report.headers, rows);
      if (fmt === 'excel') await doExcel(`${fname}.xlsx`, report.sheetName, report.headers, rows);
      if (fmt === 'pdf')   await doPDF(`${fname}.pdf`, report.title, report.headers, rows);

      setDone(d => ({ ...d, [key]: true }));
      setTimeout(() => setDone(d => { const n = { ...d }; delete n[key]; return n; }), 2500);
    } catch (err) {
      console.error('Export error:', err);
      alert(`Export failed: ${err?.message || 'Unknown error'}`);
    } finally {
      setBusy(b => ({ ...b, [key]: false }));
    }
  };

  return (
    <div className="page">
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      <div className="page-header">
        <div className="page-header-left">
          <h2>Reports</h2>
          <p>Export system data in CSV, Excel, or PDF format.</p>
        </div>
      </div>

      {/* ── Install notice ── */}
      <div style={{ background: '#FFFBEB', border: '1.5px solid #FDE68A', borderRadius: 10, padding: '11px 16px', marginBottom: 22, display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
        <span style={{ fontSize: 16 }}>ℹ️</span>
        <span style={{ color: '#854D0E' }}>
          Excel and PDF exports require npm packages. Run once if not installed:&nbsp;
          <code style={{ background: '#FEF9C3', padding: '2px 7px', borderRadius: 5, fontFamily: 'monospace', fontSize: 12.5 }}>
            npm install xlsx jspdf jspdf-autotable
          </code>
        </span>
      </div>

      {/* ── Report cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 20 }}>
        {REPORTS.map(report => (
          <div key={report.id} style={{ background: 'var(--white)', borderRadius: 16, border: '1.5px solid var(--gray-200)', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>

            {/* Card top */}
            <div style={{ padding: '22px 22px 18px', borderBottom: '1px solid var(--gray-100)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 12 }}>
                <div style={{ width: 48, height: 48, borderRadius: 13, background: report.bg, border: `1.5px solid ${report.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>
                  {report.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--navy)', marginBottom: 3 }}>{report.title}</div>
                  {counts[report.id] != null && (
                    <div style={{ fontSize: 11.5, fontWeight: 600, color: report.color, background: report.bg, border: `1px solid ${report.border}`, display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 20 }}>
                      ✓ {counts[report.id].toLocaleString()} records exported
                    </div>
                  )}
                </div>
              </div>

              <div style={{ fontSize: 13, color: 'var(--gray-500)', lineHeight: 1.6, marginBottom: 14 }}>
                {report.description}
              </div>

              {/* Contains list */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 7 }}>Contains</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {report.contains.map(item => (
                    <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13 }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: report.color, flexShrink: 0 }}/>
                      <span style={{ color: 'var(--gray-600)', fontWeight: 500 }}>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Export section */}
            <div style={{ padding: '16px 22px 20px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 10 }}>
                Export As
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {FORMATS.map(f => {
                  const key      = `${report.id}-${f.id}`;
                  const isLoading = busy[key];
                  const isDone    = done[key];
                  return (
                    <button
                      key={f.id}
                      disabled={isLoading}
                      onClick={() => handleExport(report, f.id)}
                      style={{
                        flex: 1,
                        padding: '10px 6px',
                        borderRadius: 11,
                        border: `1.5px solid ${isDone ? '#86EFAC' : f.border}`,
                        background: isDone ? '#DCFCE7' : f.bg,
                        color: isDone ? '#15803D' : f.color,
                        fontWeight: 700,
                        fontSize: 13,
                        cursor: isLoading ? 'wait' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 5,
                        transition: 'all 0.15s',
                        opacity: isLoading ? 0.7 : 1,
                      }}
                      onMouseEnter={e => {
                        if (!isLoading && !isDone) {
                          e.currentTarget.style.background = f.hoverBg;
                          e.currentTarget.style.color = '#fff';
                          e.currentTarget.style.borderColor = f.hoverBg;
                        }
                      }}
                      onMouseLeave={e => {
                        if (!isLoading && !isDone) {
                          e.currentTarget.style.background = f.bg;
                          e.currentTarget.style.color = f.color;
                          e.currentTarget.style.borderColor = f.border;
                        }
                      }}
                    >
                      {isLoading ? (
                        <>
                          <span style={{ width: 13, height: 13, border: `2px solid ${f.color}40`, borderTopColor: f.color, borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block', flexShrink: 0 }} />
                          <span>...</span>
                        </>
                      ) : isDone ? (
                        <>✓ Done</>
                      ) : (
                        <>{f.icon} {f.label}</>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}