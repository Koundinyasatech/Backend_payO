export function PayoWideLogo() {
  return (
    <svg width="200" height="64" viewBox="0 0 200 64" xmlns="http://www.w3.org/2000/svg" aria-label="PayO — Scan. Pay. Done.">
      <defs>
        <linearGradient id="wOring" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8B5CF6"/>
          <stop offset="45%" stopColor="#3B82F6"/>
          <stop offset="100%" stopColor="#06B6D4"/>
        </linearGradient>
      </defs>
      {/* PAY */}
      <text x="0" y="38"
        fontFamily="'Arial Black','Impact',Arial,sans-serif"
        fontWeight="900" fontSize="42" letterSpacing="-1.5" fill="#FFFFFF">PAY</text>
      {/* O ring */}
      <circle cx="173" cy="22" r="19" fill="none" stroke="url(#wOring)" strokeWidth="7"/>
      {/* Left purple line */}
      <line x1="0" y1="50" x2="20" y2="50" stroke="#8B5CF6" strokeWidth="1.5" strokeLinecap="round"/>
      {/* SCAN. */}
      <text x="26" y="54" fontFamily="Arial,sans-serif" fontWeight="700" fontSize="9" letterSpacing="1.8" fill="#06B6D4">SCAN.</text>
      {/* PAY. */}
      <text x="76" y="54" fontFamily="Arial,sans-serif" fontWeight="700" fontSize="9" letterSpacing="1.8" fill="#8B5CF6">PAY.</text>
      {/* DONE. */}
      <text x="113" y="54" fontFamily="Arial,sans-serif" fontWeight="700" fontSize="9" letterSpacing="1.8" fill="#FFFFFF">DONE.</text>
      {/* Right cyan line */}
      <line x1="162" y1="50" x2="192" y2="50" stroke="#06B6D4" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

export function PayoIconLogo({ size = 48 }) {
  const r = size * 0.27;
  const cx = size * 0.88;
  const cy = size * 0.38;
  const sw = size * 0.11;
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" aria-label="PayO icon">
      <defs>
        <linearGradient id="iOring" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8B5CF6"/>
          <stop offset="45%" stopColor="#3B82F6"/>
          <stop offset="100%" stopColor="#06B6D4"/>
        </linearGradient>
        <linearGradient id="iGlow" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#06B6D4"/>
          <stop offset="50%" stopColor="#8B5CF6"/>
          <stop offset="100%" stopColor="#3B82F6"/>
        </linearGradient>
      </defs>
      {/* Glow border */}
      <rect x="1" y="1" width="46" height="46" rx="12" fill="none" stroke="url(#iGlow)" strokeWidth="1.5" opacity="0.9"/>
      {/* Black bg */}
      <rect x="2.5" y="2.5" width="43" height="43" rx="11" fill="#0A0A0A"/>
      {/* PAY small */}
      <text x="5" y="31"
        fontFamily="'Arial Black','Impact',Arial,sans-serif"
        fontWeight="900" fontSize="23" letterSpacing="-1" fill="#FFFFFF">PAY</text>
      {/* O ring */}
      <circle cx="42" cy="17" r="10" fill="none" stroke="url(#iOring)" strokeWidth="4"/>
    </svg>
  );
}

export default PayoWideLogo;
