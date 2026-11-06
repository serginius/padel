import LivePanel from "@/app/partidos/[id]/vivo/LivePanel";
import { createClient } from "@/lib/supabase/server";
import { getLeague, pairName } from "@/lib/data";

export const dynamic = "force-dynamic";
export const metadata = { title: "Relator · Slice Pádel", robots: { index: false } };

// Link de relator: el que lo tiene carga el partido sin loguearse.
export default async function Relator({ params }) {
  const { tok } = await params;
  const supabase = await createClient();
  const [{ data: id }, { byId, matches }] = await Promise.all([
    supabase.rpc("relator_match", { tok }),
    getLeague(supabase),
  ]);
  const m = id && matches.find((x) => x.id === id);
  if (!m) {
    return (
      <div className="card stack" style={{ textAlign: "center" }}>
        <h2>📵 Este link ya no funciona</h2>
        <p className="muted" style={{ margin: 0 }}>El partido ya terminó o el admin cortó el link. Pedile uno nuevo.</p>
      </div>
    );
  }
  const pl = (ids) => ids.map((pid) => byId[pid]).filter(Boolean);
  return (
    <>
      <div className="relator-hi">🎙️ Sos el relator de <b>{pairName(m.teamA, byId)} vs {pairName(m.teamB, byId)}</b>. Después de cada punto, tocá la pareja que lo ganó. La cuenta la hace la app.</div>
      <LivePanel match={m} teamA={pl(m.teamA)} teamB={pl(m.teamB)} byId={byId} tok={tok} back="/" />
    </>
  );
}
