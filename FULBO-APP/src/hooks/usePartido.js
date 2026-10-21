import { useState, useEffect, useRef } from 'react'
import {
  collection, doc, getDoc, getDocs, addDoc, updateDoc,
  deleteDoc, setDoc, query, where, serverTimestamp, Timestamp, writeBatch,
  increment, runTransaction, deleteField,
} from 'firebase/firestore'
import { db } from '../firebase/config'
import { generarEquipos, jugadoresParaGenerar } from '../utils/generadorEquipos'
import { notificar, mensajes } from '../firebase/notificaciones'
import { useAuth } from '../context/AuthContext'
import { useGrupo } from '../context/GrupoContext'
import {
  CUPO_POR_DEFECTO, esTitular, esSuplente, ordenarPorInscripcion, baseVotacion,
  unaPorJugador, idParticipacion,
} from '../utils/suplentes'
import { camposAperturaMVP, notificarAperturaMVP, cerrarVotacionMVP } from '../firebase/mvp'
import { useCierreAutomaticoMVP } from './useCierreAutomaticoMVP'

const colPartidos = collection(db, 'partidos')
const colParticipaciones = collection(db, 'participaciones')

// Estados del partido:
//   'abierto'    — convocatoria abierta, jugadores confirmando asistencia
//   'votando'    — equipos generados, jugadores votando por la combinación actual
//   'confirmado' — combinación aprobada y guardada
//   'jugado'     — el admin lo cerró con el resultado (estado final, no se reabre).
//                  Al cerrarlo se abre la votación MVP, que sigue en la pestaña MVP.

