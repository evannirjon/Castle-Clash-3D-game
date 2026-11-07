import React from 'react';

export function TitleCrestSvg({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 680 125"
      className={`select-none ${className}`}
      role="img"
      aria-label="Castle Clash — Castle of Gaza vs Castle of Epstein"
    >
      <defs>
        <linearGradient id="steelTitle" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="45%" stopColor="#cbd5e1" />
          <stop offset="85%" stopColor="#64748b" />
          <stop offset="100%" stopColor="#334155" />
        </linearGradient>
        <filter id="crestShadow" x="-10%" y="-10%" width="120%" height="130%">
          <feDropShadow dx="0" dy="5" stdDeviation="5" floodColor="#000000" floodOpacity="0.9" />
        </filter>
      </defs>

      <g filter="url(#crestShadow)">
        {/* Metallic Steel Main Title: CASTLE CLASH */}
        <text
          x="340"
          y="62"
          textAnchor="middle"
          fill="url(#steelTitle)"
          stroke="#090a0f"
          strokeWidth="9"
          paintOrder="stroke fill"
          fontFamily="'Cinzel', Georgia, serif"
          fontWeight="900"
          fontSize="54"
          letterSpacing="3"
        >
          CASTLE CLASH
        </text>

        {/* Castle of Gaza vs Castle of Epstein Banner Plaque */}
        <rect
          x="130"
          y="80"
          width="420"
          height="32"
          rx="6"
          fill="#0f172a"
          fillOpacity="0.92"
          stroke="#f59e0b"
          strokeWidth="2.5"
        />
        <text
          x="340"
          y="101"
          textAnchor="middle"
          fill="#fde68a"
          fontFamily="'Cinzel', Georgia, serif"
          fontWeight="700"
          fontSize="14"
          letterSpacing="2"
        >
          CASTLE OF GAZA VS CASTLE OF EPSTEIN
        </text>
      </g>
    </svg>
  );
}

export function EnemyFlagSvg({ className = 'w-7 h-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 60 40" className={`select-none ${className}`} role="img" aria-label="Castle of Epstein Flag">
      {/* 9 Alternating Red & White Horizontal Stripes */}
      <rect x="0" y="0" width="60" height="40" fill="#ffffff" />
      <rect x="0" y="0" width="60" height="4.5" fill="#b91c1c" />
      <rect x="0" y="8.9" width="60" height="4.5" fill="#b91c1c" />
      <rect x="0" y="17.8" width="60" height="4.5" fill="#b91c1c" />
      <rect x="0" y="26.7" width="60" height="4.5" fill="#b91c1c" />
      <rect x="0" y="35.5" width="60" height="4.5" fill="#b91c1c" />

      {/* Navy Blue Canton with White Star of David */}
      <rect x="0" y="0" width="27" height="22.3" fill="#1e295b" />
      <polygon
        points="13.5,3.2 20.5,15.5 6.5,15.5"
        fill="none"
        stroke="#ffffff"
        strokeWidth="2.1"
      />
      <polygon
        points="13.5,19.1 20.5,6.8 6.5,6.8"
        fill="none"
        stroke="#ffffff"
        strokeWidth="2.1"
      />

      {/* Border */}
      <rect x="0.5" y="0.5" width="59" height="39" fill="none" stroke="#090a0f" strokeWidth="1.5" />
    </svg>
  );
}

export function CastleTowerShieldSvg({ className = 'w-9 h-10' }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 46" className={className} aria-hidden="true">
      <path
        d="M4 4 H36 V24 C36 34 20 42 20 42 C20 42 4 34 4 24 Z"
        fill="#334155"
        stroke="#090a0f"
        strokeWidth="3"
      />
      <path
        d="M7 7 H33 V23 C33 31 20 38 20 38 C20 38 7 31 7 23 Z"
        fill="#475569"
        stroke="#94a3b8"
        strokeWidth="1.5"
      />
      {/* Stone Castle Tower Icon */}
      <path
        d="M12 12 H15 V15 H18 V12 H22 V15 H25 V12 H28 V18 L26 32 H14 L12 18 Z"
        fill="#d6d3d1"
        stroke="#090a0f"
        strokeWidth="2"
      />
      <rect x="18" y="23" width="4" height="9" rx="2" fill="#090a0f" />
    </svg>
  );
}

export function DemonSkullShieldSvg({ className = 'w-9 h-10' }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 46" className={className} aria-hidden="true">
      <path
        d="M4 4 H36 V24 C36 34 20 42 20 42 C20 42 4 34 4 24 Z"
        fill="#1e293b"
        stroke="#090a0f"
        strokeWidth="3"
      />
      <path
        d="M7 7 H33 V23 C33 31 20 38 20 38 C20 38 7 31 7 23 Z"
        fill="#334155"
        stroke="#64748b"
        strokeWidth="1.5"
      />
      {/* Purple Horned Demon Skull Icon */}
      <path
        d="M11 12 L15 16 C18 14 22 14 25 16 L29 12 L27 21 C27 27 24 31 20 32 C16 31 13 27 13 21 Z"
        fill="#c084fc"
        stroke="#090a0f"
        strokeWidth="2"
      />
      <circle cx="17" cy="22" r="2" fill="#090a0f" />
      <circle cx="23" cy="22" r="2" fill="#090a0f" />
    </svg>
  );
}

