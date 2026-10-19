import { doc, updateDoc } from 'firebase/firestore'
import { db } from './config'

// Guarda (o borra, con '') la foto de perfil de un jugador.
// Las reglas permiten hacerlo al propio jugador y al admin de su grupo.
export async function guardarFotoJugador(jugadorId, fotoDataUrl) {
  await updateDoc(doc(db, 'jugadores', jugadorId), { foto_url: fotoDataUrl })
}
