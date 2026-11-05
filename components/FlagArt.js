// Arte de la cabecera: una paleta de pádel con su pelotita.
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
    </div>
  );
}
