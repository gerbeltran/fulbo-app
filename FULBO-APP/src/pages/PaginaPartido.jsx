import { useState } from 'react'
import { usePartido } from '../hooks/usePartido'
import PanelAdmin from '../components/partido/PanelAdmin'
import ListaAsistencia from '../components/partido/ListaAsistencia'
import PanelVotacionEquipos from '../components/partido/PanelVotacionEquipos'
import { esTitular } from '../utils/suplentes'
import { mensajePartido } from '../utils/whatsapp'
import BotonWhatsApp from '../components/BotonWhatsApp'

// Bajarse cuando los equipos ya están armados avisa a todo el grupo
// (salvo que seas suplente: ahí solo dejás la lista de espera)
function BotonBajarse({ onBajarse, esSuplente }) {
  const [confirmando, setConfirmando] = useState(false)
  const [bajando, setBajando] = useState(false)

  async function handleBajarse() {
    setBajando(true)
    try {
      await onBajarse()
    } finally {
      setBajando(false)
      setConfirmando(false)
    }
  }

  if (!confirmando) {
    return (
      <button
        onClick={() => setConfirmando(true)}
        className="w-full border border-[#5c2424] text-[#ef9a9a] py-2 rounded-xl text-sm font-medium hover:bg-[#3d1a1a] transition-colors"
      >
        {esSuplente ? '🏃 Salir de la lista de suplentes' : '🏃 Me bajo del partido'}
      </button>
    )
  }
  return (
    <div className="bg-[#3d1a1a] border border-[#5c2424] rounded-xl p-3 space-y-2">
      <p className="text-sm text-[#ef9a9a] font-medium text-center">
        {esSuplente
          ? '¿Seguro que querés salir de la lista de suplentes?'
          : 'Los equipos ya están armados. Si te bajás, se entera todo el grupo. ⚖️'}
      </p>
      <div className="flex gap-2">
        <button
          onClick={() => setConfirmando(false)}
          disabled={bajando}
          className="flex-1 py-2 border border-[#2a3040] text-[#8892a4] rounded-xl text-sm font-medium hover:bg-[#242b3d] disabled:opacity-50 transition-colors"
        >
          Me quedo
        </button>
        <button
          onClick={handleBajarse}
          disabled={bajando}
          className="flex-1 py-2 bg-[#5c2424] border border-[#7a2d2d] text-white rounded-xl text-sm font-semibold hover:bg-[#7a2d2d] disabled:opacity-50 transition-colors"
        >
          {bajando ? 'Bajándome...' : 'Sí, me bajo'}
        </button>
      </div>
    </div>
  )
}

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
    suplentes,
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
    cambiarSuplente,
    cambiarCupo,
    votarEquipos,
    forzarCombinacion,
    avanzarCombinacion,
  } = usePartido(jugadores, grupoId)

  const jugadoresActivos = jugadores.filter((j) => j.activo)

  const miParticipacion = participaciones.find(
    (p) => p.jugador_id === jugadorActual?.id
  )
  // Solo votan los titulares
  const puedeVotar = !!miParticipacion && esTitular(miParticipacion)
  const combIdxActual = partido?.combinacion_actual ?? 0
  const miVoto = miParticipacion?.votos_equipos?.[combIdxActual]
  const puedeBajarse =
    miParticipacion?.confirmo_asistencia === true &&
    ['votando', 'confirmado'].includes(partido?.estado)
  const soySuplente = miParticipacion?.confirmo_asistencia === true && !puedeVotar

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
            {confirmados.length}/{partido.cupo_maximo} confirmado{confirmados.length !== 1 ? 's' : ''}
            {suplentes.length > 0 && ` · ${suplentes.length} suplente${suplentes.length !== 1 ? 's' : ''}`}
          </div>
          {/* Admin: aviso al grupo de WhatsApp según el estado del partido */}
          {esAdmin && mensajePartido(partido) && (
            <div className="mt-3">
              <BotonWhatsApp mensaje={mensajePartido(partido)} etiqueta="Avisar al grupo por WhatsApp" />
            </div>
          )}
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
                onCambiarCupo={cambiarCupo}
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
                esAdmin={esAdmin}
                cupoMaximo={partido.cupo_maximo}
                onConfirmar={confirmarAsistencia}
                onMoverSuplente={cambiarSuplente}
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
                {puedeBajarse && (
                  <BotonBajarse
                    esSuplente={soySuplente}
                    onBajarse={() => confirmarAsistencia(jugadorActual.id, false)}
                  />
                )}
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
                      cupoMaximo={partido.cupo_maximo}
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
                {puedeBajarse && (
                  <BotonBajarse
                    esSuplente={soySuplente}
                    onBajarse={() => confirmarAsistencia(jugadorActual.id, false)}
                  />
                )}
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
                      cupoMaximo={partido.cupo_maximo}
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
