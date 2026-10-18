import { collection, doc, addDoc, writeBatch, arrayUnion, serverTimestamp } from 'firebase/firestore'
import { db } from './config'

// ─── Estructura en Firestore ──────────────────────────────────────────────────
//   notificaciones/{id}
//     grupo_id, tipo, mensaje, creada_en, datos_extra
//     destinatario_uid  uid de la cuenta destino (null = todos los miembros del grupo)
//     jugador_id        jugador relacionado, si lo hay
//     autor_uid         quien la generó (no se la mostramos a él mismo)
//     leida_por[]       uids que ya la leyeron (cada usuario tiene su propio estado)

export const MAXIMO_NOTIFICACIONES = 20

// A qué sección lleva cada tipo al tocarla
export const DESTINO_POR_TIPO = {
  solicitud_pendiente: 'jugadores',
  solicitud_aprobada: 'partido',
  solicitud_rechazada: null,
  nueva_convocatoria: 'partido',
  votacion_equipos: 'partido',
  equipos_confirmados: 'partido',
  votacion_mvp: 'mvp',
  traidor: 'partido',
  paso_a_titular: 'partido',
  nuevo_titular: 'partido',
}

export const ICONO_POR_TIPO = {
  solicitud_pendiente: '🙋',
  solicitud_aprobada: '✅',
  solicitud_rechazada: '❌',
  nueva_convocatoria: '📅',
  votacion_equipos: '🗳️',
  equipos_confirmados: '⚽',
  votacion_mvp: '🏆',
  traidor: '⚖️',
  paso_a_titular: '🎉',
  nuevo_titular: '🔄',
}

function fechaLegible(fecha) {
  if (!fecha) return ''
  // "miércoles 21 de octubre" (sin la coma que agrega el formato es-AR)
  return fecha
    .toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })
    .replace(',', '')
}

// ─── Textos ───────────────────────────────────────────────────────────────────

export const mensajes = {
  solicitudPendiente: (nombre) =>
    `${nombre} quiere unirse al grupo. Revisá las solicitudes.`,
  solicitudAprobada: (grupoNombre) =>
    `¡Ya sos parte de ${grupoNombre}! Podés confirmar tu asistencia.`,
  solicitudRechazada: (grupoNombre) =>
    `Tu solicitud para unirte a ${grupoNombre} fue rechazada.`,
  nuevaConvocatoria: (fecha, lugar) =>
    `Hay un nuevo partido el ${fechaLegible(fecha)} en ${lugar}. ¡Confirmá tu asistencia!`,
  votacionEquipos: (fecha) =>
    `Ya podés votar por los equipos para el partido del ${fechaLegible(fecha)}.`,
  equiposConfirmados: (fecha) =>
    `¡Equipos confirmados para el partido del ${fechaLegible(fecha)}! Entrá a ver cómo quedaron.`,
  votacionMvp: (fecha) =>
    `Ya podés votar al MVP del partido del ${fechaLegible(fecha)}.`,
  pasoATitular: (fecha) =>
    `¡Pasaste a titular! Un lugar se liberó para el partido del ${fechaLegible(fecha)}.`,
  nuevoTitular: (nombre) =>
    `${nombre} pasó de suplente a titular.`,
  traidor: (nombre) =>
    `El traidor de ${nombre} se bajó a última hora. Le caerá todo el peso de la ley. ⚖️`,
}

// ─── Crear ────────────────────────────────────────────────────────────────────

// Crea una notificación. Nunca lanza error: si falla, la acción principal
// (abrir partido, aprobar solicitud, etc.) ya se hizo y no queremos romperla.
export async function notificar({
  grupoId,
  grupoNombre = '',
  tipo,
  mensaje,
  autorUid,
  destinatarioUid = null,
  jugadorId = null,
  datosExtra = {},
}) {
  try {
    await addDoc(collection(db, 'notificaciones'), {
      grupo_id: grupoId,
      destinatario_uid: destinatarioUid,
      jugador_id: jugadorId,
      tipo,
      mensaje,
      autor_uid: autorUid,
      // Si es para todo el grupo, el autor ya la "leyó"
      leida_por: destinatarioUid ? [] : [autorUid],
      creada_en: serverTimestamp(),
      datos_extra: { grupo_nombre: grupoNombre, ...datosExtra },
    })
  } catch (err) {
    console.error('No se pudo crear la notificación', tipo, err)
  }
}

// ─── Marcar como leídas ───────────────────────────────────────────────────────

export async function marcarLeidas(ids, uid) {
  if (ids.length === 0) return
  const batch = writeBatch(db)
  ids.forEach((id) => batch.update(doc(db, 'notificaciones', id), { leida_por: arrayUnion(uid) }))
  await batch.commit()
}
