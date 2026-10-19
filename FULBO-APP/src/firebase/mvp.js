import {
  collection, doc, getDocs, query, where, serverTimestamp, writeBatch, runTransaction,
} from 'firebase/firestore'
import { db } from './config'
import { notificar, mensajes } from './notificaciones'
import { asistioAlPartido, calcularResultadosMVP } from '../utils/mvp'

// ─── Estructura en Firestore ──────────────────────────────────────────────────
//   partidos/{id}
//     mvp_estado              null | 'abierta' | 'cerrada'
//     mvp_abierto_en          cuándo la abrió el admin (cierra sola a las 24 hs)
//     mvp_cerrado_en          cuándo se cerró
//     mvp_cerrado_por         jugador que la cerró al completar los votos (null si fue por tiempo)
//     mvp_ganador_jugador_id  el más votado (null hasta que se cierra)
//     mvp_resultados          [{ jugador_id, votos }] ordenado, se guarda al cerrar
//   votos_mvp/{partidoId}_{votanteJugadorId}   (id fijo: un solo voto por jugador)
//     grupo_id, partido_id, votante_jugador_id, votado_jugador_id,
//     votante_participacion_id, votado_participacion_id, creado_en
//   participaciones/{id}.voto_mvp = true   marca pública de "ya votó" (el voto en sí es secreto)
//
// No hay backend: cerrar y calcular el ganador lo hace el navegador de quien
// dispara el cierre (admin, el último en votar o el primero que entra pasadas las 24 hs).
// La votación se abre sola al cerrar el partido (ver cerrarPartido en usePartido).

// contexto = { grupoId, grupoNombre, autorUid, nombreDe(jugadorId) }

function datosPartido(partido) {
  return {
    partido_id: partido.id,
    fecha: partido.fecha?.toISOString?.() ?? null,
    lugar: partido.lugar ?? '',
  }
}

export async function leerParticipacionesPartido(grupoId, partidoId) {
  const snap = await getDocs(
    query(
      collection(db, 'participaciones'),
      where('grupo_id', '==', grupoId),
      where('partido_id', '==', partidoId)
    )
  )
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

// Campos que abren la votación: se guardan junto con el cierre del partido
export function camposAperturaMVP() {
  return {
    mvp_estado: 'abierta',
    mvp_abierto_en: serverTimestamp(),
    mvp_cerrado_en: null,
    mvp_cerrado_por: null,
    mvp_ganador_jugador_id: null,
    mvp_resultados: null,
  }
}

// Avisa a cada jugador que asistió que ya puede votar
export async function notificarAperturaMVP(partido, jugadores, asistieronIds, contexto) {
  const destinatarios = jugadores.filter(
    (j) => asistieronIds.includes(j.id) && j.uid_firebase
  )
  await Promise.all(destinatarios.map((j) =>
    notificar({
      grupoId: contexto.grupoId,
      grupoNombre: contexto.grupoNombre,
      tipo: 'votacion_mvp',
      mensaje: mensajes.votacionMvp(partido.fecha),
      autorUid: contexto.autorUid,
      destinatarioUid: j.uid_firebase,
      jugadorId: j.id,
      datosExtra: datosPartido(partido),
    })
  ))
}

// Guarda el voto y marca la participación del votante como "ya votó", juntos.
// Si ya había votado, las reglas rechazan el batch (el voto no se puede pisar).
export async function votarMVP(partido, votante, votado, grupoId) {
  const batch = writeBatch(db)
  batch.set(doc(db, 'votos_mvp', `${partido.id}_${votante.jugador_id}`), {
    grupo_id: grupoId,
    partido_id: partido.id,
    votante_jugador_id: votante.jugador_id,
    votado_jugador_id: votado.jugador_id,
    votante_participacion_id: votante.id,
    votado_participacion_id: votado.id,
    creado_en: serverTimestamp(),
  })
  batch.update(doc(db, 'participaciones', votante.id), { voto_mvp: true })
  await batch.commit()
}

// Cierra la votación (si sigue abierta) y calcula el ganador.
// cerradoPor: jugador que completó los votos; null si se cierra por tiempo o lo hace el admin.
export async function cerrarVotacionMVP(partido, contexto, cerradoPor = null) {
  const ref = doc(db, 'partidos', partido.id)
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref)
    // Otro dispositivo pudo cerrarla en el mismo instante
    if (snap.data()?.mvp_estado !== 'abierta') return
    tx.update(ref, {
      mvp_estado: 'cerrada',
      mvp_cerrado_en: serverTimestamp(),
      mvp_cerrado_por: cerradoPor,
    })
  })
  return finalizarVotacionMVP(partido, contexto)
}

// Con la votación ya cerrada (recién ahí se pueden leer todos los votos),
// guarda resultados y ganador. Si otro ya lo hizo, no hace nada.
export async function finalizarVotacionMVP(partido, contexto) {
  const [snapVotos, parts] = await Promise.all([
    getDocs(
      query(
        collection(db, 'votos_mvp'),
        where('grupo_id', '==', contexto.grupoId),
        where('partido_id', '==', partido.id)
      )
    ),
    leerParticipacionesPartido(contexto.grupoId, partido.id),
  ])
  const asistieron = [...new Set(parts.filter(asistioAlPartido).map((p) => p.jugador_id))]
  const resultados = calcularResultadosMVP(snapVotos.docs.map((d) => d.data()), asistieron)
  const ganador = resultados[0]?.votos > 0 ? resultados[0] : null

  const ref = doc(db, 'partidos', partido.id)
  const guardado = await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref)
    if (snap.data()?.mvp_resultados) return false
    tx.update(ref, {
      mvp_resultados: resultados,
      mvp_ganador_jugador_id: ganador?.jugador_id ?? null,
    })
    return true
  })

  // Solo avisa quien guardó el resultado, así la notificación sale una sola vez
  if (guardado && ganador) {
    await notificar({
      grupoId: contexto.grupoId,
      grupoNombre: contexto.grupoNombre,
      tipo: 'mvp_ganador',
      mensaje: mensajes.mvpGanador(partido.fecha, contexto.nombreDe(ganador.jugador_id)),
      autorUid: contexto.autorUid,
      jugadorId: ganador.jugador_id,
      datosExtra: datosPartido(partido),
    })
  }
  return { resultados, ganadorId: ganador?.jugador_id ?? null }
}
