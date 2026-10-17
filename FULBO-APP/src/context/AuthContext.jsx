import { createContext, useContext, useEffect, useState } from 'react'
import {
  onAuthStateChanged, signInWithPopup, signInWithRedirect,
  GoogleAuthProvider, signOut,
} from 'firebase/auth'
import { auth } from '../firebase/config'

const AuthContext = createContext(null)

// Errores de popup en los que conviene reintentar con redirect
// (ej: PWA instalada en iOS, navegadores que bloquean popups)
const ERRORES_USAR_REDIRECT = [
  'auth/popup-blocked',
  'auth/operation-not-supported-in-this-environment',
]

// Errores que no hace falta mostrar (el usuario cerró el popup)
const ERRORES_SILENCIOSOS = [
  'auth/popup-closed-by-user',
  'auth/cancelled-popup-request',
]

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    // Firebase restaura la sesión guardada y avisa acá
    const unsub = onAuthStateChanged(auth, (user) => {
      setUsuario(user)
      setCargando(false)
    })
    return unsub
  }, [])

  async function loginConGoogle() {
    const provider = new GoogleAuthProvider()
    provider.setCustomParameters({ prompt: 'select_account' })
    try {
      await signInWithPopup(auth, provider)
    } catch (err) {
      if (ERRORES_SILENCIOSOS.includes(err.code)) return
      if (ERRORES_USAR_REDIRECT.includes(err.code)) {
        await signInWithRedirect(auth, provider)
        return
      }
      throw err
    }
  }

  async function cerrarSesion() {
    await signOut(auth)
  }

  return (
    <AuthContext.Provider value={{ usuario, cargando, loginConGoogle, cerrarSesion }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
