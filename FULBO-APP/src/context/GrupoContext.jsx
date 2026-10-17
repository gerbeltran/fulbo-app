import { createContext, useContext, useEffect, useState } from 'react'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase/config'
import {
  crearGrupo as crearGrupoFirebase,
  unirseAGrupo as unirseAGrupoFirebase,
} from '../firebase/grupos'
import { useAuth } from './AuthContext'

const GrupoContext = createContext(null)
const CLAVE_GRUPO = 'fulbo_grupo_activo_id'

function leerGrupoGuardado() {
  try {
    return localStorage.getItem(CLAVE_GRUPO)
  } catch {
    return null
  }
}

function guardarGrupo(id) {
  try {
    if (id) localStorage.setItem(CLAVE_GRUPO, id)
    else localStorage.removeItem(CLAVE_GRUPO)
  } catch {
    // Sin localStorage (modo privado): el grupo no se recuerda, nada más
  }
}

export function GrupoProvider({ children }) {
  const { usuario } = useAuth()
  const [grupos, setGrupos] = useState(null)       // null = todavía cargando
  const [misJugadores, setMisJugadores] = useState(null)
  const [grupoActivoId, setGrupoActivoId] = useState(leerGrupoGuardado)
  const [error, setError] = useState(null)

  // Escuchamos en tiempo real los grupos del usuario y sus perfiles de jugador
  // (uno por grupo). Así, cuando el admin aprueba una solicitud, la app se
  // actualiza sola.
  useEffect(() => {
    setGrupos(null)
    setMisJugadores(null)
    setError(null)
    if (!usuario) return

    function alFallar(err) {
      console.error(err)
      setError('No se pudieron cargar tus grupos.')
      setGrupos((prev) => prev ?? [])
      setMisJugadores((prev) => prev ?? [])
    }

    const unsubGrupos = onSnapshot(
      query(collection(db, 'grupos'), where('miembros_uids', 'array-contains', usuario.uid)),
      (snap) => setGrupos(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      alFallar
    )
    const unsubJugadores = onSnapshot(
      query(collection(db, 'jugadores'), where('uid_firebase', '==', usuario.uid)),
      (snap) => setMisJugadores(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      alFallar
    )
    return () => {
      unsubGrupos()
      unsubJugadores()
    }
  }, [usuario?.uid])

  const cargando = !!usuario && (grupos === null || misJugadores === null)

  // Grupos enriquecidos con el rol y el jugador del usuario en cada uno
  const misGrupos = (grupos ?? [])
    .map((g) => {
      const miJugador = (misJugadores ?? []).find((j) => j.grupo_id === g.id) ?? null
      const esAdmin = g.admin_uid === usuario?.uid
      return {
        ...g,
        mi_jugador: miJugador,
        mi_rol: esAdmin ? 'admin' : 'jugador',
        pendiente: !miJugador && !esAdmin,
      }
    })
    .sort((a, b) => a.nombre.localeCompare(b.nombre))

  const grupoActivo = misGrupos.find((g) => g.id === grupoActivoId) ?? null
  const jugadorActual = grupoActivo?.mi_jugador ?? null
  const esAdminDelGrupo = grupoActivo?.mi_rol === 'admin'

  function seleccionarGrupo(id) {
    setGrupoActivoId(id)
    guardarGrupo(id)
  }

  async function crearGrupo(nombre, opciones = {}) {
    const grupoId = await crearGrupoFirebase({ nombre, usuario, ...opciones })
    seleccionarGrupo(grupoId)
    return grupoId
  }

  async function unirseAGrupo(codigo) {
    const gruposYaVinculados = misGrupos.filter((g) => !g.pendiente).map((g) => g.id)
    const grupoId = await unirseAGrupoFirebase({ codigo, usuario, gruposYaVinculados })
    seleccionarGrupo(grupoId)
    return grupoId
  }

  return (
    <GrupoContext.Provider value={{
      misGrupos, cargando, error,
      grupoActivo, seleccionarGrupo,
      jugadorActual, esAdminDelGrupo,
      crearGrupo, unirseAGrupo,
    }}>
      {children}
    </GrupoContext.Provider>
  )
}

export const useGrupo = () => useContext(GrupoContext)
