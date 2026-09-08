import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const NOTIFY_EMAIL   = Deno.env.get('NOTIFY_EMAIL')
// Secret partagé avec le webhook Supabase. `verify_jwt` ne protège rien ici :
// il est satisfait par la clé anon, qui est publique par construction. Sans ce
// contrôle, la fonction est un relais de mail ouvert — on poste directement le
// payload de son choix, sans passer par la table, donc sans les CHECK ni le
// plafond de débit. Le webhook doit envoyer l'en-tête `x-wakeref-hook`.
const HOOK_SECRET = Deno.env.get('WAKEREF_HOOK_SECRET')

// Échappe le HTML : ces champs viennent d'un formulaire public, sans compte ni
// modération préalable. Sans ça, une proposition contenant du balisage
// arriverait interprétée dans la boîte mail de l'admin.
const esc = (v: unknown) =>
  String(v ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;')

// La clé anon est publique : n'importe qui peut appeler cette fonction
// directement, sans passer par la table — donc sans le CHECK `^https?://` ni le
// plafond de débit. On re-valide ici plutôt que de faire confiance au payload.
const safeHref = (v: unknown) => {
  const s = String(v ?? '').trim()
  return /^https?:\/\//i.test(s) ? s : ''
}

serve(async (req) => {
  if (!RESEND_API_KEY || !NOTIFY_EMAIL || !HOOK_SECRET) {
    // Échec bruyant plutôt que silencieux : une clé absente ou tournée ferait
    // disparaître toutes les notifications sans laisser de trace.
    console.error('config manquante', {
      resend: !!RESEND_API_KEY, notify: !!NOTIFY_EMAIL, hook: !!HOOK_SECRET,
    })
    return new Response(JSON.stringify({ ok: false, reason: 'misconfigured' }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    })
  }
  if (req.headers.get('x-wakeref-hook') !== HOOK_SECRET) {
    return new Response(JSON.stringify({ ok: false, reason: 'forbidden' }), {
      status: 403, headers: { 'Content-Type': 'application/json' },
    })
  }

  let sub: Record<string, unknown>
  try {
    const payload = await req.json()
    sub = payload?.record
    if (!sub || typeof sub !== 'object') throw new Error('no record')
  } catch {
    // Corps illisible, ou événement autre qu'un INSERT (un DELETE n'envoie
    // qu'`old_record`) : rien à notifier, et surtout rien à faire échouer.
    return new Response(JSON.stringify({ ok: false, reason: 'bad payload' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    })
  }

  const href = safeHref(sub.url)

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'WakeRef <notifications@wakeref.app>',
      to: NOTIFY_EMAIL,
      subject: '🏁 Nouvelle compétition proposée sur WakeRef',
      html: `
        <h2>Nouvelle compétition proposée</h2>
        <table>
          <tr><td><strong>Nom</strong></td><td>${esc(sub.name)}</td></tr>
          <tr><td><strong>Dates</strong></td><td>${esc(sub.date_text)}</td></tr>
          ${href ? `<tr><td><strong>Lien</strong></td><td><a href="${esc(href)}">${esc(href)}</a></td></tr>` : ''}
        </table>
        <p><a href="https://wakeref.app/admin/competition-submissions">Voir dans l'admin →</a></p>
      `,
    }),
  })

  // Sans ça, un rejet de Resend (domaine non vérifié, quota) ne laisse aucune
  // trace exploitable dans les logs de la fonction.
  if (!res.ok) console.error('resend', res.status, await res.text())

  return new Response(JSON.stringify({ ok: res.ok }), {
    status: res.ok ? 200 : 500,
    headers: { 'Content-Type': 'application/json' },
  })
})
