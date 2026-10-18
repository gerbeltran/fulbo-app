// Cancha vertical (pensada para mobile): Equipo 2 arriba, Equipo 1 abajo
const W = 320, H = 520
const FX = 12, FY = 14, FW = 296, FH = 492
const CX = FX + FW / 2   // 160
const CY = FY + FH / 2   // 260

const LINE = 'rgba(255,255,255,0.85)'
const STRIPES = ['#15803d', '#166534']
const COLORES_EQUIPO = {
  A: { camiseta: '#3B82F6', pantalon: '#1E3A5F' },
  B: { camiseta: '#EF4444', pantalon: '#7F1D1D' },
}
const COLOR_PIEL = '#F5CBA7'
const COLOR_PELO = '#3B2A20'
const COLOR_BOTINES = '#1a1a1a'
const CONTORNO = 'rgba(0,0,0,0.55)'
const FUENTE = 'system-ui,-apple-system,sans-serif'

// Ordenamiento defensivo→ofensivo para armar las líneas
const POS_ORDER = { ARQ: 0, DEF: 1, MED: 2, DEL: 3 }

// Distancia de cada línea a la mitad de cancha (en unidades del viewBox).
// Cada jugador (figura + nombre) ocupa ~78 unidades de alto.
const DISTANCIA_ARQUERO = 204
const DISTANCIAS_LINEAS = {
  1: [104],
  2: [124, 46],
  3: [150, 98, 46],
}
// Con 3 líneas (equipos de 8 o más) no entra a tamaño completo
const ESCALA_POR_LINEAS = { 0: 1, 1: 1, 2: 1, 3: 0.68 }

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
    { distancia: DISTANCIA_ARQUERO, jugadores: [arquero] },
    ...lineas.map((grupo, i) => ({
      distancia: DISTANCIAS_LINEAS[cantidadLineas][i],
      jugadores: grupo,
    })),
  ]
}

function nombreCorto(nombre, maxCaracteres) {
  const primero = nombre.trim().split(' ')[0]
  return primero.length > maxCaracteres ? primero.slice(0, maxCaracteres) + '...' : primero
}

