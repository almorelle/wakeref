// Normalize a user-provided URL for use as an external href.
// Bare domains (e.g. "www.example.com") would otherwise be treated as a
// relative path by the browser, leading to a 404. Prepend https:// when no
// protocol is present.
//
// Pass { ref: true } to tag the URL with UTM params so the destination's
// analytics can attribute the visit to WakeRef. Combine this with dropping
// rel="noreferrer" on the link so the Referer header is sent too.
export function externalUrl(url, { ref = false } = {}) {
  if (!url) return url
  const full = url.includes('://') ? url : `https://${url}`
  if (!ref) return full
  try {
    const u = new URL(full)
    u.searchParams.set('utm_source', 'wakeref')
    u.searchParams.set('utm_medium', 'referral')
    return u.toString()
  } catch {
    return full
  }
}
