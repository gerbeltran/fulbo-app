import { useEffect, useState } from 'react'
import { useAuth } from './context/AuthContext'
import { useGrupo } from './context/GrupoContext'
import { useNotificaciones } from './context/NotificacionesContext'
import CampanaNotificaciones from './components/CampanaNotificaciones'
import { useJugadores } from './hooks/useJugadores'
import Navbar from './components/Navbar'
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

const TABS = [
  { id: 'partido', icono: '⚽', etiqueta: 'Partido' },
  { id: 'stats', icono: '📊', etiqueta: 'Stats' },
  { id: 'mvp', icono: '🏆', etiqueta: 'MVP' },
  { id: 'noticias', icono: '📰', etiqueta: 'Noticias' },
]

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
    <div className="min-h-screen bg-[#1a1f2e]">
      {/* Header */}
      <header
        className="fixed top-0 left-0 right-0 z-40 border-b-2 border-[#2d5a3d]"
        style={{ background: '#1e3a28' }}
      >
        <div className="flex items-center justify-between px-4 py-2.5">
          <div className="min-w-0 flex-1 mr-2">
            <h1
              className="font-bold uppercase text-white"
              style={{ letterSpacing: '0.12em', fontSize: '15px' }}
            >
              FUL<span style={{ color: '#4caf50' }}>BO</span>
              <span className="ml-1.5">APP</span>
            </h1>
            <p
              className="text-[#4caf50] truncate"
              style={{ fontSize: '9px', letterSpacing: '0.04em' }}
            >
              {grupoActivo?.nombre}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {esAdminDelGrupo && (
              <span
                className="text-[#81c784] bg-[#2d5a3d] border border-[#3d7a4d] px-2 py-0.5 uppercase font-semibold"
                style={{ fontSize: '9px', letterSpacing: '0.08em', borderRadius: '3px' }}
              >
                Admin
              </span>
            )}
            {esAdminDelGrupo && (
              <button
                onClick={() => setPantallaExtra('jugadores')}
                className="flex items-center gap-1.5 bg-[#245c33] border border-[#2d7a3d] text-white px-3 py-1.5 transition-colors uppercase font-semibold"
                style={{ fontSize: '10px', letterSpacing: '0.06em', borderRadius: '3px' }}
              >
                <span>👥</span>
                <span>Jugadores</span>
              </button>
            )}
            <CampanaNotificaciones />
            <button
              onClick={() => setMostrandoConfig(true)}
              className="text-[#6b7a8d] border border-[#2d5a3d] px-2 py-1.5 text-xs rounded hover:text-[#4caf50] hover:border-[#4caf50] transition-colors"
              title="Configuración del grupo"
              aria-label="Configuración del grupo"
            >
              ⚙️
            </button>
          </div>
        </div>

        {/* Nav tabs */}
        <div className="flex border-t border-[#2d5a3d]">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setPaginaActual(tab.id)}
              className={`flex-1 py-2 flex flex-col items-center gap-0.5 transition-colors ${
                paginaActual === tab.id
                  ? 'bg-[#245c33] text-white'
                  : 'text-[#6b8f74] hover:text-[#4caf50]'
              }`}
            >
              <span className="text-sm">{tab.icono}</span>
              <span
                className="uppercase font-semibold"
                style={{ fontSize: '9px', letterSpacing: '0.06em' }}
              >
                {tab.etiqueta}
              </span>
            </button>
          ))}
        </div>
      </header>

      <main className="pt-[86px] pb-16">
        {paginaActual === 'partido' && (
          <PaginaPartido
            jugadores={jugadoresHook.jugadores}
            cargandoJugadores={jugadoresHook.cargando}
            grupoId={grupoActivo?.id}
            jugadorActual={jugadorActual}
            esAdmin={esAdminDelGrupo}
          />
        )}
        {paginaActual === 'stats' && <PaginaStats />}
        {paginaActual === 'mvp' && <PaginaMVP />}
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
    <div className="min-h-screen bg-[#1a1f2e] flex items-center justify-center">
      <div className="text-center">
        <div className="text-3xl animate-bounce mb-2">⚽</div>
        <p className="text-[#6b7a8d] text-xs uppercase tracking-widest">Cargando...</p>
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