export function HudIconSvg({
  kind,
  className = 'w-5 h-5',
}: {
  kind:
    | 'gold'
    | 'crown'
    | 'sword'
    | 'bow'
    | 'knight'
    | 'catapult'
    | 'wall'
    | 'tower'
    | 'dragon'
    | 'skill'
    | 'sound_on'
    | 'sound_off'
    | 'pause'
    | 'restart'
    | 'heart';
  className?: string;
}) {
  switch (kind) {
    case 'gold':
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <circle cx="12" cy="12" r="9" fill="#f59e0b" stroke="#090a0f" strokeWidth="2.5" />
          <circle cx="12" cy="12" r="6" fill="#fbbf24" stroke="#b45309" strokeWidth="1.5" />
          <path d="M12 8v8M9.5 10.5h5" stroke="#fef08a" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case 'crown':
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <path
            d="M3 18h18l-2-10-4.5 4L12 6 9.5 12 5 8z"
            fill="#f59e0b"
            stroke="#090a0f"
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
          <path d="M5 15h14" stroke="#fef08a" strokeWidth="1.5" />
        </svg>
      );
    case 'sword':
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <path
            d="M19 4l-9 9-2-2 9-9h2v2z"
            fill="#e2e8f0"
            stroke="#090a0f"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path d="M6 12l6 6M5 19l3-3" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      );
    case 'bow':
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <path
            d="M6 4c8 2 10 14 0 16"
            fill="none"
            stroke="#38bdf8"
            strokeWidth="2.8"
            strokeLinecap="round"
          />
          <line x1="6" y1="4" x2="6" y2="20" stroke="#e2e8f0" strokeWidth="1.5" />
          <line x1="4" y1="12" x2="19" y2="12" stroke="#fcd34d" strokeWidth="2.2" />
          <polygon points="20,12 16,9.5 16,14.5" fill="#fef08a" />
        </svg>
      );
    case 'knight':
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <path
            d="M12 3l7 3v6c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V6l7-3z"
            fill="#38bdf8"
            stroke="#090a0f"
            strokeWidth="2.2"
          />
          <path d="M12 6v12M8 10h8" stroke="#fef08a" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case 'catapult':
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <rect x="4" y="15" width="16" height="4" rx="1" fill="#a855f7" stroke="#090a0f" strokeWidth="2" />
          <line x1="7" y1="15" x2="17" y2="6" stroke="#fde68a" strokeWidth="3" strokeLinecap="round" />
          <circle cx="18" cy="5" r="3" fill="#f97316" stroke="#090a0f" strokeWidth="1.5" />
          <circle cx="7" cy="19" r="2.5" fill="#475569" stroke="#090a0f" strokeWidth="1.8" />
          <circle cx="17" cy="19" r="2.5" fill="#475569" stroke="#090a0f" strokeWidth="1.8" />
        </svg>
      );
    case 'wall':
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <path
            d="M3 7h4v3h4V7h2v3h4V7h4v13H3V7z"
            fill="#94a3b8"
            stroke="#090a0f"
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
          <line x1="3" y1="14" x2="21" y2="14" stroke="#1e293b" strokeWidth="2" />
        </svg>
      );
    case 'tower':
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <path
            d="M7 4h3v2h4V4h3v5l-1 11H8L7 9V4z"
            fill="#38bdf8"
            stroke="#090a0f"
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
          <circle cx="12" cy="12" r="2.5" fill="#fef08a" />
        </svg>
      );
    case 'dragon':
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <path
            d="M3 13c3-6 8-8 14-8-2 3-1 5 3 6-4 2-6 5-5 9-3-3-7-4-12-7z"
            fill="#a855f7"
            stroke="#090a0f"
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
          <circle cx="14" cy="9" r="1.6" fill="#fef08a" />
        </svg>
      );
    case 'skill':
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <polygon
            points="12,2 15,9 22,12 15,15 12,22 9,15 2,12 9,9"
            fill="#eab308"
            stroke="#090a0f"
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
          <circle cx="12" cy="12" r="3" fill="#fef08a" />
        </svg>
      );
    case 'heart':
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <path
            d="M12 20s-7-4.5-9-9a5.2 5.2 0 0 1 9-4 5.2 5.2 0 0 1 9 4c-2 4.5-9 9-9 9z"
            fill="#ef4444"
            stroke="#090a0f"
            strokeWidth="2.2"
          />
        </svg>
      );
    case 'sound_on':
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <path d="M4 9h4l5-4v14l-5-4H4V9z" fill="#f3ead8" stroke="#090a0f" strokeWidth="2" />
          <path d="M16 9c1.5 1.5 1.5 4.5 0 6M19 6.5c3 3 3 8 0 11" fill="none" stroke="#fbbf24" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      );
    case 'sound_off':
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <path d="M4 9h4l5-4v14l-5-4H4V9z" fill="#64748b" stroke="#090a0f" strokeWidth="2" />
          <path d="M16 9l5 6M21 9l-5 6" stroke="#ef4444" strokeWidth="2.4" strokeLinecap="round" />
        </svg>
      );
    case 'pause':
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <rect x="6" y="5" width="4.5" height="14" rx="1" fill="#f3ead8" stroke="#090a0f" strokeWidth="2" />
          <rect x="13.5" y="5" width="4.5" height="14" rx="1" fill="#f3ead8" stroke="#090a0f" strokeWidth="2" />
        </svg>
      );
    case 'restart':
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <path
            d="M4 12a8 8 0 1 1 2.3 5.6"
            fill="none"
            stroke="#f3ead8"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <polygon points="4,6 4,13 11,13" fill="#fbbf24" stroke="#090a0f" strokeWidth="1.5" />
        </svg>
      );
  }
}
