// La votación MVP se cierra sola a las 24 hs de abierta
export const DURACION_VOTACION_MVP_MS = 24 * 60 * 60 * 1000

// Asistió al partido: lo marca el admin al cerrarlo (modal "Cerrar partido").
// Misma condición que firestore.rules → asistio().
export function asistioAlPartido(participacion) {
  return participacion.asistio === true
}

// Momento del cierre automático (null si la votación no está abierta)
export function cierreAutomaticoMVP(partido) {
  if (partido?.mvp_estado !== 'abierta' || !partido.mvp_abierto_en) return null
  return new Date(partido.mvp_abierto_en.getTime() + DURACION_VOTACION_MVP_MS)
}

export function votacionMVPVencida(partido) {
  const cierre = cierreAutomaticoMVP(partido)
  return !!cierre && Date.now() >= cierre.getTime()
}

// Ranking de la votación: todos los que asistieron, ordenados por votos.
// Empate: gana el que recibió su primer voto antes. Devuelve [{ jugador_id, votos }].
export function calcularResultadosMVP(votos, jugadoresIds) {
  const conteo = Object.fromEntries(
    jugadoresIds.map((id) => [id, { jugador_id: id, votos: 0, primerVoto: Infinity }])
  )
  votos.forEach((v) => {
    const fila = conteo[v.votado_jugador_id] ??= {
      jugador_id: v.votado_jugador_id, votos: 0, primerVoto: Infinity,
    }
    fila.votos += 1
    fila.primerVoto = Math.min(fila.primerVoto, v.creado_en?.toMillis?.() ?? Infinity)
  })
  return Object.values(conteo)
    .sort((a, b) =>
      b.votos - a.votos ||
      a.primerVoto - b.primerVoto ||
      a.jugador_id.localeCompare(b.jugador_id)
    )
    .map(({ jugador_id, votos }) => ({ jugador_id, votos }))
}
