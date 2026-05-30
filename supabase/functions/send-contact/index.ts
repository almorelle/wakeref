import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const NOTIFY_EMAIL   = Deno.env.get('NOTIFY_EMAIL')!

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const { name, email, message } = await req.json()

  if (!email || !message) {
    return new Response(JSON.stringify({ error: 'Missing fields' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'WakeRef <contact@wakeref.app>',
      to: NOTIFY_EMAIL,
      reply_to: email,
      subject: `Message from ${name || email}`,
      html: `
        <h2>New contact message</h2>
        <table>
          ${name ? `<tr><td><strong>Name</strong></td><td>${name}</td></tr>` : ''}
          <tr><td><strong>Email</strong></td><td><a href="mailto:${email}">${email}</a></td></tr>
          <tr><td><strong>Message</strong></td><td style="white-space:pre-wrap">${message}</td></tr>
        </table>
      `,
    }),
  })

  return new Response(JSON.stringify({ ok: res.ok }), {
    status: res.ok ? 200 : 500,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
