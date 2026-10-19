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
      <div className="text-center py-10 text-[#7D8590]">
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
            <h3 className="font-bold text-[#F0F6FC]">Equipos confirmados</h3>
          </div>
        ) : (
          <div>
            <h3 className="font-bold text-[#F0F6FC]">Propuesta de equipos</h3>
            <p className="text-xs text-[#7D8590] mt-0.5">
              Combinación {combinacionActual + 1} de {totalCombinaciones}
            </p>
          </div>
        )}
        <span
          className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${
            equipo.diferencia === 0
              ? 'bg-neon/10 text-[#00E676]'
              : 'bg-white/[0.04] text-[#8B949E]'
          }`}
        >
          Dif. {equipo.diferencia} pts
        </span>
      </div>

      {/* Leyenda de equipos (en la cancha: Equipo 1 adelante, Equipo 2 al fondo) */}
      <div className="flex justify-between items-center text-xs font-semibold px-0.5">
        <span className="flex items-center gap-1.5 text-[#60a5fa]">
          <span className="w-2.5 h-2.5 rounded-full bg-[#3B82F6] inline-block shrink-0" />
          Equipo 1 — {niv1} pts
        </span>
        <span className="flex items-center gap-1.5 text-[#f87171]">
          Equipo 2 — {niv2} pts
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
        <p className="text-xs text-[#7D8590] text-center">
          ✓ votó · ○ pendiente
        </p>
      )}

      {/* Sección de votación */}
      {!estaConfirmado && (
        <div className="bg-card rounded-xl border border-white/[0.08] p-3 space-y-3">
          {/* Barra de progreso */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-[#8B949E]">
                {votosActuales.aprobaron} de {votosActuales.total} aprueban
              </span>
              <span
                className={`font-bold ${
                  porcentajeAprobacion >= 80 ? 'text-[#00E676]' : 'text-[#8B949E]'
                }`}
              >
                {porcentajeAprobacion}%
              </span>
            </div>
            <div className="relative w-full bg-white/[0.08] rounded-full h-3 overflow-visible">
              <div
                className={`h-3 rounded-full transition-all duration-500 ${
                  porcentajeAprobacion >= 80 ? 'bg-[#00E676]' : 'bg-[#f59e0b]'
                }`}
                style={{ width: `${Math.min(porcentajeAprobacion, 100)}%` }}
              />
              {/* Marcador del 80% */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-[#7D8590] opacity-60"
                style={{ left: '80%' }}
              />
            </div>
            <p className="text-xs text-[#7D8590] mt-1">
              Se necesita el 80% para confirmar estos equipos
            </p>
          </div>

          {/* Botones de voto */}
          {puedeVotar ? (
            <div>
              <p className="text-xs font-semibold text-[#7D8590] uppercase tracking-wide mb-2">
                Tu voto para esta combinación:
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => onVotar(true)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
 miVoto === true
 ? 'bg-neon text-dark font-bold hover:shadow-[0_0_18px_rgba(0,230,118,0.45)] hover:brightness-110 '
 : 'bg-white/[0.04] text-[#8B949E] hover:bg-neon/10 hover:text-[#00E676]'
 }`}
                >
                  👍 Aprobar
                </button>
                <button
                  onClick={() => onVotar(false)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                    miVoto === false
                      ? 'bg-red-500/20 border border-red-500/50 text-white'
                      : 'bg-white/[0.04] text-[#8B949E] hover:bg-red-500/10 hover:text-[#F87171]'
                  }`}
                >
                  👎 Rechazar
                </button>
              </div>
            </div>
          ) : (
            <p className="text-xs text-[#7D8590] italic">
              Solo pueden votar los jugadores que confirmaron asistencia.
            </p>
          )}

          {/* Botones admin */}
          {esAdmin && (
            <div className="border-t border-white/[0.08] pt-3 space-y-2">
              <p className="text-xs font-semibold text-[#f59e0b] uppercase tracking-wide">
                Acciones admin
              </p>
              <div className="flex gap-2">
                <button
                  onClick={onAvanzar}
                  className="flex-1 py-2 border border-white/[0.08] text-[#8B949E] rounded-xl text-xs font-semibold hover:bg-white/[0.04] transition-colors"
                >
                  Siguiente →
                </button>
                <button
                  onClick={onForzar}
                  className="flex-1 py-2 bg-gold/15 border border-gold/40 text-[#F59E0B] rounded-xl text-xs font-semibold hover:bg-gold/25 transition-colors"
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
