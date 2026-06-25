export default function ConfirmDialog({ config, onConfirm, onCancel }) {
  if (!config) return null;
  const { title, message, confirmLabel, cancelLabel, type } = config;
  const colors = {
    danger:  { btn: '#EF4444', hover: '#DC2626', icon: '⚠️', bg: '#FEF2F2', border: '#FECACA' },
    success: { btn: '#10B981', hover: '#059669', icon: '✅', bg: '#F0FDF4', border: '#BBF7D0' },
    info:    { btn: '#2563EB', hover: '#1D4ED8', icon: 'ℹ️', bg: '#EFF6FF', border: '#BFDBFE' },
  };
  const c = colors[type] || colors.info;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 2000,
      background: 'rgba(13,27,62,0.6)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      animation: 'fadeIn 0.18s ease',
    }}>
      <div style={{
        background: 'var(--card-bg, #fff)',
        borderRadius: 18, width: '100%', maxWidth: 400,
        boxShadow: '0 24px 80px rgba(0,0,0,0.25)',
        animation: 'slideUp 0.22s ease',
        overflow: 'hidden',
      }}>
        {/* Top accent */}
        <div style={{ height: 4, background: `linear-gradient(90deg, ${c.btn}, ${c.hover})` }}/>

        <div style={{ padding: '28px 28px 24px' }}>
          {/* Icon + title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
            <div style={{
              width: 46, height: 46, borderRadius: 13,
              background: c.bg, border: `1.5px solid ${c.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0,
            }}>{c.icon}</div>
            <div>
              <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 16, fontWeight: 700, color: 'var(--dlg-title, #0D1B3E)', letterSpacing: '-0.2px' }}>{title}</div>
            </div>
          </div>

          {/* Message */}
          <p style={{ fontSize: 13.5, color: 'var(--dlg-msg, #475569)', lineHeight: 1.6, marginBottom: 24 }}>{message}</p>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button onClick={onCancel} style={{
              padding: '9px 20px', borderRadius: 9,
              border: '1.5px solid var(--dlg-border, #E2E8F0)',
              background: 'transparent', color: 'var(--dlg-cancel, #475569)',
              fontSize: 13, fontWeight: 500, cursor: 'pointer',
              fontFamily: "'Inter',sans-serif", transition: 'all 0.15s',
            }}
            onMouseEnter={e=>{ e.target.style.borderColor='#94A3B8'; e.target.style.color='#1E293B'; }}
            onMouseLeave={e=>{ e.target.style.borderColor='var(--dlg-border, #E2E8F0)'; e.target.style.color='var(--dlg-cancel, #475569)'; }}
            >{cancelLabel || 'Cancel'}</button>

            <button onClick={onConfirm} style={{
              padding: '9px 22px', borderRadius: 9,
              border: 'none', background: c.btn,
              color: '#fff', fontSize: 13, fontWeight: 600,
              cursor: 'pointer', fontFamily: "'Inter',sans-serif",
              boxShadow: `0 2px 10px ${c.btn}55`,
              transition: 'all 0.15s',
            }}
            onMouseEnter={e=>{ e.target.style.background=c.hover; e.target.style.transform='translateY(-1px)'; }}
            onMouseLeave={e=>{ e.target.style.background=c.btn; e.target.style.transform='translateY(0)'; }}
            >{confirmLabel || 'Confirm'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
