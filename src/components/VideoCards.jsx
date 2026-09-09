import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { externalUrl } from '../lib/url'
import { videoSourceFromUrl } from '../lib/videoSource'
import { useInView } from '../hooks/useInView'
import Icon from './Icon'
import styles from './VideoCards.module.css'

const cx = (...c) => c.filter(Boolean).join(' ')

/**
 * Un lien vidéo, rendu comme une vignette cliquable.
 *
 * La lecture se fait TOUJOURS chez l'hébergeur, dans un nouvel onglet : WakeRef
 * pointe, il ne diffuse pas. Un lecteur intégré retiendrait chez nous le trafic
 * qui revient à l'auteur·ice — c'est la contrepartie qu'iel accepte en échange
 * d'être référencé·e. Seul un fichier que WakeRef héberge lui-même se lit sur
 * place, et ce cas-là n'est pas une vignette : il vit dans `FigureDetail`.
 *
 * Un seul composant sert les deux surfaces. `variant` choisit l'habillage —
 * les deux pages ne montrent pas la même chose et c'est délibéré : une fiche
 * compétition distingue ses vidéos par leur titre (« finales » vs « qualifs »),
 * une page de figure les distingue par leur miniature et crédite l'auteur·ice.
 * Ce qui est commun, et qui était jusqu'ici écrit deux fois, c'est tout le
 * reste : reconnaître la plateforme, trouver la miniature, gérer son échec,
 * différer le montage, ouvrir dehors.
 */
