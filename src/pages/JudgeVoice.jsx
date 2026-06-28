import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import SEO from '../components/SEO'
import Icon from '../components/Icon'
import { buildIndex, matchSegment } from '../lib/voiceMatch'
import { loadWhisper, transcribe, blobToMono16k, isWhisperLoaded } from '../lib/whisperStt'
import { addSample, updateLabel, countSamples, countsBySlug, deleteSample, clearSamples, exportZip } from '../lib/voiceDataset'
import styles from './JudgeVoice.module.css'

// ─────────────────────────────────────────────────────────────────────────────
// Saisie de run à la VOIX (outil juge) — route NON listée dans la Navbar, chunk
// lazy isolé. Deux moteurs STT :
//   • « browser » : Web Speech API (natif, AUCUN asset) mais ONLINE + Chrome-only
//     (échoue en `network` sur Brave/Arc). Palier 1.
//   • « local »   : Whisper via transformers.js — HORS-LIGNE, tous navigateurs.
//     Modèle chargé au runtime (dynamic import + poids CDN), jamais précaché. Palier 2.
// Chaque utterance → un SEGMENT → matché en local (voiceMatch + aliases) → chip.
// Strings FR (langue des juges), pas d'i18n.
// ─────────────────────────────────────────────────────────────────────────────

const SpeechRecognition =
  typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition)
const micSupported =
  typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia
const browserSttSupported = !!SpeechRecognition && micSupported

const CACHE_KEY = 'wakeref_voice_figures'
const RAW = '__raw__', SKIP = '__skip__'

const ERRORS = {
  network: 'Service de reconnaissance injoignable. La Web Speech API passe par les serveurs Google : utilise Google Chrome « officiel », ou bascule sur le moteur « Local (Whisper) » ci-dessous.',
  'not-allowed': 'Micro refusé. Autorise l\'accès au microphone dans le navigateur.',
  'service-not-allowed': 'Service de reconnaissance non autorisé par ce navigateur. Bascule sur « Local (Whisper) ».',
  'audio-capture': 'Aucun micro détecté. Vérifie le périphérique d\'entrée.',
  'no-speech': 'Rien entendu. Réessaie en parlant plus près du micro.',
}

