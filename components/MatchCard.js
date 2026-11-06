import Link from "next/link";
import Avatar from "./Avatar";
import Countdown from "./Countdown";
import NightCourt from "./NightCourt";
import { fmtDate, daysUntil, displayName } from "@/lib/format";
import { pairName, winner } from "@/lib/data";
import { liveOf, pointLabels, situation } from "@/lib/score";

const confText = (m) => {
  const n = Math.max(m.signups?.length || 0, m.teamA.length + m.teamB.length);
  return n >= 4 ? `✋ ${n} confirmados · ¡Están los 4!` : `✋ ${n} de 4 confirmados · Faltan ${4 - n}`;
};

// Pareja del cartel grande: fotos encimadas y nombres uno abajo del otro.
function HeroPair({ ids, byId, right }) {
  return (
    <div className={`hp ${right ? "r" : ""}`}>
      <span className="pair-avs lg">{ids.length ? ids.map((id) => <Avatar key={id} player={byId[id]} />) : <span className="av">?</span>}</span>
      <span className="hp-names">{ids.length ? ids.map((id) => <span key={id}>{displayName(byId[id])}</span>) : <span>A confirmar</span>}</span>
    </div>
  );
}

function HeroInner({ m, byId }) {
  const live = m.live;
  const s = live ? liveOf(m) : null;
  const where = [m.place, m.court ? `cancha ${m.court}` : ""].filter(Boolean).join(" · ");
  return (
    <>
      <div className="hero-lights" aria-hidden="true"><i /><i /><i /><i /></div>
      <div className="hero-top">
        {live ? <span className="pill live">En vivo</span> : <span className="pill next">Próximo partido</span>}
        <span className="hero-when">{fmtDate(m.date)}{m.time ? ` · ${m.time}` : ""}{where ? ` · ${where}` : ""}</span>
      </div>
      <div className="hero-teams">
        <HeroPair ids={m.teamA} byId={byId} />
        {live ? <span className="hs">{s.setsWon[0]}<i>–</i>{s.setsWon[1]}</span> : <span className="hv">VS</span>}
        <HeroPair ids={m.teamB} byId={byId} right />
      </div>
      {live && <div className="hero-live"><LiveRows m={m} byId={byId} s={s} /></div>}
      {!live && (
        <div className="hero-field">
          <NightCourt />
          <Countdown date={m.date} time={m.time} />
        </div>
      )}
      <div className="hero-foot">{live ? "🎙️ Se está jugando: la página se actualiza sola" : confText(m)}</div>
    </>
  );
}

// Marcador en vivo: games de cada set, el set que se juega y los puntos del game.
export function LiveRows({ m, byId, s = liveOf(m) }) {
  const labels = pointLabels(s, m.golden_point);
  const sit = situation(s, m.golden_point);
  const row = (team, ids, i) => (
    <div className="pair-row">
      <span className="pair-avs">{ids.map((id) => <Avatar key={id} player={byId[id]} />)}</span>
      <span className="pair-name">{pairName(ids, byId)}</span>
      {s.sets.map((x, k) => <span key={k} className={`g ${x[i] > x[1 - i] ? "w" : ""}`}>{x[i]}</span>)}
      {!s.done && <span className="g cur">{s.superTb ? "" : s.games[i]}</span>}
      {!s.done && <span className="pts">{labels[i]}</span>}
    </div>
  );
  return (
    <div className="board live">
      {row("A", m.teamA, 0)}
      {row("B", m.teamB, 1)}
      {sit && <div className="sit">{sit}</div>}
    </div>
  );
}

// Tarjeta de partido estilo marcador de tenis/pádel: una fila por pareja con los games de cada set.
export default function MatchCard({ m, byId, hero = false, link = true }) {
  const played = m.status === "jugado";
  const live = !!m.live;
  const cls = `card match ${hero && !played ? "hero-next" : ""}`;
  if (hero && !played) {
    const h = <HeroInner m={m} byId={byId} />;
    return link ? <Link href={`/partidos/${m.id}`} className={cls}>{h}</Link> : <div className={cls}>{h}</div>;
  }
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
      <div className="match-meta">
        {live ? <span className="pill live">En vivo</span> : <span className={`pill ${played ? "done" : "next"}`}>{played ? "Final" : "Próximo"}</span>}
        <span>{fmtDate(m.date)}{m.time ? ` · ${m.time}` : ""}</span>
        {where && <span>· {where}</span>}
        {!played && !live && <span style={{ fontWeight: 600 }}>· {countdown}</span>}
        {m.videos?.length > 0 && <span>· 🎥 Video</span>}
      </div>
      {live ? <LiveRows m={m} byId={byId} /> : (
        <div className="board">
          {row("A", m.teamA)}
          {!played && <div className="vs-line">vs</div>}
          {row("B", m.teamB)}
        </div>
      )}
      {!played && !live && !link && d >= 0 && <Countdown date={m.date} time={m.time} />}
      {!played && !live && <div className="muted" style={{ fontSize: 13 }}>{confText(m)}</div>}
    </>
  );
  return link ? <Link href={`/partidos/${m.id}`} className={cls}>{inner}</Link> : <div className={cls}>{inner}</div>;
}
