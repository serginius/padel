"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Avatar from "@/components/Avatar";
import { createClient } from "@/lib/supabase/client";
import { displayName } from "@/lib/format";
import { replay, pointLabels, situation, setsToSave } from "@/lib/score";

// Lo que grita el relator cuando una pareja gana un game.
const FRASES = [
  "¡Qué bandeja, mamita!",
  "¡Víbora venenosa!",
  "¡La sacó por 3!",
  "¡Contra la reja y adentro!",
  "¡Bajada de pared criminal!",
  "¡Remate por 4, se fue del club!",
  "¡Globo perfecto, a correr!",
  "¡Chiquita al pie, no la levanta nadie!",
  "¡Se la dejó en la red, pobrecito!",
];
const pick = (xs) => xs[Math.floor(Math.random() * xs.length)];

function minuteNow(startedAt) {
  if (!startedAt) return null;
  return Math.max(1, Math.floor((Date.now() - new Date(startedAt).getTime()) / 60000) + 1);
}

// tok: el código del link de relator (o null si es el admin).
// practice: modo práctica, no guarda nada y nadie lo ve.
export default function LivePanel({ match: real, teamA, teamB, byId, tok = null, practice = false, back }) {
  const router = useRouter();
  const [pts, setPts] = useState(practice ? [] : real.points);
  const [startedAt, setStartedAt] = useState(practice ? null : real.started_at);
  const [finishing, setFinishing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState("");
  const [, tick] = useState(0);
  const pending = useRef(0);
  const chain = useRef(Promise.resolve()); // los puntos se mandan de a uno, en orden

  // Reloj y datos al día (por si anota otro desde otro celu).
  useEffect(() => {
    const t = setInterval(() => tick((x) => x + 1), 15000);
    const r = setInterval(() => { if (!document.hidden && !practice && !pending.current) router.refresh(); }, 15000);
    return () => { clearInterval(t); clearInterval(r); };
  }, [router, practice]);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(""), 2600); return () => clearTimeout(t); }, [toast]);
  const serverKey = (real.points || []).join("");
  useEffect(() => {
    if (practice || pending.current) return;
    setPts(real.points || []);
    setStartedAt(real.started_at);
  }, [serverKey, real.started_at, practice]); // eslint-disable-line react-hooks/exhaustive-deps

  const supabase = createClient();
  const m = real;
  const rules = { golden: !!m.golden_point, superTb: !!m.super_tb };
  const s = replay(pts, rules);
  const labels = pointLabels(s, rules.golden);
  const sit = situation(s, rules.golden);
  const minute = minuteNow(startedAt);
  const backHref = back || `/partidos/${m.id}`;
  const names = (list) => list.map(displayName).join(" / ") || "A confirmar";
  const pairOf = (t) => (t === "A" ? teamA : teamB);

  // Guarda en la base (o nada, si es práctica). Si falla, vuelve atrás.
  async function save(fn, undoLocal) {
    if (practice) return true;
    pending.current++;
    setBusy(true);
    const job = chain.current.then(fn);
    chain.current = job.catch(() => {});
    const { error } = await job.catch((e) => ({ error: e }));
    pending.current--;
    setBusy(!!pending.current);
    if (error) { undoLocal(); setToast("No se pudo guardar: " + error.message); return false; }
    if (!pending.current) router.refresh();
    return true;
  }

  async function start() {
    const now = new Date().toISOString();
    setStartedAt(now);
    setToast("🎙️ ¡Arrancó la transmisión!");
    await save(() => supabase.rpc("relator_start", { mid: m.id, tok }), () => setStartedAt(null));
  }

  async function point(t) {
    if (s.done) return;
    const next = [...pts, t];
    const after = replay(next, rules);
    setPts(next);
    const who = names(pairOf(t));
    if (after.done) setToast(`🏆 ¡PARTIDO! Ganaron ${who}`);
    else if (after.sets.length > s.sets.length) setToast(`🔥 ¡SET para ${who}!`);
    else if (after.log.length > s.log.length) setToast(`🎾 ${pick(FRASES)} Game ${who}`);
    await save(() => supabase.rpc("relator_point", { mid: m.id, tok, t }), () => setPts(pts));
  }

  async function undo() {
    if (!pts.length) return;
    const prev = pts;
    setPts(pts.slice(0, -1));
    setToast("↩️ Punto borrado");
    await save(() => supabase.rpc("relator_undo", { mid: m.id, tok }), () => setPts(prev));
  }

  async function finish() {
    if (practice) {
      setPts([]); setStartedAt(null); setFinishing(false);
      setToast("🧪 Fin de la práctica. No se guardó nada."); return;
    }
    setBusy(true);
    const { error } = await supabase.rpc("relator_finish", { mid: m.id, tok, s: setsToSave(s) });
    setBusy(false);
    if (error) { setToast("No se pudo guardar: " + error.message); return; }
    router.push(`/partidos/${m.id}`);
    router.refresh();
  }

  if (!teamA.length && !teamB.length) {
    return (
      <div className="live-panel">
        <Link href={backHref} className="muted">← Volver</Link>
        <div className="card">Todavía no están armadas las parejas. El admin tiene que elegirlas (Admin → partido → Parejas).</div>
      </div>
    );
  }

  const boardRow = (t, i) => (
    <div className="lb-row">
      <span className="lb-name">{names(pairOf(t))}</span>
      {s.sets.map((x, k) => <span key={k} className={`lb-g ${x[i] > x[1 - i] ? "w" : ""}`}>{x[i]}</span>)}
      {!s.done && !s.superTb && <span className="lb-g cur">{s.games[i]}</span>}
      {!s.done && <span className="lb-p">{labels[i]}</span>}
      {s.done && s.winner === t && <span className="lb-p">🏆</span>}
    </div>
  );

  const final = setsToSave(s);
  return (
    <div className="live-panel">
      <Link href={backHref} className="muted">← Volver</Link>
      {practice && <div className="practice-note">🧪 <b>Modo práctica.</b> Tocá lo que quieras: no se guarda nada y nadie lo ve.</div>}
      <div className="live-board padel">
        {boardRow("A", 0)}
        {boardRow("B", 1)}
        <div className="clock">
          {minute ? `🔴 EN VIVO · ${minute}'` : "📻 Modo relator: ON"}
          {!s.done && minute ? ` · ${s.superTb ? "Super tie-break" : `Set ${s.sets.length + 1}`}` : ""}
          {sit && !s.superTb ? ` · ${sit}` : ""}
        </div>
      </div>
      {!startedAt ? (
        <button type="button" className="btn accent" style={{ justifyContent: "center", fontSize: 20, padding: 16 }} disabled={busy} onClick={start}>🎤 Agarrá el micrófono, que esto es pádel</button>
      ) : finishing ? (
        <div className="card stack">
          <h2>🏁 ¿Terminó así?</h2>
          <p style={{ margin: 0 }}>
            {final.length ? <>Se guarda <b>{final.map(([a, b]) => `${a}-${b}`).join("  ")}</b> para {names(teamA)}.</> : "Todavía no hay ningún game. Se guarda sin resultado."}
          </p>
          <div className="actions">
            <button type="button" className="btn primary" disabled={busy} onClick={finish}>{practice ? "Terminar la práctica" : "Sí, guardar resultado"}</button>
            <button type="button" className="btn" onClick={() => setFinishing(false)}>Volver, sigue el partido</button>
          </div>
        </div>
      ) : (
        <>
          {s.done ? (
            <div className="card stack" style={{ textAlign: "center" }}>
              <h2>🏆 ¡Ganaron {names(pairOf(s.winner))}!</h2>
              <button type="button" className="btn primary" style={{ justifyContent: "center" }} disabled={busy} onClick={() => setFinishing(true)}>Guardar el resultado</button>
            </div>
          ) : (
            <>
              <h2 className="sm" style={{ textAlign: "center" }}>¿Quién ganó el punto?</h2>
              <div className="point-btns">
                {[["A", teamA], ["B", teamB]].map(([t, list]) => (
                  <button key={t} type="button" className={`point-btn ${t === "B" ? "b" : ""}`} onClick={() => point(t)}>
                    <span className="pair-avs lg">{list.map((p) => <Avatar key={p.id} player={p} />)}</span>
                    <span className="pb-names">{names(list)}</span>
                    <b>+ Punto</b>
                  </button>
                ))}
              </div>
            </>
          )}
          <div className="actions" style={{ justifyContent: "center" }}>
            <button type="button" className="btn" disabled={!pts.length} onClick={undo}>↩️ Me equivoqué, borrar el último punto</button>
          </div>
          {s.log.length > 0 && (
            <div className="card">
              <h2 className="sm">Lo que pasó</h2>
              <ul className="log">
                {s.log.slice(-8).reverse().map((x, k) => (
                  <li key={k}>
                    <span className="min">{x.stb ? "STB" : `S${x.set}`}</span>
                    <span className="t">{x.tb ? "🧊 Tie-break" : "🎾 Game"} para {names(pairOf(x.team))}</span>
                    <b>{x.g[0]}-{x.g[1]}</b>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {!s.done && <button type="button" className="btn danger" style={{ justifyContent: "center" }} onClick={() => setFinishing(true)}>🏁 Terminar partido</button>}
        </>
      )}
      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}