// Silueta de jugador de frente, estilo infografía de videojuego de fútbol.
// Centrada en x = 0; va de y = -37 (pelo) a y = 22 (botines).
function SiluetaJugador({ colores }) {
  const { camiseta, pantalon } = colores
  return (
    <g strokeLinejoin="round">
      {/* Sombra en el césped */}
      <ellipse cy="22" rx="13" ry="2.8" fill="rgba(0,0,0,0.28)" />

      {/* Piernas (levemente abiertas) */}
      <path d="M-8.5,5 L-3.5,5 L-4.2,12 L-8.6,12 Z" fill={COLOR_PIEL} stroke={CONTORNO} strokeWidth="0.6" />
      <path d="M8.5,5 L3.5,5 L4.2,12 L8.6,12 Z" fill={COLOR_PIEL} stroke={CONTORNO} strokeWidth="0.6" />

      {/* Medias del color de la camiseta */}
      <path d="M-8.6,11.5 L-4.2,11.5 L-4.6,19 L-9,19 Z" fill={camiseta} stroke={CONTORNO} strokeWidth="0.6" />
      <path d="M8.6,11.5 L4.2,11.5 L4.6,19 L9,19 Z" fill={camiseta} stroke={CONTORNO} strokeWidth="0.6" />
      <path d="M-8.7,13 L-4.3,13 M8.7,13 L4.3,13" stroke="rgba(255,255,255,0.7)" strokeWidth="0.9" />

      {/* Botines */}
      <path d="M-9.4,18.6 L-4.3,18.6 L-4.1,21.4 Q-4.1,22.4 -5.2,22.4 L-11.6,22.4 Q-12.6,22.4 -12.2,21.3 Q-11.3,19.6 -9.4,18.6 Z" fill={COLOR_BOTINES} />
      <path d="M9.4,18.6 L4.3,18.6 L4.1,21.4 Q4.1,22.4 5.2,22.4 L11.6,22.4 Q12.6,22.4 12.2,21.3 Q11.3,19.6 9.4,18.6 Z" fill={COLOR_BOTINES} />

      {/* Short con abertura central */}
      <path d="M-10,-1.5 L10,-1.5 L11,6.2 L1.6,6.2 L0,3.4 L-1.6,6.2 L-11,6.2 Z" fill={pantalon} stroke={CONTORNO} strokeWidth="0.7" />

      {/* Brazos levemente separados del cuerpo, con manos */}
      <path d="M-15.2,-13 L-11.4,-12.2 L-12.4,-3.4 L-15.9,-3.9 Z" fill={COLOR_PIEL} stroke={CONTORNO} strokeWidth="0.6" />
      <path d="M15.2,-13 L11.4,-12.2 L12.4,-3.4 L15.9,-3.9 Z" fill={COLOR_PIEL} stroke={CONTORNO} strokeWidth="0.6" />
      <circle cx="-14.3" cy="-2.6" r="2" fill={COLOR_PIEL} stroke={CONTORNO} strokeWidth="0.6" />
      <circle cx="14.3" cy="-2.6" r="2" fill={COLOR_PIEL} stroke={CONTORNO} strokeWidth="0.6" />

      {/* Cuello */}
      <path d="M-2.6,-26 L2.6,-26 L3,-21 L-3,-21 Z" fill={COLOR_PIEL} />

      {/* Camiseta: hombros, mangas cortas y talle */}
      <path
        d="M-4.2,-23.2 Q0,-21.6 4.2,-23.2 L11,-21.2 Q13.2,-20.4 13.8,-18 L15.6,-12.6 L11.2,-11.6 L10.2,-15 L9.6,-1 L-9.6,-1 L-10.2,-15 L-11.2,-11.6 L-15.6,-12.6 L-13.8,-18 Q-13.2,-20.4 -11,-21.2 Z"
        fill={camiseta}
        stroke={CONTORNO}
        strokeWidth="0.8"
      />
      {/* Volumen: sombra lateral y puños */}
      <path d="M4,-22 L11,-20.6 Q12.6,-20 13.2,-17.8 L14.6,-13.4 L11.4,-12.6 L10.2,-15 L9.6,-1 L4.5,-1 Q7,-12 4,-22 Z" fill="rgba(0,0,0,0.16)" />
      <path d="M-15.6,-12.6 L-11.2,-11.6 M15.6,-12.6 L11.2,-11.6" stroke="rgba(255,255,255,0.75)" strokeWidth="1.1" />
      {/* Cuello en V */}
      <path d="M-4.2,-23.2 L0,-18.4 L4.2,-23.2" fill="none" stroke="white" strokeWidth="1.3" />

      {/* Cabeza ovalada con orejas y pelo */}
      <ellipse cx="-5.1" cy="-29.6" rx="1.1" ry="1.7" fill={COLOR_PIEL} stroke={CONTORNO} strokeWidth="0.5" />
      <ellipse cx="5.1" cy="-29.6" rx="1.1" ry="1.7" fill={COLOR_PIEL} stroke={CONTORNO} strokeWidth="0.5" />
      <path
        d="M0,-36 Q5.2,-36 5.2,-30.5 Q5.2,-26.4 2.6,-24.6 Q0,-23.4 -2.6,-24.6 Q-5.2,-26.4 -5.2,-30.5 Q-5.2,-36 0,-36 Z"
        fill={COLOR_PIEL}
        stroke={CONTORNO}
        strokeWidth="0.7"
      />
      <path
        d="M-5.4,-30.2 Q-5.8,-37.2 0,-37.2 Q5.8,-37.2 5.4,-30.2 Q4.6,-33.4 2.2,-33.6 Q0,-33 -2.4,-33.8 Q-4.6,-33.4 -5.4,-30.2 Z"
        fill={COLOR_PELO}
      />
    </g>
  )
}

function NodoJugador({ jugador, colores, x, y, escala, maxCaracteres, voto, mostrarVoto }) {
  return (
    <g transform={`translate(${x.toFixed(1)},${y.toFixed(1)}) scale(${escala})`}>
      <title>{jugador.nombre}</title>
      <SiluetaJugador colores={colores} />

      {/* Indicador de voto: ✓ votó / ○ falta */}
      {mostrarVoto && (
        <g transform="translate(13,-31)">
          <circle
            r="5.5"
            fill={voto ? '#22C55E' : 'rgba(0,0,0,0.45)'}
            stroke="white"
            strokeWidth="1"
            strokeOpacity={voto ? 1 : 0.6}
          />
          {voto && (
            <path d="M-2.5,0 L-0.7,2 L2.7,-2" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          )}
        </g>
      )}

      {/* Nombre debajo, blanco con borde oscuro para leerse sobre el verde */}
      <text
        y="37"
        textAnchor="middle"
        fill="white"
        stroke="rgba(0,0,0,0.75)"
        strokeWidth="3"
        strokeLinejoin="round"
        paintOrder="stroke"
        fontSize="12"
        fontWeight="700"
        fontFamily={FUENTE}
      >
        {nombreCorto(jugador.nombre, maxCaracteres)}
      </text>
    </g>
  )
}

