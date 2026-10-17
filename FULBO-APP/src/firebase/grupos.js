import {
  collection, doc, getDoc, getDocs, writeBatch,
  arrayUnion, arrayRemove, serverTimestamp,
} from 'firebase/firestore'
import { db } from './config'

// ─── Estructura en Firestore ──────────────────────────────────────────────────
//   grupos/{grupoId}                     nombre, codigo_invitacion, admin_uid, miembros_uids[], creado_en
//   grupos/{grupoId}/solicitudes/{uid}   pedidos de ingreso de cuentas aún no vinculadas a un jugador
//   codigos_invitacion/{codigo}          grupo_id, grupo_nombre (permite buscar el grupo por código)
//   miembros_grupo/{grupoId}_{jugadorId} grupo_id, jugador_id, rol, unido_en
//   jugadores/{jugadorId}                ... + grupo_id, uid_firebase (null hasta que se vincula)
//
// miembros_uids guarda las cuentas de Google con acceso al grupo; lo usan las
// reglas de seguridad y la pantalla "Mis grupos".

// Sin O/0 ni I/1 para que el código no se preste a confusión al dictarlo
const CARACTERES_CODIGO = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const LIMITE_BATCH = 400

export function refMiembro(grupoId, jugadorId) {
  return doc(db, 'miembros_grupo', `${grupoId}_${jugadorId}`)
}

export function refSolicitud(grupoId, uid) {
  return doc(db, 'grupos', grupoId, 'solicitudes', uid)
}

function generarCodigo() {
  return Array.from(
    { length: 6 },
    () => CARACTERES_CODIGO[Math.floor(Math.random() * CARACTERES_CODIGO.length)]
  ).join('')
}

async function generarCodigoUnico() {
  for (let intento = 0; intento < 5; intento++) {
    const codigo = generarCodigo()
    const snap = await getDoc(doc(db, 'codigos_invitacion', codigo))
    if (!snap.exists()) return codigo
  }
  throw new Error('No se pudo generar un código de invitación. Intentá de nuevo.')
}

function nombreDesdeCuenta(usuario) {
  return usuario.displayName?.trim() || usuario.email?.split('@')[0] || 'Jugador'
}

// ─── Crear grupo ──────────────────────────────────────────────────────────────

export async function crearGrupo({ nombre, usuario, importarDatosAnteriores = false, jugadorPropioId = null }) {
  const codigo = await generarCodigoUnico()
  const grupoRef = doc(collection(db, 'grupos'))
  const batch = writeBatch(db)

  batch.set(grupoRef, {
    nombre,
    codigo_invitacion: codigo,
    admin_uid: usuario.uid,
    miembros_uids: [usuario.uid],
    creado_en: serverTimestamp(),
  })
  batch.set(doc(db, 'codigos_invitacion', codigo), {
    grupo_id: grupoRef.id,
    grupo_nombre: nombre,
    creado_en: serverTimestamp(),
  })

  // El creador queda como jugador admin del grupo (salvo que elija ser
  // uno de los jugadores importados)
  if (!jugadorPropioId) {
    const jugadorRef = doc(collection(db, 'jugadores'))
    batch.set(jugadorRef, {
      nombre: nombreDesdeCuenta(usuario),
      foto_url: usuario.photoURL ?? '',
      nivel_general: 3,
      posicion_preferida: 'MED',
      activo: true,
      grupo_id: grupoRef.id,
      uid_firebase: usuario.uid,
      creado_en: serverTimestamp(),
    })
    batch.set(refMiembro(grupoRef.id, jugadorRef.id), {
      grupo_id: grupoRef.id,
      jugador_id: jugadorRef.id,
      rol: 'admin',
      unido_en: serverTimestamp(),
    })
  }

  await batch.commit()

  if (importarDatosAnteriores) {
    await importarDatosSinGrupo(grupoRef.id, usuario.uid, jugadorPropioId)
  }
  return grupoRef.id
}

// ─── Unirse con código ────────────────────────────────────────────────────────

