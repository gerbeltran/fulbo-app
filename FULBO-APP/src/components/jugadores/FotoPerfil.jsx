import { useRef, useState } from 'react'
import { comprimirFoto } from '../../utils/fotos'
import { guardarFotoJugador } from '../../firebase/fotos'

function AvatarPlaceholder() {
  return (
    <svg viewBox="0 0 40 40" className="w-full h-full" aria-hidden="true">
      <rect width="40" height="40" fill="#E5E7EB" />
      <circle cx="20" cy="16" r="7" fill="#9CA3AF" />
      <path d="M6,40 Q6,26 20,26 Q34,26 34,40 Z" fill="#9CA3AF" />
    </svg>
  )
}

// Foto actual + "Cambiar foto" con vista previa antes de guardar.
// En el celular el selector ofrece sacar una foto con la cámara o elegirla de la galería.
export default function FotoPerfil({ jugador, onCambiada }) {
  const inputRef = useRef(null)
  const [vistaPrevia, setVistaPrevia] = useState(null)
  // null | 'comprimiendo' | 'guardando' | 'ok' | 'error'
  const [estado, setEstado] = useState(null)
  const [mensajeError, setMensajeError] = useState('')
  // Última foto guardada desde acá: el jugador recibido puede ser una copia vieja
  const [fotoGuardada, setFotoGuardada] = useState(undefined)

  const fotoActual = fotoGuardada !== undefined ? fotoGuardada : jugador.foto_url
  const fotoMostrada = vistaPrevia ?? fotoActual

  async function handleArchivo(e) {
    const archivo = e.target.files?.[0]
    e.target.value = '' // permite volver a elegir la misma foto
    if (!archivo) return
    setEstado('comprimiendo')
    try {
      setVistaPrevia(await comprimirFoto(archivo))
      setEstado(null)
    } catch (err) {
      setMensajeError(err.message)
      setEstado('error')
    }
  }

  async function guardar(foto) {
    setEstado('guardando')
    try {
      await guardarFotoJugador(jugador.id, foto)
      setFotoGuardada(foto)
      setVistaPrevia(null)
      setEstado('ok')
      onCambiada?.(foto)
    } catch (err) {
      console.error(err)
      setMensajeError('No se pudo guardar la foto. Intentá de nuevo.')
      setEstado('error')
    }
  }

  const ocupado = estado === 'comprimiendo' || estado === 'guardando'

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className={`w-24 h-24 rounded-full overflow-hidden border-2 ${
          vistaPrevia ? 'border-gold' : 'border-neon/60'
        }`}
        style={{ boxShadow: '0 0 16px rgba(0,230,118,0.25)' }}
      >
        {fotoMostrada ? (
          <img src={fotoMostrada} alt={`Foto de ${jugador.nombre}`} className="w-full h-full object-cover" />
        ) : (
          <AvatarPlaceholder />
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleArchivo}
      />

      {vistaPrevia ? (
        // Vista previa: confirmar o descartar
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => { setVistaPrevia(null); setEstado(null) }}
            disabled={ocupado}
            className="btn-secundario px-4 py-2 text-xs disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => guardar(vistaPrevia)}
            disabled={ocupado}
            className="btn-primario px-4 py-2 text-xs disabled:opacity-50"
          >
            {estado === 'guardando' ? 'Guardando...' : 'Usar esta foto'}
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-1">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={ocupado}
            className="btn-secundario px-4 py-2 text-xs disabled:opacity-50"
          >
            {estado === 'comprimiendo' ? 'Procesando...' : '📷 Cambiar foto'}
          </button>
          {fotoActual && (
            <button
              type="button"
              onClick={() => guardar('')}
              disabled={ocupado}
              className="text-texto-sec hover:text-red-400 text-xs underline disabled:opacity-50"
            >
              Quitar foto
            </button>
          )}
        </div>
      )}

      {/* Progreso y resultado */}
      {ocupado && (
        <div className="w-32 h-1 rounded-full bg-white/[0.08] overflow-hidden">
          <div className={`h-full bg-neon transition-all duration-500 ${estado === 'comprimiendo' ? 'w-1/2' : 'w-11/12'}`} />
        </div>
      )}
      {estado === 'ok' && <p className="text-neon text-xs">✓ Foto actualizada</p>}
      {estado === 'error' && <p className="text-red-400 text-xs text-center">{mensajeError}</p>}
    </div>
  )
}
