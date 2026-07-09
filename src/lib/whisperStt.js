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
  base:       'onnx-community/whisper-base',
  small:      'onnx-community/whisper-small',
  large:      'onnx-community/whisper-large-v3-turbo',
  wakeref:    'almorelle/whisper-wakeref-onnx',       // fine-tuné maison tricks isolés (whisper-base, fp32)
  wakerefJib: 'almorelle/whisper-wakeref-jib-onnx',   // fine-tuné maison PASSES jib (whisper-small, q8)
}

// Biais de vocabulaire (prompt) : on amorce le décodeur Whisper avec les noms de
// tricks que le modèle écorche le plus, pour le pousser vers la bonne orthographe.
// Liste FOCALISÉE (budget de tokens limité) sur le jargon dur, pas tout le catalogue.
const BIAS_VOCAB =
  'Crow Mobe, Scarecrow, Railey, Blind Judge, Tantrum, Mobe, Moby Dick, S-Bend, ' +
  'S-Mobe, Hinterberger, Whirlybird, Vulcan, Krypt, KGB, Pete Rose, Dum Dum, ' +
  'Half Cab Roll, Back Mobe, Front Roll, Back Roll, Slim Chance, Tweetie. ' +
  // Jargon jib (dictée libre du jib) : structure d'une passe + rotations par pas
  // de 90° absentes du catalogue figures (entrées/sorties de modules).
  'Transfer, entrée, sortie, rail to rail, lip, blind, 90, 270, 450, 630.'

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
        // Modèle jib (whisper-BASE fine-tuné → assez léger pour du fp32 temps réel).
        // fp32 natif = zéro conversion (fp16 via onnxconverter_common casse le graphe
        // Whisper ; q4 pas dispo dans onnxruntime Colab). WebGPU : fp32. WASM : q8.
        if (modelKey === 'wakerefJib') {
          return device === 'webgpu'
            ? { encoder_model: 'fp32', decoder_model_merged: 'fp32' }
            : { encoder_model: 'q8', decoder_model_merged: 'q8' }
        }
        if (device === 'webgpu') return { encoder_model: modelKey === 'large' ? 'fp16' : 'fp32', decoder_model_merged: 'q4' }
        return 'q8'
      }
      const build = async (device) => {
        const pipe = await pipeline('automatic-speech-recognition', id, {
          device,
          dtype: dtypeFor(device),
          progress_callback: onProgress,
        })
        // Warmup : la 1re inférence WebGPU COMPILE les shaders (souvent 10-20 s, une seule
        // fois). On la paie ICI, au chargement/préchargement (sur 1 s de silence), pour que
        // la 1re passe LIVE ne la subisse pas. Best-effort : si ça échoue, on ignore.
        try { await pipe(new Float32Array(16000), { language: 'french', task: 'transcribe', max_new_tokens: 4 }) } catch { /* no-op */ }
        return pipe
      }

      // WebGPU si dispo (rapide, et évite le wasm de 24 Mo), repli WASM sinon.
      if (typeof navigator !== 'undefined' && 'gpu' in navigator) {
        try { const p = await build('webgpu'); console.info(`[whisper] backend WebGPU · modèle ${modelKey}`); return p }
        catch (e) { console.warn('WebGPU indisponible, repli WASM', e) }
      }
      const p = await build('wasm'); console.info(`[whisper] backend WASM (CPU) · modèle ${modelKey}`); return p
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

// ── Décodage contraint par GRAMMAIRE ─────────────────────────────────────────
// whisper multilingue : tokens texte < 50257 ; spéciaux ≥ 50257 (EOS = 50257). Le
// préfixe forcé (SOT/langue/transcribe/notimestamps) est donc tout en ≥ 50257 →
// le contenu commence au 1er token < 50257.
const TEXT_FLOOR = 50257   // = EOS ; tokens texte strictement en-dessous

