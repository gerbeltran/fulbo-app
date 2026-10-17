const POSICION_ETIQUETA = {
  ARQ: 'Arquero',
  DEF: 'Defensor',
  MED: 'Mediocampista',
  DEL: 'Delantero',
}

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
      className="w-10 h-10 bg-[#245c33] flex items-center justify-center text-white font-bold text-sm shrink-0"
      style={{ borderRadius: '3px' }}
    >
      {iniciales}
    </div>
  )
}

export default function SelectorJugador({ jugadores, onSeleccionar }) {
  const activos = jugadores.filter((j) => j.activo)

  return (
    <div className="min-h-screen bg-[#1a1f2e] px-4 py-10">
      <div className="text-center mb-8">
        <div className="text-5xl mb-3">⚽</div>
        <h2
          className="font-bold text-[#e0e6f0] uppercase tracking-widest"
          style={{ fontSize: '16px' }}
        >
          ¿Quién sos?
        </h2>
        <p className="text-[#6b7a8d] mt-1 text-sm">
          Elegí tu nombre para continuar
        </p>
      </div>

      <div className="space-y-2 max-w-sm mx-auto">
        {activos.map((jugador) => (
          <button
            key={jugador.id}
            onClick={() => onSeleccionar(jugador.id)}
            className="w-full bg-[#1e2435] border border-[#2a3040] p-3 flex items-center gap-3 hover:border-[#4caf50] transition-all text-left"
            style={{ borderRadius: '4px' }}
          >
            <Avatar nombre={jugador.nombre} />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-[#e0e6f0] truncate text-sm">
                {jugador.nombre}
              </p>
              <div className="flex items-center gap-2 mt-1">
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
                {jugador.es_admin && (
                  <span
                    className="text-[#81c784] bg-[#2d5a3d] border border-[#3d7a4d] px-1.5 py-0.5 uppercase font-semibold"
                    style={{ fontSize: '9px', letterSpacing: '0.05em', borderRadius: '2px' }}
                  >
                    Admin
                  </span>
                )}
              </div>
            </div>
            <span className="text-[#4caf50] text-sm font-bold">›</span>
          </button>
        ))}

        {activos.length === 0 && (
          <p className="text-center text-[#6b7a8d] py-8 text-sm">
            No hay jugadores activos todavía.
          </p>
        )}
      </div>
    </div>
  )
}
