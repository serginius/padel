import { playedMatches, winner, playerRanking } from "./data";

// Copitas: trofeos inventados que se calculan solos con los partidos cargados.
// Las de varios niveles tienen bronce, plata y oro.
const DEFS = [
  { id: "debut", e: "📋", name: "Citado por Bela", how: "Jugar tu primer partido", val: (h) => h.pj, goal: [1] },
  { id: "gan1", e: "🍾", name: "Destapá la Sidra", how: "Ganar tu primer partido", val: (h) => h.pg, goal: [1] },
  { id: "ganados", e: "🎾", names: ["Le Agarró la Mano", "Bandeja de Plata", "Modo Bela ON"], how: "partidos ganados", val: (h) => h.pg, goal: [5, 15, 30] },
  { id: "pj", e: "🏠", names: ["Abonado", "Socio Vitalicio", "Le Pagan Expensas al Club"], how: "partidos", val: (h) => h.pj, goal: [10, 25, 50] },
  { id: "rosca", e: "🍩", name: "Repartió Roscas", how: "Ganar un set 6-0", val: (h) => h.rosca, goal: [1] },
  { id: "paliza", e: "🧹", name: "Pasó la Escoba", how: "Ganar un partido dejando al rival en 2 games o menos", val: (h) => h.paliza, goal: [1] },
  { id: "lazaro", e: "🧟", name: "Lázaro", how: "Perder el primer set y ganar el partido", val: (h) => h.remontada, goal: [1] },
  { id: "frio", e: "🧊", name: "Sangre de Pato", how: "Ganar un set en tie-break", val: (h) => h.tbG, goal: [1] },
  { id: "agrandado", e: "😎", name: "Agrandado", how: "Ganar 3 partidos seguidos", val: (h) => h.winStreak, goal: [3] },
  { id: "tren", e: "🚂", name: "No Lo Para Nadie", how: "Ganar 5 partidos seguidos", val: (h) => h.winStreak, goal: [5] },
  { id: "matrimonio", e: "💍", name: "Matrimonio Feliz", how: "Jugar 10 partidos con el mismo compañero", val: (h) => h.maxPartner, goal: [10] },
  { id: "picaflor", e: "🐦", name: "Picaflor", how: "Jugar con 5 compañeros distintos", val: (h) => h.partners, goal: [5] },
  { id: "rey", e: "👑", name: "Dueño del Blindex", how: "Ir primero en el ranking", val: (h) => h.lider, goal: [1], live: true },
  // Vitrina de la vergüenza
  { id: "comio", e: "🥯", name: "Se Comió una Rosca", how: "Perder un set 6-0", val: (h) => h.roscaC, goal: [1], shame: true },
  { id: "tortuga", e: "🐢", name: "Se Le Escapó la Tortuga", how: "Ganar el primer set y perder el partido", val: (h) => h.escapo, goal: [1], shame: true },
  { id: "arrugo", e: "😰", name: "Se Le Arrugó", how: "Perder un set en tie-break", val: (h) => h.tbP, goal: [1], shame: true },
  { id: "pecho", e: "🥶", name: "Pecho Frío", how: "Perder 3 partidos seguidos", val: (h) => h.lossStreak, goal: [3], shame: true },
  { id: "gato", e: "🐈‍⬛", name: "Gato Negro", how: "Perder 5 partidos seguidos", val: (h) => h.lossStreak, goal: [5], shame: true },
  { id: "faltazo", e: "👻", name: "Faltazo", how: "Anotarte en Confirmados y después no ir", val: (h) => h.faltazo, goal: [1], shame: true },
];

const TIERS = ["bronce", "plata", "oro"];

// Historial del jugador, partido por partido, en orden.
function history(id, matches, players) {
  const h = { pj: 0, pg: 0, rosca: 0, roscaC: 0, paliza: 0, remontada: 0, escapo: 0, tbG: 0, tbP: 0,
    winStreak: 0, lossStreak: 0, partners: 0, maxPartner: 0, lider: 0, faltazo: 0 };
  const with_ = {};
  let w = 0, l = 0;
  playedMatches(matches).slice().reverse().forEach((m) => {
    const inA = m.teamA.includes(id), inB = m.teamB.includes(id);
    if (!inA && !inB) { if ((m.signups || []).includes(id) && (m.teamA.length || m.teamB.length)) h.faltazo++; return; }
    h.pj++;
    const mine = (s) => (inA ? s[0] : s[1]), their = (s) => (inA ? s[1] : s[0]);
    const win = winner(m) === (inA ? "A" : "B");
    if (win) h.pg++;
    m.sets.forEach((s) => {
      if (mine(s) === 6 && their(s) === 0) h.rosca++;
      if (their(s) === 6 && mine(s) === 0) h.roscaC++;
      if (Math.max(mine(s), their(s)) === 7 && Math.min(mine(s), their(s)) === 6) { if (mine(s) > their(s)) h.tbG++; else h.tbP++; }
    });
    const first = m.sets[0];
    if (first && win && mine(first) < their(first)) h.remontada++;
    if (first && !win && winner(m) && mine(first) > their(first)) h.escapo++;
    if (win && m.sets.reduce((t, s) => t + their(s), 0) <= 2 && m.sets.length >= 2) h.paliza++;
    w = win ? w + 1 : 0; l = !win && winner(m) ? l + 1 : 0;
    h.winStreak = Math.max(h.winStreak, w); h.lossStreak = Math.max(h.lossStreak, l);
    (inA ? m.teamA : m.teamB).filter((x) => x !== id).forEach((x) => { with_[x] = (with_[x] || 0) + 1; });
  });
  h.partners = Object.keys(with_).length;
  h.maxPartner = Math.max(0, ...Object.values(with_));
  const rk = playerRanking(players, matches);
  if (rk[0] && rk[0].pg > 0 && rk[0].id === id) h.lider = 1;
  return h;
}

// Lista de copitas del jugador: cuáles ganó, en qué nivel, y qué le falta.
export function copitasFor(id, players, matches) {
  const h = history(id, matches, players);
  return DEFS.map((c) => {
    const v = c.val(h);
    const level = c.goal.filter((x) => v >= x).length; // 0 = no la tiene
    const tiered = c.goal.length > 1;
    const name = c.names ? c.names[Math.max(0, level - 1)] : c.name;
    const next = c.goal[level];
    let how = c.how;
    if (tiered) how = next ? `${level ? "Próximo nivel" : "Llegar a"}: ${next} ${c.how} (vas ${v})` : `Nivel máximo: ${c.goal.at(-1)} ${c.how}`;
    return {
      id: c.id, e: c.e, name, how, shame: !!c.shame, won: level > 0,
      tier: tiered && level ? TIERS[level - 1] : null,
      sub: c.live ? "Mientras dure" : null,
    };
  });
}