// Trie de tokens des phrases autorisées. Chaque phrase est tokenisée AVEC et SANS
// espace initial (whisper préfixe les mots d'un espace ; le 1er mot parfois non).
function buildGrammar(tok, phrases) {
  const root = { children: new Map(), terminal: false }
  const insert = (ids) => {
    let node = root
    for (const id of ids) {
      let c = node.children.get(id)
      if (!c) { c = { children: new Map(), terminal: false }; node.children.set(id, c) }
      node = c
    }
    node.terminal = true
  }
  for (const p of phrases) {
    for (const form of [' ' + p, p]) {
      const ids = encodeIds(tok, form)
      if (ids && ids.length) insert(ids)
    }
  }
  return root
}

// LogitsProcessor qui contraint la sortie à un chemin valide de la grammaire.
// Une passe = suite libre de phrases (atome*) : à chaque frontière de phrase on peut
// enchaîner une nouvelle phrase ou s'arrêter (EOS). Sans état persistant : on re-marche
// le NFA sur le contenu déjà généré à chaque pas (séquences courtes → négligeable).
let _GrammarCls = null
async function grammarProcessor(root) {
  const { LogitsProcessor } = await import('@huggingface/transformers')
  if (!_GrammarCls) {
    _GrammarCls = class JibGrammar extends LogitsProcessor {
      constructor(root) { super(); this.root = root }
      _call(input_ids, logits) {
        for (let b = 0; b < input_ids.length; b++) {
          const seq = input_ids[b]
          let start = 0
          while (start < seq.length && Number(seq[start]) >= TEXT_FLOOR) start++  // saute le préfixe forcé
          // états NFA après consommation du contenu déjà émis
          let states = new Set([this.root])
          for (let k = start; k < seq.length; k++) {
            const t = Number(seq[k])
            const next = new Set()
            for (const node of states) {
              const c = node.children.get(t)
              if (c) next.add(c)
              if (node.terminal || node === this.root) {   // frontière → nouvelle phrase possible
                const r = this.root.children.get(t)
                if (r) next.add(r)
              }
            }
            states = next
            if (states.size === 0) break
          }
          // tokens autorisés depuis l'état courant
          const allowed = new Set()
          let boundary = states.size === 0 || states.has(this.root)
          for (const node of states) {
            for (const t of node.children.keys()) allowed.add(t)   // continuer la phrase
            if (node.terminal) boundary = true
          }
          if (boundary) {
            for (const t of this.root.children.keys()) allowed.add(t) // démarrer une phrase
            allowed.add(TEXT_FLOOR)                                   // ou s'arrêter (EOS)
          }
          if (allowed.size === 0) allowed.add(TEXT_FLOOR)            // garde-fou anti-NaN
          const data = logits[b].data
          for (let k = 0; k < data.length; k++) if (!allowed.has(k)) data[k] = -Infinity
        }
        return logits
      }
    }
  }
  return new _GrammarCls(root)
}

// Transcrit un Float32Array mono 16 kHz. `language` en clair ('french'). `bias` =
// prompt biasing. `constrain` + `grammarPhrases` → décodage contraint par grammaire.
export async function transcribe(float32, { language = 'french', model = 'base', bias = false, constrain = false, grammarPhrases = null } = {}) {
  const t = await loadWhisper(model)
  // Garde-fou anti-boucle : Whisper peut partir en répétition (« de set de set… »).
  // On borne la longueur générée → le pire cas tombe de ~2 min (plafond 448 tokens)
  // à ~2-3 s. Un trick isolé comme une passe jib tiennent LARGEMENT sous 128 tokens.
  const opts = { language, task: 'transcribe', chunk_length_s: 30, max_new_tokens: 128 }
  if (bias) {
    const pid = promptIdsFor(t)
    if (pid) opts.prompt_ids = pid
  }
  if (constrain && grammarPhrases && grammarPhrases.length) {
    if (t.__gpKey !== grammarPhrases) {                 // (re)construit le trie si la liste change
      t.__grammar = buildGrammar(t.tokenizer, grammarPhrases)
      t.__gpKey = grammarPhrases
    }
    opts.logits_processor = [await grammarProcessor(t.__grammar)]
    // En décodage contraint, l'EOS lutte contre un atome « attracteur » (ex. 270) →
    // pénaliser la répétition pousse vers un autre atome ou la fin (soft, jamais tout
    // masquer → pas de NaN, contrairement à no_repeat_ngram_size qui heurterait la grammaire).
    opts.repetition_penalty = 1.5
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
