import React from 'react'
import ReactDOM from 'react-dom/client'
import { AuthProvider } from './context/AuthContext'
import { GrupoProvider } from './context/GrupoContext'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <GrupoProvider>
        <App />
      </GrupoProvider>
    </AuthProvider>
  </React.StrictMode>,
)
