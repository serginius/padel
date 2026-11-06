// Cancha de pádel en perspectiva, de noche y con luces (dibujo, sin fotos).
// Piso azul, líneas blancas, red al medio y los blindex del fondo.
export default function NightCourt() {
  const T = 66, B = 200, TL = 205, TR = 395, BL = 20, BR = 580;
  const x = (y, side) => { const t = (y - T) / (B - T); return side === "l" ? TL + (BL - TL) * t : TR + (BR - TR) * t; };
  const yAt = (f) => T + (B - T) * (f * f * 0.35 + f * 0.65);
  const cx = (y) => (x(y, "l") + x(y, "r")) / 2;
  const w = (y) => x(y, "r") - x(y, "l");
  const s1 = yAt(0.15), net = yAt(0.5), s2 = yAt(0.85);
  // Paredes: alto proporcional al ancho de la cancha en ese punto.
  const H = (y) => w(y) * 0.26;
  const glassEnd = yAt(0.2);
  const wall = (side) => {
    const xs = (y) => x(y, side);
    return `${xs(T)},${T} ${xs(T)},${T - H(T)} ${xs(glassEnd)},${glassEnd - H(glassEnd)} ${xs(glassEnd)},${glassEnd}`;
  };
  const netH = w(net) * 0.05;
  return (
    <svg className="night-pitch" viewBox="10 8 580 194" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      <defs>
        <radialGradient id="nc-light" cx="50%" cy="0%" r="90%">
          <stop offset="0" stopColor="#fff" stopOpacity=".26" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="nc-floor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1f4f8f" />
          <stop offset="1" stopColor="#2d6cc0" />
        </linearGradient>
        <linearGradient id="nc-glass" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#dfefff" stopOpacity=".22" />
          <stop offset=".5" stopColor="#dfefff" stopOpacity=".08" />
          <stop offset="1" stopColor="#dfefff" stopOpacity=".18" />
        </linearGradient>
      </defs>
      {/* Piso alrededor y cancha */}
      <polygon points={`${TL - 14},${T} ${TR + 14},${T} ${BR + 40},${B} ${BL - 40},${B}`} fill="#173c6e" />
      <polygon points={`${TL},${T} ${TR},${T} ${BR},${B} ${BL},${B}`} fill="url(#nc-floor)" />
      {/* Blindex del fondo y de los costados */}
      <polygon points={`${TL},${T} ${TL},${T - H(T)} ${TR},${T - H(T)} ${TR},${T}`} fill="url(#nc-glass)" stroke="#fff" strokeOpacity=".5" strokeWidth="1.2" />
      {[0.25, 0.5, 0.75].map((f) => { const xx = TL + (TR - TL) * f; return <line key={f} x1={xx} y1={T} x2={xx} y2={T - H(T)} stroke="#fff" strokeOpacity=".35" strokeWidth="1" />; })}
      <polygon points={wall("l")} fill="url(#nc-glass)" stroke="#fff" strokeOpacity=".5" strokeWidth="1.2" />
      <polygon points={wall("r")} fill="url(#nc-glass)" stroke="#fff" strokeOpacity=".5" strokeWidth="1.2" />
      {/* Alambrado (la parte de reja de los costados) */}
      <g stroke="#fff" strokeOpacity=".28" strokeWidth="1" strokeDasharray="3 3" fill="none">
        <path d={`M${x(glassEnd, "l")},${glassEnd - H(glassEnd)} L${x(B, "l")},${B - H(B)}`} />
        <path d={`M${x(glassEnd, "r")},${glassEnd - H(glassEnd)} L${x(B, "r")},${B - H(B)}`} />
      </g>
      {/* Líneas */}
      <g fill="none" stroke="#fff" strokeOpacity=".9" strokeWidth="1.6">
        <polygon points={`${TL},${T} ${TR},${T} ${BR},${B} ${BL},${B}`} />
        <line x1={x(s1, "l")} y1={s1} x2={x(s1, "r")} y2={s1} />
        <line x1={x(s2, "l")} y1={s2} x2={x(s2, "r")} y2={s2} />
        <line x1={cx(s1)} y1={s1} x2={cx(s2)} y2={s2} />
      </g>
      {/* Red */}
      <rect x={x(net, "l") - 4} y={net - netH} width={w(net) + 8} height={netH} fill="#0d1116" fillOpacity=".55" />
      <line x1={x(net, "l") - 4} y1={net - netH} x2={x(net, "r") + 4} y2={net - netH} stroke="#fff" strokeWidth="2" />
      <line x1={x(net, "l") - 4} y1={net} x2={x(net, "l") - 4} y2={net - netH - 2} stroke="#e9e9e9" strokeWidth="3" />
      <line x1={x(net, "r") + 4} y1={net} x2={x(net, "r") + 4} y2={net - netH - 2} stroke="#e9e9e9" strokeWidth="3" />
      {/* Pelotita */}
      <circle cx={cx(s2) + w(s2) * 0.18} cy={s2 - 18} r="5" fill="#d7f34a" />
      <ellipse cx={cx(s2) + w(s2) * 0.18} cy={s2 + 2} rx="5" ry="1.6" fill="#000" fillOpacity=".25" />
    </svg>
  );
}
