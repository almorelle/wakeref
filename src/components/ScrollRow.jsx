import { useRef, useState, useEffect, useCallback } from 'react'

// Conteneur à défilement horizontal qui signale, via les data-attributes
// `data-fade-left` / `data-fade-right`, de quel côté du contenu reste masqué.
// Le CSS applique alors un fondu de bord — l'affordance « ça scrolle » sur
// mobile (où la scrollbar est cachée). Le fondu disparaît dès qu'un bord est
// atteint, pour ne jamais rogner le dernier chip quand tout tient à l'écran.
export default function ScrollRow({ className, children, ...rest }) {
  const ref = useRef(null)
  const [fade, setFade] = useState({ left: false, right: false })

  const update = useCallback(() => {
    const el = ref.current
    if (!el) return
    const left = el.scrollLeft > 1
    const right = el.scrollLeft < el.scrollWidth - el.clientWidth - 1
    // garde anti-boucle : on ne re-rend que si l'état change réellement
    setFade(prev => (prev.left === left && prev.right === right) ? prev : { left, right })
  }, [])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    update()
    el.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    // détecte les changements de contenu (ex. bascule de langue)
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => {
      el.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
      ro.disconnect()
    }
  }, [update])

  // re-mesure à chaque rendu : capte les changements de contenu (le
  // ResizeObserver ci-dessus ne voit que la taille du conteneur). La garde
  // anti-boucle dans `update` empêche tout rendu superflu.
  useEffect(update)

  return (
    <div
      ref={ref}
      className={className}
      data-fade-left={fade.left || undefined}
      data-fade-right={fade.right || undefined}
      {...rest}
    >
      {children}
    </div>
  )
}
