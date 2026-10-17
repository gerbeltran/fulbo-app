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
      <div className="bg-[#1e2435] border border-[#2a3040] w-full sm:max-w-md rounded-t sm:rounded p-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2
            className="font-bold text-[#e0e6f0] uppercase tracking-wider"
            style={{ fontSize: '13px' }}
          >
            Vincular cuenta
          </h2>
          <button
            onClick={onCancelar}
            className="p-1.5 text-[#6b7a8d] hover:text-[#e0e6f0] transition-colors"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        <div className="bg-[#1a1f2e] border border-[#2a3040] p-3 mb-4" style={{ borderRadius: '3px' }}>
          <p className="text-[#e0e6f0] text-sm font-medium">
            {solicitud.nombre_display || 'Sin nombre'}
          </p>
          <p className="text-[#6b7a8d] text-xs">{solicitud.email}</p>
        </div>

        {jugadoresSinCuenta.length > 0 && (
          <div className="mb-4">
            <p
              className="text-[#8892a4] mb-2 uppercase font-semibold"
              style={{ fontSize: '10px', letterSpacing: '0.07em' }}
            >
              Es uno de estos jugadores
            </p>
            <div className="border border-[#2a3040] max-h-56 overflow-y-auto" style={{ borderRadius: '3px' }}>
              {jugadoresSinCuenta.map((j) => (
                <label
                  key={j.id}
                  className={`flex items-center gap-3 px-3 py-2.5 border-b border-[#242b3d] last:border-b-0 cursor-pointer text-sm ${
                    jugadorId === j.id ? 'bg-[#1b3d22] text-[#4caf50]' : 'text-[#e0e6f0]'
                  }`}
                >
                  <input
                    type="radio"
                    name="jugador"
                    checked={jugadorId === j.id}
                    onChange={() => setJugadorId(j.id)}
                    className="accent-[#4caf50]"
                  />
                  {j.nombre}
                </label>
              ))}
            </div>
            <button
              onClick={() => onVincular(jugadorId)}
              disabled={!jugadorId || procesando}
              className="w-full mt-2 py-2.5 bg-[#245c33] border border-[#2d7a3d] text-white font-semibold uppercase disabled:opacity-50 transition-colors"
              style={{ fontSize: '11px', borderRadius: '3px' }}
            >
              {procesando ? 'Vinculando...' : 'Vincular'}
            </button>
          </div>
        )}

        <button
          onClick={onCrearNuevo}
          disabled={procesando}
          className="w-full py-2.5 border border-[#2d5a3d] text-[#81c784] font-semibold uppercase disabled:opacity-50 transition-colors hover:border-[#4caf50]"
          style={{ fontSize: '11px', borderRadius: '3px' }}
        >
          + Crear jugador nuevo
        </button>

        <div className="mt-4 pt-4 border-t border-[#2a3040]">
          {confirmandoRechazo ? (
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmandoRechazo(false)}
                className="flex-1 py-2 border border-[#2a3040] text-[#8892a4] font-semibold uppercase"
                style={{ fontSize: '10px', borderRadius: '3px' }}
              >
                No
              </button>
              <button
                onClick={onRechazar}
                disabled={procesando}
                className="flex-1 py-2 bg-[#5c2424] border border-[#7a2d2d] text-white font-semibold uppercase disabled:opacity-50"
                style={{ fontSize: '10px', borderRadius: '3px' }}
              >
                Sí, rechazar
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmandoRechazo(true)}
              className="w-full text-[#ef9a9a] text-xs hover:underline"
            >
              Rechazar solicitud
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
