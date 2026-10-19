import { useEffect, useState } from 'react'
import { useEstadisticas } from '../hooks/useEstadisticas'

const MEDALLAS = ['🥇', '🥈', '🥉']

function Avatar({ jugador }) {
  if (jugador.foto_url) {
    return <img src={jugador.foto_url} alt="" className="w-10 h-10 rounded-full object-cover border border-neon/40 shrink-0" />
  }
  const iniciales = jugador.nombre.split(' ').slice(0, 2).map((p) => p[0]).join('').toUpperCase()
  return (
    <div className="w-10 h-10 rounded-full bg-neon/10 border border-neon/40 flex items-center justify-center text-neon font-bold text-xs shrink-0">
      {iniciales}
    </div>
  )
}

// Detalle de un jugador al tocarlo en el ranking
function DetalleJugador({ jugador, mvps }) {
  const datos = [
    { etiqueta: 'Jugados', valor: jugador.partidos_jugados ?? 0, color: 'text-texto' },
    { etiqueta: 'Ganados', valor: jugador.partidos_ganados ?? 0, color: 'text-neon' },
    { etiqueta: 'Empatados', valor: jugador.partidos_empatados ?? 0, color: 'text-texto-sec' },
    { etiqueta: 'Perdidos', valor: jugador.partidos_perdidos ?? 0, color: 'text-red-400' },
    { etiqueta: 'MVP', valor: mvps, color: 'text-gold', icono: '🏆' },
  ]
  return (
    <div className="grid grid-cols-5 gap-1.5 px-3 pb-3 pt-1">
      {datos.map((d) => (
        <div key={d.etiqueta} className="rounded-lg bg-dark/60 border border-white/[0.06] py-2 text-center">
          <p className={`font-extrabold text-lg leading-none ${d.color}`}>
            {d.icono && <span className="text-xs mr-0.5">{d.icono}</span>}{d.valor}
          </p>
          <p className="text-texto-sec mt-1" style={{ fontSize: '10px' }}>{d.etiqueta}</p>
        </div>
      ))}
    </div>
  )
}

export default function PaginaStats({ grupoId, jugadores = [], onRecargarJugadores }) {
  const { mvps, partidosJugados, ranking, cargando, error, cargar } = useEstadisticas(grupoId)
  const filas = ranking(jugadores.filter((j) => j.activo))
  const maximo = Math.max(1, ...filas.map((f) => f.partidos))
  const [abiertoId, setAbiertoId] = useState(null)

  // Las estadísticas viven en cada jugador: al entrar se traen actualizadas
  useEffect(() => {
    onRecargarJugadores?.()
  }, [])

  function actualizar() {
    onRecargarJugadores?.()
    cargar()
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-4">
      <div className="tarjeta-vidrio p-4 sm:p-5">
        <div className="flex items-start justify-between gap-2 mb-4">
          <div>
            <h2 className="font-extrabold text-texto text-xl flex items-center gap-2">
              <span>👟</span> Top presencias
            </h2>
            <p className="text-texto-sec text-sm mt-0.5">Los que más partidos jugaron</p>
          </div>
          <button
            onClick={actualizar}
            disabled={cargando}
            className="btn-secundario px-3 py-1.5 text-xs shrink-0 disabled:opacity-50"
          >
            {cargando ? 'Cargando...' : '↻ Actualizar'}
          </button>
        </div>

        {error ? (
          <p className="text-red-400 text-sm text-center py-8">{error}</p>
        ) : cargando ? (
          <div className="space-y-2">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-14 rounded-lg bg-white/[0.04] animate-pulse" />
            ))}
          </div>
        ) : filas.length === 0 ? (
          <p className="text-texto-sec text-sm text-center py-8">Todavía no hay jugadores.</p>
        ) : (
          <>
            <ol className="space-y-2">
              {filas.map(({ jugador, partidos }, i) => (
                <li
                  key={jugador.id}
                  className={`rounded-lg border ${
                    i < 3 && partidos > 0 ? 'bg-neon/[0.06] border-neon/20' : 'bg-white/[0.03] border-white/[0.06]'
                  }`}
                >
                  <button
                    onClick={() => setAbiertoId(abiertoId === jugador.id ? null : jugador.id)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-left"
                    aria-expanded={abiertoId === jugador.id}
                  >
                    <span className="w-7 text-center text-lg shrink-0">
                      {i < 3 && partidos > 0 ? MEDALLAS[i] : <span className="text-texto-sec text-sm font-bold">{i + 1}</span>}
                    </span>
                    <Avatar jugador={jugador} />
                    <div className="flex-1 min-w-0">
                      <p className="text-texto font-semibold text-sm truncate">{jugador.nombre}</p>
                      <div className="h-1.5 mt-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-neon"
                          style={{ width: `${(partidos / maximo) * 100}%`, boxShadow: '0 0 8px rgba(0,230,118,0.5)' }}
                        />
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-texto font-extrabold text-lg leading-none">{partidos}</p>
                      <p className="text-texto-sec" style={{ fontSize: '10px' }}>
                        partido{partidos !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </button>
                  {abiertoId === jugador.id && <DetalleJugador jugador={jugador} mvps={mvps[jugador.id] ?? 0} />}
                </li>
              ))}
            </ol>
            <p className="text-texto-sec text-xs mt-4">
              {partidosJugados} partido{partidosJugados !== 1 ? 's' : ''} jugado{partidosJugados !== 1 ? 's' : ''} en el grupo.
              Cuenta los partidos cerrados por el admin en los que el jugador asistió.
              Tocá un jugador para ver su detalle.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
