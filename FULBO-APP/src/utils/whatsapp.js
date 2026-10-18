// Mensajes para compartir por WhatsApp con links wa.me (no requiere API)

// Fija: en desarrollo window.location sería localhost
export const URL_APP = 'https://futbol-amateur-app.web.app'

function fechaLegible(fecha) {
  if (!fecha) return ''
  // "miércoles 21 de octubre" (sin la coma que agrega el formato es-AR)
  return fecha
    .toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })
    .replace(',', '')
}

// En mobile abre la app de WhatsApp; en desktop, WhatsApp Web
export function linkWhatsApp(mensaje) {
  return `https://wa.me/?text=${encodeURIComponent(mensaje)}`
}

export function mensajeInvitacion(codigo) {
  return (
    '¡Unite a Fulbo App, la app para organizar nuestros partidos! 🎮⚽\n' +
    `Accedé directo desde acá: ${URL_APP}\n` +
    `Usá el código *${codigo}* para unirte a nuestro grupo.`
  )
}

// Aviso del admin según el estado del partido (null si el estado no tiene mensaje)
export function mensajePartido(partido) {
  const fecha = fechaLegible(partido.fecha)
  const lugar = partido.lugar ?? ''
  switch (partido.estado) {
    case 'abierto':
      return (
        `⚽ ¡Nueva convocatoria abierta! Confirmá si vas al partido del ${fecha} en ${lugar}.\n` +
        `Accedé directo desde acá: ${URL_APP}`
      )
    case 'votando':
      return (
        `🗳️ ¡Ya podés votar la propuesta de equipos para el partido del ${fecha}!\n` +
        `Accedé directo desde acá: ${URL_APP}`
      )
    case 'confirmado':
      return (
        `✅ ¡Equipos confirmados para el partido del ${fecha} en ${lugar}!\n` +
        `Entrá a ver cómo quedaron: ${URL_APP}`
      )
    // Todavía no existe este estado: queda listo para cuando se cierre el partido
    case 'jugado':
      return (
        `🏆 ¡Votá al MVP del partido del ${fecha}!\n` +
        `Accedé directo desde acá: ${URL_APP}`
      )
    default:
      return null
  }
}
