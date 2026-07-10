import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getParcoursByCode } from '../../lib/competition/api'
import { useHeatStore } from '../../lib/competition/heatStore'
import { useCompetitionVoice } from '../../lib/competition/voice'
import { useToast } from '../../hooks/useToast'
import ToastContainer from '../../components/Toast'
import HeatTab from './HeatTab'
import RunTab from './RunTab'
import styles from './CompetitionView.module.css'

// Application juge d'un parcours partagé : charge par short-code (grant anon), puis
// deux onglets Heat + Run alimentés par un store local (autosave par code). Le juge
// juge en local — seul le parcours voyage entre devices.
export default function CompetitionView() {
  const { code } = useParams()
  const navigate = useNavigate()
  const [row, setRow] = useState(null)
  const [loading, setLoading] = useState(!!code)
  const [notFound, setNotFound] = useState(false)
  const [input, setInput] = useState('')

  useEffect(() => {
    if (!code) { setLoading(false); return }
    let cancelled = false
    setLoading(true); setNotFound(false); setRow(null)
    ;(async () => {
      try {
        const data = await getParcoursByCode(code)
        if (cancelled) return
        if (!data) setNotFound(true); else setRow(data)
      } catch {
        if (!cancelled) setNotFound(true)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [code])

  // Saisie de code (/competition sans code)
  if (!code) {
    const go = (e) => { e.preventDefault(); const c = input.trim(); if (c) navigate(`/competition/${c}`) }
    return (
      <div className={styles.gate}>
        <div className={styles.brand}>Wake<b>Ref</b> · Compétition</div>
        <form className={styles.gateForm} onSubmit={go}>
          <label className={styles.gateLab}>Code du parcours</label>
          <input className={styles.gateInput} placeholder="ex. a1b2c3d4" value={input} onChange={(e) => setInput(e.target.value)} autoFocus />
          <button className={styles.gateBtn} type="submit">Charger le parcours</button>
        </form>
      </div>
    )
  }

  if (loading || !row) {
    return (
      <div className={styles.center}>
        {notFound ? (
          <>
            <p className={styles.nf}>Parcours introuvable pour le code <code>{code}</code>.</p>
            <button className={styles.gateBtn} onClick={() => navigate('/competition')}>← Saisir un autre code</button>
          </>
        ) : <span className="spinner" />}
      </div>
    )
  }

  // key={code} : changer de parcours ré-initialise le store (heat distinct par code).
  return <HeatRunApp key={code} code={code} row={row} />
}

function HeatRunApp({ code, row }) {
  const [state, dispatch] = useHeatStore(code, row)
  const { toasts, toast } = useToast()
  // Moteur voix au niveau app : la file de transcription survit aux changements d'onglet.
  const voice = useCompetitionVoice(dispatch, (msg) => toast(msg, 'error'))

  return (
    <div className={styles.app}>
      <ToastContainer toasts={toasts} />
      <header className={styles.topbar}>
        <div className={styles.brand}>Wake<b>Ref</b></div>
        <code className={styles.code}>{row.name} · {row.id}</code>
        <div className={styles.tabs}>
          <button className={state.tab === 'heat' ? styles.on : ''} onClick={() => dispatch({ type: 'setTab', tab: 'heat' })}>Heat</button>
          <button className={state.tab === 'run' ? styles.on : ''} onClick={() => dispatch({ type: 'setTab', tab: 'run' })}>Run</button>
        </div>
      </header>

      {state.tab === 'heat'
        ? <HeatTab state={state} dispatch={dispatch} toast={toast} voice={voice} />
        : <RunTab state={state} dispatch={dispatch} voice={voice} />}
    </div>
  )
}
