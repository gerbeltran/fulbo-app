import { useState } from 'react'

const POS_COLOR = { ARQ: '#ffcc80', DEF: '#69F0AE', MED: '#90caf9', DEL: '#F87171' }

const GRUPOS = [
  { clave: 'equipo1', titulo: 'Equipo 1', color: 'text-[#60a5fa]', punto: 'bg-[#3B82F6]' },
  { clave: 'equipo2', titulo: 'Equipo 2', color: 'text-[#f87171]', punto: 'bg-[#EF4444]' },
  { clave: 'sinEquipo', titulo: 'Sin equipo', color: 'text-[#8B949E]', punto: 'bg-[#8B949E]' },
]

const nivelTotal = (jugadores) => jugadores.reduce((s, j) => s + (j.nivel_general ?? 0), 0)

function FilaJugador({ jugador, seleccionado, seBajo, onTocar }) {
  return (
    <button
      type="button"
      onClick={onTocar}
      className={`w-full flex items-center gap-2 rounded-lg px-2.5 py-2 border text-left transition-all duration-150 ${
        seleccionado
          ? 'bg-neon/15 border-neon shadow-[0_0_12px_rgba(0,230,118,0.3)]'
          : 'bg-dark border-white/[0.08] hover:border-white/[0.2]'
      }`}
    >
      <span className="font-bold shrink-0" style={{ color: POS_COLOR[jugador.posicion_preferida], fontSize: '10px' }}>
        {jugador.posicion_preferida}
      </span>
      <span className="flex-1 min-w-0 text-sm text-[#F0F6FC] truncate">{jugador.nombre}</span>
      {seBajo && (
        <span className="shrink-0 text-[#F87171] border border-red-500/40 rounded px-1" style={{ fontSize: '9px' }}>
          SE BAJÓ
        </span>
      )}
      <span className="shrink-0 text-[#ffb300] font-semibold" style={{ fontSize: '11px' }}>★{jugador.nivel_general ?? 0}</span>
    </button>
  )
}

