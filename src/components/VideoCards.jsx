import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { externalUrl } from '../lib/url'
import Icon from './Icon'
import { videoSourceFromUrl } from '../lib/videoSource'
import styles from './VideoCards.module.css'

// Miniature d'une vidéo, selon sa plateforme.
//
// YouTube en sert une publiquement ; Instagram non, donc on lit celle déposée
// dans le bucket sous `thumbnails/<shortcode>.jpg` — le même dossier et le même
// geste que pour les figures. Sans miniature, une tuile de repli sobre plutôt
// qu'une image cassée.
function Thumb({ src, source, title, onError }) {
  if (!src) return <span className={styles.fallback} aria-hidden="true" />
  return (
    <img
      src={src}
      alt={title || ''}
      className={styles.img}
      loading="lazy"
      onError={onError}
      data-source={source}
    />
  )
}

/**
 * Un lien vidéo, rendu comme une vignette cliquable.
 *
 * La lecture se fait TOUJOURS chez l'hébergeur, dans un nouvel onglet : WakeRef
 * pointe, il ne diffuse pas. Un lecteur intégré retiendrait chez nous le trafic
 * qui revient à l'organisateur — c'est la contrepartie qu'il accepte en échange
 * d'être référencé.
 */
export default function VideoCard({ url, title, labels }) {
  const src = videoSourceFromUrl(url)
  // maxres n'existe pas pour toutes les vidéos : on retombe sur hq au 404.
  const [ytHiRes, setYtHiRes] = useState(true)
  const [thumbFailed, setThumbFailed] = useState(false)

  let thumb = null
  let cta = labels.generic
  let icon = 'player-play'

  if (src.type === 'youtube') {
    thumb = `https://i.ytimg.com/vi/${src.id}/${ytHiRes ? 'maxresdefault' : 'hqdefault'}.jpg`
    cta = labels.youtube
    icon = 'brand-youtube'
  } else if (src.type === 'instagram') {
    thumb = supabase.storage.from('videos')
      .getPublicUrl(`thumbnails/${src.shortcode}.jpg`).data.publicUrl
    cta = labels.instagram
    icon = 'brand-instagram'
  }

  const onThumbError = () => {
    if (src.type === 'youtube' && ytHiRes) { setYtHiRes(false); return }
    setThumbFailed(true)
  }

  return (
    <a href={externalUrl(url, { ref: true })} target="_blank" rel="noopener noreferrer" className={styles.card}>
      <Thumb src={thumbFailed ? null : thumb} source={src.type} title={title} onError={onThumbError} />
      <span className={styles.scrim}>
        <span className={styles.play}><Icon name="player-play" /></span>
        <span className={styles.info}>
          {title && <span className={styles.title}>{title}</span>}
          <span className={styles.cta}><Icon name={icon} size={15} /> {cta}</span>
        </span>
      </span>
    </a>
  )
}
