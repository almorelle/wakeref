import { useState } from 'react'
import { supabase } from '../lib/supabase'

/**
 * Image servie depuis le bucket, tolérante à l'absence du fichier.
 *
 * Ces visuels sont retrouvés par convention de nommage et non par une référence
 * vérifiée : le fichier peut donc légitimement manquer, et `getPublicUrl` ne le
 * dit pas — elle fabrique une URL à partir d'une chaîne, sans jamais vérifier.
 * Une image cassée serait pire que pas d'image, d'où le repli au premier échec.
 *
 * Sans `fallback`, le composant s'efface complètement (cas des logos
 * d'affiliation). Avec, il rend le repli fourni — les initiales sur le fil, pour
 * que la ligne garde le repère visuel qui la rend reconnaissable.
 *
 * Aucun ratio n'est supposé : l'image est contenue, jamais recadrée ni étirée.
 */
export default function RemoteLogo({
  path, alt = '', height, className, imgClassName, emptyClassName, fallback = null,
}) {
  // `path` fait partie de la clé : sans ça, un composant réutilisé avec une
  // autre image resterait masqué à cause d'un échec précédent.
  const [failedPath, setFailedPath] = useState(null)
  const broken = !path || failedPath === path

  if (broken) {
    if (!fallback) return null
    return <span className={[className, emptyClassName].filter(Boolean).join(' ')}>{fallback}</span>
  }

  const url = supabase.storage.from('videos').getPublicUrl(path).data.publicUrl
  const img = (
    <img
      src={url}
      alt={alt}
      className={imgClassName}
      loading="lazy"
      onError={() => setFailedPath(path)}
      style={height ? { height, width: 'auto', maxWidth: '100%', objectFit: 'contain', display: 'block' } : undefined}
    />
  )
  return fallback || className ? <span className={className}>{img}</span> : img
}
