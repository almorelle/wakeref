import { useState } from 'react'
import { useT } from '../i18n/useT'
import styles from './Contact.module.css'
import SEO from '../components/SEO'
import Icon from '../components/Icon'

const FORMSPREE_ID = 'xykvggzg'

export default function Contact() {
  const tr = useT()
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const [status, setStatus] = useState('idle') // idle | sending | success | error

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const submit = async (e) => {
    e.preventDefault()
    setStatus('sending')
    try {
      const res = await fetch(`https://formspree.io/f/${FORMSPREE_ID}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        setStatus('success')
        setForm({ name: '', email: '', message: '' })
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    }
  }

  return (
    <div className="page-container">
      <div className={styles.page}>
      <SEO
        titleFr="Contact"
        titleEn="Contact"
        descriptionFr="Une question ou une suggestion ? Contacte-moi."
        descriptionEn="A question or suggestion? Get in touch."
        path="/contact"
      />
        <div className={styles.header}>
          <h1 className={styles.title}>{tr.contactTitle}</h1>
          <p className={styles.sub}>{tr.contactSub}</p>
        </div>

        {status === 'success' ? (
          <div className={styles.success}>
            <Icon name="check" style={{ fontSize: 36, color: 'var(--c-success)' }} />
            <p>{tr.contactSuccess}</p>
          </div>
        ) : (
          <form onSubmit={submit} className={styles.form}>
            <div className="field">
              <label>{tr.contactName}</label>
              <input
                className="input"
                type="text"
                placeholder={tr.contactNamePh}
                value={form.name}
                onChange={e => set('name', e.target.value)}
              />
            </div>
            <div className="field">
              <label>{tr.contactEmail} *</label>
              <input
                className="input"
                type="email"
                required
                placeholder="votre@email.com"
                value={form.email}
                onChange={e => set('email', e.target.value)}
              />
            </div>
            <div className="field">
              <label>{tr.contactMessage} *</label>
              <textarea
                className="input"
                rows={5}
                required
                placeholder={tr.contactMessagePh}
                value={form.message}
                onChange={e => set('message', e.target.value)}
                style={{ resize: 'vertical' }}
              />
            </div>
            {status === 'error' && (
              <p className={styles.error}>{tr.contactError}</p>
            )}
            <button
              type="submit"
              className="btn btn-primary"
              disabled={status === 'sending'}
              style={{ alignSelf: 'flex-end' }}
            >
              {status === 'sending'
                ? <><Icon name="loader-2" className="spin" /> {tr.contactSending}</>
                : <><Icon name="send" /> {tr.contactSend}</>
              }
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
