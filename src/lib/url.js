// Normalize a user-provided URL for use as an external href.
// Bare domains (e.g. "www.example.com") would otherwise be treated as a
// relative path by the browser, leading to a 404. Prepend https:// when no
// protocol is present.
export function externalUrl(url) {
  if (!url) return url
  return url.includes('://') ? url : `https://${url}`
}
