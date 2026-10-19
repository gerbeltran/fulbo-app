import { useEffect, useState } from 'react'
import { CUPO_POR_DEFECTO } from '../../utils/suplentes'

const DIAS = [
  { valor: 1, etiqueta: 'Lun' },
  { valor: 2, etiqueta: 'Mar' },
  { valor: 3, etiqueta: 'Mié' },
  { valor: 4, etiqueta: 'Jue' },
  { valor: 5, etiqueta: 'Vie' },
]

const hoy = new Date().toISOString().split('T')[0]

// Contador − / + para el cupo (mínimo 2, máximo 30)
function SelectorCupo({ valor, onCambiar }) {
  const estiloBoton =
    'w-9 h-9 bg-dark border border-white/[0.08] rounded-xl text-[#F0F6FC] text-lg hover:border-[#00E676] disabled:opacity-40 transition-colors'
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onCambiar(Math.max(2, valor - 1))}
        disabled={valor <= 2}
        className={estiloBoton}
        aria-label="Restar un lugar"
      >
        −
      </button>
      <span className="min-w-[3ch] text-center text-[#F0F6FC] font-semibold">{valor}</span>
      <button
        type="button"
        onClick={() => onCambiar(Math.min(30, valor + 1))}
        disabled={valor >= 30}
        className={estiloBoton}
        aria-label="Sumar un lugar"
      >
        +
      </button>
      <span className="text-xs text-[#7D8590]">({Math.floor(valor / 2)} vs {Math.ceil(valor / 2)})</span>
    </div>
  )
}

