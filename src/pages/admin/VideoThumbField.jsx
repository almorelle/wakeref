import { useState, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { videoSourceFromUrl } from '../../lib/videoSource'
import { compressImage } from '../../lib/compressImage'
import { MAX_IMAGE_MB, refusSiTropLourd } from '../../lib/uploadLimits'
import styles from './VideoThumbField.module.css'

// Miniature d'une ligne vidéo, sous son lien.
//
// YouTube sert ses miniatures publiquement : il n'y a rien à faire, on montre
// seulement celle que la carte publique affichera. Instagram non — la carte lit
// `videos/thumbnails/<shortcode>.jpg`, et ce champ la dépose : on colle,
// glisse ou choisit l'image, elle est réduite dans le navigateur puis nommée
// d'après l'URL. Le chemin est celui que `VideoCards` construit, donc partagé
// avec les vidéos de figures : une même vidéo n'a qu'une miniature.
//
// Le dépôt est immédiat, pas différé à l'enregistrement du formulaire : la
// miniature ne dépend pas de la ligne (elle ne dépend que du shortcode), et
// voir le résultat tout de suite est tout l'intérêt du champ.
export default function VideoThumbField({ url }) {
  const src = videoSourceFromUrl(url.trim())
  if (src.type === 'youtube') {
    return (
      <div className={styles.wrap}>
        <img className={styles.preview} alt="" loading="lazy"
          src={`https://i.ytimg.com/vi/${src.id}/hqdefault.jpg`} />
        <p className={styles.info}>Miniature fournie par YouTube — rien à déposer.</p>
      </div>
    )
  }
  if (src.type === 'instagram') return <InstagramThumb key={src.shortcode} shortcode={src.shortcode} />
  return null
}

function InstagramThumb({ shortcode }) {
  const path = `thumbnails/${shortcode}.jpg`
  const publicUrl = supabase.storage.from('videos').getPublicUrl(path).data.publicUrl
  // `bust` contourne le cache (max-age 1 h) après un remplacement : sans lui,
  // l'aperçu montrerait l'ancienne image. Le site public, lui, la gardera
  // jusqu'à expiration — on le dit à l'écran.
  const [bust, setBust]     = useState(0)
  const [state, setState]   = useState('loading') // loading | present | missing | busy
  const [replaced, setReplaced] = useState(false)
  const [error, setError]   = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef(null)

  const deposit = async (file) => {
    if (!file) return
    if (!file.type.startsWith('image/')) { setError('Ce n’est pas une image.'); return }
    setError(null)
    const had = state === 'present'
    setState('busy')
    try {
      const blob = await compressImage(file)
      const refus = refusSiTropLourd(blob, MAX_IMAGE_MB)
      if (refus) throw new Error(refus)
      // Pas de policy UPDATE sur storage.objects : `upsert` échouerait sur un
      // objet existant. On retire d'abord — sans effet s'il n'existe pas.
      await supabase.storage.from('videos').remove([path])
      const { error: upErr } = await supabase.storage.from('videos')
        .upload(path, blob, { contentType: 'image/jpeg', upsert: false })
      if (upErr) throw upErr
      setReplaced(had)
      setBust(Date.now())
      setState('loading')
    } catch (err) {
      setError('Échec : ' + (err.message || err))
      setState(had ? 'present' : 'missing')
    }
  }

  const onPaste = (e) => {
    const item = [...e.clipboardData.items].find(it => it.type.startsWith('image/'))
    if (!item) return
    e.preventDefault()
    deposit(item.getAsFile())
  }
  const onDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    deposit(e.dataTransfer.files?.[0])
  }

  const busy = state === 'busy'
  return (
    <div className={styles.wrap}>
      <img
        className={styles.preview}
        alt=""
        src={bust ? `${publicUrl}?v=${bust}` : publicUrl}
        hidden={state !== 'present'}
        onLoad={() => setState(s => (s === 'busy' ? s : 'present'))}
        onError={() => setState(s => (s === 'busy' ? s : 'missing'))}
      />
      <div
        className={`${styles.zone} ${dragOver ? styles.zoneOver : ''} ${state === 'missing' ? styles.zoneMissing : ''}`}
        tabIndex={0}
        role="button"
        aria-label={`Miniature Instagram ${shortcode} : coller, glisser ou choisir une image`}
        onPaste={onPaste}
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => !busy && inputRef.current?.click()}
        onKeyDown={e => { if ((e.key === 'Enter' || e.key === ' ') && !busy) { e.preventDefault(); inputRef.current?.click() } }}
      >
        <strong>
          {busy ? 'Réduction et dépôt…'
            : state === 'missing' ? 'Miniature manquante'
            : state === 'present' ? 'Remplacer la miniature'
            : 'Vérification…'}
        </strong>
        <span>Clique ici puis ⌘V, glisse une image, ou clique pour choisir un fichier.</span>
        <span className={styles.path}>{path}</span>
      </div>
      <input ref={inputRef} type="file" accept="image/*" hidden
        onChange={e => { deposit(e.target.files?.[0]); e.target.value = '' }} />
      {error && <p className={styles.error}>{error}</p>}
      {replaced && state === 'present' && (
        <p className={styles.info}>Remplacée. Le site public peut montrer l’ancienne jusqu’à une heure (cache).</p>
      )}
    </div>
  )
}
