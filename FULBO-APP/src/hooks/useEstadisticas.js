import { useState, useEffect } from 'react'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '../firebase/config'

// Las estadísticas de cada jugador (partidos_jugados, ganados, empatados, perdidos)
// se guardan en el jugador al cerrar un partido; el admin puede ajustarlas a mano.
// Acá solo se leen los partidos para contar los jugados del grupo y los MVPs.
export function useEstadisticas(grupoId) {
  const [mvps, setMvps] = useState({}) // jugador_id → veces elegido MVP
  const [partidosJugados, setPartidosJugados] = useState(0)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (grupoId) cargar()
  }, [grupoId])

  async function cargar() {
    setCargando(true)
    setError(null)
    try {
      const snap = await getDocs(
        query(collection(db, 'partidos'), where('grupo_id', '==', grupoId))
      )
      const partidos = snap.docs.map((d) => d.data())

      const conteo = {}
      partidos
        .filter((p) => p.mvp_estado === 'cerrada' && p.mvp_ganador_jugador_id)
        .forEach((p) => {
          conteo[p.mvp_ganador_jugador_id] = (conteo[p.mvp_ganador_jugador_id] ?? 0) + 1
        })

      setMvps(conteo)
      setPartidosJugados(partidos.filter((p) => p.estado === 'jugado').length)
    } catch (err) {
      console.error(err)
      setError('No se pudieron cargar las estadísticas.')
    } finally {
      setCargando(false)
    }
  }

  // Jugadores ordenados por partidos jugados (y por nombre si empatan)
  function ranking(jugadores) {
    return jugadores
      .map((jugador) => ({ jugador, partidos: jugador.partidos_jugados ?? 0 }))
      .sort((a, b) => b.partidos - a.partidos || a.jugador.nombre.localeCompare(b.jugador.nombre))
  }

  return { mvps, partidosJugados, ranking, cargando, error, cargar }
}
