import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { CategoryBadge } from '../components/Badges'
import { useT } from '../i18n/useT'
import { creatorHandle, externalUrl } from '../lib/url'
import styles from './Quiz.module.css'
import SEO from '../components/SEO'
import Icon from '../components/Icon'

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Vidéo « principale » d'une figure = 1re vidéo uploadée (file_path), dans
// l'ordre sort_order renvoyé par figures_full. C'est celle que le quiz montre.
function mainVideo(figure) {
  const vids = typeof figure.videos === 'string' ? JSON.parse(figure.videos) : figure.videos || []
  return vids.find(v => v.file_path) || null
}

// Cible d'équilibrage de l'échantillonnage par session (#24/#25). 0.5 = parité.
const BALANCE_RATIO = 0.6

// Échantillonnage équilibré par session (#25) : on remplit d'abord le groupe
// primaire jusqu'à la cible (BALANCE_RATIO), puis on complète avec le groupe
// secondaire, puis avec les vidéos sans genre renseigné. Best-effort : si un
// pool est trop petit pour la cible, on prend ce qu'on a et on complète. Le
// genre considéré est celui de la vidéo effectivement montrée (mainVideo).
function balancedSample(figures, total) {
  const primary = [], secondary = [], rest = []
  for (const f of figures) {
    const g = mainVideo(f)?.performer_gender
    if (g === 'woman') primary.push(f)
    else if (g === 'man') secondary.push(f)
    else rest.push(f)
  }
  const P = shuffle(primary), S = shuffle(secondary), R = shuffle(rest)
  const out = []
  const quota = Math.round(total * BALANCE_RATIO)
  while (out.length < quota && P.length) out.push(P.pop())
  while (out.length < total && S.length) out.push(S.pop())
  for (const f of [...R, ...P, ...S]) {
    if (out.length >= total) break
    out.push(f)
  }
  return out
}

