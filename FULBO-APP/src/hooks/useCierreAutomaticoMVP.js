import { useEffect, useRef } from 'react'
import { votacionMVPVencida } from '../utils/mvp'

// Revisa cada minuto si pasaron las 24 hs de la votación MVP y, si pasaron,
// llama a cerrar(). Sin backend, el primero que tiene la app abierta después
// de las 24 hs dispara el cierre.
export function useCierreAutomaticoMVP(partido, cerrar) {
  const cerrando = useRef(false)
  // Siempre la última versión de cerrar, sin reiniciar el intervalo en cada render
  const cerrarActual = useRef(cerrar)
  cerrarActual.current = cerrar

  useEffect(() => {
    if (partido?.mvp_estado !== 'abierta') return

    async function verificar() {
      if (cerrando.current || !votacionMVPVencida(partido)) return
      cerrando.current = true
      try {
        await cerrarActual.current()
      } catch (err) {
        // Ej: el reloj del celular adelantado y el servidor todavía no la deja cerrar.
        // Se reintenta en el próximo minuto.
        console.error('No se pudo cerrar la votación MVP', err)
      } finally {
        cerrando.current = false
      }
    }

    verificar()
    const intervalo = setInterval(verificar, 60 * 1000)
    return () => clearInterval(intervalo)
  }, [partido?.id, partido?.mvp_estado, partido?.mvp_abierto_en?.getTime?.()])
}
