import { useEffect, useState } from 'react'
import { useVotacionMVP } from '../hooks/useVotacionMVP'
import BotonWhatsApp from '../components/BotonWhatsApp'
import { mensajePartido } from '../utils/whatsapp'

const MEDALLAS = ['🥇', '🥈', '🥉']
const COLORES_CONFETI = ['#F59E0B', '#00E676', '#F0F6FC', '#FBBF24']

// ─── Componentes visuales ─────────────────────────────────────────────────────

function Avatar({ jugador, tamano = 'w-10 h-10 text-xs', borde = 'border-neon/40' }) {
  if (jugador?.foto_url) {
    return <img src={jugador.foto_url} alt="" className={`${tamano} rounded-full object-cover border ${borde} shrink-0`} />
  }
  const iniciales = (jugador?.nombre ?? '?').split(' ').slice(0, 2).map((p) => p[0]).join('').toUpperCase()
  return (
    <div className={`${tamano} rounded-full bg-neon/10 border ${borde} flex items-center justify-center text-neon font-bold shrink-0`}>
      {iniciales}
    </div>
  )
}

function formatearFecha(fecha) {
  if (!fecha) return ''
  return fecha.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })
}

// "Cierra en 13 h 05 min" (se actualiza cada 30 segundos)
function TiempoRestante({ cierre }) {
  const [ahora, setAhora] = useState(() => Date.now())
  useEffect(() => {
    const intervalo = setInterval(() => setAhora(Date.now()), 30 * 1000)
    return () => clearInterval(intervalo)
  }, [])

  const minutos = Math.max(0, Math.ceil((cierre.getTime() - ahora) / 60000))
  const texto = minutos === 0
    ? 'Cerrando...'
    : `Cierra en ${Math.floor(minutos / 60)} h ${String(minutos % 60).padStart(2, '0')} min`
  return <span className="text-gold font-semibold tabular-nums">⏳ {texto}</span>
}

// Lluvia de papelitos al revelar el ganador (una sola vez)
function Confeti() {
  const [piezas] = useState(() =>
    Array.from({ length: 28 }, (_, i) => ({
      izquierda: Math.random() * 100,
      demora: Math.random() * 0.6,
      color: COLORES_CONFETI[i % COLORES_CONFETI.length],
    }))
  )
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {piezas.map((p, i) => (
        <span
          key={i}
          className="confeti"
          style={{ left: `${p.izquierda}%`, background: p.color, animationDelay: `${p.demora}s` }}
        />
      ))}
    </div>
  )
}

// ─── Votación abierta ─────────────────────────────────────────────────────────

