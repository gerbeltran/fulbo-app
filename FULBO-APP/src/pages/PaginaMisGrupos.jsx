import { useEffect, useState } from 'react'
import { useGrupo } from '../context/GrupoContext'
import { useAuth } from '../context/AuthContext'
import { obtenerJugadoresSinGrupo } from '../firebase/grupos'
import CampanaNotificaciones from '../components/CampanaNotificaciones'

export default function PaginaMisGrupos() {
  const { misGrupos, seleccionarGrupo, crearGrupo, unirseAGrupo, cargando, error: errorGrupos } = useGrupo()
  const { cerrarSesion, usuario } = useAuth()
  const [modo, setModo] = useState(null) // 'crear' | 'unirse' | null
  const [nombre, setNombre] = useState('')
  const [codigo, setCodigo] = useState('')
  const [procesando, setProcesando] = useState(false)
  const [error, setError] = useState(null)

  // Datos cargados antes de que existieran los grupos (se importan una sola vez)
  const [jugadoresSinGrupo, setJugadoresSinGrupo] = useState([])
  const [importar, setImportar] = useState(true)
  const [jugadorPropioId, setJugadorPropioId] = useState('')

  useEffect(() => {
    if (modo !== 'crear') return
    async function cargar() {
      setJugadoresSinGrupo(await obtenerJugadoresSinGrupo())
    }
    cargar()
  }, [modo])

  async function handleCrear() {
    if (!nombre.trim()) return
    setProcesando(true)
    setError(null)
    try {
      const hayParaImportar = importar && jugadoresSinGrupo.length > 0
      await crearGrupo(nombre.trim(), {
        importarDatosAnteriores: hayParaImportar,
        jugadorPropioId: hayParaImportar ? jugadorPropioId || null : null,
      })
      setModo(null)
      setNombre('')
    } catch (err) {
      setError(err.message)
    } finally {
      setProcesando(false)
    }
  }

  async function handleUnirse() {
    if (codigo.trim().length < 6) return
    setProcesando(true)
    setError(null)
    try {
      await unirseAGrupo(codigo.trim())
      setModo(null)
      setCodigo('')
    } catch (err) {
      setError(err.message)
    } finally {
      setProcesando(false)
    }
  }

  if (cargando) {
    return (
      <div className="min-h-screen bg-[#1a1f2e] flex items-center justify-center">
        <p className="text-[#6b7a8d] text-sm">Cargando grupos...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#1a1f2e] px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1
            className="font-bold uppercase text-white"
            style={{ fontSize: '20px', letterSpacing: '0.12em' }}
          >
            FUL<span style={{ color: '#4caf50' }}>BO</span>
          </h1>
          <p className="text-[#6b7a8d] mt-0.5" style={{ fontSize: '11px' }}>
            {usuario?.email}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <CampanaNotificaciones />
          <button
            onClick={cerrarSesion}
            className="text-[#6b7a8d] text-xs hover:text-[#4caf50] border border-[#2d5a3d] px-3 py-1.5 rounded transition-colors"
          >
            Salir
          </button>
        </div>
      </div>

      <p
        className="text-[#6b7a8d] uppercase tracking-widest mb-3"
        style={{ fontSize: '10px' }}
      >
        Mis grupos
      </p>

      {errorGrupos && (
        <p className="text-red-400 text-xs mb-3">{errorGrupos}</p>
      )}

      {/* Lista de grupos */}
      {misGrupos.length === 0 ? (
        <div className="bg-[#1e2435] border border-[#2d5a3d] rounded-xl p-6 text-center mb-4">
          <p className="text-[#6b7a8d] text-sm">No pertenecés a ningún grupo todavía.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3 mb-4">
          {misGrupos.map((grupo) => (
            <button
              key={grupo.id}
              onClick={() => seleccionarGrupo(grupo.id)}
              className="w-full bg-[#1e2435] border border-[#2d5a3d] rounded-xl p-4 text-left hover:border-[#4caf50] transition-colors flex items-center justify-between"
            >
              <div>
                <p className="text-white font-semibold text-sm">{grupo.nombre}</p>
                <div className="flex items-center gap-3 mt-1">
                  {grupo.pendiente ? (
                    <p className="text-[#fb923c] uppercase" style={{ fontSize: '10px' }}>
                      ⏳ Pendiente de aprobación
                    </p>
                  ) : (
                    <p className="text-[#6b7a8d] uppercase" style={{ fontSize: '10px' }}>
                      {grupo.mi_rol === 'admin' ? '⚙️ Admin' : '👤 Jugador'}
                    </p>
                  )}
                  {grupo.mi_rol === 'admin' && (
                    <span
                      className="text-[#4caf50] font-mono tracking-widest"
                      style={{ fontSize: '10px' }}
                    >
                      {grupo.codigo_invitacion}
                    </span>
                  )}
                </div>
              </div>
              <span className="text-[#4caf50] text-lg">→</span>
            </button>
          ))}
        </div>
      )}

      {/* Acciones */}
      {!modo && (
        <div className="flex flex-col gap-3">
          <button
            onClick={() => { setModo('crear'); setError(null) }}
            className="w-full bg-[#245c33] border border-[#2d7a3d] text-white py-3 rounded-xl font-semibold text-sm hover:bg-[#2d7a3d] transition-colors"
          >
            ⚽ Crear nuevo grupo
          </button>
          <button
            onClick={() => { setModo('unirse'); setError(null) }}
            className="w-full bg-[#1e2435] border border-[#2d5a3d] text-white py-3 rounded-xl font-semibold text-sm hover:border-[#4caf50] transition-colors"
          >
            🔗 Unirse con código
          </button>
        </div>
      )}

      {/* Formulario crear */}
      {modo === 'crear' && (
        <div className="bg-[#1e2435] border border-[#2d5a3d] rounded-xl p-4 flex flex-col gap-3">
          <h3 className="text-white font-semibold text-sm uppercase tracking-wide">
            Nuevo grupo
          </h3>
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <input
            type="text"
            placeholder="Nombre del grupo (ej: Los Pibes del Martes)"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="bg-[#1a1f2e] border border-[#2d5a3d] text-white rounded-lg px-3 py-2 text-sm outline-none focus:border-[#4caf50] transition-colors"
            autoFocus
          />

          {/* Importación única de los datos previos al multi-grupo */}
          {jugadoresSinGrupo.length > 0 && (
            <div className="bg-[#1a1f2e] border border-[#2d5a3d] rounded-lg p-3 flex flex-col gap-2">
              <label className="flex items-start gap-2 text-sm text-[#e0e6f0] cursor-pointer">
                <input
                  type="checkbox"
                  checked={importar}
                  onChange={(e) => setImportar(e.target.checked)}
                  className="mt-0.5 accent-[#4caf50]"
                />
                <span>
                  Importar los {jugadoresSinGrupo.length} jugadores y partidos cargados antes
                  <span className="block text-[#6b7a8d] text-xs">
                    Se hace una sola vez y quedan dentro de este grupo.
                  </span>
                </span>
              </label>
              {importar && (
                <div>
                  <p className="text-[#8892a4] text-xs mb-1">¿Cuál de ellos sos vos?</p>
                  <select
                    value={jugadorPropioId}
                    onChange={(e) => setJugadorPropioId(e.target.value)}
                    className="w-full bg-[#1e2435] border border-[#2d5a3d] text-white rounded-lg px-3 py-2 text-sm outline-none focus:border-[#4caf50]"
                  >
                    <option value="">Ninguno — crear mi jugador nuevo</option>
                    {jugadoresSinGrupo.map((j) => (
                      <option key={j.id} value={j.id}>{j.nombre}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={() => { setModo(null); setError(null); setNombre('') }}
              className="flex-1 border border-[#2d5a3d] text-[#6b7a8d] py-2.5 rounded-lg text-sm font-semibold"
            >
              Cancelar
            </button>
            <button
              onClick={handleCrear}
              disabled={procesando || !nombre.trim()}
              className="flex-1 bg-[#245c33] text-white py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50 transition-colors"
            >
              {procesando ? 'Creando...' : 'Crear'}
            </button>
          </div>
        </div>
      )}

      {/* Formulario unirse */}
      {modo === 'unirse' && (
        <div className="bg-[#1e2435] border border-[#2d5a3d] rounded-xl p-4 flex flex-col gap-3">
          <h3 className="text-white font-semibold text-sm uppercase tracking-wide">
            Código de invitación
          </h3>
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <input
            type="text"
            placeholder="Ej: X7KP2M"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
            maxLength={6}
            className="bg-[#1a1f2e] border border-[#2d5a3d] text-white rounded-lg px-3 py-2 text-sm outline-none focus:border-[#4caf50] uppercase tracking-widest text-center font-mono transition-colors"
            autoFocus
          />
          <div className="flex gap-2">
            <button
              onClick={() => { setModo(null); setError(null); setCodigo('') }}
              className="flex-1 border border-[#2d5a3d] text-[#6b7a8d] py-2.5 rounded-lg text-sm font-semibold"
            >
              Cancelar
            </button>
            <button
              onClick={handleUnirse}
              disabled={procesando || codigo.length < 6}
              className="flex-1 bg-[#245c33] text-white py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50 transition-colors"
            >
              {procesando ? 'Uniéndome...' : 'Unirse'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
