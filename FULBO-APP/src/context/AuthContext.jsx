import { createContext, useContext, useEffect, useState } from 'react'
import {
  onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut,
} from 'firebase/auth'
import { auth } from '../firebase/config'

const AuthContext = createContext(null)

// Usamos solo popup: signInWithRedirect falla en mobile y en PWA instaladas
// por el storage particionado ("missing initial state")
const MENSAJE_POPUP_BLOQUEADO =
  'Tu navegador bloqueó la ventana de login. Por favor, permitir popups para este sitio.'

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
      if (err.code === 'auth/popup-blocked') {
        const error = new Error(MENSAJE_POPUP_BLOQUEADO)
        error.code = err.code
        error.mensajeUsuario = MENSAJE_POPUP_BLOQUEADO
        throw error
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
