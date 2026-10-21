// Cupo y lista de espera de un partido

export const CUPO_POR_DEFECTO = 10 // fútbol 5: 5 vs 5

// Confirmó y tiene lugar en el partido
export function esTitular(participacion) {
  return participacion.confirmo_asistencia === true && participacion.es_suplente !== true
}

// Confirmó pero está en lista de espera
export function esSuplente(participacion) {
  return participacion.confirmo_asistencia === true && participacion.es_suplente === true
}

// Primero el que se anotó antes. A igual momento desempata el id, así todos
// los dispositivos calculan exactamente el mismo orden.
export function ordenarPorInscripcion(participaciones) {
  const momento = (p) => p.inscripto_en?.toMillis?.() ?? 0
  return [...participaciones].sort(
    (a, b) => momento(a) - momento(b) || a.id.localeCompare(b.id)
  )
}

// Base para el 80% de aprobación: los titulares, pero nunca más que el cupo
// (con 11/10 se calcula sobre 10)
export function baseVotacion(cantidadTitulares, cupoMaximo) {
  return Math.min(cantidadTitulares, cupoMaximo ?? CUPO_POR_DEFECTO)
}

// Una participación por jugador: hay datos viejos con duplicadas (y dos dispositivos
// podían crear dos a la vez). Se queda con la primera, la misma que muestra la lista.
export function unaPorJugador(participaciones) {
  const vistos = new Set()
  return participaciones.filter((p) => {
    if (vistos.has(p.jugador_id)) return false
    vistos.add(p.jugador_id)
    return true
  })
}

// Id fijo para las participaciones nuevas: evita que se dupliquen
export function idParticipacion(partidoId, jugadorId) {
  return `${partidoId}_${jugadorId}`
}