export function usePartido(jugadores, grupoId) {
  const [partido, setPartido] = useState(null)
  const [participaciones, setParticipaciones] = useState([])
  const [equiposCombinaciones, setEquiposCombinaciones] = useState([])
  const [combinacionConfirmada, setCombinacionConfirmada] = useState(null)
  const [config, setConfig] = useState(null)
  // Partido jugado con la votación MVP abierta (para cerrarla sola a las 24 hs)
  const [votacionMvpAbierta, setVotacionMvpAbierta] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  // Error de una acción (VOY, voto...) ya revertida en pantalla: se muestra como aviso
  const [errorAccion, setErrorAccion] = useState(null)
  const { usuario } = useAuth()
  const { grupoActivo } = useGrupo()
  // Las operaciones de asistencia van de a una: dos toques casi simultáneos
  // (ej: el admin anotando jugadores rápido) leían el mismo conteo y se pasaban del cupo
  const colaAsistencia = useRef(Promise.resolve())

  function enCola(tarea) {
    const resultado = colaAsistencia.current.then(tarea, tarea)
    colaAsistencia.current = resultado.catch(() => {})
    return resultado
  }

  useEffect(() => {
    if (grupoId) cargar()
  }, [grupoId])

  // Notificación para todos los miembros del grupo sobre un partido
  function notificarGrupo(tipo, mensaje, partidoAvisado, datosExtra = {}) {
    return notificar({
      grupoId,
      grupoNombre: grupoActivo?.nombre ?? '',
      tipo,
      mensaje,
      autorUid: usuario.uid,
      datosExtra: {
        partido_id: partidoAvisado.id,
        fecha: partidoAvisado.fecha?.toISOString?.() ?? null,
        lugar: partidoAvisado.lugar ?? '',
        ...datosExtra,
      },
    })
  }

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
      const docMvp = docsOrdenados.find((d) => d.data().mvp_estado === 'abierta')
      setVotacionMvpAbierta(docMvp ? {
        id: docMvp.id,
        ...docMvp.data(),
        fecha: docMvp.data().fecha?.toDate?.() ?? null,
        mvp_abierto_en: docMvp.data().mvp_abierto_en?.toDate?.() ?? null,
      } : null)

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
        cupo_maximo: datos.cupo_maximo ?? CUPO_POR_DEFECTO,
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

  async function abrirConvocatoria({ fecha, hora, lugar, cupo = CUPO_POR_DEFECTO }) {
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
      cupo_maximo: cupo,
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
      cupo_maximo: cupo,
      grupo_id: grupoId,
      creado_en: new Date(),
    })
    setParticipaciones([])
    setEquiposCombinaciones([])
    setCombinacionConfirmada(null)

    await notificarGrupo(
      'nueva_convocatoria',
      mensajes.nuevaConvocatoria(fechaHora, lugar.trim()),
      { id: docRef.id, fecha: fechaHora, lugar: lugar.trim() }
    )
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

    // Leemos del servidor: la lista en pantalla puede estar desactualizada.
    // Solo titulares: confirmó asistencia y no es suplente.
    const parts = await leerParticipaciones()
    setParticipaciones(parts)
    const combinaciones = generarEquipos(jugadoresParaGenerar(jugadores, parts))

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

    await notificarGrupo('votacion_equipos', mensajes.votacionEquipos(partido.fecha), partido)
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

  // ─── Asistencia, cupo y suplentes ───────────────────────────────────────────

  // Leemos del servidor: otros pueden haber confirmado desde que cargó la pantalla
  async function leerParticipaciones() {
    const snap = await getDocs(
      query(
        colParticipaciones,
        where('grupo_id', '==', grupoId),
        where('partido_id', '==', partido.id)
      )
    )
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
  }

  // Actualiza (o crea) la participación de un jugador y devuelve la lista nueva.
  // Si tiene duplicadas (datos viejos) las actualiza todas, así no quedan
  // copias "titular" de alguien que ya dijo que no va.
  async function guardarParticipacion(parts, jugadorId, cambios) {
    const existentes = parts.filter((p) => p.jugador_id === jugadorId)
    if (existentes.length > 0) {
      const batch = writeBatch(db)
      existentes.forEach((p) => batch.update(doc(db, 'participaciones', p.id), cambios))
      await batch.commit()
      return parts.map((p) => (p.jugador_id === jugadorId ? { ...p, ...cambios } : p))
    }
    const nueva = {
      partido_id: partido.id,
      grupo_id: grupoId,
      jugador_id: jugadorId,
      votos_equipos: {},
      es_suplente: false,
      ...cambios,
    }
    // Id fijo: si dos dispositivos lo crean a la vez, queda uno solo
    const id = idParticipacion(partido.id, jugadorId)
    await setDoc(doc(db, 'participaciones', id), nueva)
    return [...parts, { id, ...nueva }]
  }

  // Lo que se va a guardar, aplicado ya en pantalla (no espera a Firestore:
  // en iOS las respuestas pueden tardar y el botón parecía no hacer nada)
  function asistenciaOptimista(parts, jugadorId, confirma) {
    const otrosTitulares = unaPorJugador(parts).filter(
      (p) => esTitular(p) && p.jugador_id !== jugadorId
    ).length
    const cambios = confirma
      ? {
          confirmo_asistencia: true,
          es_suplente: otrosTitulares >= partido.cupo_maximo,
          inscripto_en: Timestamp.now(),
        }
      : { confirmo_asistencia: false, es_suplente: false }
    if (parts.some((p) => p.jugador_id === jugadorId)) {
      return parts.map((p) => (p.jugador_id === jugadorId ? { ...p, ...cambios } : p))
    }
    return [...parts, {
      id: idParticipacion(partido.id, jugadorId),
      partido_id: partido.id,
      grupo_id: grupoId,
      jugador_id: jugadorId,
      votos_equipos: {},
      ...cambios,
    }]
  }

  // Si una escritura falla: vuelve la pantalla a como estaba, avisa y relee del servidor
  async function revertir(anteriores, mensaje, err) {
    console.error(err)
    setParticipaciones(anteriores)
    setErrorAccion(mensaje)
    try {
      setParticipaciones(await leerParticipaciones())
    } catch {
      // Sin conexión: queda lo que había antes del toque
    }
  }

  async function confirmarAsistencia(jugadorId, confirma) {
    if (!partido) return
    const anteriores = participaciones
    setErrorAccion(null)
    setParticipaciones((prev) => asistenciaOptimista(prev, jugadorId, confirma))
    try {
      await enCola(() => confirmarAsistencia_(jugadorId, confirma))
    } catch (err) {
      await revertir(anteriores, 'No se pudo guardar tu asistencia. Revisá la conexión e intentá de nuevo.', err)
    }
  }

  async function confirmarAsistencia_(jugadorId, confirma) {
    if (!partido) return
    const parts = await leerParticipaciones()
    const existente = parts.find((p) => p.jugador_id === jugadorId)

    // ── VOY ──
    if (confirma) {
      // Titulares actuales sin contarlo a él (por si ya estaba anotado)
      const otrosTitulares = unaPorJugador(parts).filter(
        (p) => esTitular(p) && p.jugador_id !== jugadorId
      ).length
      // Cada VOY renueva inscripto_en: el que vuelve a confirmar pasa al final
      await guardarParticipacion(parts, jugadorId, {
        confirmo_asistencia: true,
        es_suplente: otrosTitulares >= partido.cupo_maximo,
        inscripto_en: serverTimestamp(),
      })
      setParticipaciones(await corregirExcesoDeCupo(jugadorId))
      return
    }

    // ── NO VOY ──
    const eraTitular = !!existente && esTitular(existente)
    const actualizadas = await guardarParticipacion(parts, jugadorId, {
      confirmo_asistencia: false,
      es_suplente: false,
    })
    setParticipaciones(actualizadas)

    // Si se baja un suplente (o alguien que no había respondido) no se libera lugar
    if (!eraTitular) return

    // Un titular que se baja con los equipos ya armados
    if (['votando', 'confirmado'].includes(partido.estado)) {
      const nombre = jugadores.find((j) => j.id === jugadorId)?.nombre ?? 'un jugador'
      await notificarGrupo('traidor', mensajes.traidor(nombre), partido, {
        nombre_jugador: nombre,
        jugador_id: jugadorId,
      })
    }

    const { ascendidos } = await promoverSuplentes(actualizadas, partido.cupo_maximo)

    // Votando equipos: con el suplente que entró se arman propuestas nuevas.
    // Sin suplente, el admin decide si regenerar a mano.
    if (partido.estado === 'votando' && ascendidos.length > 0) {
      await regenerarPropuestas()
    }
  }

  // Si otro dispositivo anotó a alguien en el mismo instante, los dos pueden
  // haber entrado como titulares. Releemos ya con la hora del servidor y, si
  // este jugador quedó fuera del cupo por orden de llegada, pasa a suplente.
  async function corregirExcesoDeCupo(jugadorId) {
    const parts = await leerParticipaciones()
    const titulares = ordenarPorInscripcion(unaPorJugador(parts).filter(esTitular))
    const posicion = titulares.findIndex((p) => p.jugador_id === jugadorId)
    if (posicion < partido.cupo_maximo) return parts

    return guardarParticipacion(parts, jugadorId, { es_suplente: true })
  }

  // Sube suplentes, en orden de inscripción, hasta completar el cupo.
  // Devuelve la lista actualizada y los que ascendieron.
  async function promoverSuplentes(parts, cupo) {
    const unicas = unaPorJugador(parts)
    const lugaresLibres = cupo - unicas.filter(esTitular).length
    if (lugaresLibres <= 0) return { parts, ascendidos: [] }
    const ascendidos = ordenarPorInscripcion(unicas.filter(esSuplente)).slice(0, lugaresLibres)
    if (ascendidos.length === 0) return { parts, ascendidos: [] }

    // Todas las copias del jugador que sube (si tiene duplicadas)
    const idsJugadores = ascendidos.map((p) => p.jugador_id)
    const batch = writeBatch(db)
    parts
      .filter((p) => idsJugadores.includes(p.jugador_id))
      .forEach((p) => batch.update(doc(db, 'participaciones', p.id), { es_suplente: false }))
    await batch.commit()

    const actualizadas = parts.map((p) =>
      idsJugadores.includes(p.jugador_id) ? { ...p, es_suplente: false } : p
    )
    setParticipaciones(actualizadas)

    // Aviso personal al que sube y aviso general al grupo
    await Promise.all(ascendidos.flatMap((p) => {
      const nombre = jugadores.find((j) => j.id === p.jugador_id)?.nombre ?? 'Un suplente'
      return [
        avisarPasoATitular(p.jugador_id),
        notificarGrupo('nuevo_titular', mensajes.nuevoTitular(nombre), partido, {
          nombre_jugador: nombre,
          jugador_id: p.jugador_id,
        }),
      ]
    }))
    return { parts: actualizadas, ascendidos }
  }

  async function avisarPasoATitular(jugadorId) {
    const jugador = jugadores.find((j) => j.id === jugadorId)
    // Sin cuenta de Google vinculada no tiene dónde verla
    if (!jugador?.uid_firebase) return
    await notificar({
      grupoId,
      grupoNombre: grupoActivo?.nombre ?? '',
      tipo: 'paso_a_titular',
      mensaje: mensajes.pasoATitular(partido.fecha),
      autorUid: usuario.uid,
      destinatarioUid: jugador.uid_firebase,
      jugadorId,
      datosExtra: {
        partido_id: partido.id,
        fecha: partido.fecha?.toISOString?.() ?? null,
        lugar: partido.lugar ?? '',
      },
    })
  }

  // Admin: pasa un jugador anotado de suplente a titular o al revés (sin mirar el cupo)
  function cambiarSuplente(jugadorId, pasaASuplente) {
    return enCola(() => cambiarSuplente_(jugadorId, pasaASuplente))
  }

  async function cambiarSuplente_(jugadorId, pasaASuplente) {
    if (!partido) return
    const parts = await leerParticipaciones()
    const participacion = unaPorJugador(parts).find((p) => p.jugador_id === jugadorId)
    if (participacion?.confirmo_asistencia !== true) return

    const actualizadas = await guardarParticipacion(parts, jugadorId, { es_suplente: pasaASuplente })
    setParticipaciones(actualizadas)
    if (!pasaASuplente) await avisarPasoATitular(jugadorId)
  }

  // Admin: cambia el cupo; si sube, entran los primeros suplentes
  function cambiarCupo(nuevoCupo) {
    return enCola(() => cambiarCupo_(nuevoCupo))
  }

  async function cambiarCupo_(nuevoCupo) {
    if (!partido) return
    await updateDoc(doc(db, 'partidos', partido.id), { cupo_maximo: nuevoCupo })
    setPartido((prev) => ({ ...prev, cupo_maximo: nuevoCupo }))
    const parts = await leerParticipaciones()
    setParticipaciones(parts)
    await promoverSuplentes(parts, nuevoCupo)
  }

  // ─── Votación de equipos ────────────────────────────────────────────────────

  async function votarEquipos(jugadorId, aprueba) {
    if (!partido || partido.estado !== 'votando') return

    const combIdx = partido.combinacion_actual
    const existente = unaPorJugador(participaciones).find((p) => p.jugador_id === jugadorId)
    // Solo votan los titulares: los suplentes no cuentan para el 80%
    if (!existente || !esTitular(existente)) return

    // El voto se ve al instante; si Firestore falla, se revierte
    const anteriores = participaciones
    const actualizadas = participaciones.map((p) =>
      p.id === existente.id
        ? { ...p, votos_equipos: { ...(p.votos_equipos ?? {}), [combIdx]: aprueba } }
        : p
    )
    setErrorAccion(null)
    setParticipaciones(actualizadas)
    try {
      await updateDoc(doc(db, 'participaciones', existente.id), {
        [`votos_equipos.${combIdx}`]: aprueba,
      })
    } catch (err) {
      await revertir(anteriores, 'No se pudo guardar tu voto. Revisá la conexión e intentá de nuevo.', err)
      return
    }
    await verificarVotos(actualizadas, combIdx)
  }

  async function verificarVotos(parts, combIdx) {
    const confirmados = unaPorJugador(parts).filter(esTitular)
    const total = baseVotacion(confirmados.length, partido.cupo_maximo)
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
      await avanzarCombinacion()
    }
  }

  async function confirmarEquipos(combIdx) {
    await updateDoc(doc(db, 'equipo_partido', partido.id), {
      combinacion_confirmada: combIdx,
    })
    await updateDoc(doc(db, 'partidos', partido.id), { estado: 'confirmado' })
    setCombinacionConfirmada(combIdx)
    setPartido((prev) => ({ ...prev, estado: 'confirmado' }))

    await notificarGrupo('equipos_confirmados', mensajes.equiposConfirmados(partido.fecha), partido)
  }

  async function forzarCombinacion() {
    if (!partido || partido.estado !== 'votando') return
    await confirmarEquipos(partido.combinacion_actual)
  }

  async function avanzarCombinacion() {
    const siguienteIdx = partido.combinacion_actual + 1

    if (siguienteIdx < equiposCombinaciones.length) {
      await updateDoc(doc(db, 'partidos', partido.id), {
        combinacion_actual: siguienteIdx,
      })
      setPartido((prev) => ({ ...prev, combinacion_actual: siguienteIdx }))
    } else {
      await regenerarPropuestas()
    }
  }

  // Arma propuestas nuevas con los titulares actuales (leídos del servidor),
  // borra todos los votos y deja el partido votando desde la primera combinación
  async function regenerarPropuestas() {
    const parts = await leerParticipaciones()
    const nuevasCombinaciones = generarEquipos(jugadoresParaGenerar(jugadores, parts))

    await Promise.all(
      parts.map((p) =>
        updateDoc(doc(db, 'participaciones', p.id), { votos_equipos: {} })
      )
    )
    setParticipaciones(parts.map((p) => ({ ...p, votos_equipos: {} })))

    await setDoc(doc(db, 'equipo_partido', partido.id), {
      partido_id: partido.id,
      grupo_id: grupoId,
      combinaciones: nuevasCombinaciones,
      combinacion_confirmada: null,
      creado_en: serverTimestamp(),
    })
    await updateDoc(doc(db, 'partidos', partido.id), { estado: 'votando', combinacion_actual: 0 })

    setEquiposCombinaciones(nuevasCombinaciones)
    setCombinacionConfirmada(null)
    setPartido((prev) => ({ ...prev, estado: 'votando', combinacion_actual: 0 }))
  }

  // ─── Cambios manuales de equipos (admin) ────────────────────────────────────

  // Reemplaza los equipos de la combinación que se ve (la confirmada o la que se
  // está votando). Votando, se borran los votos de esa propuesta porque cambió.
  async function editarEquipos(equipo1, equipo2) {
    if (!partido || !['votando', 'confirmado'].includes(partido.estado)) return
    const idx = partido.estado === 'confirmado' ? combinacionConfirmada : partido.combinacion_actual

    // Leemos del servidor: alguien pudo regenerar las propuestas mientras tanto
    const refEquipos = doc(db, 'equipo_partido', partido.id)
    const snap = await getDoc(refEquipos)
    const combinaciones = snap.data()?.combinaciones ?? []
    if (!combinaciones[idx]) throw new Error('La combinación ya no existe. Actualizá la pantalla.')

    // Misma forma que guarda el generador
    const copia = (j) => ({
      id: j.id,
      nombre: j.nombre,
      nivel_general: j.nivel_general ?? 0,
      posicion_preferida: j.posicion_preferida ?? null,
    })
    const nivel = (lista) => lista.reduce((s, j) => s + (j.nivel_general ?? 0), 0)
    const nuevas = combinaciones.map((c, i) =>
      i === idx
        ? {
            ...c,
            equipo1: equipo1.map(copia),
            equipo2: equipo2.map(copia),
            diferencia: Math.abs(nivel(equipo1) - nivel(equipo2)),
            editada_por_admin: true,
          }
        : c
    )
    await updateDoc(refEquipos, { combinaciones: nuevas })
    setEquiposCombinaciones(nuevas)

    if (partido.estado === 'votando') {
      const conVoto = participaciones.filter((p) => p.votos_equipos?.[idx] !== undefined)
      if (conVoto.length > 0) {
        const batch = writeBatch(db)
        conVoto.forEach((p) =>
          batch.update(doc(db, 'participaciones', p.id), { [`votos_equipos.${idx}`]: deleteField() })
        )
        await batch.commit()
        setParticipaciones((prev) =>
          prev.map((p) => {
            if (p.votos_equipos?.[idx] === undefined) return p
            const { [idx]: _borrado, ...resto } = p.votos_equipos
            return { ...p, votos_equipos: resto }
          })
        )
      }
    }
  }

  // ─── Cierre del partido ─────────────────────────────────────────────────────

  // Admin: guarda el resultado y quién asistió, suma las estadísticas de cada
  // jugador y abre la votación MVP. Todo en una transacción: si dos dispositivos
  // lo cierran a la vez, solo uno suma.
  // asistencias = { [jugadorId]: true | false }
  async function cerrarPartido({ golesEquipo1, golesEquipo2, asistencias }) {
    if (!partido || partido.estado !== 'confirmado') return
    const parts = await leerParticipaciones()
    const idsEquipo1 = (equipoConfirmado?.equipo1 ?? []).map((j) => j.id)
    const idsEquipo2 = (equipoConfirmado?.equipo2 ?? []).map((j) => j.id)
    const diferencia = golesEquipo1 - golesEquipo2

    // Ganó, empató o perdió (null si no estaba en ninguno de los dos equipos)
    function resultadoDe(jugadorId) {
      const enEquipo1 = idsEquipo1.includes(jugadorId)
      if (!enEquipo1 && !idsEquipo2.includes(jugadorId)) return null
      if (diferencia === 0) return 'partidos_empatados'
      return (diferencia > 0) === enEquipo1 ? 'partidos_ganados' : 'partidos_perdidos'
    }

    // Solo jugadores que todavía existen (un borrado haría fallar la transacción)
    const idsExistentes = jugadores.map((j) => j.id)
    const asistieronIds = Object.keys(asistencias).filter(
      (id) => asistencias[id] && idsExistentes.includes(id)
    )

    const refPartido = doc(db, 'partidos', partido.id)
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(refPartido)
      if (snap.data()?.estado !== 'confirmado') {
        throw new Error('El partido ya fue cerrado.')
      }
      tx.update(refPartido, {
        estado: 'jugado',
        resultado_equipo1: golesEquipo1,
        resultado_equipo2: golesEquipo2,
        diferencia_goles: diferencia,
        cerrado_en: serverTimestamp(),
        ...camposAperturaMVP(),
      })
      // Todas las participaciones del jugador (hay datos viejos duplicados)
      parts
        .filter((p) => p.jugador_id in asistencias)
        .forEach((p) =>
          tx.update(doc(db, 'participaciones', p.id), { asistio: asistencias[p.jugador_id] })
        )
      asistieronIds.forEach((id) => {
        const cambios = { partidos_jugados: increment(1) }
        const resultado = resultadoDe(id)
        if (resultado) cambios[resultado] = increment(1)
        tx.update(doc(db, 'jugadores', id), cambios)
      })
    })

    await notificarAperturaMVP(partido, jugadores, asistieronIds, contextoMVP)
    await cargar()
  }

  // ─── Votación MVP ───────────────────────────────────────────────────────────

  const contextoMVP = {
    grupoId,
    grupoNombre: grupoActivo?.nombre ?? '',
    autorUid: usuario.uid,
    nombreDe: (id) => jugadores.find((j) => j.id === id)?.nombre ?? 'un jugador',
  }

  // Sin backend: el primero que abre la app pasadas las 24 hs la cierra
  useCierreAutomaticoMVP(votacionMvpAbierta, async () => {
    await cerrarVotacionMVP(votacionMvpAbierta, contextoMVP)
    setVotacionMvpAbierta(null)
  })

  // ─── Valores derivados ──────────────────────────────────────────────────────

  // "confirmados" son los titulares: los suplentes no votan ni entran en los equipos
  const unicas = unaPorJugador(participaciones)
  const confirmados = unicas.filter(esTitular)
  const suplentes = ordenarPorInscripcion(unicas.filter(esSuplente))
  const combIdxActual = partido?.combinacion_actual ?? 0
  const aprobaron = confirmados.filter(
    (p) => p.votos_equipos?.[combIdxActual] === true
  ).length
  const rechazaron = confirmados.filter(
    (p) => p.votos_equipos?.[combIdxActual] === false
  ).length
  const totalVotantes = baseVotacion(confirmados.length, partido?.cupo_maximo)
  const votosActuales = { aprobaron, rechazaron, total: totalVotantes }

  const porcentajeAprobacion =
    totalVotantes > 0
      ? Math.min(100, Math.round((aprobaron / totalVotantes) * 100))
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
    errorAccion,
    limpiarErrorAccion: () => setErrorAccion(null),
    confirmados,
    suplentes,
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
    cambiarSuplente,
    cambiarCupo,
    votarEquipos,
    forzarCombinacion,
    avanzarCombinacion,
    cerrarPartido,
    editarEquipos,
    votacionMvpAbierta,
  }
}
