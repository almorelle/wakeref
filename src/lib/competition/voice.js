// Moteur voix du module compétition. Branche les DEUX modèles maison fine-tunés sur
// la saisie du Run, en réutilisant les libs éprouvées par le lab /judge/voix.
//   • Tricks (kicker + air) : modèle `wakeref` + biais vocab → matchSegment(wakeboard) → nom canonique.
//   • Jib (passes)          : modèle `wakerefJib` (sans biais/grammaire) → normalizeJib (composeur filet).
// Archi NON-BLOQUANTE (le small met 8-15 s/passe) : on dicte, l'entrée passe « en cours »,
// un worker de fond transcrit et remplit, le juge enchaîne et valide/corrige APRÈS le run.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../supabase'
import { buildIndex, matchSegment } from '../voiceMatch'
import { transcribe, blobToMono16k } from '../whisperStt'
import { normalizeJib } from '../normalizeJib'

export const TRICK_CFG = { model: 'wakeref', bias: true }
export const JIB_CFG = { model: 'wakerefJib', bias: false, constrain: false }

export const micSupported = typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia

const FIG_CACHE = 'wakeref_voice_figures' // partagé avec /judge/voix (offline-first)

// Catalogue figures (pour matchSegment) : cache localStorage puis refresh Supabase.
function useVoiceFigures() {
  const [figures, setFigures] = useState(() => {
    try { const c = JSON.parse(localStorage.getItem(FIG_CACHE) || 'null'); return Array.isArray(c) && c.length ? c : [] } catch { return [] }
  })
  useEffect(() => {
    supabase.from('figures_card').select('slug,name,aliases,sport,sports,contexts,category_slug')
      .then(({ data }) => {
        if (!data) return
        setFigures(data)
        try { localStorage.setItem(FIG_CACHE, JSON.stringify(data)) } catch { /* quota */ }
      })
  }, [])
  return useMemo(() => buildIndex(figures), [figures])
}

// Enregistreur push-to-talk : start() ouvre le micro (paresseux) + MediaRecorder,
// stop() renvoie le Blob (ou null si vide). Le stream reste ouvert entre les prises.
function useRecorder() {
  const streamRef = useRef(null)
  const mrRef = useRef(null)
  const chunksRef = useRef([])
  const resolveRef = useRef(null)

  const start = useCallback(async () => {
    try { if (!streamRef.current) streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true }) } catch { return false }
    chunksRef.current = []
    const mr = new MediaRecorder(streamRef.current)
    mr.ondataavailable = (e) => { if (e.data.size) chunksRef.current.push(e.data) }
    mr.onstop = () => { const blob = new Blob(chunksRef.current, { type: mr.mimeType }); resolveRef.current?.(blob.size ? blob : null); resolveRef.current = null }
    mrRef.current = mr; mr.start(); return true
  }, [])

  const stop = useCallback(() => new Promise((res) => {
    const mr = mrRef.current
    if (!mr || mr.state !== 'recording') { res(null); return }
    resolveRef.current = res; mr.stop()
  }), [])

  useEffect(() => () => { try { streamRef.current?.getTracks().forEach((t) => t.stop()) } catch { /* no-op */ } }, [])
  return { start, stop }
}

// Hook principal : figures + enregistreur + file d'attente de transcription.
// `enqueue(kind, blob, target)` où target = { fill:'fillTrick'|'fillAir'|'fillAdhoc', ...coords }.
export function useCompetitionVoice(dispatch, onError) {
  const index = useVoiceFigures()
  const indexRef = useRef(index)
  useEffect(() => { indexRef.current = index }, [index])
  const { start, stop } = useRecorder()

  const queueRef = useRef([])
  const processingRef = useRef(false)
  const [pendingCount, setPendingCount] = useState(0)

  const process = useCallback(async () => {
    if (processingRef.current) return
    processingRef.current = true
    try {
      while (queueRef.current.length) {
        setPendingCount(queueRef.current.length)
        const item = queueRef.current.shift()
        const { fill, ...coords } = item.target
        try {
          const float = await blobToMono16k(item.blob)
          const cfg = item.kind === 'jib' ? JIB_CFG : TRICK_CFG
          let text = (await transcribe(float, { language: 'french', ...cfg })).trim()
          if (item.kind === 'jib') text = normalizeJib(text)
          else if (text) { const top = matchSegment(indexRef.current || [], text, { sports: ['wakeboard'], limit: 1 })[0]; if (top) text = top.fig.name }
          dispatch({ type: fill, ...coords, text: text || '' })
        } catch {
          dispatch({ type: fill, ...coords, text: '' })
          onError?.('Transcription échouée.')
        }
      }
    } finally {
      processingRef.current = false
      setPendingCount(0)
    }
  }, [dispatch, onError])

  const enqueue = useCallback((kind, blob, target) => {
    // enregistrement vide (trop court / micro refusé) → on libère quand même le « en cours »
    if (!blob) { const { fill, ...coords } = target; dispatch({ type: fill, ...coords, text: '' }); return }
    queueRef.current.push({ kind, blob, target })
    process()
  }, [process, dispatch])

  return { index, enqueue, pendingCount, startRec: start, stopRec: stop }
}