// Busca el grupo por código y deja una solicitud pendiente.
// El admin después la vincula a un jugador (existente o nuevo).
export async function unirseAGrupo({ codigo, usuario, gruposYaVinculados = [] }) {
  const codigoLimpio = codigo.toUpperCase().replace(/[^A-Z0-9]/g, '')
  const snapCodigo = await getDoc(doc(db, 'codigos_invitacion', codigoLimpio))
  if (!snapCodigo.exists()) throw new Error('Código de invitación inválido')

  const { grupo_id: grupoId } = snapCodigo.data()
  if (gruposYaVinculados.includes(grupoId)) throw new Error('Ya sos miembro de este grupo')

  const solicitudRef = refSolicitud(grupoId, usuario.uid)
  const snapSolicitud = await getDoc(solicitudRef)
  if (snapSolicitud.exists() && snapSolicitud.data().estado === 'vinculado') {
    throw new Error('Ya sos miembro de este grupo')
  }

  const batch = writeBatch(db)
  batch.set(solicitudRef, {
    uid: usuario.uid,
    email: usuario.email ?? '',
    nombre_display: usuario.displayName ?? '',
    foto_url: usuario.photoURL ?? '',
    codigo: codigoLimpio, // las reglas lo validan contra el código del grupo
    estado: 'pendiente',
    creado_en: serverTimestamp(),
  })
  batch.update(doc(db, 'grupos', grupoId), { miembros_uids: arrayUnion(usuario.uid) })
  await batch.commit()
  return grupoId
}

// ─── Desvincular una cuenta de Google de un jugador ──────────────────────────

// Le quita el acceso al grupo: tendría que volver a unirse con el código.
export function agregarDesvinculacion(batch, grupoId, jugador) {
  if (!jugador.uid_firebase) return
  batch.update(doc(db, 'grupos', grupoId), { miembros_uids: arrayRemove(jugador.uid_firebase) })
  batch.delete(refSolicitud(grupoId, jugador.uid_firebase))
}

// ─── Datos anteriores al soporte multi-grupo ──────────────────────────────────

// Jugadores creados antes de que existieran los grupos (sin grupo_id).
// Una vez publicadas las reglas de seguridad esta lectura falla y
// devolvemos lista vacía: la importación solo sirve antes de publicarlas.
export async function obtenerJugadoresSinGrupo() {
  try {
    const snap = await getDocs(collection(db, 'jugadores'))
    return snap.docs
      .filter((d) => !d.data().grupo_id)
      .map((d) => ({ id: d.id, nombre: d.data().nombre }))
  } catch {
    return []
  }
}

async function importarDatosSinGrupo(grupoId, uid, jugadorPropioId) {
  const [snapJugadores, snapPartidos, snapParticipaciones, snapEquipos] = await Promise.all([
    getDocs(collection(db, 'jugadores')),
    getDocs(collection(db, 'partidos')),
    getDocs(collection(db, 'participaciones')),
    getDocs(collection(db, 'equipo_partido')),
  ])

  // A qué grupo pertenece cada partido una vez terminada la importación
  const grupoDePartido = {}
  snapPartidos.docs.forEach((d) => {
    grupoDePartido[d.id] = d.data().grupo_id ?? grupoId
  })

  const escrituras = []

  snapJugadores.docs
    .filter((d) => !d.data().grupo_id)
    .forEach((d) => {
      const esPropio = d.id === jugadorPropioId
      escrituras.push((b) => b.update(d.ref, {
        grupo_id: grupoId,
        uid_firebase: esPropio ? uid : (d.data().uid_firebase ?? null),
      }))
      escrituras.push((b) => b.set(refMiembro(grupoId, d.id), {
        grupo_id: grupoId,
        jugador_id: d.id,
        rol: esPropio ? 'admin' : 'jugador',
        unido_en: serverTimestamp(),
      }))
    })

  snapPartidos.docs
    .filter((d) => !d.data().grupo_id)
    .forEach((d) => escrituras.push((b) => b.update(d.ref, { grupo_id: grupoId })))

  for (const snap of [snapParticipaciones, snapEquipos]) {
    snap.docs
      .filter((d) => !d.data().grupo_id && grupoDePartido[d.data().partido_id] === grupoId)
      .forEach((d) => escrituras.push((b) => b.update(d.ref, { grupo_id: grupoId })))
  }

  // Firestore limita la cantidad de escrituras por batch
  for (let i = 0; i < escrituras.length; i += LIMITE_BATCH) {
    const batch = writeBatch(db)
    escrituras.slice(i, i + LIMITE_BATCH).forEach((escribir) => escribir(batch))
    await batch.commit()
  }
}