export default function JudgeVoice() {
  // Moteur par défaut : Web Speech si dispo, sinon Whisper local (cas Brave/Arc).
  const [engine, setEngine] = useState(browserSttSupported ? 'browser' : 'local')
  const [discipline, setDiscipline] = useState('wakeboard')  // filtre le matching
  const [listening, setListening] = useState(false)   // dictée/enregistrement en cours
  const [busy, setBusy] = useState(false)             // transcription Whisper en cours
  const [error, setError] = useState(null)
  const [interim, setInterim] = useState('')
  const [segments, setSegments] = useState([])
  const [choices, setChoices] = useState({})
  // Catalogue : initialisé depuis le cache (offline-first), refreshé en effet.
  const [figures, setFigures] = useState(() => {
    try {
      const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null')
      return Array.isArray(cached) && cached.length ? cached : []
    } catch { return [] }
  })
  const [model, setModel] = useState('base')            // 'base' | 'small' | 'large'
  const [bias, setBias] = useState(false)               // prompt biasing (expérimental)
  const [collect, setCollect] = useState(false)         // collecte (audio,label) → dataset
  const [sampleCount, setSampleCount] = useState(0)
  const [guided, setGuided] = useState(false)           // collecte guidée (label = trick cible)
  const [counts, setCounts] = useState({})              // slug → nb d'échantillons
  const [targetSlug, setTargetSlug] = useState(null)    // trick à enregistrer
  const [lastGuided, setLastGuided] = useState(null)    // feedback du dernier enregistrement
  const [modelState, setModelState] = useState(isWhisperLoaded('base') ? 'ready' : 'idle') // idle|loading|ready|error
  const [modelPct, setModelPct] = useState(0)
  // Changer de modèle : refléter s'il est déjà chargé en cache (sans effet).
  const pickModel = (m) => { setModel(m); setModelState(isWhisperLoaded(m) ? 'ready' : 'idle'); setModelPct(0) }

  const recRef = useRef(null)          // SpeechRecognition (browser)
  const streamRef = useRef(null)       // MediaStream (local)
  const mrRef = useRef(null)           // MediaRecorder (local)
  const chunksRef = useRef([])
  const segId = useRef(0)
  const listeningRef = useRef(false)
  const spaceHeldRef = useRef(false)
  const engineRef = useRef(engine)
  // Refs lues dans le callback MediaRecorder.onstop (évite les closures périmées).
  const collectRef = useRef(collect)
  const disciplineRef = useRef(discipline)
  const indexRef = useRef(null)
  const figBySlugRef = useRef({})
  const guidedRef = useRef(guided)
  const targetSlugRef = useRef(targetSlug)
  const nextTargetRef = useRef(null)   // → nextTarget (appelé depuis le handler clavier)
  const sampleIdBySeg = useRef({})     // segId → id IndexedDB (pour MAJ du label)
  useEffect(() => { listeningRef.current = listening }, [listening])
  useEffect(() => { engineRef.current = engine }, [engine])
  useEffect(() => { collectRef.current = collect }, [collect])
  useEffect(() => { disciplineRef.current = discipline }, [discipline])
  useEffect(() => { guidedRef.current = guided }, [guided])
  useEffect(() => { targetSlugRef.current = targetSlug }, [targetSlug])

  // Compteurs d'échantillons déjà collectés (au montage).
  useEffect(() => {
    countSamples().then(setSampleCount).catch(() => {})
    countsBySlug().then(setCounts).catch(() => {})
  }, [])

  // Refresh du catalogue depuis Supabase (le cache a déjà initialisé l'état).
  useEffect(() => {
    supabase.from('figures_card').select('slug,name,aliases,sport,sports')
      .then(({ data }) => {
        if (!data) return
        setFigures(data)
        try { localStorage.setItem(CACHE_KEY, JSON.stringify(data)) } catch { /* quota */ }
      })
  }, [])

  const index = useMemo(() => buildIndex(figures), [figures])
  useEffect(() => { indexRef.current = index }, [index])
  const figBySlug = useMemo(() => {
    const m = {}; for (const f of figures) m[f.slug] = f; return m
  }, [figures])
  useEffect(() => { figBySlugRef.current = figBySlug }, [figBySlug])

  // Tricks de la discipline, triés du MOINS couvert au plus couvert (collecte guidée).
  const targets = useMemo(() =>
    figures
      .filter(f => (f.sports || [f.sport]).includes(discipline))
      .sort((a, b) => (counts[a.slug] || 0) - (counts[b.slug] || 0) || a.name.localeCompare(b.name)),
    [figures, discipline, counts])
  const target = figBySlug[targetSlug] || null
  const coveredCount = targets.filter(f => counts[f.slug]).length
  const matchesBySeg = useMemo(() => {
    const m = {}
    for (const s of segments) m[s.id] = matchSegment(index, s.text, { limit: 4, sports: [discipline] })
    return m
  }, [segments, index, discipline])

  const pushSegment = (text) => {
    const t = (text || '').trim()
    if (t) setSegments(prev => [...prev, { id: segId.current++, text: t }])
  }

  // ── Moteur navigateur (Web Speech API) ──
  const startBrowser = useCallback(() => {
    if (listeningRef.current) return
    setError(null)
    const rec = new SpeechRecognition()
    rec.lang = 'fr-FR'
    rec.continuous = true
    rec.interimResults = true
    rec.onresult = (e) => {
      let itm = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i]
        if (r.isFinal) pushSegment(r[0].transcript)
        else itm += r[0].transcript
      }
      setInterim(itm)
    }
    rec.onerror = (e) => setError(ERRORS[e.error] || `Erreur de reconnaissance : ${e.error}`)
    rec.onend = () => { setListening(false); setInterim('') }
    recRef.current = rec
    rec.start()
    setListening(true)
  }, [])
  const stopBrowser = useCallback(() => recRef.current?.stop(), [])

  // ── Moteur local (Whisper) : enregistre puis transcrit au relâchement ──
  const startLocal = useCallback(async () => {
    if (listeningRef.current) return
    setError(null)
    try {
      if (!streamRef.current) streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch { setError(ERRORS['not-allowed']); return }
    chunksRef.current = []
    const mr = new MediaRecorder(streamRef.current)
    mr.ondataavailable = (e) => { if (e.data.size) chunksRef.current.push(e.data) }
    mr.onstop = async () => {
      setListening(false)
      const blob = new Blob(chunksRef.current, { type: mr.mimeType })
      if (!blob.size) return
      // Collecte GUIDÉE : le label est la cible affichée → on enregistre direct,
      // SANS transcription (rapide, pas besoin du modèle, contourne le bug du large).
      if (guidedRef.current && targetSlugRef.current) {
        const fig = figBySlugRef.current[targetSlugRef.current]
        addSample({
          blob, mime: mr.mimeType, sttText: '',
          labelSlug: fig?.slug || null, labelName: fig?.name || null,
          discipline: disciplineRef.current, model: 'guided',
        }).then((dbId) => {
          setSampleCount(c => c + 1)
          setCounts(c => ({ ...c, [fig.slug]: (c[fig.slug] || 0) + 1 }))
          setLastGuided({ name: fig?.name, id: dbId, slug: fig.slug })
        }).catch(() => {})
        return
      }
      setBusy(true)
      try {
        const float = await blobToMono16k(blob)
        const text = (await transcribe(float, { language: 'french', model, bias })).trim()
        setModelState('ready')
        if (!text) return
        const id = segId.current++
        setSegments(prev => [...prev, { id, text }])
        // Collecte dataset : on stocke (audio brut, label = meilleur match courant).
        if (collectRef.current) {
          const top = matchSegment(indexRef.current || [], text, { limit: 1, sports: [disciplineRef.current] })[0]
          addSample({
            blob, mime: mr.mimeType, sttText: text,
            labelSlug: top?.fig.slug || null, labelName: top?.fig.name || null,
            discipline: disciplineRef.current, model,
          }).then((dbId) => { sampleIdBySeg.current[id] = dbId; setSampleCount(c => c + 1) }).catch(() => {})
        }
      } catch (e) {
        setError('Transcription échouée : ' + (e?.message || e))
      } finally { setBusy(false) }
    }
    mrRef.current = mr
    mr.start()
    setListening(true)
  }, [model, bias])
  const stopLocal = useCallback(() => {
    if (mrRef.current?.state === 'recording') mrRef.current.stop()
  }, [])

  // ── Dispatch unifié (utilisé par le bouton ET le push-to-talk) ──
  const start = useCallback(() => {
    engineRef.current === 'local' ? startLocal() : startBrowser()
  }, [startLocal, startBrowser])
  const stop = useCallback(() => {
    engineRef.current === 'local' ? stopLocal() : stopBrowser()
  }, [stopLocal, stopBrowser])

  // Nettoyage au démontage : coupe moteur + micro.
  useEffect(() => () => {
    recRef.current?.stop()
    if (mrRef.current?.state === 'recording') mrRef.current.stop()
    streamRef.current?.getTracks().forEach(t => t.stop())
  }, [])

  // Push-to-talk : maintenir Espace dicte, relâcher arrête. Ignoré sur les champs.
  useEffect(() => {
    const isField = (el) =>
      el && (/^(INPUT|SELECT|TEXTAREA|BUTTON)$/.test(el.tagName) || el.isContentEditable)
    const onDown = (e) => {
      if (e.repeat || e.metaKey || e.ctrlKey || e.altKey || isField(e.target)) return
      // Flèche droite (mode guidé) : trick suivant. Ignorée pendant l'enregistrement.
      if (e.code === 'ArrowRight' && guidedRef.current && !listeningRef.current) {
        e.preventDefault(); nextTargetRef.current?.(); return
      }
      if (e.code !== 'Space' || busy) return
      e.preventDefault()
      if (!spaceHeldRef.current) { spaceHeldRef.current = true; start() }
    }
    const onUp = (e) => {
      if (e.code !== 'Space') return
      if (spaceHeldRef.current) { spaceHeldRef.current = false; stop() }
    }
    const onBlur = () => { if (spaceHeldRef.current) { spaceHeldRef.current = false; stop() } }
    window.addEventListener('keydown', onDown)
    window.addEventListener('keyup', onUp)
    window.addEventListener('blur', onBlur)
    return () => {
      window.removeEventListener('keydown', onDown)
      window.removeEventListener('keyup', onUp)
      window.removeEventListener('blur', onBlur)
    }
  }, [start, stop, busy])

  const preloadModel = async () => {
    setError(null)
    setModelState('loading')
    setModelPct(0)
    try {
      await loadWhisper(model, (p) => {
        if (p.status === 'progress' && typeof p.progress === 'number') setModelPct(Math.round(p.progress))
      })
      setModelState('ready')
    } catch (e) {
      setModelState('error')
      setError('Chargement du modèle échoué : ' + (e?.message || e))
    }
  }

  const reset = () => { setSegments([]); setChoices({}); setInterim('') }
  const removeSeg = (id) => {
    setSegments(prev => prev.filter(s => s.id !== id))
    setChoices(prev => { const n = { ...prev }; delete n[id]; return n })
  }
  const setChoice = (id, val) => {
    setChoices(prev => ({ ...prev, [id]: val }))
    // Recaler le label du sample collecté sur la correction du juge (vérité terrain).
    const dbId = sampleIdBySeg.current[id]
    if (dbId != null) {
      const fig = (val !== RAW && val !== SKIP) ? figBySlug[val] : null
      updateLabel(dbId, { labelSlug: fig?.slug || null, labelName: fig?.name || null }).catch(() => {})
    }
  }
  const chosenSlug = (seg) => choices[seg.id] ?? (matchesBySeg[seg.id]?.[0]?.fig.slug ?? RAW)

  const resolved = segments
    .map(s => ({ seg: s, slug: chosenSlug(s) }))
    .filter(x => x.slug !== RAW && x.slug !== SKIP)
    .map(x => figBySlug[x.slug]).filter(Boolean)

  const canCapture = engine === 'browser' ? browserSttSupported : micSupported

  // Export du log de session (pour me transmettre les erreurs de transcription).
  const copyLog = async () => {
    const lines = [
      `# Log saisie vocale WakeRef`,
      `moteur: ${engine}${engine === 'local' ? ` · whisper-${model}${bias ? ' · biais' : ''}` : ''} · discipline ${discipline}`,
      `date: ${new Date().toISOString()}`,
      '',
    ]
    segments.forEach((s, i) => {
      const cands = (matchesBySeg[s.id] || []).map(c => `${c.fig.name} (${c.score.toFixed(2)})`).join(', ')
      const sel = chosenSlug(s)
      const chosen = sel === RAW ? '[texte brut]' : sel === SKIP ? '[ignoré]' : (figBySlug[sel]?.name || sel)
      lines.push(`${i + 1}. dicté STT : « ${s.text} »`)
      lines.push(`   propositions : ${cands || '(aucune)'}`)
      lines.push(`   retenu : ${chosen}`)
      lines.push(`   ATTENDU : ____`)   // à compléter par le juge avant envoi
      lines.push('')
    })
    try {
      await navigator.clipboard.writeText(lines.join('\n'))
      setError(null)
    } catch {
      setError('Copie impossible — copie le texte depuis la console.')
      console.log(lines.join('\n'))
    }
  }

  // Dataset d'entraînement : export .zip (audiofolder) + vidage.
  const exportDataset = async () => {
    try {
      const zip = await exportZip()
      if (!zip) return
      const url = URL.createObjectURL(zip)
      const a = document.createElement('a')
      a.href = url
      a.download = `wakeref-voix-dataset-${new Date().toISOString().slice(0, 10)}.zip`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) { setError('Export échoué : ' + (e?.message || e)) }
  }
  const clearDataset = async () => {
    if (!confirm(`Supprimer les ${sampleCount} échantillons collectés ?`)) return
    await clearSamples().catch(() => {})
    sampleIdBySeg.current = {}
    setSampleCount(0)
    setCounts({})
  }

  // Mode guidé : implique la collecte. On démarre sur le trick le moins couvert.
  const toggleGuided = (on) => {
    setGuided(on)
    setLastGuided(null)
    if (on) { setCollect(true); setTargetSlug(targets[0]?.slug || null) }
  }
  // Trick suivant : le moins couvert qui n'est pas la cible courante.
  const nextTarget = () => {
    const next = targets.find(f => f.slug !== targetSlug) || targets[0]
    setTargetSlug(next?.slug || null)
    setLastGuided(null)
  }
  // Ref toujours à jour pour le handler clavier (flèche droite).
  useEffect(() => { nextTargetRef.current = nextTarget })
  // Annuler le dernier enregistrement guidé (clip raté : bruit, voix parasite…).
  const cancelLast = async () => {
    if (lastGuided?.id == null) return
    await deleteSample(lastGuided.id).catch(() => {})
    setSampleCount(c => Math.max(0, c - 1))
    setCounts(c => ({ ...c, [lastGuided.slug]: Math.max(0, (c[lastGuided.slug] || 1) - 1) }))
    setLastGuided(null)
  }

  return (
    <div className={styles.page}>
      <SEO titleFr="Saisie vocale" noindex path="/judge/voix" />

      <header className={styles.header}>
        <span className={styles.badge}>Outil juge · prototype</span>
        <h1 className={styles.title}>Saisie de run à la voix</h1>
        <p className={styles.lede}>
          Dicte le run, un trick à la fois (pause entre chaque). Chaque segment est
          rapproché du référentiel ; valide ou corrige les propositions.
        </p>
      </header>

      {/* Discipline (filtre le matching ; lève les collisions seated/standing) */}
      <div className={styles.discipline}>
        <label htmlFor="jv-discipline">Discipline</label>
        <select id="jv-discipline" className="input" value={discipline}
          onChange={e => setDiscipline(e.target.value)} disabled={listening || busy}>
          <option value="wakeboard">Wakeboard</option>
          <option value="wakeskate">Wakeskate</option>
          <option value="seated">Wakeboard assis</option>
        </select>
      </div>

      {/* Sélecteur de moteur STT */}
      <div className={styles.engine} role="radiogroup" aria-label="Moteur de reconnaissance">
        <button
          type="button" role="radio" aria-checked={engine === 'browser'}
          className={`${styles.engineBtn} ${engine === 'browser' ? styles.engineOn : ''}`}
          onClick={() => setEngine('browser')} disabled={listening || busy || !browserSttSupported}
        >
          Navigateur <small>en ligne · Chrome</small>
        </button>
        <button
          type="button" role="radio" aria-checked={engine === 'local'}
          className={`${styles.engineBtn} ${engine === 'local' ? styles.engineOn : ''}`}
          onClick={() => setEngine('local')} disabled={listening || busy}
        >
          Local (Whisper) <small>hors-ligne · tous navigateurs</small>
        </button>
      </div>

      {/* Modèle Whisper (mode local) : choix base/small/large + biais + préchargement */}
      {engine === 'local' && (
        <div className={styles.model}>
          <div className={styles.modelPick}>
            {[['wakeref', 'maison ✨'], ['base', 'léger'], ['small', '+qualité'], ['large', 'turbo · lourd']].map(([m, tag]) => (
              <button
                key={m} type="button"
                className={`${styles.modelBtn} ${model === m ? styles.modelOn : ''}`}
                onClick={() => pickModel(m)} disabled={listening || busy}
              >
                whisper-{m} · {tag}
              </button>
            ))}
          </div>
          <label className={styles.bias} title="Amorce le décodeur avec le vocabulaire wake (expérimental)">
            <input type="checkbox" checked={bias} onChange={e => setBias(e.target.checked)} disabled={listening || busy} />
            biais vocab <small>(exp.)</small>
          </label>
          {modelState === 'loading' ? (
            <span>Téléchargement… {modelPct}%</span>
          ) : modelState === 'ready' ? (
            <span className={styles.modelReady}>modèle prêt ✓</span>
          ) : (
            <button type="button" className="btn btn-ghost btn-sm" onClick={preloadModel}>
              Précharger
            </button>
          )}
        </div>
      )}

      {/* Collecte de dataset (local) : audio + label, stocké en IndexedDB, exporté
          en .zip audiofolder pour entraîner plus tard un modèle léger spécialisé. */}
      {engine === 'local' && (
        <div className={styles.model}>
          <label className={styles.bias} title="Enregistre chaque clip + le trick confirmé, en local, pour l'entraînement">
            <input type="checkbox" checked={collect} onChange={e => setCollect(e.target.checked)} disabled={guided} />
            collecter
          </label>
          <label className={styles.bias} title="Parcourt les tricks du moins au plus couvert ; le label = le trick affiché (pas besoin du modèle)">
            <input type="checkbox" checked={guided} onChange={e => toggleGuided(e.target.checked)} />
            mode guidé
          </label>
          <span className={styles.count}>{sampleCount} clip{sampleCount > 1 ? 's' : ''}</span>
          {sampleCount > 0 && (
            <>
              <button type="button" className="btn btn-ghost btn-sm" onClick={exportDataset}>Exporter (.zip)</button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={clearDataset}>Vider</button>
            </>
          )}
        </div>
      )}

      {!canCapture && engine === 'browser' && (
        <div className={styles.guard} role="alert">
          <Icon name="alert-triangle" size={18} />
          <span>Ce navigateur ne fournit pas la Web Speech API. Bascule sur « Local (Whisper) ».</span>
        </div>
      )}
      {error && (
        <div className={styles.guard} role="alert">
          <Icon name="alert-triangle" size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Collecte guidée : on enregistre le trick AFFICHÉ (label connu) */}
      {guided && (
        <div className={styles.guided}>
          <div className={styles.guidedHead}>
            <span className={styles.count}>{coveredCount}/{targets.length} tricks couverts</span>
            <button type="button" className="btn btn-ghost btn-sm" onClick={nextTarget} disabled={listening}>
              Trick suivant <kbd>→</kbd>
            </button>
          </div>
          {target ? (
            <>
              <p className={styles.guidedLabel}>
                Dis : <strong>{target.name}</strong>
                <span className={styles.guidedN}>{counts[target.slug] || 0} pris</span>
              </p>
              {target.aliases?.length > 0 && (
                <p className={styles.guidedHint}>
                  varie : {target.aliases.slice(0, 5).map(a => `« ${a} »`).join(', ')}…
                </p>
              )}
              {lastGuided && (
                <p className={styles.guidedOk}>
                  ✓ enregistré
                  <button type="button" className={styles.undo} onClick={cancelLast}>↩ annuler le dernier</button>
                </p>
              )}
            </>
          ) : (
            <p className={styles.placeholder}>Tous les tricks de la discipline sont couverts 🎉</p>
          )}
          {targets.some(f => !counts[f.slug]) && (
            <details className={styles.missing}>
              <summary>{targets.filter(f => !counts[f.slug]).length} jamais enregistrés</summary>
              {targets.filter(f => !counts[f.slug]).map(f => f.name).join(' · ')}
            </details>
          )}
        </div>
      )}

      <div className={styles.controls}>
        <button
          type="button"
          className={`btn ${listening ? 'btn-danger' : 'btn-primary'} ${styles.micBtn}`}
          onClick={listening ? stop : start}
          disabled={!canCapture || busy || (guided && !target)}
          aria-pressed={listening}
        >
          <Icon name={listening ? 'player-stop' : 'mic'} size={18} />
          {busy ? 'Transcription…' : listening ? 'Arrêter' : guided ? 'Enregistrer' : 'Dicter'}
        </button>
        {canCapture && <span className={styles.ptt}>ou maintiens <kbd>Espace</kbd></span>}
        {listening && <span className={styles.rec} aria-hidden="true" />}
        {!guided && segments.length > 0 && !listening && !busy && (
          <>
            <button type="button" className="btn btn-ghost" onClick={copyLog}>Copier le log</button>
            <button type="button" className="btn btn-ghost" onClick={reset}>Effacer</button>
          </>
        )}
        {!guided && (
          <span className={styles.count}>
            {figures.length ? `${figures.length} figures` : 'chargement…'}
          </span>
        )}
      </div>

      {interim && !guided && <p className={styles.interim}>{interim}…</p>}

      {guided ? null : segments.length === 0 ? (
        <div className={styles.transcript}>
          <p className={styles.placeholder}>Les tricks reconnus apparaîtront ici, un par segment dicté…</p>
        </div>
      ) : (
        <ol className={styles.segments}>
          {segments.map(seg => {
            const cands = matchesBySeg[seg.id] || []
            const sel = chosenSlug(seg)
            const matched = sel !== RAW && sel !== SKIP
            return (
              <li key={seg.id} className={`${styles.seg} ${matched ? '' : styles.segUnmatched}`}>
                <div className={styles.segMain}>
                  <select className={styles.chipSelect} value={sel} onChange={e => setChoice(seg.id, e.target.value)}>
                    {cands.map(c => (
                      <option key={c.fig.slug} value={c.fig.slug}>
                        {c.fig.name}{c.score < 0.6 ? ' ?' : ''}
                      </option>
                    ))}
                    <option value={RAW}>— texte brut —</option>
                    <option value={SKIP}>— ignorer —</option>
                  </select>
                  <span className={styles.segRaw}>« {seg.text} »</span>
                </div>
                <button type="button" className={styles.segDel} onClick={() => removeSeg(seg.id)} aria-label="Retirer">
                  <Icon name="x" size={15} />
                </button>
              </li>
            )
          })}
        </ol>
      )}

      {resolved.length > 0 && (
        <div className={styles.summary}>
          <strong>{resolved.length}</strong> trick{resolved.length > 1 ? 's' : ''} retenu{resolved.length > 1 ? 's' : ''} :
          {' '}{resolved.map(f => f.name).join(' · ')}
        </div>
      )}

      {/* TODO : bouton « Composer le run » → injecter `resolved` dans RunSaisie /
          la grille Compo. Affiner : segment multi-tricks, filtre discipline. */}
    </div>
  )
}
