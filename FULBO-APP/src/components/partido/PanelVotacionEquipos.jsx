import CanichaFutbol from './CanichaFutbol'

export default function PanelVotacionEquipos({
  estado,             // 'votando' | 'confirmado'
  equipo,             // combinación a mostrar { equipo1, equipo2, diferencia }
  combinacionActual,  // índice 0-7
  totalCombinaciones,
  votosActuales,      // { aprobaron, rechazaron, total }
  porcentajeAprobacion,
  puedeVotar,
  miVoto,
  esAdmin,
  participaciones,    // array completo para indicadores de voto
  onVotar,
  onForzar,
  onAvanzar,
}) {
  if (!equipo) {
    return (
      <div className="text-center py-10 text-[#6b7a8d]">
        <div className="text-4xl mb-2">⚽</div>
        <p className="text-sm">Generando equipos...</p>
      </div>
    )
  }

  const niv1 = equipo.equipo1.reduce((s, j) => s + (j.nivel_general ?? 0), 0)
  const niv2 = equipo.equipo2.reduce((s, j) => s + (j.nivel_general ?? 0), 0)
  const estaConfirmado = estado === 'confirmado'

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        {estaConfirmado ? (
          <div className="flex items-center gap-2">
            <span className="text-lg">✅</span>
            <h3 className="font-bold text-[#e0e6f0]">Equipos confirmados</h3>
          </div>
        ) : (
          <div>
            <h3 className="font-bold text-[#e0e6f0]">Propuesta de equipos</h3>
            <p className="text-xs text-[#6b7a8d] mt-0.5">
              Combinación {combinacionActual + 1} de {totalCombinaciones}
            </p>
          </div>
        )}
        <span
          className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${
            equipo.diferencia === 0
              ? 'bg-[#1b3d22] text-[#4caf50]'
              : 'bg-[#242b3d] text-[#8892a4]'
          }`}
        >
          Dif. {equipo.diferencia} pts
        </span>
      </div>

      {/* Leyenda de equipos (en la cancha: Equipo 2 arriba, Equipo 1 abajo) */}
      <div className="flex justify-between items-center text-xs font-semibold px-0.5">
        <span className="flex items-center gap-1.5 text-[#60a5fa]">
          <span className="w-2.5 h-2.5 rounded-full bg-[#3B82F6] inline-block shrink-0" />
          Equipo 1 (abajo) — {niv1} pts
        </span>
        <span className="flex items-center gap-1.5 text-[#f87171]">
          Equipo 2 (arriba) — {niv2} pts
          <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444] inline-block shrink-0" />
        </span>
      </div>

      {/* Cancha */}
      <CanichaFutbol
        equipo1={equipo.equipo1}
        equipo2={equipo.equipo2}
        participaciones={participaciones}
        combinacionActual={estaConfirmado ? null : combinacionActual}
        mostrarVotos={!estaConfirmado}
      />

      {/* Leyenda de voto (solo en estado votando) */}
      {!estaConfirmado && (
        <p className="text-xs text-[#6b7a8d] text-center">
          ✓ votó · ○ pendiente
        </p>
      )}

      {/* Sección de votación */}
      {!estaConfirmado && (
        <div className="bg-[#1e2435] rounded-xl border border-[#2a3040] p-3 space-y-3">
          {/* Barra de progreso */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-[#8892a4]">
                {votosActuales.aprobaron} de {votosActuales.total} aprueban
              </span>
              <span
                className={`font-bold ${
                  porcentajeAprobacion >= 80 ? 'text-[#4caf50]' : 'text-[#8892a4]'
                }`}
              >
                {porcentajeAprobacion}%
              </span>
            </div>
            <div className="relative w-full bg-[#2a3040] rounded-full h-3 overflow-visible">
              <div
                className={`h-3 rounded-full transition-all duration-500 ${
                  porcentajeAprobacion >= 80 ? 'bg-[#4caf50]' : 'bg-[#f59e0b]'
                }`}
                style={{ width: `${Math.min(porcentajeAprobacion, 100)}%` }}
              />
              {/* Marcador del 80% */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-[#6b7a8d] opacity-60"
                style={{ left: '80%' }}
              />
            </div>
            <p className="text-xs text-[#6b7a8d] mt-1">
              Se necesita el 80% para confirmar estos equipos
            </p>
          </div>

          {/* Botones de voto */}
          {puedeVotar ? (
            <div>
              <p className="text-xs font-semibold text-[#6b7a8d] uppercase tracking-wide mb-2">
                Tu voto para esta combinación:
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => onVotar(true)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                    miVoto === true
                      ? 'bg-[#245c33] border border-[#2d7a3d] text-white'
                      : 'bg-[#242b3d] text-[#8892a4] hover:bg-[#1b3d22] hover:text-[#4caf50]'
                  }`}
                >
                  👍 Aprobar
                </button>
                <button
                  onClick={() => onVotar(false)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                    miVoto === false
                      ? 'bg-[#5c2424] border border-[#7a2d2d] text-white'
                      : 'bg-[#242b3d] text-[#8892a4] hover:bg-[#3d1a1a] hover:text-[#ef9a9a]'
                  }`}
                >
                  👎 Rechazar
                </button>
              </div>
            </div>
          ) : (
            <p className="text-xs text-[#6b7a8d] italic">
              Solo pueden votar los jugadores que confirmaron asistencia.
            </p>
          )}

          {/* Botones admin */}
          {esAdmin && (
            <div className="border-t border-[#2a3040] pt-3 space-y-2">
              <p className="text-xs font-semibold text-[#f59e0b] uppercase tracking-wide">
                Acciones admin
              </p>
              <div className="flex gap-2">
                <button
                  onClick={onAvanzar}
                  className="flex-1 py-2 border border-[#2a3040] text-[#8892a4] rounded-xl text-xs font-semibold hover:bg-[#242b3d] transition-colors"
                >
                  Siguiente →
                </button>
                <button
                  onClick={onForzar}
                  className="flex-1 py-2 bg-[#5c3a00] border border-[#7a5000] text-[#fb923c] rounded-xl text-xs font-semibold hover:bg-[#7a5000] transition-colors"
                >
                  🔧 Forzar esta
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
