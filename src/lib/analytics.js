import { createBucket, DAY_HOUR_OFFSET } from './parser.core.js'

export const PAGE_CHARS = 1800

const LOCALE_TAGS = { ru: 'ru-RU', en: 'en-US' }

function localeTag(locale) {
  return LOCALE_TAGS[locale] || locale
}

export function fmt(n, locale = 'en') {
  return Math.round(n).toLocaleString(localeTag(locale))
}

/** `days` — day number (Date.UTC(...) / 864e5). */
export function dstr(days, locale = 'en') {
  return new Date(days * 864e5).toLocaleDateString(localeTag(locale), {
    timeZone: 'UTC',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function pluralize(n, forms) {
  if (forms.length === 3) {
    const mod100 = Math.abs(n) % 100
    const mod10 = mod100 % 10
    if (mod100 > 10 && mod100 < 20) return forms[2]
    if (mod10 > 1 && mod10 < 5) return forms[1]
    if (mod10 === 1) return forms[0]
    return forms[2]
  }
  return Math.abs(n) === 1 ? forms[0] : forms[1]
}

export function spanParts(days) {
  const years = Math.floor(days / 365.25)
  const months = Math.floor((days % 365.25) / 30.44)
  return { years, months, days }
}

/** Hour (any integer, wraps via %24) -> "14:00". */
export function hh(hour) {
  return `${String(((hour % 24) + 24) % 24).padStart(2, '0')}:00`
}

export function calcStats(bucket) {
  const dayKeys = Object.keys(bucket.days).map(Number).sort((a, b) => a - b)

  let best = 0
  let run = 0
  let prevDay = -9
  let streakStart = 0
  let record = 0
  let recordDay = 0

  for (const day of dayKeys) {
    run = day === prevDay + 1 ? run + 1 : 1
    if (run > best) {
      best = run
      streakStart = day - run + 1
    }
    prevDay = day
    if (bucket.days[day] > record) {
      record = bucket.days[day]
      recordDay = day
    }
  }

  const hoursTotal = Array(24).fill(0)
  const weekdayTotal = Array(7).fill(0)
  bucket.hd.forEach((v, i) => {
    hoursTotal[i % 24] += v
    weekdayTotal[Math.floor(i / 24)] += v
  })

  const peakHour = hoursTotal.indexOf(Math.max(...hoursTotal))

  let windowStart = 0
  let windowMax = 0
  for (let s = 0; s < 24; s++) {
    let sum = 0
    for (let i = 0; i < 4; i++) sum += hoursTotal[(s + i) % 24]
    if (sum > windowMax) {
      windowMax = sum
      windowStart = s
    }
  }

  const byYear = {}
  for (const monthKey in bucket.mon) {
    const year = monthKey.slice(0, 4)
    byYear[year] = (byYear[year] || 0) + bucket.mon[monthKey]
  }

  const peakYearEntry = Object.entries(byYear).sort((a, b) => b[1] - a[1])[0]
  const peakMonthEntry = Object.entries(bucket.mon).sort((a, b) => b[1] - a[1])[0]
  const favoriteDay = weekdayTotal.indexOf(Math.max(...weekdayTotal))
  const daysSpan = bucket.last - bucket.first + 1
  const avgLength = bucket.ch / bucket.n
  const mediaShare = (bucket.ph + bucket.vd + bucket.st) / bucket.n

  const partOfDayKey =
    peakHour >= 5 && peakHour < 11 ? 'morning' :
    peakHour >= 11 && peakHour < 17 ? 'afternoon' :
    peakHour >= 17 && peakHour < 23 ? 'evening' : 'night'

  const habitKey =
    bucket.au / bucket.n > 0.1 ? 'voice' :
    mediaShare > 0.2 ? 'visual' :
    avgLength > 90 ? 'novelist' :
    avgLength < 25 ? 'machineGun' : 'chatter'

  return {
    pd: partOfDayKey,
    nn: habitKey,
    best,
    bs: streakStart,
    run,
    rec: record,
    recD: recordDay,
    ph: peakHour,
    ws: windowStart,
    share: windowMax / bucket.n,
    yr: byYear,
    fd: favoriteDay,
    days: daysSpan,
    active: dayKeys.length,
    peakY: peakYearEntry || ['\u2014', 0],
    peakMonthIndex: peakMonthEntry ? +peakMonthEntry[0].slice(5) - 1 : null,
    peakMonthYear: peakMonthEntry ? peakMonthEntry[0].slice(0, 4) : null,
    peakMv: peakMonthEntry ? peakMonthEntry[1] : 0,
    avgLength,
    mediaShare,
  }
}

export function buildBoard(store, pageChars = PAGE_CHARS) {
  const total = store.all.n
  if (!total) return []

  const rows = Object.entries(store.users)
    .sort((a, b) => b[1].n - a[1].n)
    .slice(0, 15)
    .map(([id, user]) => {
      const s = calcStats(user)
      let nightMessages = 0
      user.hd.forEach((v, i) => {
        if (i % 24 < 6) nightMessages += v
      })

      return {
        id,
        name: user.name, // may be null (deleted account) — resolved to a translated placeholder in the UI
        n: user.n,
        share: user.n / total,
        pages: user.ch / pageChars,
        avg: user.ch / user.n,
        ph: s.ph,
        active: s.active,
        best: s.best,
        night: nightMessages / user.n,
        media: (user.ph + user.vd + user.st) / user.n,
        voice: user.au / user.n,
        roles: [], // role keys, e.g. 'mostActive', 'nightOwl'
      }
    })

  const eligible = rows.filter((r) => r.n >= Math.max(20, total * 0.02))
  const assignRole = (key, roleKey, min = 0) => {
    const winner = eligible.filter((r) => r[key] > min).sort((a, b) => b[key] - a[key])[0]
    if (winner) winner.roles.push(roleKey)
  }

  if (eligible.length > 1) {
    assignRole('n', 'mostActive')
    assignRole('night', 'nightOwl', 0.1)
    assignRole('avg', 'mostVerbose')
    assignRole('media', 'mediaLover', 0.05)
    assignRole('voice', 'voiceLover', 0.02)
    assignRole('best', 'longestStreak')
  }

  return rows
}

export function buildAchievements(stats, totalMessages) {
  if (!stats) return []

  const d = stats.days
  const defs = [
    ['yearStreak', d, 365],
    ['threeYearStreak', d, 1095],
    ['fiveYearStreak', d, 1825],
    ['veteran', d, 3650],

    ['dayCentury', stats.rec, 100],
    ['dayRush', stats.rec, 300],
    ['dayThousand', stats.rec, 1000],

    ['weekStreak', stats.best, 7],
    ['monthStreak', stats.best, 30],
    ['hundredStreak', stats.best, 100],
    ['yearRoundStreak', stats.best, 365],

    ['firstThousand', totalMessages, 1e3],
    ['tenThousand', totalMessages, 1e4],
    ['hundredThousand', totalMessages, 1e5],

    ['consistency', stats.active, 100],
    ['halfYearActive', stats.active, 365],
    ['thousandDaysActive', stats.active, 1000],
  ]

  return defs.map(([id, current, target]) => ({ id, c: current, t: target }))
}

export function buildYearSeries(byYear) {
  const years = Object.keys(byYear).sort()
  if (!years.length) return []

  const first = +years[0]
  const last = +years[years.length - 1]

  return Array.from({ length: last - first + 1 }, (_, i) => {
    const year = String(first + i)
    return { year, value: byYear[year] || 0 }
  })
}

export function computeYearBars(series, { containerWidth, maxBarWidth = 46, maxBarHeight = 150 }) {
  const n = series.length
  if (!n) return []

  const max = Math.max(...series.map((s) => s.value), 1)
  const step = containerWidth / n
  const width = Math.min(maxBarWidth, step * 0.68)

  return series.map((s, i) => ({
    year: s.year,
    value: s.value,
    w: width,
    x: i * step + (step - width) / 2,
    h: (s.value / max) * maxBarHeight,
  }))
}

/** Returns a function v -> opacity (0.06..1), normalized against the max value in hd. */
export function heatmapOpacity(hd) {
  const max = Math.max(...hd, 1)
  return (v) => (v ? 0.15 + 0.85 * Math.sqrt(v / max) : 0.06)
}

/** 'YYYY-MM-DD' (as produced by <input type="date">) -> day number, or null. */
export function dayFromIso(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '')
  return m ? Math.floor(Date.UTC(+m[1], +m[2] - 1, +m[3]) / 864e5) : null
}

/** Day number -> 'YYYY-MM-DD'. */
export function isoFromDay(day) {
  return new Date(day * 864e5).toISOString().slice(0, 10)
}

export function normalizeRange(from, to, min, max) {
  let a = Math.min(Math.max(from ?? min, min), max)
  let b = Math.min(Math.max(to ?? max, min), max)
  if (a > b) [a, b] = [b, a]
  return { from: a <= min ? null : a, to: b >= max ? null : b }
}

export function sliceBucket(bucket, from, to, monthOf) {
  const out = createBucket(bucket.name)

  for (const key in bucket.dd) {
    const day = +key
    if (day < from || day > to) continue

    const rec = bucket.dd[key]
    out.n += rec[0]
    out.ch += rec[1]
    out.ph += rec[2]
    out.vd += rec[3]
    out.au += rec[4]
    out.st += rec[5]
    out.rr += rec[6]
    out.rm += rec[7]

    const weekdayBase = ((day + 3) % 7) * 24
    for (let h = 0; h < 24; h++) out.hd[weekdayBase + h] += rec[DAY_HOUR_OFFSET + h]

    out.days[day] = rec[0]
    const monthKey = monthOf(day)
    out.mon[monthKey] = (out.mon[monthKey] || 0) + rec[0]
    if (day < out.first) out.first = day
    if (day > out.last) out.last = day
  }

  out.top = bucket.top ?? null // sparse per-day counts; ranked for the range by `rankTop` & co.
  out.sig = bucket.sig ?? null
  return out
}

function sliceChat(chat, from, to) {
  let n = 0
  let first = Infinity
  let last = 0

  for (const key in chat.days) {
    const day = +key
    if (day < from || day > to) continue
    n += chat.days[key]
    if (day < first) first = day
    if (day > last) last = day
  }

  return n ? { name: chat.name, first, last, n } : null
}

/**
 * `store` — { users, all, list, files, chats }, `range` — { from, to } (nullable).
 * Returns a store-shaped view restricted to the range, plus:
 *   range — the effective (clamped) bounds, always numbers;
 *   full  — true when the range covers all the data (buckets are then passed through untouched).
 */
export function filterStore(store, range) {
  const { first, last } = store.all
  const from = Math.max(range?.from ?? first, first)
  const to = Math.min(range?.to ?? last, last)

  if (from <= first && to >= last) {
    return { users: store.users, all: store.all, list: store.list, files: store.files, chats: store.chats, pairs: store.pairs || [], range: { from: first, to: last }, full: true }
  }

  const monthCache = new Map()
  const monthOf = (day) => {
    let key = monthCache.get(day)
    if (!key) monthCache.set(day, (key = new Date(day * 864e5).toISOString().slice(0, 7)))
    return key
  }

  const users = {}
  for (const id in store.users) {
    const sliced = sliceBucket(store.users[id], from, to, monthOf)
    if (sliced.n) users[id] = sliced
  }

  return {
    users,
    all: sliceBucket(store.all, from, to, monthOf),
    list: store.list.map((c) => sliceChat(c, from, to)).filter(Boolean),
    files: store.files,
    chats: store.chats,
    pairs: store.pairs || [],
    range: { from, to },
    full: false,
  }
}
export function rankTop(bucket, kind, range, limit) {
  const list = bucket?.top?.[kind]
  if (!list) return []

  const rows = []
  for (const e of list) {
    let n = e.n
    if (range) {
      n = 0
      for (let i = 0; i < e.d.length; i++) if (e.d[i] >= range.from && e.d[i] <= range.to) n += e.c[i]
    }
    if (n) rows.push({ key: e.k, n })
  }
  return rows.sort((x, y) => y.n - x.n).slice(0, limit)
}

export function emojiGlyph(key) {
  return key.length === 1 ? key + '\uFE0F' : key // BMP symbols like ❤ need VS16 to render as emoji
}
function sumIn(d, c, range) {
  let n = 0
  for (let i = 0; i < d.length; i++) if (!range || (d[i] >= range.from && d[i] <= range.to)) n += c[i]
  return n
}

export function signatureWords(bucket, allBucket, range, limit = 15) {
  const own = bucket?.ch || 0
  const rest = (allBucket?.ch || 0) - own
  if (!bucket?.sig || own <= 0 || rest <= 0) return []

  const rows = []
  for (const e of bucket.sig) {
    const cu = sumIn(e.d, e.c, range)
    if (cu < 3) continue
    const cr = Math.max(0, sumIn(e.ad, e.ac, range) - cu)
    const ratio = (cu + 1) / own / ((cr + 1) / rest)
    if (ratio >= 1.5) rows.push({ key: e.k, n: cu, ratio, score: Math.log(ratio) * Math.sqrt(cu) })
  }
  return rows.sort((a, b) => b.score - a.score).slice(0, limit)
}

/** Reactions given by a member in `range` (only the ones where Telegram lists the reactor). */
export function reactionsGiven(bucket, range) {
  const g = bucket?.top?.giv
  return g ? sumIn(g.d, g.c, range) : 0
}

/** Most-reacted messages of a bucket that were sent within `range`. */
export function topMessages(bucket, range, limit = 3) {
  const list = bucket?.top?.msgs || []
  return list.filter((m) => !range || (m.day >= range.from && m.day <= range.to)).slice(0, limit)
}

/**
 * Reactor -> author pairs within `range`, grouped by the other side:
 *   side 'a' — who reacts to messages of member `id` (grouped by reactor),
 *   side 'r' — whose messages member `id` reacts to (grouped by author).
 * Returns [{ id, name, n }], busiest first.
 */
export function rankPairs(pairs, range, side, id, limit = 5) {
  const groups = new Map()
  for (const p of pairs || []) {
    if (p[side] !== id) continue
    const n = sumIn(p.d, p.c, range)
    if (!n) continue
    const otherId = side === 'a' ? p.r : p.a
    const name = side === 'a' ? p.rn : p.an
    const g = groups.get(otherId) || { id: otherId, name: null, n: 0 }
    g.n += n
    g.name = g.name || name
    groups.set(otherId, g)
  }
  return [...groups.values()].sort((x, y) => y.n - x.n).slice(0, limit)
}

/** The busiest reactor -> author pairs of the whole chat within `range`: [{ from, fromName, to, toName, n }]. */
export function topPairs(pairs, range, limit = 3) {
  return (pairs || [])
    .map((p) => ({ from: p.r, fromName: p.rn, to: p.a, toName: p.an, n: sumIn(p.d, p.c, range) }))
    .filter((p) => p.n)
    .sort((x, y) => y.n - x.n)
    .slice(0, limit)
}

/**
 * Standout members for the reactions block of the whole-chat view.
 * `view` — filtered store; returns [{ role, id, name, count?, rate? }] (at most 3, distinct where possible).
 */
export function buildReactionRoles(view, range) {
  const total = view.all.n
  const rows = Object.entries(view.users)
    .filter(([, u]) => u.n >= Math.max(20, total * 0.02))
    .map(([id, u]) => ({ id, name: u.name, received: u.rr, rate: u.rr / u.n, given: reactionsGiven(u, range) }))

  if (rows.length < 2) return []

  const roles = []
  const best = (key, exclude = []) => rows.filter((r) => r[key] > 0 && !exclude.includes(r.id)).sort((a, b) => b[key] - a[key])[0]

  const received = best('received')
  if (received) roles.push({ role: 'mostReceived', id: received.id, name: received.name, count: received.received })

  const loved = best('rate', received ? [received.id] : []) || best('rate')
  if (loved) roles.push({ role: 'mostLoved', id: loved.id, name: loved.name, rate: loved.rate * 100 })

  const giver = best('given')
  if (giver) roles.push({ role: 'mostGiving', id: giver.id, name: giver.name, count: giver.given })

  return roles
}
