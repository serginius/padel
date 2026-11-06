import { pct } from "@/lib/data";

// Números del jugador: ganados-perdidos, efectividad, sets, games, partidos y racha.
export default function PlayerStats({ s }) {
  let streak = 0;
  for (let i = s.form.length - 1; i >= 0 && s.form[i] === s.form[s.form.length - 1]; i--) streak++;
  const last = s.form[s.form.length - 1];
  return (
    <div className="stats six">
      <div className="stat"><b>{s.pg}-{s.pp}</b><span>Ganados-Perdidos</span></div>
      <div className="stat"><b>{pct(s)}%</b><span>Efectividad</span></div>
      <div className="stat"><b>{s.pj}</b><span>Partidos</span></div>
      <div className="stat"><b>{s.sf}-{s.sc}</b><span>Sets</span></div>
      <div className="stat"><b>{s.gf}-{s.gc}</b><span>Games</span></div>
      <div className="stat"><b>{streak ? `${streak}${last === "G" ? "🔥" : "🥶"}` : "—"}</b><span>{last === "G" ? "Ganados al hilo" : last === "P" ? "Perdidos al hilo" : "Racha"}</span></div>
    </div>
  );
}
