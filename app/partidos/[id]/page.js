import Link from "next/link";
import { notFound } from "next/navigation";
import MatchCard from "@/components/MatchCard";
import Avatar from "@/components/Avatar";
import Videos from "@/components/Videos";
import Confirmados from "@/components/Confirmados";
import AutoRefresh from "@/components/AutoRefresh";
import InjuryBadge from "@/components/Injury";
import LiveLink from "@/components/LiveLink";
import { createClient, getViewer } from "@/lib/supabase/server";
import { getLeague } from "@/lib/data";
import { displayName } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function Partido({ params }) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ byId, matches }, viewer] = await Promise.all([getLeague(supabase), getViewer(supabase)]);
  const { isAdmin } = viewer;
  const m = matches.find((x) => x.id === id);
  if (!m) notFound();
  const list = (ids) => ids.length ? ids.map((pid) => (
    <li key={pid}><Link className="who" href={`/jugadores/${pid}`}><Avatar player={byId[pid]} /><span>{displayName(byId[pid])}</span><InjuryBadge player={byId[pid]} short /></Link></li>
  )) : <li className="muted">A confirmar</li>;
  return (
    <>
      {m.live && <AutoRefresh seconds={10} />}
      <Link href="/partidos" className="muted">← Partidos</Link>
      <MatchCard m={m} byId={byId} link={false} />
      {m.status !== "jugado" && !m.live && (
        <Confirmados matchId={m.id} players={m.signups.map((i) => byId[i]).filter(Boolean)} meId={viewer.player?.id || null} loggedIn={!!viewer.user} />
      )}
      <Videos urls={m.videos} />
      <div className="card lineup">
        <div className="stack"><h2 className="sm">Pareja 1</h2><ul>{list(m.teamA)}</ul></div>
        <div className="stack"><h2 className="sm">Pareja 2</h2><ul>{list(m.teamB)}</ul></div>
      </div>
      {m.notes && <p className="muted" style={{ margin: 0 }}>{m.notes}</p>}
      {isAdmin && <div className="actions">{m.status !== "jugado" && <LiveLink href={`/partidos/${m.id}/vivo`}>🎙️ {m.live ? "Seguir relatando" : "Relatar en vivo"}</LiveLink>}<Link className="btn primary" href={`/admin/partidos/${m.id}`}>{m.status === "jugado" ? "Editar resultado / videos" : "Cargar resultado / editar"}</Link></div>}
    </>
  );
}
