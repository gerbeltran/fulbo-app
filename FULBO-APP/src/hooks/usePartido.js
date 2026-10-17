import { useState, useEffect } from 'react'
import {
  collection, doc, getDoc, getDocs, addDoc, updateDoc,
  deleteDoc, setDoc, query, where, serverTimestamp, Timestamp,
} from 'firebase/firestore'
import { db } from '../firebase/config'
import { generarEquipos } from '../utils/generadorEquipos'

const colPartidos = collection(db, 'partidos')
const colParticipaciones = collection(db, 'participaciones')

// Estados del partido:
//   'abierto'    — convocatoria abierta, jugadores confirmando asistencia
//   'votando'    — equipos generados, jugadores votando por la combinación actual
//   'confirmado' — combinación aprobada y guardada

export function usePartido(jugadores, grupoId) {
  const [partido, setPartido] = useState(null)
  const [participaciones, setParticipaciones] = useState([])
  const [equiposCombinaciones, setEquiposCombinaciones] = useState([])
  const [combinacionConfirmada, setCombinacionConfirmada] = useState(null)
  const [config, setConfig] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (grupoId) cargar()
  }, [grupoId])

  // ─── Carga inicial ──────────────────────────────────────────────────────────

  async function cargar() {
    setCargando(true)
    setError(null)
    try {
      const refConfig = doc(db, 'convocatoria_config', grupoId)
      const snapConfig = await getDoc(refConfig)
      const configData = snapConfig.exists()
        ? snapConfig.data()
        : { activa: false, dia_semana: 3, hora_apertura: '20:00' }
      setConfig(configData)

      // Cargamos partidos del grupo y filtramos en memoria para evitar índice compuesto
      const snapPartidos = await getDocs(
        query(colPartidos, where('grupo_id', '==', grupoId))
      )
      const estadosActivos = ['abierto', 'votando', 'confirmado']
      const docsOrdenados = snapPartidos.docs.sort((a, b) => {
        const tA = a.data().creado_en?.toMillis?.() ?? 0
        const tB = b.data().creado_en?.toMillis?.() ?? 0
        return tB - tA
      })
      const partidoDoc = docsOrdenados.find((d) =>
        estadosActivos.includes(d.data().estado)
      )

      if (!partidoDoc) {
        setPartido(null)
        setParticipaciones([])
        setEquiposCombinaciones([])
        setCombinacionConfirmada(null)
        return
      }

      const datos = partidoDoc.data()
      const partidoData = {
        id: partidoDoc.id,
        ...datos,
        fecha: datos.fecha?.toDate?.() ?? null,
        creado_en: datos.creado_en?.toDate?.() ?? new Date(),
        combinacion_actual: datos.combinacion_actual ?? 0,
      }
      setPartido(partidoData)

      // Las reglas de seguridad exigen filtrar también por grupo_id
      const snapPart = await getDocs(
        query(
          colParticipaciones,
          where('grupo_id', '==', grupoId),
          where('partido_id', '==', partidoDoc.id)
        )
      )
      setParticipaciones(snapPart.docs.map((d) => ({ id: d.id, ...d.data() })))

      if (['votando', 'confirmado'].includes(datos.estado)) {
        const snapEquipos = await getDoc(doc(db, 'equipo_partido', partidoDoc.id))
        if (snapEquipos.exists()) {
          const eq = snapEquipos.data()
          setEquiposCombinaciones(eq.combinaciones ?? [])
          setCombinacionConfirmada(eq.combinacion_confirmada ?? null)
        }
      }
    } catch (err) {
      setError('No se pudo cargar el partido.')
      console.error(err)
    } finally {
      setCargando(false)
    }
  }

  // ─── Schedule helper ────────────────────────────────────────────────────────

  function verificarSchedule() {
    if (!config?.activa) return false
    const ahora = new Date()
    if (ahora.getDay() !== config.dia_semana) return false
    const [hora, min] = (config.hora_apertura ?? '20:00').split(':').map(Number)
    return ahora.getHours() * 60 + ahora.getMinutes() >= hora * 60 + min
  }

  // ─── Ciclo de vida del partido ──────────────────────────────────────────────

  async function abrirConvocatoria({ fecha, hora, lugar }) {
    if (partido) return
    const [anio, mes, dia] = fecha.split('-').map(Number)
    const [h, m] = hora.split(':').map(Number)
    const fechaHora = new Date(anio, mes - 1, dia, h, m, 0)

    const docRef = await addDoc(colPartidos, {
      fecha: Timestamp.fromDate(fechaHora),
      lugar: lugar.trim(),
      estado: 'abierto',
      duracion_min: 90,
      combinacion_actual: 0,
      grupo_id: grupoId,
      creado_en: serverTimestamp(),
    })
    setPartido({
      id: docRef.id,
      fecha: fechaHora,
      lugar: lugar.trim(),
      estado: 'abierto',
      duracion_min: 90,
      combinacion_actual: 0,
      grupo_id: grupoId,
      creado_en: new Date(),
    })
    setParticipaciones([])
    setEquiposCombinaciones([])
    setCombinacionConfirmada(null)
  }

  async function reabrirConvocatoria() {
    if (!partido) return
    await updateDoc(doc(db, 'partidos', partido.id), {
      estado: 'abierto',
      combinacion_actual: 0,
    })
    setPartido((prev) => ({ ...prev, estado: 'abierto', combinacion_actual: 0 }))
    setEquiposCombinaciones([])
    setCombinacionConfirmada(null)
  }

  async function cerrarConvocatoria() {
    if (!partido) return

    const confirmadosIds = participaciones
      .filter((p) => p.confirmo_asistencia === true)
      .map((p) => p.jugador_id)

    const jugadoresConfirmados = jugadores
      .filter((j) => confirmadosIds.includes(j.id))
      .map((j) => ({
        id: j.id,
        nombre: j.nombre,
        nivel_general: j.nivel_general,
        posicion_preferida: j.posicion_preferida,
      }))

    const combinaciones = generarEquipos(jugadoresConfirmados)

    await setDoc(doc(db, 'equipo_partido', partido.id), {
      partido_id: partido.id,
      grupo_id: grupoId,
      combinaciones,
      combinacion_confirmada: null,
      creado_en: serverTimestamp(),
    })
    await updateDoc(doc(db, 'partidos', partido.id), {
      estado: 'votando',
      combinacion_actual: 0,
    })

    setEquiposCombinaciones(combinaciones)
    setCombinacionConfirmada(null)
    setPartido((prev) => ({ ...prev, estado: 'votando', combinacion_actual: 0 }))
  }

  async function borrarConvocatoria() {
    if (!partido) return
    await Promise.all(
      participaciones.map((p) => deleteDoc(doc(db, 'participaciones', p.id)))
    )
    try {
      await deleteDoc(doc(db, 'equipo_partido', partido.id))
    } catch {
      // Puede no existir
    }
    await deleteDoc(doc(db, 'partidos', partido.id))
    setPartido(null)
    setParticipaciones([])
    setEquiposCombinaciones([])
    setCombinacionConfirmada(null)
  }

  async function guardarConfig(nuevaConfig) {
    const refConfig = doc(db, 'convocatoria_config', grupoId)
    await setDoc(refConfig, nuevaConfig)
    setConfig(nuevaConfig)
  }

  // ─── Asistencia ─────────────────────────────────────────────────────────────

  async function confirmarAsistencia(jugadorId, confirma) {
    if (!partido) return
    const existente = participaciones.find((p) => p.jugador_id === jugadorId)
    if (existente) {
      await updateDoc(doc(db, 'participaciones', existente.id), {
        confirmo_asistencia: confirma,
      })
      setParticipaciones((prev) =>
        prev.map((p) =>
          p.id === existente.id ? { ...p, confirmo_asistencia: confirma } : p
        )
      )
    } else {
      const nueva = {
        partido_id: partido.id,
        grupo_id: grupoId,
        jugador_id: jugadorId,
        confirmo_asistencia: confirma,
        votos_equipos: {},
      }
      const docRef = await addDoc(colParticipaciones, nueva)
      setParticipaciones((prev) => [...prev, { id: docRef.id, ...nueva }])
    }
  }

  // ─── Votación de equipos ────────────────────────────────────────────────────

  async function votarEquipos(jugadorId, aprueba) {
    if (!partido || partido.estado !== 'votando') return

    const combIdx = partido.combinacion_actual
    const existente = participaciones.find((p) => p.jugador_id === jugadorId)
    if (!existente) return

    await updateDoc(doc(db, 'participaciones', existente.id), {
      [`votos_equipos.${combIdx}`]: aprueba,
    })

    const actualizadas = participaciones.map((p) =>
      p.id === existente.id
        ? { ...p, votos_equipos: { ...(p.votos_equipos ?? {}), [combIdx]: aprueba } }
        : p
    )
    setParticipaciones(actualizadas)
    await verificarVotos(actualizadas, combIdx)
  }

  async function verificarVotos(parts, combIdx) {
    const confirmados = parts.filter((p) => p.confirmo_asistencia === true)
    const total = confirmados.length
    if (total === 0) return

    const aprobaron = confirmados.filter(
      (p) => p.votos_equipos?.[combIdx] === true
    ).length
    const rechazaron = confirmados.filter(
      (p) => p.votos_equipos?.[combIdx] === false
    ).length

    if (aprobaron / total >= 0.8) {
      await confirmarEquipos(combIdx)
      return
    }
    if (rechazaron >= 3) {
      await avanzarCombinacion(parts)
    }
  }

  async function confirmarEquipos(combIdx) {
    await updateDoc(doc(db, 'equipo_partido', partido.id), {
      combinacion_confirmada: combIdx,
    })
    await updateDoc(doc(db, 'partidos', partido.id), { estado: 'confirmado' })
    setCombinacionConfirmada(combIdx)
    setPartido((prev) => ({ ...prev, estado: 'confirmado' }))
  }

  async function forzarCombinacion() {
    if (!partido || partido.estado !== 'votando') return
    await confirmarEquipos(partido.combinacion_actual)
  }

  async function avanzarCombinacion(partsActuales) {
    const parts = partsActuales ?? participaciones
    const siguienteIdx = partido.combinacion_actual + 1

    if (siguienteIdx < equiposCombinaciones.length) {
      await updateDoc(doc(db, 'partidos', partido.id), {
        combinacion_actual: siguienteIdx,
      })
      setPartido((prev) => ({ ...prev, combinacion_actual: siguienteIdx }))
    } else {
      const confirmadosIds = parts
        .filter((p) => p.confirmo_asistencia === true)
        .map((p) => p.jugador_id)
      const jugadoresConfirmados = jugadores
        .filter((j) => confirmadosIds.includes(j.id))
        .map((j) => ({
          id: j.id,
          nombre: j.nombre,
          nivel_general: j.nivel_general,
          posicion_preferida: j.posicion_preferida,
        }))

      const nuevasCombinaciones = generarEquipos(jugadoresConfirmados)

      await Promise.all(
        parts.map((p) =>
          updateDoc(doc(db, 'participaciones', p.id), { votos_equipos: {} })
        )
      )
      setParticipaciones((prev) => prev.map((p) => ({ ...p, votos_equipos: {} })))

      await setDoc(doc(db, 'equipo_partido', partido.id), {
        partido_id: partido.id,
        grupo_id: grupoId,
        combinaciones: nuevasCombinaciones,
        combinacion_confirmada: null,
        creado_en: serverTimestamp(),
      })
      await updateDoc(doc(db, 'partidos', partido.id), { combinacion_actual: 0 })

      setEquiposCombinaciones(nuevasCombinaciones)
      setCombinacionConfirmada(null)
      setPartido((prev) => ({ ...prev, combinacion_actual: 0 }))
    }
  }

  // ─── Valores derivados ──────────────────────────────────────────────────────

  const confirmados = participaciones.filter((p) => p.confirmo_asistencia === true)
  const combIdxActual = partido?.combinacion_actual ?? 0
  const aprobaron = confirmados.filter(
    (p) => p.votos_equipos?.[combIdxActual] === true
  ).length
  const rechazaron = confirmados.filter(
    (p) => p.votos_equipos?.[combIdxActual] === false
  ).length
  const votosActuales = { aprobaron, rechazaron, total: confirmados.length }

  const porcentajeAprobacion =
    confirmados.length > 0
      ? Math.round((aprobaron / confirmados.length) * 100)
      : 0

  const equipoActual =
    partido?.estado === 'votando'
      ? equiposCombinaciones[combIdxActual] ?? null
      : null

  const equipoConfirmado =
    partido?.estado === 'confirmado' && combinacionConfirmada !== null
      ? equiposCombinaciones[combinacionConfirmada] ?? null
      : null

  const deberiaAbrirSchedule = !partido && verificarSchedule()

  return {
    partido,
    participaciones,
    equiposCombinaciones,
    equipoActual,
    equipoConfirmado,
    config,
    cargando,
    error,
    confirmados,
    votosActuales,
    porcentajeAprobacion,
    deberiaAbrirSchedule,
    cargar,
    abrirConvocatoria,
    reabrirConvocatoria,
    borrarConvocatoria,
    cerrarConvocatoria,
    guardarConfig,
    confirmarAsistencia,
    votarEquipos,
    forzarCombinacion,
    avanzarCombinacion,
  }
}
