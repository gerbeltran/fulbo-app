import { useState } from 'react'

const CLAVE_LOCAL = 'fulbo_jugador_actual_id'

export function useJugadorActual(jugadores) {
  const [jugadorActualId, setJugadorActualId] = useState(
    () => localStorage.getItem(CLAVE_LOCAL)
  )

  // Resuelve el ID contra la lista actual (por si cambió algún dato del jugador)
  const jugadorActual = jugadores.find((j) => j.id === jugadorActualId) ?? null

  function seleccionar(id) {
    localStorage.setItem(CLAVE_LOCAL, id)
    setJugadorActualId(id)
  }

  function limpiar() {
    localStorage.removeItem(CLAVE_LOCAL)
    setJugadorActualId(null)
  }

  return { jugadorActual, seleccionar, limpiar }
}
