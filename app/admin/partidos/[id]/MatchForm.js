"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { displayName } from "@/lib/format";
import { isInjured } from "@/components/Injury";

const toStr = (v) => (v === undefined || v === null ? "" : String(v));

export default function MatchForm({ match, players }) {
  const router = useRouter();
  const [f, setF] = useState({ date: match.date, time: match.time || "", place: match.place || "", court: match.court || "", notes: match.notes || "",
    videos: (match.videos || []).join("\n") });
  const [rules, setRules] = useState({ golden_point: !!match.golden_point, super_tb: !!match.super_tb });
  const [played, setPlayed] = useState(match.status === "jugado");
  // Cuatro lugares: pareja 1 (A1, A2) y pareja 2 (B1, B2).
  const [slots, setSlots] = useState([match.teamA[0], match.teamA[1], match.teamB[0], match.teamB[1]].map((x) => x || ""));
  const [sets, setSets] = useState(() => [0, 1, 2].map((i) => [toStr(match.sets[i]?.[0]), toStr(match.sets[i]?.[1])]));
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [confirmDel, setConfirmDel] = useState(false);

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const conf = new Set(match.signups || []);
  const sorted = [...players].sort((x, y) => (conf.has(y.id) - conf.has(x.id)) || displayName(x).localeCompare(displayName(y)));
  const byId = Object.fromEntries(players.map((p) => [p.id, p]));
  const label = (a, b) => [a, b].filter(Boolean).map((id) => displayName(byId[id])).join(" / ") || null;
  const nameA = label(slots[0], slots[1]) || "Pareja 1";
  const nameB = label(slots[2], slots[3]) || "Pareja 2";

  function setSlot(i, v) { const n = [...slots]; n[i] = v; setSlots(n); }
  function setGame(i, j, v) { const n = sets.map((s) => [...s]); n[i][j] = v.replace(/\D/g, "").slice(0, 2); setSets(n); }

  async function save(e) {
    e.preventDefault();
    setMsg("");
    const chosen = slots.filter(Boolean);
    if (new Set(chosen).size !== chosen.length) { setMsg("Hay un jugador repetido."); return; }
    const cleanSets = sets.filter(([a, b]) => a !== "" || b !== "").map(([a, b]) => [Number(a || 0), Number(b || 0)]);
    if (played && !cleanSets.length) { setMsg("Cargá el resultado de al menos un set."); return; }
    setBusy(true);
    const supabase = createClient();
    try {
      const row = { date: f.date, time: f.time || null, place: f.place.trim() || null, court: f.court.trim() || null,
        status: played ? "jugado" : "programado", sets: played ? cleanSets : [], notes: played ? f.notes.trim() || null : null,
        video_urls: f.videos.split(/\s+/).map((u) => u.trim()).filter((u) => /^https?:\/\//.test(u)), ...rules };
      let id = match.id;
      if (id) {
        const { error } = await supabase.from("matches").update(row).eq("id", id); if (error) throw error;
      } else {
        const { data, error } = await supabase.from("matches").insert(row).select("id").single(); if (error) throw error;
        id = data.id;
      }
      // Reemplaza las parejas.
      let r = await supabase.from("match_players").delete().eq("match_id", id); if (r.error) throw r.error;
      const lineup = slots.map((p, i) => p && { match_id: id, player_id: p, team: i < 2 ? "A" : "B" }).filter(Boolean);
      if (lineup.length) { r = await supabase.from("match_players").insert(lineup); if (r.error) throw r.error; }
      router.push(`/partidos/${id}`);
      router.refresh();
    } catch (err) {
      setMsg("No se pudo guardar. " + (err?.message || ""));
      setBusy(false);
    }
  }
  async function remove() {
    const { error } = await createClient().from("matches").delete().eq("id", match.id);
    if (error) { setMsg("No se pudo borrar."); return; }
    router.push("/partidos"); router.refresh();
  }

  const pick = (i) => (
    <select value={slots[i]} onChange={(e) => setSlot(i, e.target.value)}>
      <option value="">A confirmar</option>
      {sorted.map((p) => <option key={p.id} value={p.id} disabled={slots.includes(p.id) && slots[i] !== p.id}>{conf.has(p.id) ? "✋ " : ""}{displayName(p)}{isInjured(p) ? " 💅 lesionado" : ""}</option>)}
    </select>
  );

  return (
    <form className="stack" onSubmit={save}>
      <h2>{match.id ? "Editar partido" : "Nuevo partido"}</h2>
      <div className="card stack">
        <div className="row">
          <label className="f">Fecha<input type="date" required value={f.date} onChange={set("date")} /></label>
          <label className="f">Hora<input type="time" value={f.time} onChange={set("time")} /></label>
        </div>
        <div className="row">
          <label className="f">Club<input value={f.place} onChange={set("place")} placeholder="Ej: Club X" /></label>
          <label className="f">Cancha<input value={f.court} onChange={set("court")} placeholder="Ej: 2" /></label>
        </div>
      </div>
      <div className="card stack">
        <h2 className="sm">Parejas</h2>
        {!sorted.length && <span className="muted">Primero cargá jugadores en Admin.</span>}
        {conf.size > 0 && <span className="muted" style={{ fontSize: 13 }}>Arriba de todo están los {conf.size} que se anotaron (✋).</span>}
        <div className="cols2">
          <div className="stack" style={{ gap: 6 }}><span className="muted" style={{ fontWeight: 600, fontSize: 13 }}>Pareja 1</span>{pick(0)}{pick(1)}</div>
          <div className="stack" style={{ gap: 6 }}><span className="muted" style={{ fontWeight: 600, fontSize: 13 }}>Pareja 2</span>{pick(2)}{pick(3)}</div>
        </div>
      </div>
      <div className="card stack">
        <h2 className="sm">Reglas (para la cuenta en vivo)</h2>
        <label className="f check"><input type="checkbox" checked={rules.golden_point} onChange={(e) => setRules({ ...rules, golden_point: e.target.checked })} /> ⚡ Punto de oro en 40-40 (sin ventaja)</label>
        <label className="f check"><input type="checkbox" checked={rules.super_tb} onChange={(e) => setRules({ ...rules, super_tb: e.target.checked })} /> 3er set con super tie-break a 10</label>
      </div>
      <label className="f check"><input type="checkbox" checked={played} onChange={(e) => setPlayed(e.target.checked)} /> Ya se jugó: cargar resultado</label>
      {played && (
        <div className="card stack">
          <h2 className="sm">Resultado (games de cada set)</h2>
          <div className="sets-in">
            <span></span><span className="h">{nameA}</span><span className="h">{nameB}</span>
            {sets.map((s, i) => (
              <div key={i} style={{ display: "contents" }}>
                <span className="muted" style={{ fontSize: 13, fontWeight: 600 }}>Set {i + 1}</span>
                <input inputMode="numeric" aria-label={`Set ${i + 1} ${nameA}`} value={s[0]} onChange={(e) => setGame(i, 0, e.target.value)} />
                <input inputMode="numeric" aria-label={`Set ${i + 1} ${nameB}`} value={s[1]} onChange={(e) => setGame(i, 1, e.target.value)} />
              </div>
            ))}
          </div>
          <p className="muted" style={{ margin: 0, fontSize: 13 }}>Si no hubo tercer set, dejalo vacío. Si se definió con super tie-break, poné los puntos (ej: 10 a 8).</p>
          <label className="f">Comentario<input value={f.notes} onChange={set("notes")} placeholder="Ej: se definió en el tie-break" /></label>
        </div>
      )}
      <div className="card stack">
        <label className="f">🎥 Links de YouTube del partido (uno por renglón)
          <textarea rows={3} value={f.videos} onChange={set("videos")} placeholder={"https://youtu.be/...\nhttps://www.youtube.com/watch?v=..."} />
        </label>
      </div>
      <div className="actions">
        <button className="btn primary" disabled={busy}>{busy ? "Guardando…" : "Guardar partido"}</button>
        {match.id && (confirmDel
          ? <button type="button" className="btn danger" onClick={remove}>Sí, borrar el partido</button>
          : <button type="button" className="btn danger" onClick={() => setConfirmDel(true)}>Borrar partido</button>)}
        {msg && <span className="error">{msg}</span>}
      </div>
    </form>
  );
}
