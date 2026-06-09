// Maps informal/long terms to the canonical search term expected by the RPC.
// Multi-word values (e.g. 'back roll') are handled by plainto_tsquery (AND logic).
const WORD_MAP = {
  // Direction — long forms
  toeside:   'ts',
  toe:       'ts',
  heelside:  'hs',
  heel:      'hs',
  backside:  'bs',
  frontside: 'fs',

  // Direction — abbreviations (recognized by tokenizer, pass-through)
  ts: 'ts',
  hs: 'hs',
  bs: 'bs',
  fs: 'fs',
  sw: 'sw',

  // Trick name variants / compound abbreviations
  sbend:    's-bend',    // S-Bend (hyphen in DB name)
  backroll: 'back roll', // Back Roll (two words; plainto_tsquery ANDs them)
  broll: 'back roll',    // Back Roll
  shuv:     'shove',     // Shove-It
  shoveit:  'shove',     // Shove-It
  md:       'moby',      // Moby Dick / Moby Dick 5
  mobe:     'mobe',      // Mobe / Mobe 5
  dd:       'dum',       // Dum Dum / Dum Dum 5
}

// Sorted by length descending for greedy longest-match tokenization
const KNOWN_WORDS = Object.keys(WORD_MAP).sort((a, b) => b.length - a.length)

// Applied only when parsing multi-token concatenated queries (e.g. tb3, md5)
const SINGLE_CHAR_MAP = {
  t: 'ts',
  h: 'hs',
  b: 'bs',
  f: 'fs',
}

function tokenize(raw) {
  const q = raw.trim().toLowerCase()
  if (!q) return []

  // Space-separated: treat each word independently
  if (q.includes(' ')) return q.split(/\s+/).filter(Boolean)

  // Pure alphanumeric: greedy longest-match against known words, then digits, then single chars
  if (/^[a-z0-9]+$/.test(q)) {
    const tokens = []
    let i = 0
    let matchedKnownWord = false
    while (i < q.length) {
      let matched = false
      for (const word of KNOWN_WORDS) {
        if (q.startsWith(word, i)) {
          tokens.push(word)
          i += word.length
          matched = true
          matchedKnownWord = true
          break
        }
      }
      if (matched) continue

      if (/\d/.test(q[i])) {
        let j = i
        while (j < q.length && /\d/.test(q[j])) j++
        tokens.push(q.slice(i, j))
        i = j
        continue
      }

      tokens.push(q[i])
      i++
    }
    // No known abbreviation matched and no digits: it's a literal trick name, pass through as-is.
    // (Digits signal an abbreviation pattern like "tb3"; without them, char-by-char splits are wrong.)
    if (!matchedKnownWord && !/\d/.test(q)) return [q]
    return tokens
  }

  // Contains special chars (hyphens, etc.): pass through as a single token
  return [q]
}

// Expand a raw query into a list of normalized search terms for the RPC.
export function expandQuery(raw) {
  const tokens = tokenize(raw)
  const isMulti = tokens.length > 1
  const terms = tokens.map(tok => {
    const t = tok.toLowerCase()
    return WORD_MAP[t] ?? (isMulti ? SINGLE_CHAR_MAP[t] : undefined) ?? t
  }).filter(Boolean)
  return [...new Set(terms)]
}
