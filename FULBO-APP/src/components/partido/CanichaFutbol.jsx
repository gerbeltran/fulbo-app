import { useState } from 'react'

// Cancha vertical en perspectiva (estilo videojuego): Equipo 2 al fondo,
// Equipo 1 adelante. Las posiciones se calculan en coordenadas de cancha
// (u = ancho 0..1, v = largo 0..1 de arriba hacia abajo) y se proyectan.
const W = 380, H = 440
const ARRIBA = 18, ABAJO = 404        // bordes superior e inferior del campo en pantalla
const ANCHO_ARRIBA = 252, ANCHO_ABAJO = 360
const CX = W / 2
const ESPESOR = 14                     // borde inferior que da efecto de "bloque"
const FUGA = 0.35                      // cuánto se comprime el fondo de la cancha
const LARGO_RELATIVO = 1.45            // largo de la cancha respecto del ancho

const LINE = 'rgba(255,255,255,0.55)'
const COLOR_EQUIPO = { A: '#3B82F6', B: '#EF4444' }
const FUENTE = 'system-ui,-apple-system,sans-serif'

// Ordenamiento defensivo→ofensivo para armar las líneas
const POS_ORDER = { ARQ: 0, DEF: 1, MED: 2, DEL: 3 }

// Profundidad (v) de cada línea para el equipo de adelante (A); el de atrás es espejo
// (calculadas para que avatar + etiqueta de una línea no pisen a la siguiente)
const V_ARQUERO = 0.95
const V_LINEAS = {
  1: [0.7],
  2: [0.76, 0.58],
  3: [0.8, 0.68, 0.56],
}

// ─── Proyección ───────────────────────────────────────────────────────────────

function profundidad(v) {
  return (v * (1 + FUGA)) / (1 + FUGA * v)
}
function anchoEn(v) {
  return ANCHO_ARRIBA + (ANCHO_ABAJO - ANCHO_ARRIBA) * profundidad(v)
}
function proyectar(u, v) {
  return {
    x: CX + (u - 0.5) * anchoEn(v),
    y: ARRIBA + (ABAJO - ARRIBA) * profundidad(v),
  }
}
// Tamaño relativo de lo que está a esa profundidad (1 = adelante de todo)
function escalaEn(v) {
  return anchoEn(v) / ANCHO_ABAJO
}
function puntos(lista) {
  return lista.map(([u, v]) => {
    const p = proyectar(u, v)
    return `${p.x.toFixed(1)},${p.y.toFixed(1)}`
  }).join(' ')
}
function rectangulo(u1, v1, u2, v2) {
  return puntos([[u1, v1], [u2, v1], [u2, v2], [u1, v2]])
}
// Círculo en la cancha (radio en unidades de ancho) → polígono proyectado
function circulo(uc, vc, radio, desde = 0, hasta = 2 * Math.PI) {
  const pasos = 48
  return puntos(Array.from({ length: pasos + 1 }, (_, i) => {
    const a = desde + ((hasta - desde) * i) / pasos
    return [uc + radio * Math.cos(a), vc + (radio * Math.sin(a)) / LARGO_RELATIVO]
  }))
}

// ─── Formación ────────────────────────────────────────────────────────────────

// Arquero (o el más defensivo) + el resto repartido en 2 líneas, o 3 si son muchos.
// Funciona con cualquier cantidad: 5 vs 5, 6 vs 5, etc.
function getFormacion(jugadores) {
  const ordenados = [...jugadores].sort(
    (a, b) =>
      (POS_ORDER[a.posicion_preferida] ?? 1) -
      (POS_ORDER[b.posicion_preferida] ?? 1)
  )
  const [arquero, ...resto] = ordenados
  if (!arquero) return []

  const cantidadLineas = resto.length === 0 ? 0 : resto.length <= 6 ? (resto.length === 1 ? 1 : 2) : 3
  const lineas = []
  let inicio = 0
  for (let i = 0; i < cantidadLineas; i++) {
    // Las líneas de atrás llevan el sobrante: 4 → 2-2, 5 → 3-2
    const tamaño = Math.ceil((resto.length - inicio) / (cantidadLineas - i))
    lineas.push(resto.slice(inicio, inicio + tamaño))
    inicio += tamaño
  }
  return [
    { v: V_ARQUERO, jugadores: [arquero] },
    ...lineas.map((grupo, i) => ({ v: V_LINEAS[cantidadLineas][i], jugadores: grupo })),
  ]
}

