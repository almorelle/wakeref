import { useEffect, useRef, useState } from 'react'
import { zonesOnly } from '../../lib/competition/model'
import { order2, orderFor } from '../../lib/competition/heatStore'
import { micSupported } from '../../lib/competition/voice'
import { loadWhisper, isWhisperLoaded } from '../../lib/whisperStt'
import {
  scoreVal, bestScore, allScored, runNotes, riderNotes,
  jibSummary, anyRun2Touched,
} from '../../lib/competition/runModel'
import styles from './HeatTab.module.css'

// Onglet Heat : matrice de résultats (lignes = sections, colonnes = riders),
// classement live, notes FRS/DNS, gestion des riders. Port de renderPoule (proto).
export default function HeatTab({ state, dispatch, toast }) {
  const { riders, runCount, matrixMode, run2Order } = state
  const [pendingDel, setPendingDel] = useState(null)
  const delTimer = useRef(null)
  const focusRider = useRef(null)

  // ajout d'un rider → focus auto sur son champ nom
  const addRider = () => { focusRider.current = riders.length; dispatch({ type: 'addRider' }) }
  useEffect(() => {
    if (focusRider.current == null) return
    const el = document.querySelector(`[data-rn="${focusRider.current}"]`)
    if (el) { el.focus(); el.select() }
    focusRider.current = null
  })

  const removeRider = (i) => {
    if (pendingDel !== i) {
      setPendingDel(i)
      clearTimeout(delTimer.current)
      delTimer.current = setTimeout(() => setPendingDel(null), 2500)
      return
    }
    clearTimeout(delTimer.current); setPendingDel(null)
    const nm = riders[i] ? riders[i].name : ''
    dispatch({ type: 'removeRider', index: i })
    toast(`Rider « ${nm} » supprimé`, 'info')
  }

  const setRunCount = (n) => {
    if (n === runCount) return
    if (n === 1 && anyRun2Touched(riders)) { toast('Un rider a déjà un 2e run rempli — vide-le d’abord (onglet Run → Run 2 → Vider ce run).', 'error'); return }
    dispatch({ type: 'setRunCount', n })
  }

  const scored = allScored(riders, runCount)
  const saveHeat = () => { if (scored) toast('Sauvegarde du heat — persistance à venir.', 'success') }

  return (
    <div className={styles.wrap}>
      <div className={styles.mtitle}>
        <div className={styles.mtLeft}>
          <h2 className={styles.h2}>Heat</h2>
          <input
            className={styles.heatName}
            placeholder="Nom du heat (optionnel)"
            value={state.heatName}
            onChange={(e) => dispatch({ type: 'setHeatName', value: e.target.value })}
          />
          <div className={styles.runcount}>
            <span>Runs</span>
            <button className={runCount === 1 ? styles.on : ''} disabled={anyRun2Touched(riders)} onClick={() => setRunCount(1)}>1</button>
            <button className={runCount === 2 ? styles.on : ''} onClick={() => setRunCount(2)}>2</button>
          </div>
        </div>

        {runCount > 1 && (
          <div className={styles.matrixmode}>
            <button className={matrixMode === 'split' ? styles.on : ''} onClick={() => matrixMode !== 'split' && dispatch({ type: 'setMatrixMode' })}>2 tableaux</button>
            <button className={matrixMode === 'stacked' ? styles.on : ''} onClick={() => matrixMode !== 'stacked' && dispatch({ type: 'setMatrixMode' })}>compacte</button>
          </div>
        )}

        <div className={styles.mtRight}>
          <button className="btn btn-ghost btn-sm" disabled={!scored} onClick={saveHeat}>💾 Sauvegarder le heat</button>
          <button className="btn btn-primary btn-sm" onClick={addRider}>＋ Ajouter un rider</button>
        </div>
      </div>

      {micSupported && <VoicePreload />}

      <Ranking riders={riders} runCount={runCount} />

      {riders.length === 0 ? (
        <p className={styles.empty}>Aucun rider — ajoute des riders ci-dessus.</p>
      ) : (
        <div className={styles.poulewrap}>
          {runCount > 1 && matrixMode === 'split' ? (
            <>
              <div className={styles.runtable}>
                <div className={styles.rtlabel}><span className={styles.runtag}>R1</span> Run 1</div>
                <RunTable ru={0} state={state} dispatch={dispatch} pendingDel={pendingDel} removeRider={removeRider} />
              </div>
              <div className={styles.runtable}>
                <div className={styles.rtlabel}>
                  <span className={styles.runtag}>R2</span> Run 2
                  <span className={styles.ord2ctrl}>
                    <button className={`${styles.ord2} ${run2Order ? '' : styles.on}`} onClick={() => dispatch({ type: 'resetRun2Order' })}>natural order</button>
                    <button className={`${styles.ord2} ${run2Order ? styles.on : ''}`} onClick={() => dispatch({ type: 'reverseRun2' })}>reverse order</button>
                  </span>
                </div>
                <RunTable ru={1} state={state} dispatch={dispatch} pendingDel={pendingDel} removeRider={removeRider} />
              </div>
            </>
          ) : matrixMode === 'split' ? (
            <RunTable ru={0} state={state} dispatch={dispatch} pendingDel={pendingDel} removeRider={removeRider} />
          ) : (
            <StackedTable state={state} dispatch={dispatch} pendingDel={pendingDel} removeRider={removeRider} />
          )}
        </div>
      )}
    </div>
  )
}

