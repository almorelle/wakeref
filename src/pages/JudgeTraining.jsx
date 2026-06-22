import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useT } from '../i18n/useT'
import { useToast } from '../hooks/useToast'
import ToastContainer from '../components/Toast'
import SEO from '../components/SEO'
import RunSaisie from '../components/RunSaisie'
import Icon from '../components/Icon'
import { diffRuns } from '../lib/judgeDiff'
import { WS_JIB_TRICKS, jibFigureLabel } from '../lib/compoGrids'
import styles from './JudgeTraining.module.css'

const EMPTY_RUN = { entries: [], jibPasses: [], otherEntries: [] }

const DISCIPLINES = ['wakeboard', 'wakeskate', 'seated']
const DIFFICULTIES = ['easy', 'medium', 'hard']

const DISCIPLINE_COLOR = {
  wakeboard: 'var(--c-wake)',
  wakeskate: 'var(--c-ws)',
  seated:    'var(--c-seated)',
}

// Source vidéo : fichier Storage (upload) ou URL externe.
const videoSrc = (r) =>
  r?.source_type === 'upload' && r?.video_path
    ? supabase.storage.from('videos').getPublicUrl(r.video_path).data.publicUrl
    : (r?.video_url || null)

export default function JudgeTraining() {
  const tr = useT()
  const { toasts, toast } = useToast()

  const [phase, setPhase]           = useState('select') // select | judge | correct
  const [discipline, setDiscipline] = useState(null)
  const [difficulty, setDifficulty] = useState(null)
  const [runs, setRuns]             = useState([])
  const [loadingRuns, setLoadingRuns] = useState(false)
  const [selectedRun, setSelectedRun] = useState(null)
  const [run, setRun]               = useState(EMPTY_RUN)
  const [evaluating, setEvaluating] = useState(false)
  const [diff, setDiff]             = useState(null)

  const jt = tr.judge

  // Charge tout le catalogue publié au montage. Les filtres niveau/discipline
  // sont optionnels et s'appliquent côté client (liste courte).
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoadingRuns(true)
      const { data, error } = await supabase.rpc('list_judge_runs', {})
      if (cancelled) return
      if (error) { toast(jt.loadError, 'error'); setRuns([]); setLoadingRuns(false); return }
      setRuns(data || [])
      setLoadingRuns(false)
    })()
    return () => { cancelled = true }
  }, [jt.loadError, toast])

  // Toggle des filtres : reclic = désélection (retour à « tout »).
  const toggleDifficulty = (d) => setDifficulty(prev => prev === d ? null : d)
  const toggleDiscipline = (d) => setDiscipline(prev => prev === d ? null : d)

  // Runs filtrés puis groupés par discipline (entêtes), dans l'ordre canonique.
  const filteredRuns = runs.filter(r =>
    (!discipline || r.discipline === discipline) &&
    (!difficulty || r.difficulty === difficulty)
  )
  // Tri intra-groupe : du plus facile au plus dur (ordre de DIFFICULTIES).
  const diffRank = (d) => { const i = DIFFICULTIES.indexOf(d); return i < 0 ? 99 : i }
  const runGroups = DISCIPLINES
    .map(d => ({
      discipline: d,
      items: filteredRuns
        .filter(r => r.discipline === d)
        .sort((a, b) => diffRank(a.difficulty) - diffRank(b.difficulty)),
    }))
    .filter(g => g.items.length)

  const pickRun = (r) => {
    setSelectedRun(r)
    setRun(EMPTY_RUN)
    setDiff(null)
    setPhase('judge')
  }

  const itemCount = run.entries.length + run.jibPasses.length + run.otherEntries.length

  const evaluate = async () => {
    if (!selectedRun) return
    setEvaluating(true)
    const { data, error } = await supabase
      .rpc('get_judge_run_solution', { p_id: selectedRun.id })
      .single()
    setEvaluating(false)
    if (error || !data) { toast(jt.loadError, 'error'); return }
    const sol = data.solution || {}
    const reference = {
      entries: sol.entries || [],
      jibPasses: sol.jibPasses || [],
      otherEntries: sol.otherEntries || [],
    }
    setDiff(diffRuns(run, reference))
    setPhase('correct')
  }

  const restart = () => {
    setPhase('select')
    setSelectedRun(null)
    setRun(EMPTY_RUN)
    setDiff(null)
  }

  const discColor = selectedRun ? DISCIPLINE_COLOR[selectedRun.discipline] : 'var(--c-accent)'
  const src = videoSrc(selectedRun)

  // ── Rendu d'un élément (figure / jib) dans le diff ──
  const sideLabel = (s) => s === 'left' ? tr.compoLeft : tr.compoRight
  const appLabel  = (a) => ({ ts: tr.compoToeside, hs: tr.compoHeelside, regular: tr.compoRegular, fakie: tr.compoFakie }[a] || a)
  const trickLabel = (id) => WS_JIB_TRICKS.find(x => x.id === id)?.label || id

  // Décompose un item en badges identifiés par un `token` stable : permet de
  // surligner exactement les attributs qui diffèrent de l'item en face.
  const itemBadges = (item) => {
    if (!item) return []
    const out = []
    if (item.type === 'jib') {
      const p = item.data
      if (p.side)     out.push({ token: 'side:' + p.side,         label: sideLabel(p.side) })
      if (p.approach) out.push({ token: 'app:' + p.approach,      label: appLabel(p.approach) })
      if (p.entryRotation) out.push({ token: 'erot:' + p.entryRotation, label: p.entryRotation.toUpperCase() + ' in' })
      ;(p.entryTricks || []).forEach(id => out.push({ token: 'etrick:' + id, label: trickLabel(id) + ' in' }))
      ;(p.figures || []).forEach(f => out.push({ token: 'fig:' + f, label: jibFigureLabel(f, tr) }))
      if (p.exitRotation) out.push({ token: 'xrot:' + p.exitRotation, label: p.exitRotation.toUpperCase() + ' out' })
      ;(p.exitTricks || []).forEach(id => out.push({ token: 'xtrick:' + id, label: trickLabel(id) + ' out' }))
      return out
    }
    const e = item.data
    if (e.side) out.push({ token: 'side:' + e.side, label: sideLabel(e.side) })
    ;(e.approach || []).forEach(a => out.push({ token: 'app:' + a, label: appLabel(a) }))
    ;(e.rotation || []).forEach(r => out.push({ token: 'rot:' + r, label: r.toUpperCase() }))
    return out
  }

  const itemName = (item) => item.type === 'jib' ? tr.compoJibPass : item.data.name

  // `partner` = l'item en face (autre colonne) ou null. Si présent, on surligne
  // le nom quand le trick diffère et les badges absents en face : la différence
  // exacte (ex. « transfert » oublié) saute aux yeux.
  const renderCell = (item, partner, emptyText) => {
    if (!item) return <span className={styles.gap}>{emptyText}</span>
    const badges = itemBadges(item)
    const partnerTokens = partner ? new Set(itemBadges(partner).map(b => b.token)) : null
    const nameDiff = partner && item.type !== 'other' && itemName(partner) !== itemName(item)
    return (
      <div className={styles.cell}>
        <span className={`${styles.cellName} ${nameDiff ? styles.nameDiff : ''}`}>{itemName(item)}</span>
        <div className={styles.badges}>
          {badges.map(b => (
            <span key={b.token}
              className={`${styles.badge} ${partnerTokens && !partnerTokens.has(b.token) ? styles.badgeDiff : ''}`}>
              {b.label}
            </span>
          ))}
        </div>
      </div>
    )
  }

  const videoPane = (
    <div className={styles.video}>
      {src
        ? <video className={styles.videoEl} src={src} controls playsInline preload="metadata" />
        : <div className={styles.videoMissing}>{jt.videoUnavailable}</div>}
    </div>
  )

  return (
    <div className={styles.page}>
      <SEO
        titleFr="Entraînement juge"
        titleEn="Judge training"
        descriptionFr="Entraîne-toi à juger un run : saisis les tricks vus en vidéo et compare à la solution."
        descriptionEn="Train your judging eye: enter the tricks you see on video and compare to the solution."
        path="/judge"
      />
      <ToastContainer toasts={toasts} />

      {/* ── Phase sélection ── */}
      {phase === 'select' && (
        <div className={styles.select}>
          <h1 className={styles.title}>{jt.title}</h1>
          <p className={styles.intro}>{jt.intro}</p>

          <div className={styles.axis}>
            <span className={styles.axisLabel}>{jt.difficulty}</span>
            <div className={styles.chips}>
              {DIFFICULTIES.map(d => (
                <button key={d}
                  className={`${styles.chip} ${difficulty === d ? styles.chipOn : ''}`}
                  onClick={() => toggleDifficulty(d)}>{jt[d]}</button>
              ))}
            </div>
          </div>

          <div className={styles.axis}>
            <span className={styles.axisLabel}>{jt.discipline}</span>
            <div className={styles.chips}>
              {DISCIPLINES.map(d => (
                <button key={d}
                  className={`${styles.chip} ${discipline === d ? styles.chipOn : ''}`}
                  style={{ '--disc': DISCIPLINE_COLOR[d] }}
                  onClick={() => toggleDiscipline(d)}>{jt.disc[d]}</button>
              ))}
            </div>
          </div>

          <div className={styles.runs}>
            {loadingRuns && <span className="spinner" />}
            {!loadingRuns && runGroups.length === 0 && <p className={styles.empty}>{jt.noRuns}</p>}
            {!loadingRuns && runGroups.map(g => (
              <div key={g.discipline} className={styles.runGroup}>
                <span className={styles.groupHead} style={{ '--disc': DISCIPLINE_COLOR[g.discipline] }}>
                  {jt.disc[g.discipline] || g.discipline}
                </span>
                {g.items.map(r => (
                  <button key={r.id} className={styles.runCard} onClick={() => pickRun(r)}>
                    <span className={styles.runName}>{r.name}</span>
                    <span className={styles.runRight}>
                      <span className={styles.runMeta}>{jt[r.difficulty]}{r.category ? ` · ${r.category}` : ''}</span>
                      <Icon name="chevron-right" size={18} className={styles.runChevron} />
                    </span>
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Phase jugement ── */}
      {phase === 'judge' && selectedRun && (
        <div className={styles.layout} style={{ '--disc': discColor }}>
          <div className={styles.left}>
            <button className="btn btn-ghost btn-sm" onClick={restart}>{jt.back}</button>
            {videoPane}
          </div>
          <div className={styles.right}>
            <h2 className={styles.paneTitle}>{selectedRun.name}</h2>
            <RunSaisie
              key={selectedRun.id}
              gridKey={selectedRun.grid_key}
              value={run}
              onChange={setRun}
              toast={toast}
            />
            <div className={styles.evalBar}>
              <button className="btn btn-primary" disabled={itemCount === 0 || evaluating} onClick={evaluate}>
                {evaluating ? <span className="spinner" /> : jt.evaluate}
              </button>
              <small className={styles.evalHint}>{jt.evaluateHint}</small>
            </div>
          </div>
        </div>
      )}

      {/* ── Phase correction ── */}
      {phase === 'correct' && diff && (
        <div className={styles.layout} style={{ '--disc': discColor }}>
          <div className={styles.left}>
            {videoPane}
          </div>
          <div className={styles.right}>
            <div className={styles.correctionHead}>
              <h2 className={styles.paneTitle}>{jt.correction}</h2>
              <button className="btn btn-primary btn-sm" onClick={restart}>{jt.restart}</button>
            </div>

            <div className={styles.tally}>
              <span className={styles.tCorrect}>✓ {diff.tally.correct} {jt.tally.correct}</span>
              {diff.tally.incorrect > 0 && <span className={styles.tIncorrect}>✗ {diff.tally.incorrect} {jt.tally.incorrect}</span>}
              {diff.tally.missing > 0 && <span className={styles.tMissing}>– {diff.tally.missing} {jt.tally.missing}</span>}
              {diff.tally.extra > 0 && <span className={styles.tExtra}>+ {diff.tally.extra} {jt.tally.extra}</span>}
            </div>

            <div className={styles.legend}>
              <span><i style={{ background: 'var(--c-success)' }} />{jt.legend.correct}</span>
              <span><i style={{ background: 'var(--c-danger)' }} />{jt.legend.incorrect}</span>
              <span><i style={{ background: 'var(--c-danger)' }} />{jt.legend.missing}</span>
              <span><i style={{ background: 'var(--c-faint)' }} />{jt.legend.extra}</span>
            </div>

            <div className={styles.diff}>
              <div className={styles.diffHead}>
                <span>#</span><span>{jt.yourSaisie}</span><span>{jt.solution}</span>
              </div>
              {diff.rows.map((row, i) => (
                <div key={i} className={`${styles.diffRow} ${styles['r_' + row.state]}`}>
                  <span className={styles.pos}>{row.position}</span>
                  {renderCell(row.judge, row.ref, jt.nothing)}
                  {renderCell(row.ref, row.judge, jt.absent)}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
