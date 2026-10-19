import { useState } from 'react'

// Grupo de jugadores con su checkbox "¿Asistió?"
function GrupoAsistencia({ titulo, jugadores, asistencias, onCambiar }) {
  if (jugadores.length === 0) return null
  return (
    <div>
      <p className="text-xs font-semibold text-[#8B949E] uppercase tracking-wide mb-1.5">{titulo}</p>
      <ul className="space-y-1">
        {jugadores.map((j) => (
          <li key={j.id}>
            <label className="flex items-center gap-3 bg-dark border border-white/[0.08] rounded-lg px-3 py-2 cursor-pointer hover:border-white/[0.15] transition-colors">
              <input
                type="checkbox"
                checked={!!asistencias[j.id]}
                onChange={(e) => onCambiar(j.id, e.target.checked)}
                className="w-4 h-4 accent-[#00E676] shrink-0"
              />
              <span className={`flex-1 text-sm truncate ${asistencias[j.id] ? 'text-[#F0F6FC]' : 'text-[#7D8590] line-through'}`}>
                {j.nombre}
              </span>
              <span className="text-[#7D8590]" style={{ fontSize: '11px' }}>¿Asistió?</span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  )
}

function CampoGoles({ etiqueta, valor, onCambiar }) {
  return (
    <div className="flex-1">
      <label className="block text-xs font-medium text-[#8B949E] mb-1 text-center">{etiqueta}</label>
      <input
        type="number"
        inputMode="numeric"
        min="0"
        max="99"
        value={valor}
        onChange={(e) => onCambiar(e.target.value)}
        placeholder="0"
        className="w-full bg-dark border border-white/[0.08] rounded-xl px-3 py-3 text-center text-2xl font-extrabold text-[#F0F6FC] focus:outline-none focus:ring-2 focus:ring-[#00E676] focus:border-transparent"
      />
    </div>
  )
}

// Admin: resultado + asistencia real. Al confirmar, el partido queda 'jugado'
// y se abre la votación MVP.
export default function ModalCerrarPartido({ equipo, titulares, suplentes, jugadoresPorId, onConfirmar, onCancelar }) {
  const aJugador = (id) => jugadoresPorId[id] ?? { id, nombre: 'Jugador eliminado' }
  const idsEquipo1 = (equipo?.equipo1 ?? []).map((j) => j.id)
  const idsEquipo2 = (equipo?.equipo2 ?? []).map((j) => j.id)
  const idsTitulares = [...new Set(titulares.map((p) => p.jugador_id))]
  const idsSuplentes = [...new Set(suplentes.map((p) => p.jugador_id))]
  const otrosTitulares = idsTitulares.filter((id) => !idsEquipo1.includes(id) && !idsEquipo2.includes(id))

  // Por defecto asistieron los titulares actuales. Los suplentes y quien se bajó
  // después de armar los equipos (sigue en la lista de su equipo) arrancan sin tildar.
  const [asistencias, setAsistencias] = useState(() =>
    Object.fromEntries(
      [...idsEquipo1, ...idsEquipo2, ...idsSuplentes, ...idsTitulares].map((id) => [id, idsTitulares.includes(id)])
    )
  )
  const [goles1, setGoles1] = useState('')
  const [goles2, setGoles2] = useState('')
  const [cerrando, setCerrando] = useState(false)
  const [error, setError] = useState('')

  function cambiarAsistencia(id, asistio) {
    setAsistencias((prev) => ({ ...prev, [id]: asistio }))
  }

  async function handleConfirmar() {
    const g1 = Number(goles1)
    const g2 = Number(goles2)
    const valido = (texto, n) => texto !== '' && Number.isInteger(n) && n >= 0 && n <= 99
    if (!valido(goles1, g1) || !valido(goles2, g2)) {
      setError('Cargá los goles de los dos equipos (números enteros, 0 o más).')
      return
    }
    setError('')
    setCerrando(true)
    try {
      await onConfirmar({ golesEquipo1: g1, golesEquipo2: g2, asistencias })
    } catch (err) {
      console.error(err)
      setError(err.message === 'El partido ya fue cerrado.' ? err.message : 'No se pudo cerrar el partido. Intentá de nuevo.')
      setCerrando(false)
    }
  }

  const cantidadAsistieron = Object.values(asistencias).filter(Boolean).length

  return (
    <div className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-50 sm:p-4">
      <div className="bg-card border border-white/[0.08] w-full sm:max-w-md rounded-t-xl sm:rounded-xl p-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-[#F0F6FC] uppercase tracking-wider" style={{ fontSize: '13px' }}>
            Cerrar partido
          </h2>
          <button
            onClick={onCancelar}
            disabled={cerrando}
            className="p-1.5 text-[#7D8590] hover:text-[#F0F6FC] transition-colors"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        {/* Resultado */}
        <div className="flex items-end gap-3 mb-5">
          <CampoGoles etiqueta="Equipo 1" valor={goles1} onCambiar={setGoles1} />
          <span className="text-[#7D8590] text-xl font-bold pb-3">–</span>
          <CampoGoles etiqueta="Equipo 2" valor={goles2} onCambiar={setGoles2} />
        </div>

        {/* Asistencia */}
        <div className="space-y-3 mb-4">
          <GrupoAsistencia titulo="Equipo 1" jugadores={idsEquipo1.map(aJugador)} asistencias={asistencias} onCambiar={cambiarAsistencia} />
          <GrupoAsistencia titulo="Equipo 2" jugadores={idsEquipo2.map(aJugador)} asistencias={asistencias} onCambiar={cambiarAsistencia} />
          <GrupoAsistencia titulo="Otros confirmados" jugadores={otrosTitulares.map(aJugador)} asistencias={asistencias} onCambiar={cambiarAsistencia} />
          <GrupoAsistencia titulo="Suplentes (tildá si jugaron)" jugadores={idsSuplentes.map(aJugador)} asistencias={asistencias} onCambiar={cambiarAsistencia} />
        </div>

        <p className="text-[#7D8590] text-xs mb-3">
          {cantidadAsistieron} jugador{cantidadAsistieron !== 1 ? 'es' : ''} suman el partido a sus estadísticas.
          Después de cerrarlo no se puede reabrir, y se abre la votación MVP por 24 hs.
        </p>

        {error && <p className="text-[#F87171] text-xs mb-3 text-center">{error}</p>}

        <button
          onClick={handleConfirmar}
          disabled={cerrando}
          className="w-full bg-neon text-dark font-bold py-2.5 rounded-xl text-sm hover:shadow-[0_0_18px_rgba(0,230,118,0.45)] hover:brightness-110 disabled:opacity-50 transition-all"
        >
          {cerrando ? 'Cerrando...' : 'Confirmar y cerrar partido'}
        </button>
      </div>
    </div>
  )
}
