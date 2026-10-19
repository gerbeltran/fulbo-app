import { useState } from 'react'

// El admin decide a qué jugador corresponde una cuenta de Google que pidió
// entrar al grupo: uno que ya existe (conserva sus stats) o uno nuevo.
export default function ModalVincularSolicitud({
  solicitud,
  jugadoresSinCuenta,
  procesando,
  onVincular,
  onCrearNuevo,
  onRechazar,
  onCancelar,
}) {
  const [jugadorId, setJugadorId] = useState('')
  const [confirmandoRechazo, setConfirmandoRechazo] = useState(false)

  return (
    <div className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-50 sm:p-4">
      <div className="bg-card border border-white/[0.08] w-full sm:max-w-md rounded-t sm:rounded p-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2
            className="font-bold text-[#F0F6FC] uppercase tracking-wider"
            style={{ fontSize: '13px' }}
          >
            Vincular cuenta
          </h2>
          <button
            onClick={onCancelar}
            className="p-1.5 text-[#7D8590] hover:text-[#F0F6FC] transition-colors"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        <div className="bg-dark border border-white/[0.08] p-3 mb-4" style={{ borderRadius: '8px' }}>
          <p className="text-[#F0F6FC] text-sm font-medium">
            {solicitud.nombre_display || 'Sin nombre'}
          </p>
          <p className="text-[#7D8590] text-xs">{solicitud.email}</p>
        </div>

        {jugadoresSinCuenta.length > 0 && (
          <div className="mb-4">
            <p
              className="text-[#8B949E] mb-2 uppercase font-semibold"
              style={{ fontSize: '10px', letterSpacing: '0.07em' }}
            >
              Es uno de estos jugadores
            </p>
            <div className="border border-white/[0.08] max-h-56 overflow-y-auto" style={{ borderRadius: '8px' }}>
              {jugadoresSinCuenta.map((j) => (
                <label
                  key={j.id}
                  className={`flex items-center gap-3 px-3 py-2.5 border-b border-white/[0.05] last:border-b-0 cursor-pointer text-sm ${
                    jugadorId === j.id ? 'bg-neon/10 text-[#00E676]' : 'text-[#F0F6FC]'
                  }`}
                >
                  <input
                    type="radio"
                    name="jugador"
                    checked={jugadorId === j.id}
                    onChange={() => setJugadorId(j.id)}
                    className="accent-[#00E676]"
                  />
                  {j.nombre}
                </label>
              ))}
            </div>
            <button
              onClick={() => onVincular(jugadorId)}
              disabled={!jugadorId || procesando}
              className="w-full mt-2 py-2.5 bg-neon text-dark font-bold hover:shadow-[0_0_18px_rgba(0,230,118,0.45)] hover:brightness-110 font-semibold uppercase disabled:opacity-50 transition-colors"
              style={{ fontSize: '11px', borderRadius: '8px' }}
            >
              {procesando ? 'Vinculando...' : 'Vincular'}
            </button>
          </div>
        )}

        <button
          onClick={onCrearNuevo}
          disabled={procesando}
          className="w-full py-2.5 border border-neon/25 text-[#00E676] font-semibold uppercase disabled:opacity-50 transition-colors hover:border-[#00E676]"
          style={{ fontSize: '11px', borderRadius: '8px' }}
        >
          + Crear jugador nuevo
        </button>

        <div className="mt-4 pt-4 border-t border-white/[0.08]">
          {confirmandoRechazo ? (
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmandoRechazo(false)}
                className="flex-1 py-2 border border-white/[0.08] text-[#8B949E] font-semibold uppercase"
                style={{ fontSize: '10px', borderRadius: '8px' }}
              >
                No
              </button>
              <button
                onClick={onRechazar}
                disabled={procesando}
                className="flex-1 py-2 bg-red-500/20 border border-red-500/50 text-white font-semibold uppercase disabled:opacity-50"
                style={{ fontSize: '10px', borderRadius: '8px' }}
              >
                Sí, rechazar
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmandoRechazo(true)}
              className="w-full text-[#F87171] text-xs hover:underline"
            >
              Rechazar solicitud
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
