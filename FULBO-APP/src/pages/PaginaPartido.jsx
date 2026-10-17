import { usePartido } from '../hooks/usePartido'
import PanelAdmin from '../components/partido/PanelAdmin'
import ListaAsistencia from '../components/partido/ListaAsistencia'
import PanelVotacionEquipos from '../components/partido/PanelVotacionEquipos'

export default function PaginaPartido({ jugadores, cargandoJugadores, grupoId, jugadorActual, esAdmin }) {
  const {
    partido,
    participaciones,
    equiposCombinaciones,
    equipoActual,
    equipoConfirmado,
    config,
    cargando,
    error,
    confirmados,
    votosActuales,
    porcentajeAprobacion,
    deberiaAbrirSchedule,
    cargar,
    abrirConvocatoria,
    reabrirConvocatoria,
    borrarConvocatoria,
    cerrarConvocatoria,
    guardarConfig,
    confirmarAsistencia,
    votarEquipos,
    forzarCombinacion,
    avanzarCombinacion,
  } = usePartido(jugadores, grupoId)

  const jugadoresActivos = jugadores.filter((j) => j.activo)

  const miParticipacion = participaciones.find(
    (p) => p.jugador_id === jugadorActual?.id
  )
  const puedeVotar = miParticipacion?.confirmo_asistencia === true
  const combIdxActual = partido?.combinacion_actual ?? 0
  const miVoto = miParticipacion?.votos_equipos?.[combIdxActual]

  function formatearFecha(fecha) {
    if (!fecha) return null
    return fecha.toLocaleDateString('es-AR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    })
  }

  function formatearHora(fecha) {
    if (!fecha) return null
    return fecha.toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const BADGE_ESTADO = {
    abierto: { texto: 'Confirmando asistencia', color: 'bg-[#245c33] text-[#81c784]' },
    votando: { texto: 'Votando equipos', color: 'bg-[#5c3a00] text-[#fb923c]' },
    confirmado: { texto: 'Equipos confirmados', color: 'bg-[#1e3a5f] text-[#60a5fa]' },
  }

  return (
    <div className="min-h-full bg-[#1a1f2e]">
      {/* Banner superior */}
      <div className="bg-[#1e3a28] border-b border-[#2d5a3d] px-4 py-4 flex items-start justify-between">
        <div>
          <p className="font-bold text-[#e0e6f0] text-lg">
            {partido ? 'Próximo partido' : 'Partido'}
          </p>
          <p className="text-[#81c784] text-sm">
            {partido ? 'Convocatoria activa' : 'Sin convocatoria activa'}
          </p>
        </div>
        {jugadorActual && (
          <span className="text-[#81c784] text-xs shrink-0 mt-1">
            {jugadorActual.nombre.split(' ')[0]}
          </span>
        )}
      </div>

      {/* Tarjeta de info del partido */}
      {partido && (
        <div className="bg-[#1e2435] border-b border-[#2a3040] px-4 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1 flex-1">
              {partido.fecha && (
                <div className="flex items-center gap-2">
                  <span className="text-[#6b7a8d] text-sm">📅</span>
                  <span className="text-[#e0e6f0] font-medium text-sm capitalize">
                    {formatearFecha(partido.fecha)}
                  </span>
                </div>
              )}
              {partido.fecha && (
                <div className="flex items-center gap-2">
                  <span className="text-[#6b7a8d] text-sm">🕐</span>
                  <span className="text-[#8892a4] text-sm">
                    {formatearHora(partido.fecha)} hs
                  </span>
                </div>
              )}
              {partido.lugar && (
                <div className="flex items-center gap-2">
                  <span className="text-[#6b7a8d] text-sm">📍</span>
                  <span className="text-[#8892a4] text-sm">{partido.lugar}</span>
                </div>
              )}
            </div>
            {BADGE_ESTADO[partido.estado] && (
              <span
                className={`${BADGE_ESTADO[partido.estado].color} text-xs font-semibold px-2.5 py-1 rounded-full shrink-0`}
              >
                {BADGE_ESTADO[partido.estado].texto}
              </span>
            )}
          </div>
          <div className="mt-2 text-xs text-[#6b7a8d]">
            {confirmados.length} confirmado{confirmados.length !== 1 ? 's' : ''}
          </div>
        </div>
      )}

      <div className="px-4 py-4 space-y-4 pb-6">
        {/* Cargando */}
        {(cargando || cargandoJugadores) && (
          <div className="text-center py-16 text-[#6b7a8d]">
            <div className="text-3xl mb-2 animate-bounce">⚽</div>
            <p className="text-sm">Cargando...</p>
          </div>
        )}

        {/* Error */}
        {!cargando && !cargandoJugadores && error && (
          <div className="text-center py-12">
            <div className="text-3xl mb-3">⚠️</div>
            <p className="text-[#8892a4] font-medium mb-4">{error}</p>
            <button
              onClick={cargar}
              className="bg-[#245c33] border border-[#2d7a3d] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#2d7a3d] transition-colors"
            >
              Reintentar
            </button>
          </div>
        )}

        {/* Contenido principal */}
        {!cargando && !cargandoJugadores && !error && (
          <>
            {/* Panel admin */}
            {esAdmin && (
              <PanelAdmin
                partido={partido}
                config={config}
                deberiaAbrirSchedule={deberiaAbrirSchedule}
                onAbrirConvocatoria={abrirConvocatoria}
                onReabrirConvocatoria={reabrirConvocatoria}
                onCerrarConvocatoria={cerrarConvocatoria}
                onBorrarConvocatoria={borrarConvocatoria}
                onGuardarConfig={guardarConfig}
              />
            )}

            {/* Sin partido + no admin */}
            {!partido && !esAdmin && (
              <div className="text-center py-16 text-[#6b7a8d]">
                <div className="text-5xl mb-3">📅</div>
                <p className="font-semibold text-[#8892a4]">
                  Sin convocatoria activa
                </p>
                <p className="text-sm mt-1">
                  El admin la habilitará cuando corresponda.
                </p>
              </div>
            )}

            {/* ESTADO: abierto */}
            {partido?.estado === 'abierto' && (
              <ListaAsistencia
                jugadores={jugadoresActivos}
                participaciones={participaciones}
                jugadorActualId={jugadorActual?.id}
                estaAbierto={true}
                onConfirmar={confirmarAsistencia}
              />
            )}

            {/* ESTADO: votando */}
            {partido?.estado === 'votando' && (
              <>
                <PanelVotacionEquipos
                  estado="votando"
                  equipo={equipoActual}
                  combinacionActual={combIdxActual}
                  totalCombinaciones={equiposCombinaciones.length}
                  votosActuales={votosActuales}
                  porcentajeAprobacion={porcentajeAprobacion}
                  puedeVotar={puedeVotar}
                  miVoto={miVoto}
                  esAdmin={esAdmin}
                  participaciones={participaciones}
                  onVotar={(aprueba) => votarEquipos(jugadorActual.id, aprueba)}
                  onForzar={forzarCombinacion}
                  onAvanzar={() => avanzarCombinacion()}
                />
                <details className="mt-2">
                  <summary className="text-xs text-[#6b7a8d] cursor-pointer hover:text-[#8892a4] transition-colors">
                    Ver lista de asistencia
                  </summary>
                  <div className="mt-3">
                    <ListaAsistencia
                      jugadores={jugadoresActivos}
                      participaciones={participaciones}
                      jugadorActualId={jugadorActual?.id}
                      estaAbierto={false}
                      onConfirmar={confirmarAsistencia}
                    />
                  </div>
                </details>
              </>
            )}

            {/* ESTADO: confirmado */}
            {partido?.estado === 'confirmado' && (
              <>
                <PanelVotacionEquipos
                  estado="confirmado"
                  equipo={equipoConfirmado}
                  combinacionActual={null}
                  totalCombinaciones={equiposCombinaciones.length}
                  votosActuales={votosActuales}
                  porcentajeAprobacion={porcentajeAprobacion}
                  puedeVotar={false}
                  miVoto={undefined}
                  esAdmin={esAdmin}
                  participaciones={participaciones}
                  onVotar={null}
                  onForzar={null}
                  onAvanzar={null}
                />
                <details className="mt-2">
                  <summary className="text-xs text-[#6b7a8d] cursor-pointer hover:text-[#8892a4] transition-colors">
                    Ver lista de asistencia
                  </summary>
                  <div className="mt-3">
                    <ListaAsistencia
                      jugadores={jugadoresActivos}
                      participaciones={participaciones}
                      jugadorActualId={jugadorActual?.id}
                      estaAbierto={false}
                      onConfirmar={confirmarAsistencia}
                    />
                  </div>
                </details>
              </>
            )}

            {/* Botón recargar */}
            {partido && (
              <button
                onClick={cargar}
                className="w-full text-xs text-[#6b7a8d] py-2 hover:text-[#8892a4] transition-colors"
              >
                ↻ Actualizar
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
