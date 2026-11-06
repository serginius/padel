// Cuenta del pádel punto por punto: puntos → games → sets.
// Reglas: game a 4 puntos con 2 de diferencia (o punto de oro en 40-40),
// set a 6 games con 2 de diferencia, tie-break a 7 en 6-6,
// y si es "super tie-break", el 3er set se juega a 10 puntos.

const LABEL = ["0", "15", "30", "40"];

export function replay(points, { golden = false, superTb = false } = {}) {
  const sets = []; // sets terminados: [[a,b], ...]
  let g = [0, 0], p = [0, 0];
  let done = false;
  const games = []; // historial de games: { set, team, g:[a,b], tb }
  const setsWon = () => sets.reduce(([a, b], [x, y]) => (x > y ? [a + 1, b] : [a, b + 1]), [0, 0]);
  const isStb = () => superTb && sets.length === 2;
  const isTb = () => isStb() || (g[0] === 6 && g[1] === 6);

  for (const t of points) {
    if (done) break;
    const i = t === "A" ? 0 : 1, o = 1 - i;
    p[i]++;
    let gameOver = false;
    if (isTb()) {
      const goal = isStb() ? 10 : 7;
      if (p[i] >= goal && p[i] - p[o] >= 2) gameOver = true;
    } else if (golden && p[i] === 4 && p[o] === 3) {
      gameOver = true; // punto de oro
    } else if (p[i] >= 4 && p[i] - p[o] >= 2) {
      gameOver = true;
    }
    if (!gameOver) continue;

    if (isStb()) {
      sets.push([...p]); // se guarda con los puntos, ej. 10-8
      games.push({ set: sets.length, team: t, g: [...p], tb: true, stb: true });
      p = [0, 0]; g = [0, 0];
    } else {
      const wasTb = isTb();
      g[i]++;
      games.push({ set: sets.length + 1, team: t, g: [...g], tb: wasTb });
      p = [0, 0];
      if (wasTb || (g[i] >= 6 && g[i] - g[o] >= 2)) { sets.push([...g]); g = [0, 0]; }
    }
    const [sa, sb] = setsWon();
    if (sa === 2 || sb === 2) done = true;
  }

  const [sa, sb] = setsWon();
  return {
    sets, games: g, points: p, done,
    setsWon: [sa, sb],
    winner: done ? (sa > sb ? "A" : "B") : null,
    tiebreak: !done && isTb(), superTb: !done && isStb(),
    log: games,
  };
}

// Cómo se cantan los puntos del game actual: ["40", "AD"], ["15", "0"], o números en el tie-break.
export function pointLabels(s, golden = false) {
  const [a, b] = s.points;
  if (s.tiebreak) return [String(a), String(b)];
  if (a >= 3 && b >= 3) {
    if (a === b) return ["40", "40"];
    return a > b ? ["AD", "40"] : ["40", "AD"];
  }
  return [LABEL[Math.min(a, 3)], LABEL[Math.min(b, 3)]];
}

// ¿Qué se está jugando? Para el cartel: "Punto de oro", "Tie-break", "Set point", etc.
export function situation(s, golden = false) {
  if (s.done) return "";
  const [a, b] = s.points;
  if (s.superTb) return "Super tie-break";
  if (s.tiebreak) return "Tie-break";
  if (golden && a === 3 && b === 3) return "⚡ Punto de oro";
  if (a >= 3 && b >= 3 && a === b) return "Iguales";
  return "";
}

// Sets para guardar al terminar: los terminados y, si se cortó a mitad, el set en curso.
export function setsToSave(s) {
  const out = s.sets.map((x) => [...x]);
  if (!s.done && (s.games[0] || s.games[1])) out.push([...s.games]);
  return out;
}

// El vivo de un partido cargado desde la base.
export function liveOf(m) {
  return replay(m.points || [], { golden: !!m.golden_point, superTb: !!m.super_tb });
}
