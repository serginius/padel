// Parejas para practicar: las del partido, y si falta alguien,
// se completa con los confirmados y después con cualquier jugador.
export function practiceTeams(m, players) {
  const used = new Set([...m.teamA, ...m.teamB]);
  const extra = [...m.signups, ...players.map((p) => p.id)].filter((id) => !used.has(id) && used.add(id));
  const fill = (ids) => { const out = [...ids]; while (out.length < 2 && extra.length) out.push(extra.shift()); return out; };
  const A = fill(m.teamA);
  return [A, fill(m.teamB)];
}
