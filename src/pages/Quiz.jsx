import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { CategoryBadge } from '../components/Badges'
import { useT } from '../i18n/useT'
import styles from './Quiz.module.css'
import SEO from '../components/SEO'
import Icon from '../components/Icon'

function shuffle(arr) { return [...arr].sort(() => Math.random() - .5) }

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
    supabase.from('figures_full').select('*').then(({ data }) => {
      if (data) setAllFigures(data)
      setLoading(false)
    })
  }, [])

  const buildQuiz = useCallback(() => {
    const withVideos = allFigures.filter(f => {
      const vids = typeof f.videos === 'string' ? JSON.parse(f.videos) : f.videos || []
      return vids.some(v => v.file_path) // file_path = upload direct uniquement
    })

    if (withVideos.length === 0) {
      setNoVideos(true)
      return
    }
    setNoVideos(false)

    const selected = shuffle(withVideos).slice(0, Math.min(TOTAL, withVideos.length))
    const selectedIds = new Set(selected.map(f => f.id))

    const qs = selected.map(correct => {
      const sameCat = allFigures.filter(f => !selectedIds.has(f.id) && f.category_slug === correct.category_slug)
      const wrongPool = sameCat.length >= 3 ? sameCat : allFigures.filter(f => !selectedIds.has(f.id))
      const wrongs = shuffle(wrongPool).slice(0, 3)
      return { correct, options: shuffle([correct, ...wrongs]) }
    })
    setQuestions(qs); setIdx(0); setScore(0); setAnswered(null); setChosen(null); setDone(false)
  }, [allFigures])

  useEffect(() => { if (allFigures.length) buildQuiz() }, [allFigures, buildQuiz])

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
    const vids = typeof figure.videos === 'string' ? JSON.parse(figure.videos) : figure.videos || []
    if (!vids.length) return null
    const v = vids.find(v => v.file_path)
    if (v.file_path) {
      const { data } = supabase.storage.from('videos').getPublicUrl(v.file_path)
      return data.publicUrl
    }
    return null
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
            ? <video src={videoUrl} autoPlay loop muted playsInline className={styles.video} />
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
