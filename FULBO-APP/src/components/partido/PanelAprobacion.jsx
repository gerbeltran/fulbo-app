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
    <div className="bg-[#1e2435] rounded-xl border border-[#2a3040] p-4 space-y-4">
      <h3 className="font-semibold text-[#e0e6f0]">Aprobación de equipos</h3>

      {/* Barra de progreso */}
      <div>
        <div className="flex justify-between text-sm mb-2">
          <span className="text-[#8892a4]">
            {totalAprobaron} de {totalConfirmados} aprueban
          </span>
          <span
            className={`font-bold ${
              porcentajeAprobacion >= 80 ? 'text-[#4caf50]' : 'text-[#8892a4]'
            }`}
          >
            {porcentajeAprobacion}%
          </span>
        </div>
        <div className="w-full bg-[#2a3040] rounded-full h-3 overflow-hidden">
          <div
            className={`h-3 rounded-full transition-all duration-500 ${
              porcentajeAprobacion >= 80 ? 'bg-[#4caf50]' : 'bg-[#f59e0b]'
            }`}
            style={{ width: `${porcentajeAprobacion}%` }}
          />
        </div>
        {/* Marcador del 80% */}
        <div className="relative">
          <div
            className="absolute top-0 w-0.5 h-2 bg-[#6b7a8d]"
            style={{ left: '80%', transform: 'translateX(-50%)' }}
          />
          <div
            className="absolute text-xs text-[#6b7a8d] mt-1"
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
          <p className="text-sm text-[#8892a4] mb-2">Tu voto:</p>
          <div className="flex gap-2">
            <button
              onClick={() => onVotar(jugadorActualId, true)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                miVoto === true
                  ? 'bg-[#245c33] border border-[#2d7a3d] text-white'
                  : 'bg-[#242b3d] text-[#8892a4] hover:bg-[#1b3d22] hover:text-[#4caf50]'
              }`}
            >
              👍 Apruebo
            </button>
            <button
              onClick={() => onVotar(jugadorActualId, false)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                miVoto === false
                  ? 'bg-[#5c2424] border border-[#7a2d2d] text-white'
                  : 'bg-[#242b3d] text-[#8892a4] hover:bg-[#3d1a1a] hover:text-[#ef9a9a]'
              }`}
            >
              👎 No apruebo
            </button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-[#6b7a8d] italic">
          Solo votan los jugadores que confirmaron asistencia.
        </p>
      )}

      {/* Botón generar (visible cuando se alcanzó 80%) */}
      {puedeGenerarEquipos && (
        <button
          onClick={onGenerar}
          disabled={generando}
          className="w-full bg-[#245c33] border border-[#2d7a3d] text-white py-3 rounded-xl font-semibold hover:bg-[#2d7a3d] disabled:opacity-50 transition-colors"
        >
          {generando ? 'Generando equipos...' : '⚽ Generar equipos'}
        </button>
      )}
    </div>
  )
}
