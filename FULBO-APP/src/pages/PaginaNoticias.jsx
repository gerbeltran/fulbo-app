import { useState } from 'react'
import { useNoticias } from '../hooks/useNoticias'
import { tiempoRelativo, MAXIMO_NOTICIAS } from '../utils/noticias'

function TarjetaNoticia({ noticia }) {
  // Si la imagen no carga, la tarjeta queda como si no tuviera
  const [imagenRota, setImagenRota] = useState(false)
  const conImagen = noticia.imagen && !imagenRota

  return (
    <a
      href={noticia.link}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 bg-card border border-white/[0.08] rounded-xl px-4 py-3 hover:border-[#00E676] transition-colors"
    >
      <div className="flex-1 min-w-0">
        <h3 className="text-[#F0F6FC] text-sm font-semibold leading-snug line-clamp-2">
          {noticia.titulo}
        </h3>
        <p className="text-[#7D8590] mt-1.5" style={{ fontSize: '11px' }}>
          {noticia.fuente}
          {noticia.fuente && noticia.fecha && ' · '}
          {tiempoRelativo(noticia.fecha)}
        </p>
      </div>
      {conImagen && (
        <img
          src={noticia.imagen}
          alt=""
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setImagenRota(true)}
          className="w-20 h-20 shrink-0 rounded-lg object-cover bg-white/[0.08]"
        />
      )}
    </a>
  )
}

function Esqueleto() {
  return (
    <div className="space-y-2">
      {[1, 2, 3, 4].map((n) => (
        <div key={n} className="flex items-center gap-3 bg-card border border-white/[0.08] rounded-xl px-4 py-3 animate-pulse">
          <div className="flex-1">
            <div className="h-3 bg-white/[0.08] rounded w-11/12" />
            <div className="h-3 bg-white/[0.08] rounded w-2/3 mt-2" />
            <div className="h-2 bg-white/[0.08] rounded w-1/4 mt-3" />
          </div>
          <div className="w-20 h-20 shrink-0 rounded-lg bg-white/[0.08]" />
        </div>
      ))}
    </div>
  )
}

export default function PaginaNoticias({ club, onIrAPerfil }) {
  const { noticias, cargando, error, desdeCache, cargar } = useNoticias(club)

  // Sin club cargado en el perfil
  if (!club) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
        <div className="text-6xl mb-4">📰</div>
        <p className="text-[#8B949E] text-sm mb-5">
          Completá tu club favorito en tu perfil para ver noticias personalizadas
        </p>
        {onIrAPerfil && (
          <button
            onClick={onIrAPerfil}
            className="bg-neon text-dark font-bold hover:shadow-[0_0_18px_rgba(0,230,118,0.45)] hover:brightness-110 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors"
          >
            Ir a Mi perfil
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="px-4 py-4">
      <div className="flex items-center justify-between mb-3">
        <div className="min-w-0">
          <p
            className="text-[#7D8590] uppercase font-semibold"
            style={{ fontSize: '10px', letterSpacing: '0.1em' }}
          >
            Noticias de
          </p>
          <h2 className="text-white font-bold text-base truncate">{club}</h2>
        </div>
        <button
          onClick={cargar}
          disabled={cargando}
          className="shrink-0 text-[#00E676] border border-neon/25 px-3 py-1.5 rounded-lg text-xs font-semibold hover:border-[#00E676] disabled:opacity-50 transition-colors"
        >
          {cargando ? 'Cargando...' : '↻ Actualizar'}
        </button>
      </div>

      {/* Aviso: mostrando las guardadas porque no se pudo actualizar */}
      {error && noticias.length > 0 && (
        <p className="text-xs text-[#f59e0b] bg-gold/10 border border-gold/30 rounded-lg px-3 py-2 mb-3">
          No pudimos actualizar. Mostrando las noticias guardadas
          {desdeCache && ` (${tiempoRelativo(desdeCache)})`}.
        </p>
      )}

      {noticias.length > 0 ? (
        <div className="space-y-2">
          {noticias.slice(0, MAXIMO_NOTICIAS).map((n) => (
            <TarjetaNoticia key={n.link} noticia={n} />
          ))}
        </div>
      ) : cargando ? (
        <Esqueleto />
      ) : error ? (
        <div className="text-center py-12">
          <div className="text-3xl mb-3">⚠️</div>
          <p className="text-[#8B949E] text-sm mb-4">{error}</p>
          <button
            onClick={cargar}
            className="bg-neon text-dark font-bold hover:shadow-[0_0_18px_rgba(0,230,118,0.45)] hover:brightness-110 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors"
          >
            Reintentar
          </button>
        </div>
      ) : (
        <p className="text-center text-[#7D8590] text-sm py-12">
          No encontramos noticias sobre {club}.
        </p>
      )}
    </div>
  )
}
