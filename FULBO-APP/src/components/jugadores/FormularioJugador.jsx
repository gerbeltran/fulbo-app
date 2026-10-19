import { useState } from 'react'
import { CLUBES_SUGERIDOS } from '../../utils/clubes'
import FotoPerfil from './FotoPerfil'

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
  club: '',
}

export default function FormularioJugador({
  jugador,
  nombreSugerido = '',
  emailVinculado = '',
  guardando = false,
  onGuardar,
  onDesvincular,
  onFotoCambiada,
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
          club: jugador.club ?? '',
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
    onGuardar({ ...form, nombre: form.nombre.trim(), club: form.club.trim() })
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-50 sm:p-4">
      <div
        className="bg-card border border-white/[0.08] w-full sm:max-w-md rounded-t sm:rounded p-6 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-5">
          <h2
            className="font-bold text-[#F0F6FC] uppercase tracking-wider"
            style={{ fontSize: '13px' }}
          >
            {esEdicion ? 'Editar jugador' : 'Nuevo jugador'}
          </h2>
          <button
            onClick={onCancelar}
            className="p-1.5 text-[#7D8590] hover:text-[#F0F6FC] transition-colors"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Foto (solo al editar: el jugador nuevo todavía no existe en la base) */}
          {esEdicion ? (
            <FotoPerfil
              jugador={jugador}
              onCambiada={(foto) => {
                handleChange('foto_url', foto)
                onFotoCambiada?.()
              }}
            />
          ) : (
            <p className="text-texto-sec text-xs text-center">
              Podés agregarle foto después de crear el jugador.
            </p>
          )}

          {/* Nombre */}
          <div>
            <label
              className="block text-[#8B949E] mb-1 uppercase font-semibold"
              style={{ fontSize: '10px', letterSpacing: '0.07em' }}
            >
              Nombre
            </label>
            <input
              type="text"
              value={form.nombre}
              onChange={(e) => handleChange('nombre', e.target.value)}
              placeholder="Nombre del jugador"
              className="w-full bg-dark border border-white/[0.08] px-3 py-2.5 text-[#F0F6FC] text-sm focus:outline-none focus:ring-1 focus:ring-[#00E676] focus:border-[#00E676]"
              style={{ borderRadius: '8px' }}
              autoFocus
            />
            {error && (
              <p className="text-[#F87171] text-xs mt-1">{error}</p>
            )}
          </div>

          {/* Posición */}
          <div>
            <label
              className="block text-[#8B949E] mb-2 uppercase font-semibold"
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
                      ? 'border-[#00E676] bg-neon/10 text-[#00E676]'
                      : 'border-white/[0.08] text-[#8B949E] hover:border-[#00E676]'
                  }`}
                  style={{ borderRadius: '8px', letterSpacing: '0.05em' }}
                >
                  {pos.etiqueta}
                </button>
              ))}
            </div>
          </div>

          {/* Club */}
          <div>
            <label
              className="block text-[#8B949E] mb-1 uppercase font-semibold"
              style={{ fontSize: '10px', letterSpacing: '0.07em' }}
            >
              Club del que es hincha{' '}
              <span className="text-[#7D8590] normal-case" style={{ fontSize: '9px' }}>
                (opcional)
              </span>
            </label>
            <input
              type="text"
              list="clubes-sugeridos-admin"
              value={form.club}
              onChange={(e) => handleChange('club', e.target.value)}
              placeholder="Ej: River Plate"
              className="w-full bg-dark border border-white/[0.08] px-3 py-2.5 text-[#F0F6FC] text-sm focus:outline-none focus:ring-1 focus:ring-[#00E676] focus:border-[#00E676]"
              style={{ borderRadius: '8px' }}
            />
            <datalist id="clubes-sugeridos-admin">
              {CLUBES_SUGERIDOS.map((c) => <option key={c} value={c} />)}
            </datalist>
          </div>

          {/* Nivel */}
          <div>
            <label
              className="block text-[#8B949E] mb-2 uppercase font-semibold"
              style={{ fontSize: '10px', letterSpacing: '0.07em' }}
            >
              Nivel:{' '}
              <span className="text-[#00E676]">{form.nivel_general}/5</span>
            </label>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => handleChange('nivel_general', n)}
                  className="flex-1 py-2.5 text-xl transition-colors bg-dark border border-white/[0.08]"
                  style={{
                    color: n <= form.nivel_general ? '#ffb300' : 'rgba(255,255,255,0.14)',
                    borderRadius: '8px',
                  }}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          {/* Cuenta de Google (se vincula desde las solicitudes de acceso) */}
          {emailVinculado && (
            <p className="text-xs text-[#00E676]">
              🔗 Se vinculará a la cuenta {emailVinculado}
            </p>
          )}
          {esEdicion && (
            <div
              className="flex items-center justify-between gap-2 bg-dark border border-white/[0.08] px-3 py-2"
              style={{ borderRadius: '8px' }}
            >
              <span className="text-xs text-[#8B949E]">
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
                  className="text-[#F87171] text-xs hover:underline disabled:opacity-50 shrink-0"
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
 form.activo ? 'bg-neon text-dark font-bold hover:shadow-[0_0_18px_rgba(0,230,118,0.45)] hover:brightness-110' : 'bg-white/[0.08]'
 }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                  form.activo ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className="text-sm text-[#8B949E]">
              {form.activo ? 'Jugador activo' : 'Jugador inactivo'}
            </span>
          </div>

          {/* Acciones */}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onCancelar}
              className="flex-1 py-2.5 border border-white/[0.08] text-[#8B949E] font-semibold uppercase tracking-wide transition-colors hover:border-[#00E676] hover:text-[#F0F6FC]"
              style={{ fontSize: '11px', borderRadius: '8px' }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando}
              className="flex-1 py-2.5 bg-neon text-dark font-bold hover:shadow-[0_0_18px_rgba(0,230,118,0.45)] hover:brightness-110 font-semibold uppercase tracking-wide disabled:opacity-50 transition-colors"
              style={{ fontSize: '11px', borderRadius: '8px' }}
            >
              {guardando ? 'Guardando...' : esEdicion ? 'Guardar' : 'Agregar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
