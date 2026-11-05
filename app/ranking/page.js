import Link from "next/link";
import RankingTable from "@/components/RankingTable";
import { createClient } from "@/lib/supabase/server";
import { getLeague } from "@/lib/data";

export const dynamic = "force-dynamic";
export const metadata = { title: "Ranking · Slice Pádel" };

export default async function Ranking({ searchParams }) {
  const { ver } = await searchParams;
  const pairs = ver === "parejas";
  const supabase = await createClient();
  const { players, byId, matches } = await getLeague(supabase);
  return (
    <>
      <div className="sec-head">
        <h2>Ranking</h2>
        <nav className="seg-links" aria-label="Tipo de ranking">
          <Link href="/ranking" aria-current={!pairs ? "page" : undefined}>Jugadores</Link>
          <Link href="/ranking?ver=parejas" aria-current={pairs ? "page" : undefined}>Parejas</Link>
        </nav>
      </div>
      <RankingTable players={players} matches={matches} byId={byId} pairs={pairs} />
      <p className="muted" style={{ margin: 0, fontSize: 13 }}>
        PG: partidos ganados · PJ: jugados · %: efectividad. Se ordena por ganados; si empatan, por efectividad y después por diferencia de sets y de games.
        {pairs && " Una pareja aparece cuando los dos jugaron juntos al menos una vez."}
      </p>
    </>
  );
}
