import { useEffect, useState } from 'react'
import { usePartido } from '../hooks/usePartido'
import { useEstadisticas } from '../hooks/useEstadisticas'
import PanelAdmin from '../components/partido/PanelAdmin'
import ListaAsistencia from '../components/partido/ListaAsistencia'
import PanelVotacionEquipos from '../components/partido/PanelVotacionEquipos'
import ModalCerrarPartido from '../components/partido/ModalCerrarPartido'
import ModalEditarEquipos from '../components/partido/ModalEditarEquipos'
import { esTitular, unaPorJugador } from '../utils/suplentes'
import { mensajePartido } from '../utils/whatsapp'
import BotonWhatsApp from '../components/BotonWhatsApp'

// ─── Componentes visuales ─────────────────────────────────────────────────────

// Cuenta regresiva hasta el partido (solo visual: se actualiza cada segundo)
function CuentaRegresiva({ fecha }) {
  const [ahora, setAhora] = useState(() => Date.now())
  useEffect(() => {
    const intervalo = setInterval(() => setAhora(Date.now()), 1000)
    return () => clearInterval(intervalo)
  }, [])

  const restante = Math.max(0, fecha.getTime() - ahora)
  const segundos = Math.floor(restante / 1000)
  const dosDigitos = (n) => String(n).padStart(2, '0')
  const reloj = [
    Math.floor(segundos / 86400),
    Math.floor((segundos % 86400) / 3600),
    Math.floor((segundos % 3600) / 60),
    segundos % 60,
  ].map(dosDigitos).join(':')

  return (
    <p
      className="font-mono text-4xl font-extrabold text-gold tabular-nums leading-none"
      style={{ textShadow: '0 0 16px rgba(245,158,11,0.6)' }}
    >
      {restante === 0 ? '¡A jugar!' : reloj}
    </p>
  )
}

