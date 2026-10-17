const TABS = [
  { id: 'partido', icono: '⚽', etiqueta: 'Partido' },
  { id: 'stats', icono: '📊', etiqueta: 'Stats' },
  { id: 'mvp', icono: '🏆', etiqueta: 'MVP' },
  { id: 'noticias', icono: '📰', etiqueta: 'Noticias' },
]

export default function Navbar({ paginaActual, onCambiarPagina }) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 flex border-t-2 border-[#2a3040]"
      style={{ background: '#151a27' }}
    >
      {TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onCambiarPagina(tab.id)}
          className={`flex-1 flex flex-col items-center py-2.5 gap-0.5 transition-colors ${
            paginaActual === tab.id ? 'text-[#4caf50]' : 'text-[#6b7a8d]'
          }`}
        >
          <span className="text-lg">{tab.icono}</span>
          <span
            className="uppercase font-semibold"
            style={{ fontSize: '9px', letterSpacing: '0.06em' }}
          >
            {tab.etiqueta}
          </span>
        </button>
      ))}
    </nav>
  )
}
