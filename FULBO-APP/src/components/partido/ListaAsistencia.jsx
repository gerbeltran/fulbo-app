import { CUPO_POR_DEFECTO, esTitular, esSuplente, ordenarPorInscripcion } from '../../utils/suplentes'

const POS_ESTILOS = {
  ARQ: { background: '#3d2a00', color: '#ffcc80', border: '1px solid #5a3d00' },
  DEF: { background: '#1a2a1a', color: '#69F0AE', border: '1px solid #2a4a2a' },
  MED: { background: '#1a2d3d', color: '#90caf9', border: '1px solid #1e3d5a' },
  DEL: { background: '#3d1a1a', color: '#F87171', border: '1px solid #5a2a2a' },
}

function Avatar({ nombre, foto }) {
  if (foto) {
    return <img src={foto} alt="" className="w-9 h-9 rounded-full object-cover border border-neon/40 shrink-0" />
  }
  const iniciales = nombre
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase()
  return (
    <div
      className="w-9 h-9 bg-neon/15 border border-neon/40 flex items-center justify-center text-neon font-bold text-xs shrink-0"
      style={{ borderRadius: '8px' }}
    >
      {iniciales}
    </div>
  )
}

const ETIQUETA_ESTADO = {
  titular: { texto: 'Confirmó', estilo: 'bg-neon/10 text-[#00E676] border border-neon/25' },
  suplente: { texto: 'Suplente', estilo: 'bg-gold/10 text-[#f59e0b] border border-gold/30' },
  rechazado: { texto: 'No va', estilo: 'bg-red-500/10 text-[#F87171] border border-red-500/30' },
  sin_respuesta: { texto: 'Pendiente', estilo: 'bg-white/[0.08] text-[#7D8590] border border-white/[0.12]' },
}

