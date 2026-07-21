import React from 'react';

/**
 * Este componente genera un frasco de perfume SVG con efecto 3D.
 * Es una adaptación a React de la lógica que creamos para el archivo HTML.
 * NOTA: Asume que tienes las fuentes 'Cormorant Garamond' y 'Jost' importadas
 * en tu CSS global o en tu index.html.
 */
export default function ProductBottleSVG({ producto: p, width = 140, height = 180 }) {
    // Defs para gradientes y sombras
    const defs = (
        <defs>
            <radialGradient id={`glass-${p.id}`} cx="35%" cy="30%" r="70%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8"/>
                <stop offset="100%" stopColor={p.color} stopOpacity="0.9"/>
            </radialGradient>
            <linearGradient id="metalCap" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#dddddd"/>
                <stop offset="40%" stopColor="#ffffff"/>
                <stop offset="100%" stopColor="#888888"/>
            </linearGradient>
            <filter id={`shadow-${p.id}`} x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="12" stdDeviation="8" floodColor={p.color} floodOpacity="0.25"/>
            </filter>
        </defs>
    );

    // Etiqueta común para todos los frascos
    const label = (
        <>
            <rect x="35" y="90" width="70" height="40" rx="2" fill="rgba(255,255,255,0.85)"/>
            <text x="70" y="108" textAnchor="middle" fontFamily="Cormorant Garamond, serif" fontStyle="italic" fontSize="11" fill="#2a2522">{p.nombre.split(' ')[0]}</text>
            <text x="70" y="120" textAnchor="middle" fontFamily="Jost, sans-serif" fontSize="6" letterSpacing="2" fill={p.color}>YANBAL</text>
        </>
    );

    let body;

    if (p.categoria === 'Mujer') {
        // Frasco Ovalado
        body = (
            <>
                <ellipse cx="70" cy="175" rx="40" ry="6" fill="#000000" opacity="0.1" filter={`url(#shadow-${p.id})`}/>
                <ellipse cx="70" cy="105" rx="55" ry="70" fill={`url(#glass-${p.id})`}/>
                <path d="M 25 105 A 45 60 0 0 1 40 50 Q 30 105 30 140 A 45 60 0 0 1 25 105" fill="rgba(255,255,255,0.4)"/>
                <ellipse cx="45" cy="55" rx="8" ry="4" fill="#ffffff" opacity="0.7" transform="rotate(-30 45 55)"/>
                <rect x="58" y="10" width="24" height="25" rx="12" fill="url(#metalCap)"/>
                <rect x="55" y="30" width="30" height="6" rx="2" fill="url(#metalCap)"/>
            </>
        );
    } else if (p.categoria === 'Hombre') {
        // Frasco Rectangular
        body = (
            <>
                <ellipse cx="70" cy="170" rx="35" ry="4" fill="#000000" opacity="0.1" filter={`url(#shadow-${p.id})`}/>
                <rect x="35" y="45" width="70" height="125" rx="4" fill={`url(#glass-${p.id})`}/>
                <rect x="38" y="48" width="8" height="119" rx="2" fill="rgba(255,255,255,0.3)"/>
                <ellipse cx="50" cy="55" rx="5" ry="2" fill="#ffffff" opacity="0.6"/>
                <rect x="45" y="10" width="50" height="30" rx="2" fill="url(#metalCap)"/>
                <rect x="40" y="35" width="60" height="10" rx="2" fill="#2a2522"/>
            </>
        );
    } else { // Unisex
        // Frasco Geométrico
        body = (
            <>
                <ellipse cx="70" cy="175" rx="35" ry="5" fill="#000000" opacity="0.1" filter={`url(#shadow-${p.id})`}/>
                <polygon points="70,45 115,75 100,170 40,170 25,75" fill={`url(#glass-${p.id})`}/>
                <polygon points="70,45 40,75 25,75" fill="rgba(255,255,255,0.4)"/>
                <polygon points="40,75 25,75 40,170 50,170" fill="rgba(255,255,255,0.2)"/>
                <polygon points="55,10 85,10 90,35 50,35" fill="url(#metalCap)"/>
                <rect x="52" y="35" width="36" height="10" fill="url(#metalCap)"/>
            </>
        );
    }

    return (
        <svg viewBox="0 0 140 190" width={width} height={height} xmlns="http://www.w3.org/2000/svg">
            {defs}
            {body}
            {label}
        </svg>
    );
}