export default function PanelAdmin({
  partido,
  config,
  deberiaAbrirSchedule,
  onAbrirConvocatoria,
  onReabrirConvocatoria,
  onCerrarConvocatoria,
  onBorrarConvocatoria,
  onGuardarConfig,
  onCambiarCupo,
  onAbrirCierrePartido,
}) {
  const [formPartido, setFormPartido] = useState({
    fecha: hoy,
    hora: '21:00',
    lugar: '',
    cupo: CUPO_POR_DEFECTO,
  })
  const [abriendo, setAbriendo] = useState(false)
  const [errorForm, setErrorForm] = useState('')

  const [mostrandoConfig, setMostrandoConfig] = useState(false)
  const [formConfig, setFormConfig] = useState({
    activa: config?.activa ?? false,
    dia_semana: config?.dia_semana ?? 3,
    hora_apertura: config?.hora_apertura ?? '20:00',
  })
  const [guardandoConfig, setGuardandoConfig] = useState(false)

  const [cupoEditado, setCupoEditado] = useState(partido?.cupo_maximo ?? CUPO_POR_DEFECTO)
  const [guardandoCupo, setGuardandoCupo] = useState(false)

  // Al crear o recargar el partido, el editor arranca con su cupo real
  useEffect(() => {
    if (partido?.cupo_maximo) setCupoEditado(partido.cupo_maximo)
  }, [partido?.id, partido?.cupo_maximo])

  const [confirmarBorrar, setConfirmarBorrar] = useState(false)
  const [borrando, setBorrando] = useState(false)

  async function handleAbrir(e) {
    e.preventDefault()
    if (!formPartido.lugar.trim()) {
      setErrorForm('El lugar es obligatorio.')
      return
    }
    setErrorForm('')
    setAbriendo(true)
    try {
      await onAbrirConvocatoria(formPartido)
    } finally {
      setAbriendo(false)
    }
  }

  async function handleGuardarCupo() {
    setGuardandoCupo(true)
    try {
      await onCambiarCupo(cupoEditado)
    } finally {
      setGuardandoCupo(false)
    }
  }

  async function handleGuardarConfig() {
    setGuardandoConfig(true)
    try {
      await onGuardarConfig(formConfig)
      setMostrandoConfig(false)
    } finally {
      setGuardandoConfig(false)
    }
  }

  async function handleBorrar() {
    setBorrando(true)
    try {
      await onBorrarConvocatoria()
      setConfirmarBorrar(false)
    } finally {
      setBorrando(false)
    }
  }

  function BtnBorrar() {
    if (confirmarBorrar) {
      return (
        <div className="bg-red-500/10 border border-red-500/40 rounded-xl p-3 space-y-2">
          <p className="text-sm text-[#F87171] font-medium text-center">
            ¿Borrar la convocatoria y todos sus datos?
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setConfirmarBorrar(false)}
              disabled={borrando}
              className="flex-1 py-2 border border-white/[0.08] text-[#8B949E] rounded-xl text-sm font-medium hover:bg-white/[0.04] disabled:opacity-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleBorrar}
              disabled={borrando}
              className="flex-1 py-2 bg-red-500/20 border border-red-500/50 text-white rounded-xl text-sm font-semibold hover:bg-red-500/30 disabled:opacity-50 transition-colors"
            >
              {borrando ? 'Borrando...' : 'Sí, borrar'}
            </button>
          </div>
        </div>
      )
    }
    return (
      <button
        onClick={() => setConfirmarBorrar(true)}
        className="w-full border border-red-500/40 text-[#F87171] py-2 rounded-xl text-sm font-medium hover:bg-red-500/10 transition-colors"
      >
        🗑️ Borrar convocatoria
      </button>
    )
  }

  return (
    <div className="p-4 space-y-3">

      {/* ── Sin partido activo: formulario para crear convocatoria ── */}
      {!partido && (
        <div className="space-y-3">
          {deberiaAbrirSchedule && (
            <div className="bg-neon/10 text-[#00E676] text-xs px-3 py-2 rounded-lg font-medium border border-neon/25">
              Es la hora programada de apertura.
            </div>
          )}

          <form onSubmit={handleAbrir} className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-[#8B949E] mb-1">
                  Fecha del partido
                </label>
                <input
                  type="date"
                  value={formPartido.fecha}
                  min={hoy}
                  onChange={(e) =>
                    setFormPartido((prev) => ({ ...prev, fecha: e.target.value }))
                  }
                  className="w-full bg-dark border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-[#F0F6FC] focus:outline-none focus:ring-2 focus:ring-[#00E676] focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#8B949E] mb-1">
                  Hora del partido
                </label>
                <input
                  type="time"
                  value={formPartido.hora}
                  onChange={(e) =>
                    setFormPartido((prev) => ({ ...prev, hora: e.target.value }))
                  }
                  className="w-full bg-dark border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-[#F0F6FC] focus:outline-none focus:ring-2 focus:ring-[#00E676] focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#8B949E] mb-1">
                Lugar
              </label>
              <input
                type="text"
                value={formPartido.lugar}
                onChange={(e) =>
                  setFormPartido((prev) => ({ ...prev, lugar: e.target.value }))
                }
                placeholder="Ej: Complejo La Cancha, Cancha 3"
                className="w-full bg-dark border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-[#F0F6FC] placeholder-[#4a5568] focus:outline-none focus:ring-2 focus:ring-[#00E676] focus:border-transparent"
              />
              {errorForm && (
                <p className="text-[#F87171] text-xs mt-1">{errorForm}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-[#8B949E] mb-1">
                Cupo máximo de jugadores
              </label>
              <SelectorCupo
                valor={formPartido.cupo}
                onCambiar={(cupo) => setFormPartido((prev) => ({ ...prev, cupo }))}
              />
            </div>

            <button
              type="submit"
              disabled={abriendo}
              className="w-full bg-neon text-dark font-bold hover:shadow-[0_0_18px_rgba(0,230,118,0.45)] hover:brightness-110 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 transition-colors"
            >
              {abriendo ? 'Abriendo...' : 'Abrir convocatoria'}
            </button>
          </form>

          {/* Config apertura programada */}
          <button
            onClick={() => setMostrandoConfig((v) => !v)}
            className="w-full bg-dark border border-white/[0.08] text-[#8B949E] py-2 rounded-xl text-sm font-medium hover:bg-white/[0.04] transition-colors"
          >
            {mostrandoConfig ? 'Cerrar configuración' : '⏰ Programar apertura'}
          </button>

          {mostrandoConfig && (
            <div className="bg-white/[0.04] rounded-xl p-4 border border-white/[0.08] space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-[#8B949E]">
                  Apertura automática
                </span>
                <button
                  onClick={() =>
                    setFormConfig((prev) => ({ ...prev, activa: !prev.activa }))
                  }
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    formConfig.activa ? 'bg-[#00E676]' : 'bg-white/[0.08]'
                  }`}
                >
                  <span
                    className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                      formConfig.activa ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {formConfig.activa && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-[#8B949E] mb-2">
                      Día de la semana
                    </label>
                    <div className="grid grid-cols-5 gap-1">
                      {DIAS.map((d) => (
                        <button
                          key={d.valor}
                          type="button"
                          onClick={() =>
                            setFormConfig((prev) => ({
                              ...prev,
                              dia_semana: d.valor,
                            }))
                          }
                          className={`py-2 text-xs font-semibold rounded-lg border-2 transition-colors ${
                            formConfig.dia_semana === d.valor
                              ? 'border-[#00E676] bg-neon/10 text-[#00E676]'
                              : 'border-white/[0.08] text-[#7D8590] hover:border-white/[0.12]'
                          }`}
                        >
                          {d.etiqueta}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#8B949E] mb-1">
                      Hora de apertura de la convocatoria
                    </label>
                    <input
                      type="time"
                      value={formConfig.hora_apertura}
                      onChange={(e) =>
                        setFormConfig((prev) => ({
                          ...prev,
                          hora_apertura: e.target.value,
                        }))
                      }
                      className="w-full bg-dark border border-white/[0.08] rounded-xl px-3 py-2.5 text-[#F0F6FC] focus:outline-none focus:ring-2 focus:ring-[#00E676] focus:border-transparent"
                    />
                  </div>
                </>
              )}

              <button
                onClick={handleGuardarConfig}
                disabled={guardandoConfig}
                className="w-full bg-neon text-dark font-bold hover:shadow-[0_0_18px_rgba(0,230,118,0.45)] hover:brightness-110 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 transition-colors"
              >
                {guardandoConfig ? 'Guardando...' : 'Guardar configuración'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Partido abierto ── */}
      {partido?.estado === 'abierto' && (
        <div className="space-y-2">
          <div className="bg-dark border border-white/[0.08] rounded-xl p-3">
            <p className="text-xs font-medium text-[#8B949E] mb-2">Cupo máximo de jugadores</p>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <SelectorCupo valor={cupoEditado} onCambiar={setCupoEditado} />
              </div>
              {cupoEditado !== partido.cupo_maximo && (
                <button
                  onClick={handleGuardarCupo}
                  disabled={guardandoCupo}
                  className="bg-neon text-dark font-bold hover:shadow-[0_0_18px_rgba(0,230,118,0.45)] hover:brightness-110 px-3 py-2 rounded-xl text-xs font-semibold disabled:opacity-50 transition-colors"
                >
                  {guardandoCupo ? 'Guardando...' : 'Guardar'}
                </button>
              )}
            </div>
            <p className="text-[#7D8590] mt-2" style={{ fontSize: '11px' }}>
              Si lo subís, entran los primeros suplentes. Si lo bajás, los titulares actuales se quedan.
            </p>
          </div>
          <button
            onClick={onCerrarConvocatoria}
            className="w-full bg-gold/15 border border-gold/40 text-[#F59E0B] py-2.5 rounded-xl text-sm font-semibold hover:bg-gold/25 transition-colors"
          >
            Cerrar convocatoria
          </button>
          <BtnBorrar />
        </div>
      )}

      {/* ── Votando equipos ── */}
      {partido?.estado === 'votando' && (
        <div className="space-y-2">
          <button
            onClick={onReabrirConvocatoria}
            className="w-full bg-blue-500/15 border border-blue-500/40 text-[#60a5fa] py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-500/25 transition-colors"
          >
            Reabrir convocatoria
          </button>
          <BtnBorrar />
        </div>
      )}

      {/* ── Equipos confirmados ── */}
      {partido?.estado === 'confirmado' && (
        <div className="space-y-2">
          {/* Recién cuando el partido ya empezó */}
          {partido.fecha && partido.fecha.getTime() < Date.now() ? (
            <button
              onClick={onAbrirCierrePartido}
              className="w-full bg-neon text-dark font-bold py-2.5 rounded-xl text-sm hover:shadow-[0_0_18px_rgba(0,230,118,0.45)] hover:brightness-110 transition-all"
            >
              🏁 Cerrar partido
            </button>
          ) : (
            <p className="text-[#7D8590] text-xs text-center">
              Cuando pase la hora del partido vas a poder cerrarlo con el resultado.
            </p>
          )}
          <button
            onClick={onReabrirConvocatoria}
            className="w-full bg-blue-500/15 border border-blue-500/40 text-[#60a5fa] py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-500/25 transition-colors"
          >
            Reabrir convocatoria
          </button>
          <BtnBorrar />
        </div>
      )}
    </div>
  )
}
