import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useNotificaciones } from '../context/NotificacionesContext'
import { ICONO_POR_TIPO, DESTINO_POR_TIPO } from '../firebase/notificaciones'

function hace(fecha) {
  const minutos = Math.floor((Date.now() - fecha.getTime()) / 60000)
  if (minutos < 1) return 'recién'
  if (minutos < 60) return `hace ${minutos} min`
  const horas = Math.floor(minutos / 60)
  if (horas < 24) return `hace ${horas} h`
  const dias = Math.floor(horas / 24)
  if (dias < 7) return `hace ${dias} d`
  return fecha.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })
}

export default function CampanaNotificaciones() {
  const {
    notificaciones, cantidadNoLeidas, marcarTodasLeidas, abrirNotificacion,
  } = useNotificaciones()
  const [abierto, setAbierto] = useState(false)
  // Las que estaban sin leer al abrir el panel siguen resaltadas mientras está abierto
  const [resaltadas, setResaltadas] = useState([])

  function handleAbrir() {
    setResaltadas(notificaciones.filter((n) => !n.leida).map((n) => n.id))
    setAbierto(true)
    marcarTodasLeidas()
  }

  function handleTocar(notificacion) {
    setAbierto(false)
    abrirNotificacion(notificacion)
  }

  // Si el usuario está en más de un grupo, mostramos de cuál es cada una
  const variosGrupos = new Set(notificaciones.map((n) => n.grupo_id)).size > 1

  return (
    <>
      <button
        onClick={handleAbrir}
        className="relative text-[#6b7a8d] border border-[#2d5a3d] px-2 py-1.5 text-xs rounded hover:text-[#4caf50] hover:border-[#4caf50] transition-colors"
        aria-label={
          cantidadNoLeidas > 0
            ? `Notificaciones: ${cantidadNoLeidas} sin leer`
            : 'Notificaciones'
        }
      >
        🔔
        {cantidadNoLeidas > 0 && (
          <span
            className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 bg-[#e53935] text-white font-bold rounded-full flex items-center justify-center"
            style={{ fontSize: '9px' }}
          >
            {cantidadNoLeidas > 9 ? '9+' : cantidadNoLeidas}
          </span>
        )}
      </button>

      {/* Portal: el header es fixed con z-index propio y taparía el panel */}
      {abierto && createPortal(
        <div
          className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-50 sm:p-4"
          onClick={() => setAbierto(false)}
        >
          <div
            className="bg-[#1e2435] border border-[#2a3040] w-full sm:max-w-md rounded-t sm:rounded max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#2a3040]">
              <h2
                className="font-bold text-[#e0e6f0] uppercase tracking-wider"
                style={{ fontSize: '13px' }}
              >
                Notificaciones
              </h2>
              <button
                onClick={() => setAbierto(false)}
                className="p-1.5 text-[#6b7a8d] hover:text-[#e0e6f0] transition-colors"
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto">
              {notificaciones.length === 0 ? (
                <div className="text-center py-12 text-[#6b7a8d]">
                  <div className="text-4xl mb-2">🔕</div>
                  <p className="text-sm">No tenés notificaciones</p>
                </div>
              ) : (
                notificaciones.map((n) => {
                  const navegable = !!DESTINO_POR_TIPO[n.tipo]
                  const resaltada = resaltadas.includes(n.id)
                  return (
                    <button
                      key={n.id}
                      onClick={() => handleTocar(n)}
                      disabled={!navegable}
                      className={`w-full text-left px-4 py-3 flex gap-3 border-b border-[#242b3d] transition-colors ${
                        resaltada ? 'bg-[#1b3d22]/40' : ''
                      } ${navegable ? 'hover:bg-[#242b3d]' : 'cursor-default'}`}
                    >
                      <span className="text-lg shrink-0">{ICONO_POR_TIPO[n.tipo] ?? '🔔'}</span>
                      <span className="flex-1 min-w-0">
                        <span className="block text-sm text-[#e0e6f0]">{n.mensaje}</span>
                        <span className="block text-[#6b7a8d] mt-0.5" style={{ fontSize: '11px' }}>
                          {hace(n.creada_en)}
                          {variosGrupos && n.datos_extra?.grupo_nombre && ` · ${n.datos_extra.grupo_nombre}`}
                        </span>
                      </span>
                      {resaltada && (
                        <span className="w-2 h-2 rounded-full bg-[#e53935] shrink-0 mt-1.5" aria-label="Nueva" />
                      )}
                    </button>
                  )
                })
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
