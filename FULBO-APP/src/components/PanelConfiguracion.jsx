import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useGrupo } from '../context/GrupoContext'
import BotonWhatsApp from './BotonWhatsApp'
import { mensajeInvitacion } from '../utils/whatsapp'

export default function PanelConfiguracion({ onAbrirPerfil, onCerrar }) {
  const { usuario, cerrarSesion } = useAuth()
  const { grupoActivo, jugadorActual, esAdminDelGrupo, seleccionarGrupo } = useGrupo()
  const [copiado, setCopiado] = useState(false)

  const codigo = grupoActivo?.codigo_invitacion

  async function handleCopiar() {
    try {
      await navigator.clipboard.writeText(codigo)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    } catch {
      // Sin permiso de portapapeles: el código igual queda seleccionable
    }
  }

  async function handleCompartir() {
    try {
      await navigator.share({
        title: 'Fulbo',
        text: `Sumate a "${grupoActivo.nombre}" en Fulbo con el código ${codigo}`,
      })
    } catch {
      // El usuario canceló el diálogo de compartir
    }
  }

  const estiloBoton =
    'w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-[#e0e6f0] border-t border-[#2a3040] hover:bg-[#242b3d] transition-colors'

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-50 sm:p-4"
      onClick={onCerrar}
    >
      <div
        className="bg-[#1e2435] border border-[#2a3040] w-full sm:max-w-md rounded-t sm:rounded overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Encabezado */}
        <div className="flex items-start justify-between px-4 pt-4 pb-3">
          <div className="min-w-0">
            <p
              className="text-[#6b7a8d] uppercase font-semibold"
              style={{ fontSize: '10px', letterSpacing: '0.08em' }}
            >
              Grupo
            </p>
            <h2 className="text-white font-bold text-base truncate">{grupoActivo?.nombre}</h2>
            <p className="text-[#81c784] text-xs mt-0.5">
              {esAdminDelGrupo ? '⚙️ Sos admin' : '👤 Jugador'}
              {jugadorActual && ` · ${jugadorActual.nombre}`}
            </p>
          </div>
          <button
            onClick={onCerrar}
            className="p-1.5 text-[#6b7a8d] hover:text-[#e0e6f0] transition-colors"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        {/* Código de invitación (solo admin) */}
        {esAdminDelGrupo && codigo && (
          <div className="mx-4 mb-4 bg-[#1a1f2e] border border-[#2d5a3d] rounded-lg p-3">
            <p
              className="text-[#6b7a8d] uppercase font-semibold mb-1"
              style={{ fontSize: '10px', letterSpacing: '0.08em' }}
            >
              Código de invitación
            </p>
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-2xl text-[#4caf50] tracking-[0.3em] select-all">
                {codigo}
              </span>
              <div className="flex gap-1.5 shrink-0">
                <button
                  onClick={handleCopiar}
                  className="bg-[#245c33] border border-[#2d7a3d] text-white px-3 py-1.5 uppercase font-semibold"
                  style={{ fontSize: '10px', borderRadius: '3px' }}
                >
                  {copiado ? '✓ Copiado' : 'Copiar'}
                </button>
                {typeof navigator.share === 'function' && (
                  <button
                    onClick={handleCompartir}
                    className="border border-[#2d5a3d] text-[#81c784] px-3 py-1.5 uppercase font-semibold"
                    style={{ fontSize: '10px', borderRadius: '3px' }}
                  >
                    Compartir
                  </button>
                )}
              </div>
            </div>
            <div className="mt-3">
              <BotonWhatsApp mensaje={mensajeInvitacion(codigo)} etiqueta="Invitar por WhatsApp" />
            </div>
            <p className="text-[#6b7a8d] text-xs mt-2">
              Quien entre con este código queda pendiente hasta que lo vincules
              desde <span className="text-[#81c784]">Jugadores</span>.
            </p>
          </div>
        )}

        {/* Acciones */}
        {jugadorActual && (
          <button onClick={onAbrirPerfil} className={estiloBoton}>
            <span>👤</span> Mi perfil
          </button>
        )}
        <button onClick={() => seleccionarGrupo(null)} className={estiloBoton}>
          <span>🔄</span> Cambiar de grupo
        </button>
        <button onClick={cerrarSesion} className={`${estiloBoton} text-[#ef9a9a]`}>
          <span>🚪</span>
          <span>
            Cerrar sesión
            <span className="block text-[#6b7a8d] text-xs">{usuario?.email}</span>
          </span>
        </button>
      </div>
    </div>
  )
}
