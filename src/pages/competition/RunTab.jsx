import { useEffect, useRef, useState } from 'react'
import CableMinimap from '../../components/competition/CableMinimap'
import { sideLabel } from '../../lib/competition/model'
import { linearPos } from '../../lib/competition/heatStore'
import { micSupported } from '../../lib/competition/voice'
import { loadWhisper } from '../../lib/whisperStt'
import {
  RATES, RLAB, leftSide, rightSide, secOf, moduleKind, moduleSides,
  entrySummary, zoneShortLabel,
} from '../../lib/competition/runModel'
import styles from './RunTab.module.css'

// Bouton micro PUSH-TO-TALK : maintien = enregistre, relâche = stop → transcription.
// `prepare()` (au pointerDown) pose le marqueur « en cours » et renvoie { kind, target }
// (target = { fill, ...coords }) ; null pour annuler.
function MicButton({ className, children, voice, disabled, prepare }) {
  const [rec, setRec] = useState(false)
  const capRef = useRef(null)
  const down = async (e) => {
    e.preventDefault()
    if (disabled || rec) return
    const cap = prepare(); if (!cap) return
    capRef.current = cap
    const ok = await voice.startRec()
    if (!ok) { voice.enqueue(cap.kind, null, cap.target); capRef.current = null; return } // micro refusé → libère
    setRec(true)
  }
  const up = async () => {
    if (!rec) return
    setRec(false)
    const cap = capRef.current; capRef.current = null
    const blob = await voice.stopRec()
    voice.enqueue(cap.kind, blob, cap.target)
  }
  return (
    <button
      type="button"
      className={`${className} ${rec ? styles.recording : ''}`}
      disabled={disabled}
      onPointerDown={down}
      onPointerUp={up}
      onPointerLeave={up}
      onPointerCancel={up}
    >{rec ? '🎙️ écoute…' : children}</button>
  )
}

