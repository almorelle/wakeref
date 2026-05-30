import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const NOTIFY_EMAIL   = Deno.env.get('NOTIFY_EMAIL')!

serve(async (req) => {
  const payload = await req.json()
  const sub = payload.record

  const figureInfo = sub.figure_id ? `Trick ID: ${sub.figure_id}` : 'No trick specified'
  const creatorInfo = sub.creator_name
    ? `${sub.creator_name}${sub.creator_url ? ` — ${sub.creator_url}` : ''}`
    : 'Anonymous'

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'WakeRef <notifications@wakeref.app>',
      to: NOTIFY_EMAIL,
      subject: '📹 New video submission on WakeRef',
      html: `
        <h2>New video submission</h2>
        <table>
          <tr><td><strong>Trick</strong></td><td>${figureInfo}</td></tr>
          <tr><td><strong>URL</strong></td><td><a href="${sub.source_url}">${sub.source_url}</a></td></tr>
          ${sub.title ? `<tr><td><strong>Title</strong></td><td>${sub.title}</td></tr>` : ''}
          <tr><td><strong>Creator</strong></td><td>${creatorInfo}</td></tr>
          ${sub.caption ? `<tr><td><strong>Caption</strong></td><td>${sub.caption}</td></tr>` : ''}
        </table>
        <p><a href="https://wakeref.app/admin/submissions">Review in admin →</a></p>
      `,
    }),
  })

  return new Response(JSON.stringify({ ok: res.ok }), {
    status: res.ok ? 200 : 500,
    headers: { 'Content-Type': 'application/json' },
  })
})
