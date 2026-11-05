import Link from "next/link";
import Avatar from "./Avatar";
import { fmtDate, daysUntil } from "@/lib/format";
import { pairName, winner } from "@/lib/data";

// Tarjeta de partido estilo marcador de tenis/pádel: una fila por pareja con los games de cada set.
export default function MatchCard({ m, byId, hero = false, link = true }) {
  const played = m.status === "jugado";
  const w = winner(m);
  const d = daysUntil(m.date);
  const countdown = d <= 0 ? "Hoy" : d === 1 ? "Mañana" : `Faltan ${d} días`;
  const where = [m.place, m.court ? `cancha ${m.court}` : ""].filter(Boolean).join(", ");
  const row = (team, ids) => (
    <div className={`pair-row ${w === team ? "won" : ""}`}>
      <span className="pair-avs">{ids.map((id) => <Avatar key={id} player={byId[id]} />)}</span>
      <span className="pair-name">{pairName(ids, byId)}</span>
      {played && m.sets.map((s, i) => {
        const mine = team === "A" ? s[0] : s[1], their = team === "A" ? s[1] : s[0];
        return <span key={i} className={`g ${mine > their ? "w" : ""}`}>{mine}</span>;
      })}
      {played && w === team && <span className="check" aria-label="Ganó">✓</span>}
    </div>
  );
  const inner = (
    <>
      {hero && !played && <div className="when">{fmtDate(m.date)}{m.time ? ` · ${m.time}` : ""}</div>}
      <div className="match-meta">
        {!(hero && !played) && <span className={`pill ${played ? "done" : "next"}`}>{played ? "Final" : "Próximo"}</span>}
        {!(hero && !played) && <span>{fmtDate(m.date)}{m.time ? ` · ${m.time}` : ""}</span>}
        {where && <span>{!(hero && !played) && "· "}{where}</span>}
        {hero && !played && <span style={{ fontWeight: 600 }}>· {countdown}</span>}
      </div>
      <div className="board">
        {row("A", m.teamA)}
        {!played && <div className="vs-line">vs</div>}
        {row("B", m.teamB)}
      </div>
    </>
  );
  const cls = `card match ${hero ? "hero-next" : ""}`;
  return link ? <Link href={`/partidos/${m.id}`} className={cls}>{inner}</Link> : <div className={cls}>{inner}</div>;
}