export default function VideoCard({
  url,
  title,
  creatorName,
  sourceType,
  labels = {},
  variant = 'competition',
}) {
  const [ref, inView] = useInView()
  // maxres n'existe pas pour toutes les vidéos : on retombe sur hq au 404.
  const [ytHiRes, setYtHiRes] = useState(true)
  const [thumbFailed, setThumbFailed] = useState(false)
  // Une carte peut être recyclée pour une autre vidéo sans être démontée. Sans
  // cette remise à zéro, l'échec de la précédente condamnerait la suivante.
  const [prevUrl, setPrevUrl] = useState(url)
  if (url !== prevUrl) { setPrevUrl(url); setYtHiRes(true); setThumbFailed(false) }

  // `externalUrl` d'abord : `videos.source_url` n'a pas de CHECK de schéma —
  // contrairement à `competition_videos.url` — et l'admin déduit la plateforme
  // par simple sous-chaîne, donc « youtu.be/xyz » est stockable. `new URL()`
  // lèverait dessus et la miniature disparaîtrait sans bruit. C'est la même
  // normalisation que celle appliquée au lien lui-même.
  const src = videoSourceFromUrl(externalUrl(url))
  // L'URL décide. La colonne `source_type` ne parle que si l'URL ne se laisse
  // pas lire : sans ce repli, une ligne Instagram pointant vers un profil —
  // aujourd'hui rendue en tuile de marque — tomberait sur la carte générique.
  const type = src.type !== 'link'
    ? src.type
    : (sourceType === 'youtube' || sourceType === 'instagram' ? sourceType : 'link')

  let thumb = null
  if (type === 'youtube' && src.id) {
    thumb = `https://i.ytimg.com/vi/${src.id}/${ytHiRes ? 'maxresdefault' : 'hqdefault'}.jpg`
  } else if (type === 'instagram' && src.shortcode) {
    // YouTube sert une miniature publiquement ; Instagram non, donc on lit celle
    // déposée dans le bucket — même dossier et même geste que pour les figures.
    thumb = supabase.storage.from('videos')
      .getPublicUrl(`thumbnails/${src.shortcode}.jpg`).data.publicUrl
  }
  if (thumbFailed) thumb = null

  const onThumbError = () => {
    if (type === 'youtube' && ytHiRes) { setYtHiRes(false); return }
    setThumbFailed(true)
  }

  const link = {
    href: externalUrl(url, { ref: true }),
    target: '_blank',
    rel: 'noopener noreferrer',
  }
  const play = (cls) => <span className={cls}><Icon name="player-play" /></span>

  // ── Habillage « figure » : la miniature parle, le titre et le crédit vivent
  // sous la carte (`videoMeta`), pas dessus. Seul Instagram porte un texte —
  // c'est le nom de l'auteur·ice, et il tient lieu de signature.
  if (variant === 'figure') {
    // Un lien doit mener à une vidéo. `source_type` est posé par l'admin sur
    // toute URL contenant « youtube.com » — une page de chaîne ou une playlist
    // comprise —, donc un type YouTube sans identifiant ne désigne rien de
    // regardable : bloc inerte, comme avant, plutôt qu'un lien vers une page
    // sans vidéo. Instagram fait exception et reste cliquable même sans
    // shortcode : un lien de profil mène quand même à l'auteur·ice.
    if (type === 'link' || (type === 'youtube' && !src.id)) {
      return <div className={styles.videoPlaceholder}><Icon name="player-play" /></div>
    }

    if (type === 'instagram') {
      const info = (
        <div className={styles.instaInfo}>
          {creatorName && <span className={styles.instaAuthor}>{creatorName}</span>}
          <span className={styles.instaCta}><Icon name="brand-instagram" /> {labels.instagram}</span>
        </div>
      )
      return (
        // Pas de `ref` ici : la miniature Instagram n'est pas différée. Son
        // cadre ne réserve aucune hauteur — `instaImg` est en `height: auto` —,
        // donc la monter tardivement ferait sauter la maçonnerie du fil.
        // `loading="lazy"` retient déjà l'octet, ce que le différé viserait.
        <a {...link} aria-label={title || creatorName || labels.instagram} className={styles.instaCard}>
          {thumb ? (
            <>
              <img
                src={thumb}
                alt={title || creatorName || ''}
                className={styles.instaImg}
                loading="lazy"
                onError={onThumbError}
              />
              <div className={styles.instaScrim}>{play(styles.instaPlay)}{info}</div>
            </>
          ) : (
            <div className={styles.instaFallback}>{play(styles.instaPlay)}{info}</div>
          )}
        </a>
      )
    }

    // YouTube : cadre, miniature, bouton lecture seul — le titre et le crédit
    // sont rendus sous la carte. Si les deux résolutions échouent, un bloc au
    // bon format plutôt qu'un cadre écrasé à zéro ou une image cassée :
    // `ytThumb` porte déjà le ratio et le fond.
    const vertical = src.vertical
    return (
      <a {...link} ref={ref} aria-label={title || labels.youtube} className={cx(styles.mediaWrap, vertical && styles.mediaVertical)}>
        {inView && (thumb
          ? (
            <img
              src={thumb}
              alt={title || ''}
              className={cx(styles.ytThumb, vertical && styles.ytThumbVertical)}
              loading="lazy"
              onError={onThumbError}
            />
          )
          : <span className={cx(styles.ytThumb, vertical && styles.ytThumbVertical)} aria-hidden="true" />
        )}
        <span className={styles.mediaScrim}>{play(styles.instaPlay)}</span>
      </a>
    )
  }

  // ── Habillage « compétition » : le titre est porté par la carte elle-même.
  // Rien ne l'entoure sur la fiche, donc « jour 1 » et « finales » ne se
  // distinguent que là.
  const cta = type === 'youtube' ? labels.youtube
    : type === 'instagram' ? labels.instagram
      : labels.generic
  const icon = type === 'youtube' ? 'brand-youtube'
    : type === 'instagram' ? 'brand-instagram'
      : 'player-play'

  return (
    <a {...link} ref={ref} className={styles.card}>
      {inView && (thumb
        ? (
          <img
            src={thumb}
            alt={title || ''}
            className={styles.img}
            loading="lazy"
            onError={onThumbError}
            data-source={type}
          />
        )
        // Aucune miniature déposée : un aplat sobre plutôt qu'une image cassée.
        : <span className={styles.fallback} aria-hidden="true" />
      )}
      <span className={styles.scrim}>
        {play(styles.play)}
        <span className={styles.info}>
          {title && <span className={styles.title}>{title}</span>}
          <span className={styles.cta}><Icon name={icon} size={15} /> {cta}</span>
        </span>
      </span>
    </a>
  )
}
