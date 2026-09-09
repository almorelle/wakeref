// Plafonds de taille des fichiers déposés depuis l'admin.
//
// `accept="video/*"` n'est qu'un filtre de sélecteur : il oriente la boîte de
// dialogue, il n'empêche rien. Sans ce contrôle, un fichier de 40 Mo partait
// dans un bucket PUBLIC sans que rien ne l'arrête — sur un plan gratuit d'1 Go,
// une poignée de fichiers de ce calibre suffit à le remplir, et le visiteur
// paierait l'écart en temps de chargement.
//
// Les valeurs sont larges à dessein : les clips de la couverture pèsent 1 à
// 2,5 Mo. Le plafond n'est pas là pour discipliner un cadrage, seulement pour
// arrêter l'accident — le fichier source oublié, l'export non compressé.
//
// Ce contrôle est un confort de saisie, pas une frontière : il vit dans le
// navigateur et se contourne. La vraie borne est `file_size_limit` sur le
// bucket, posée en base (cf. `scripts/migrations/0020-bucket-file-size.sql`).
export const MAX_VIDEO_MB = 25
export const MAX_IMAGE_MB = 5

// Taille lisible : octets → Mo avec 1 décimale.
export const formatMB = (bytes) => (bytes / (1024 * 1024)).toFixed(1) + ' Mo'

/**
 * Retourne un message d'erreur si le fichier dépasse le plafond, sinon `null`.
 * Le message donne les deux nombres : savoir qu'on est trop lourd ne dit pas
 * de combien il faut alléger.
 */
export function refusSiTropLourd(file, maxMB) {
  if (!file) return null
  if (file.size <= maxMB * 1024 * 1024) return null
  return `Fichier trop lourd : ${formatMB(file.size)} (maximum ${maxMB} Mo). `
    + 'Compresse-le ou choisis un export plus léger.'
}