// Barra de titulares sobre el cupo (dorada si se pasó del cupo)
function BarraConfirmados({ titulares, cupo, suplentes }) {
  const porcentaje = Math.min(100, Math.round((titulares / cupo) * 100))
  const excedido = titulares > cupo
  return (
    <div>
      <p className="flex items-center gap-1.5 text-sm font-semibold text-neon mb-2">
        <span className="w-2 h-2 rounded-full bg-neon animate-pulse" style={{ boxShadow: '0 0 8px #00E676' }} />
        Convocatoria activa
      </p>
      <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${excedido ? 'bg-gold' : 'bg-neon'}`}
          style={{
            width: `${porcentaje}%`,
            boxShadow: excedido ? '0 0 10px rgba(245,158,11,0.6)' : '0 0 10px rgba(0,230,118,0.6)',
          }}
        />
      </div>
      <p className="text-texto-sec text-sm mt-2">
        {titulares}/{cupo} confirmados
        {suplentes > 0 && ` · ${suplentes} suplente${suplentes !== 1 ? 's' : ''}`}
      </p>
    </div>
  )
}

function FilaEstadistica({ icono, titulo, detalle, valor }) {
  return (
    <div className="flex items-center gap-3 rounded-lg bg-white/[0.03] border border-white/[0.06] px-3 py-3">
      <span className="text-xl w-7 text-center shrink-0">{icono}</span>
      <div className="flex-1 min-w-0">
        <p className="text-texto font-semibold text-sm">{titulo}</p>
        <p className="text-texto-sec text-xs truncate">{detalle}</p>
      </div>
      {valor != null && <span className="text-texto font-extrabold text-lg">{valor}</span>}
    </div>
  )
}

// Contenedor colapsable para el panel del admin
function AcordeonAdmin({ abierto, onAlternar, children }) {
  return (
    <div className="tarjeta-vidrio overflow-hidden">
      <button
        onClick={onAlternar}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-white/[0.03] transition-all duration-200"
        aria-expanded={abierto}
      >
        <span className="font-bold text-texto text-sm">⚙️ Panel admin</span>
        <span className={`text-texto-sec transition-transform duration-200 ${abierto ? 'rotate-180' : ''}`}>▾</span>
      </button>
      {abierto && <div className="border-t border-white/[0.08]">{children}</div>}
    </div>
  )
}

// Admin: abre el editor para cambiar jugadores de equipo
function BotonEditarEquipos({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full btn-secundario py-2 text-sm"
    >
      🔁 Cambiar jugadores de equipo
    </button>
  )
}

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
        className="w-full border border-red-500/40 text-[#F87171] py-2 rounded-xl text-sm font-medium hover:bg-red-500/10 transition-colors"
      >
        {esSuplente ? '🏃 Salir de la lista de suplentes' : '🏃 Me bajo del partido'}
      </button>
    )
  }
  return (
    <div className="bg-red-500/10 border border-red-500/40 rounded-xl p-3 space-y-2">
      <p className="text-sm text-[#F87171] font-medium text-center">
        {esSuplente
          ? '¿Seguro que querés salir de la lista de suplentes?'
          : 'Los equipos ya están armados. Si te bajás, se entera todo el grupo. ⚖️'}
      </p>
      <div className="flex gap-2">
        <button
          onClick={() => setConfirmando(false)}
          disabled={bajando}
          className="flex-1 py-2 border border-white/[0.08] text-[#8B949E] rounded-xl text-sm font-medium hover:bg-white/[0.04] disabled:opacity-50 transition-colors"
        >
          Me quedo
        </button>
        <button
          onClick={handleBajarse}
          disabled={bajando}
          className="flex-1 py-2 bg-red-500/20 border border-red-500/50 text-white rounded-xl text-sm font-semibold hover:bg-red-500/30 disabled:opacity-50 transition-colors"
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
    errorAccion,
    limpiarErrorAccion,
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
    cerrarPartido,
    editarEquipos,
    votacionMvpAbierta,
  } = usePartido(jugadores, grupoId)
  const [cerrandoPartido, setCerrandoPartido] = useState(false)
  const [editandoEquipos, setEditandoEquipos] = useState(false)

  const jugadoresActivos = jugadores.filter((j) => j.activo)

  // Las combinaciones guardan una copia de cada jugador del momento en que se
  // generaron (sin foto). Para mostrar, se completa con sus datos actuales.
  const jugadoresPorId = Object.fromEntries(jugadores.map((j) => [j.id, j]))
  function conDatosActuales(combinacion) {
    if (!combinacion) return combinacion
    const actualizar = (lista) => lista.map((j) => ({ ...j, ...jugadoresPorId[j.id] }))
    return { ...combinacion, equipo1: actualizar(combinacion.equipo1), equipo2: actualizar(combinacion.equipo2) }
  }
  const estadisticas = useEstadisticas(grupoId)
  const lider = estadisticas.ranking(jugadoresActivos)[0]
  const hayPresencias = lider && lider.partidos > 0

  // Si la acción falló (ya revertida en pantalla), el aviso se va solo
  useEffect(() => {
    if (!errorAccion) return
    const temporizador = setTimeout(limpiarErrorAccion, 6000)
    return () => clearTimeout(temporizador)
  }, [errorAccion])

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
    abierto: { texto: 'Confirmando asistencia', color: 'bg-neon/15 text-neon border border-neon/40' },
    votando: { texto: 'Votando equipos', color: 'bg-gold/20 text-gold border border-gold/50' },
    confirmado: { texto: 'Equipos confirmados', color: 'bg-neon text-dark' },
  }
  const badgePartido = partido && BADGE_ESTADO[partido.estado]

  // Acordeón del admin: cerrado por defecto en mobile; abierto en desktop
  // (columna derecha) o si no hay partido (ahí se crea la convocatoria)
  const [adminAbiertoManual, setAdminAbiertoManual] = useState(null)
  const [pantallaAncha] = useState(() => window.matchMedia?.('(min-width: 1024px)').matches ?? false)
  const adminAbierto = adminAbiertoManual ?? (!partido || pantallaAncha)

  // Datos para la tarjeta de asistencia
  const idsConRespuesta = participaciones.map((p) => p.jugador_id)
  const sinRespuesta = jugadoresActivos.filter((j) => !idsConRespuesta.includes(j.id)).length
  const noVan = unaPorJugador(participaciones).filter((p) => p.confirmo_asistencia === false).length

  const listo = !cargando && !cargandoJugadores && !error

  // Contenido de la columna central según el estado (misma lógica que antes)
  const contenidoCentral = (
    <>
      {/* Sin partido + no admin */}
      {!partido && !esAdmin && (
        <div className="tarjeta-vidrio text-center py-16 px-4 text-texto-sec">
          <div className="text-5xl mb-3">📅</div>
          <p className="font-semibold text-texto">Sin convocatoria activa</p>
          <p className="text-sm mt-1">El admin la habilitará cuando corresponda.</p>
        </div>
      )}
      {!partido && esAdmin && (
        <div className="tarjeta-vidrio text-center py-12 px-4 text-texto-sec">
          <div className="text-4xl mb-3">📅</div>
          <p className="font-semibold text-texto">Sin convocatoria activa</p>
          <p className="text-sm mt-1">Abrila desde el Panel admin.</p>
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
        <div className="space-y-3">
          <PanelVotacionEquipos
            estado="votando"
            equipo={conDatosActuales(equipoActual)}
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
          {esAdmin && equipoActual && <BotonEditarEquipos onClick={() => setEditandoEquipos(true)} />}
          {puedeBajarse && (
            <BotonBajarse
              esSuplente={soySuplente}
              onBajarse={() => confirmarAsistencia(jugadorActual.id, false)}
            />
          )}
          <details className="tarjeta-vidrio px-4 py-3">
            <summary className="text-xs text-texto-sec cursor-pointer hover:text-texto transition-colors">
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
        </div>
      )}

      {/* ESTADO: confirmado */}
      {partido?.estado === 'confirmado' && (
        <div className="space-y-3">
          <PanelVotacionEquipos
            estado="confirmado"
            equipo={conDatosActuales(equipoConfirmado)}
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
          {esAdmin && equipoConfirmado && <BotonEditarEquipos onClick={() => setEditandoEquipos(true)} />}
          {puedeBajarse && (
            <BotonBajarse
              esSuplente={soySuplente}
              onBajarse={() => confirmarAsistencia(jugadorActual.id, false)}
            />
          )}
          <details className="tarjeta-vidrio px-4 py-3">
            <summary className="text-xs text-texto-sec cursor-pointer hover:text-texto transition-colors">
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
        </div>
      )}
    </>
  )

  return (
    <div className="min-h-full bg-dark">
      <div className="max-w-7xl mx-auto px-4 py-4">
        {/* Cargando */}
        {(cargando || cargandoJugadores) && (
          <div className="text-center py-16 text-texto-sec">
            <div className="text-3xl mb-2 animate-bounce">⚽</div>
            <p className="text-sm">Cargando...</p>
          </div>
        )}

        {/* Error */}
        {!cargando && !cargandoJugadores && error && (
          <div className="text-center py-12">
            <div className="text-3xl mb-3">⚠️</div>
            <p className="text-texto-sec font-medium mb-4">{error}</p>
            <button onClick={cargar} className="btn-primario px-5 py-2.5 text-sm">
              Reintentar
            </button>
          </div>
        )}

        {/* Error de VOY / voto: la pantalla ya volvió a como estaba */}
        {errorAccion && (
          <div
            role="alert"
            className="mb-4 flex items-start gap-2 rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2.5 text-sm text-[#F87171]"
          >
            <span className="flex-1">{errorAccion}</span>
            <button onClick={limpiarErrorAccion} className="shrink-0 px-1 hover:text-white" aria-label="Cerrar aviso">✕</button>
          </div>
        )}

        {listo && (
          // Mobile: todo apilado · Desktop: tarjeta del partido (2/3) + columna lateral (1/3)
          <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] items-start">
            {/* ── Tarjeta principal: info del partido + cancha ── */}
            <section className="tarjeta-vidrio p-4 sm:p-5 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-4">
                <h2 className="font-extrabold text-texto text-xl leading-tight">
                  {partido ? 'Próximo partido' : 'Partido'}
                </h2>
                {badgePartido && (
                  <span className={`${badgePartido.color} text-xs font-bold px-3 py-1 rounded-full shrink-0`}>
                    {badgePartido.texto}
                  </span>
                )}
              </div>

              <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
                {/* Info del partido */}
                <div className="space-y-5 min-w-0">
                  {partido ? (
                    <>
                      <div className="space-y-1.5 text-sm">
                        {partido.fecha && (
                          <p className="flex items-center gap-2 text-texto font-semibold capitalize">
                            <span>📅</span>{formatearFecha(partido.fecha)}
                          </p>
                        )}
                        {partido.fecha && (
                          <p className="flex items-center gap-2 text-texto-sec">
                            <span>🕐</span>{formatearHora(partido.fecha)} hs
                          </p>
                        )}
                        {partido.lugar && (
                          <p className="flex items-center gap-2 text-texto-sec">
                            <span>📍</span>{partido.lugar}
                          </p>
                        )}
                      </div>

                      {partido.fecha && (
                        <div>
                          <p className="text-texto-sec text-sm mb-1.5">Tiempo restante</p>
                          <CuentaRegresiva fecha={partido.fecha} />
                        </div>
                      )}

                      <BarraConfirmados
                        titulares={confirmados.length}
                        cupo={partido.cupo_maximo}
                        suplentes={suplentes.length}
                      />

                      {/* Admin: aviso al grupo de WhatsApp según el estado del partido */}
                      {esAdmin && mensajePartido(partido) && (
                        <BotonWhatsApp mensaje={mensajePartido(partido)} etiqueta="Avisar al grupo por WhatsApp" />
                      )}

                      <button
                        onClick={cargar}
                        className="w-full text-xs text-texto-sec py-1 hover:text-neon transition-all duration-200"
                      >
                        ↻ Actualizar
                      </button>
                    </>
                  ) : (
                    <p className="text-texto-sec text-sm">Sin convocatoria activa</p>
                  )}
                </div>

                {/* Cancha / lista de asistencia según el estado */}
                <div className="min-w-0">{contenidoCentral}</div>
              </div>
            </section>

            {/* ── Columna lateral: estadísticas + panel admin ── */}
            <aside className="space-y-4 min-w-0">
              <div className="tarjeta-vidrio p-4">
                <h2 className="font-extrabold text-texto text-lg mb-3">Estadísticas</h2>
                <div className="space-y-2.5">
                  <FilaEstadistica
                    icono="👟"
                    titulo="Top presencias"
                    detalle={
                      hayPresencias
                        ? `${lider.jugador.nombre.split(' ')[0]} lidera · los que más partidos jugaron`
                        : 'Los que más partidos jugaron'
                    }
                    valor={hayPresencias ? lider.partidos : null}
                  />
                  <FilaEstadistica
                    icono="🏆"
                    titulo="MVP"
                    detalle={
                      votacionMvpAbierta
                        ? 'Votación abierta · votá en la pestaña MVP'
                        : 'Historial en la pestaña MVP'
                    }
                  />
                  <FilaEstadistica
                    icono="👥"
                    titulo="Asistencia"
                    detalle={
                      partido
                        ? `${suplentes.length} suplente${suplentes.length !== 1 ? 's' : ''} · ${sinRespuesta} sin responder · ${noVan} no van`
                        : 'Sin partido activo'
                    }
                    valor={partido ? `${confirmados.length}/${partido.cupo_maximo}` : null}
                  />
                </div>
              </div>

              {esAdmin && (
                <AcordeonAdmin
                  abierto={adminAbierto}
                  onAlternar={() => setAdminAbiertoManual(!adminAbierto)}
                >
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
                    onAbrirCierrePartido={() => setCerrandoPartido(true)}
                  />
                </AcordeonAdmin>
              )}
            </aside>
          </div>
        )}
      </div>

      {editandoEquipos && (equipoActual || equipoConfirmado) && (
        <ModalEditarEquipos
          equipo={conDatosActuales(equipoConfirmado ?? equipoActual)}
          titularesIds={confirmados.map((p) => p.jugador_id)}
          jugadoresPorId={jugadoresPorId}
          estado={partido.estado}
          onGuardar={async (equipo1, equipo2) => {
            await editarEquipos(equipo1, equipo2)
            setEditandoEquipos(false)
          }}
          onCancelar={() => setEditandoEquipos(false)}
        />
      )}

      {cerrandoPartido && partido?.estado === 'confirmado' && (
        <ModalCerrarPartido
          equipo={equipoConfirmado}
          titulares={confirmados}
          suplentes={suplentes}
          jugadoresPorId={jugadoresPorId}
          onConfirmar={async (datos) => {
            await cerrarPartido(datos)
            setCerrandoPartido(false)
          }}
          onCancelar={() => setCerrandoPartido(false)}
        />
      )}
    </div>
  )
}