// Onglet Run : saisie immersive zone par zone (deck / stage / pile). Port de
// renderRun + buildStage + buildStackItem + dock (proto). Transitions de zone par
// classe CSS (pas de FLIP JS). Le micro est simulé (pioche dans un pool).
export default function RunTab({ state, dispatch, voice }) {
  const { riders, riderCursor, runCursor, runCount, curIdx, parcours } = state
  const stageRef = useRef(null)

  // Préchargement best-effort du modèle tricks au montage du Run (le jib se précharge
  // dans le Heat, plus lourd). loadWhisper est idempotent (cache global).
  useEffect(() => { loadWhisper('wakeref').catch(() => {}) }, [])

  // clavier : ↑/↓ = zone · ←/→ = côté (ignore quand un champ a le focus)
  useEffect(() => {
    const onKey = (e) => {
      const t = e.target
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return
      if (e.key === 'ArrowUp') { e.preventDefault(); dispatch({ type: 'navigate', dir: 1 }) }
      else if (e.key === 'ArrowDown') { e.preventDefault(); dispatch({ type: 'navigate', dir: -1 }) }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); dispatch({ type: 'pickSideLR', vis: 'l' }) }
      else if (e.key === 'ArrowRight') { e.preventDefault(); dispatch({ type: 'pickSideLR', vis: 'r' }) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [dispatch])

  // molette / swipe = navigation entre zones (laisse le scroll natif quand un bloc défile)
  useEffect(() => {
    const el = stageRef.current; if (!el) return
    const scrollableAncestor = (node, dir) => {
      while (node && node !== el) {
        if (node.scrollHeight > node.clientHeight + 1) {
          const atTop = node.scrollTop <= 0; const atBot = node.scrollTop + node.clientHeight >= node.scrollHeight - 1
          if (dir > 0 && !atBot) return node; if (dir < 0 && !atTop) return node
        }
        node = node.parentElement
      }
      return null
    }
    let acc = 0; let cd = false
    const onWheel = (e) => {
      const dir = e.deltaY > 0 ? 1 : -1
      if (scrollableAncestor(e.target, dir)) return
      e.preventDefault()
      if (cd) return
      if (Math.sign(e.deltaY) !== Math.sign(acc)) acc = 0
      acc += e.deltaY
      if (Math.abs(acc) > 55) { acc = 0; dispatch({ type: 'navigate', dir: -dir }); cd = true; setTimeout(() => { cd = false }, 420) }
    }
    let sx = 0; let sy = 0; let st = 0; let multi = false
    const onTS = (e) => { multi = e.touches.length > 1; const t = e.changedTouches[0]; sx = t.clientX; sy = t.clientY; st = Date.now() }
    const onTE = (e) => {
      if (multi) return
      const t = e.changedTouches[0]; const dx = t.clientX - sx; const dy = t.clientY - sy; const dt = Date.now() - st
      if (dt > 700) return
      const ax = Math.abs(dx); const ay = Math.abs(dy)
      if (ax > ay) { if (ax > 50) dispatch({ type: 'pickSideLR', vis: dx < 0 ? 'l' : 'r' }) }
      else if (ay > 70 && !scrollableAncestor(e.target, dy < 0 ? 1 : -1)) dispatch({ type: 'navigate', dir: dy < 0 ? 1 : -1 })
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    el.addEventListener('touchstart', onTS, { passive: true })
    el.addEventListener('touchend', onTE, { passive: true })
    return () => { el.removeEventListener('wheel', onWheel); el.removeEventListener('touchstart', onTS); el.removeEventListener('touchend', onTE) }
  }, [dispatch])

  if (!riders.length) return <div className={styles.msg}>Aucun rider — ajoute des riders dans l’onglet Heat.</div>
  const rider = riders[riderCursor]
  const runRows = (rider && rider.runs[runCursor]) || []
  if (!runRows.length) return <div className={styles.msg}>Parcours vide — ajoute des sections dans le Setup.</div>

  // run 2 verrouillé tant que le run 1 n'est pas enregistré
  if (runCount > 1 && runCursor === 1 && rider && !(rider.saved && rider.saved[0])) {
    return (
      <div className={styles.lock}>
        <div className={styles.lockIcon}>🔒</div>
        <p className={styles.lockTitle}>Run 2 verrouillé</p>
        <p className={styles.lockSub}>Enregistre d’abord le run 1 de {rider.name}.</p>
        <button className={styles.btn} onClick={() => dispatch({ type: 'loadRun', index: riderCursor, ru: 0 })}>→ Aller au run 1</button>
      </div>
    )
  }

  const fallIdx = (() => { const i = runRows.findIndex((x) => x.fell); return i < 0 ? null : i })()
  const idx = Math.max(0, Math.min(curIdx, runRows.length - 1))
  const cur = runRows[idx]
  const upcoming = runRows.length - 1 - idx
  const nUp = Math.min(3, upcoming)
  const PEEK = 26

  return (
    <div className={styles.saisie}>
      <div className={styles.saisieHead}>
        <div className={styles.riderbar}>
          <span className={styles.num}>{riderCursor + 1}</span>
          <span className={styles.ridernameRo}>{rider.name}</span>
          <span className={styles.runsdone}>rider <b>{riderCursor + 1}</b> / <b>{riders.length}</b></span>
          {runCount > 1 && <span className={styles.runBadge}>Run {runCursor + 1} / {runCount}</span>}
          {voice.pendingCount > 0 && <span className={styles.transcribing}>⏳ {voice.pendingCount} en transcription</span>}
        </div>
      </div>

      <div className={styles.saisieBody}>
        <aside className={styles.minimap}>
          <div className={styles.mapCard}>
            <div className={styles.mapTitle}>Aperçu du câble</div>
            <div className={styles.map}>
              <CableMinimap parcours={parcours} cableSpin={state.cableSpin} nbPoulies={state.nbPoulies} curSecId={cur && cur.kind !== 'adhoc' ? cur.secId : null} />
            </div>
          </div>
        </aside>

        <div className={styles.runstage} ref={stageRef}>
          <div className={styles.deck} style={{ '--room': `${nUp ? nUp * PEEK + 6 : 0}px` }}>
            {Array.from({ length: nUp }, (_, n) => nUp - n).map((d) => {
              const zi = idx + d
              const more = (d === nUp && upcoming > nUp) ? `＋${upcoming - nUp} après` : ''
              return (
                <div
                  key={zi}
                  className={styles.upCard}
                  style={{ transform: `translateY(${-PEEK * d}px)`, zIndex: 10 - d, opacity: (1 - (d - 1) * 0.22).toFixed(2) }}
                  onClick={() => dispatch({ type: 'goTo', idx: zi })}
                >
                  <div className={styles.upHdr}><span className={styles.upn}>Z{zi + 1}</span><span className={styles.upl}>{zoneShortLabel(parcours, runRows[zi])}</span>{more && <span className={styles.upl} style={{ marginLeft: 'auto', color: 'var(--c-faint)' }}>{more}</span>}</div>
                </div>
              )
            })}
            <Stage key={idx} state={state} dispatch={dispatch} voice={voice} r={cur} idx={idx} fallIdx={fallIdx} />
          </div>

          <div className={styles.stackWrap}>
            {idx > 0 ? (
              <>
                <div className={styles.stackHead}>↓ déjà passé (récent → départ)</div>
                {Array.from({ length: idx }, (_, n) => idx - 1 - n).map((p) => <StackItem key={p} state={state} dispatch={dispatch} r={runRows[p]} idx={p} fallIdx={fallIdx} />)}
                <div className={styles.startMark}>▼ départ du run</div>
              </>
            ) : <div className={styles.startMark}>▼ départ du run — zone courante</div>}
          </div>
        </div>
      </div>

      <Dock state={state} dispatch={dispatch} />
    </div>
  )
}

// ── barre du bas : navigation rider + enregistrement du run ────────────────────
function Dock({ state, dispatch }) {
  const { riders, riderCursor, runCursor, runCount } = state
  const [movePop, setMovePop] = useState(false)
  const N = riders.length
  const rider = riders[riderCursor]
  const pos = linearPos(state)
  const locked = runCursor === 1 && !(rider && rider.saved && rider.saved[0])
  const saved = rider && rider.saved && rider.saved[runCursor]
  const showSave = N && runCount > 1 && !locked

  return (
    <div className={styles.dock}>
      {movePop && (
        <div className={styles.movePop}>
          <div className={styles.mpHead}>Déplacer ce run (run {runCursor + 1}) vers…</div>
          {riders.map((r, i) => (i === riderCursor ? null : (
            <button key={r.id} onClick={() => { dispatch({ type: 'moveRunToRider', targetIndex: i }); setMovePop(false) }}>
              <span className={styles.mpNum}>{i + 1}</span>{r.name}
            </button>
          )))}
          <button className={styles.mpCancel} onClick={() => setMovePop(false)}>annuler</button>
        </div>
      )}
      <button className={styles.navbtn} disabled={pos <= 0} title="rider précédent" onClick={() => dispatch({ type: 'riderNav', dir: -1 })}>‹</button>
      <span className={styles.navpos}>{N ? `${riderCursor + 1} / ${N} · ${rider.name}${runCount > 1 ? ` · Run ${runCursor + 1}` : ''}` : '—'}</span>
      <button className={styles.navbtn} disabled={pos >= N * runCount - 1} title="rider suivant" onClick={() => dispatch({ type: 'riderNav', dir: 1 })}>›</button>
      {showSave && (
        <button className={`${styles.btn} ${styles.primary} ${saved ? styles.savedBtn : ''}`} onClick={() => dispatch({ type: 'saveRun' })}>
          ✓ {runCursor === 0 ? (saved ? 'Run 1 enregistré' : 'Enregistrer le run 1 → prépare run 2') : (saved ? 'Run 2 validé' : 'Valider le run 2')}
        </button>
      )}
      <button className={styles.btn} onClick={() => dispatch({ type: 'resetRun' })}>↺ Vider ce run</button>
      <button className={styles.btn} onClick={() => setMovePop((o) => !o)}>⇄ Ce run est à…</button>
    </div>
  )
}

// ── rail de choix du côté (int/ext → gauche/droite selon le sens du câble) ──────
function SideRail({ state, dispatch, chosen, valid }) {
  const ls = leftSide(state.cableSpin); const rs = rightSide(state.cableSpin)
  const ok = (s) => !valid || valid.includes(s)
  const btn = (s, pre, post) => (
    <button
      key={s}
      className={`${styles.sopt} ${styles[`s-${s}`]} ${chosen === s ? styles.on : ''} ${ok(s) ? '' : styles.disabled}`}
      disabled={!ok(s)}
      onClick={() => dispatch({ type: 'setSide', side: s })}
    >{pre}{sideLabel(s)}{post}</button>
  )
  return <div className={styles.sideRail}>{btn(ls, '◂ ', '')}{btn(rs, '', ' ▸')}</div>
}

function RateDots({ rate, onSet }) {
  return (
    <div className={styles.rate}>
      {RATES.map((v) => <button key={v} className={`${styles.dot} ${rate === v ? styles.on : styles.dim}`} data-v={v} title={RLAB[v]} onClick={() => onSet(v)} />)}
    </div>
  )
}

// ── carte de la zone courante ──────────────────────────────────────────────────
function Stage({ state, dispatch, voice, r, idx, fallIdx }) {
  const { parcours, cableSpin, activeSide } = state
  const teRef = useRef(null)
  useEffect(() => { const te = teRef.current; if (te) { te.style.height = 'auto'; te.style.height = `${te.scrollHeight}px` } })

  const kindCls = r.kind === 'air' ? 'air' : r.kind === 'adhoc' ? 'adhoc' : moduleKind(parcours, r)
  const isFall = fallIdx === idx
  // cible du remplissage voix (coordonnées stables : le juge peut naviguer avant la fin)
  const riderId = state.riders[state.riderCursor]?.id
  const ru = state.runCursor
  const trickPrepare = () => { dispatch({ type: 'pendTrick' }); return { kind: kindCls === 'jib' ? 'jib' : 'trick', target: { fill: 'fillTrick', riderId, ru, secId: r.secId } } }
  const adhocPrepare = () => { dispatch({ type: 'pendAdhoc' }); return { kind: 'trick', target: { fill: 'fillAdhoc', riderId, ru, adhocId: r.id } } }
  const airPrepare = () => { const id = `a${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`; dispatch({ type: 'addAir', id, side: activeSide }); return { kind: 'trick', target: { fill: 'fillAir', riderId, ru, secId: r.secId, airId: id } } }
  const sec = r.kind === 'module' || r.kind === 'air' ? secOf(parcours, r) : null
  const isTwin = sec && sec.passOf != null
  const cardSide = r.kind === 'air' ? activeSide : r.side
  const animCls = state.navDir > 0 ? styles.animNext : state.navDir < 0 ? styles.animPrev : ''
  const sideCls = cardSide ? `${styles.hasSide} ${leftSide(cableSpin) === cardSide ? styles.sdL : styles.sdR}` : ''
  const stageStyle = cardSide ? { '--sideCol': cardSide === 'int' ? 'var(--c-int)' : 'var(--c-ext)' } : undefined

  const top = (
    <div className={styles.stageTop}>
      <span className={styles.stageIdx}>Zone {idx + 1}</span>
      <span className={`${styles.kbadge} ${styles[kindCls]}`}>{r.kind === 'air' ? 'blocage' : r.kind === 'adhoc' ? 'hors parcours' : kindCls}</span>
      {isTwin && <span className={`${styles.kbadge} ${styles.pass}`}>↺ 2e passage</span>}
    </div>
  )

  // brouillon run 2 : même carte quel que soit le type
  if (r.draft) {
    return (
      <div className={`${styles.stage} ${styles[`cur-${kindCls}`]} ${isFall ? styles.fallen : ''} ${animCls}`} style={stageStyle}>
        {top}
        <div className={styles.stageBody}>
          <div className={styles.draftCard}>
            <div className={styles.draftEyebrow}>↩ repris du run 1</div>
            <div className={styles.draftLabel}>
              {r.kind === 'air'
                ? (r.airs && r.airs.length ? <div className={styles.draftAirs}>{r.airs.map((a, i) => <span key={i} className={styles.draftAir}>{a.name}{a.side && <span className={styles.lrtag}>{sideLabel(a.side)}</span>}</span>)}</div> : <span className={styles.draftName}>blocage vide</span>)
                : <><span className={styles.draftName}>{entrySummary(r)}</span>{r.side && <span className={styles.lrtag}>{sideLabel(r.side)}</span>}</>}
            </div>
            <div className={styles.draftActs}>
              <button className={styles.confirmBtn} onClick={() => dispatch({ type: 'confirmDraft' })}>✓ Valider (idem run 1)</button>
              <button className={styles.actbtn} onClick={() => dispatch({ type: 'changeDraft' })}>✎ Saisir autre chose</button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  let body
  if (r.kind === 'air') {
    const hasDraft = r.airs.some((a) => a.draft)
    const micPos = activeSide ? (leftSide(cableSpin) === activeSide ? 'l' : 'r') : 'c'
    const micLabel = activeSide ? `${micPos === 'l' ? '◂ ' : ''}🎤 dicter · ${sideLabel(activeSide)}${micPos === 'r' ? ' ▸' : ''}` : '🎤 dicter un trick'
    body = (
      <>
        <div className={styles.stageHint}>{hasDraft ? 'Repris du run 1 — ✓ idem pour garder un trick, ✕ pour le retirer, ou dicte les nouveaux.' : 'Blocage — ← → pour le côté (optionnel), dicte chaque trick.'}</div>
        <div className={`${styles.stageBody} ${styles.airBody}`}>
          <div className={styles.bucket}>
            {r.airs.length === 0 ? <div className={styles.airempty}>aucun trick pour l’instant</div> : r.airs.map((a, i) => (
              a.pending ? (
                <div key={a.id || i} className={styles.airitem}>
                  <span className={`${styles.pendingBox} ${styles.pendFlex}`}>⏳ transcription en cours…</span>
                  <button className={styles.x} onClick={() => dispatch({ type: 'removeAir', i })}>✕</button>
                </div>
              ) : (
                <div key={a.id || i} className={`${styles.airitem} ${a.draft ? styles.draft : ''}`}>
                  <input className={styles.airedit} value={a.name} aria-label="trick dicté" onChange={(e) => dispatch({ type: 'editAir', i, value: e.target.value })} />
                  {a.draft && <button className={styles.airidem} onClick={() => dispatch({ type: 'confirmAir', i })}>✓ idem</button>}
                  <span className={styles.postog}>
                    <button className={a.side === 'int' ? styles.on : ''} onClick={() => dispatch({ type: 'setAirSide', i, side: 'int' })}>int</button>
                    <button className={a.side === 'ext' ? styles.on : ''} onClick={() => dispatch({ type: 'setAirSide', i, side: 'ext' })}>ext</button>
                  </span>
                  <RateDots rate={a.rate} onSet={(v) => dispatch({ type: 'setAirRate', i, v })} />
                  <button className={styles.x} onClick={() => dispatch({ type: 'removeAir', i })}>✕</button>
                </div>
              )
            ))}
          </div>
          <div className={styles.airmicRow} style={{ justifyContent: micPos === 'l' ? 'flex-start' : micPos === 'r' ? 'flex-end' : 'center' }}>
            <MicButton className={styles.micbtn} voice={voice} disabled={!micSupported} prepare={airPrepare}>{micLabel}</MicButton>
          </div>
        </div>
      </>
    )
  } else if (r.kind === 'adhoc') {
    const posCls = r.side ? (leftSide(cableSpin) === r.side ? styles.posL : styles.posR) : styles.posC
    body = (
      <>
        <div className={styles.stageHint}>Zone hors-parcours — côté optionnel (← → ou tap){r.side && <> · <b>{sideLabel(r.side)}</b></>}.</div>
        <SideRail state={state} dispatch={dispatch} chosen={r.side} />
        <div className={styles.stageBody}>
          <div className={`${styles.entryWrap} ${posCls}`}>
            {r.pending ? <div className={styles.pendingBox}>⏳ transcription en cours…</div> : (
              <div className={styles.fillrow}>
                <input className={styles.freein} placeholder="ce que le rider a fait…" value={r.text || ''} onChange={(e) => dispatch({ type: 'editAdhoc', value: e.target.value })} />
                <MicButton className={`${styles.micbtn} ${styles.micsm}`} voice={voice} disabled={!micSupported} prepare={adhocPrepare}>🎤</MicButton>
              </div>
            )}
          </div>
        </div>
      </>
    )
  } else { // module
    if (r.rien) {
      body = (
        <div className={styles.stageBody} style={{ textAlign: 'center', color: 'var(--c-faint)' }}>
          <div style={{ fontSize: 16, fontWeight: 600, fontStyle: 'italic' }}>module non pris — skip</div>
          <div style={{ marginTop: 14 }}><button className={styles.actbtn} style={{ display: 'inline-flex' }} onClick={() => dispatch({ type: 'undoRien' })}>↺ finalement, il l’a pris</button></div>
        </div>
      )
    } else {
      const kind = moduleKind(parcours, r)
      const sides = moduleSides(sec)
      if (!r.side) {
        body = (
          <>
            <div className={styles.stageHint}>Un module se prend à <b>gauche</b> ou à <b>droite</b> — choisis le côté (← → ou tap), ou <b>skip</b> si le rider l’a contourné.</div>
            <SideRail state={state} dispatch={dispatch} chosen={r.side} valid={sides} />
            <div className={styles.stageBody}>
              <div className={`${styles.entryWrap} ${styles.posC}`} style={{ alignItems: 'center', gap: 16 }}>
                <div className={styles.pickSidePrompt}>◂ &nbsp;de quel côté ?&nbsp; ▸</div>
                <button className={styles.actbtn} onClick={() => dispatch({ type: 'skipMod' })}>⤳ skip · le rider n’a pas pris ce module</button>
              </div>
            </div>
          </>
        )
      } else {
        const posCls = leftSide(cableSpin) === r.side ? styles.posL : styles.posR
        const canSwitch = sides.length > 1
        body = (
          <>
            <div className={styles.stageHint}>{kind === 'jib' ? 'Passe jib' : 'Trick'} · <b>{sideLabel(r.side)}</b>{canSwitch && ' (← → pour changer de côté)'}.</div>
            <SideRail state={state} dispatch={dispatch} chosen={r.side} valid={sides} />
            <div className={styles.stageBody}>
              <div className={`${styles.entryWrap} ${posCls}`}>
                {r.pending ? <div className={styles.pendingBox}>⏳ transcription en cours…</div> : !r.trick
                  ? (micSupported
                    ? <div className={styles.fillrow}><MicButton className={`${styles.micbtn} ${styles.micsm}`} voice={voice} prepare={trickPrepare}>🎤 dicter {kind === 'jib' ? 'la passe' : 'le trick'}</MicButton></div>
                    : <div className={styles.fillrow}><input className={styles.freein} placeholder={kind === 'jib' ? 'passe jib…' : 'trick…'} value="" onChange={(e) => dispatch({ type: 'editTrick', value: e.target.value })} /></div>)
                  : <div className={styles.fillrow}><textarea ref={teRef} className={styles.trickEdit} rows={1} aria-label="figure" value={r.trick} onChange={(e) => dispatch({ type: 'editTrick', value: e.target.value })} />{micSupported && <MicButton className={`${styles.micbtn} ${styles.micxs}`} voice={voice} prepare={trickPrepare}>🎤</MicButton>}</div>}
              </div>
            </div>
          </>
        )
      }
    }
  }

  const showNote = (r.kind === 'module' && r.side && !r.rien) || r.kind === 'adhoc'
  return (
    <div className={`${styles.stage} ${styles[`cur-${kindCls}`]} ${isFall ? styles.fallen : ''} ${sideCls} ${animCls}`} style={stageStyle}>
      {top}
      {body}
      {showNote && <div className={styles.noteAnchor}><span className={styles.rl}>note</span><RateDots rate={r.rate} onSet={(v) => dispatch({ type: 'setRate', v })} /></div>}
      <div className={styles.stageActions}>
        <button className={styles.actbtn} onClick={() => dispatch({ type: 'insertAdhoc', k: idx })}>＋ insérer une zone</button>
        {r.kind === 'module' && !r.rien && r.side && <button className={styles.actbtn} onClick={() => dispatch({ type: 'setRien' })}>⤳ skip (non pris)</button>}
        {r.kind === 'adhoc' && (
          <>
            <button className={styles.actbtn} disabled={idx <= 0} onClick={() => dispatch({ type: 'moveAdhoc', delta: -1 })}>↓ plus tôt</button>
            <button className={styles.actbtn} onClick={() => dispatch({ type: 'moveAdhoc', delta: 1 })}>↑ plus tard</button>
            <button className={styles.actbtn} onClick={() => dispatch({ type: 'delAdhoc', idx })}>✕ supprimer</button>
          </>
        )}
        {Boolean(r.kind === 'air' ? r.airs.length : r.trick || r.chips || r.rien || (r.kind === 'adhoc' && r.text)) && <button className={styles.actbtn} onClick={() => dispatch({ type: 'clearZone' })}>↺ vider la zone</button>}
        {!isFall && <button className={`${styles.actbtn} ${styles.fall}`} onClick={() => dispatch({ type: 'markFall' })}>⚠ chute ici · fin du run</button>}
      </div>
      {isFall && <div className={styles.fallBanner}>⚠ Chute sur cette zone — la suite du run est marquée « skip ». <button onClick={() => dispatch({ type: 'undoFall' })}>annuler la chute</button></div>}
    </div>
  )
}

// ── item de la pile (zones déjà passées) ───────────────────────────────────────
function StackItem({ state, dispatch, r, idx, fallIdx }) {
  const { parcours } = state
  const after = fallIdx != null && idx > fallIdx
  let label; let sub = ''; let side = r.side; let rate = r.rien ? 'none' : r.rate
  if (r.kind === 'air') { label = r.airs.length ? r.airs.map((a) => a.name).join(', ') : 'blocage (rien)'; sub = 'blocage'; side = null; rate = r.airs.length ? 'ok' : 'none' }
  else if (r.kind === 'adhoc') { label = r.text || 'hors parcours (vide)'; sub = 'hors parcours' }
  else if (r.rien) { label = 'skip · non pris' }
  else { label = r.trick || '—'; sub = moduleKind(parcours, r) }
  return (
    <div
      className={`${styles.stackitem} ${idx === fallIdx ? styles.fallen : ''} ${after ? styles.afterFall : ''} ${(r.kind === 'module' && r.rien) ? styles.skip : ''} ${r.draft ? styles.draft : ''}`}
      onClick={() => dispatch({ type: 'goTo', idx })}
    >
      <span className={styles.si}>{idx + 1}</span>
      <span className={`${styles.rdot} ${styles[rate]}`} />
      {side && <span className={styles.lrtag}>{sideLabel(side)}</span>}
      <span className={styles.st}>{label}{idx === fallIdx ? ' ⚠' : ''}</span>
      {sub && <span className={styles.stsub}>{sub}</span>}
    </div>
  )
}
