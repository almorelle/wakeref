import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useT } from '../i18n/useT'
import { useToast } from '../hooks/useToast'
import ToastContainer from '../components/Toast'
import SEO from '../components/SEO'
import RunSaisie from '../components/RunSaisie'
import { diffRuns } from '../lib/judgeDiff'
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

  // Charge le catalogue dès qu'un niveau ET une discipline sont choisis.
  // (Tout le setState est dans l'IIFE async pour rester hors du corps de l'effet.)
  useEffect(() => {
    if (!discipline || !difficulty) return
    let cancelled = false
    ;(async () => {
      setLoadingRuns(true)
      const { data, error } = await supabase.rpc('list_judge_runs', {
        p_discipline: discipline,
        p_difficulty: difficulty,
      })
      if (cancelled) return
      if (error) { toast(jt.loadError, 'error'); setRuns([]); setLoadingRuns(false); return }
      setRuns(data || [])
      setLoadingRuns(false)
    })()
    return () => { cancelled = true }
  }, [discipline, difficulty, jt.loadError, toast])

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

  const renderCell = (item, emptyText) => {
    if (!item) return <span className={styles.gap}>{emptyText}</span>
    if (item.type === 'jib') {
      const p = item.data
      return (
        <div className={styles.cell}>
          <span className={styles.cellName}>{tr.compoJibPass}</span>
          <div className={styles.badges}>
            {p.side && <span className={styles.badge}>{sideLabel(p.side)}</span>}
            {p.approach && <span className={styles.badge}>{appLabel(p.approach)}</span>}
          </div>
        </div>
      )
    }
    const e = item.data
    return (
      <div className={styles.cell}>
        <span className={styles.cellName}>{e.name}</span>
        <div className={styles.badges}>
          {e.side && <span className={styles.badge}>{sideLabel(e.side)}</span>}
          {(e.approach || []).map(a => <span key={a} className={styles.badge}>{appLabel(a)}</span>)}
          {(e.rotation || []).map(r => <span key={r} className={styles.badge}>{r.toUpperCase()}</span>)}
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
                  onClick={() => setDifficulty(d)}>{jt[d]}</button>
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
                  onClick={() => setDiscipline(d)}>{jt.disc[d]}</button>
              ))}
            </div>
          </div>

          {discipline && difficulty && (
            <div className={styles.runs}>
              <span className={styles.axisLabel}>{jt.pickRun}</span>
              {loadingRuns && <span className="spinner" />}
              {!loadingRuns && runs.length === 0 && <p className={styles.empty}>{jt.noRuns}</p>}
              {!loadingRuns && runs.map(r => (
                <button key={r.id} className={styles.runCard} onClick={() => pickRun(r)}>
                  <span className={styles.runName}>{r.name}</span>
                  <span className={styles.runMeta}>{jt.disc[r.discipline] || r.discipline}</span>
                </button>
              ))}
            </div>
          )}
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
              {diff.tally.missing > 0 && <span className={styles.tMissing}>– {diff.tally.missing} {jt.tally.missing}</span>}
              {diff.tally.attr > 0 && <span className={styles.tAttr}>! {diff.tally.attr} {jt.tally.attr}</span>}
              {diff.tally.order > 0 && <span className={styles.tOrder}>⇄ {diff.tally.order} {jt.tally.order}</span>}
              {diff.tally.extra > 0 && <span className={styles.tExtra}>+ {diff.tally.extra} {jt.tally.extra}</span>}
            </div>

            <div className={styles.legend}>
              <span><i style={{ background: 'var(--c-success)' }} />{jt.legend.correct}</span>
              <span><i style={{ background: 'var(--c-danger)' }} />{jt.legend.missing}</span>
              <span><i style={{ background: 'var(--c-ws)' }} />{jt.legend.attr}</span>
              <span><i style={{ background: 'var(--c-accent2)' }} />{jt.legend.order}</span>
              <span><i style={{ background: 'var(--c-faint)' }} />{jt.legend.extra}</span>
            </div>

            <div className={styles.diff}>
              <div className={styles.diffHead}>
                <span>#</span><span>{jt.yourSaisie}</span><span>{jt.solution}</span>
              </div>
              {diff.rows.map((row, i) => (
                <div key={i} className={`${styles.diffRow} ${styles['r_' + row.state]}`}>
                  <span className={styles.pos}>{row.position}</span>
                  {renderCell(row.judge, jt.nothing)}
                  {renderCell(row.ref, jt.absent)}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
