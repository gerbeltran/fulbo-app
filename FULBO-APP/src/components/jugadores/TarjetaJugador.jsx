const POS_ESTILOS = {
  ARQ: { background: '#3d2a00', color: '#ffcc80', border: '1px solid #5a3d00' },
  DEF: { background: '#1a2a1a', color: '#69F0AE', border: '1px solid #2a4a2a' },
  MED: { background: '#1a2d3d', color: '#90caf9', border: '1px solid #1e3d5a' },
  DEL: { background: '#3d1a1a', color: '#F87171', border: '1px solid #5a2a2a' },
}

function Estrellas({ nivel }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          style={{ color: n <= nivel ? '#ffb300' : 'rgba(255,255,255,0.14)', fontSize: '13px' }}
        >
          ★
        </span>
      ))}
    </div>
  )
}

function Avatar({ nombre, foto }) {
  if (foto) {
    return (
      <img
        src={foto}
        alt=""
        className="w-14 h-14 rounded-full object-cover border-2 border-neon/50 shrink-0"
        style={{ boxShadow: '0 0 14px rgba(0,230,118,0.2)' }}
      />
    )
  }
  const iniciales = nombre
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase()
  return (
    <div
      className="w-14 h-14 rounded-full bg-neon/10 border-2 border-neon/50 flex items-center justify-center text-neon font-extrabold text-base shrink-0"
      style={{ boxShadow: '0 0 14px rgba(0,230,118,0.2)' }}
    >
      {iniciales}
    </div>
  )
}

// onEditarEstadisticas: solo lo recibe el admin
export default function TarjetaJugador({ jugador, onEditar, onEliminar, onEditarEstadisticas }) {
  return (
    <div
      className={`tarjeta-vidrio relative px-3 pb-4 pt-9 flex flex-col items-center text-center transition-all duration-200 hover:border-neon/30 ${
        !jugador.activo ? 'opacity-50' : ''
      }`}
    >
      {/* Acciones */}
      <div className="absolute top-1.5 right-1.5 flex">
        <button
          onClick={() => onEditar(jugador)}
          className="p-1.5 text-sm opacity-70 hover:opacity-100 transition-all duration-200"
          aria-label="Editar"
        >
          ✏️
        </button>
        <button
          onClick={() => onEliminar(jugador)}
          className="p-1.5 text-sm opacity-70 hover:opacity-100 transition-all duration-200"
          aria-label="Eliminar"
        >
          🗑️
        </button>
      </div>

      <Avatar nombre={jugador.nombre} foto={jugador.foto_url} />

      <h3 className="mt-2 font-bold text-texto text-sm leading-tight line-clamp-2 break-words w-full">
        {jugador.nombre}
        {jugador.uid_firebase && (
          <span title="Cuenta de Google vinculada" className="ml-1" style={{ fontSize: '11px' }}>🔗</span>
        )}
      </h3>

      <div className="flex items-center gap-1.5 mt-2 flex-wrap justify-center">
        <span
          className="font-bold uppercase px-2 py-0.5"
          style={{
            ...POS_ESTILOS[jugador.posicion_preferida],
            borderRadius: '6px',
            fontSize: '10px',
            letterSpacing: '0.05em',
          }}
        >
          {jugador.posicion_preferida}
        </span>
        {!jugador.activo && (
          <span
            className="text-texto-sec bg-white/[0.04] border border-white/[0.08] px-1.5 py-0.5 uppercase font-semibold"
            style={{ fontSize: '9px', letterSpacing: '0.05em', borderRadius: '6px' }}
          >
            inactivo
          </span>
        )}
      </div>

      <div className="mt-2">
        <Estrellas nivel={jugador.nivel_general} />
      </div>

      {/* PJ · G · E · P */}
      <p className="mt-2 text-texto-sec tabular-nums" style={{ fontSize: '11px' }}>
        <span className="text-texto font-semibold">{jugador.partidos_jugados ?? 0}</span> PJ ·{' '}
        <span className="text-neon">{jugador.partidos_ganados ?? 0}</span> G ·{' '}
        {jugador.partidos_empatados ?? 0} E ·{' '}
        <span className="text-red-400">{jugador.partidos_perdidos ?? 0}</span> P
      </p>

      {onEditarEstadisticas && (
        <button
          onClick={() => onEditarEstadisticas(jugador)}
          className="mt-2 text-texto-sec hover:text-neon transition-colors"
          style={{ fontSize: '11px' }}
        >
          ✏️ Editar estadísticas
        </button>
      )}
    </div>
  )
}
