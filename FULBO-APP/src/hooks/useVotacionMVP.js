import { useState, useEffect } from 'react'
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore'
import { db } from '../firebase/config'
import {
  leerParticipacionesPartido, votarMVP, cerrarVotacionMVP, finalizarVotacionMVP,
} from '../firebase/mvp'
import { useAuth } from '../context/AuthContext'
import { useGrupo } from '../context/GrupoContext'
import { asistioAlPartido, cierreAutomaticoMVP } from '../utils/mvp'
import { useCierreAutomaticoMVP } from './useCierreAutomaticoMVP'

const aFecha = (valor) => valor?.toDate?.() ?? null

// Un jugador por fila (hay datos viejos con participaciones duplicadas);
// si una de las copias tiene el voto marcado, se queda con esa
function asistentesUnicos(participaciones) {
  const porJugador = {}
  participaciones.filter(asistioAlPartido).forEach((p) => {
    const actual = porJugador[p.jugador_id]
    if (!actual || (!actual.voto_mvp && p.voto_mvp)) porJugador[p.jugador_id] = p
  })
  return Object.values(porJugador)
}

// Votación MVP: la abierta (si hay) y el historial de las cerradas
export function useVotacionMVP(grupoId, jugadores, jugadorActual, cargandoJugadores) {
  const [partidos, setPartidos] = useState([]) // partidos que tuvieron votación MVP
  const [participaciones, setParticipaciones] = useState([]) // del partido con votación abierta
  const [miVoto, setMiVoto] = useState(null) // jugador_id que votó el usuario
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const { usuario } = useAuth()
  const { grupoActivo } = useGrupo()

  const contexto = {
    grupoId,
    grupoNombre: grupoActivo?.nombre ?? '',
    autorUid: usuario.uid,
    nombreDe: (id) => jugadores.find((j) => j.id === id)?.nombre ?? 'un jugador',
  }

  // Espera a los jugadores: al cerrar se necesitan los nombres para la notificación
  useEffect(() => {
    if (grupoId && !cargandoJugadores) cargar()
  }, [grupoId, cargandoJugadores])

  async function cargar() {
    setCargando(true)
    setError(null)
    try {
      const snap = await getDocs(
        query(collection(db, 'partidos'), where('grupo_id', '==', grupoId))
      )
      const lista = snap.docs
        .map((d) => {
          const datos = d.data()
          return {
            id: d.id,
            ...datos,
            fecha: aFecha(datos.fecha),
            mvp_abierto_en: aFecha(datos.mvp_abierto_en),
            mvp_cerrado_en: aFecha(datos.mvp_cerrado_en),
          }
        })
        .filter((p) => p.mvp_estado === 'abierta' || p.mvp_estado === 'cerrada')

      // Cerradas sin resultado: quien la cerró no llegó a guardarlo (se cortó la conexión)
      for (const p of lista.filter((p) => p.mvp_estado === 'cerrada' && !p.mvp_resultados)) {
        try {
          const { resultados, ganadorId } = await finalizarVotacionMVP(p, contexto)
          p.mvp_resultados = resultados
          p.mvp_ganador_jugador_id = ganadorId
        } catch (err) {
          console.error('No se pudo calcular el MVP', p.id, err)
        }
      }

      const abierta = lista
        .filter((p) => p.mvp_estado === 'abierta')
        .sort((a, b) => (b.mvp_abierto_en?.getTime() ?? 0) - (a.mvp_abierto_en?.getTime() ?? 0))[0]

      let parts = []
      let voto = null
      if (abierta) {
        parts = await leerParticipacionesPartido(grupoId, abierta.id)
        const mia = asistentesUnicos(parts).find((p) => p.jugador_id === jugadorActual?.id)
        // Solo puedo leer mi propio voto mientras la votación está abierta
        if (mia?.voto_mvp) {
          const snapVoto = await getDoc(doc(db, 'votos_mvp', `${abierta.id}_${mia.jugador_id}`))
          voto = snapVoto.data()?.votado_jugador_id ?? null
        }
      }

      setPartidos(lista)
      setParticipaciones(parts)
      setMiVoto(voto)
    } catch (err) {
      console.error(err)
      setError('No se pudo cargar la votación MVP.')
    } finally {
      setCargando(false)
    }
  }

  // ─── Votación abierta ───────────────────────────────────────────────────────

  const votacionAbierta =
    partidos
      .filter((p) => p.mvp_estado === 'abierta')
      .sort((a, b) => (b.mvp_abierto_en?.getTime() ?? 0) - (a.mvp_abierto_en?.getTime() ?? 0))[0] ?? null

  const asistentes = votacionAbierta ? asistentesUnicos(participaciones) : []
  const miParticipacion = asistentes.find((p) => p.jugador_id === jugadorActual?.id) ?? null
  const cantidadVotaron = asistentes.filter((p) => p.voto_mvp).length

  async function votar(votadoJugadorId) {
    const votado = asistentes.find((p) => p.jugador_id === votadoJugadorId)
    if (!votacionAbierta || !miParticipacion || miParticipacion.voto_mvp || !votado) return
    if (votado.jugador_id === miParticipacion.jugador_id) return

    // "Ya votaste ✓" al instante, sin esperar a Firestore; si falla se revierte
    const anteriores = participaciones
    setParticipaciones((prev) =>
      prev.map((p) => (p.id === miParticipacion.id ? { ...p, voto_mvp: true } : p))
    )
    setMiVoto(votadoJugadorId)
    try {
      await votarMVP(votacionAbierta, miParticipacion, votado, grupoId)
    } catch (err) {
      setParticipaciones(anteriores)
      setMiVoto(null)
      throw err // la pantalla muestra el error
    }

    // El voto ya está guardado: si esto falla, no se revierte nada
    try {
      // Si con este voto ya votaron todos, se cierra en el momento
      const parts = await leerParticipacionesPartido(grupoId, votacionAbierta.id)
      setParticipaciones(parts)
      if (asistentesUnicos(parts).every((p) => p.voto_mvp)) {
        await cerrarVotacionMVP(votacionAbierta, contexto, miParticipacion.jugador_id)
        await cargar()
      }
    } catch (err) {
      console.error('No se pudo verificar si votaron todos', err)
    }
  }

  // Por tiempo (24 hs) o el admin con "Cerrar votación MVP ahora"
  async function cerrarVotacion() {
    await cerrarVotacionMVP(votacionAbierta, contexto)
    await cargar()
  }
  useCierreAutomaticoMVP(votacionAbierta, cerrarVotacion)

  // ─── Historial ──────────────────────────────────────────────────────────────

  // Más reciente primero
  const cerradas = partidos
    .filter((p) => p.mvp_estado === 'cerrada' && p.mvp_resultados)
    .sort((a, b) => (b.mvp_cerrado_en?.getTime() ?? 0) - (a.mvp_cerrado_en?.getTime() ?? 0))

  return {
    cargando,
    error,
    cargar,
    votacionAbierta,
    cierreAutomatico: cierreAutomaticoMVP(votacionAbierta),
    asistentes,
    miParticipacion,
    cantidadVotaron,
    miVoto,
    votar,
    cerrarVotacion,
    cerradas,
  }
}
