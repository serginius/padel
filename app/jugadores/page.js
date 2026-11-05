import Link from "next/link";
import { createClient, getViewer } from "@/lib/supabase/server";
import { getLeague, computeStats } from "@/lib/data";
import { initials } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Jugadores · Pádel" };

export default async function Jugadores() {
  const supabase = await createClient();
  const [{ players, matches }, { isAdmin }] = await Promise.all([getLeague(supabase), getViewer(supabase)]);
  const st = computeStats(players, matches);
  const ps = [...players].sort((a, b) => (a.nick || a.name).localeCompare(b.nick || b.name));
  return (
    <>
      <div className="sec-head"><h2>Jugadores · {ps.length}</h2>{isAdmin && <Link className="btn small accent" href="/admin">+ Jugador</Link>}</div>
      {!ps.length && <div className="card muted">Todavía no hay jugadores cargados.</div>}
      <div className="cards">
        {ps.map((p) => (
          <Link key={p.id} href={`/jugadores/${p.id}`} className="pcard">
            <div className="ph">
              {p.photo_url ? <img src={p.photo_url} alt="" /> : <span className="ini">{initials(p.name)}</span>}
              {p.category && <span className="num">{p.category}</span>}
            </div>
            <div className="body">
              <span className="nm">{p.nick || p.name}</span>
              <span className="st">{p.side ? `${p.side} · ` : ""}{st[p.id]?.pg || 0} ganados · {st[p.id]?.pj || 0} PJ</span>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