export default function Quiz() {
  const [allFigures, setAllFigures] = useState([])
  const [questions, setQuestions] = useState([])
  const [idx, setIdx] = useState(0)
  const [score, setScore] = useState(0)
  const [answered, setAnswered] = useState(null)
  const [chosen, setChosen] = useState(null)
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(true)
  const [noVideos, setNoVideos] = useState(false)
  const tr = useT()
  const TOTAL = 10

  useEffect(() => {
    supabase.from('figures_full').select('*').eq('is_switch', false).then(({ data }) => {
      if (data) setAllFigures(data)
      setLoading(false)
    })
  }, [])

  const buildQuiz = useCallback(() => {
    const withVideos = allFigures.filter(f => mainVideo(f)) // upload direct uniquement

    if (withVideos.length === 0) {
      setNoVideos(true)
      return
    }
    setNoVideos(false)

    // Sélection à parité garantie, puis mélange de l'ordre d'apparition.
    const selected = shuffle(balancedSample(withVideos, Math.min(TOTAL, withVideos.length)))
    const selectedIds = new Set(selected.map(f => f.id))

    const qs = selected.map(correct => {
      const sameCat = allFigures.filter(f => !selectedIds.has(f.id) && f.category_slug === correct.category_slug)
      const wrongPool = sameCat.length >= 3 ? sameCat : allFigures.filter(f => !selectedIds.has(f.id))
      const wrongs = shuffle(wrongPool).slice(0, 3)
      return { correct, options: shuffle([correct, ...wrongs]) }
    })
    setQuestions(qs); setIdx(0); setScore(0); setAnswered(null); setChosen(null); setDone(false)
  }, [allFigures])

  // Build the initial quiz once figures are loaded. Deferred a tick so the
  // setState isn't synchronous within the effect (avoids a cascading render).
  useEffect(() => {
    if (!allFigures.length) return
    const t = setTimeout(buildQuiz, 0)
    return () => clearTimeout(t)
  }, [allFigures, buildQuiz])

  const answer = (fig) => {
    if (answered) return
    setChosen(fig.id)
    const correct = fig.id === questions[idx].correct.id
    setAnswered(correct ? 'correct' : 'wrong')
    if (correct) setScore(s => s + 1)
  }

  const next = () => {
    if (idx + 1 >= questions.length) { setDone(true); return }
    setIdx(i => i + 1); setAnswered(null); setChosen(null)
  }

  const getVideoUrl = (figure) => {
    const v = mainVideo(figure)
    if (!v) return null
    const { data } = supabase.storage.from('videos').getPublicUrl(v.file_path)
    return data.publicUrl
  }

  const getCreator = (figure) => {
    const v = mainVideo(figure)
    if (!v) return null
    const handle = creatorHandle(v.creator_url)
    return handle ? { handle, url: v.creator_url } : null
  }

  if (loading) return <span className="spinner" style={{ marginTop: '3rem' }} />

  if (noVideos) return (
    <div className="page-container">
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>
          <Icon name="video-off" aria-hidden="true" />
        </div>
        <h2 className={styles.emptyTitle}>{tr.quizNoVideosTitle}</h2>
        <p className={styles.emptyText}>{tr.quizNoVideos}</p>
      </div>
    </div>
  )

  if (done) {
    const msgs = tr.quizScoreMsgs
    return (
      <div className="page-container">
        <div className={styles.scorePage}>
          <div className={styles.scoreCircle}>
            <span className={styles.scoreNum}>{score}</span>
            <span className={styles.scoreTotal}>/ {questions.length}</span>
          </div>
          <p className={styles.scoreMsg}>{msgs[score]}</p>
          <div className={styles.scoreBreakdown}>
            {questions.map((q, i) => (
              <div key={i} className={styles.scoreRow}>
                <span className={styles.scoreFig}>{q.correct.name}</span>
                <CategoryBadge slug={q.correct.category_slug} name={q.correct.category_name} />
              </div>
            ))}
          </div>
          <button className="btn btn-primary" onClick={buildQuiz}>
            <Icon name="refresh" /> {tr.quizReplay}
          </button>
        </div>
      </div>
    )
  }

  if (!questions.length) return <span className="spinner" style={{ marginTop: '3rem' }} />

  const q = questions[idx]
  const videoUrl = getVideoUrl(q.correct)
  const creator = getCreator(q.correct)

  return (
    <div className="page-container">
      <SEO
        titleFr="Quiz"
        titleEn="Quiz"
        descriptionFr="Teste tes connaissances sur les figures de wakeboard et wakeskate."
        descriptionEn="Test your knowledge of wakeboard and wakeskate tricks."
        path="/quiz"
      />
      <div className={styles.quiz}>
        <div className={styles.progress}>
          {Array.from({ length: questions.length }, (_, i) => (
            <div key={i} className={`${styles.progBar} ${i < idx ? styles.done : i === idx ? styles.current : ''}`} />
          ))}
        </div>
        <div className={styles.counterRow}>
          <p className={styles.counter}>{idx + 1} / {questions.length}</p>
          <CategoryBadge slug={q.correct.category_slug} name={q.correct.category_name} />
        </div>

        <div className={styles.videoWrap}>
          {videoUrl
            ? (
              <div className={styles.videoInner}>
                <video src={videoUrl} autoPlay loop muted playsInline className={styles.video} />
                {creator && (
                  <a
                    href={externalUrl(creator.url, { ref: true })}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.watermark}
                  >
                    @{creator.handle}
                  </a>
                )}
              </div>
            )
            : (
              <div className={styles.videoPlaceholder}>
                <Icon name="player-play" />
                <span>{q.correct.category_name}</span>
              </div>
            )
          }
          {answered && (
            <div className={`${styles.videoOverlay} ${answered === 'correct' ? styles.correct : styles.wrong}`}>
              <Icon name={answered === 'correct' ? 'check' : 'x'} />
            </div>
          )}
        </div>

        <p className={styles.question}>{tr.quizQuestion}</p>

        <div className={styles.options}>
          {q.options.map(opt => {
            let cls = styles.opt
            if (answered) {
              if (opt.id === q.correct.id) cls += ` ${styles.optCorrect}`
              else if (opt.id === chosen) cls += ` ${styles.optWrong}`
              else cls += ` ${styles.optDim}`
            }
            return (
              <button key={opt.id} className={cls} onClick={() => answer(opt)}>{opt.name}</button>
            )
          })}
        </div>

        {answered && (
          <div className={`${styles.feedback} ${answered === 'correct' ? styles.feedbackOk : styles.feedbackKo}`}>
            {answered === 'correct'
              ? <><Icon name="check" /> {tr.quizCorrect(q.correct.name)}</>
              : <><Icon name="x" /> {tr.quizWrong(q.correct.name)} — {q.correct.description?.substring(0, 80)}…</>
            }
          </div>
        )}

        {answered && (
          <button className={`btn btn-primary ${styles.nextBtn}`} onClick={next}>
            {idx + 1 < questions.length ? tr.quizNext : tr.quizResult}
          </button>
        )}
      </div>
    </div>
  )
}
