import { useAuth } from '../context/AuthContext'
import { useGrupo } from '../context/GrupoContext'

// Se muestra cuando el usuario entró a un grupo con el código pero el admin
// todavía no vinculó su cuenta a un jugador. Al vincularla, la app avanza sola.
export default function PaginaPendiente() {
  const { usuario, cerrarSesion } = useAuth()
  const { grupoActivo, seleccionarGrupo } = useGrupo()

  return (
    <div className="min-h-screen bg-dark flex flex-col items-center justify-center px-6">
      <div className="mb-8 text-center">
        <h1
          className="font-bold uppercase text-white"
          style={{ fontSize: '28px', letterSpacing: '0.15em' }}
        >
          FUL<span style={{ color: '#00E676' }}>BO</span>
        </h1>
      </div>

      <div className="w-full max-w-sm bg-card border border-neon/25 rounded-xl p-6 flex flex-col gap-4 text-center">
        <div className="text-4xl">⏳</div>
        <h2 className="text-white font-bold text-base uppercase tracking-wide">
          Pendiente de aprobación
        </h2>
        <p className="text-[#8B949E] text-sm">
          Pediste unirte a{' '}
          <span className="text-white font-semibold">{grupoActivo?.nombre}</span>{' '}
          con <span className="text-[#00E676]">{usuario?.email}</span>.
        </p>
        <p className="text-[#8B949E] text-sm">
          El admin del grupo tiene que vincular tu cuenta a tu jugador.
          Cuando lo haga, esta pantalla se actualiza sola.
        </p>
        <button
          onClick={() => seleccionarGrupo(null)}
          className="mt-1 w-full bg-dark border border-neon/25 text-white py-2.5 rounded-lg text-sm font-semibold hover:border-[#00E676] transition-colors"
        >
          ← Mis grupos
        </button>
        <button
          onClick={cerrarSesion}
          className="text-[#7D8590] text-sm hover:text-[#00E676] transition-colors underline"
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  )
}
