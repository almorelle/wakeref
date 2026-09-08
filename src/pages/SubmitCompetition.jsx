import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useT } from '../i18n/useT'
import { externalUrl } from '../lib/url'
import SEO from '../components/SEO'
import Icon from '../components/Icon'
import styles from './SubmitCompetition.module.css'

const EMPTY = { name: '', date_text: '', url: '' }

// Valide la saisie BRUTE avant toute normalisation : `externalUrl` préfixe
// `https://` à n'importe quoi, si bien que « pas de lien » devenait
// « https://pas de lien » — accepté par le test de schéma comme par le CHECK en
// base, et stocké en lien mort cliquable. Avec un schéma, il doit être http(s) ;
// sans schéma, il faut au moins quelque chose qui ressemble à un domaine.
const looksLikeUrl = (raw) =>
  /^https?:\/\/\S+$/i.test(raw) ||
  (!/^[a-z][a-z0-9+.-]*:/i.test(raw) && /^[^\s/]+\.[a-z]{2,}(\/\S*)?$/i.test(raw))

export default function SubmitCompetition() {
  const tr = useT()
  const [form, setForm] = useState(EMPTY)
  const [status, setStatus] = useState('idle') // idle | sending | success | tooShort | badUrl | flood | error
  // L'accusé de réception remplace le formulaire : sans ce focus, le clavier
  // repart du haut du document et le lecteur d'écran n'annonce rien.
  const successRef = useRef(null)
  useEffect(() => { if (status === 'success') successRef.current?.focus() }, [status])
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    const name = form.name.trim()
    const dateText = form.date_text.trim()
    // Les CHECK comptent les caractères APRÈS trim ; `minLength` compte avant.
    // Sans ce garde, « ␣␣a␣␣ » partait vers la base et revenait en erreur SQL.
    if (name.length < 2 || dateText.length < 2) { setStatus('tooShort'); return }
    // Le CHECK en base refuse tout ce qui n'est pas http(s) ; on le dit avant
    // l'aller-retour plutôt que de rendre une erreur Postgres brute.
    const rawUrl = form.url.trim()
    if (rawUrl && !looksLikeUrl(rawUrl)) { setStatus('badUrl'); return }
    const url = rawUrl ? externalUrl(rawUrl) : ''
    setStatus('sending')
    const { error, status: httpStatus } = await supabase.from('competition_submissions').insert({
      name, date_text: dateText, url: url || null,
    })
    if (!error) { setStatus('success'); setForm(EMPTY); return }
    // Le trigger de plafond lève un PT429, que PostgREST rend en HTTP 429 :
    // c'est un « réessaie », pas une panne, et le visiteur doit pouvoir faire
    // la différence. Volontairement distinct des CHECK de la table (23514).
    setStatus(httpStatus === 429 || error.code === 'PT429' ? 'flood' : 'error')
  }

  return (
    <div className="page-container">
      <SEO
        titleFr="Proposer une compétition"
        titleEn="Suggest a competition"
        descriptionFr="Une compétition de wakeboard ou wakeskate cable manque au calendrier ? Signale-la en trois champs."
        descriptionEn="A cable wakeboard or wakeskate competition missing from the calendar? Tell us in three fields."
        path="/competitions/proposer"
      />
      <div className={styles.page}>
        <div className={styles.header}>
          <h1 className={styles.title}>{tr.submitComp.title}</h1>
          <p className={styles.sub}>{tr.submitComp.sub}</p>
        </div>

        {status === 'success' ? (
          <div className={styles.success} role="status" tabIndex={-1} ref={successRef}>
            <Icon name="check" size={34} className={styles.successIcon} />
            <p>{tr.submitComp.success}</p>
            <div className={styles.successActions}>
              <button type="button" className="btn btn-ghost" onClick={() => setStatus('idle')}>
                {tr.submitComp.another}
              </button>
              <Link to="/competitions" className="btn btn-ghost">{tr.competitions.title}</Link>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} className={styles.form}>
            <div className="field">
              <label htmlFor="sc-name">{tr.submitComp.name} *</label>
              <input id="sc-name" className="input" required minLength={2} maxLength={160}
                value={form.name} onChange={set('name')} placeholder={tr.submitComp.namePlaceholder} />
            </div>

            <div className="field">
              <label htmlFor="sc-date">{tr.submitComp.date} *</label>
              <input id="sc-date" className="input" required minLength={2} maxLength={80}
                value={form.date_text} onChange={set('date_text')} placeholder={tr.submitComp.datePlaceholder} />
              {/* Champ libre, et c'est voulu : celui qui signale une compétition
                  ne connaît pas toujours les dates exactes. */}
              <p className={styles.hint}>{tr.submitComp.dateHint}</p>
            </div>

            <div className="field">
              <label htmlFor="sc-url">{tr.submitComp.url}</label>
              <input id="sc-url" className="input" type="text" inputMode="url" maxLength={500}
                value={form.url} onChange={set('url')} placeholder="https://…" />
              <p className={styles.hint}>{tr.submitComp.urlHint}</p>
            </div>

            {/* Une seule zone, annoncée : l'échec arrive après un aller-retour
                réseau, hors du champ de vision de qui utilise un lecteur d'écran. */}
            <div role="alert">
                {status === 'tooShort' && <p className={styles.error}>{tr.submitComp.tooShort}</p>}
              {status === 'badUrl' && <p className={styles.error}>{tr.submitComp.badUrl}</p>}
              {status === 'flood'  && <p className={styles.error}>{tr.submitComp.flood}</p>}
              {status === 'error'  && <p className={styles.error}>{tr.submitComp.error}</p>}
            </div>

            <button className="btn btn-primary" type="submit" disabled={status === 'sending'}>
              {status === 'sending' ? tr.submitComp.sending : tr.submitComp.send}
            </button>
            <p className={styles.note}>{tr.submitComp.moderation}</p>
          </form>
        )}
      </div>
    </div>
  )
}