// ── préchargement des modèles voix ─────────────────────────────────────────────
// Le download (poids HF) + warmup se paient ici, AVANT la manche. Le cache de
// `loadWhisper` est global → un modèle préchargé dans le Heat est prêt dans le Run.
const VOICE_MODELS = [
  { key: 'wakeref', label: 'tricks' },
  { key: 'wakerefJib', label: 'jib' },
]

function VoicePreload() {
  const initial = () => Object.fromEntries(VOICE_MODELS.map((m) => [m.key, { st: isWhisperLoaded(m.key) ? 'ready' : 'idle', pct: 0 }]))
  const [models, setModels] = useState(initial)

  const set = (key, patch) => setModels((m) => ({ ...m, [key]: { ...m[key], ...patch } }))

  const load = (key) => {
    const cur = models[key].st
    if (cur === 'loading' || cur === 'ready') return
    set(key, { st: 'loading', pct: 0 })
    loadWhisper(key, (e) => { if (e && e.progress != null) set(key, { pct: Math.round(e.progress) }) })
      .then(() => set(key, { st: 'ready', pct: 100 }))
      .catch(() => set(key, { st: 'error' }))
  }

  return (
    <div className={styles.voice}>
      <span className={styles.voiceLab}>🎙️ Modèles voix</span>
      {VOICE_MODELS.map(({ key, label }) => {
        const { st, pct } = models[key]
        return (
          <button
            key={key}
            type="button"
            className={styles.voiceBtn}
            data-state={st}
            disabled={st === 'loading' || st === 'ready'}
            onClick={() => load(key)}
          >
            {st === 'loading' && <span className={styles.voiceBar} style={{ width: `${pct}%` }} />}
            <span className={styles.voiceTxt}>
              {st === 'ready' ? `✓ ${label} prêt`
                : st === 'loading' ? `${label} ${pct}%`
                  : st === 'error' ? `↻ ${label} (échec)`
                    : `⤓ Précharger ${label}`}
            </span>
          </button>
        )
      })}
    </div>
  )
}

// ── classement live ────────────────────────────────────────────────────────────
function Ranking({ riders, runCount }) {
  const fmt = (v) => (Number.isInteger(v) ? String(v) : v.toFixed(1))
  const scored = riders.map((r, i) => ({ i, r, s: bestScore(r, runCount) })).filter((x) => x.s != null).sort((a, b) => b.s - a.s)
  const waiting = riders.filter((r) => bestScore(r, runCount) == null)
  if (!scored.length) {
    return <div className={styles.ranking}><div className={styles.rkempty}>Classement — pose des notes pour le voir se former.</div></div>
  }
  return (
    <div className={styles.ranking}>
      <div className={styles.rklabel}>classement live</div>
      <div className={styles.rkrow}>
        {scored.map((x, pos) => (
          <div key={x.r.id} className={`${styles.rkchip} ${pos === 0 ? styles.lead : ''}`}>
            <span className={styles.rkpos}>{pos + 1}</span>
            <span className={styles.rkname}>{x.r.name}</span>
            <span className={styles.rksc}>{fmt(x.s)}</span>
          </div>
        ))}
      </div>
      {waiting.length > 0 && <div className={styles.rkwait}>en attente de note : {waiting.map((r) => r.name).join(', ')}</div>}
    </div>
  )
}

