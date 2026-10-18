import { createContext, useContext, useEffect, useState } from 'react'
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase/config'
import { MAXIMO_NOTIFICACIONES, DESTINO_POR_TIPO, marcarLeidas } from '../firebase/notificaciones'
import { useAuth } from './AuthContext'
import { useGrupo } from './GrupoContext'

const NotificacionesContext = createContext(null)

function convertir(d) {
  // 'estimate' evita creada_en = null mientras la escritura local no llegó al servidor
  const datos = d.data({ serverTimestamps: 'estimate' })
  return { id: d.id, ...datos, creada_en: datos.creada_en?.toDate?.() ?? new Date() }
}

export function NotificacionesProvider({ children }) {
  const { usuario } = useAuth()
  const { misGrupos, grupoActivo, seleccionarGrupo } = useGrupo()
  // Notificaciones agrupadas por origen: 'personales' y una entrada por grupo
  const [porOrigen, setPorOrigen] = useState({})
  // Sección a la que hay que ir después de tocar una notificación
  const [destino, setDestino] = useState(null)

  // Solo escuchamos las notificaciones generales de los grupos donde ya fui aprobado
  const gruposAprobados = misGrupos.filter((g) => !g.pendiente).map((g) => g.id).sort()
  const claveGrupos = gruposAprobados.join(',')

  useEffect(() => {
    setPorOrigen({})
    if (!usuario) return

    function escuchar(origen, consulta) {
      return onSnapshot(
        consulta,
        (snap) => setPorOrigen((prev) => ({ ...prev, [origen]: snap.docs.map(convertir) })),
        (err) => console.error('Error escuchando notificaciones', origen, err)
      )
    }

    const col = collection(db, 'notificaciones')
    const desuscribir = [
      // Dirigidas a mí (de cualquier grupo, incluso si me rechazaron)
      escuchar('personales', query(
        col,
        where('destinatario_uid', '==', usuario.uid),
        orderBy('creada_en', 'desc'),
        limit(MAXIMO_NOTIFICACIONES)
      )),
      // Para todos los miembros de cada grupo
      ...gruposAprobados.map((grupoId) => escuchar(grupoId, query(
        col,
        where('grupo_id', '==', grupoId),
        where('destinatario_uid', '==', null),
        orderBy('creada_en', 'desc'),
        limit(MAXIMO_NOTIFICACIONES)
      ))),
    ]
    return () => desuscribir.forEach((unsub) => unsub())
  }, [usuario?.uid, claveGrupos])

  const notificaciones = Object.values(porOrigen)
    .flat()
    .filter((n) => n.autor_uid !== usuario?.uid || n.destinatario_uid === usuario?.uid)
    .sort((a, b) => b.creada_en - a.creada_en)
    .slice(0, MAXIMO_NOTIFICACIONES)
    .map((n) => ({ ...n, leida: (n.leida_por ?? []).includes(usuario?.uid) }))

  const noLeidas = notificaciones.filter((n) => !n.leida)

  async function marcarTodasLeidas() {
    try {
      await marcarLeidas(noLeidas.map((n) => n.id), usuario.uid)
    } catch (err) {
      console.error('No se pudieron marcar como leídas', err)
    }
  }

  function abrirNotificacion(notificacion) {
    const seccion = DESTINO_POR_TIPO[notificacion.tipo]
    if (!seccion) return
    const grupo = misGrupos.find((g) => g.id === notificacion.grupo_id)
    if (!grupo) return // ya no pertenezco a ese grupo
    if (grupoActivo?.id !== grupo.id) seleccionarGrupo(grupo.id)
    setDestino(seccion)
  }

  // La app llama a esto cuando ya navegó a la sección
  function limpiarDestino() {
    setDestino(null)
  }

  return (
    <NotificacionesContext.Provider value={{
      notificaciones,
      cantidadNoLeidas: noLeidas.length,
      marcarTodasLeidas,
      abrirNotificacion,
      destino,
      limpiarDestino,
    }}>
      {children}
    </NotificacionesContext.Provider>
  )
}

export const useNotificaciones = () => useContext(NotificacionesContext)