// equipo 'A' ocupa la mitad de abajo y 'B' la de arriba
function renderEquipo(jugadores, equipo, participaciones, combIdx, mostrarVoto) {
  const sentido = equipo === 'A' ? 1 : -1
  const formacion = getFormacion(jugadores)
  const escala = ESCALA_POR_LINEAS[formacion.length - 1] ?? 1
  return formacion.flatMap(({ distancia, jugadores: linea }) => {
    const y = CY + sentido * distancia
    // Con más jugadores por línea, nombres más cortos para que no se pisen
    const maxCaracteres = linea.length >= 4 ? 7 : 10
    return linea.map((j, i) => {
      const x = FX + (FW * (i + 1)) / (linea.length + 1)
      const partic = participaciones?.find((p) => p.jugador_id === j.id)
      return (
        <NodoJugador
          key={j.id}
          jugador={j}
          colores={COLORES_EQUIPO[equipo]}
          x={x}
          y={y}
          escala={escala}
          maxCaracteres={maxCaracteres}
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
  const areaGrande = { w: FW * 0.56, h: FH * 0.13 }
  const areaChica = { w: FW * 0.28, h: FH * 0.05 }
  const arco = { w: 64, h: 8 }

  return (
    <div className="w-full max-w-sm mx-auto rounded-xl overflow-hidden shadow-md">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        style={{ display: 'block' }}
        aria-label="Cancha de fútbol con equipos"
      >
        {/* Franjas de césped */}
        {Array.from({ length: 10 }, (_, i) => (
          <rect
            key={i}
            x={FX}
            y={FY + (i * FH) / 10}
            width={FW}
            height={FH / 10}
            fill={STRIPES[i % 2]}
          />
        ))}

        {/* Borde del campo */}
        <rect x={FX} y={FY} width={FW} height={FH} fill="none" stroke={LINE} strokeWidth="1.5" />

        {/* Línea y círculo central */}
        <line x1={FX} y1={CY} x2={FX + FW} y2={CY} stroke={LINE} strokeWidth="1.5" />
        <circle cx={CX} cy={CY} r="34" fill="none" stroke={LINE} strokeWidth="1.5" />
        <circle cx={CX} cy={CY} r="3" fill={LINE} />

        {/* Áreas grandes */}
        <rect x={CX - areaGrande.w / 2} y={FY} width={areaGrande.w} height={areaGrande.h} fill="none" stroke={LINE} strokeWidth="1.5" />
        <rect x={CX - areaGrande.w / 2} y={FY + FH - areaGrande.h} width={areaGrande.w} height={areaGrande.h} fill="none" stroke={LINE} strokeWidth="1.5" />

        {/* Áreas chicas */}
        <rect x={CX - areaChica.w / 2} y={FY} width={areaChica.w} height={areaChica.h} fill="none" stroke={LINE} strokeWidth="1.5" />
        <rect x={CX - areaChica.w / 2} y={FY + FH - areaChica.h} width={areaChica.w} height={areaChica.h} fill="none" stroke={LINE} strokeWidth="1.5" />

        {/* Puntos de penal */}
        <circle cx={CX} cy={FY + FH * 0.095} r="2" fill={LINE} />
        <circle cx={CX} cy={FY + FH * 0.905} r="2" fill={LINE} />

        {/* Arcos */}
        <rect x={CX - arco.w / 2} y={FY - arco.h} width={arco.w} height={arco.h} fill="rgba(0,0,0,0.18)" stroke={LINE} strokeWidth="1.5" />
        <rect x={CX - arco.w / 2} y={FY + FH} width={arco.w} height={arco.h} fill="rgba(0,0,0,0.18)" stroke={LINE} strokeWidth="1.5" />

        {/* Jugadores */}
        {renderEquipo(equipo2, 'B', participaciones, combIdx, mostrarVotos)}
        {renderEquipo(equipo1, 'A', participaciones, combIdx, mostrarVotos)}
      </svg>
    </div>
  )
}