// ── cellules ─────────────────────────────────────────────────────────────────
function PosTag({ s }) { return s ? <span className={`${styles.pos} ${styles[`pos-${s}`]}`}>{s}</span> : null }

function CellModule({ row }) {
  if (!row) return <span className={styles.blank}>·</span>
  const fall = row.fell ? <div className={styles.cellFall}>⚠ chute</div> : null
  const dc = row.draft ? ` ${styles.draft}` : ''
  if (row.rien) return <>{<span className={`${styles.skip}${dc}`}>—</span>}{fall}</>
  if (!row.trick && !row.chips) return fall || <span className={styles.blank}>·</span>
  const isJib = !!row.chips
  const label = isJib ? jibSummary(row.chips) : row.trick
  const sub = isJib ? 'jib' : (row.approach || '')
  return (
    <>
      <div className={`${styles.mtrick} ${styles[row.rate]}${dc}`}>
        <span className={`${styles.rdotM} ${styles[row.rate]}`} /><span className={styles.tn}>{label}</span><PosTag s={row.side} />
      </div>
      {sub && <div className={styles.msub}>{sub}</div>}
      {fall}
    </>
  )
}

function CellAir({ row }) {
  const fall = row && row.fell ? <div className={styles.cellFall}>⚠ chute</div> : null
  if (!row || !row.airs || !row.airs.length) return fall || <span className={styles.blank}>·</span>
  return (
    <>
      <div className={styles.cell}>
        {row.airs.map((a, i) => (
          <div key={i} className={`${styles.mtrick} ${styles[a.rate]}${a.draft ? ` ${styles.draft}` : ''}`}>
            <span className={`${styles.rdotM} ${styles[a.rate]}`} /><span className={styles.tn}>{a.name}</span><PosTag s={a.side} />
          </div>
        ))}
      </div>
      {fall}
    </>
  )
}

function AdhocTrick({ row }) {
  return (
    <div className={`${styles.mtrick} ${styles[row.rate]}${row.draft ? ` ${styles.draft}` : ''}`}>
      <span className={`${styles.rdotM} ${styles[row.rate]}`} /><span className={styles.tn}>{row.text || 'hors parcours'}</span><PosTag s={row.side} />
    </div>
  )
}

function SecBadges({ sec }) {
  const pass = sec.passOf != null ? <span className={`${styles.sbadge} ${styles.pass}`}>↺ 2e passage</span> : null
  if (sec.type === 'air') return <div className={styles.secslot}><span className={`${styles.sbadge} ${styles.air}`}>blocage</span>{pass}</div>
  const slot = (m, side) => (m
    ? <div className={styles.secslot}><span className={`${styles.sbadge} ${styles[m.kind]}`}>{m.kind === 'kicker' ? 'kicker' : (m.label || 'jib')}</span><span className={`${styles.pos} ${styles[`pos-${side}`]}`}>{side}</span></div>
    : <div className={`${styles.secslot} ${styles.empty}`} />)
  return <>{slot(sec.int, 'int')}{slot(sec.ext, 'ext')}{pass && <div className={styles.secslot}>{pass}</div>}</>
}

// champ note d'un run (input + FRS + DNS)
function ScoreCell({ state, dispatch, index, k, label }) {
  const r = state.riders[index]
  const v = (r.score && r.score[k] != null) ? r.score[k] : ''
  return (
    <div className={styles.scoreblock}>
      <span className={styles.sl}>{label || 'note'}</span>
      <input className={styles.scoreinp} value={v} placeholder="–" inputMode="text" onChange={(e) => dispatch({ type: 'setScore', index, k, value: e.target.value })} />
      {k >= 1 && <button className={styles.frsbtn} onClick={() => dispatch({ type: 'setFRS', index, k })}>FRS</button>}
      <button className={`${styles.frsbtn} ${styles.dns}`} title="Did Not Start — run entier en skip, note 0" onClick={() => dispatch({ type: 'markDNS', index, k })}>DNS</button>
    </div>
  )
}

// adhoc ancrés : par colonne, rangés avant la 1re zone suivante portant un secId (sinon 'end').
function anchorAdhocs(riders, cols, ru) {
  const byAnchor = {}
  cols.forEach((ri) => {
    const rows = riders[ri].runs[ru]; if (!rows) return
    rows.forEach((row, j) => {
      if (row.kind !== 'adhoc') return
      let anchor = 'end'
      for (let k = j + 1; k < rows.length; k += 1) { if (rows[k].secId != null) { anchor = rows[k].secId; break } }
      ;(byAnchor[anchor] = byAnchor[anchor] || []).push({ ri, row })
    })
  })
  return byAnchor
}