function nombreCorto(nombre) {
  const primero = nombre.trim().split(' ')[0]
  return primero.length > 10 ? primero.slice(0, 10) + '...' : primero
}

// ─── Jugador: avatar circular + etiqueta con el nombre ───────────────────────

// Silueta genérica (busto) para quien no tiene foto
function AvatarGenerico({ r }) {
  return (
    <g>
      <circle r={r} fill="#E5E7EB" />
      <circle cy={-r * 0.22} r={r * 0.36} fill="#9CA3AF" />
      <path
        d={`M${-r * 0.72},${r * 0.86} Q${-r * 0.7},${r * 0.2} 0,${r * 0.2} Q${r * 0.7},${r * 0.2} ${r * 0.72},${r * 0.86} Z`}
        fill="#9CA3AF"
      />
    </g>
  )
}

function NodoJugador({ jugador, color, x, y, escala, voto, mostrarVoto }) {
  const [fotoRota, setFotoRota] = useState(false)
  const r = 21
  const idRecorte = `avatar-${jugador.id}`
  const nombre = nombreCorto(jugador.nombre)
  const anchoEtiqueta = nombre.length * 7.2 + 14
  const conFoto = jugador.foto_url && !fotoRota

  return (
    <g transform={`translate(${x.toFixed(1)},${y.toFixed(1)}) scale(${escala.toFixed(3)})`}>
      <title>{jugador.nombre}</title>
      {/* Sombra en el césped */}
      <ellipse cy={r + 3} rx={r * 0.9} ry="3.5" fill="rgba(0,0,0,0.35)" />

      {/* Foto o silueta genérica, recortada en círculo */}
      <defs>
        <clipPath id={idRecorte}>
          <circle r={r} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${idRecorte})`}>
        {conFoto ? (
          <>
            <circle r={r} fill="#E5E7EB" />
            <image
              href={jugador.foto_url}
              x={-r}
              y={-r}
              width={r * 2}
              height={r * 2}
              preserveAspectRatio="xMidYMid slice"
              onError={() => setFotoRota(true)}
            />
          </>
        ) : (
          <AvatarGenerico r={r} />
        )}
      </g>

      {/* Aro del color del equipo, con brillo */}
      <circle r={r} fill="none" stroke={color} strokeWidth="3" style={{ filter: `drop-shadow(0 0 4px ${color})` }} />

      {/* Indicador de voto: ✓ votó / ○ falta */}
      {mostrarVoto && (
        <g transform={`translate(${r * 0.75},${-r * 0.75})`}>
          <circle r="5.5" fill={voto ? '#22C55E' : '#1F2937'} stroke="white" strokeWidth="1.2" strokeOpacity={voto ? 1 : 0.6} />
          {voto && (
            <path d="M-2.5,0 L-0.7,2 L2.7,-2" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          )}
        </g>
      )}

      {/* Nombre en etiqueta oscura debajo del avatar */}
      <rect
        x={-anchoEtiqueta / 2}
        y={r + 4}
        width={anchoEtiqueta}
        height="17"
        rx="5"
        fill="rgba(13,17,23,0.88)"
        stroke="rgba(255,255,255,0.14)"
      />
      <text
        y={r + 16.5}
        textAnchor="middle"
        fill="white"
        fontSize="12"
        fontWeight="700"
        fontFamily={FUENTE}
      >
        {nombre}
      </text>
    </g>
  )
}

// Equipo 'A' juega adelante (mitad de abajo) y 'B' al fondo (mitad de arriba)
function renderEquipo(jugadores, equipo, participaciones, combIdx, mostrarVoto) {
  const formacion = getFormacion(jugadores)
  const masPorLinea = Math.max(0, ...formacion.map((l) => l.jugadores.length))
  // Con muchos jugadores por línea, los avatares se achican para no pisarse
  const ajuste = masPorLinea >= 4 || formacion.length > 3 ? 0.82 : 1

  return formacion.flatMap(({ v: vA, jugadores: linea }) => {
    const v = equipo === 'A' ? vA : 1 - vA
    return linea.map((j, i) => {
      const u = 0.13 + (0.74 * (i + 0.5)) / linea.length
      const { x, y } = proyectar(u, v)
      const partic = participaciones?.find((p) => p.jugador_id === j.id)
      return (
        <NodoJugador
          key={j.id}
          jugador={j}
          color={COLOR_EQUIPO[equipo]}
          x={x}
          y={y}
          escala={escalaEn(v) * ajuste}
          voto={partic?.votos_equipos?.[combIdx] !== undefined}
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
  const esquinaAbajoIzq = proyectar(0, 1)
  const esquinaAbajoDer = proyectar(1, 1)

  return (
    <div className="w-full max-w-md mx-auto">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        style={{ display: 'block', filter: 'drop-shadow(0 12px 24px rgba(0,0,0,0.5))' }}
        aria-label="Cancha de fútbol con equipos"
      >
        <defs>
          <linearGradient id="cesped" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1B7A3A" />
            <stop offset="100%" stopColor="#25A04D" />
          </linearGradient>
          <radialGradient id="brilloCentral" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(160,255,190,0.35)" />
            <stop offset="100%" stopColor="rgba(160,255,190,0)" />
          </radialGradient>
        </defs>

        {/* Espesor del "bloque" de césped */}
        <polygon
          points={[
            `${esquinaAbajoIzq.x},${esquinaAbajoIzq.y}`,
            `${esquinaAbajoDer.x},${esquinaAbajoDer.y}`,
            `${esquinaAbajoDer.x - 4},${esquinaAbajoDer.y + ESPESOR}`,
            `${esquinaAbajoIzq.x + 4},${esquinaAbajoIzq.y + ESPESOR}`,
          ].join(' ')}
          fill="#0E4A22"
        />

        {/* Campo con franjas en perspectiva */}
        <polygon points={rectangulo(0, 0, 1, 1)} fill="url(#cesped)" />
        {Array.from({ length: 10 }, (_, i) => (
          <polygon
            key={i}
            points={rectangulo(0, i / 10, 1, (i + 1) / 10)}
            fill={i % 2 ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.03)'}
          />
        ))}
        {/* Brillo sutil en el centro */}
        <ellipse cx={CX} cy={proyectar(0.5, 0.5).y} rx={anchoEn(0.5) * 0.5} ry="90" fill="url(#brilloCentral)" />

        {/* Líneas */}
        <g fill="none" stroke={LINE} strokeWidth="1.6" strokeLinejoin="round">
          <polygon points={rectangulo(0.02, 0.015, 0.98, 0.985)} />
          <polyline points={puntos([[0.02, 0.5], [0.98, 0.5]])} />
          <polyline points={circulo(0.5, 0.5, 0.15)} />
          {/* Áreas grandes y chicas */}
          <polygon points={rectangulo(0.2, 0.015, 0.8, 0.17)} />
          <polygon points={rectangulo(0.2, 0.83, 0.8, 0.985)} />
          <polygon points={rectangulo(0.36, 0.015, 0.64, 0.065)} />
          <polygon points={rectangulo(0.36, 0.935, 0.64, 0.985)} />
          {/* Semicírculos del área */}
          <polyline points={circulo(0.5, 0.17, 0.1, 0, Math.PI)} />
          <polyline points={circulo(0.5, 0.83, 0.1, Math.PI, 2 * Math.PI)} />
        </g>
        <circle cx={CX} cy={proyectar(0.5, 0.5).y} r="2.5" fill={LINE} />

        {/* Arcos */}
        <polygon points={rectangulo(0.42, -0.02, 0.58, 0.015)} fill="rgba(255,255,255,0.15)" stroke={LINE} strokeWidth="1.4" />
        <polygon points={rectangulo(0.42, 0.985, 0.58, 1.02)} fill="rgba(255,255,255,0.15)" stroke={LINE} strokeWidth="1.4" />

        {/* Jugadores: primero los del fondo para que los de adelante queden encima */}
        {renderEquipo(equipo2, 'B', participaciones, combIdx, mostrarVotos)}
        {renderEquipo(equipo1, 'A', participaciones, combIdx, mostrarVotos)}
      </svg>
    </div>
  )
}