// Admin: cambia jugadores de equipo tocando (sin drag & drop).
// Tocás un jugador y después otro de otro grupo para intercambiarlos,
// o usás los botones para moverlo a un equipo o sacarlo.
export default function ModalEditarEquipos({ equipo, titularesIds, jugadoresPorId, estado, onGuardar, onCancelar }) {
  const [grupos, setGrupos] = useState(() => {
    const e1 = equipo.equipo1.map((j) => j.id)
    const e2 = equipo.equipo2.map((j) => j.id)
    return {
      equipo1: e1,
      equipo2: e2,
      // Titulares que no están en ningún equipo (ej: un suplente que subió)
      sinEquipo: titularesIds.filter((id) => !e1.includes(id) && !e2.includes(id)),
    }
  })
  const [seleccionado, setSeleccionado] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  const aJugador = (id) =>
    jugadoresPorId[id] ??
    [...equipo.equipo1, ...equipo.equipo2].find((j) => j.id === id) ??
    { id, nombre: 'Jugador eliminado' }
  const grupoDe = (id) => Object.keys(grupos).find((g) => grupos[g].includes(id))

  const original = JSON.stringify([equipo.equipo1.map((j) => j.id), equipo.equipo2.map((j) => j.id)])
  const huboCambios = JSON.stringify([grupos.equipo1, grupos.equipo2]) !== original

  function tocar(id) {
    if (!seleccionado || seleccionado === id) {
      setSeleccionado(seleccionado === id ? null : id)
      return
    }
    const g1 = grupoDe(seleccionado)
    const g2 = grupoDe(id)
    if (g1 === g2) {
      setSeleccionado(id)
      return
    }
    // Intercambio: cada uno ocupa el lugar del otro
    setGrupos((prev) => ({
      ...prev,
      [g1]: prev[g1].map((x) => (x === seleccionado ? id : x)),
      [g2]: prev[g2].map((x) => (x === id ? seleccionado : x)),
    }))
    setSeleccionado(null)
  }

  function mover(destino) {
    const origen = grupoDe(seleccionado)
    if (!origen || origen === destino) return
    setGrupos((prev) => ({
      ...prev,
      [origen]: prev[origen].filter((x) => x !== seleccionado),
      [destino]: [...prev[destino], seleccionado],
    }))
    setSeleccionado(null)
  }

  async function handleGuardar() {
    setGuardando(true)
    setError('')
    try {
      await onGuardar(grupos.equipo1.map(aJugador), grupos.equipo2.map(aJugador))
    } catch (err) {
      console.error(err)
      setError('No se pudieron guardar los equipos. Intentá de nuevo.')
      setGuardando(false)
    }
  }

  const n1 = grupos.equipo1.length
  const n2 = grupos.equipo2.length
  const niv1 = nivelTotal(grupos.equipo1.map(aJugador))
  const niv2 = nivelTotal(grupos.equipo2.map(aJugador))
  const grupoSeleccionado = seleccionado && grupoDe(seleccionado)

  return (
    <div className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-50 sm:p-4">
      <div className="bg-card border border-white/[0.08] w-full sm:max-w-lg rounded-t-xl sm:rounded-xl p-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-bold text-[#F0F6FC] uppercase tracking-wider" style={{ fontSize: '13px' }}>
            Cambiar jugadores de equipo
          </h2>
          <button
            onClick={onCancelar}
            disabled={guardando}
            className="p-1.5 text-[#7D8590] hover:text-[#F0F6FC] transition-colors"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>
        <p className="text-[#7D8590] text-xs mb-3">
          Tocá un jugador y después otro de otro equipo para intercambiarlos.
        </p>

        {/* Balance */}
        <div className="flex items-center justify-between text-xs rounded-lg bg-white/[0.04] border border-white/[0.06] px-3 py-2 mb-3">
          <span className="text-[#60a5fa] font-semibold">{n1} jug · {niv1} pts</span>
          <span className={niv1 === niv2 ? 'text-[#00E676] font-semibold' : 'text-[#8B949E]'}>
            Dif. {Math.abs(niv1 - niv2)} pts
          </span>
          <span className="text-[#f87171] font-semibold">{n2} jug · {niv2} pts</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {GRUPOS.map(({ clave, titulo, color, punto }) => {
            if (clave === 'sinEquipo' && grupos.sinEquipo.length === 0) return null
            return (
              <div key={clave} className={clave === 'sinEquipo' ? 'col-span-2' : ''}>
                <p className={`flex items-center gap-1.5 text-xs font-semibold mb-1.5 ${color}`}>
                  <span className={`w-2 h-2 rounded-full ${punto}`} />
                  {titulo}
                </p>
                <div className={clave === 'sinEquipo' ? 'grid grid-cols-2 gap-1.5' : 'space-y-1.5'}>
                  {grupos[clave].map((id) => (
                    <FilaJugador
                      key={id}
                      jugador={aJugador(id)}
                      seleccionado={seleccionado === id}
                      seBajo={clave !== 'sinEquipo' && !titularesIds.includes(id)}
                      onTocar={() => tocar(id)}
                    />
                  ))}
                  {grupos[clave].length === 0 && (
                    <p className="text-[#7D8590] text-xs italic py-2">Vacío</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Acciones sobre el seleccionado */}
        {seleccionado && (
          <div className="flex flex-wrap gap-2 mt-3">
            {grupoSeleccionado !== 'equipo1' && (
              <button onClick={() => mover('equipo1')} className="flex-1 py-2 rounded-lg text-xs font-semibold border border-[#3B82F6]/50 text-[#60a5fa] hover:bg-[#3B82F6]/10">
                Pasar a Equipo 1
              </button>
            )}
            {grupoSeleccionado !== 'equipo2' && (
              <button onClick={() => mover('equipo2')} className="flex-1 py-2 rounded-lg text-xs font-semibold border border-[#EF4444]/50 text-[#f87171] hover:bg-[#EF4444]/10">
                Pasar a Equipo 2
              </button>
            )}
            {grupoSeleccionado !== 'sinEquipo' && (
              <button onClick={() => mover('sinEquipo')} className="flex-1 py-2 rounded-lg text-xs font-semibold border border-white/[0.12] text-[#8B949E] hover:bg-white/[0.04]">
                Sacar del equipo
              </button>
            )}
          </div>
        )}

        {Math.abs(n1 - n2) > 1 && (
          <p className="text-[#f59e0b] text-xs mt-3 text-center">
            Ojo: los equipos quedan desparejos ({n1} vs {n2}).
          </p>
        )}
        {estado === 'votando' && huboCambios && (
          <p className="text-[#7D8590] text-xs mt-2 text-center">
            Como cambia la propuesta, se borran los votos que ya tenía.
          </p>
        )}
        {error && <p className="text-[#F87171] text-xs mt-2 text-center">{error}</p>}

        <div className="flex gap-2 mt-4">
          <button
            onClick={onCancelar}
            disabled={guardando}
            className="flex-1 btn-secundario py-2.5 text-sm disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleGuardar}
            disabled={guardando || !huboCambios || n1 === 0 || n2 === 0}
            className="flex-1 btn-primario py-2.5 text-sm disabled:opacity-50"
          >
            {guardando ? 'Guardando...' : 'Guardar equipos'}
          </button>
        </div>
      </div>
    </div>
  )
}
