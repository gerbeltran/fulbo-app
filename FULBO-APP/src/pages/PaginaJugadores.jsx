import { useState } from 'react'
import TarjetaJugador from '../components/jugadores/TarjetaJugador'
import FormularioJugador from '../components/jugadores/FormularioJugador'
import ModalVincularSolicitud from '../components/jugadores/ModalVincularSolicitud'
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
        await agregarJugador({
          ...datos,
          foto_url: datos.foto_url || solicitudParaVincular.foto_url || '',
          uid_firebase: solicitudParaVincular.uid,
        })
        await marcarVinculada(solicitudParaVincular)
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
    <div className="min-h-screen bg-[#1a1f2e]">
      {/* Header */}
      <header className="bg-[#1e3a28] border-b-2 border-[#2d5a3d] px-4 pt-4 pb-5">
        <div className="flex items-center gap-3 mb-2">
          <button
            onClick={onVolver}
            className="p-1.5 text-[#81c784] hover:text-white transition-colors text-base"
          >
            ←
          </button>
          <h1
            className="font-bold text-white uppercase tracking-widest"
            style={{ fontSize: '13px' }}
          >
            Jugadores
          </h1>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-[#81c784] text-xs">
            {cargando
              ? 'Cargando...'
              : `${totalActivos} activos · ${jugadores.length} en total`}
          </p>
          <button
            onClick={handleAbrirNuevo}
            disabled={cargando}
            className="bg-[#245c33] border border-[#2d7a3d] text-white px-3 py-1.5 font-semibold uppercase disabled:opacity-50 transition-colors"
            style={{ fontSize: '10px', letterSpacing: '0.06em', borderRadius: '3px' }}
          >
            + Agregar
          </button>
        </div>
      </header>

      {/* Filtros */}
      <div
        className="flex border-b border-[#2a3040] bg-[#242b3d]"
        style={{ borderTop: '1px solid #2a3040' }}
      >
        {FILTROS.map((f) => (
          <button
            key={f.valor}
            onClick={() => setFiltro(f.valor)}
            className={`flex-1 py-2.5 font-semibold uppercase transition-colors ${
              filtro === f.valor
                ? 'text-[#4caf50] border-b-2 border-[#4caf50]'
                : 'text-[#6b7a8d] hover:text-[#8892a4]'
            }`}
            style={{ fontSize: '10px', letterSpacing: '0.06em' }}
          >
            {f.etiqueta}
          </button>
        ))}
      </div>

      {/* Solicitudes de acceso pendientes */}
      {solicitudes.length > 0 && (
        <div className="border-b border-[#2a3040] bg-[#1e2435]">
          <div className="px-4 pt-3 pb-1 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#fb923c] animate-pulse" />
            <p
              className="text-[#fb923c] uppercase font-semibold tracking-widest"
              style={{ fontSize: '10px' }}
            >
              Accesos pendientes ({solicitudes.length})
            </p>
          </div>
          {solicitudes.map((s) => (
            <div
              key={s.uid}
              className="px-4 py-3 flex items-center justify-between gap-3 border-t border-[#2a3040]"
            >
              <div className="min-w-0">
                <p className="text-[#e0e6f0] text-sm font-medium truncate">
                  {s.nombre_display || s.email}
                </p>
                <p className="text-[#6b7a8d] text-xs truncate">{s.email}</p>
              </div>
              <button
                onClick={() => setSolicitudParaVincular(s)}
                className="shrink-0 bg-[#245c33] border border-[#2d7a3d] text-white px-3 py-1.5 font-semibold uppercase transition-colors hover:bg-[#2d7a3d]"
                style={{ fontSize: '10px', borderRadius: '3px' }}
              >
                Vincular
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Contenido */}
      <div className="pb-24">
        {cargando ? (
          <div>
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="bg-[#1e2435] border-b border-[#242b3d] p-3 flex items-center gap-3 animate-pulse"
              >
                <div className="w-11 h-11 bg-[#2a3040] shrink-0" style={{ borderRadius: '3px' }} />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-[#2a3040] rounded w-2/3" />
                  <div className="h-2.5 bg-[#2a3040] rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-16 px-4">
            <div className="text-4xl mb-3">⚠️</div>
            <p className="text-[#e0e6f0] font-medium mb-1 text-sm">{error}</p>
            <p className="text-[#6b7a8d] text-xs mb-6">
              Revisá tu conexión e intentá de nuevo.
            </p>
            <button
              onClick={cargarJugadores}
              className="bg-[#245c33] border border-[#2d7a3d] text-white px-5 py-2 font-semibold uppercase"
              style={{ fontSize: '11px', borderRadius: '3px' }}
            >
              Reintentar
            </button>
          </div>
        ) : jugadoresFiltrados.length === 0 ? (
          <div className="text-center py-16 text-[#6b7a8d]">
            <div className="text-5xl mb-3">👥</div>
            <p className="font-medium text-sm">No hay jugadores aquí</p>
          </div>
        ) : (
          <div>
            {jugadoresFiltrados.map((jugador) => (
              <TarjetaJugador
                key={jugador.id}
                jugador={jugador}
                onEditar={handleAbrirEditar}
                onEliminar={setConfirmandoEliminar}
              />
            ))}
          </div>
        )}
      </div>

      {/* FAB */}
      {!cargando && !error && (
        <button
          onClick={handleAbrirNuevo}
          className="fixed bottom-6 right-4 w-12 h-12 bg-[#245c33] border border-[#2d7a3d] text-white shadow-lg flex items-center justify-center text-2xl transition-all z-30"
          style={{ borderRadius: '3px' }}
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
          onCancelar={handleCancelarModal}
        />
      )}

      {/* Confirmar eliminación */}
      {confirmandoEliminar && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div
            className="bg-[#1e2435] border border-[#2a3040] p-5 max-w-sm w-full"
            style={{ borderRadius: '4px' }}
          >
            <h3
              className="font-bold text-[#e0e6f0] mb-2 uppercase tracking-wide"
              style={{ fontSize: '13px' }}
            >
              Eliminar jugador
            </h3>
            <p className="text-[#8892a4] text-sm mb-5">
              ¿Seguro que querés eliminar a{' '}
              <strong className="text-[#e0e6f0]">{confirmandoEliminar.nombre}</strong>?
              Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmandoEliminar(null)}
                disabled={eliminando}
                className="flex-1 py-2.5 border border-[#2a3040] text-[#8892a4] font-semibold uppercase disabled:opacity-50 transition-colors"
                style={{ fontSize: '11px', borderRadius: '3px' }}
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmarEliminar}
                disabled={eliminando}
                className="flex-1 py-2.5 bg-[#5c2424] border border-[#7a2d2d] text-white font-semibold uppercase disabled:opacity-50 transition-colors"
                style={{ fontSize: '11px', borderRadius: '3px' }}
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
