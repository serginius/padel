import Link from "next/link";
import MatchCard from "@/components/MatchCard";
import RankingTable from "@/components/RankingTable";
import Confirmados from "@/components/Confirmados";
import { copitasFor } from "@/lib/copitas";
import { createClient, getViewer } from "@/lib/supabase/server";
import { getLeague, playedMatches, upcomingMatches, computeStats, winner, setsText, pairName, pct } from "@/lib/data";
import { fmtDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = await createClient();
  const [{ players, byId, matches }, viewer] = await Promise.all([getLeague(supabase), getViewer(supabase)]);
  const next = upcomingMatches(matches)[0];
  const played = playedMatches(matches);
  const last = played[0];

  let mine = null;
  if (viewer.player) {
    const id = viewer.player.id;
    const s = computeStats(players, matches)[id];
    const lastMine = played.find((m) => m.teamA.includes(id) || m.teamB.includes(id));
    let txt = "Todavía no jugaste ningún partido cargado.";
    if (lastMine) {
      const inA = lastMine.teamA.includes(id);
      const partner = (inA ? lastMine.teamA : lastMine.teamB).filter((x) => x !== id);
      const w = winner(lastMine);
      const res = !w ? "empataste" : (w === "A") === inA ? "ganaste" : "perdiste";
      const sets = inA ? setsText(lastMine) : lastMine.sets.map(([a, b]) => `${b}-${a}`).join("  ");
      txt = `${fmtDate(lastMine.date)}: ${res}${sets ? ` ${sets}` : ""}${partner.length ? ` jugando con ${pairName(partner, byId)}` : ""}.`;
    }
    mine = { s, txt, copas: copitasFor(id, players, matches).filter((c) => c.won) };
  }

  return (
    <>
      {viewer.user && !viewer.player && !viewer.isAdmin && (
        <div className="banner">Tu mail no está vinculado a ningún jugador. Pedile al organizador que te agregue.</div>
      )}
      {mine && (
        <section className="sec">
          <div className="sec-head"><h2>Tu espacio</h2><Link className="btn small" href="/perfil">Editar perfil</Link></div>
          <div className="card stack">
            <p style={{ margin: 0 }}>{mine.txt}</p>
            <div className="stats">
              <div className="stat"><b>{mine.s.pg}</b><span>Ganados</span></div>
              <div className="stat"><b>{mine.s.pj}</b><span>Jugados</span></div>
              <div className="stat"><b>{pct(mine.s)}%</b><span>Efectividad</span></div>
              <div className="stat"><b>{mine.s.sf}-{mine.s.sc}</b><span>Sets</span></div>
            </div>
            <Link href="/perfil" className="who" style={{ flexWrap: "wrap" }} aria-label="Ver mis copitas">
              {mine.copas.length ? (
                <><span className="mini-copitas">{mine.copas.map((c) => <span key={c.id} title={c.name}>{c.e}</span>)}</span><span className="muted" style={{ fontSize: 13 }}>Ver mis copitas →</span></>
              ) : <span className="muted" style={{ fontSize: 13 }}>🏆 Todavía no ganaste copitas. Mirá cuáles hay →</span>}
            </Link>
          </div>
        </section>
      )}
      <section className="sec">
        <div className="sec-head"><h2>{next?.live ? "🔴 Jugándose ahora" : "🎾 Próximo partido"}</h2>{viewer.isAdmin && <Link className="btn small accent" href="/admin/partidos/nuevo">+ Partido</Link>}</div>
        {next ? <MatchCard m={next} byId={byId} hero /> : <div className="card muted">No hay partido programado.</div>}
        {next && !next.live && (
          <Confirmados matchId={next.id} players={next.signups.map((i) => byId[i]).filter(Boolean)} meId={viewer.player?.id || null} loggedIn={!!viewer.user} />
        )}
      </section>
      <section className="sec">
        <h2>Último resultado</h2>
        {last ? <MatchCard m={last} byId={byId} /> : <div className="card muted">Todavía no se jugó ningún partido.</div>}
      </section>
      <section className="sec">
        <div className="sec-head"><h2>Ranking</h2><Link className="btn small" href="/ranking">Ver completo</Link></div>
        <RankingTable players={players} matches={matches} byId={byId} limit={5} />
      </section>
    </>
  );
}
