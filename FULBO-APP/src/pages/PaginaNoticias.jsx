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
      className="flex items-center gap-3 bg-[#1e2435] border border-[#2a3040] rounded-xl px-4 py-3 hover:border-[#4caf50] transition-colors"
    >
      <div className="flex-1 min-w-0">
        <h3 className="text-[#e0e6f0] text-sm font-semibold leading-snug line-clamp-2">
          {noticia.titulo}
        </h3>
        <p className="text-[#6b7a8d] mt-1.5" style={{ fontSize: '11px' }}>
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
          className="w-20 h-20 shrink-0 rounded-lg object-cover bg-[#2a3040]"
        />
      )}
    </a>
  )
}

function Esqueleto() {
  return (
    <div className="space-y-2">
      {[1, 2, 3, 4].map((n) => (
        <div key={n} className="flex items-center gap-3 bg-[#1e2435] border border-[#2a3040] rounded-xl px-4 py-3 animate-pulse">
          <div className="flex-1">
            <div className="h-3 bg-[#2a3040] rounded w-11/12" />
            <div className="h-3 bg-[#2a3040] rounded w-2/3 mt-2" />
            <div className="h-2 bg-[#2a3040] rounded w-1/4 mt-3" />
          </div>
          <div className="w-20 h-20 shrink-0 rounded-lg bg-[#2a3040]" />
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
        <p className="text-[#8892a4] text-sm mb-5">
          Completá tu club favorito en tu perfil para ver noticias personalizadas
        </p>
        {onIrAPerfil && (
          <button
            onClick={onIrAPerfil}
            className="bg-[#245c33] border border-[#2d7a3d] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#2d7a3d] transition-colors"
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
            className="text-[#6b7a8d] uppercase font-semibold"
            style={{ fontSize: '10px', letterSpacing: '0.1em' }}
          >
            Noticias de
          </p>
          <h2 className="text-white font-bold text-base truncate">{club}</h2>
        </div>
        <button
          onClick={cargar}
          disabled={cargando}
          className="shrink-0 text-[#81c784] border border-[#2d5a3d] px-3 py-1.5 rounded-lg text-xs font-semibold hover:border-[#4caf50] disabled:opacity-50 transition-colors"
        >
          {cargando ? 'Cargando...' : '↻ Actualizar'}
        </button>
      </div>

      {/* Aviso: mostrando las guardadas porque no se pudo actualizar */}
      {error && noticias.length > 0 && (
        <p className="text-xs text-[#f59e0b] bg-[#3d3000]/40 border border-[#5a4500] rounded-lg px-3 py-2 mb-3">
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
          <p className="text-[#8892a4] text-sm mb-4">{error}</p>
          <button
            onClick={cargar}
            className="bg-[#245c33] border border-[#2d7a3d] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#2d7a3d] transition-colors"
          >
            Reintentar
          </button>
        </div>
      ) : (
        <p className="text-center text-[#6b7a8d] text-sm py-12">
          No encontramos noticias sobre {club}.
        </p>
      )}
    </div>
  )
}
