// Réduction d'une image dans le navigateur, avant dépôt dans le bucket.
//
// Remplace le passage par un outil local (ImageOptim) pour les miniatures :
// on redimensionne puis on réencode en JPEG. Pas de transformation côté
// Supabase — c'est une option payante.
//
// `maxSide` borne le plus grand côté : une miniature Instagram (9:16) de
// 1280 px de haut reste nette sur la carte (460 px CSS max, écran 2x) tout en
// pesant quatre à cinq fois moins que l'original 1216×2160.
export async function compressImage(file, { maxSide = 1280, quality = 0.82 } = {}) {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height))
  const w = Math.round(bitmap.width * scale)
  const h = Math.round(bitmap.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  // Fond blanc : un PNG transparent réencodé en JPEG virerait au noir.
  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, w, h)
  ctx.drawImage(bitmap, 0, 0, w, h)
  bitmap.close?.()

  const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', quality))
  if (!blob) throw new Error('Réencodage JPEG impossible')
  return blob
}