function VotacionAbierta({ partido, cierre, asistentes, miParticipacion, cantidadVotaron, miVoto, jugadoresPorId, onVotar }) {
  const [elegido, setElegido] = useState(null)
  const [votando, setVotando] = useState(false)
  const [errorVoto, setErrorVoto] = useState('')

  const yaVote = !!miParticipacion?.voto_mvp
  const candidatos = asistentes
    .filter((p) => p.jugador_id !== miParticipacion?.jugador_id)
    .map((p) => jugadoresPorId[p.jugador_id] ?? { id: p.jugador_id, nombre: 'Jugador eliminado' })
    .sort((a, b) => a.nombre.localeCompare(b.nombre))

  async function handleVotar() {
    setVotando(true)
    setErrorVoto('')
    try {
      await onVotar(elegido)
    } catch (err) {
      console.error(err)
      setErrorVoto('No se pudo registrar tu voto. Actualizá e intentá de nuevo.')
    } finally {
      setVotando(false)
    }
  }

  return (
    <section className="tarjeta-vidrio p-4 sm:p-5">
      <div className="flex items-start justify-between gap-2 mb-1">
        <h2 className="font-extrabold text-texto text-xl flex items-center gap-2">
          <span>🏆</span> Votá al MVP
        </h2>
        <span className="bg-gold/20 text-gold border border-gold/50 text-xs font-bold px-3 py-1 rounded-full shrink-0">
          Votación abierta
        </span>
      </div>
      <p className="text-texto-sec text-sm capitalize">Partido del {formatearFecha(partido.fecha)}</p>

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm my-4 rounded-lg bg-white/[0.03] border border-white/[0.06] px-3 py-2.5">
        <span className="text-texto">
          <strong className="text-neon">{cantidadVotaron}</strong> de {asistentes.length} jugadores votaron
        </span>
        {cierre && <TiempoRestante cierre={cierre} />}
      </div>

      {yaVote ? (
        <div className="text-center py-6">
          <p className="text-neon font-bold text-lg">Ya votaste ✓</p>
          {miVoto && (
            <p className="text-texto-sec text-sm mt-1">
              Elegiste a <span className="text-texto font-semibold">{jugadoresPorId[miVoto]?.nombre ?? 'un jugador'}</span>
            </p>
          )}
          <p className="text-texto-sec text-xs mt-3">El resultado se muestra cuando se cierre la votación.</p>
        </div>
      ) : !miParticipacion ? (
        <p className="text-texto-sec text-sm text-center py-6">
          Solo votan los jugadores que jugaron el partido.
          <br />El resultado se muestra cuando se cierre la votación.
        </p>
      ) : (
        <>
          <p className="text-texto-sec text-xs mb-2">Elegí al mejor del partido (no podés votarte a vos mismo):</p>
          <ul className="space-y-2">
            {candidatos.map((j) => {
              const activo = elegido === j.id
              return (
                <li key={j.id}>
                  <button
                    onClick={() => setElegido(j.id)}
                    className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 border text-left transition-all duration-200 ${
                      activo
                        ? 'bg-gold/15 border-gold/60 shadow-[0_0_14px_rgba(245,158,11,0.3)]'
                        : 'bg-white/[0.03] border-white/[0.06] hover:border-white/[0.15]'
                    }`}
                  >
                    <Avatar jugador={j} borde={activo ? 'border-gold' : 'border-neon/40'} />
                    <span className={`flex-1 font-semibold text-sm truncate ${activo ? 'text-gold' : 'text-texto'}`}>
                      {j.nombre}
                    </span>
                    {activo && <span className="text-gold">🏆</span>}
                  </button>
                </li>
              )
            })}
          </ul>
          <button
            onClick={handleVotar}
            disabled={!elegido || votando}
            className="w-full mt-4 bg-gold text-dark font-bold py-2.5 rounded-lg text-sm hover:shadow-[0_0_18px_rgba(245,158,11,0.5)] hover:brightness-110 disabled:opacity-40 transition-all duration-200"
          >
            {votando
              ? 'Votando...'
              : elegido
                ? `Votar a ${jugadoresPorId[elegido]?.nombre ?? 'este jugador'}`
                : 'Elegí un jugador'}
          </button>
          <p className="text-texto-sec text-center mt-2" style={{ fontSize: '11px' }}>
            El voto es secreto y no se puede cambiar.
          </p>
          {errorVoto && <p className="text-red-400 text-xs text-center mt-2">{errorVoto}</p>}
        </>
      )}
    </section>
  )
}

// Admin: aviso por WhatsApp y cierre anticipado (con confirmación)
function AccionesAdmin({ partido, onCerrar }) {
  const [confirmando, setConfirmando] = useState(false)
  const [cerrando, setCerrando] = useState(false)
  const [error, setError] = useState('')

  async function handleCerrar() {
    setCerrando(true)
    setError('')
    try {
      await onCerrar()
    } catch (err) {
      console.error(err)
      setError('No se pudo cerrar la votación. Intentá de nuevo.')
      setCerrando(false)
    }
  }

  return (
    <section className="tarjeta-vidrio p-4 space-y-2">
      <p className="font-bold text-texto text-sm">⚙️ Admin</p>
      <BotonWhatsApp mensaje={mensajePartido(partido)} etiqueta="Avisar al grupo por WhatsApp" />
      {confirmando ? (
        <div className="bg-gold/10 border border-gold/40 rounded-xl p-3 space-y-2">
          <p className="text-sm text-gold font-medium text-center">
            ¿Cerrar la votación ahora? Se calcula el MVP con los votos que hay.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setConfirmando(false)}
              disabled={cerrando}
              className="flex-1 py-2 border border-white/[0.08] text-texto-sec rounded-xl text-sm font-medium hover:bg-white/[0.04] disabled:opacity-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleCerrar}
              disabled={cerrando}
              className="flex-1 py-2 bg-gold text-dark rounded-xl text-sm font-bold hover:brightness-110 disabled:opacity-50 transition-colors"
            >
              {cerrando ? 'Cerrando...' : 'Sí, cerrar'}
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setConfirmando(true)}
          className="w-full bg-gold/15 border border-gold/40 text-gold py-2.5 rounded-xl text-sm font-semibold hover:bg-gold/25 transition-colors"
        >
          Cerrar votación MVP ahora
        </button>
      )}
      {error && <p className="text-red-400 text-xs text-center">{error}</p>}
    </section>
  )
}

// ─── Resultado de la última votación ──────────────────────────────────────────

function ResultadoMVP({ partido, jugadoresPorId }) {
  const resultados = partido.mvp_resultados ?? []
  const ganador = jugadoresPorId[partido.mvp_ganador_jugador_id]
  const votosGanador = resultados.find((r) => r.jugador_id === partido.mvp_ganador_jugador_id)?.votos ?? 0

  return (
    <section className="tarjeta-vidrio p-4 sm:p-5">
      <div className="flex items-start justify-between gap-2 mb-1">
        <h2 className="font-extrabold text-texto text-xl flex items-center gap-2">
          <span>🏆</span> MVP del partido
        </h2>
        <span className="bg-white/[0.06] text-texto-sec border border-white/[0.1] text-xs font-bold px-3 py-1 rounded-full shrink-0">
          Votación cerrada
        </span>
      </div>
      <p className="text-texto-sec text-sm capitalize">Partido del {formatearFecha(partido.fecha)}</p>

      {partido.mvp_ganador_jugador_id ? (
        <div className="relative flex flex-col items-center text-center pt-6 pb-4">
          <Confeti />
          <div className="revelar-mvp rounded-full p-1 border-2 border-gold">
            <Avatar jugador={ganador} tamano="w-24 h-24 text-2xl" borde="border-gold" />
          </div>
          <p className="text-3xl mt-3">👑</p>
          <p className="font-black text-2xl text-gold" style={{ textShadow: '0 0 16px rgba(245,158,11,0.6)' }}>
            {ganador?.nombre ?? 'Jugador eliminado'}
          </p>
          <p className="text-texto-sec text-sm mt-1">
            {votosGanador} voto{votosGanador !== 1 ? 's' : ''}
          </p>
        </div>
      ) : (
        <p className="text-texto-sec text-sm text-center py-8">Nadie votó en este partido.</p>
      )}

      {resultados.length > 0 && (
        <>
          <h3 className="text-texto-sec uppercase font-semibold tracking-widest mt-2 mb-2" style={{ fontSize: '11px' }}>
            Podio
          </h3>
          <ol className="space-y-2">
            {resultados.map((r, i) => {
              const jugador = jugadoresPorId[r.jugador_id] ?? { nombre: 'Jugador eliminado' }
              const esGanador = r.jugador_id === partido.mvp_ganador_jugador_id
              return (
                <li
                  key={r.jugador_id}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 border ${
                    esGanador ? 'bg-gold/10 border-gold/50' : 'bg-white/[0.03] border-white/[0.06]'
                  }`}
                >
                  <span className="w-6 text-center text-sm font-bold text-texto-sec">
                    {r.votos > 0 && MEDALLAS[i] ? MEDALLAS[i] : i + 1}
                  </span>
                  <Avatar jugador={jugador} borde={esGanador ? 'border-gold' : 'border-neon/40'} />
                  <span className={`flex-1 font-semibold text-sm truncate ${esGanador ? 'text-gold' : 'text-texto'}`}>
                    {jugador.nombre}
                  </span>
                  <span className={`font-extrabold ${esGanador ? 'text-gold' : 'text-texto'}`}>{r.votos}</span>
                </li>
              )
            })}
          </ol>
        </>
      )}
    </section>
  )
}

