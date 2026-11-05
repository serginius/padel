import Link from "next/link";
import Avatar from "./Avatar";
import { displayName } from "@/lib/format";
import { playerRanking, pairRanking, pct } from "@/lib/data";

// Ranking de jugadores (pairs=false) o de parejas (pairs=true).
export default function RankingTable({ players, matches, byId, pairs = false, limit = 0 }) {
  let rows = pairs ? pairRanking(matches) : playerRanking(players, matches);
  if (limit) rows = rows.slice(0, limit);
  if (!rows.length) return <div className="card muted">Todavía no hay partidos jugados.</div>;
  const key = (s) => `${s.pg}|${pct(s)}|${s.sf - s.sc}|${s.gf - s.gc}`;
  let pos = 0, prev = null;
  return (
    <div className="card tbl-wrap">
      <table>
        <thead>
          <tr>
            <th></th><th>{pairs ? "Pareja" : "Jugador"}</th><th className="n">PG</th><th className="n">PJ</th><th className="n">%</th>
            {!limit && <><th className="n">Sets</th><th className="n">Games</th></>}
          </tr>
        </thead>
        <tbody>
          {rows.map((s, i) => {
            if (key(s) !== prev) { pos = i + 1; prev = key(s); }
            return (
              <tr key={s.id} className={pos === 1 ? "lead" : ""}>
                <td className="pos">{pos}</td>
                <td>
                  {pairs ? (
                    <span className="who"><span className="pair-avs">{s.ids.map((id) => <Avatar key={id} player={byId[id]} />)}</span>
                      <span>{s.ids.map((id, j) => <span key={id}>{j > 0 && " / "}<Link href={`/jugadores/${id}`}>{displayName(byId[id])}</Link></span>)}</span></span>
                  ) : (
                    <Link className="who" href={`/jugadores/${s.id}`}><Avatar player={byId[s.id]} /><span>{displayName(byId[s.id])}</span></Link>
                  )}
                </td>
                <td className="n goals">{s.pg}</td>
                <td className="n">{s.pj}</td>
                <td className="n">{pct(s)}%</td>
                {!limit && <><td className="n">{s.sf}-{s.sc}</td><td className="n">{s.gf}-{s.gc}</td></>}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
