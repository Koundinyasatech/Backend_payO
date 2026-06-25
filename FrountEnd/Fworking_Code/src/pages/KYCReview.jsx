import { useState, useContext, useRef, useEffect } from 'react';
import { AppCtx } from '../App';
import { getAllSubmissions, approveKYC, rejectKYC, getSubmissionDetails } from '../apis/adminApi';

const sMap = { Pending:'b-pending','In Review':'b-review',Approved:'b-approved',Failed:'b-failed' };
const Badge = ({s}) => <span className={`badge ${sMap[s]||'b-pending'}`}>{s}</span>;
function Toast({msg,type}){ return <div className={`toast ${type==='ok'?'ok':'err'}`}>{type==='ok'?'✅':'❌'} {msg}</div>; }

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

function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2);
}
const COLORS = ['#6C63FF','#FF6584','#43E97B','#FA8231','#E74C3C','#3498DB','#9B59B6','#1ABC9C','#E67E22','#2ECC71'];

/* ── Document preview card — shows the actual uploaded image from backend ── */
// Normalize URL: force https for ngrok, handle localhost for dev
function normalizeDocUrl(url) {
  if (!url) return url;
  // Force https — browsers block http images on https pages (mixed content)
  return url.replace(/^http:\/\//i, 'https://');
}

function DocumentCard({ title, emoji, url, accentColor, accentBg, flagged }) {
  const [blobUrl,  setBlobUrl]  = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [imgError, setImgError] = useState(false);
  const [isPdf,    setIsPdf]    = useState(false);
  const present = !!url;

  useEffect(() => {
    if (!url) return;
    let revoked = false;
    setLoading(true);
    setImgError(false);
    setBlobUrl(null);

    const normalized = normalizeDocUrl(url);

    // Fetch via JS so we can pass ngrok-skip-browser-warning header.
    // This bypasses both the ngrok interstitial page and mixed-content
    // restrictions that prevent <img src="http://...ngrok..."> from loading.
    fetch(normalized, {
      headers: { 'ngrok-skip-browser-warning': 'true' },
    })
      .then(res => {
        if (!res.ok) throw new Error('fetch failed');
        const ct = res.headers.get('content-type') || '';
        if (!revoked) setIsPdf(ct.includes('pdf') || normalized.toLowerCase().endsWith('.pdf'));
        return res.blob();
      })
      .then(blob => {
        if (!revoked) setBlobUrl(URL.createObjectURL(blob));
      })
      .catch(() => { if (!revoked) setImgError(true); })
      .finally(() => { if (!revoked) setLoading(false); });

    return () => {
      revoked = true;
      setBlobUrl(prev => { if (prev) URL.revokeObjectURL(prev); return null; });
    };
  }, [url]);

  const openFullView = () => {
    if (!url) return;
    // Open blob if available, otherwise raw URL
    window.open(blobUrl || normalizeDocUrl(url), '_blank', 'noopener,noreferrer');
  };

  return (
    <div style={{
      border: `2px solid ${flagged ? '#FECACA' : present ? accentColor + '33' : 'var(--gray-200)'}`,
      borderRadius: 14,
      overflow: 'hidden',
      background: '#fff',
      boxShadow: present ? `0 2px 14px ${accentColor}12` : 'none',
    }}>
      {/* Header / preview area */}
      <div
        onClick={openFullView}
        style={{
          background: flagged ? '#FEE2E2' : accentBg,
          height: 180,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 6,
          cursor: present ? 'pointer' : 'not-allowed',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Loading spinner while fetching via fetch()+blob */}
        {present && loading && (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8 }}>
            <div style={{ width:28, height:28, border:'3px solid rgba(255,255,255,0.3)', borderTopColor:accentColor, borderRadius:'50%', animation:'spin 0.8s linear infinite' }}/>
            <div style={{ fontSize:11, fontWeight:600, color:'rgba(0,0,0,0.4)', textTransform:'uppercase', letterSpacing:'0.5px' }}>Loading...</div>
          </div>
        )}

        {/* Image loaded successfully via blob URL */}
        {present && !loading && blobUrl && !isPdf && (
          <img
            src={blobUrl}
            alt={title}
            style={{ maxWidth:'100%', maxHeight:'100%', objectFit:'contain', display:'block' }}
          />
        )}
        {/* PDF loaded — show icon with open prompt */}
        {present && !loading && blobUrl && isPdf && (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8 }}>
            <div style={{ fontSize:42 }}>📄</div>
            <div style={{ fontSize:11, fontWeight:700, color:accentColor, textTransform:'uppercase', letterSpacing:'0.6px' }}>PDF — Click Open</div>
          </div>
        )}

        {/* Failed to load or not uploaded */}
        {(!present || (!loading && !blobUrl)) && (
          <>
            <div style={{
              width:54, height:54, borderRadius:14,
              background:'rgba(255,255,255,0.6)',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:28, boxShadow:'0 2px 8px rgba(0,0,0,0.1)',
            }}>{present ? '⚠️' : emoji}</div>
            <div style={{
              fontSize:11, fontWeight:700,
              color: present ? '#DC2626' : 'rgba(0,0,0,0.35)',
              textTransform:'uppercase', letterSpacing:'0.6px',
            }}>
              {present ? 'Preview unavailable — click Open' : 'Not uploaded'}
            </div>
          </>
        )}
        {present && (
          <div style={{
            position: 'absolute', top: 8, right: 8,
            background: 'rgba(0,0,0,0.55)', color: '#fff',
            fontSize: 10, fontWeight: 600,
            padding: '3px 8px', borderRadius: 20,
            display: 'flex', alignItems: 'center', gap: 4,
          }}>
            <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            Open
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 18 }}>{emoji}</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy)' }}>{title}</span>
        </div>
        {present
          ? flagged
            ? <span style={{ background: '#FEE2E2', color: '#DC2626', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20 }}>⚠️ Flagged</span>
            : blobUrl
              ? <span style={{ background: '#F0FDF4', color: '#059669', fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 20 }}>Submitted ✓</span>
              : <span style={{ background: '#FFF7ED', color: '#D97706', fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 20 }}>Submitted ✓</span>
          : <span style={{ background: 'var(--gray-100)', color: 'var(--gray-400)', fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 20 }}>Not uploaded</span>}
      </div>
    </div>
  );
}

