export default function PanelAprobacion({
  participaciones,
  jugadorActualId,
  porcentajeAprobacion,
  puedeGenerarEquipos,
  generando,
  onVotar,
  onGenerar,
}) {
  const miParticipacion = participaciones.find(
    (p) => p.jugador_id === jugadorActualId
  )
  const puedeVotar = miParticipacion?.confirmo_asistencia === true
  const miVoto = miParticipacion?.aprueba_equipos

  const totalConfirmados = participaciones.filter(
    (p) => p.confirmo_asistencia === true
  ).length
  const totalAprobaron = participaciones.filter(
    (p) => p.confirmo_asistencia === true && p.aprueba_equipos === true
  ).length

  return (
    <div className="bg-card rounded-xl border border-white/[0.08] p-4 space-y-4">
      <h3 className="font-semibold text-[#F0F6FC]">Aprobación de equipos</h3>

      {/* Barra de progreso */}
      <div>
        <div className="flex justify-between text-sm mb-2">
          <span className="text-[#8B949E]">
            {totalAprobaron} de {totalConfirmados} aprueban
          </span>
          <span
            className={`font-bold ${
              porcentajeAprobacion >= 80 ? 'text-[#00E676]' : 'text-[#8B949E]'
            }`}
          >
            {porcentajeAprobacion}%
          </span>
        </div>
        <div className="w-full bg-white/[0.08] rounded-full h-3 overflow-hidden">
          <div
            className={`h-3 rounded-full transition-all duration-500 ${
              porcentajeAprobacion >= 80 ? 'bg-[#00E676]' : 'bg-[#f59e0b]'
            }`}
            style={{ width: `${porcentajeAprobacion}%` }}
          />
        </div>
        {/* Marcador del 80% */}
        <div className="relative">
          <div
            className="absolute top-0 w-0.5 h-2 bg-[#7D8590]"
            style={{ left: '80%', transform: 'translateX(-50%)' }}
          />
          <div
            className="absolute text-xs text-[#7D8590] mt-1"
            style={{ left: '80%', transform: 'translateX(-50%)' }}
          >
            80%
          </div>
        </div>
        <div className="h-4" />
      </div>

      {/* Botones de voto */}
      {puedeVotar ? (
        <div>
          <p className="text-sm text-[#8B949E] mb-2">Tu voto:</p>
          <div className="flex gap-2">
            <button
              onClick={() => onVotar(jugadorActualId, true)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
 miVoto === true
 ? 'bg-neon text-dark font-bold hover:shadow-[0_0_18px_rgba(0,230,118,0.45)] hover:brightness-110 '
 : 'bg-white/[0.04] text-[#8B949E] hover:bg-neon/10 hover:text-[#00E676]'
 }`}
            >
              👍 Apruebo
            </button>
            <button
              onClick={() => onVotar(jugadorActualId, false)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                miVoto === false
                  ? 'bg-red-500/20 border border-red-500/50 text-white'
                  : 'bg-white/[0.04] text-[#8B949E] hover:bg-red-500/10 hover:text-[#F87171]'
              }`}
            >
              👎 No apruebo
            </button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-[#7D8590] italic">
          Solo votan los jugadores que confirmaron asistencia.
        </p>
      )}

      {/* Botón generar (visible cuando se alcanzó 80%) */}
      {puedeGenerarEquipos && (
        <button
          onClick={onGenerar}
          disabled={generando}
          className="w-full bg-neon text-dark font-bold hover:shadow-[0_0_18px_rgba(0,230,118,0.45)] hover:brightness-110 py-3 rounded-xl font-semibold disabled:opacity-50 transition-colors"
        >
          {generando ? 'Generando equipos...' : '⚽ Generar equipos'}
        </button>
      )}
    </div>
  )
}