// ── vue « 2 tableaux » : un tableau par run ──
function RunTable({ ru, state, dispatch, pendingDel, removeRider }) {
  const { riders } = state
  const cols = orderFor(state, ru)
  const byAnchor = anchorAdhocs(riders, cols, ru)

  const adhocRow = (anchor, list) => (
    <tr key={`adhoc-${anchor}`} className={styles.adhocrow}>
      <th className={styles.sech}><div className={styles.secname}><span className={`${styles.sbadge} ${styles.adhoc}`}>+</span> hors parcours</div></th>
      {cols.map((ri) => {
        const mine = list.filter((a) => a.ri === ri)
        return <td key={riders[ri].id}>{mine.length ? <div className={styles.cell}>{mine.map((a, i) => <AdhocTrick key={i} row={a.row} />)}</div> : <span className={styles.blank}>·</span>}</td>
      })}
    </tr>
  )

  return (
    <table className={styles.matrix}>
      <thead>
        <tr>
          <th className={`${styles.corner} ${styles.sech}`} />
          {cols.map((i, pos) => {
            const r = riders[i]; const rows = r.runs[ru]
            const fell = !!(rows && rows.some((x) => x.fell)); const saved = !!(r.saved && r.saved[ru])
            return (
              <th key={r.id} className={styles.rider}>
                <div className={styles.rhead}>
                  <div>
                    <div className={styles.rn}><span className={styles.rnum}>{i + 1}.</span>{' '}
                      <input className={styles.rnameInp} data-rn={i} value={r.name} aria-label="nom du rider" onChange={(e) => dispatch({ type: 'renameRider', index: i, name: e.target.value })} />
                    </div>
                    <div className={styles.rmeta}>{runNotes(rows)} notés{fell && <> · <span style={{ color: 'var(--c-danger)' }}>chute</span></>}{saved && <> · <span style={{ color: 'var(--c-success)' }}>✓</span></>}</div>
                    <ScoreCell state={state} dispatch={dispatch} index={i} k={ru} />
                    {ru === 1 && (
                      <div className={styles.passage}>
                        <button className={styles.pmv} disabled={pos === 0} onClick={() => dispatch({ type: 'moveRun2', pos, delta: -1 })}>‹</button>
                        <span>passage {pos + 1}</span>
                        <button className={styles.pmv} disabled={pos === cols.length - 1} onClick={() => dispatch({ type: 'moveRun2', pos, delta: 1 })}>›</button>
                      </div>
                    )}
                    <div className={styles.judgeBtns}><button className={styles.judgebtn} onClick={() => dispatch({ type: 'loadRun', index: i, ru })}>⚖ Juger ce run</button></div>
                  </div>
                  <div className={styles.rhctrls}>{ru === 0 && <DelBtn i={i} pendingDel={pendingDel} removeRider={removeRider} />}</div>
                </div>
              </th>
            )
          })}
        </tr>
      </thead>
      <tbody>
        {zonesOnly(state.parcours).flatMap((sec) => {
          const rowsOut = []
          if (byAnchor[sec.id]) rowsOut.push(adhocRow(sec.id, byAnchor[sec.id]))
          const isAir = sec.type === 'air'
          rowsOut.push(
            <tr key={sec.id} className={isAir ? styles.airrow : ''}>
              <th className={styles.sech}><SecBadges sec={sec} /></th>
              {cols.map((ri) => {
                const rows = riders[ri].runs[ru]; const row = rows ? rows.find((x) => x.secId === sec.id) : null
                return <td key={riders[ri].id} className={row && row.fell ? styles.fellTd : ''}>{isAir ? <CellAir row={row} /> : <CellModule row={row} />}</td>
              })}
            </tr>,
          )
          return rowsOut
        })}
        {byAnchor.end && adhocRow('end', byAnchor.end)}
      </tbody>
    </table>
  )
}

