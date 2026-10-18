import { useState, useEffect } from 'react'
import {
  collection, query, where, getDocs, onSnapshot,
  doc, writeBatch, arrayRemove,
} from 'firebase/firestore'
import { db } from '../firebase/config'
import { refSolicitud } from '../firebase/grupos'
import { notificar, mensajes } from '../firebase/notificaciones'
import { useAuth } from '../context/AuthContext'
import { useGrupo } from '../context/GrupoContext'

// Solicitudes de ingreso al grupo de cuentas de Google sin jugador vinculado
export function useSolicitudes(grupoId) {
  const [solicitudes, setSolicitudes] = useState([])
  const [cargando, setCargando] = useState(true)
  const { usuario } = useAuth()
  const { grupoActivo } = useGrupo()
  const grupoNombre = grupoActivo?.nombre ?? ''

  function avisar(solicitud, tipo, mensaje, jugadorId = null) {
    return notificar({
      grupoId,
      grupoNombre,
      tipo,
      mensaje,
      autorUid: usuario.uid,
      destinatarioUid: solicitud.uid,
      jugadorId,
    })
  }

  useEffect(() => {
    if (!grupoId) return
    const unsub = onSnapshot(
      query(
        collection(db, 'grupos', grupoId, 'solicitudes'),
        where('estado', '==', 'pendiente')
      ),
      (snap) => {
        setSolicitudes(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
        setCargando(false)
      },
      (err) => {
        console.error(err)
        setCargando(false)
      }
    )
    return unsub
  }, [grupoId])

  // uid_firebase es único dentro del grupo
  async function verificarCuentaLibre(uid) {
    const snap = await getDocs(
      query(
        collection(db, 'jugadores'),
        where('grupo_id', '==', grupoId),
        where('uid_firebase', '==', uid)
      )
    )
    if (!snap.empty) {
      throw new Error(`Esa cuenta ya está vinculada a ${snap.docs[0].data().nombre}.`)
    }
  }

  // Vincula la cuenta a un jugador que ya existe en el grupo
  async function vincularSolicitud(solicitud, jugadorId) {
    await verificarCuentaLibre(solicitud.uid)
    const batch = writeBatch(db)
    batch.update(doc(db, 'jugadores', jugadorId), { uid_firebase: solicitud.uid })
    batch.update(refSolicitud(grupoId, solicitud.uid), { estado: 'vinculado' })
    await batch.commit()
    await avisar(solicitud, 'solicitud_aprobada', mensajes.solicitudAprobada(grupoNombre), jugadorId)
  }

  // Para cuando el jugador se crea desde cero: se llama después de agregarJugador
  async function marcarVinculada(solicitud, jugadorId) {
    const batch = writeBatch(db)
    batch.update(refSolicitud(grupoId, solicitud.uid), { estado: 'vinculado' })
    await batch.commit()
    await avisar(solicitud, 'solicitud_aprobada', mensajes.solicitudAprobada(grupoNombre), jugadorId)
  }

  async function rechazarSolicitud(solicitud) {
    const batch = writeBatch(db)
    batch.delete(refSolicitud(grupoId, solicitud.uid))
    batch.update(doc(db, 'grupos', grupoId), { miembros_uids: arrayRemove(solicitud.uid) })
    await batch.commit()
    await avisar(solicitud, 'solicitud_rechazada', mensajes.solicitudRechazada(grupoNombre))
  }

  return {
    solicitudes,
    cargando,
    verificarCuentaLibre,
    vincularSolicitud,
    marcarVinculada,
    rechazarSolicitud,
  }
}
