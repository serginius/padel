import Link from "next/link";
import { notFound } from "next/navigation";
import MatchCard from "@/components/MatchCard";
import Avatar from "@/components/Avatar";
import { createClient, getViewer } from "@/lib/supabase/server";
import { getLeague } from "@/lib/data";
import { displayName } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function Partido({ params }) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ byId, matches }, { isAdmin }] = await Promise.all([getLeague(supabase), getViewer(supabase)]);
  const m = matches.find((x) => x.id === id);
  if (!m) notFound();
  const list = (ids) => ids.length ? ids.map((pid) => (
    <li key={pid}><Link className="who" href={`/jugadores/${pid}`}><Avatar player={byId[pid]} /><span>{displayName(byId[pid])}</span></Link></li>
  )) : <li className="muted">A confirmar</li>;
  return (
    <>
      <Link href="/partidos" className="muted">← Partidos</Link>
      <MatchCard m={m} byId={byId} link={false} />
      <div className="card lineup">
        <div className="stack"><h2 className="sm">Pareja 1</h2><ul>{list(m.teamA)}</ul></div>
        <div className="stack"><h2 className="sm">Pareja 2</h2><ul>{list(m.teamB)}</ul></div>
      </div>
      {m.notes && <p className="muted" style={{ margin: 0 }}>{m.notes}</p>}
      {isAdmin && <div className="actions"><Link className="btn primary" href={`/admin/partidos/${m.id}`}>{m.status === "jugado" ? "Editar resultado" : "Cargar resultado / editar"}</Link></div>}
    </>
  );
}
