import { useState } from 'react'

const CAMPOS_ESTADISTICAS = [
  { campo: 'partidos_jugados', etiqueta: 'Partidos jugados' },
  { campo: 'partidos_ganados', etiqueta: 'Ganados' },
  { campo: 'partidos_empatados', etiqueta: 'Empatados' },
  { campo: 'partidos_perdidos', etiqueta: 'Perdidos' },
]

// Admin: corrige a mano las estadísticas de un jugador
// (ej: partidos jugados antes de usar la app, o un cierre mal cargado)
export default function ModalEstadisticasJugador({ jugador, onGuardar, onCancelar }) {
  const [valores, setValores] = useState(() =>
    Object.fromEntries(CAMPOS_ESTADISTICAS.map(({ campo }) => [campo, String(jugador[campo] ?? 0)]))
  )
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  async function handleGuardar(e) {
    e.preventDefault()
    const numeros = Object.fromEntries(
      Object.entries(valores).map(([campo, texto]) => [campo, Number(texto)])
    )
    if (Object.entries(valores).some(([campo, texto]) =>
      texto === '' || !Number.isInteger(numeros[campo]) || numeros[campo] < 0
    )) {
      setError('Usá números enteros, 0 o más.')
      return
    }
    const resultados = numeros.partidos_ganados + numeros.partidos_empatados + numeros.partidos_perdidos
    if (resultados > numeros.partidos_jugados) {
      setError('Ganados + empatados + perdidos no puede superar los partidos jugados.')
      return
    }
    setError('')
    setGuardando(true)
    try {
      await onGuardar(numeros)
    } catch (err) {
      console.error(err)
      setError('No se pudieron guardar las estadísticas.')
      setGuardando(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-50 sm:p-4">
      <form
        onSubmit={handleGuardar}
        className="bg-card border border-white/[0.08] w-full sm:max-w-sm rounded-t-xl sm:rounded-xl p-5"
      >
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-bold text-[#F0F6FC] uppercase tracking-wider" style={{ fontSize: '13px' }}>
            Editar estadísticas
          </h2>
          <button
            type="button"
            onClick={onCancelar}
            disabled={guardando}
            className="p-1.5 text-[#7D8590] hover:text-[#F0F6FC] transition-colors"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>
        <p className="text-[#8B949E] text-sm mb-4">{jugador.nombre}</p>

        <div className="grid grid-cols-2 gap-3 mb-4">
          {CAMPOS_ESTADISTICAS.map(({ campo, etiqueta }) => (
            <div key={campo}>
              <label className="block text-xs font-medium text-[#8B949E] mb-1">{etiqueta}</label>
              <input
                type="number"
                inputMode="numeric"
                min="0"
                value={valores[campo]}
                onChange={(e) => setValores((prev) => ({ ...prev, [campo]: e.target.value }))}
                className="w-full bg-dark border border-white/[0.08] rounded-xl px-3 py-2 text-[#F0F6FC] font-semibold focus:outline-none focus:ring-2 focus:ring-[#00E676] focus:border-transparent"
              />
            </div>
          ))}
        </div>

        {error && <p className="text-[#F87171] text-xs mb-3 text-center">{error}</p>}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancelar}
            disabled={guardando}
            className="flex-1 btn-secundario py-2.5 text-sm disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={guardando}
            className="flex-1 btn-primario py-2.5 text-sm disabled:opacity-50"
          >
            {guardando ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </form>
    </div>
  )
}
