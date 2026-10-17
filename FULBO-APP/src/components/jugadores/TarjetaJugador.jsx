const POS_ESTILOS = {
  ARQ: { background: '#3d2a00', color: '#ffcc80', border: '1px solid #5a3d00' },
  DEF: { background: '#1a2a1a', color: '#a5d6a7', border: '1px solid #2a4a2a' },
  MED: { background: '#1a2d3d', color: '#90caf9', border: '1px solid #1e3d5a' },
  DEL: { background: '#3d1a1a', color: '#ef9a9a', border: '1px solid #5a2a2a' },
}

function Estrellas({ nivel }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          style={{ color: n <= nivel ? '#ffb300' : '#2a3040', fontSize: '13px' }}
        >
          ★
        </span>
      ))}
    </div>
  )
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
      className="w-11 h-11 bg-[#245c33] flex items-center justify-center text-white font-bold text-sm shrink-0"
      style={{ borderRadius: '3px' }}
    >
      {iniciales}
    </div>
  )
}

export default function TarjetaJugador({ jugador, onEditar, onEliminar }) {
  return (
    <div
      className={`bg-[#1e2435] border-b border-[#242b3d] p-3 flex items-center gap-3 transition-opacity ${
        !jugador.activo ? 'opacity-50' : ''
      }`}
    >
      <Avatar nombre={jugador.nombre} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="font-semibold text-[#e0e6f0] text-sm truncate">
            {jugador.nombre}
          </h3>
          {jugador.uid_firebase && (
            <span title="Cuenta de Google vinculada" style={{ fontSize: '11px' }}>🔗</span>
          )}
          {!jugador.activo && (
            <span
              className="text-[#6b7a8d] bg-[#242b3d] border border-[#2a3040] px-1.5 py-0.5 uppercase font-semibold"
              style={{ fontSize: '9px', letterSpacing: '0.05em', borderRadius: '2px' }}
            >
              inactivo
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <span
            className="text-xs font-semibold uppercase px-1.5 py-0.5"
            style={{
              ...POS_ESTILOS[jugador.posicion_preferida],
              borderRadius: '2px',
              fontSize: '9px',
              letterSpacing: '0.05em',
            }}
          >
            {jugador.posicion_preferida}
          </span>
          <Estrellas nivel={jugador.nivel_general} />
        </div>
      </div>

      <div className="flex gap-0.5 shrink-0">
        <button
          onClick={() => onEditar(jugador)}
          className="p-2 text-[#6b7a8d] hover:text-[#4caf50] transition-colors"
          aria-label="Editar"
        >
          ✏️
        </button>
        <button
          onClick={() => onEliminar(jugador)}
          className="p-2 text-[#6b7a8d] hover:text-[#ef9a9a] transition-colors"
          aria-label="Eliminar"
        >
          🗑️
        </button>
      </div>
    </div>
  )
}
