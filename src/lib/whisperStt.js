// STT LOCAL via Whisper (transformers.js) — palier 2.
//
// Pourquoi : la Web Speech API (palier 1) passe par les serveurs Google → online,
// Chrome-only, échoue en `network` sur Brave/Arc/Chromium. Whisper local supprime
// tout ça : hors-ligne, indépendant du navigateur, aucun réseau au runtime (hors
// 1er téléchargement du modèle).
//
// Isolation (exigence produit) : transformers.js est en DYNAMIC IMPORT → son gros
// chunk n'est tiré qu'au 1er usage du STT local, jamais à l'ouverture de la page.
// Les poids du modèle viennent du CDN Hugging Face au RUNTIME → jamais dans le
// bundle, jamais précachés par la PWA.

// Modèles multilingues (onnx-community, servis depuis le Hub HF). base = léger,
// small = +qualité FR, large = whisper-large-v3-turbo (bien meilleur sur les noms
// propres/jargon, mais gros téléchargement). Choisis dans l'UI pour A/B tester.
export const MODELS = {
  base:    'onnx-community/whisper-base',
  small:   'onnx-community/whisper-small',
  large:   'onnx-community/whisper-large-v3-turbo',
  wakeref: 'almorelle/whisper-wakeref-onnx',   // fine-tuné maison (whisper-base, fp32)
}

// Biais de vocabulaire (prompt) : on amorce le décodeur Whisper avec les noms de
// tricks que le modèle écorche le plus, pour le pousser vers la bonne orthographe.
// Liste FOCALISÉE (budget de tokens limité) sur le jargon dur, pas tout le catalogue.
const BIAS_VOCAB =
  'Crow Mobe, Scarecrow, Railey, Blind Judge, Tantrum, Mobe, Moby Dick, S-Bend, ' +
  'S-Mobe, Hinterberger, Whirlybird, Vulcan, Krypt, KGB, Pete Rose, Dum Dum, ' +
  'Half Cab Roll, Back Mobe, Front Roll, Back Roll, Slim Chance, Tweetie.'

// Cache des pipelines par id de modèle (on peut basculer base↔small sans perdre
// celui déjà chargé).
const _cache = {}

// Charge (une seule fois par modèle) le pipeline ASR. `onProgress` reçoit les
// events de téléchargement des poids (status/file/loaded/total/progress).
export function loadWhisper(modelKey = 'base', onProgress) {
  const id = MODELS[modelKey] || modelKey
  if (!_cache[id]) {
    _cache[id] = (async () => {
      const { pipeline, env } = await import('@huggingface/transformers')
      // Modèle servi depuis le Hub HF uniquement : pas de tentative locale (évite
      // un 404 sur /models/… avant le repli CDN).
      env.allowLocalModels = false

      // Le modèle maison n'est exporté qu'en fp32 (pas de variantes quantizées) →
      // dtype fp32 explicite. Les modèles onnx-community ont du q4/q8 → on quantize.
      const dtypeFor = (device) => {
        if (modelKey === 'wakeref') return { encoder_model: 'fp32', decoder_model_merged: 'fp32' }
        if (device === 'webgpu') return { encoder_model: modelKey === 'large' ? 'fp16' : 'fp32', decoder_model_merged: 'q4' }
        return 'q8'
      }
      const build = (device) => pipeline('automatic-speech-recognition', id, {
        device,
        dtype: dtypeFor(device),
        progress_callback: onProgress,
      })

      // WebGPU si dispo (rapide, et évite le wasm de 24 Mo), repli WASM sinon.
      if (typeof navigator !== 'undefined' && 'gpu' in navigator) {
        try { return await build('webgpu') }
        catch (e) { console.warn('WebGPU indisponible, repli WASM', e) }
      }
      return build('wasm')
    })().catch((e) => { delete _cache[id]; throw e })  // permet un retry
  }
  return _cache[id]
}

export function isWhisperLoaded(modelKey = 'base') {
  return !!_cache[MODELS[modelKey] || modelKey]
}

// Encode du texte en token ids (sans tokens spéciaux). Tolère les deux formes
// d'API tokenizer de transformers.js (.encode → number[] | callable → {input_ids}).
function encodeIds(tok, text) {
  try {
    if (typeof tok.encode === 'function') {
      const r = tok.encode(text, { add_special_tokens: false })
      if (Array.isArray(r) && r.length) return r
    }
  } catch { /* fallthrough */ }
  try {
    const ii = tok(text, { add_special_tokens: false })?.input_ids
    const a = ii?.tolist ? ii.tolist() : ii
    if (Array.isArray(a)) return Array.isArray(a[0]) ? a[0] : a
  } catch { /* no-op */ }
  return null
}

// prompt_ids façon Whisper : [ <|startofprev|> , ...tokens(vocab) ]. Best-effort :
// si quoi que ce soit échoue (API tokenizer, token spécial introuvable), on
// renvoie null → transcription SANS biais (jamais de crash). Calculé une fois /pipeline.
function promptIdsFor(t) {
  if ('__promptIds' in t) return t.__promptIds
  let ids = null
  try {
    const tok = t.tokenizer
    const sop = encodeIds(tok, '<|startofprev|>')          // doit être 1 seul id spécial
    const body = encodeIds(tok, ' ' + BIAS_VOCAB.trim())
    if (sop && sop.length === 1 && body && body.length) ids = [sop[0], ...body]
  } catch (e) { console.warn('Biais vocabulaire indisponible (ignoré)', e) }
  t.__promptIds = ids
  return ids
}

// Transcrit un Float32Array mono 16 kHz. `language` en clair ('french'). `bias`
// active le prompt biasing (expérimental, repli silencieux si non supporté).
export async function transcribe(float32, { language = 'french', model = 'base', bias = false } = {}) {
  const t = await loadWhisper(model)
  const opts = { language, task: 'transcribe', chunk_length_s: 30 }
  if (bias) {
    const pid = promptIdsFor(t)
    if (pid) opts.prompt_ids = pid
  }
  const out = await t(float32, opts)
  return (out?.text || '').trim()
}

// Décode un Blob audio (MediaRecorder, webm/opus) en Float32Array mono 16 kHz —
// format attendu par Whisper. decodeAudioData rééchantillonne au sampleRate du
// contexte ; on force 16 kHz et on prend le 1er canal.
export async function blobToMono16k(blob) {
  const buf = await blob.arrayBuffer()
  const Ctx = window.AudioContext || window.webkitAudioContext
  const ctx = new Ctx({ sampleRate: 16000 })
  try {
    const audio = await ctx.decodeAudioData(buf)
    return audio.getChannelData(0).slice()   // copie : le buffer est libéré au close()
  } finally {
    ctx.close()
  }
}
