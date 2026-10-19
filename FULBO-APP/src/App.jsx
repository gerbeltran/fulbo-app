import { useEffect, useState } from 'react'
import { useAuth } from './context/AuthContext'
import { useGrupo } from './context/GrupoContext'
import { useNotificaciones } from './context/NotificacionesContext'
import CampanaNotificaciones from './components/CampanaNotificaciones'
import { useJugadores } from './hooks/useJugadores'
import Navbar, { TABS } from './components/Navbar'
import PaginaLogin from './pages/PaginaLogin'
import PaginaPendiente from './pages/PaginaPendiente'
import PaginaMisGrupos from './pages/PaginaMisGrupos'
import PaginaPartido from './pages/PaginaPartido'
import PaginaStats from './pages/PaginaStats'
import PaginaMVP from './pages/PaginaMVP'
import PaginaNoticias from './pages/PaginaNoticias'
import PaginaJugadores from './pages/PaginaJugadores'
import PaginaMiPerfil from './pages/PaginaMiPerfil'
import PanelConfiguracion from './components/PanelConfiguracion'

function AppContenido() {
  const { grupoActivo, jugadorActual, esAdminDelGrupo } = useGrupo()
  const [paginaActual, setPaginaActual] = useState('partido')
  // Pantallas secundarias: null | 'jugadores' | 'perfil'
  const [pantallaExtra, setPantallaExtra] = useState(null)
  const [mostrandoConfig, setMostrandoConfig] = useState(false)
  const jugadoresHook = useJugadores(grupoActivo?.id)
  const { destino, limpiarDestino } = useNotificaciones()

  // Navegación pedida al tocar una notificación
  useEffect(() => {
    if (!destino) return
    if (destino === 'jugadores') {
      if (esAdminDelGrupo) setPantallaExtra('jugadores')
    } else {
      setPantallaExtra(null)
      setPaginaActual(destino)
    }
    setMostrandoConfig(false)
    limpiarDestino()
  }, [destino])

  if (pantallaExtra === 'jugadores' && esAdminDelGrupo) {
    return (
      <PaginaJugadores
        {...jugadoresHook}
        grupoId={grupoActivo.id}
        onVolver={() => setPantallaExtra(null)}
      />
    )
  }

  if (pantallaExtra === 'perfil' && jugadorActual) {
    return (
      <PaginaMiPerfil
        jugador={jugadorActual}
        onGuardado={jugadoresHook.cargarJugadores}
        onVolver={() => setPantallaExtra(null)}
      />
    )
  }

  return (
    <div className="min-h-screen bg-dark">
      {/* Header */}
      <header
        className="fixed top-0 left-0 right-0 z-40 border-b border-white/[0.08] backdrop-blur-md"
        style={{ background: 'rgba(13,17,23,0.85)', paddingTop: 'env(safe-area-inset-top, 0px)' }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-3">
          <div className="min-w-0 flex-1 mr-2">
            <h1
              className="font-black uppercase text-white leading-none"
              style={{ letterSpacing: '0.12em', fontSize: '17px' }}
            >
              FULBO{' '}
              <span className="text-neon" style={{ textShadow: '0 0 12px rgba(0,230,118,0.6)' }}>
                APP
              </span>
            </h1>
            <p className="text-texto-sec truncate mt-1" style={{ fontSize: '11px' }}>
              {grupoActivo?.nombre}
              {esAdminDelGrupo && (
                <span className="ml-2 text-gold font-semibold uppercase" style={{ fontSize: '9px', letterSpacing: '0.08em' }}>
                  · Admin
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {esAdminDelGrupo && (
              <button
                onClick={() => setPantallaExtra('jugadores')}
                className="btn-vidrio flex items-center gap-1.5 text-texto px-3 py-2 uppercase font-semibold"
                style={{ fontSize: '10px', letterSpacing: '0.06em' }}
              >
                <span>👥</span>
                <span className="hidden sm:inline">Jugadores</span>
              </button>
            )}
            <CampanaNotificaciones />
            <button
              onClick={() => setMostrandoConfig(true)}
              className="btn-vidrio px-2.5 py-2 text-sm"
              title="Configuración del grupo"
              aria-label="Configuración del grupo"
            >
              ⚙️
            </button>
          </div>
        </div>

        {/* Pestañas superiores (solo desktop; en mobile está la barra inferior) */}
        <nav className="hidden lg:flex max-w-7xl mx-auto border-t border-white/[0.06]">
          {TABS.map((tab) => {
            const activa = paginaActual === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setPaginaActual(tab.id)}
                className={`relative flex-1 flex flex-col items-center gap-0.5 py-2 transition-all duration-200 ${
                  activa ? 'text-neon' : 'text-texto-sec hover:text-texto'
                }`}
                style={activa ? { background: 'radial-gradient(ellipse at bottom, rgba(0,230,118,0.18), transparent 70%)' } : undefined}
              >
                <span className="text-base" style={activa ? { filter: 'drop-shadow(0 0 6px rgba(0,230,118,0.6))' } : undefined}>
                  {tab.icono}
                </span>
                <span className={`uppercase ${activa ? 'font-bold' : 'font-semibold'}`} style={{ fontSize: '10px', letterSpacing: '0.06em' }}>
                  {tab.etiqueta}
                </span>
                {activa && (
                  <span
                    className="absolute bottom-0 left-0 right-0 h-[3px] bg-neon"
                    style={{ boxShadow: '0 0 10px rgba(0,230,118,0.9), 0 0 22px rgba(0,230,118,0.5)' }}
                  />
                )}
              </button>
            )
          })}
        </nav>
      </header>

      <main className="pb-24 lg:pb-8 pt-[calc(64px+env(safe-area-inset-top,0px))] lg:pt-[calc(118px+env(safe-area-inset-top,0px))]">
        {paginaActual === 'partido' && (
          <PaginaPartido
            jugadores={jugadoresHook.jugadores}
            cargandoJugadores={jugadoresHook.cargando}
            grupoId={grupoActivo?.id}
            jugadorActual={jugadorActual}
            esAdmin={esAdminDelGrupo}
          />
        )}
        {paginaActual === 'stats' && (
          <PaginaStats
            grupoId={grupoActivo?.id}
            jugadores={jugadoresHook.jugadores}
            onRecargarJugadores={jugadoresHook.cargarJugadores}
          />
        )}
        {paginaActual === 'mvp' && (
          <PaginaMVP
            grupoId={grupoActivo?.id}
            jugadores={jugadoresHook.jugadores}
            cargandoJugadores={jugadoresHook.cargando}
            jugadorActual={jugadorActual}
            esAdmin={esAdminDelGrupo}
          />
        )}
        {paginaActual === 'noticias' && (
          <PaginaNoticias
            club={jugadorActual?.club?.trim() || null}
            onIrAPerfil={jugadorActual ? () => setPantallaExtra('perfil') : null}
          />
        )}
      </main>

      <Navbar paginaActual={paginaActual} onCambiarPagina={setPaginaActual} />

      {mostrandoConfig && (
        <PanelConfiguracion
          onAbrirPerfil={() => { setMostrandoConfig(false); setPantallaExtra('perfil') }}
          onCerrar={() => setMostrandoConfig(false)}
        />
      )}
    </div>
  )
}

function Spinner() {
  return (
    <div className="min-h-screen bg-dark flex items-center justify-center">
      <div className="text-center">
        <div className="text-3xl animate-bounce mb-2">⚽</div>
        <p className="text-[#7D8590] text-xs uppercase tracking-widest">Cargando...</p>
      </div>
    </div>
  )
}

// Flujo: login → mis grupos → (pendiente de aprobación) → app del grupo
export default function App() {
  const { usuario, cargando: authCargando } = useAuth()
  const { grupoActivo, jugadorActual, esAdminDelGrupo, cargando: grupoCargando } = useGrupo()

  if (authCargando) return <Spinner />
  if (!usuario) return <PaginaLogin />
  if (grupoCargando) return <Spinner />
  if (!grupoActivo) return <PaginaMisGrupos />
  // El admin entra aunque no tenga jugador propio, para poder gestionar el grupo
  if (!jugadorActual && !esAdminDelGrupo) return <PaginaPendiente />
  // key: al cambiar de grupo se reinicia todo el estado de la app
  return <AppContenido key={grupoActivo.id} />
}
