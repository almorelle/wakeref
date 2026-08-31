import { useState } from 'react'
import { ThemeContext } from './theme-context'

const STORAGE_KEY = 'wakeref_theme'

function detectTheme() {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'light' || stored === 'dark') return stored
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme)
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', theme === 'light' ? '#dcd2de' : '#1a1420')
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    const t = detectTheme()
    applyTheme(t)
    return t
  })

  const setTheme = (t) => {
    setThemeState(t)
    localStorage.setItem(STORAGE_KEY, t)
    applyTheme(t)
  }

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark')

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
