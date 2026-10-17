import { useState } from 'react'

const POSICIONES = [
  { valor: 'ARQ', etiqueta: 'Arquero' },
  { valor: 'DEF', etiqueta: 'Defensor' },
  { valor: 'MED', etiqueta: 'Mediocampista' },
  { valor: 'DEL', etiqueta: 'Delantero' },
]

const estadoInicial = {
  nombre: '',
  posicion_preferida: 'DEL',
  nivel_general: 3,
  activo: true,
  foto_url: '',
}

export default function FormularioJugador({
  jugador,
  nombreSugerido = '',
  emailVinculado = '',
  guardando = false,
  onGuardar,
  onDesvincular,
  onCancelar,
}) {
  const esEdicion = !!jugador
  const [desvinculando, setDesvinculando] = useState(false)

  const [form, setForm] = useState(
    jugador
      ? {
          nombre: jugador.nombre,
          posicion_preferida: jugador.posicion_preferida,
          nivel_general: jugador.nivel_general,
          activo: jugador.activo,
          foto_url: jugador.foto_url ?? '',
        }
      : {
          ...estadoInicial,
          nombre: nombreSugerido,
        }
  )
  const [error, setError] = useState('')

  function handleChange(campo, valor) {
    setForm((prev) => ({ ...prev, [campo]: valor }))
    if (campo === 'nombre') setError('')
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.nombre.trim()) {
      setError('El nombre es obligatorio')
      return
    }
    onGuardar({ ...form, nombre: form.nombre.trim() })
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-50 sm:p-4">
      <div
        className="bg-[#1e2435] border border-[#2a3040] w-full sm:max-w-md rounded-t sm:rounded p-6 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-5">
          <h2
            className="font-bold text-[#e0e6f0] uppercase tracking-wider"
            style={{ fontSize: '13px' }}
          >
            {esEdicion ? 'Editar jugador' : 'Nuevo jugador'}
          </h2>
          <button
            onClick={onCancelar}
            className="p-1.5 text-[#6b7a8d] hover:text-[#e0e6f0] transition-colors"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nombre */}
          <div>
            <label
              className="block text-[#8892a4] mb-1 uppercase font-semibold"
              style={{ fontSize: '10px', letterSpacing: '0.07em' }}
            >
              Nombre
            </label>
            <input
              type="text"
              value={form.nombre}
              onChange={(e) => handleChange('nombre', e.target.value)}
              placeholder="Nombre del jugador"
              className="w-full bg-[#1a1f2e] border border-[#2a3040] px-3 py-2.5 text-[#e0e6f0] text-sm focus:outline-none focus:ring-1 focus:ring-[#4caf50] focus:border-[#4caf50]"
              style={{ borderRadius: '3px' }}
              autoFocus
            />
            {error && (
              <p className="text-[#ef9a9a] text-xs mt-1">{error}</p>
            )}
          </div>

          {/* Posición */}
          <div>
            <label
              className="block text-[#8892a4] mb-2 uppercase font-semibold"
              style={{ fontSize: '10px', letterSpacing: '0.07em' }}
            >
              Posición
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {POSICIONES.map((pos) => (
                <button
                  key={pos.valor}
                  type="button"
                  onClick={() => handleChange('posicion_preferida', pos.valor)}
                  className={`py-2 px-3 border text-xs font-semibold uppercase tracking-wide transition-colors ${
                    form.posicion_preferida === pos.valor
                      ? 'border-[#4caf50] bg-[#1b3d22] text-[#4caf50]'
                      : 'border-[#2a3040] text-[#8892a4] hover:border-[#4caf50]'
                  }`}
                  style={{ borderRadius: '3px', letterSpacing: '0.05em' }}
                >
                  {pos.etiqueta}
                </button>
              ))}
            </div>
          </div>

          {/* Nivel */}
          <div>
            <label
              className="block text-[#8892a4] mb-2 uppercase font-semibold"
              style={{ fontSize: '10px', letterSpacing: '0.07em' }}
            >
              Nivel:{' '}
              <span className="text-[#4caf50]">{form.nivel_general}/5</span>
            </label>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => handleChange('nivel_general', n)}
                  className="flex-1 py-2.5 text-xl transition-colors bg-[#1a1f2e] border border-[#2a3040]"
                  style={{
                    color: n <= form.nivel_general ? '#ffb300' : '#2a3040',
                    borderRadius: '3px',
                  }}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          {/* Cuenta de Google (se vincula desde las solicitudes de acceso) */}
          {emailVinculado && (
            <p className="text-xs text-[#81c784]">
              🔗 Se vinculará a la cuenta {emailVinculado}
            </p>
          )}
          {esEdicion && (
            <div
              className="flex items-center justify-between gap-2 bg-[#1a1f2e] border border-[#2a3040] px-3 py-2"
              style={{ borderRadius: '3px' }}
            >
              <span className="text-xs text-[#8892a4]">
                {jugador.uid_firebase ? '🔗 Cuenta de Google vinculada' : 'Sin cuenta de Google vinculada'}
              </span>
              {jugador.uid_firebase && onDesvincular && (
                <button
                  type="button"
                  disabled={desvinculando}
                  onClick={async () => {
                    setDesvinculando(true)
                    try {
                      await onDesvincular(jugador)
                    } finally {
                      setDesvinculando(false)
                    }
                  }}
                  className="text-[#ef9a9a] text-xs hover:underline disabled:opacity-50 shrink-0"
                >
                  {desvinculando ? 'Desvinculando...' : 'Desvincular'}
                </button>
              )}
            </div>
          )}

          {/* Activo toggle */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => handleChange('activo', !form.activo)}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                form.activo ? 'bg-[#245c33]' : 'bg-[#2a3040]'
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                  form.activo ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className="text-sm text-[#8892a4]">
              {form.activo ? 'Jugador activo' : 'Jugador inactivo'}
            </span>
          </div>

          {/* Acciones */}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onCancelar}
              className="flex-1 py-2.5 border border-[#2a3040] text-[#8892a4] font-semibold uppercase tracking-wide transition-colors hover:border-[#4caf50] hover:text-[#e0e6f0]"
              style={{ fontSize: '11px', borderRadius: '3px' }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando}
              className="flex-1 py-2.5 bg-[#245c33] border border-[#2d7a3d] text-white font-semibold uppercase tracking-wide disabled:opacity-50 transition-colors"
              style={{ fontSize: '11px', borderRadius: '3px' }}
            >
              {guardando ? 'Guardando...' : esEdicion ? 'Guardar' : 'Agregar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
