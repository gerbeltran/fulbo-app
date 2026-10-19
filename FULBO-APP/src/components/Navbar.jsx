export const TABS = [
  { id: 'partido', icono: '⚽', etiqueta: 'Partido' },
  { id: 'stats', icono: '📊', etiqueta: 'Stats' },
  { id: 'mvp', icono: '🏆', etiqueta: 'MVP' },
  { id: 'noticias', icono: '📰', etiqueta: 'Noticias' },
]

export default function Navbar({ paginaActual, onCambiarPagina }) {
  return (
    <nav
      // En desktop la navegación va en el header (pestañas superiores)
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-white/[0.08] backdrop-blur-md"
      style={{ background: 'rgba(13,17,23,0.9)', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="max-w-3xl mx-auto flex">
        {TABS.map((tab) => {
          const activa = paginaActual === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => onCambiarPagina(tab.id)}
              className={`relative flex-1 flex flex-col items-center pt-2.5 pb-3 gap-0.5 transition-all duration-200 ${
                activa ? 'text-neon' : 'text-texto-sec hover:text-texto'
              }`}
            >
              <span
                className="text-lg transition-transform duration-200"
                style={activa ? { filter: 'drop-shadow(0 0 6px rgba(0,230,118,0.6))', transform: 'translateY(-1px)' } : undefined}
              >
                {tab.icono}
              </span>
              <span
                className={`uppercase ${activa ? 'font-bold' : 'font-semibold'}`}
                style={{ fontSize: '9px', letterSpacing: '0.06em' }}
              >
                {tab.etiqueta}
              </span>
              {/* Línea iluminada de la sección activa */}
              {activa && (
                <span
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[3px] w-10 rounded-full bg-neon"
                  style={{ boxShadow: '0 0 10px rgba(0,230,118,0.9), 0 0 20px rgba(0,230,118,0.5)' }}
                />
              )}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
