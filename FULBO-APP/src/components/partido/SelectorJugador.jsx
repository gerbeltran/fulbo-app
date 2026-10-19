const POSICION_ETIQUETA = {
  ARQ: 'Arquero',
  DEF: 'Defensor',
  MED: 'Mediocampista',
  DEL: 'Delantero',
}

const POS_ESTILOS = {
  ARQ: { background: '#3d2a00', color: '#ffcc80', border: '1px solid #5a3d00' },
  DEF: { background: '#1a2a1a', color: '#69F0AE', border: '1px solid #2a4a2a' },
  MED: { background: '#1a2d3d', color: '#90caf9', border: '1px solid #1e3d5a' },
  DEL: { background: '#3d1a1a', color: '#F87171', border: '1px solid #5a2a2a' },
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
      className="w-10 h-10 bg-neon/15 border border-neon/40 flex items-center justify-center text-neon font-bold text-sm shrink-0"
      style={{ borderRadius: '8px' }}
    >
      {iniciales}
    </div>
  )
}

export default function SelectorJugador({ jugadores, onSeleccionar }) {
  const activos = jugadores.filter((j) => j.activo)

  return (
    <div className="min-h-screen bg-dark px-4 py-10">
      <div className="text-center mb-8">
        <div className="text-5xl mb-3">⚽</div>
        <h2
          className="font-bold text-[#F0F6FC] uppercase tracking-widest"
          style={{ fontSize: '16px' }}
        >
          ¿Quién sos?
        </h2>
        <p className="text-[#7D8590] mt-1 text-sm">
          Elegí tu nombre para continuar
        </p>
      </div>

      <div className="space-y-2 max-w-sm mx-auto">
        {activos.map((jugador) => (
          <button
            key={jugador.id}
            onClick={() => onSeleccionar(jugador.id)}
            className="w-full bg-card border border-white/[0.08] p-3 flex items-center gap-3 hover:border-[#00E676] transition-all text-left"
            style={{ borderRadius: '12px' }}
          >
            <Avatar nombre={jugador.nombre} />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-[#F0F6FC] truncate text-sm">
                {jugador.nombre}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className="text-xs font-semibold uppercase px-1.5 py-0.5"
                  style={{
                    ...POS_ESTILOS[jugador.posicion_preferida],
                    borderRadius: '6px',
                    fontSize: '9px',
                    letterSpacing: '0.05em',
                  }}
                >
                  {jugador.posicion_preferida}
                </span>
                {jugador.es_admin && (
                  <span
                    className="text-[#00E676] bg-neon/15 border border-neon/40 px-1.5 py-0.5 uppercase font-semibold"
                    style={{ fontSize: '9px', letterSpacing: '0.05em', borderRadius: '6px' }}
                  >
                    Admin
                  </span>
                )}
              </div>
            </div>
            <span className="text-[#00E676] text-sm font-bold">›</span>
          </button>
        ))}

        {activos.length === 0 && (
          <p className="text-center text-[#7D8590] py-8 text-sm">
            No hay jugadores activos todavía.
          </p>
        )}
      </div>
    </div>
  )
}
