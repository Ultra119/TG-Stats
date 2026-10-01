const DAY = 864e5

const yearOf = (day) => new Date(day * DAY).getUTCFullYear()
const monthOf = (day) => {
  const d = new Date(day * DAY)
  return d.getUTCFullYear() * 12 + d.getUTCMonth()
}
const dayOfUtc = (y, m, d) => Math.floor(Date.UTC(y, m, d) / DAY)

export function pickUnit(from, to) {
  return to - from + 1 >= 730 ? 'year' : 'month'
}

/**
 * "Word of the year" (or of the month on short ranges) and the curve of each
 * leading word over time.
 *
 * Returns null when there is not enough history. Otherwise:
 *   {
 *     unit: 'year' | 'month',
 *     span: { from, to },                       // day numbers, inclusive
 *     bins: [{ from, to }],                     // curve points, inclusive days
 *     periods: [{ i, year, month, from, to, total, leader }],
 *   }
 *   leader: { key, count, lift, curve: number[] (one value per bin) } | null
 */
export function buildWordTrends(
  rows,
  range,
  { minPeriods = 3, minCount = 3, minShare = 0.002, minLift = 1.3 } = {},
) {
  if (!rows?.length || range?.from == null || range?.to == null) return null
  const { from, to } = range
  const unit = pickUnit(from, to)

  // periods
  const of = unit === 'year' ? yearOf : monthOf
  const base = of(from)
  const P = of(to) - base + 1
  if (P < minPeriods) return null

  // curve bins
  const bins = []
  if (unit === 'year') {
    for (let v = monthOf(from); v <= monthOf(to); v++) {
      const y = Math.floor(v / 12)
      const m = v % 12
      bins.push({ from: Math.max(from, dayOfUtc(y, m, 1)), to: Math.min(to, dayOfUtc(y, m + 1, 1) - 1) })
    }
  } else {
    for (let s = from; s <= to; s += 7) bins.push({ from: s, to: Math.min(to, s + 6) })
  }
  const B = bins.length
  const binMonthBase = monthOf(from)
  const binOf = unit === 'year' ? (day) => monthOf(day) - binMonthBase : (day) => Math.floor((day - from) / 7)

  const pMemo = new Map()
  const bMemo = new Map()
  const cached = (memo, fn, day) => {
    let k = memo.get(day)
    if (k === undefined) memo.set(day, (k = fn(day)))
    return k
  }

  const totals = new Array(P).fill(0)
  const binTotals = new Array(B).fill(0)
  const words = []
  for (const row of rows) {
    if (!row.d || !row.c) continue
    const counts = new Array(P).fill(0)
    const binCounts = new Array(B).fill(0)
    let sum = 0
    for (let i = 0; i < row.d.length; i++) {
      const day = row.d[i]
      if (day < from || day > to) continue
      const k = cached(pMemo, (x) => of(x) - base, day)
      const b = cached(bMemo, binOf, day)
      counts[k] += row.c[i]
      binCounts[b] += row.c[i]
      totals[k] += row.c[i]
      binTotals[b] += row.c[i]
      sum += row.c[i]
    }
    if (sum) words.push({ key: row.key, counts, binCounts, sum })
  }
  const all = totals.reduce((a, b) => a + b, 0)
  if (!all) return null

  // leaders
  const candidates = []
  for (const w of words) {
    const overall = w.sum / all
    for (let k = 0; k < P; k++) {
      const count = w.counts[k]
      if (!totals[k] || count < Math.max(minCount, Math.ceil(totals[k] * minShare))) continue
      const lift = count / totals[k] / overall
      if (lift < minLift) continue
      candidates.push({ k, w, count, lift, score: count * Math.log(lift) })
    }
  }
  candidates.sort((a, b) => b.score - a.score)

  const prior = (0.1 * all) / B // "virtual" words per bin pulling a sparse bin to the word's overall share
  const radius = unit === 'year' ? 1 : 2
  const curveOf = (w) => {
    const overall = w.sum / all
    const share = w.binCounts.map((n, b) => (n + prior * overall) / (binTotals[b] + prior))
    const smooth = share.map((_, b) => {
      let sum = 0
      let weight = 0
      for (let k = -radius; k <= radius; k++) {
        const v = share[b + k]
        if (v === undefined) continue
        const wt = radius + 1 - Math.abs(k)
        sum += v * wt
        weight += wt
      }
      return sum / weight
    })
    const peak = Math.max(...smooth, 2 * overall) || 1
    return smooth.map((v) => v / peak)
  }

  const leaders = new Array(P).fill(null)
  const used = new Set()
  for (const c of candidates) {
    if (leaders[c.k] || used.has(c.w.key)) continue
    used.add(c.w.key)
    leaders[c.k] = { key: c.w.key, count: c.count, lift: c.lift, curve: curveOf(c.w) }
  }
  if (!leaders.some(Boolean)) return null

  const periods = leaders.map((leader, i) => {
    const v = base + i
    const year = unit === 'year' ? v : Math.floor(v / 12)
    const month = unit === 'year' ? null : v % 12
    const start = unit === 'year' ? dayOfUtc(year, 0, 1) : dayOfUtc(year, month, 1)
    const end = unit === 'year' ? dayOfUtc(year + 1, 0, 1) - 1 : dayOfUtc(year, month + 1, 1) - 1
    return { i, year, month, from: Math.max(from, start), to: Math.min(to, end), total: totals[i], leader }
  })
  return { unit, span: { from, to }, bins, periods }
}
