import { useState, useEffect, useRef } from 'react'

// Monte le contenu lourd (metadata vidéo / miniature) seulement quand l'élément
// approche du viewport — perf sur les galeries longues.
//
// Extrait de `FigureDetail.jsx` : les cartes vidéo en ont besoin des deux côtés
// du site, et un hook exporté depuis un fichier de page ne peut pas être importé
// sans traîner la page entière avec lui.
export function useInView(rootMargin = '300px') {
  const ref = useRef(null)
  // Pas d'IntersectionObserver (vieux navigateur) → on monte tout de suite, décidé
  // à l'initialisation plutôt que par un setState dans l'effet.
  const [inView, setInView] = useState(() => typeof IntersectionObserver === 'undefined')
  useEffect(() => {
    const el = ref.current
    if (!el || inView) return
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setInView(true); io.disconnect() }
    }, { rootMargin })
    io.observe(el)
    return () => io.disconnect()
  }, [inView, rootMargin])
  return [ref, inView]
}
