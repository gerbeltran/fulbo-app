import { useState } from 'react'
import CampanaNotificaciones from '../components/CampanaNotificaciones'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase/config'
import { CLUBES_SUGERIDOS } from '../utils/clubes'

const POSICIONES = [
  { valor: 'ARQ', etiqueta: 'Arquero' },
  { valor: 'DEF', etiqueta: 'Defensor' },
  { valor: 'MED', etiqueta: 'Mediocampista' },
  { valor: 'DEL', etiqueta: 'Delantero' },
]

// Cada jugador edita su propio perfil. El nivel y el estado activo
// los maneja solo el admin, por eso acá se muestran sin poder cambiarse.
export default function PaginaMiPerfil({ jugador, onGuardado, onVolver }) {
  const [form, setForm] = useState({
    nombre: jugador.nombre ?? '',
    posicion_preferida: jugador.posicion_preferida ?? 'MED',
    foto_url: jugador.foto_url ?? '',
    club: jugador.club ?? '',
  })
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState(null)

  function handleChange(campo, valor) {
    setForm((prev) => ({ ...prev, [campo]: valor }))
    setMensaje(null)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.nombre.trim()) {
      setMensaje({ tipo: 'error', texto: 'El nombre es obligatorio' })
      return
    }
    setGuardando(true)
    try {
      await updateDoc(doc(db, 'jugadores', jugador.id), {
        nombre: form.nombre.trim(),
        posicion_preferida: form.posicion_preferida,
        foto_url: form.foto_url.trim(),
        club: form.club.trim(),
      })
      await onGuardado?.()
      setMensaje({ tipo: 'ok', texto: 'Perfil guardado' })
    } catch (err) {
      console.error(err)
      setMensaje({ tipo: 'error', texto: 'No se pudo guardar. Intentá de nuevo.' })
    } finally {
      setGuardando(false)
    }
  }

  const estiloLabel = 'block text-[#8892a4] mb-1 uppercase font-semibold'

  return (
    <div className="min-h-screen bg-[#1a1f2e]">
      <header className="bg-[#1e3a28] border-b-2 border-[#2d5a3d] px-4 pt-4 pb-5">
        <div className="flex items-center gap-3">
          <button
            onClick={onVolver}
            className="p-1.5 text-[#81c784] hover:text-white transition-colors text-base"
            aria-label="Volver"
          >
            ←
          </button>
          <h1
            className="font-bold text-white uppercase tracking-widest"
            style={{ fontSize: '13px' }}
          >
            Mi perfil
          </h1>
          <div className="ml-auto">
            <CampanaNotificaciones />
          </div>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="px-4 py-5 space-y-5 max-w-md mx-auto">
        <div>
          <label className={estiloLabel} style={{ fontSize: '10px', letterSpacing: '0.07em' }}>
            Nombre
          </label>
          <input
            type="text"
            value={form.nombre}
            onChange={(e) => handleChange('nombre', e.target.value)}
            className="w-full bg-[#1e2435] border border-[#2a3040] px-3 py-2.5 text-[#e0e6f0] text-sm focus:outline-none focus:ring-1 focus:ring-[#4caf50] focus:border-[#4caf50]"
            style={{ borderRadius: '3px' }}
          />
        </div>

        <div>
          <label className={estiloLabel} style={{ fontSize: '10px', letterSpacing: '0.07em' }}>
            Posición preferida
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
                style={{ borderRadius: '3px' }}
              >
                {pos.etiqueta}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className={estiloLabel} style={{ fontSize: '10px', letterSpacing: '0.07em' }}>
            Foto (URL)
          </label>
          <input
            type="url"
            value={form.foto_url}
            onChange={(e) => handleChange('foto_url', e.target.value)}
            placeholder="https://..."
            className="w-full bg-[#1e2435] border border-[#2a3040] px-3 py-2.5 text-[#e0e6f0] text-sm focus:outline-none focus:ring-1 focus:ring-[#4caf50] focus:border-[#4caf50]"
            style={{ borderRadius: '3px' }}
          />
        </div>

        <div>
          <label className={estiloLabel} style={{ fontSize: '10px', letterSpacing: '0.07em' }}>
            Club del que sos hincha
          </label>
          <input
            type="text"
            list="clubes-sugeridos"
            value={form.club}
            onChange={(e) => handleChange('club', e.target.value)}
            placeholder="Ej: River Plate, Boca Juniors, Racing"
            className="w-full bg-[#1e2435] border border-[#2a3040] px-3 py-2.5 text-[#e0e6f0] text-sm focus:outline-none focus:ring-1 focus:ring-[#4caf50] focus:border-[#4caf50]"
            style={{ borderRadius: '3px' }}
          />
          <datalist id="clubes-sugeridos">
            {CLUBES_SUGERIDOS.map((c) => <option key={c} value={c} />)}
          </datalist>
          <p className="text-[#6b7a8d] mt-1" style={{ fontSize: '11px' }}>
            Lo usamos para mostrarte noticias en la sección Noticias.
          </p>
        </div>

        {/* Solo lectura: lo asigna el admin */}
        <div className="bg-[#1e2435] border border-[#2a3040] p-3 flex items-center justify-between" style={{ borderRadius: '3px' }}>
          <span className="text-[#8892a4] text-xs uppercase font-semibold" style={{ letterSpacing: '0.07em' }}>
            Nivel <span className="normal-case font-normal text-[#6b7a8d]">(lo asigna el admin)</span>
          </span>
          <span className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((n) => (
              <span key={n} style={{ color: n <= jugador.nivel_general ? '#ffb300' : '#2a3040' }}>★</span>
            ))}
          </span>
        </div>

        {mensaje && (
          <p className={`text-xs ${mensaje.tipo === 'ok' ? 'text-[#4caf50]' : 'text-[#ef9a9a]'}`}>
            {mensaje.texto}
          </p>
        )}

        <button
          type="submit"
          disabled={guardando}
          className="w-full py-3 bg-[#245c33] border border-[#2d7a3d] text-white font-semibold uppercase tracking-wide disabled:opacity-50 transition-colors"
          style={{ fontSize: '11px', borderRadius: '3px' }}
        >
          {guardando ? 'Guardando...' : 'Guardar'}
        </button>
      </form>
    </div>
  )
}
