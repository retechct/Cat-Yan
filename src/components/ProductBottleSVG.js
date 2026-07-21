import React from 'react';

export default function ProductBottleSVG({ producto: p }) {
  const gradientId = `bottle-gradient-${p.id}`;
  const glowId = `bottle-glow-${p.id}`;

  return (
    <svg className="bottle-svg" viewBox="0 0 180 230" role="img" aria-label={p.nombre}>
      <defs>
        <linearGradient id={gradientId} x1="32" y1="20" x2="148" y2="204" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.9" />
          <stop offset="0.45" stopColor={p.color} stopOpacity="0.74" />
          <stop offset="1" stopColor="#201515" stopOpacity="0.3" />
        </linearGradient>
        <filter id={glowId} x="-35%" y="-35%" width="170%" height="170%">
          <feDropShadow dx="0" dy="18" stdDeviation="12" floodColor={p.color} floodOpacity="0.28" />
        </filter>
      </defs>

      <ellipse cx="90" cy="208" rx="48" ry="10" fill="#211716" opacity="0.13" />
      <rect x="68" y="8" width="44" height="28" rx="8" fill="#24201e" />
      <rect x="76" y="34" width="28" height="18" rx="5" fill={p.color} opacity="0.75" />
      <path
        d="M48 64 C48 50 132 50 132 64 L145 185 C147 202 133 211 90 211 C47 211 33 202 35 185 Z"
        fill={`url(#${gradientId})`}
        filter={`url(#${glowId})`}
      />
      <path d="M57 72 C53 104 52 145 59 182" stroke="#fff" strokeWidth="10" strokeLinecap="round" opacity="0.2" />
      <rect x="53" y="115" width="74" height="54" rx="8" fill="#fffaf3" opacity="0.92" />
      <text x="90" y="137" textAnchor="middle" fontFamily="Cormorant Garamond, serif" fontSize="16" fontStyle="italic" fill="#211716">
        {p.nombre.split(' ')[0]}
      </text>
      <text x="90" y="153" textAnchor="middle" fontFamily="Jost, sans-serif" fontSize="7" letterSpacing="2" fill={p.color}>
        {p.nombre.split(' ').slice(1).join(' ').toUpperCase() || 'PARFUM'}
      </text>
      <text x="90" y="164" textAnchor="middle" fontFamily="Jost, sans-serif" fontSize="6" letterSpacing="1.6" fill="#8d7773">
        EAU DE PARFUM
      </text>
    </svg>
  );
}