// ─── Historial ────────────────────────────────────────────────────────────────

function HistorialMVP({ cerradas, jugadoresPorId }) {
  const conGanador = cerradas.filter((p) => p.mvp_ganador_jugador_id)
  return (
    <section className="tarjeta-vidrio p-4 sm:p-5">
      <h2 className="font-extrabold text-texto text-lg mb-3">Historial de MVPs</h2>
      {conGanador.length === 0 ? (
        <p className="text-texto-sec text-sm text-center py-6">Aún no hay MVPs registrados</p>
      ) : (
        <ul className="space-y-2">
          {conGanador.map((p) => {
            const jugador = jugadoresPorId[p.mvp_ganador_jugador_id] ?? { nombre: 'Jugador eliminado' }
            const votos = p.mvp_resultados?.find((r) => r.jugador_id === p.mvp_ganador_jugador_id)?.votos ?? 0
            return (
              <li key={p.id} className="flex items-center gap-3 rounded-lg px-3 py-2.5 bg-white/[0.03] border border-white/[0.06]">
                <Avatar jugador={jugador} borde="border-gold/60" />
                <div className="flex-1 min-w-0">
                  <p className="text-texto font-semibold text-sm truncate">{jugador.nombre}</p>
                  <p className="text-texto-sec text-xs capitalize truncate">{formatearFecha(p.fecha)}</p>
                </div>
                <span className="text-gold text-sm font-bold shrink-0">
                  🏆 {votos} voto{votos !== 1 ? 's' : ''}
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

// ─── Página ───────────────────────────────────────────────────────────────────

export default function PaginaMVP({ grupoId, jugadores = [], cargandoJugadores, jugadorActual, esAdmin }) {
  const {
    cargando, error, cargar,
    votacionAbierta, cierreAutomatico, asistentes, miParticipacion, cantidadVotaron, miVoto, votar,
    cerrarVotacion, cerradas,
  } = useVotacionMVP(grupoId, jugadores, jugadorActual, cargandoJugadores)

  const jugadoresPorId = Object.fromEntries(jugadores.map((j) => [j.id, j]))
  const ultimaCerrada = cerradas[0]

  if (cargando || cargandoJugadores) {
    return (
      <div className="text-center py-16 text-texto-sec">
        <div className="text-3xl mb-2 animate-bounce">🏆</div>
        <p className="text-sm">Cargando...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12 px-4">
        <div className="text-3xl mb-3">⚠️</div>
        <p className="text-texto-sec font-medium mb-4">{error}</p>
        <button onClick={cargar} className="btn-primario px-5 py-2.5 text-sm">Reintentar</button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
      {votacionAbierta ? (
        <VotacionAbierta
          partido={votacionAbierta}
          cierre={cierreAutomatico}
          asistentes={asistentes}
          miParticipacion={miParticipacion}
          cantidadVotaron={cantidadVotaron}
          miVoto={miVoto}
          jugadoresPorId={jugadoresPorId}
          onVotar={votar}
        />
      ) : (
        ultimaCerrada && <ResultadoMVP key={ultimaCerrada.id} partido={ultimaCerrada} jugadoresPorId={jugadoresPorId} />
      )}

      {esAdmin && votacionAbierta && <AccionesAdmin partido={votacionAbierta} onCerrar={cerrarVotacion} />}

      <HistorialMVP cerradas={cerradas} jugadoresPorId={jugadoresPorId} />

      <button
        onClick={cargar}
        className="w-full text-xs text-texto-sec py-1 hover:text-neon transition-all duration-200"
      >
        ↻ Actualizar
      </button>
    </div>
  )
}