// ── vue « empilée » : R1/R2 dans la même case ──
function StackedTable({ state, dispatch, pendingDel, removeRider }) {
  const { riders, runCount } = state
  const runlines = (render) => Array.from({ length: runCount }, (_, k) => (
    <div key={k} className={styles.runline}>{runCount > 1 && <span className={styles.runtag}>R{k + 1}</span>}<div className={styles.rlbody}>{render(k)}</div></div>
  ))

  const byAnchor = {}
  riders.forEach((rider, ri) => {
    for (let ru = 0; ru < runCount; ru += 1) {
      const rows = rider.runs[ru]; if (!rows) continue
      rows.forEach((row, j) => {
        if (row.kind !== 'adhoc') return
        let anchor = 'end'
        for (let k = j + 1; k < rows.length; k += 1) { if (rows[k].secId != null) { anchor = rows[k].secId; break } }
        ;(byAnchor[anchor] = byAnchor[anchor] || []).push({ ri, ru, row })
      })
    }
  })

  const adhocRow = (anchor, list) => (
    <tr key={`adhoc-${anchor}`} className={styles.adhocrow}>
      <th className={styles.sech}><div className={styles.secname}><span className={`${styles.sbadge} ${styles.adhoc}`}>+</span> hors parcours</div></th>
      {riders.map((rider, ri) => (
        <td key={rider.id}>{runlines((k) => { const es = list.filter((a) => a.ri === ri && a.ru === k); return es.length ? es.map((a, i) => <AdhocTrick key={i} row={a.row} />) : <span className={styles.blank}>·</span> })}</td>
      ))}
    </tr>
  )

  return (
    <table className={styles.matrix}>
      <thead>
        <tr>
          <th className={`${styles.corner} ${styles.sech}`} />
          {riders.map((r, i) => {
            const anyFall = r.runs.some((rows, k) => k < runCount && rows && rows.some((x) => x.fell))
            return (
              <th key={r.id} className={styles.rider}>
                <div className={styles.rhead}>
                  <div>
                    <div className={styles.rn}><span className={styles.rnum}>{i + 1}.</span>{' '}
                      <input className={styles.rnameInp} data-rn={i} value={r.name} aria-label="nom du rider" onChange={(e) => dispatch({ type: 'renameRider', index: i, name: e.target.value })} />
                    </div>
                    <div className={styles.rmeta}>{riderNotes(r, runCount)} notés{anyFall && <> · <span style={{ color: 'var(--c-danger)' }}>chute</span></>}</div>
                    {Array.from({ length: runCount }, (_, k) => <ScoreCell key={k} state={state} dispatch={dispatch} index={i} k={k} label={runCount > 1 ? `R${k + 1}` : 'note'} />)}
                    <div className={styles.judgeBtns}>
                      {Array.from({ length: runCount }, (_, k) => <button key={k} className={styles.judgebtn} onClick={() => dispatch({ type: 'loadRun', index: i, ru: k })}>⚖ Juger {runCount > 1 ? `run ${k + 1}` : 'ce run'}</button>)}
                    </div>
                  </div>
                  <div className={styles.rhctrls}><DelBtn i={i} pendingDel={pendingDel} removeRider={removeRider} /></div>
                </div>
              </th>
            )
          })}
        </tr>
      </thead>
      <tbody>
        {zonesOnly(state.parcours).flatMap((sec) => {
          const rowsOut = []
          if (byAnchor[sec.id]) rowsOut.push(adhocRow(sec.id, byAnchor[sec.id]))
          const isAir = sec.type === 'air'
          rowsOut.push(
            <tr key={sec.id} className={isAir ? styles.airrow : ''}>
              <th className={styles.sech}><SecBadges sec={sec} /></th>
              {riders.map((rider) => {
                const anyFell = rider.runs.some((rows, k) => k < runCount && rows && (rows.find((x) => x.secId === sec.id) || {}).fell)
                return (
                  <td key={rider.id} className={anyFell ? styles.fellTd : ''}>
                    {runlines((k) => { const rows = rider.runs[k]; if (!rows) return <span className={styles.blank}>·</span>; const row = rows.find((x) => x.secId === sec.id); return isAir ? <CellAir row={row} /> : <CellModule row={row} /> })}
                  </td>
                )
              })}
            </tr>,
          )
          return rowsOut
        })}
        {byAnchor.end && adhocRow('end', byAnchor.end)}
      </tbody>
    </table>
  )
}

function DelBtn({ i, pendingDel, removeRider }) {
  const armed = pendingDel === i
  return <button className={`${styles.rhbtn} ${styles.del} ${armed ? styles.armed : ''}`} title={armed ? 'confirmer la suppression' : 'supprimer'} onClick={() => removeRider(i)}>{armed ? 'sûr ?' : '✕'}</button>
}
