import { useEffect } from 'react'

/* Repli JavaScript des animations au défilement de la home.
 *
 * `animation-timeline: view()` fait tout ce travail sans JavaScript et hors du
 * thread principal — c'est la bonne implémentation, on la garde partout où elle
 * existe (Chrome, Safari). Firefox 154 ne l'a pas : la propriété est présente
 * mais reste derrière `layout.css.scroll-driven-animations.enabled`, désactivée
 * par défaut. Ce module rejoue le même effet à la main pour ce moteur-là.
 *
 * Les quatre constantes ci-dessous DOIVENT rester alignées sur le bloc
 * `@supports (animation-timeline: view())` de Home.module.css : c'est un seul
 * effet écrit deux fois pour deux moteurs, toute retouche va par paire. */
const NATIF =
  typeof CSS !== 'undefined' && !!CSS.supports?.('animation-timeline', 'view()')

const DEBUT = 0.12   // animation-range: entry 12% …
const FIN = 0.34     // … cover 34%
const MONTEE = 22    // @keyframes modReveal — translate: 0 22px
const DERIVE = 8     // @keyframes modDrift  — translate: 0 ±8%

const borne = n => (n < 0 ? 0 : n > 1 ? 1 : n)

/**
 * @param rootRef conteneur dont les enfants directs sont les blocs à animer
 * @param actif   les blocs sont-ils montés (la home les masque pendant une recherche)
 */
export default function useScrollDrive(rootRef, actif) {
  useEffect(() => {
    if (NATIF || !actif) return
    const root = rootRef.current
    if (!root) return

    const blocs = [...root.children].map(el => ({ el, img: el.querySelector('img') }))
    const sobre = window.matchMedia('(prefers-reduced-motion: reduce)')
    let raf = 0

    // Rendre la main au CSS : sans style en ligne, les blocs sont pleinement
    // visibles. C'est aussi l'état de repos si le repli ne tourne jamais.
    const effacer = () => {
      for (const { el, img } of blocs) {
        el.style.opacity = ''
        el.style.translate = ''
        if (img) img.style.translate = ''
      }
    }

    const peindre = () => {
      raf = 0
      const v = window.innerHeight
      for (const { el, img } of blocs) {
        const r = el.getBoundingClientRect()
        if (!r.height) continue
        /* Position sur la « view progress timeline » : 0 quand le haut du bloc
           touche le bas de l'écran, v + hauteur quand son bas quitte le haut.
           `entry` se mesure sur la hauteur du bloc, `cover` sur la course
           entière — d'où les deux dénominateurs différents. */
        const t = v - r.top
        const debut = DEBUT * r.height
        const fin = FIN * (v + r.height)
        const p = borne((t - debut) / Math.max(fin - debut, 1))
        el.style.opacity = p
        el.style.translate = `0 ${(1 - p) * MONTEE}px`
        if (img) {
          const d = borne(t / (v + r.height))
          img.style.translate = `0 ${(d * 2 - 1) * DERIVE}%`
        }
      }
    }

    const auDefilement = () => {
      if (!raf) raf = window.requestAnimationFrame(peindre)
    }

    const brancher = () => {
      if (sobre.matches) return effacer()
      peindre()
      window.addEventListener('scroll', auDefilement, { passive: true })
      window.addEventListener('resize', auDefilement)
    }
    const debrancher = () => {
      window.removeEventListener('scroll', auDefilement)
      window.removeEventListener('resize', auDefilement)
      if (raf) {
        window.cancelAnimationFrame(raf)
        raf = 0
      }
    }
    const changementDePref = () => {
      debrancher()
      brancher()
    }

    brancher()
    sobre.addEventListener('change', changementDePref)
    return () => {
      debrancher()
      sobre.removeEventListener('change', changementDePref)
      effacer()
    }
  }, [rootRef, actif])
}
