// Arte de la cabecera: una paleta de pádel con su pelotita tapando medio sol de mayo, que tiene un ojo re fumado y un faso.
export default function FlagArt() {
  return (
    <div className="flag-art" aria-hidden="true">
      <svg className="paddle" viewBox="0 0 80 120">
        <g transform="rotate(-20 40 60)">
          <rect x="35" y="72" width="10" height="40" rx="4" fill="#0b2a4a" stroke="#fff" strokeWidth="2.5" />
          <path d="M40 4 C62 4 72 20 72 40 C72 62 56 78 40 78 C24 78 8 62 8 40 C8 20 18 4 40 4 Z" fill="#0b2a4a" stroke="#fff" strokeWidth="3" />
          <path d="M40 10 C58 10 66 24 66 40 C66 58 54 71 40 71 C26 71 14 58 14 40 C14 24 22 10 40 10 Z" fill="#74acdf" />
          {[[30, 26], [40, 22], [50, 26], [26, 37], [36, 34], [46, 34], [56, 37], [30, 47], [40, 45], [50, 47], [34, 57], [46, 57]].map(([x, y]) => <circle key={x + "-" + y} cx={x} cy={y} r="2.6" fill="#0b2a4a" />)}
        </g>
        <circle cx="66" cy="96" r="10" fill="#d7f34a" stroke="#fff" strokeWidth="2" />
        <path d="M58 90 Q66 96 58 103 M74 89 Q66 96 74 103" stroke="#fff" strokeWidth="1.6" fill="none" />
      </svg>
      <svg className="sun" viewBox="-60 -60 120 120">
        <g className="rays">
          {Array.from({ length: 32 }, (_, i) => (
            <path key={i} d={i % 2 ? "M-2 -27 Q0 -42 2 -27 Z" : "M-2.6 -27 L0 -50 L2.6 -27 Z"} transform={`rotate(${i * 11.25})`} />
          ))}
        </g>
        <circle className="face" r="26" />
        {/* un solo ojo, re rojo y castigado */}
        <g transform="translate(13 -4) scale(1.25)">
          <ellipse cy="5.5" rx="8" ry="3" fill="#b8742a" opacity=".45" />
          <ellipse rx="8" ry="6" fill="#ff8a80" stroke="#b71c1c" strokeWidth=".8" />
          <path d="M-7.5 1 L-3 0.2 L-1.5 1.4 M7.5 2 L3.5 0.8 L2.5 2 M-6 3.5 L-2.5 2.4 M6.5 -1 L3 0 M0 4.8 L0.6 2.8" stroke="#b71c1c" strokeWidth=".75" fill="none" />
          <circle cy="2.2" r="2.6" fill="#3b1d0a" />
          <circle cx=".8" cy="1.4" r=".7" fill="#fff" />
          <path d="M-8.2 1.2 A8 6 0 0 1 8.2 1.2 Z" fill="#d99a00" />
          <path d="M-8.2 1.2 Q0 -0.6 8.2 1.2" stroke="#7a4a00" strokeWidth="1.4" fill="none" strokeLinecap="round" />
        </g>
        {/* sonrisa tranqui */}
        <path d="M-9 10 Q-1 15 6 10" stroke="#8a5a00" strokeWidth="1.8" fill="none" strokeLinecap="round" />
        {/* porro */}
        <g transform="translate(5 12) rotate(-18)">
          <path d="M0 -2 L26 -3.2 L26 3.2 L0 2 Z" fill="#f7f3ea" stroke="#cfc6b0" strokeWidth=".6" />
          <rect x="24.5" y="-3.4" width="3.2" height="6.8" rx="1.2" fill="#ff7a1a" />
          <circle cx="27.2" cy="0" r="1.6" fill="#ffd54a" />
        </g>
        {/* humo */}
        <g className="smoke" fill="none" strokeLinecap="round">
          <path d="M31 2 C 35 -6 28 -12 33 -20 C 38 -28 31 -34 36 -42" />
          <path d="M34 -4 C 40 -10 36 -18 42 -24" opacity=".7" />
        </g>
      </svg>
    </div>
  );
}
