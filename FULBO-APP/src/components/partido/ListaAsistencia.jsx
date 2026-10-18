import { CUPO_POR_DEFECTO, esTitular, esSuplente, ordenarPorInscripcion } from '../../utils/suplentes'

const POS_ESTILOS = {
  ARQ: { background: '#3d2a00', color: '#ffcc80', border: '1px solid #5a3d00' },
  DEF: { background: '#1a2a1a', color: '#a5d6a7', border: '1px solid #2a4a2a' },
  MED: { background: '#1a2d3d', color: '#90caf9', border: '1px solid #1e3d5a' },
  DEL: { background: '#3d1a1a', color: '#ef9a9a', border: '1px solid #5a2a2a' },
}

function Avatar({ nombre }) {
  const iniciales = nombre
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase()
  return (
    <div
      className="w-9 h-9 bg-[#245c33] flex items-center justify-center text-white font-bold text-xs shrink-0"
      style={{ borderRadius: '3px' }}
    >
      {iniciales}
    </div>
  )
}

const ETIQUETA_ESTADO = {
  titular: { texto: 'Confirmó', estilo: 'bg-[#1b3d22] text-[#4caf50] border border-[#2d5a3d]' },
  suplente: { texto: 'Suplente', estilo: 'bg-[#3d3000] text-[#f59e0b] border border-[#5a4500]' },
  rechazado: { texto: 'No va', estilo: 'bg-[#3d1a1a] text-[#ef9a9a] border border-[#5a2a2a]' },
  sin_respuesta: { texto: 'Pendiente', estilo: 'bg-[#2a3040] text-[#6b7a8d] border border-[#3a4050]' },
}

function FilaJugador({ jugador, estado, posicionEspera, esSelf, puedeEditar, onConfirmar, onMover }) {
  const anotado = estado === 'titular' || estado === 'suplente'
  return (
    <div
      className={`bg-[#1e2435] border-b border-[#242b3d] px-3 py-2.5 flex items-center gap-3 ${
        esSelf ? 'border-l-2 border-l-[#4caf50]' : ''
      }`}
    >
      <Avatar nombre={jugador.nombre} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          {posicionEspera && (
            <span className="text-[#f59e0b] font-bold" style={{ fontSize: '10px' }}>
              #{posicionEspera}
            </span>
          )}
          <span className="font-semibold text-[#e0e6f0] text-sm truncate">
            {jugador.nombre}
          </span>
          {esSelf && (
            <span
              className="text-[#4caf50] font-bold uppercase"
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
              borderRadius: '2px',
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
              className="text-[#6b7a8d] hover:text-[#f59e0b] underline transition-colors"
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
                  ? 'bg-[#245c33] border border-[#2d7a3d] text-white'
                  : estado === 'suplente'
                  ? 'bg-[#5c4500] border border-[#7a5c00] text-white'
                  : 'bg-[#1a1f2e] border border-[#2a3040] text-[#8892a4] hover:border-[#4caf50] hover:text-[#4caf50]'
              }`}
              style={{ fontSize: '10px', letterSpacing: '0.05em', borderRadius: '3px' }}
            >
              Voy ✓
            </button>
            <button
              onClick={() => onConfirmar(jugador.id, false)}
              className={`px-2.5 py-1.5 font-semibold uppercase transition-colors ${
                estado === 'rechazado'
                  ? 'bg-[#5c2424] border border-[#7a2d2d] text-white'
                  : 'bg-[#1a1f2e] border border-[#2a3040] text-[#8892a4] hover:border-[#ef9a9a] hover:text-[#ef9a9a]'
              }`}
              style={{ fontSize: '10px', letterSpacing: '0.05em', borderRadius: '3px' }}
            >
              No voy
            </button>
          </div>
        ) : (
          <span
            className={`px-2 py-0.5 font-semibold uppercase ${ETIQUETA_ESTADO[estado].estilo}`}
            style={{ fontSize: '9px', letterSpacing: '0.05em', borderRadius: '2px' }}
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
          className="px-3 py-1.5 flex items-center gap-2 border-y border-[#2a3040]"
          style={{ background: '#242b3d' }}
        >
          <span
            className="text-[#8892a4] uppercase font-semibold tracking-widest"
            style={{ fontSize: '10px', letterSpacing: '0.1em' }}
          >
            {titulo}
          </span>
          <span
            className="text-[#4caf50] font-bold"
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
    <div className="overflow-hidden" style={{ borderRadius: '4px', border: '1px solid #2a3040' }}>
      {jugadores.length === 0 && (
        <p className="text-sm text-[#6b7a8d] italic text-center py-6 bg-[#1e2435]">
          No hay jugadores activos registrados.
        </p>
      )}
      {estaAbierto && cupoCompleto && (
        <p className="text-xs text-[#f59e0b] bg-[#3d3000]/40 px-3 py-2 border-b border-[#2a3040]">
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
