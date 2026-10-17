import { useState } from 'react'

const POSICION_ESTILOS = {
  ARQ: 'bg-[#3d3000] text-[#f59e0b]',
  DEF: 'bg-[#1e3a5f] text-[#60a5fa]',
  MED: 'bg-[#2d1b5e] text-[#c084fc]',
  DEL: 'bg-[#5c1a1a] text-[#f87171]',
}

function Avatar({ nombre }) {
  const iniciales = nombre
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase()
  return (
    <div className="w-8 h-8 rounded-full bg-[#245c33] flex items-center justify-center text-white font-bold text-xs shrink-0">
      {iniciales}
    </div>
  )
}

function TarjetaEquipo({ nombre, colorBorde, colorFondo, jugadores }) {
  const nivelTotal = jugadores.reduce((s, j) => s + (j.nivel_general ?? 0), 0)
  return (
    <div className={`rounded-xl border-2 ${colorBorde} ${colorFondo} p-4`}>
      <div className="flex justify-between items-center mb-3">
        <h4 className="font-bold text-[#e0e6f0]">{nombre}</h4>
        <span className="text-xs bg-[#1a1f2e]/60 px-2 py-1 rounded-lg font-semibold text-[#8892a4]">
          Nivel total: {nivelTotal}
        </span>
      </div>
      <div className="space-y-2">
        {jugadores.map((j) => (
          <div key={j.id} className="flex items-center gap-2">
            <Avatar nombre={j.nombre} />
            <span className="text-sm text-[#e0e6f0] flex-1 truncate">
              {j.nombre}
            </span>
            <span
              className={`text-xs px-1.5 py-0.5 rounded font-medium shrink-0 ${
                POSICION_ESTILOS[j.posicion_preferida]
              }`}
            >
              {j.posicion_preferida}
            </span>
            <span className="text-xs text-[#6b7a8d] shrink-0 w-8 text-right">
              ★{j.nivel_general}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function EquiposGenerados({ combinaciones }) {
  const [indice, setIndice] = useState(0)

  if (!combinaciones || combinaciones.length === 0) {
    return (
      <div className="text-center py-8 text-[#6b7a8d]">
        <p>No hay equipos generados.</p>
      </div>
    )
  }

  const comb = combinaciones[indice]
  const niv1 = comb.equipo1.reduce((s, j) => s + (j.nivel_general ?? 0), 0)
  const niv2 = comb.equipo2.reduce((s, j) => s + (j.nivel_general ?? 0), 0)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-[#e0e6f0] text-lg">⚽ Equipos generados</h3>
        <span
          className={`text-sm font-semibold px-2.5 py-1 rounded-lg ${
            comb.diferencia === 0
              ? 'bg-[#1b3d22] text-[#4caf50]'
              : 'bg-[#3d2a00] text-[#f59e0b]'
          }`}
        >
          Dif. niveles: {comb.diferencia}
        </span>
      </div>

      {/* Equipos */}
      <TarjetaEquipo
        nombre="Equipo 1"
        colorBorde="border-[#1e3a5f]"
        colorFondo="bg-[#1a2535]"
        jugadores={comb.equipo1}
      />
      <TarjetaEquipo
        nombre="Equipo 2"
        colorBorde="border-[#5f3a1e]"
        colorFondo="bg-[#251e15]"
        jugadores={comb.equipo2}
      />

      {/* Nivel total vs */}
      <div className="flex items-center justify-center gap-3 text-sm text-[#8892a4]">
        <span className="font-bold text-[#60a5fa]">{niv1}</span>
        <span>vs</span>
        <span className="font-bold text-[#fb923c]">{niv2}</span>
      </div>

      {/* Navegación entre alternativas */}
      {combinaciones.length > 1 && (
        <div>
          <p className="text-xs text-[#6b7a8d] text-center mb-2">
            {combinaciones.length} combinaciones alternativas:
          </p>
          <div className="flex gap-1.5 flex-wrap justify-center">
            {combinaciones.map((c, i) => (
              <button
                key={i}
                onClick={() => setIndice(i)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  i === indice
                    ? 'bg-[#245c33] border border-[#2d7a3d] text-white'
                    : 'bg-[#242b3d] text-[#8892a4] hover:bg-[#2a3040]'
                }`}
              >
                #{i + 1} · dif {c.diferencia}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
