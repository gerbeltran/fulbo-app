import { useState } from 'react'
import CampanaNotificaciones from '../components/CampanaNotificaciones'
import TarjetaJugador from '../components/jugadores/TarjetaJugador'
import FormularioJugador from '../components/jugadores/FormularioJugador'
import ModalVincularSolicitud from '../components/jugadores/ModalVincularSolicitud'
import ModalEstadisticasJugador from '../components/jugadores/ModalEstadisticasJugador'
import { useSolicitudes } from '../hooks/useSolicitudes'

const FILTROS = [
  { valor: 'todos', etiqueta: 'Todos' },
  { valor: 'activos', etiqueta: 'Activos' },
  { valor: 'inactivos', etiqueta: 'Inactivos' },
]

export default function PaginaJugadores({
  jugadores,
  cargando,
  error,
  cargarJugadores,
  agregarJugador,
  editarJugador,
  desvincularCuenta,
  eliminarJugador,
  grupoId,
  onVolver,
}) {
  const [modalAbierto, setModalAbierto] = useState(false)
  const [jugadorEditando, setJugadorEditando] = useState(null)
  const [confirmandoEliminar, setConfirmandoEliminar] = useState(null)
  const [editandoEstadisticas, setEditandoEstadisticas] = useState(null)
  const [filtro, setFiltro] = useState('todos')
  const [guardando, setGuardando] = useState(false)
  const [eliminando, setEliminando] = useState(false)
  // Solicitud elegida: primero se abre el modal de vinculación y, si el admin
  // elige "crear jugador nuevo", el formulario
  const [solicitudParaVincular, setSolicitudParaVincular] = useState(null)
  const [vinculando, setVinculando] = useState(false)
  const {
    solicitudes, verificarCuentaLibre, vincularSolicitud,
    marcarVinculada, rechazarSolicitud,
  } = useSolicitudes(grupoId)

  const jugadoresSinCuenta = jugadores.filter((j) => !j.uid_firebase)

  const jugadoresFiltrados = jugadores.filter((j) => {
    if (filtro === 'activos') return j.activo
    if (filtro === 'inactivos') return !j.activo
    return true
  })

  const totalActivos = jugadores.filter((j) => j.activo).length

  function handleAbrirNuevo() {
    setJugadorEditando(null)
    setSolicitudParaVincular(null)
    setModalAbierto(true)
  }

  function handleCrearDesdeSolicitud() {
    setJugadorEditando(null)
    setModalAbierto(true)
  }

  async function handleVincularExistente(jugadorId) {
    setVinculando(true)
    try {
      await vincularSolicitud(solicitudParaVincular, jugadorId)
      await cargarJugadores()
      setSolicitudParaVincular(null)
    } catch (err) {
      console.error(err)
      alert(err.message || 'No se pudo vincular. Intentá de nuevo.')
    } finally {
      setVinculando(false)
    }
  }

  async function handleRechazar() {
    setVinculando(true)
    try {
      await rechazarSolicitud(solicitudParaVincular)
      setSolicitudParaVincular(null)
    } catch (err) {
      console.error(err)
      alert('No se pudo rechazar. Intentá de nuevo.')
    } finally {
      setVinculando(false)
    }
  }

  async function handleDesvincular(jugador) {
    await desvincularCuenta(jugador.id)
    setJugadorEditando((prev) => (prev ? { ...prev, uid_firebase: null } : prev))
  }

  function handleAbrirEditar(jugador) {
    setJugadorEditando(jugador)
    setModalAbierto(true)
  }

  async function handleGuardar(datos) {
    setGuardando(true)
    try {
      if (jugadorEditando) {
        await editarJugador(jugadorEditando.id, datos)
      } else if (solicitudParaVincular) {
        // Jugador nuevo para la cuenta que pidió entrar
        await verificarCuentaLibre(solicitudParaVincular.uid)
        const nuevoId = await agregarJugador({
          ...datos,
          foto_url: datos.foto_url || solicitudParaVincular.foto_url || '',
          uid_firebase: solicitudParaVincular.uid,
        })
        await marcarVinculada(solicitudParaVincular, nuevoId)
      } else {
        await agregarJugador(datos)
      }
      setModalAbierto(false)
      setJugadorEditando(null)
      setSolicitudParaVincular(null)
    } catch (err) {
      console.error(err)
      alert(err.message || 'Ocurrió un error al guardar. Intentá de nuevo.')
    } finally {
      setGuardando(false)
    }
  }

  function handleCancelarModal() {
    setModalAbierto(false)
    setJugadorEditando(null)
    setSolicitudParaVincular(null)
  }

  async function handleConfirmarEliminar() {
    setEliminando(true)
    try {
      await eliminarJugador(confirmandoEliminar.id)
      setConfirmandoEliminar(null)
    } catch (err) {
      console.error(err)
      alert('Ocurrió un error al eliminar. Intentá de nuevo.')
    } finally {
      setEliminando(false)
    }
  }

  return (
    <div className="min-h-screen bg-dark">
      {/* Header */}
      <header
        className="sticky top-0 z-30 border-b border-white/[0.08] backdrop-blur-md px-4 pt-4 pb-4"
        style={{ background: 'rgba(13,17,23,0.85)', top: 'env(safe-area-inset-top, 0px)' }}
      >
        <div className="flex items-center gap-3 mb-2">
          <button
            onClick={onVolver}
            className="p-1.5 text-[#00E676] hover:text-white transition-colors text-base"
          >
            ←
          </button>
          <h1
            className="font-extrabold text-white uppercase tracking-widest"
            style={{ fontSize: '14px' }}
          >
            Jugadores
          </h1>
          <div className="ml-auto">
            <CampanaNotificaciones />
          </div>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-texto-sec text-xs">
            {cargando
              ? 'Cargando...'
              : `${totalActivos} activos · ${jugadores.length} en total`}
          </p>
          <button
            onClick={handleAbrirNuevo}
            disabled={cargando}
            className="bg-neon text-dark font-bold hover:shadow-[0_0_18px_rgba(0,230,118,0.45)] hover:brightness-110 px-3 py-1.5 font-semibold uppercase disabled:opacity-50 transition-colors"
            style={{ fontSize: '10px', letterSpacing: '0.06em', borderRadius: '8px' }}
          >
            + Agregar
          </button>
        </div>
      </header>

      {/* Filtros */}
      <div className="flex border-b border-white/[0.08] bg-white/[0.02]">
        {FILTROS.map((f) => (
          <button
            key={f.valor}
            onClick={() => setFiltro(f.valor)}
            className={`flex-1 py-2.5 font-semibold uppercase transition-colors ${
              filtro === f.valor
                ? 'text-[#00E676] border-b-2 border-[#00E676]'
                : 'text-[#7D8590] hover:text-[#8B949E]'
            }`}
            style={{ fontSize: '10px', letterSpacing: '0.06em' }}
          >
            {f.etiqueta}
          </button>
        ))}
      </div>

      {/* Solicitudes de acceso pendientes */}
      {solicitudes.length > 0 && (
        <div className="px-4 pt-4">
          <div
            className="tarjeta-vidrio overflow-hidden border-gold/40"
            style={{ borderColor: 'rgba(245,158,11,0.4)', boxShadow: '0 0 20px rgba(245,158,11,0.12)' }}
          >
            <div className="px-4 py-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-gold animate-pulse" />
              <p className="text-gold uppercase font-bold tracking-widest" style={{ fontSize: '10px' }}>
                Accesos pendientes
              </p>
              <span className="ml-auto bg-gold text-dark font-extrabold rounded-full px-2 py-0.5" style={{ fontSize: '11px' }}>
                {solicitudes.length}
              </span>
            </div>
            {solicitudes.map((s) => (
              <div
                key={s.uid}
                className="px-4 py-3 flex items-center justify-between gap-3 border-t border-white/[0.08]"
              >
                <div className="min-w-0">
                  <p className="text-texto text-sm font-semibold truncate">
                    {s.nombre_display || s.email}
                  </p>
                  <p className="text-texto-sec text-xs truncate">{s.email}</p>
                </div>
                <button
                  onClick={() => setSolicitudParaVincular(s)}
                  className="shrink-0 bg-gold text-dark font-bold px-3 py-1.5 uppercase rounded-lg hover:shadow-[0_0_14px_rgba(245,158,11,0.5)] transition-all duration-200"
                  style={{ fontSize: '10px' }}
                >
                  Vincular
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Contenido */}
      <div className="max-w-5xl mx-auto px-4 pt-4 pb-24">
        {cargando ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="tarjeta-vidrio p-4 flex flex-col items-center gap-2 animate-pulse">
                <div className="w-14 h-14 rounded-full bg-white/[0.08]" />
                <div className="h-3 bg-white/[0.08] rounded w-2/3" />
                <div className="h-2.5 bg-white/[0.08] rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-16 px-4">
            <div className="text-4xl mb-3">⚠️</div>
            <p className="text-[#F0F6FC] font-medium mb-1 text-sm">{error}</p>
            <p className="text-[#7D8590] text-xs mb-6">
              Revisá tu conexión e intentá de nuevo.
            </p>
            <button
              onClick={cargarJugadores}
              className="bg-neon text-dark font-bold hover:shadow-[0_0_18px_rgba(0,230,118,0.45)] hover:brightness-110 px-5 py-2 font-semibold uppercase"
              style={{ fontSize: '11px', borderRadius: '8px' }}
            >
              Reintentar
            </button>
          </div>
        ) : jugadoresFiltrados.length === 0 ? (
          <div className="text-center py-16 text-[#7D8590]">
            <div className="text-5xl mb-3">👥</div>
            <p className="font-medium text-sm">No hay jugadores aquí</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {jugadoresFiltrados.map((jugador) => (
              <TarjetaJugador
                key={jugador.id}
                jugador={jugador}
                onEditar={handleAbrirEditar}
                onEliminar={setConfirmandoEliminar}
                onEditarEstadisticas={setEditandoEstadisticas}
              />
            ))}
          </div>
        )}
      </div>

      {/* FAB */}
      {!cargando && !error && (
        <button
          onClick={handleAbrirNuevo}
          className="fixed right-4 w-14 h-14 btn-primario rounded-full flex items-center justify-center text-2xl z-30"
          style={{ bottom: 'calc(1.5rem + env(safe-area-inset-bottom, 0px))', boxShadow: '0 0 20px rgba(0,230,118,0.45)' }}
          aria-label="Agregar jugador"
        >
          +
        </button>
      )}

      {/* Modal vincular solicitud */}
      {solicitudParaVincular && !modalAbierto && (
        <ModalVincularSolicitud
          solicitud={solicitudParaVincular}
          jugadoresSinCuenta={jugadoresSinCuenta}
          procesando={vinculando}
          onVincular={handleVincularExistente}
          onCrearNuevo={handleCrearDesdeSolicitud}
          onRechazar={handleRechazar}
          onCancelar={() => setSolicitudParaVincular(null)}
        />
      )}

      {/* Modal formulario */}
      {modalAbierto && (
        <FormularioJugador
          jugador={jugadorEditando}
          nombreSugerido={solicitudParaVincular?.nombre_display ?? ''}
          emailVinculado={solicitudParaVincular?.email ?? ''}
          guardando={guardando}
          onGuardar={handleGuardar}
          onDesvincular={handleDesvincular}
          onFotoCambiada={cargarJugadores}
          onCancelar={handleCancelarModal}
        />
      )}

      {/* Ajuste manual de estadísticas (esta pantalla es solo del admin) */}
      {editandoEstadisticas && (
        <ModalEstadisticasJugador
          jugador={editandoEstadisticas}
          onGuardar={async (estadisticas) => {
            await editarJugador(editandoEstadisticas.id, estadisticas)
            setEditandoEstadisticas(null)
          }}
          onCancelar={() => setEditandoEstadisticas(null)}
        />
      )}

      {/* Confirmar eliminación */}
      {confirmandoEliminar && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div
            className="bg-card border border-white/[0.08] p-5 max-w-sm w-full"
            style={{ borderRadius: '12px' }}
          >
            <h3
              className="font-bold text-[#F0F6FC] mb-2 uppercase tracking-wide"
              style={{ fontSize: '13px' }}
            >
              Eliminar jugador
            </h3>
            <p className="text-[#8B949E] text-sm mb-5">
              ¿Seguro que querés eliminar a{' '}
              <strong className="text-[#F0F6FC]">{confirmandoEliminar.nombre}</strong>?
              Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmandoEliminar(null)}
                disabled={eliminando}
                className="flex-1 py-2.5 border border-white/[0.08] text-[#8B949E] font-semibold uppercase disabled:opacity-50 transition-colors"
                style={{ fontSize: '11px', borderRadius: '8px' }}
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmarEliminar}
                disabled={eliminando}
                className="flex-1 py-2.5 bg-red-500/20 border border-red-500/50 text-white font-semibold uppercase disabled:opacity-50 transition-colors"
                style={{ fontSize: '11px', borderRadius: '8px' }}
              >
                {eliminando ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