function SectionDivider({ icon, label, bg }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:9, marginBottom:14 }}>
      <div style={{ width:28, height:28, borderRadius:8, background:bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, flexShrink:0 }}>{icon}</div>
      <div style={{ fontSize:11.5, fontWeight:700, color:'var(--navy)', textTransform:'uppercase', letterSpacing:'0.7px' }}>{label}</div>
      <div style={{ flex:1, height:1, background:'var(--gray-200)' }}/>
    </div>
  );
}

function StatusFilterDropdown({ value, onChange, counts }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  const options = [
    { label:'All', value:'All', dot:'#94A3B8' },
    { label:'Pending', value:'Pending', dot:'#D97706' },
    { label:'In Review', value:'In Review', dot:'#2563EB' },
    { label:'Approved', value:'Approved', dot:'#059669' },
    { label:'Failed', value:'Failed', dot:'#DC2626' },
  ];
  return (
    <div ref={ref} style={{ position:'relative' }}>
      <button onClick={()=>setOpen(o=>!o)} style={{ display:'flex', alignItems:'center', gap:7, padding:'7px 14px', background:open?'#EEF2FF':'var(--filter-btn-bg,#F5F3FF)', border:'1.5px solid var(--filter-btn-border,#C7D2FE)', borderRadius:10, color:'var(--filter-btn-color,#4F46E5)', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:"'Inter',sans-serif", whiteSpace:'nowrap' }}>
        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
        Filters {value!=='All'&&<span style={{ background:'#4F46E5', color:'#fff', borderRadius:20, padding:'1px 6px', fontSize:10, fontWeight:700 }}>1</span>}
        <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" style={{ transform:open?'rotate(180deg)':'none' }}><polyline points="6 9 12 15 18 9"/></svg>
      </button>
      {open && (
        <div style={{ position:'absolute', top:'calc(100% + 8px)', right:0, background:'var(--dropdown-bg,#fff)', border:'1.5px solid var(--dropdown-border,#E2E8F0)', borderRadius:12, padding:'6px', minWidth:200, boxShadow:'0 8px 32px rgba(0,0,0,0.12)', zIndex:500 }}>
          <div style={{ padding:'6px 12px 8px', fontSize:10.5, fontWeight:700, color:'var(--gray-400)', textTransform:'uppercase', letterSpacing:'0.8px' }}>Filter by Status</div>
          {options.map(opt => (
            <div key={opt.value} onClick={()=>{onChange(opt.value);setOpen(false);}}
              style={{ padding:'9px 12px', borderRadius:8, fontSize:13, fontWeight:value===opt.value?600:400, color:value===opt.value?'#4F46E5':'var(--dropdown-text,#374151)', background:value===opt.value?'#EEF2FF':'transparent', cursor:'pointer', display:'flex', alignItems:'center', gap:9 }}
              onMouseEnter={e=>{if(value!==opt.value)e.currentTarget.style.background='var(--dropdown-hover,#F9FAFB)';}}
              onMouseLeave={e=>{if(value!==opt.value)e.currentTarget.style.background='transparent';}}>
              <span style={{ width:8, height:8, borderRadius:'50%', background:opt.dot, display:'inline-block', flexShrink:0 }}/>
              <span style={{ flex:1 }}>{opt.label}</span>
              <span style={{ fontSize:11, fontWeight:700, color:value===opt.value?'#4F46E5':'var(--gray-400)', background:value===opt.value?'#E0E7FF':'var(--gray-100)', padding:'1px 7px', borderRadius:20 }}>{counts[opt.value]??0}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Review Modal — shows detail/docs/action for a KYC record ── */
function Modal({ user, onClose, onApprove, onReject, canApproveReject }) {
  const [tab, setTab] = useState('details');
  const [reason, setReason] = useState('');
  const [detailLoading, setDetailLoading] = useState(false);
  const [details, setDetails] = useState(null);

  useEffect(() => {
    if (!user) return;
    const kycId = user._id;
    if (!kycId) return;
    setDetailLoading(true);
    // Backend response: { success, kyc: { ...full record with userId populated } }
    getSubmissionDetails(kycId)
      .then(res => {
        const d = res.data?.kyc || {};
        setDetails(d);
      })
      .catch(() => {})
      .finally(() => setDetailLoading(false));
  }, [user]);

  if (!user) return null;

  // Prefer details (full record fetched from API) over the row data
  const src = details || user;

  // Backend KYC fields:
  //   _id, userId: {_id, name, mobile, email, createdAt}, fullName, status,
  //   aadharFrontUrl, panCardUrl, passportUrl, selfieUrl,
  //   reviewedBy, rejectionReason, reviewedAt, submissionCount, createdAt
  const name      = src.fullName || src.userId?.name || 'Unknown';
  const userIdStr = src.userId?._id || src.userId || '';
  const email     = src.userId?.email || '—';
  const mobile    = src.userId?.mobile || '—';
  const status    = normalizeStatus(src.status);
  const isFailed  = status === 'Failed';
  const initials  = user._initials || getInitials(name);
  const color     = user._color || COLORS[0];
  const rejectionReason = src.rejectionReason;
  const reviewedAt      = src.reviewedAt;
  const reviewedBy      = src.reviewedBy?.name || src.reviewedBy?.email;

  // Document URLs (full URLs from backend, including protocol+host)
  const aadhar        = src.aadharFrontUrl;
  const pan           = src.panCardUrl;
  const passport      = src.passportUrl;
  const selfie        = src.selfieUrl;
  const cancelCheque  = src.cancelChequeUrl || src.cancelledChequeUrl;
  const bankStatement = src.bankStatementUrl || src.statementUrl;
  const passbook      = src.passbookUrl;

  const hasAnyDoc = !!(aadhar || pan || passport || selfie || cancelCheque || bankStatement || passbook);

  return (
    <div className="overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal" style={{ maxWidth:860 }}>
        <div className="modal-head">
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div className="avatar" style={{ background:color, width:46, height:46, borderRadius:12, fontSize:16 }}>{initials}</div>
            <div>
              <h3>{name}</h3>
              <div style={{ fontSize:13, color:'var(--gray-400)', marginTop:2, display:'flex', alignItems:'center', gap:8 }}>
                <span>{String(userIdStr).slice(-10)}</span>
                <Badge s={status}/>
              </div>
            </div>
          </div>
          <button className="btn btn-ghost icon-btn" onClick={onClose}>
            <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div className="modal-tabs">
          {[['details','Details'],['documents','Documents'],canApproveReject && ['action','Take Action']].filter(Boolean).map(([key,label]) => (
            <button key={key} className={`mtab${tab===key?' act':''}`} onClick={()=>setTab(key)}>{label}</button>
          ))}
        </div>

        <div className="modal-body">
          {detailLoading && (
            <div style={{ padding:'32px', textAlign:'center', color:'var(--gray-400)', fontSize:14 }}>
              <div style={{ width:28, height:28, border:'3px solid var(--gray-200)', borderTopColor:'#3B82F6', borderRadius:'50%', animation:'spin 0.8s linear infinite', margin:'0 auto 12px' }}/>
              Loading details...
              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            </div>
          )}

          {!detailLoading && tab === 'details' && (
            <>
              <div style={{ marginBottom:20 }}>
                <div className="section-title">Personal Information</div>
                <div className="detail-grid">
                  {[
                    ['Full Name', name],
                    ['User ID', String(userIdStr).slice(-12)],
                    ['Email', email],
                    ['Mobile', mobile],
                    ['Submitted On', src.createdAt ? new Date(src.createdAt).toLocaleString('en-IN') : '—'],
                    ['Submission Count', src.submissionCount || 1],
                  ].map(([l,v]) => (
                    <div className="detail-item" key={l}><label>{l}</label><span>{v}</span></div>
                  ))}
                </div>
              </div>

              {(status === 'Approved' || status === 'Failed') && reviewedAt && (
                <div style={{ marginBottom:16 }}>
                  <div className="section-title">Review Info</div>
                  <div className="detail-grid">
                    {[
                      ['Reviewed By', reviewedBy || 'Super Admin'],
                      ['Reviewed At', new Date(reviewedAt).toLocaleString('en-IN')],
                    ].map(([l,v]) => (
                      <div className="detail-item" key={l}><label>{l}</label><span>{v}</span></div>
                    ))}
                  </div>
                </div>
              )}

              {isFailed && rejectionReason && (
                <div style={{ background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:10, padding:'12px 14px' }}>
                  <div style={{ fontSize:10.5, fontWeight:700, color:'#DC2626', letterSpacing:'0.5px', textTransform:'uppercase', marginBottom:4 }}>Rejection Reason</div>
                  <div style={{ fontSize:13, color:'#7F1D1D' }}>{rejectionReason}</div>
                </div>
              )}
            </>
          )}

          {!detailLoading && tab === 'documents' && (
            <>
              {isFailed && (
                <div style={{ background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:10, padding:'10px 14px', marginBottom:14, fontSize:13, color:'#991B1B', display:'flex', alignItems:'center', gap:8 }}>
                  <span>⚠️</span><span>This KYC was <strong>rejected</strong>. Review all documents carefully before re-approving.</span>
                </div>
              )}
              <div style={{ background:'#FFFBEB', border:'1px solid #FDE68A', borderRadius:10, padding:'10px 14px', marginBottom:18, fontSize:13, color:'#92400E', display:'flex', alignItems:'center', gap:8 }}>
                <span>⚠️</span><span>Verify all documents are clear, legible, and belong to the same person. Click any document to open the full-size image.</span>
              </div>

              {hasAnyDoc ? (
                <>
                  <div style={{ marginBottom:20 }}>
                    <SectionDivider icon="🪪" label="Identity Documents" bg="#EFF6FF"/>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                      <DocumentCard
                        title="Aadhaar Card (Front)"
                        emoji="🪪"
                        url={aadhar}
                        accentColor="#3B82F6"
                        accentBg="linear-gradient(135deg,#EFF6FF,#DBEAFE)"
                        flagged={isFailed}
                      />
                      <DocumentCard
                        title="PAN Card"
                        emoji="💳"
                        url={pan}
                        accentColor="#8B5CF6"
                        accentBg="linear-gradient(135deg,#F5F3FF,#EDE9FE)"
                        flagged={isFailed}
                      />
                    </div>
                  </div>

                  {passport && (
                    <div style={{ marginBottom:20 }}>
                      <SectionDivider icon="📔" label="Passport" bg="#FFF7ED"/>
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                        <DocumentCard
                          title="Passport"
                          emoji="📔"
                          url={passport}
                          accentColor="#F97316"
                          accentBg="linear-gradient(135deg,#FFF7ED,#FFEDD5)"
                          flagged={isFailed}
                        />
                      </div>
                    </div>
                  )}

                  <div style={{ marginBottom:20 }}>
                    <SectionDivider icon="🤳" label="Live Selfie" bg="#F0FDF4"/>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                      <DocumentCard
                        title="Live Selfie"
                        emoji="🤳"
                        url={selfie}
                        accentColor="#10B981"
                        accentBg="linear-gradient(135deg,#F0FDF4,#ECFDF5)"
                        flagged={isFailed}
                      />
                    </div>
                  </div>

                  {(cancelCheque || bankStatement || passbook) && (
                    <div style={{ marginBottom:20 }}>
                      <SectionDivider icon="🏦" label="Bank Documents" bg="#FFFBEB"/>
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:14 }}>
                        <DocumentCard
                          title="Cancel Cheque"
                          emoji="🏦"
                          url={cancelCheque}
                          accentColor="#3B82F6"
                          accentBg="linear-gradient(135deg,#EFF6FF,#DBEAFE)"
                          flagged={isFailed}
                        />
                        <DocumentCard
                          title="Bank Statement"
                          emoji="📄"
                          url={bankStatement}
                          accentColor="#8B5CF6"
                          accentBg="linear-gradient(135deg,#F5F3FF,#EDE9FE)"
                          flagged={isFailed}
                        />
                        <DocumentCard
                          title="Passbook"
                          emoji="📒"
                          url={passbook}
                          accentColor="#F59E0B"
                          accentBg="linear-gradient(135deg,#FFFBEB,#FEF3C7)"
                          flagged={isFailed}
                        />
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div style={{ textAlign:'center', padding:'40px 20px', color:'var(--gray-400)' }}>
                  <div style={{ fontSize:32, marginBottom:10 }}>📄</div>
                  <div style={{ fontSize:14, fontWeight:600 }}>No documents uploaded yet</div>
                  <div style={{ fontSize:12, marginTop:4 }}>This user has not submitted any KYC documents.</div>
                </div>
              )}
            </>
          )}

          {!detailLoading && tab === 'action' && (
            <>
              <div style={{ background:'#F8FAFC', borderRadius:12, padding:'14px 16px', marginBottom:20, border:'1px solid var(--gray-200)' }}>
                <div style={{ fontSize:12, fontWeight:600, color:'var(--navy)', marginBottom:6 }}>Current Status</div>
                <Badge s={status}/>
                {status !== 'In Review' && (
                  <div style={{ fontSize:12, color:'var(--gray-400)', marginTop:8 }}>
                    ℹ️ Backend only allows approve/reject on records with status <code>under_review</code>.
                  </div>
                )}
              </div>
              <div style={{ marginBottom:20 }}>
                <div className="section-title">Approve KYC</div>
                <p style={{ fontSize:13, color:'var(--gray-600)', marginBottom:12, lineHeight:1.5 }}>Approving will activate the user's wallet and allow them to send/receive PYO tokens.</p>
                <button
                  className="btn btn-success"
                  style={{ width:'100%', padding:'11px', fontSize:13, opacity: status === 'In Review' ? 1 : 0.5 }}
                  disabled={status !== 'In Review'}
                  onClick={()=>onApprove(user._id)}>
                  ✅ Approve KYC & Activate Wallet
                </button>
              </div>
              <div style={{ border:'1px solid var(--gray-200)', borderRadius:12, padding:'16px' }}>
                <div className="section-title">Reject KYC</div>
                <p style={{ fontSize:13, color:'var(--gray-600)', marginBottom:10 }}>Provide a clear reason so the user knows what to fix:</p>
                <textarea rows={3} placeholder="e.g. Aadhaar & PAN name mismatch, selfie unclear..." value={reason} onChange={e=>setReason(e.target.value)}/>
                <button
                  className="btn btn-danger"
                  style={{ width:'100%', padding:'11px', fontSize:13, marginTop:10, opacity: (reason.trim() && status === 'In Review') ? 1 : 0.5 }}
                  disabled={status !== 'In Review'}
                  onClick={()=>{if(reason.trim())onReject(user._id, reason);}}>
                  ❌ Reject KYC
                </button>
                {!reason.trim() && status === 'In Review' && <div style={{ fontSize:11, color:'var(--gray-400)', marginTop:5, textAlign:'center' }}>Enter a rejection reason first</div>}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Main KYCReview Page ─── */
export default function KYCReview() {
  const { confirm, adminRole } = useContext(AppCtx);
  // Only super_admin and kyc_admin can approve/reject KYC submissions
  const canApproveReject = ['super_admin', 'kyc_admin'].includes(adminRole);
  const [data, setData]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [sel, setSel]           = useState(null);
  const [fStatus, setFS]        = useState('All');
  const [search, setSrch]       = useState('');
  const [toast, setToast]       = useState(null);
  const [page, setPage]         = useState(1);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const perPage = 8;

  const showToast = (msg, type) => { setToast({msg,type}); setTimeout(()=>setToast(null), 3200); };

  const loadData = () => {
    setLoading(true);
    // Backend response: { success, total, page, totalPages, kycs: [...] }
    getAllSubmissions()
      .then(res => {
        const arr = res.data?.kycs || [];
        // Normalize and enrich each record
        const enriched = (Array.isArray(arr) ? arr : []).map((r, idx) => ({
          ...r,
          _normalStatus: normalizeStatus(r.status),
          _initials:     getInitials(r.fullName || r.userId?.name || '?'),
          _color:        COLORS[idx % COLORS.length],
        }));
        setData(enriched);
      })
      .catch(() => showToast('Failed to load KYC submissions', 'err'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const approve = async (id) => {
    try {
      await approveKYC(id);
      setData(p => p.map(r => r._id===id ? {...r, status:'approved', _normalStatus:'Approved'} : r));
      setSel(null);
      showToast('KYC Approved — Wallet activated!', 'ok');
    } catch (err) {
      showToast(err.response?.data?.message || 'Approval failed', 'err');
    }
  };

  const reject = async (id, reason) => {
    try {
      await rejectKYC(id, reason);
      setData(p => p.map(r => r._id===id ? {...r, status:'rejected', _normalStatus:'Failed', rejectionReason:reason} : r));
      setSel(null);
      showToast('KYC Rejected. User notified.', 'err');
    } catch (err) {
      showToast(err.response?.data?.message || 'Rejection failed', 'err');
    }
  };

  const quickApprove = (id) => {
    const user = data.find(r => r._id===id);
    const name = user?.fullName || user?.userId?.name || 'this user';
    confirm({
      title: 'Approve KYC',
      message: `Are you sure you want to approve KYC for ${name}? Their wallet will be activated.`,
      confirmLabel: '✅ Yes, Approve',
      cancelLabel: 'Cancel',
      type: 'success',
    }, () => approve(id));
  };

  const quickReject = (id) => { setRejectTarget(id); setRejectReason(''); };
  const submitQuickReject = () => {
    if (!rejectReason.trim()) return;
    reject(rejectTarget, rejectReason);
    setRejectTarget(null);
    setRejectReason('');
  };

  const counts = {
    All:         data.length,
    Pending:     data.filter(r=>r._normalStatus==='Pending').length,
    'In Review': data.filter(r=>r._normalStatus==='In Review').length,
    Approved:    data.filter(r=>r._normalStatus==='Approved').length,
    Failed:      data.filter(r=>r._normalStatus==='Failed').length,
  };

  const filtered = data.filter(r => {
    const ms = fStatus==='All' || r._normalStatus===fStatus;
    const name   = r.fullName || r.userId?.name || '';
    const id     = r._id || '';
    const mobile = r.userId?.mobile || '';
    const email  = r.userId?.email  || '';
    const q = search.toLowerCase();
    const mq = !search
      || name.toLowerCase().includes(q)
      || String(id).toLowerCase().includes(q)
      || mobile.toLowerCase().includes(q)
      || email.toLowerCase().includes(q);
    return ms && mq;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page-1)*perPage, page*perPage);

  return (
    <div className="page">
      <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div className="page-header">
        <div className="page-header-left">
          <h2>KYC Review</h2>
          <p>Review all submitted identity documents. Approve or reject user KYC requests.</p>
        </div>
        <button className="btn btn-outline" onClick={loadData} style={{ fontSize:13 }}>
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>
          Refresh
        </button>
      </div>

      <div className="card">
        <div className="filter-bar">
          <div className="search-field">
            <svg width="14" height="14" fill="none" stroke="var(--gray-400)" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input placeholder="Search by name, mobile, email or ID..." value={search} onChange={e=>{setSrch(e.target.value);setPage(1);}}/>
          </div>
          <StatusFilterDropdown value={fStatus} onChange={v=>{setFS(v);setPage(1);}} counts={counts}/>
          <div className="filter-count">{filtered.length} results</div>
        </div>

        <div className="table-wrap">
          <table>
            <thead><tr><th>User</th><th>Documents Submitted</th><th>Submitted On</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {loading
                ? Array(6).fill(0).map((_,i) => (
                    <tr key={i}>
                      <td><div style={{ display:'flex', alignItems:'center', gap:10 }}><Skeleton w={34} h={34} radius={8}/><div><Skeleton w={120} h={12} radius={4} style={{ marginBottom:4 }}/><Skeleton w={80} h={10} radius={4}/></div></div></td>
                      <td><div style={{ display:'flex', gap:4 }}><Skeleton w={60} h={20} radius={20}/><Skeleton w={50} h={20} radius={20}/><Skeleton w={55} h={20} radius={20}/></div></td>
                      <td><Skeleton w={100} h={12} radius={4}/></td>
                      <td><Skeleton w={70} h={22} radius={20}/></td>
                      <td><Skeleton w={80} h={28} radius={8}/></td>
                    </tr>
                  ))
                : paged.map(r => {
                    const name      = r.fullName || r.userId?.name || 'Unknown';
                    const userIdStr = r._id || '';
                    const mobile    = r.userId?.mobile || '';
                    const status    = r._normalStatus;
                    const initials  = r._initials;
                    const color     = r._color;
                    const dateStr   = r.createdAt || '';
                    const formatted = dateStr ? new Date(dateStr).toLocaleString('en-IN', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' }) : '—';
                    // Build document badges based on what's actually uploaded
                    const docs = [];
                    if (r.aadharFrontUrl)    docs.push('🪪 Aadhaar');
                    if (r.panCardUrl)        docs.push('💳 PAN');
                    if (r.passportUrl)       docs.push('📔 Passport');
                    if (r.selfieUrl)         docs.push('🤳 Selfie');
                    if (r.cancelChequeUrl || r.cancelledChequeUrl)  docs.push('🏦 Cheque');
                    if (r.bankStatementUrl || r.statementUrl)         docs.push('📄 Statement');
                    if (r.passbookUrl)       docs.push('📒 Passbook');
                    return (
                      <tr key={r._id}>
                        <td>
                          <div className="user-cell">
                            <div className="avatar" style={{ background:color }}>{initials}</div>
                            <div>
                              <div className="uname">{name}</div>
                              <div className="uid">{mobile || String(userIdStr).slice(-10)}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
                            {docs.length === 0
                              ? <span style={{ fontSize:12, color:'var(--gray-400)' }}>—</span>
                              : docs.map(d=><span key={d} className="doc-badge">{d}</span>)}
                          </div>
                        </td>
                        <td style={{ color:'var(--gray-400)', fontSize:13 }}>{formatted}</td>
                        <td><Badge s={status}/></td>
                        <td>
                          <div className="act-group">
                            <button className="btn btn-outline" style={{ fontSize:12, padding:'5px 11px' }} onClick={()=>setSel(r)}>👁 Review</button>
                            {canApproveReject && status==='In Review' && <>
                              <button className="btn btn-ghost icon-btn" title="Approve" onClick={()=>quickApprove(r._id)} style={{ color:'var(--green)' }}>
                                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                              </button>
                              <button className="btn btn-ghost icon-btn" title="Reject" onClick={()=>quickReject(r._id)} style={{ color:'var(--red)' }}>
                                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                              </button>
                            </>}
                          </div>
                        </td>
                      </tr>
                    );
                  })
              }
            </tbody>
          </table>
          {!loading && paged.length===0 && <div className="empty">No KYC requests match your filters.</div>}
        </div>

        {!loading && (
          <div className="pagination">
            <div className="pag-info">Showing {Math.min((page-1)*perPage+1,filtered.length)}–{Math.min(page*perPage,filtered.length)} of {filtered.length}</div>
            <div className="pag-btns">
              <button className="pag-btn" disabled={page===1} onClick={()=>setPage(p=>p-1)}>‹</button>
              {Array.from({length:totalPages},(_,i)=>(<button key={i+1} className={`pag-btn${page===i+1?' act':''}`} onClick={()=>setPage(i+1)}>{i+1}</button>))}
              <button className="pag-btn" disabled={page===totalPages} onClick={()=>setPage(p=>p+1)}>›</button>
            </div>
          </div>
        )}
      </div>

      {sel && <Modal user={sel} onClose={()=>setSel(null)} onApprove={approve} onReject={reject} canApproveReject={canApproveReject}/>}

      {rejectTarget && (
        <div className="overlay" onClick={e=>e.target===e.currentTarget&&setRejectTarget(null)}>
          <div className="modal" style={{ maxWidth:420 }}>
            <div className="modal-head">
              <h3>Reject KYC</h3>
              <button className="btn btn-ghost icon-btn" onClick={()=>setRejectTarget(null)}>
                <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize:13.5, color:'var(--gray-600)', marginBottom:16, lineHeight:1.6 }}>
                Provide a clear reason so the user knows what to fix before resubmitting.
              </p>
              <textarea rows={4} placeholder="e.g. Aadhaar & PAN name mismatch, selfie is blurry..." value={rejectReason} onChange={e=>setRejectReason(e.target.value)} autoFocus/>
              {!rejectReason.trim() && <div style={{ fontSize:11.5, color:'var(--gray-400)', marginTop:6 }}>⚠️ Reason is required before rejecting.</div>}
            </div>
            <div className="modal-foot">
              <button className="btn btn-outline" onClick={()=>setRejectTarget(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={submitQuickReject} disabled={!rejectReason.trim()} style={{ opacity:rejectReason.trim()?1:0.5 }}>❌ Reject KYC</button>
            </div>
          </div>
        </div>
      )}

      <div className="toast-stack">{toast && <Toast msg={toast.msg} type={toast.type}/>}</div>
    </div>
  );
}