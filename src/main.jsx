import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { LanguageProvider } from './contexts/LanguageContext'
import { ThemeProvider } from './contexts/ThemeContext'
import App from './App.jsx'
import './index.css'
import { inject } from '@vercel/analytics'
import { registerSW } from 'virtual:pwa-register'

inject()

// Enregistre le service worker. En mode autoUpdate, la page se recharge
// automatiquement dès que la nouvelle version prend le contrôle → plus de
// "cache persistant" nécessitant un double reload après un déploiement.
registerSW({
  immediate: true,
  onRegisteredSW(_swUrl, registration) {
    // Onglets restés ouverts : on vérifie une nouvelle version toutes les heures.
    if (registration) {
      setInterval(() => { registration.update() }, 60 * 60 * 1000)
    }
  },
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <LanguageProvider>
          <App />
        </LanguageProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
)
