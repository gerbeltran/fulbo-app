const W = 400, H = 220
const FX = 10, FY = 10, FW = 380, FH = 200
const CX = FX + FW / 2   // 200
const CY = FY + FH / 2   // 110

const LINE = 'rgba(255,255,255,0.85)'
const STRIPES = ['#15803d', '#166534']
const TEAM_COLORS = { A: '#2563EB', B: '#DC2626' }
const R = 11

// Ordenamiento defensivo→ofensivo para asignar filas de la formación 1-2-2
const POS_ORDER = { ARQ: 0, DEF: 1, MED: 2, DEL: 3 }

// Fracciones del campo (Team A ataca hacia la derecha, Team B hacia la izquierda)
const LAYOUT_X = {
  A: { arq: 0.07, def: 0.25, fwd: 0.42 },
  B: { arq: 0.93, def: 0.75, fwd: 0.58 },
}

// Distribuye 5 jugadores en filas 1-2-2 según posición real
function getFormation(players) {
  const sorted = [...players].sort(
    (a, b) =>
      (POS_ORDER[a.posicion_preferida] ?? 1) -
      (POS_ORDER[b.posicion_preferida] ?? 1)
  )
  return {
    arq: sorted.slice(0, 1),
    def: sorted.slice(1, 3),
    fwd: sorted.slice(3, 5),
  }
}

// Posiciones Y para n jugadores en la misma columna
function rowYs(n) {
  if (n === 0) return []
  if (n === 1) return [CY]
  if (n === 2) return [CY - 30, CY + 30]
  const step = 60 / (n - 1)
  return Array.from({ length: n }, (_, i) => CY - 37 + i * step)
}

function iniciales(nombre) {
  return nombre
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase()
}

function primerNombre(nombre) {
  const n = nombre.trim().split(' ')[0]
  return n.length > 9 ? n.slice(0, 8) + '…' : n
}

function PlayerNode({ jugador, team, x, y, voted, mostrarVoto }) {
  const color = TEAM_COLORS[team]
  return (
    <g transform={`translate(${x.toFixed(1)},${y.toFixed(1)})`}>
      <circle r={R} fill={color} stroke="white" strokeWidth="1.5" />
      <text
        textAnchor="middle"
        dominantBaseline="central"
        fill="white"
        fontSize="7.5"
        fontWeight="bold"
        fontFamily="system-ui,-apple-system,sans-serif"
      >
        {iniciales(jugador.nombre)}
      </text>
      <text
        y={R + 8}
        textAnchor="middle"
        fill="rgba(255,255,255,0.95)"
        fontSize="6.5"
        fontFamily="system-ui,-apple-system,sans-serif"
      >
        {primerNombre(jugador.nombre)}
      </text>
      {mostrarVoto && (
        <text
          y={R + 16}
          textAnchor="middle"
          fill={voted ? '#4ADE80' : 'rgba(255,255,255,0.38)'}
          fontSize="6.5"
          fontFamily="system-ui,-apple-system,sans-serif"
        >
          {voted ? '✓' : '○'}
        </text>
      )}
    </g>
  )
}

function renderTeam(players, team, participaciones, combIdx, mostrarVoto) {
  const { arq, def, fwd } = getFormation(players)
  const rows = [
    { role: 'arq', group: arq },
    { role: 'def', group: def },
    { role: 'fwd', group: fwd },
  ]

  return rows.flatMap(({ role, group }) => {
    if (!group.length) return []
    const x = FX + FW * LAYOUT_X[team][role]
    const ys = rowYs(group.length)
    return group.map((j, i) => {
      const partic = participaciones?.find((p) => p.jugador_id === j.id)
      const voted = partic?.votos_equipos?.[combIdx] !== undefined
      return (
        <PlayerNode
          key={j.id}
          jugador={j}
          team={team}
          x={x}
          y={ys[i]}
          voted={voted}
          mostrarVoto={mostrarVoto}
        />
      )
    })
  })
}

export default function CanichaFutbol({
  equipo1,
  equipo2,
  participaciones,
  combinacionActual,
  mostrarVotos = true,
}) {
  const combIdx = combinacionActual ?? 0

  return (
    <div className="w-full max-w-xs mx-auto rounded-xl overflow-hidden shadow-md">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        style={{ display: 'block' }}
        aria-label="Cancha de fútbol con equipos"
      >
        {/* Franjas de césped */}
        {Array.from({ length: 8 }, (_, i) => (
          <rect
            key={i}
            x={FX + (i * FW) / 8}
            y={FY}
            width={FW / 8}
            height={FH}
            fill={STRIPES[i % 2]}
          />
        ))}

        {/* Borde del campo */}
        <rect
          x={FX} y={FY} width={FW} height={FH}
          fill="none" stroke={LINE} strokeWidth="1.5"
        />

        {/* Línea central */}
        <line x1={CX} y1={FY} x2={CX} y2={FY + FH} stroke={LINE} strokeWidth="1.5" />

        {/* Círculo central */}
        <circle cx={CX} cy={CY} r="28" fill="none" stroke={LINE} strokeWidth="1.5" />
        <circle cx={CX} cy={CY} r="3" fill={LINE} />

        {/* Área grande izquierda */}
        <rect
          x={FX} y={FY + FH * 0.25}
          width={FW * 0.16} height={FH * 0.5}
          fill="none" stroke={LINE} strokeWidth="1.5"
        />

        {/* Área grande derecha */}
        <rect
          x={FX + FW * 0.84} y={FY + FH * 0.25}
          width={FW * 0.16} height={FH * 0.5}
          fill="none" stroke={LINE} strokeWidth="1.5"
        />

        {/* Área chica izquierda */}
        <rect
          x={FX} y={FY + FH * 0.375}
          width={FW * 0.075} height={FH * 0.25}
          fill="none" stroke={LINE} strokeWidth="1.5"
        />

        {/* Área chica derecha */}
        <rect
          x={FX + FW * 0.925} y={FY + FH * 0.375}
          width={FW * 0.075} height={FH * 0.25}
          fill="none" stroke={LINE} strokeWidth="1.5"
        />

        {/* Punto de penal izquierdo */}
        <circle cx={FX + FW * 0.115} cy={CY} r="2" fill={LINE} />

        {/* Punto de penal derecho */}
        <circle cx={FX + FW * 0.885} cy={CY} r="2" fill={LINE} />

        {/* Arco izquierdo */}
        <rect
          x={FX - 9} y={CY - 22}
          width="9" height="44"
          fill="rgba(0,0,0,0.18)" stroke={LINE} strokeWidth="1.5"
        />

        {/* Arco derecho */}
        <rect
          x={FX + FW} y={CY - 22}
          width="9" height="44"
          fill="rgba(0,0,0,0.18)" stroke={LINE} strokeWidth="1.5"
        />

        {/* Jugadores */}
        {renderTeam(equipo1, 'A', participaciones, combIdx, mostrarVotos)}
        {renderTeam(equipo2, 'B', participaciones, combIdx, mostrarVotos)}
      </svg>
    </div>
  )
}
