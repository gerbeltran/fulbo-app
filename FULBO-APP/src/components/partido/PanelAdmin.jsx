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
    'w-9 h-9 bg-[#1a1f2e] border border-[#2a3040] rounded-xl text-[#e0e6f0] text-lg hover:border-[#4caf50] disabled:opacity-40 transition-colors'
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
      <span className="min-w-[3ch] text-center text-[#e0e6f0] font-semibold">{valor}</span>
      <button
        type="button"
        onClick={() => onCambiar(Math.min(30, valor + 1))}
        disabled={valor >= 30}
        className={estiloBoton}
        aria-label="Sumar un lugar"
      >
        +
      </button>
      <span className="text-xs text-[#6b7a8d]">({Math.floor(valor / 2)} vs {Math.ceil(valor / 2)})</span>
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
        <div className="bg-[#3d1a1a] border border-[#5c2424] rounded-xl p-3 space-y-2">
          <p className="text-sm text-[#ef9a9a] font-medium text-center">
            ¿Borrar la convocatoria y todos sus datos?
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setConfirmarBorrar(false)}
              disabled={borrando}
              className="flex-1 py-2 border border-[#2a3040] text-[#8892a4] rounded-xl text-sm font-medium hover:bg-[#242b3d] disabled:opacity-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleBorrar}
              disabled={borrando}
              className="flex-1 py-2 bg-[#5c2424] border border-[#7a2d2d] text-white rounded-xl text-sm font-semibold hover:bg-[#7a2d2d] disabled:opacity-50 transition-colors"
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
        className="w-full border border-[#5c2424] text-[#ef9a9a] py-2 rounded-xl text-sm font-medium hover:bg-[#3d1a1a] transition-colors"
      >
        🗑️ Borrar convocatoria
      </button>
    )
  }

  return (
    <div className="bg-[#1e2435] border border-[#2a3040] rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-base">⚙️</span>
        <h3 className="font-semibold text-[#e0e6f0] text-sm">Panel admin</h3>
      </div>

      {/* ── Sin partido activo: formulario para crear convocatoria ── */}
      {!partido && (
        <div className="space-y-3">
          {deberiaAbrirSchedule && (
            <div className="bg-[#1b3d22] text-[#4caf50] text-xs px-3 py-2 rounded-lg font-medium border border-[#2d5a3d]">
              Es la hora programada de apertura.
            </div>
          )}

          <form onSubmit={handleAbrir} className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-[#8892a4] mb-1">
                  Fecha del partido
                </label>
                <input
                  type="date"
                  value={formPartido.fecha}
                  min={hoy}
                  onChange={(e) =>
                    setFormPartido((prev) => ({ ...prev, fecha: e.target.value }))
                  }
                  className="w-full bg-[#1a1f2e] border border-[#2a3040] rounded-xl px-3 py-2 text-sm text-[#e0e6f0] focus:outline-none focus:ring-2 focus:ring-[#4caf50] focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#8892a4] mb-1">
                  Hora del partido
                </label>
                <input
                  type="time"
                  value={formPartido.hora}
                  onChange={(e) =>
                    setFormPartido((prev) => ({ ...prev, hora: e.target.value }))
                  }
                  className="w-full bg-[#1a1f2e] border border-[#2a3040] rounded-xl px-3 py-2 text-sm text-[#e0e6f0] focus:outline-none focus:ring-2 focus:ring-[#4caf50] focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#8892a4] mb-1">
                Lugar
              </label>
              <input
                type="text"
                value={formPartido.lugar}
                onChange={(e) =>
                  setFormPartido((prev) => ({ ...prev, lugar: e.target.value }))
                }
                placeholder="Ej: Complejo La Cancha, Cancha 3"
                className="w-full bg-[#1a1f2e] border border-[#2a3040] rounded-xl px-3 py-2 text-sm text-[#e0e6f0] placeholder-[#4a5568] focus:outline-none focus:ring-2 focus:ring-[#4caf50] focus:border-transparent"
              />
              {errorForm && (
                <p className="text-[#ef9a9a] text-xs mt-1">{errorForm}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-[#8892a4] mb-1">
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
              className="w-full bg-[#245c33] border border-[#2d7a3d] text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-[#2d7a3d] disabled:opacity-50 transition-colors"
            >
              {abriendo ? 'Abriendo...' : 'Abrir convocatoria'}
            </button>
          </form>

          {/* Config apertura programada */}
          <button
            onClick={() => setMostrandoConfig((v) => !v)}
            className="w-full bg-[#1a1f2e] border border-[#2a3040] text-[#8892a4] py-2 rounded-xl text-sm font-medium hover:bg-[#242b3d] transition-colors"
          >
            {mostrandoConfig ? 'Cerrar configuración' : '⏰ Programar apertura'}
          </button>

          {mostrandoConfig && (
            <div className="bg-[#242b3d] rounded-xl p-4 border border-[#2a3040] space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-[#8892a4]">
                  Apertura automática
                </span>
                <button
                  onClick={() =>
                    setFormConfig((prev) => ({ ...prev, activa: !prev.activa }))
                  }
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    formConfig.activa ? 'bg-[#4caf50]' : 'bg-[#2a3040]'
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
                    <label className="block text-sm font-medium text-[#8892a4] mb-2">
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
                              ? 'border-[#4caf50] bg-[#1b3d22] text-[#4caf50]'
                              : 'border-[#2a3040] text-[#6b7a8d] hover:border-[#3a4050]'
                          }`}
                        >
                          {d.etiqueta}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#8892a4] mb-1">
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
                      className="w-full bg-[#1a1f2e] border border-[#2a3040] rounded-xl px-3 py-2.5 text-[#e0e6f0] focus:outline-none focus:ring-2 focus:ring-[#4caf50] focus:border-transparent"
                    />
                  </div>
                </>
              )}

              <button
                onClick={handleGuardarConfig}
                disabled={guardandoConfig}
                className="w-full bg-[#245c33] border border-[#2d7a3d] text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-[#2d7a3d] disabled:opacity-50 transition-colors"
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
          <div className="bg-[#1a1f2e] border border-[#2a3040] rounded-xl p-3">
            <p className="text-xs font-medium text-[#8892a4] mb-2">Cupo máximo de jugadores</p>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <SelectorCupo valor={cupoEditado} onCambiar={setCupoEditado} />
              </div>
              {cupoEditado !== partido.cupo_maximo && (
                <button
                  onClick={handleGuardarCupo}
                  disabled={guardandoCupo}
                  className="bg-[#245c33] border border-[#2d7a3d] text-white px-3 py-2 rounded-xl text-xs font-semibold hover:bg-[#2d7a3d] disabled:opacity-50 transition-colors"
                >
                  {guardandoCupo ? 'Guardando...' : 'Guardar'}
                </button>
              )}
            </div>
            <p className="text-[#6b7a8d] mt-2" style={{ fontSize: '11px' }}>
              Si lo subís, entran los primeros suplentes. Si lo bajás, los titulares actuales se quedan.
            </p>
          </div>
          <button
            onClick={onCerrarConvocatoria}
            className="w-full bg-[#5c3a00] border border-[#7a5000] text-[#fb923c] py-2.5 rounded-xl text-sm font-semibold hover:bg-[#7a5000] transition-colors"
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
            className="w-full bg-[#1e3a5f] border border-[#2a5a8f] text-[#60a5fa] py-2.5 rounded-xl text-sm font-semibold hover:bg-[#2a5a8f] transition-colors"
          >
            Reabrir convocatoria
          </button>
          <BtnBorrar />
        </div>
      )}

      {/* ── Equipos confirmados ── */}
      {partido?.estado === 'confirmado' && (
        <div className="space-y-2">
          <button
            onClick={onReabrirConvocatoria}
            className="w-full bg-[#1e3a5f] border border-[#2a5a8f] text-[#60a5fa] py-2.5 rounded-xl text-sm font-semibold hover:bg-[#2a5a8f] transition-colors"
          >
            Reabrir convocatoria
          </button>
          <BtnBorrar />
        </div>
      )}
    </div>
  )
}