function FilaJugador({ jugador, estado, posicionEspera, esSelf, puedeEditar, onConfirmar, onMover }) {
  const anotado = estado === 'titular' || estado === 'suplente'
  return (
    <div
      className={`bg-card border-b border-white/[0.05] px-3 py-2.5 flex items-center gap-3 ${
        esSelf ? 'border-l-2 border-l-[#00E676]' : ''
      }`}
    >
      <Avatar nombre={jugador.nombre} foto={jugador.foto_url} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          {posicionEspera && (
            <span className="text-[#f59e0b] font-bold" style={{ fontSize: '10px' }}>
              #{posicionEspera}
            </span>
          )}
          <span className="font-semibold text-[#F0F6FC] text-sm truncate">
            {jugador.nombre}
          </span>
          {esSelf && (
            <span
              className="text-[#00E676] font-bold uppercase"
              style={{ fontSize: '9px', letterSpacing: '0.05em' }}
            >
              vos
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span
            className="uppercase font-semibold px-1.5 py-0.5 inline-block"
            style={{
              ...POS_ESTILOS[jugador.posicion_preferida],
              borderRadius: '6px',
              fontSize: '9px',
              letterSpacing: '0.05em',
            }}
          >
            {jugador.posicion_preferida}
          </span>
          {/* Admin: mover entre titulares y suplentes */}
          {onMover && anotado && (
            <button
              onClick={() => onMover(jugador.id, estado === 'titular')}
              className="text-[#7D8590] hover:text-[#f59e0b] underline transition-colors"
              style={{ fontSize: '10px' }}
            >
              {estado === 'titular' ? 'Pasar a suplente' : 'Pasar a titular'}
            </button>
          )}
        </div>
      </div>

      <div className="shrink-0">
        {puedeEditar ? (
          <div className="flex gap-1.5">
            <button
              onClick={() => onConfirmar(jugador.id, true)}
              className={`px-2.5 py-1.5 font-semibold uppercase transition-colors ${
 estado === 'titular'
 ? 'bg-neon text-dark font-bold hover:shadow-[0_0_18px_rgba(0,230,118,0.45)] hover:brightness-110 '
 : estado === 'suplente'
 ? 'bg-gold/20 border border-gold/50 '
 : 'bg-dark border border-white/[0.08] text-[#8B949E] hover:border-[#00E676] hover:text-[#00E676]'
 }`}
              style={{ fontSize: '10px', letterSpacing: '0.05em', borderRadius: '8px' }}
            >
              Voy ✓
            </button>
            <button
              onClick={() => onConfirmar(jugador.id, false)}
              className={`px-2.5 py-1.5 font-semibold uppercase transition-colors ${
                estado === 'rechazado'
                  ? 'bg-red-500/20 border border-red-500/50 text-white'
                  : 'bg-dark border border-white/[0.08] text-[#8B949E] hover:border-[#F87171] hover:text-[#F87171]'
              }`}
              style={{ fontSize: '10px', letterSpacing: '0.05em', borderRadius: '8px' }}
            >
              No voy
            </button>
          </div>
        ) : (
          <span
            className={`px-2 py-0.5 font-semibold uppercase ${ETIQUETA_ESTADO[estado].estilo}`}
            style={{ fontSize: '9px', letterSpacing: '0.05em', borderRadius: '6px' }}
          >
            {ETIQUETA_ESTADO[estado].texto}
          </span>
        )}
      </div>
    </div>
  )
}

export default function ListaAsistencia({
  jugadores,
  participaciones,
  jugadorActualId,
  estaAbierto,
  esAdmin = false,
  cupoMaximo = CUPO_POR_DEFECTO,
  onConfirmar,
  onMoverSuplente,
}) {
  function getEstado(jugadorId) {
    const p = participaciones.find((p) => p.jugador_id === jugadorId)
    if (!p) return 'sin_respuesta'
    if (esTitular(p)) return 'titular'
    if (esSuplente(p)) return 'suplente'
    if (p.confirmo_asistencia === false) return 'rechazado'
    return 'sin_respuesta'
  }

  const porId = Object.fromEntries(jugadores.map((j) => [j.id, j]))
  // Titulares y suplentes en orden de inscripción (el que vuelve a confirmar va al final)
  const enOrdenDeLlegada = (filtro) =>
    ordenarPorInscripcion(participaciones.filter(filtro))
      .map((p) => porId[p.jugador_id])
      .filter(Boolean)
  const titulares = enOrdenDeLlegada(esTitular)
  const suplentes = enOrdenDeLlegada(esSuplente)
  const sinRespuesta = jugadores.filter((j) => getEstado(j.id) === 'sin_respuesta')
  const rechazados = jugadores.filter((j) => getEstado(j.id) === 'rechazado')

  const cupoCompleto = titulares.length >= cupoMaximo

  const Grupo = ({ titulo, contador, lista, mostrarVacio = false, numerar = false }) =>
    lista.length === 0 && !mostrarVacio ? null : (
      <div>
        <div
          className="px-3 py-1.5 flex items-center gap-2 border-y border-white/[0.08]"
          style={{ background: 'rgba(255,255,255,0.04)' }}
        >
          <span
            className="text-[#8B949E] uppercase font-semibold tracking-widest"
            style={{ fontSize: '10px', letterSpacing: '0.1em' }}
          >
            {titulo}
          </span>
          <span
            className="text-[#00E676] font-bold"
            style={{ fontSize: '10px' }}
          >
            {contador ?? lista.length}
          </span>
        </div>
        <div>
          {lista.map((j, i) => (
            <FilaJugador
              key={j.id}
              jugador={j}
              estado={getEstado(j.id)}
              posicionEspera={numerar ? i + 1 : null}
              esSelf={j.id === jugadorActualId}
              // Cada uno edita su asistencia; el admin, la de todos
              puedeEditar={estaAbierto && (j.id === jugadorActualId || esAdmin)}
              onConfirmar={onConfirmar}
              onMover={esAdmin && estaAbierto ? onMoverSuplente : null}
            />
          ))}
        </div>
      </div>
    )

  return (
    <div className="overflow-hidden" style={{ borderRadius: '12px', border: '1px solid rgba(255,255,255,0.14)' }}>
      {jugadores.length === 0 && (
        <p className="text-sm text-[#7D8590] italic text-center py-6 bg-card">
          No hay jugadores activos registrados.
        </p>
      )}
      {estaAbierto && cupoCompleto && (
        <p className="text-xs text-[#f59e0b] bg-gold/10 px-3 py-2 border-b border-white/[0.08]">
          Cupo completo: los que confirmen ahora quedan como suplentes.
        </p>
      )}
      <Grupo
        titulo="Confirmados"
        contador={`${titulares.length}/${cupoMaximo}`}
        lista={titulares}
        mostrarVacio={jugadores.length > 0}
      />
      <Grupo titulo="Suplentes" lista={suplentes} numerar />
      <Grupo titulo="Sin respuesta" lista={sinRespuesta} />
      <Grupo titulo="No van" lista={rechazados} />
    </div>
  )
}
