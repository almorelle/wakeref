// Détection de la plateforme d'une vidéo à partir de sa seule URL.
//
// Module React-free et séparé du composant qui l'utilise : exporter une fonction
// depuis un fichier de composants casse le fast refresh (même raison que le
// découpage Provider / hook des contextes).
//
// Le type est DÉDUIT plutôt que saisi : `competition_videos` ne stocke qu'un
// lien, donc il n'y a aucune colonne à remplir de travers.
export function videoSourceFromUrl(url = '') {
  let u
  try { u = new URL(String(url)) } catch { return { type: 'link' } }
  // L'hôte est comparé explicitement : sans ça, `autre.example/?u=youtu.be/X`
  // était pris pour une vidéo YouTube et son identifiant fini dans une iframe.
  const host = u.hostname.toLowerCase().replace(/^www\./, '')
  const path = u.pathname

  if (host === 'youtu.be') {
    const id = path.slice(1).split('/')[0]
    return isYtId(id) ? { type: 'youtube', id, vertical: false } : { type: 'link' }
  }
  if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtube-nocookie.com') {
    // `/live/` est l'URL canonique d'un direct et de son archive — la forme la
    // plus probable sur une page de compétitions, et celle qui manquait.
    const m = path.match(/^\/(?:shorts|embed|live|v)\/([^/?#]+)/)
    if (m) return isYtId(m[1]) ? { type: 'youtube', id: m[1], vertical: path.startsWith('/shorts/') } : { type: 'link' }
    // `watch?v=` peut être précédé d'autres paramètres (`?app=desktop&v=…`,
    // `?list=…&v=…`) : on lit le paramètre, on ne cherche pas une sous-chaîne.
    const v = u.searchParams.get('v')
    if (v && isYtId(v)) return { type: 'youtube', id: v, vertical: false }
    return { type: 'link' }
  }
  if (host === 'instagram.com' || host === 'instagr.am') {
    const m = path.match(/^\/(?:p|reel|reels|tv)\/([^/?#]+)/)
    if (m) return { type: 'instagram', shortcode: m[1] }
  }
  return { type: 'link' }
}

// Les identifiants YouTube font 11 caractères ; borner évite d'embarquer
// n'importe quel segment de chemin dans une URL de lecteur.
const isYtId = (id) => /^[\w-]{6,20}$/.test(id)
