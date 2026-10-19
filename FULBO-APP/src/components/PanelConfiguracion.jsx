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
    'w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-[#F0F6FC] border-t border-white/[0.08] hover:bg-white/[0.04] transition-colors'

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-50 sm:p-4"
      onClick={onCerrar}
    >
      <div
        className="bg-card border border-white/[0.08] w-full sm:max-w-md rounded-t sm:rounded overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Encabezado */}
        <div className="flex items-start justify-between px-4 pt-4 pb-3">
          <div className="min-w-0">
            <p
              className="text-[#7D8590] uppercase font-semibold"
              style={{ fontSize: '10px', letterSpacing: '0.08em' }}
            >
              Grupo
            </p>
            <h2 className="text-white font-bold text-base truncate">{grupoActivo?.nombre}</h2>
            <p className="text-[#00E676] text-xs mt-0.5">
              {esAdminDelGrupo ? '⚙️ Sos admin' : '👤 Jugador'}
              {jugadorActual && ` · ${jugadorActual.nombre}`}
            </p>
          </div>
          <button
            onClick={onCerrar}
            className="p-1.5 text-[#7D8590] hover:text-[#F0F6FC] transition-colors"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        {/* Código de invitación (solo admin) */}
        {esAdminDelGrupo && codigo && (
          <div className="mx-4 mb-4 bg-dark border border-neon/25 rounded-lg p-3">
            <p
              className="text-[#7D8590] uppercase font-semibold mb-1"
              style={{ fontSize: '10px', letterSpacing: '0.08em' }}
            >
              Código de invitación
            </p>
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-2xl text-[#00E676] tracking-[0.3em] select-all">
                {codigo}
              </span>
              <div className="flex gap-1.5 shrink-0">
                <button
                  onClick={handleCopiar}
                  className="bg-neon text-dark font-bold hover:shadow-[0_0_18px_rgba(0,230,118,0.45)] hover:brightness-110 px-3 py-1.5 uppercase font-semibold"
                  style={{ fontSize: '10px', borderRadius: '8px' }}
                >
                  {copiado ? '✓ Copiado' : 'Copiar'}
                </button>
                {typeof navigator.share === 'function' && (
                  <button
                    onClick={handleCompartir}
                    className="border border-neon/25 text-[#00E676] px-3 py-1.5 uppercase font-semibold"
                    style={{ fontSize: '10px', borderRadius: '8px' }}
                  >
                    Compartir
                  </button>
                )}
              </div>
            </div>
            <div className="mt-3">
              <BotonWhatsApp mensaje={mensajeInvitacion(codigo)} etiqueta="Invitar por WhatsApp" />
            </div>
            <p className="text-[#7D8590] text-xs mt-2">
              Quien entre con este código queda pendiente hasta que lo vincules
              desde <span className="text-[#00E676]">Jugadores</span>.
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
        <button onClick={cerrarSesion} className={`${estiloBoton} text-[#F87171]`}>
          <span>🚪</span>
          <span>
            Cerrar sesión
            <span className="block text-[#7D8590] text-xs">{usuario?.email}</span>
          </span>
        </button>
      </div>
    </div>
  )
}
