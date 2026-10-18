import { useState, useEffect } from 'react'
import { obtenerNoticias, leerCache } from '../utils/noticias'

// Noticias del club. Muestra al instante las últimas guardadas; si tienen
// más de 30 minutos las actualiza (el plan gratuito de GNews tiene pocas
// consultas por día). Si la consulta falla, quedan las guardadas.
export function useNoticias(club) {
  const [noticias, setNoticias] = useState([])
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState(null)
  // Fecha de las noticias guardadas que se están mostrando (null = recién descargadas)
  const [desdeCache, setDesdeCache] = useState(null)

  useEffect(() => {
    if (!club) return
    const cache = leerCache(club)
    setNoticias(cache?.noticias ?? [])
    setDesdeCache(cache?.guardadasEn ?? null)
    setError(null)
    if (!cache?.vigente) cargar()
  }, [club])

  async function cargar() {
    if (!club) return
    setCargando(true)
    setError(null)
    try {
      setNoticias(await obtenerNoticias(club))
      setDesdeCache(null)
    } catch (err) {
      console.error('Noticias:', err.message)
      setError('No pudimos cargar las noticias. Intentá de nuevo más tarde.')
    } finally {
      setCargando(false)
    }
  }

  return { noticias, cargando, error, desdeCache, cargar }
}
