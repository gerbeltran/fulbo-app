import { useState, useEffect } from 'react'
import {
  collection, getDocs, updateDoc, doc, query, where,
  serverTimestamp, writeBatch,
} from 'firebase/firestore'
import { db } from '../firebase/config'
import { refMiembro, agregarDesvinculacion } from '../firebase/grupos'

export function useJugadores(grupoId) {
  const [jugadores, setJugadores] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (grupoId) cargarJugadores()
  }, [grupoId])

  async function cargarJugadores() {
    setCargando(true)
    setError(null)
    try {
      // Cada jugador pertenece a un único grupo (campo grupo_id)
      const snap = await getDocs(
        query(collection(db, 'jugadores'), where('grupo_id', '==', grupoId))
      )
      const lista = snap.docs
        .map((d) => ({
          id: d.id,
          ...d.data(),
          creado_en: d.data().creado_en?.toDate?.() ?? new Date(),
        }))
        .sort((a, b) => a.creado_en - b.creado_en)
      setJugadores(lista)
    } catch (err) {
      setError('No se pudieron cargar los jugadores.')
      console.error(err)
    } finally {
      setCargando(false)
    }
  }

  // datos puede traer uid_firebase cuando el jugador nace de una solicitud
  async function agregarJugador(datos) {
    const jugadorRef = doc(collection(db, 'jugadores'))
    const nuevo = {
      ...datos,
      uid_firebase: datos.uid_firebase ?? null,
      grupo_id: grupoId,
    }
    const batch = writeBatch(db)
    batch.set(jugadorRef, { ...nuevo, creado_en: serverTimestamp() })
    batch.set(refMiembro(grupoId, jugadorRef.id), {
      grupo_id: grupoId,
      jugador_id: jugadorRef.id,
      rol: 'jugador',
      unido_en: serverTimestamp(),
    })
    await batch.commit()
    setJugadores((prev) => [...prev, { id: jugadorRef.id, ...nuevo, creado_en: new Date() }])
    return jugadorRef.id
  }

  async function editarJugador(id, cambios) {
    await updateDoc(doc(db, 'jugadores', id), cambios)
    setJugadores((prev) => prev.map((j) => (j.id === id ? { ...j, ...cambios } : j)))
  }

  // Le quita a la cuenta de Google el acceso al grupo; el jugador y sus stats quedan
  async function desvincularCuenta(id) {
    const jugador = jugadores.find((j) => j.id === id)
    if (!jugador?.uid_firebase) return
    const batch = writeBatch(db)
    batch.update(doc(db, 'jugadores', id), { uid_firebase: null })
    agregarDesvinculacion(batch, grupoId, jugador)
    await batch.commit()
    setJugadores((prev) => prev.map((j) => (j.id === id ? { ...j, uid_firebase: null } : j)))
  }

  async function eliminarJugador(id) {
    const jugador = jugadores.find((j) => j.id === id)
    const batch = writeBatch(db)
    batch.delete(doc(db, 'jugadores', id))
    batch.delete(refMiembro(grupoId, id))
    if (jugador) agregarDesvinculacion(batch, grupoId, jugador)
    await batch.commit()
    setJugadores((prev) => prev.filter((j) => j.id !== id))
  }

  async function toggleActivo(id) {
    const jugador = jugadores.find((j) => j.id === id)
    if (!jugador) return
    const nuevoActivo = !jugador.activo
    await updateDoc(doc(db, 'jugadores', id), { activo: nuevoActivo })
    setJugadores((prev) =>
      prev.map((j) => (j.id === id ? { ...j, activo: nuevoActivo } : j))
    )
  }

  return {
    jugadores,
    cargando,
    error,
    cargarJugadores,
    agregarJugador,
    editarJugador,
    desvincularCuenta,
    eliminarJugador,
    toggleActivo,
  }
}
