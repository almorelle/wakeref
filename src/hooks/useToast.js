import { useState, useCallback, useRef } from 'react'

export function useToast() {
  const [toasts, setToasts] = useState([])
  const timers = useRef({})

  const dismiss = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
    if (timers.current[id]) { clearTimeout(timers.current[id]); delete timers.current[id] }
  }, [])

  // toast(message, type, { actionLabel, onAction, duration })
  const toast = useCallback((message, type = 'info', options = {}) => {
    const id = Date.now() + Math.random()
    const { actionLabel, onAction, duration = 3500 } = options
    const action = actionLabel
      ? { label: actionLabel, onClick: () => { onAction?.(); dismiss(id) } }
      : null
    setToasts(prev => [...prev, { id, message, type, action }])
    timers.current[id] = setTimeout(() => dismiss(id), duration)
    return id
  }, [dismiss])

  return { toasts, toast, dismiss }
}
