export function IconInfo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 11v5.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="12" cy="7.7" r="1" fill="currentColor" />
    </svg>
  );
}

export function IconSun({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none">
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M12 2.5v2M12 19.5v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2.5 12h2M19.5 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconMoon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none">
      <path
        d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconMenu({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none">
      <path
        d="M4 7h16M4 12h16M4 17h16"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconClose({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none">
      <path
        d="M6 6l12 12M18 6L6 18"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconChevronDown({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none">
      <path
        d="M6 9l6 6 6-6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconGithub({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M12 2C6.5 2 2 6.6 2 12.2c0 4.5 2.9 8.3 6.8 9.6.5.1.7-.2.7-.5v-1.9c-2.8.6-3.4-1.3-3.4-1.3-.4-1.2-1.1-1.5-1.1-1.5-.9-.6.1-.6.1-.6 1 .1 1.6 1.1 1.6 1.1.9 1.6 2.3 1.1 2.9.9.1-.7.4-1.1.6-1.4-2.2-.3-4.6-1.1-4.6-5 0-1.1.4-2 1-2.7-.1-.3-.5-1.3.1-2.7 0 0 .9-.3 2.9 1a9.6 9.6 0 0 1 5.2 0c2-1.3 2.9-1 2.9-1 .6 1.4.2 2.4.1 2.7.6.7 1 1.6 1 2.7 0 3.9-2.4 4.7-4.6 5 .4.3.7 1 .7 2v3c0 .3.2.6.7.5 4-1.3 6.8-5.1 6.8-9.6C22 6.6 17.5 2 12 2Z" />
    </svg>
  );
}

export function IconKey({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none">
      <circle cx="8" cy="15" r="4" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M11 12l9-9M17 3l3 3M14 6l2.5 2.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconGlobe({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M3 12h18M12 3c2.5 2.5 3.8 5.7 3.8 9s-1.3 6.5-3.8 9c-2.5-2.5-3.8-5.7-3.8-9S9.5 5.5 12 3Z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
    </svg>
  );
}

/* ---------- אייקונים כלליים (קו 1.6, currentColor) - מחליפים אימוג'י בממשק ---------- */

type IconProps = { className?: string };

function Line({ className, children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

export const IconCheck = ({ className }: IconProps) => (
  <Line className={className}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </Line>
);

/**
 * לוגו WEblok: ארבעה "בלוקים" ברשת 2×2 שמתחברים בלשוניות פאזל, והרביעי (בצבע
 * מלא) בדיוק ננעל למקומו - "החלק שחסר לאתר שלך". currentColor, עובד בשני המצבים.
 */
export function IconLogo({ className }: IconProps) {
  return (
    <svg viewBox="0 0 32 32" className={className} fill="none" aria-hidden="true" focusable="false">
      <rect x="3" y="3" width="12" height="12" rx="3.2" fill="currentColor" fillOpacity="0.22" />
      <rect x="3" y="17" width="12" height="12" rx="3.2" fill="currentColor" fillOpacity="0.38" />
      <rect x="17" y="17" width="12" height="12" rx="3.2" fill="currentColor" fillOpacity="0.22" />
      {/* לשוניות החיבור בין הבלוקים */}
      <circle cx="9" cy="16" r="2.3" fill="currentColor" fillOpacity="0.38" />
      <circle cx="16" cy="23" r="2.3" fill="currentColor" fillOpacity="0.38" />
      {/* החלק האחרון - נכנס למקום בזווית קלה */}
      <g transform="rotate(-8 23 9)">
        <path
          d="M20 2.6h6a3.2 3.2 0 0 1 3.2 3.2v6a3.2 3.2 0 0 1-3.2 3.2h-6a3.2 3.2 0 0 1-3.2-3.2V11a2.2 2.2 0 1 0 0-4.4V5.8A3.2 3.2 0 0 1 20 2.6Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}
