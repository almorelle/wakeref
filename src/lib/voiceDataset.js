// Collecte LOCALE d'échantillons (audio + label) pour entraîner plus tard un
// modèle léger spécialisé. Tout vit dans IndexedDB sur l'appareil — aucun backend,
// hors-ligne, l'audio ne sort que via l'export explicite (un .zip audiofolder).
//
// Chaque push-to-talk produit une paire (clip audio, trick confirmé) : le clip du
// MediaRecorder + le trick choisi au chip = la vérité terrain pour le fine-tuning.

const DB = 'wakeref_voice_dataset'
const STORE = 'samples'

function open() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1)
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) {
        req.result.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

function tx(db, mode) {
  return db.transaction(STORE, mode).objectStore(STORE)
}

// Ajoute un échantillon. `blob` = audio brut (webm/opus du MediaRecorder).
// Renvoie l'id auto-incrémenté (pour mettre à jour le label ensuite).
export async function addSample(rec) {
  const db = await open()
  return new Promise((resolve, reject) => {
    const r = tx(db, 'readwrite').add({ ...rec, createdAt: Date.now() })
    r.onsuccess = () => resolve(r.result)
    r.onerror = () => reject(r.error)
  })
}

// Met à jour le label (trick confirmé) d'un échantillon déjà stocké.
export async function updateLabel(id, label) {
  const db = await open()
  const store = tx(db, 'readwrite')
  return new Promise((resolve, reject) => {
    const g = store.get(id)
    g.onsuccess = () => {
      const rec = g.result
      if (!rec) return resolve(false)
      const p = store.put({ ...rec, ...label })
      p.onsuccess = () => resolve(true)
      p.onerror = () => reject(p.error)
    }
    g.onerror = () => reject(g.error)
  })
}

// Nombre d'échantillons par trick (slug) — pour piloter une collecte équilibrée.
export async function countsBySlug() {
  const rows = await allSamples()
  const m = {}
  for (const r of rows) if (r.labelSlug) m[r.labelSlug] = (m[r.labelSlug] || 0) + 1
  return m
}

export async function countSamples() {
  const db = await open()
  return new Promise((resolve, reject) => {
    const r = tx(db, 'readonly').count()
    r.onsuccess = () => resolve(r.result)
    r.onerror = () => reject(r.error)
  })
}

async function allSamples() {
  const db = await open()
  return new Promise((resolve, reject) => {
    const r = tx(db, 'readonly').getAll()
    r.onsuccess = () => resolve(r.result || [])
    r.onerror = () => reject(r.error)
  })
}

// Supprime un échantillon (annuler le dernier enregistrement raté).
export async function deleteSample(id) {
  const db = await open()
  return new Promise((resolve, reject) => {
    const r = tx(db, 'readwrite').delete(id)
    r.onsuccess = () => resolve()
    r.onerror = () => reject(r.error)
  })
}

export async function clearSamples() {
  const db = await open()
  return new Promise((resolve, reject) => {
    const r = tx(db, 'readwrite').clear()
    r.onsuccess = () => resolve()
    r.onerror = () => reject(r.error)
  })
}

const csvCell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`

// Construit un .zip au format « audiofolder » HuggingFace : audio/NNNN.webm +
// metadata.csv (file_name,transcription,…). JSZip en dynamic import (hors bundle).
// `transcription` = nom canonique du trick confirmé (cible d'entraînement) ; on
// joint aussi le texte STT brut et le slug pour le tri/nettoyage ultérieur.
export async function exportZip() {
  const rows = await allSamples()
  if (!rows.length) return null
  const { default: JSZip } = await import('jszip')
  const zip = new JSZip()
  const audio = zip.folder('audio')
  const ext = (mime) => (mime?.includes('ogg') ? 'ogg' : mime?.includes('wav') ? 'wav' : 'webm')
  const lines = ['file_name,transcription,stt,slug,discipline,model,created_at']
  rows.forEach((r, i) => {
    const n = String(i + 1).padStart(4, '0')
    const name = `${n}.${ext(r.mime)}`
    if (r.blob) audio.file(name, r.blob)
    lines.push([
      csvCell(`audio/${name}`), csvCell(r.labelName), csvCell(r.sttText),
      csvCell(r.labelSlug), csvCell(r.discipline), csvCell(r.model),
      csvCell(new Date(r.createdAt).toISOString()),
    ].join(','))
  })
  zip.file('metadata.csv', lines.join('\n'))
  return zip.generateAsync({ type: 'blob' })
}
