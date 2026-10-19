// Fotos de perfil: se recortan cuadradas y se comprimen a JPEG chico para
// guardarlas directo en Firestore (sin Firebase Storage, que requiere plan pago).

const LADO = 200          // px del avatar final
const CALIDAD = 0.82
export const TIPOS_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp']
const MAXIMO_ORIGINAL = 15 * 1024 * 1024   // fotos de cámara de hasta 15 MB
export const MAXIMO_GUARDADO = 100 * 1024   // la foto comprimida (también lo validan las reglas)

async function cargarImagen(archivo) {
  // createImageBitmap respeta la orientación EXIF de las fotos de celular
  if (window.createImageBitmap) {
    try {
      return await createImageBitmap(archivo, { imageOrientation: 'from-image' })
    } catch {
      // Algunos navegadores no aceptan la opción: probamos con <img>
    }
  }
  const url = URL.createObjectURL(archivo)
  try {
    const imagen = new Image()
    imagen.src = url
    await imagen.decode()
    return imagen
  } finally {
    URL.revokeObjectURL(url)
  }
}

// Devuelve la foto como data URL JPEG cuadrada de 200x200 (recorte centrado)
export async function comprimirFoto(archivo) {
  if (!TIPOS_PERMITIDOS.includes(archivo.type)) {
    throw new Error('Elegí una imagen JPG, PNG o WebP.')
  }
  if (archivo.size > MAXIMO_ORIGINAL) {
    throw new Error('La imagen es demasiado grande (máximo 15 MB).')
  }

  const imagen = await cargarImagen(archivo)
  const ancho = imagen.width
  const alto = imagen.height
  const lado = Math.min(ancho, alto)

  const canvas = document.createElement('canvas')
  canvas.width = LADO
  canvas.height = LADO
  const contexto = canvas.getContext('2d')
  contexto.imageSmoothingQuality = 'high'
  contexto.drawImage(imagen, (ancho - lado) / 2, (alto - lado) / 2, lado, lado, 0, 0, LADO, LADO)
  imagen.close?.()

  const dataUrl = canvas.toDataURL('image/jpeg', CALIDAD)
  if (dataUrl.length > MAXIMO_GUARDADO) {
    throw new Error('No se pudo comprimir la imagen lo suficiente. Probá con otra.')
  }
  return dataUrl
}
