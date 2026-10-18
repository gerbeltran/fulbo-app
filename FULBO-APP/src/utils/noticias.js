// Noticias del club de cada jugador, desde GNews API (devuelve JSON, sin proxy).
// Plan gratuito: 100 consultas por día para toda la app, así que guardamos
// las noticias por club y no volvemos a consultar si son recientes.

export const MAXIMO_NOTICIAS = 10
const TIEMPO_MAXIMO_MS = 8000
const VIGENCIA_CACHE_MS = 30 * 60 * 1000 // 30 minutos
const CLAVE_CACHE = 'fulbo_noticias_'
const API_KEY = import.meta.env.VITE_GNEWS_API_KEY

// Sin filtro de país: con country=ar GNews devuelve muy pocas notas y viejas
function urlGNews(club) {
  return (
    `https://gnews.io/api/v4/search?q=${encodeURIComponent(club)}` +
    `&lang=es&max=${MAXIMO_NOTICIAS}&apikey=${API_KEY}`
  )
}

async function pedirConLimite(url) {
  const control = new AbortController()
  const temporizador = setTimeout(() => control.abort(), TIEMPO_MAXIMO_MS)
  try {
    return await fetch(url, { signal: control.signal })
  } finally {
    clearTimeout(temporizador)
  }
}

function convertirArticulo(articulo) {
  const fecha = new Date(articulo.publishedAt)
  return {
    titulo: articulo.title?.trim() ?? '',
    link: articulo.url,
    fuente: articulo.source?.name ?? '',
    fecha: isNaN(fecha) ? null : fecha,
    imagen: articulo.image || null,
  }
}

function guardarEnCache(club, noticias) {
  try {
    localStorage.setItem(
      CLAVE_CACHE + club.toLowerCase(),
      JSON.stringify({ guardadas_en: Date.now(), noticias })
    )
  } catch {
    // Sin localStorage: simplemente no hay respaldo
  }
}

// Últimas noticias guardadas de este club (o null)
export function leerCache(club) {
  try {
    const guardado = JSON.parse(localStorage.getItem(CLAVE_CACHE + club.toLowerCase()))
    if (!guardado?.noticias) return null
    const guardadasEn = new Date(guardado.guardadas_en)
    return {
      guardadasEn,
      vigente: Date.now() - guardadasEn.getTime() < VIGENCIA_CACHE_MS,
      noticias: guardado.noticias.map((n) => ({ ...n, fecha: n.fecha ? new Date(n.fecha) : null })),
    }
  } catch {
    return null
  }
}

export async function obtenerNoticias(club) {
  if (!API_KEY) throw new Error('Falta VITE_GNEWS_API_KEY en el archivo .env')

  const respuesta = await pedirConLimite(urlGNews(club))
  if (!respuesta.ok) {
    // 403: se agotaron las consultas del día · 429: demasiadas seguidas
    const detalle = await respuesta.json().catch(() => null)
    throw new Error(`GNews ${respuesta.status}: ${detalle?.errors?.join(' ') ?? ''}`)
  }

  const { articles = [] } = await respuesta.json()
  const noticias = articles
    .map(convertirArticulo)
    .filter((noticia) => noticia.titulo && noticia.link)
    .sort((a, b) => (b.fecha ?? 0) - (a.fecha ?? 0))
    .slice(0, MAXIMO_NOTICIAS)
  guardarEnCache(club, noticias)
  return noticias
}

// "hace 3 h", "hace 2 d" o la fecha
export function tiempoRelativo(fecha) {
  if (!fecha) return ''
  const minutos = Math.floor((Date.now() - fecha.getTime()) / 60000)
  if (minutos < 1) return 'recién'
  if (minutos < 60) return `hace ${minutos} min`
  const horas = Math.floor(minutos / 60)
  if (horas < 24) return `hace ${horas} h`
  const dias = Math.floor(horas / 24)
  if (dias < 7) return `hace ${dias} d`
  return fecha.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })
}
