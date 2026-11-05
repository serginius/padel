import { todayStr, parseDate, displayName } from "./format";

// Trae toda la liga (es chica: decenas de jugadores y partidos).
export async function getLeague(supabase) {
  const [{ data: players }, { data: matches }] = await Promise.all([
    supabase.from("players").select("id,name,nick,side,category,hand,photo_url").order("name"),
    supabase.from("matches").select("*, match_players(player_id,team)"),
  ]);
  const byId = Object.fromEntries((players || []).map((p) => [p.id, p]));
  const ms = (matches || []).map((m) => ({
    ...m,
    sets: Array.isArray(m.sets) ? m.sets : [],
    teamA: (m.match_players || []).filter((x) => x.team === "A").map((x) => x.player_id),
    teamB: (m.match_players || []).filter((x) => x.team === "B").map((x) => x.player_id),
  }));
  return { players: players || [], byId, matches: ms };
}

// Sets ganados por cada pareja.
export function setsWon(m) {
  let a = 0, b = 0;
  m.sets.forEach(([x, y]) => { if (x > y) a++; else if (y > x) b++; });
  return [a, b];
}
export function gamesWon(m) {
  return m.sets.reduce(([a, b], [x, y]) => [a + x, b + y], [0, 0]);
}
// "A", "B" o null si no hay ganador claro.
export function winner(m) {
  if (m.status !== "jugado") return null;
  const [a, b] = setsWon(m);
  if (a !== b) return a > b ? "A" : "B";
  const [ga, gb] = gamesWon(m);
  return ga > gb ? "A" : gb > ga ? "B" : null;
}
export function setsText(m) {
  return m.sets.map(([x, y]) => `${x}-${y}`).join("  ");
}
export function pairName(ids, byId) {
  if (!ids.length) return "A confirmar";
  return ids.map((id) => displayName(byId[id])).join(" / ");
}

export function playedMatches(matches) {
  return matches.filter((m) => m.status === "jugado").sort((a, b) => parseDate(b.date, b.time) - parseDate(a.date, a.time));
}
export function upcomingMatches(matches) {
  const t = todayStr();
  return matches.filter((m) => m.status !== "jugado" && m.date >= t).sort((a, b) => parseDate(a.date, a.time) - parseDate(b.date, b.time));
}
export function pendingResults(matches) {
  const t = todayStr();
  return matches.filter((m) => m.status !== "jugado" && m.date < t);
}

const blank = (id) => ({ id, pj: 0, pg: 0, pp: 0, sf: 0, sc: 0, gf: 0, gc: 0, form: [], partners: {} });
function add(s, mine, their, won, sets, games) {
  s.pj++;
  if (won === true) s.pg++; else if (won === false) s.pp++;
  s.sf += sets[mine]; s.sc += sets[their];
  s.gf += games[mine]; s.gc += games[their];
  s.form.push(won === true ? "G" : won === false ? "P" : "E");
}

// Estadísticas por jugador: PJ, ganados, perdidos, sets y games a favor/en contra, racha y compañeros.
export function computeStats(players, matches) {
  const st = {};
  const get = (id) => (st[id] ||= blank(id));
  players.forEach((p) => get(p.id));
  playedMatches(matches).slice().reverse().forEach((m) => {
    const w = winner(m), sets = setsWon(m), games = gamesWon(m);
    [["A", 0, 1, m.teamA], ["B", 1, 0, m.teamB]].forEach(([team, mine, their, ids]) => {
      const won = w ? w === team : null;
      ids.forEach((id) => {
        const s = get(id);
        add(s, mine, their, won, sets, games);
        ids.filter((o) => o !== id).forEach((o) => {
          const pt = (s.partners[o] ||= { pj: 0, pg: 0 });
          pt.pj++; if (won === true) pt.pg++;
        });
      });
    });
  });
  return st;
}

// Estadísticas por pareja (los dos mismos jugadores juntos).
export function computePairs(matches) {
  const st = {};
  playedMatches(matches).slice().reverse().forEach((m) => {
    const w = winner(m), sets = setsWon(m), games = gamesWon(m);
    [["A", 0, 1, m.teamA], ["B", 1, 0, m.teamB]].forEach(([team, mine, their, ids]) => {
      if (ids.length !== 2) return;
      const key = [...ids].sort().join("+");
      const s = (st[key] ||= { ...blank(key), ids: [...ids].sort() });
      add(s, mine, their, w ? w === team : null, sets, games);
    });
  });
  return Object.values(st);
}

export const pct = (s) => (s.pj ? Math.round((100 * s.pg) / s.pj) : 0);
// Orden del ranking: más partidos ganados, después % de victorias, diferencia de sets y de games.
export const rankSort = (x, y) => y.pg - x.pg || pct(y) - pct(x) || (y.sf - y.sc) - (x.sf - x.sc) || (y.gf - y.gc) - (x.gf - x.gc) || x.pj - y.pj;

export function playerRanking(players, matches) {
  const st = computeStats(players, matches);
  return players.map((p) => st[p.id]).filter((s) => s.pj > 0).sort((x, y) => rankSort(x, y) || displayName(players.find((p) => p.id === x.id)).localeCompare(displayName(players.find((p) => p.id === y.id))));
}
export function pairRanking(matches) {
  return computePairs(matches).sort(rankSort);
}
