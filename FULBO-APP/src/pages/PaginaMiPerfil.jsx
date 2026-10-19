import { useState } from 'react'
import CampanaNotificaciones from '../components/CampanaNotificaciones'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase/config'
import { CLUBES_SUGERIDOS } from '../utils/clubes'
import FotoPerfil from '../components/jugadores/FotoPerfil'

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

  const estiloLabel = 'block text-[#8B949E] mb-1 uppercase font-semibold'

  return (
    <div className="min-h-screen bg-dark">
      <header className="border-b border-white/[0.08] backdrop-blur-md px-4 pt-4 pb-5" style={{ background: 'rgba(13,17,23,0.85)' }}>
        <div className="flex items-center gap-3">
          <button
            onClick={onVolver}
            className="p-1.5 text-[#00E676] hover:text-white transition-colors text-base"
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
        {/* Foto: se guarda apenas se confirma (no depende del botón Guardar) */}
        <FotoPerfil
          jugador={jugador}
          onCambiada={(foto) => {
            handleChange('foto_url', foto)
            // Recarga la lista de jugadores para que la foto aparezca en la cancha
            onGuardado?.()
          }}
        />
        <div>
          <label className={estiloLabel} style={{ fontSize: '10px', letterSpacing: '0.07em' }}>
            Nombre
          </label>
          <input
            type="text"
            value={form.nombre}
            onChange={(e) => handleChange('nombre', e.target.value)}
            className="w-full bg-card border border-white/[0.08] px-3 py-2.5 text-[#F0F6FC] text-sm focus:outline-none focus:ring-1 focus:ring-[#00E676] focus:border-[#00E676]"
            style={{ borderRadius: '8px' }}
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
                    ? 'border-[#00E676] bg-neon/10 text-[#00E676]'
                    : 'border-white/[0.08] text-[#8B949E] hover:border-[#00E676]'
                }`}
                style={{ borderRadius: '8px' }}
              >
                {pos.etiqueta}
              </button>
            ))}
          </div>
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
            className="w-full bg-card border border-white/[0.08] px-3 py-2.5 text-[#F0F6FC] text-sm focus:outline-none focus:ring-1 focus:ring-[#00E676] focus:border-[#00E676]"
            style={{ borderRadius: '8px' }}
          />
          <datalist id="clubes-sugeridos">
            {CLUBES_SUGERIDOS.map((c) => <option key={c} value={c} />)}
          </datalist>
          <p className="text-[#7D8590] mt-1" style={{ fontSize: '11px' }}>
            Lo usamos para mostrarte noticias en la sección Noticias.
          </p>
        </div>

        {/* Solo lectura: lo asigna el admin */}
        <div className="bg-card border border-white/[0.08] p-3 flex items-center justify-between" style={{ borderRadius: '8px' }}>
          <span className="text-[#8B949E] text-xs uppercase font-semibold" style={{ letterSpacing: '0.07em' }}>
            Nivel <span className="normal-case font-normal text-[#7D8590]">(lo asigna el admin)</span>
          </span>
          <span className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((n) => (
              <span key={n} style={{ color: n <= jugador.nivel_general ? '#ffb300' : 'rgba(255,255,255,0.14)' }}>★</span>
            ))}
          </span>
        </div>

        {mensaje && (
          <p className={`text-xs ${mensaje.tipo === 'ok' ? 'text-[#00E676]' : 'text-[#F87171]'}`}>
            {mensaje.texto}
          </p>
        )}

        <button
          type="submit"
          disabled={guardando}
          className="w-full py-3 bg-neon text-dark font-bold hover:shadow-[0_0_18px_rgba(0,230,118,0.45)] hover:brightness-110 font-semibold uppercase tracking-wide disabled:opacity-50 transition-colors"
          style={{ fontSize: '11px', borderRadius: '8px' }}
        >
          {guardando ? 'Guardando...' : 'Guardar'}
        </button>
      </form>
    </div>
  )
}
