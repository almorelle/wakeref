import { useEffect, useReducer, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import CableMinimap from '../../components/competition/CableMinimap'
import {
  DEFAULT_CABLE_SPIN, DEFAULT_NB_POULIES, DEFAULT_POULIE_START, DEFAULT_NEXT_ID,
  defaultParcours, renumberPoulies, syncPoulies, syncTwins, toggleSecondPass,
  insertZoneAt, setupSummary, snapshotFrom, initFromSnapshot,
} from '../../lib/competition/model'
import {
  loadParcours, insertParcours, updateParcours, DuplicateNameError,
} from '../../lib/competition/api'
import { useToast } from '../../hooks/useToast'
import ToastContainer from '../../components/Toast'
import Icon from '../../components/Icon'
import styles from './CompetitionSetup.module.css'

// ── état + reducer ──────────────────────────────────────────────────────────
// Le reducer NORMALISE le parcours après chaque action (renumérotation des poulies
// + remiroir/nettoyage des copies 2e passage), comme renderSetup() du proto le fait
// en tête de rendu. On stocke donc toujours un parcours prêt-au-rendu.
function normalize(state) {
  return { ...state, parcours: renumberPoulies(syncTwins(state.parcours), state.nbPoulies, state.poulieStart) }
}

function initState() {
  return normalize({
    cableSpin: DEFAULT_CABLE_SPIN,
    nbPoulies: DEFAULT_NB_POULIES,
    poulieStart: DEFAULT_POULIE_START,
    parcours: defaultParcours(),
    nextId: DEFAULT_NEXT_ID,
  })
}

function updateZone(state, id, fn) {
  return { ...state, parcours: state.parcours.map((z) => (z.id === id ? fn(z) : z)) }
}

function reducer(state, action) {
  switch (action.type) {
    case 'setSpin':
      return { ...state, cableSpin: action.spin }
    case 'setNbPoulies': {
      const n = Math.max(3, Math.min(8, action.n || DEFAULT_NB_POULIES))
      const poulieStart = state.poulieStart > n ? 1 : state.poulieStart
      const { parcours, nextId } = syncPoulies(state.parcours, n, poulieStart, state.nextId)
      return normalize({ ...state, nbPoulies: n, poulieStart, parcours, nextId })
    }
    case 'setPoulieStart':
      return normalize({ ...state, poulieStart: action.p })
    case 'moveZone': {
      const { idx, delta } = action; const j = idx + delta
      if (j < 0 || j >= state.parcours.length) return state
      const parcours = state.parcours.slice()
      ;[parcours[idx], parcours[j]] = [parcours[j], parcours[idx]]
      return normalize({ ...state, parcours })
    }
    case 'deleteRow': {
      const parcours = state.parcours.slice(); parcours.splice(action.idx, 1)
      return normalize({ ...state, parcours })
    }
    case 'insertZone': {
      const { parcours, nextId } = insertZoneAt(state.parcours, action.idx, action.zoneType, state.nextId)
      return normalize({ ...state, parcours, nextId })
    }
    case 'addSlot':
      return normalize(updateZone(state, action.secId, (z) => ({ ...z, [action.key]: { kind: 'kicker', label: '' } })))
    case 'setSlotKind':
      return normalize(updateZone(state, action.secId, (z) => ({ ...z, [action.key]: { ...z[action.key], kind: action.kind } })))
    case 'setSlotLabel':
      return normalize(updateZone(state, action.secId, (z) => ({ ...z, [action.key]: { ...z[action.key], label: action.label } })))
    case 'removeSlot':
      return normalize(updateZone(state, action.secId, (z) => ({ ...z, [action.key]: null })))
    case 'setSpan':
      return normalize(updateZone(state, action.secId, (z) => ({ ...z, span: action.span })))
    case 'toggleTwin': {
      const { parcours, nextId } = toggleSecondPass(state.parcours, action.secId, state.nextId)
      return normalize({ ...state, parcours, nextId })
    }
    case 'clear':
      return normalize({ ...state, parcours: state.parcours.filter((s) => s.type === 'pulley') })
    case 'loadSnapshot':
      return normalize(initFromSnapshot(action.snap))
    default:
      return state
  }
}

// ── vue ─────────────────────────────────────────────────────────────────────
export default function CompetitionSetup() {
  const [state, dispatch] = useReducer(reducer, undefined, initState)
  const { cableSpin, nbPoulies, poulieStart, parcours } = state
  const { id } = useParams()
  const navigate = useNavigate()
  const { toasts, toast } = useToast()

  const [name, setName] = useState('')
  const [savedCode, setSavedCode] = useState(id || null) // short-code une fois persisté
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(!!id) // édition : on charge d'abord
  const [notFound, setNotFound] = useState(false)

  // Édition : charger le parcours par son id puis hydrater le reducer.
  useEffect(() => {
    if (!id) return
    let cancelled = false
    setLoading(true); setNotFound(false)
    ;(async () => {
      try {
        const row = await loadParcours(id)
        if (cancelled) return
        setName(row.name || '')
        setSavedCode(row.id)
        dispatch({ type: 'loadSnapshot', snap: row.data })
      } catch {
        if (!cancelled) setNotFound(true)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [id])

  const save = async () => {
    const trimmed = name.trim()
    if (!trimmed || saving) return
    setSaving(true)
    const data = snapshotFrom(state)
    try {
      if (savedCode) {
        await updateParcours(savedCode, { name: trimmed, data })
        toast('Parcours enregistré.', 'success')
      } else {
        const code = await insertParcours({ name: trimmed, data })
        toast('Parcours créé.', 'success')
        navigate(`/admin/competitions/${code}/edit`)
      }
    } catch (e) {
      toast(e instanceof DuplicateNameError ? 'Ce nom est déjà pris.' : 'Échec de l’enregistrement.', 'error')
    } finally {
      setSaving(false)
    }
  }

  const shareUrl = savedCode ? `${window.location.origin}/competition/${savedCode}` : ''
  const copyLink = async () => {
    try { await navigator.clipboard.writeText(shareUrl); toast('Lien copié.', 'success') } catch { /* ignore */ }
  }

  // « Vider le parcours » : double-clic pour confirmer (pas de confirm() natif).
  const [clearArmed, setClearArmed] = useState(false)
  const clearTimer = useRef(null)
  const onClear = () => {
    if (!clearArmed) {
      setClearArmed(true)
      clearTimeout(clearTimer.current)
      clearTimer.current = setTimeout(() => setClearArmed(false), 2600)
      return
    }
    clearTimeout(clearTimer.current); setClearArmed(false)
    dispatch({ type: 'clear' })
  }

  // numéro d'affichage de chaque zone (les poulies ne comptent pas)
  const zoneNo = {}; { let n = 0; parcours.forEach((s) => { if (s.type !== 'pulley') { n += 1; zoneNo[s.id] = n } }) }
  const sum = setupSummary(parcours, poulieStart)
  let pseen = 0

  if (loading) return <div className={styles.page}><span className="spinner" style={{ marginTop: '3rem' }} /></div>
  if (notFound) {
    return (
      <div className={styles.page}>
        <h1 className={styles.title}>Parcours introuvable</h1>
        <p className={styles.help}>Ce parcours n’existe pas ou a été supprimé.</p>
        <button className={styles.saveBtn} onClick={() => navigate('/admin/competitions')}>← Retour à la liste</button>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <ToastContainer toasts={toasts} />

      <div className={styles.headerBar}>
        <input
          className={styles.nameInput}
          placeholder="Nom du parcours"
          value={name}
          maxLength={80}
          onChange={(e) => setName(e.target.value)}
        />
        <button className={styles.saveBtn} onClick={save} disabled={!name.trim() || saving}>
          <Icon name="check" /> {savedCode ? 'Enregistrer' : 'Créer le parcours'}
        </button>
      </div>
      {savedCode && (
        <div className={styles.codeBar}>
          <span className={styles.codeLab}>Code de partage</span>
          <code className={styles.code}>{savedCode}</code>
          <button className={styles.linkBtn} onClick={copyLink}><Icon name="link" /> Copier le lien</button>
        </div>
      )}

      <div className={styles.cablespin}>
        <span className={styles.csLab}>Sens du câble</span>
        <div className={styles.csToggle}>
          <button className={cableSpin === 'regular' ? styles.on : ''} onClick={() => dispatch({ type: 'setSpin', spin: 'regular' })}>
            ↻ Regular<small>ext. gauche · int. droite</small>
          </button>
          <button className={cableSpin === 'goofy' ? styles.on : ''} onClick={() => dispatch({ type: 'setSpin', spin: 'goofy' })}>
            ↺ Goofy<small>int. gauche · ext. droite</small>
          </button>
        </div>
        <label className={styles.nbLab}>Nombre de poulies
          <input
            type="number" min="3" max="8" value={nbPoulies}
            onChange={(e) => dispatch({ type: 'setNbPoulies', n: +e.target.value })}
            className={styles.nbInput}
          />
        </label>
      </div>

      <div className={styles.setupGrid}>
        <div className={styles.setupMain}>
          <h2 className={styles.sub}>Sections — intérieur / extérieur du câble</h2>
          <div>
            {parcours.map((sec, idx) => {
              // barre d'insertion « entre deux poulies » (juste avant celle-ci)
              const insBar = sec.type === 'pulley' ? (
                <div className={styles.pInsert} key={`ins-${sec.id}`}>
                  <button onClick={() => dispatch({ type: 'insertZone', idx, zoneType: 'modules' })}><span style={{ color: 'var(--c-ws)' }}>＋</span> Section module</button>
                  <button onClick={() => dispatch({ type: 'insertZone', idx, zoneType: 'air' })}><span style={{ color: 'var(--c-wake)' }}>＋</span> Blocage</button>
                </div>
              ) : null

              if (sec.type === 'pulley') {
                const motor = sec.p >= nbPoulies
                const isFirst = pseen === 0; pseen += 1
                return (
                  <div key={`row-${sec.id}`}>
                    {insBar}
                    <div className={styles.pulleyrow}>
                      <div className={`${styles.pnode} ${motor ? styles.motor : ''}`}>{motor ? '⚓' : '●'}</div>
                      <div className={styles.pinfo}>
                        {isFirst ? (
                          <>
                            <span className={styles.plab}>1re poulie</span>
                            <select value={poulieStart} onChange={(e) => dispatch({ type: 'setPoulieStart', p: +e.target.value })}>
                              {Array.from({ length: nbPoulies }, (_, i) => <option key={i} value={i + 1}>{`P${i + 1}`}</option>)}
                            </select>
                          </>
                        ) : `Poulie P${sec.p}`}
                        {motor && <span className={styles.ptag}>moteur · ponton de départ</span>}
                      </div>
                    </div>
                  </div>
                )
              }

              const ctrls = (
                <div className={styles.sCtrls}>
                  <button className={styles.mini} disabled={idx === 0} onClick={() => dispatch({ type: 'moveZone', idx, delta: -1 })}>▲</button>
                  <button className={styles.mini} disabled={idx === parcours.length - 1} onClick={() => dispatch({ type: 'moveZone', idx, delta: 1 })}>▼</button>
                  <button className={`${styles.mini} ${styles.del}`} onClick={() => dispatch({ type: 'deleteRow', idx })}>✕</button>
                </div>
              )

              if (sec.passOf != null) {
                // copie 2e passage : contenu miroir du parent, lecture seule
                return (
                  <div key={`row-${sec.id}`} className={`${styles.section} ${styles.twin}`}>
                    <div className={styles.sIdx}>{zoneNo[sec.id]}</div>
                    <div className={styles.twinBody}>
                      <span className={styles.twinTag}>↺ 2e passage</span>
                      <span className={styles.twinRef}>copie de zone {zoneNo[sec.passOf] || '—'}</span>
                      <div className={styles.twinSum}>{twinSummary(sec, styles)}</div>
                    </div>
                    {ctrls}
                  </div>
                )
              }

              const hasTwin = parcours.some((z) => z.passOf === sec.id)
              return (
                <div key={`row-${sec.id}`} className={styles.section}>
                  <div className={styles.sIdx}>{zoneNo[sec.id]}</div>
                  {sec.type === 'air' ? (
                    <div className={styles.airband}>🎤 Blocage <span className={styles.airtag}>seau ouvert · chaque trick noté intérieur / extérieur</span></div>
                  ) : (
                    <div className={styles.sides}>
                      <Slot sec={sec} sideKey="int" head="intérieur" dispatch={dispatch} styles={styles} />
                      <Slot sec={sec} sideKey="ext" head="extérieur" dispatch={dispatch} styles={styles} />
                    </div>
                  )}
                  {ctrls}
                  <div className={styles.zextra}>
                    {sec.type === 'air' && (
                      <label className={styles.zx} title="sur combien de poulies consécutives le blocage s'étend">
                        🎤 s'étend sur
                        <select value={sec.span || 1} onChange={(e) => dispatch({ type: 'setSpan', secId: sec.id, span: +e.target.value })}>
                          {[1, 2, 3, 4].map((n) => <option key={n} value={n}>{`${n + 1} poulies`}</option>)}
                        </select>
                      </label>
                    )}
                    <button
                      className={`${styles.redtog} ${hasTwin ? styles.on : ''}`}
                      title="ajoute une copie de cette zone en bas du parcours (2e passage au même endroit)"
                      onClick={() => dispatch({ type: 'toggleTwin', secId: sec.id })}
                    >↺ 2e passage{hasTwin ? ' ✓' : ''}</button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* barre « ＋ Section module · ＋ Blocage » après la dernière poulie (ajout en fin) */}
          <div className={styles.addSection}>
            <button onClick={() => dispatch({ type: 'insertZone', idx: parcours.length, zoneType: 'modules' })}><span style={{ color: 'var(--c-ws)' }}>＋</span> Section module</button>
            <button onClick={() => dispatch({ type: 'insertZone', idx: parcours.length, zoneType: 'air' })}><span style={{ color: 'var(--c-wake)' }}>＋</span> Blocage</button>
          </div>

          <p className={styles.help}>
            Remplis l'intérieur et/ou l'extérieur d'une section. Deux côtés remplis = le rider en choisit un.
            Un seul = côté attendu (mais à la saisie tu peux toujours dévier). <b>Blocage</b> = seau ouvert, chaque trick noté intérieur ou extérieur.
          </p>

          <div className={styles.clearWrap}>
            <button className={`${styles.clearParcours} ${clearArmed ? styles.armed : ''}`} onClick={onClear}>
              {clearArmed ? 'Confirmer — vider tout le parcours ?' : '✕ Vider le parcours'}
            </button>
          </div>
        </div>

        <aside className={styles.setupAside}>
          <div className={styles.setupMapCard}>
            <div className={styles.smTitle}>Aperçu du câble</div>
            <div className={styles.setupMap}>
              <CableMinimap parcours={parcours} cableSpin={cableSpin} nbPoulies={nbPoulies} />
            </div>
            <div className={styles.smSummary}>
              <span className={styles.smChip}>{sum.zones} zone{sum.zones > 1 ? 's' : ''}</span>
              <span className={styles.smChip}>{sum.modules} module{sum.modules > 1 ? 's' : ''}</span>
              {poulieStart !== 1 && <span className={styles.smChip}>1re poulie P{poulieStart}</span>}
              {sum.twins > 0 && <span className={styles.smChip}>2e passage ×{sum.twins}</span>}
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

function Slot({ sec, sideKey, head, dispatch, styles: st }) {
  const sl = sec[sideKey]
  return (
    <div className={st.sideCol}>
      <span className={st.sideHead}>{head}</span>
      {!sl ? (
        <div className={`${st.slot} ${st.empty}`} onClick={() => dispatch({ type: 'addSlot', secId: sec.id, key: sideKey })}>
          ＋ {head}
        </div>
      ) : (
        <div className={st.slot}>
          <div className={st.kindToggle}>
            <button data-k="kicker" className={sl.kind === 'kicker' ? st.on : ''} onClick={() => dispatch({ type: 'setSlotKind', secId: sec.id, key: sideKey, kind: 'kicker' })}>Kicker</button>
            <button data-k="jib" className={sl.kind === 'jib' ? st.on : ''} onClick={() => dispatch({ type: 'setSlotKind', secId: sec.id, key: sideKey, kind: 'jib' })}>Jib</button>
          </div>
          <input placeholder="label (rail, box…)" value={sl.label || ''} onChange={(e) => dispatch({ type: 'setSlotLabel', secId: sec.id, key: sideKey, label: e.target.value })} />
          <button className={st.rm} onClick={() => dispatch({ type: 'removeSlot', secId: sec.id, key: sideKey })}>✕</button>
        </div>
      )}
    </div>
  )
}

function twinSummary(sec, st) {
  if (sec.type === 'air') return <span className={`${st.twinChip} ${st.air}`}>🎤 blocage</span>
  const chip = (s, side) => (s ? <span key={side} className={`${st.twinChip} ${st[s.kind]}`}>{side} · {s.kind === 'jib' ? (s.label || 'jib') : 'kicker'}</span> : null)
  const chips = [chip(sec.int, 'int'), chip(sec.ext, 'ext')].filter(Boolean)
  return chips.length ? chips : <span className={st.twinChip}>vide</span>
}
