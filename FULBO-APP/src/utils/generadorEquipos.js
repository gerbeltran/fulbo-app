/**
 * Genera hasta `limite` combinaciones válidas de dos equipos.
 *
 * Reglas (en orden de prioridad):
 *  1. [HARD] NUNCA 2 ARQ en el mismo equipo
 *  2. [HARD] NUNCA más de 2 DEL en el mismo equipo
 *  3. [SOFT] Distribuir posiciones equilibradamente entre ambos equipos
 *  4. [SOFT] Minimizar la diferencia de suma de niveles
 *
 * El score compuesto garantiza que (3) siempre supera a (4) en prioridad:
 *   score = desequilibrio_posicional × 100 + diferencia_niveles
 * (diferencia_niveles máxima ≈ n × 4 ≪ 100, por lo que el multiplicador
 *  asegura que el balance posicional domine en el ordenamiento)
 */
export function generarEquipos(jugadores, limite = 8) {
  const n = jugadores.length
  if (n < 2) return []

  const mitad = Math.floor(n / 2)

  // Generar candidatos: enumeración completa para n≤16, greedy para más
  const candidatos =
    n <= 16
      ? enumSplitsCompleto(jugadores, mitad)
      : greedySplits(jugadores, mitad, 200)

  // Filtrar restricciones duras
  const validos = candidatos.filter((s) => esValido(s.equipo1, s.equipo2))

  // Fallback: si ningún split es válido (ej: 3+ ARQ), usar todos
  const base = validos.length > 0 ? validos : candidatos

  return base
    .map((s) => ({ ...s, score: calcularScore(s) }))
    .sort((a, b) => a.score - b.score)
    .slice(0, limite)
}

// ─── Restricciones duras ──────────────────────────────────────────────────────

function esValido(e1, e2) {
  // Regla 1: nunca 2 ARQ en el mismo equipo
  if (e1.filter((j) => j.posicion_preferida === 'ARQ').length > 1) return false
  if (e2.filter((j) => j.posicion_preferida === 'ARQ').length > 1) return false

  // Regla 2: nunca más de 2 DEL en el mismo equipo
  if (e1.filter((j) => j.posicion_preferida === 'DEL').length > 2) return false
  if (e2.filter((j) => j.posicion_preferida === 'DEL').length > 2) return false

  return true
}

// ─── Score compuesto ──────────────────────────────────────────────────────────

function calcularScore({ equipo1, equipo2, diferencia }) {
  // Regla 3: desequilibrio posicional (suma de |c1 - c2| por posición)
  let desequilibrioPosicional = 0
  for (const pos of ['ARQ', 'DEF', 'MED', 'DEL']) {
    const c1 = equipo1.filter((j) => j.posicion_preferida === pos).length
    const c2 = equipo2.filter((j) => j.posicion_preferida === pos).length
    desequilibrioPosicional += Math.abs(c1 - c2)
  }

  // Regla 4: diferencia de niveles (desempate cuando el balance posicional es igual)
  return desequilibrioPosicional * 100 + diferencia
}

// ─── Enumeración completa C(n, k) — eficiente para n ≤ 16 ────────────────────
// C(16,8) = 12 870 iteraciones, ejecutado en <10 ms en JS

function enumSplitsCompleto(jugadores, k) {
  const n = jugadores.length
  const resultado = []

  function backtrack(inicio, grupo1) {
    if (grupo1.length === k) {
      const ids = new Set(grupo1.map((j) => j.id))
      const grupo2 = jugadores.filter((j) => !ids.has(j.id))
      resultado.push({
        equipo1: [...grupo1],
        equipo2: grupo2,
        diferencia: Math.abs(nivelTotal(grupo1) - nivelTotal(grupo2)),
      })
      return
    }
    const faltan = k - grupo1.length
    for (let i = inicio; i <= n - faltan; i++) {
      backtrack(i + 1, [...grupo1, jugadores[i]])
    }
  }

  backtrack(0, [])
  return resultado
}

// ─── Greedy con variaciones — para n > 16 ────────────────────────────────────

function greedySplits(jugadores, k, intentos = 200) {
  const resultado = []
  const ordenados = [...jugadores].sort((a, b) => b.nivel_general - a.nivel_general)

  for (let i = 0; i < intentos; i++) {
    const pool = i === 0 ? ordenados : shuffleDeterministico(ordenados, i)
    const grupo1 = []
    const grupo2 = []

    pool.forEach((j) => {
      const n1 = nivelTotal(grupo1)
      const n2 = nivelTotal(grupo2)
      if (
        grupo1.length < k &&
        (grupo2.length >= jugadores.length - k || n1 <= n2)
      ) {
        grupo1.push(j)
      } else {
        grupo2.push(j)
      }
    })

    resultado.push({
      equipo1: grupo1,
      equipo2: grupo2,
      diferencia: Math.abs(nivelTotal(grupo1) - nivelTotal(grupo2)),
    })
  }

  return resultado
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function shuffleDeterministico(arr, semilla) {
  const result = [...arr]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.abs((semilla * 1664525 + 1013904223) * (i + 1)) % (i + 1)
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

function nivelTotal(jugadores) {
  return jugadores.reduce((s, j) => s + (j.nivel_general ?? 0), 0)
}
