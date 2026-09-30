export const DAY_HOUR_OFFSET = 8
export const DAY_LEN = DAY_HOUR_OFFSET + 24

export const TOP_WORDS = 150 // kept per bucket (full-period ranking); the UI shows fewer
export const TOP_EMOJI = 60
export const TOP_USERS = 30 // only the busiest members get their own word/emoji/reaction stats
const SIG_LIMIT = 25 // signature-word candidates kept per member
const SIG_MIN_COUNT = 4 // a word must be used at least this many times by the member (whole period)
const SIG_MIN_MESSAGES = 30 // members with fewer messages get no signature words
const PAIR_LIMIT = 300 // reactor -> author pairs kept
const MSG_LIMIT = 8 // most-reacted messages kept per bucket
const PREVIEW_LEN = 140

const STOP = new Set(
  `это как так что чтобы или для при над под про без нет вот было были была был будет будто есть уже еще ещё
   его ее её они она оно мне меня мной тебе тебя тобой нас нам вас вам них ним ему ней
   все всё всех всем весь вся этот эта эти этого этой этом этих тот там тут где когда тогда потом теперь сейчас
   очень просто тоже только даже если ведь может можно надо нужно чем кто чего чей чьи
   ну вообще типа короче кстати блин ладно щас чё что-то как-то
   the and for are but not you all any can had her was one our out get has him his how its let put say she too use
   that with have this will your from they know want been much some time very when come here just like make many
   over such take than them well were what would there their about could other into more then these also
   yeah okay yes dont don't doesn't didn't isn't wasn't can't won't it's that's i'm i'll i've you're we're they're
   there's what's let's im ive thats`
    .split(/\s+/),
)
const SKIP_PARTS = new Set([
  'link', 'text_link', 'mention', 'mention_name', 'email', 'phone',
  'bot_command', 'hashtag', 'cashtag', 'code', 'pre', 'bank_card', 'custom_emoji',
])
const URL_RE = /(?:https?:\/\/|www\.)\S+/gi
const WORD_RE = /[\p{L}\p{N}]+(?:['\-][\p{L}\p{N}]+)*/gu
const NUMERIC_RE = /^[\p{N}\-']+$/u
const EMOJI_RE = /\p{Extended_Pictographic}(?:\uFE0F|[\u{1F3FB}-\u{1F3FF}]|\u200D\p{Extended_Pictographic}\uFE0F?)*/gu
const EMOJI_NOISE = /[\uFE0F\u{1F3FB}-\u{1F3FF}]/gu
const NOT_EMOJI = new Set([0xa9, 0xae, 0x203c, 0x2049, 0x2122])

/** Human-written text of a message: skips links, mentions, commands, code, etc. */
function extractPlain(text) {
  if (typeof text === 'string') return text
  if (!Array.isArray(text)) return ''
  let out = ''
  for (const part of text) {
    if (typeof part === 'string') out += part
    else if (part && !SKIP_PARTS.has(part.type)) out += part.text || ''
  }
  return out
}

function tokenize(text) {
  const words = []
  const emoji = []
  if (!text) return { words, emoji }

  for (const m of text.matchAll(EMOJI_RE)) {
    if (NOT_EMOJI.has(m[0].codePointAt(0))) continue
    const key = m[0].replace(EMOJI_NOISE, '')
    if (key) emoji.push(key)
  }

  const clean = text.replace(URL_RE, ' ').toLowerCase().replace(/\u2019/g, "'")
  for (const m of clean.matchAll(WORD_RE)) {
    const w = m[0]
    if (w.length < 3 || w.length > 30 || STOP.has(w) || NUMERIC_RE.test(w)) continue
    words.push(w)
  }
  return { words, emoji }
}

/** Worker-only counters: day -> Map(token -> count). Never sent to the UI as is (see `snapshot`). */
function createTok() {
  return {
    w: new Map(), // words
    e: new Map(), // emoji written in text + reactions given (by reaction date)
    x: new Map(), // reaction emoji received (by message day)
    y: new Map(), // reaction emoji given (by message day)
    g: new Map(), // day -> reactions given (reactor known)
    m: [], // most-reacted messages, best first
  }
}

function bump(daysMap, day, keys, n = 1) {
  if (!keys.length) return
  let m = daysMap.get(day)
  if (!m) daysMap.set(day, (m = new Map()))
  for (const k of keys) m.set(k, (m.get(k) || 0) + n)
}

/** "YYYY-MM-DDTHH:mm:ss" -> day number (same scheme as everywhere else), or null. */
function dayOfDate(date) {
  if (typeof date !== 'string' || date.length < 10) return null
  const day = Math.floor(Date.UTC(+date.slice(0, 4), +date.slice(5, 7) - 1, +date.slice(8, 10)) / 864e5)
  return Number.isNaN(day) ? null : day
}

/** Telegram writes ids as "user123" (new exports) or plain 123 (old ones) — treat them as one id. */
const normId = (id) => (/^\d+$/.test(String(id)) ? `user${id}` : String(id))

function noteName(tok, id, name, day, kind) {
  if (!name) return
  const rec = tok.names[id] || (tok.names[id] = { m: new Map(), r: new Map() })
  const seen = rec[kind].get(name)
  if (seen) {
    seen.n++
    if (day > seen.last) seen.last = day
  } else {
    rec[kind].set(name, { n: 1, last: day })
  }
}

/** Name of an id: names from its own messages win over names from reactions */
function nameOf(tok, id) {
  const rec = tok.names[id]
  if (!rec) return null
  const pool = rec.m.size ? rec.m : rec.r
  let best = null
  for (const [name, e] of pool) {
    if (!best || e.last > best.e.last || (e.last === best.e.last && e.n > best.e.n)) best = { name, e }
  }
  return best ? best.name : null
}

function pushMessage(list, item) {
  list.push(item)
  list.sort((p, q) => q.n - p.n)
  if (list.length > MSG_LIMIT) list.length = MSG_LIMIT
}

/**
 * Reactions left on a message (`rcount` — total over all reaction types).
 */
function ingestReactions(store, message, dayNum, uid, userTok, rcount) {
  if (!rcount) return
  const all = store.tok.all
  const breakdown = []

  for (const reaction of message.reactions) {
    const count = reaction.count || 0
    const key = reaction.type === 'emoji' && reaction.emoji ? reaction.emoji.replace(EMOJI_NOISE, '') : ''
    if (key) {
      breakdown.push([key, count])
      bump(userTok.x, dayNum, [key], count)
      bump(all.x, dayNum, [key], count)
    }

    const recent = Array.isArray(reaction.recent) ? reaction.recent : []
    for (const who of recent) {
      const rid = who.from_id ? normId(who.from_id) : null
      if (rid) noteName(store.tok, rid, who.from, dayNum, 'r')
      const reactorTok = rid ? store.tok.users[rid] || (store.tok.users[rid] = createTok()) : null

      if (key) {
        const day = dayOfDate(who.date) ?? dayNum
        bump(all.e, day, [key])
        if (reactorTok) {
          bump(reactorTok.e, day, [key])
          bump(reactorTok.y, dayNum, [key])
        }
      }
      if (reactorTok) {
        reactorTok.g.set(dayNum, (reactorTok.g.get(dayNum) || 0) + 1)
        all.g.set(dayNum, (all.g.get(dayNum) || 0) + 1)
        if (rid !== uid) {
          const pairKey = `${uid}\t${rid}`
          let days = store.tok.pairs.get(pairKey)
          if (!days) store.tok.pairs.set(pairKey, (days = new Map()))
          days.set(dayNum, (days.get(dayNum) || 0) + 1)
        }
      }
    }

    const rest = count - recent.length
    if (key && rest > 0) bump(all.e, dayNum, [key], rest)
  }

  const text = extractPlain(message.text).replace(/\s+/g, ' ').trim()
  if (!text) return
  const item = {
    n: rcount,
    day: dayNum,
    uid,
    text: text.length > PREVIEW_LEN ? `${text.slice(0, PREVIEW_LEN).trimEnd()}\u2026` : text,
    em: breakdown.sort((p, q) => q[1] - p[1]).slice(0, 4),
  }
  pushMessage(userTok.m, item)
  pushMessage(all.m, item)
}

function rankTokens(daysMap, limit) {
  const totals = new Map()
  for (const m of daysMap.values()) for (const [k, c] of m) totals.set(k, (totals.get(k) || 0) + c)

  const best = [...totals].sort((a, b) => b[1] - a[1]).slice(0, limit)
  const per = new Map(best.map(([k]) => [k, { d: [], c: [] }]))
  for (const [day, m] of daysMap) {
    for (const [k, c] of m) {
      const p = per.get(k)
      if (p) {
        p.d.push(day)
        p.c.push(c)
      }
    }
  }
  return best.map(([k, n]) => {
    const p = per.get(k)
    return { k, n, d: Int32Array.from(p.d), c: Int32Array.from(p.c) }
  })
}

function sparseDays(dayMap) {
  return { d: Int32Array.from(dayMap.keys()), c: Int32Array.from(dayMap.values()) }
}

const buildTop = (tok) => ({
  words: rankTokens(tok.w, TOP_WORDS),
  emoji: rankTokens(tok.e, TOP_EMOJI),
  react: rankTokens(tok.x, 30), // reaction emoji received
  gave: rankTokens(tok.y, 30), // reaction emoji given
  giv: sparseDays(tok.g), // reactions given per day
  msgs: tok.m, // most-reacted messages
})

function totalsOf(daysMap) {
  const totals = new Map()
  for (const m of daysMap.values()) for (const [k, c] of m) totals.set(k, (totals.get(k) || 0) + c)
  return totals
}

function buildSignatures(store, tok, ids) {
  const allTotals = totalsOf(tok.all.w)
  const picked = {}
  const wanted = new Set()

  for (const id of ids) {
    const user = store.users[id]
    const restChars = store.all.ch - user.ch
    if (user.n < SIG_MIN_MESSAGES || user.ch <= 0 || restChars <= 0) continue

    const scored = []
    for (const [word, cu] of totalsOf(tok.users[id].w)) {
      if (cu < SIG_MIN_COUNT) continue
      const cr = (allTotals.get(word) || 0) - cu
      const ratio = (cu + 1) / user.ch / ((cr + 1) / restChars)
      if (ratio >= 1.5) scored.push([word, Math.log(ratio) * Math.sqrt(cu)])
    }
    scored.sort((a, b) => b[1] - a[1])
    picked[id] = scored.slice(0, SIG_LIMIT).map((x) => x[0])
    for (const w of picked[id]) wanted.add(w)
  }

  const chatDays = new Map([...wanted].map((w) => [w, { d: [], c: [] }]))
  for (const [day, m] of tok.all.w) {
    for (const [w, p] of chatDays) {
      const c = m.get(w)
      if (c) {
        p.d.push(day)
        p.c.push(c)
      }
    }
  }
  const chatArrays = new Map([...chatDays].map(([w, p]) => [w, { ad: Int32Array.from(p.d), ac: Int32Array.from(p.c) }]))

  const out = {}
  for (const id in picked) {
    const per = new Map(picked[id].map((w) => [w, { d: [], c: [] }]))
    for (const [day, m] of tok.users[id].w) {
      for (const [w, p] of per) {
        const c = m.get(w)
        if (c) {
          p.d.push(day)
          p.c.push(c)
        }
      }
    }
    // `ad`/`ac` arrays are shared between members (structured clone keeps the sharing)
    out[id] = picked[id].map((w) => ({ k: w, d: Int32Array.from(per.get(w).d), c: Int32Array.from(per.get(w).c), ...chatArrays.get(w) }))
  }
  return out
}

/** Reactor -> author pairs, busiest first, with sparse per-day counts (self-reactions excluded). */
function buildPairs(tok, users) {
  const rows = []
  for (const [key, days] of tok.pairs) {
    let n = 0
    for (const c of days.values()) n += c
    rows.push([key, n, days])
  }
  rows.sort((a, b) => b[1] - a[1])

  return rows.slice(0, PAIR_LIMIT).map(([key, n, days]) => {
    const [a, r] = key.split('\t')
    return { a, r, an: nameOf(tok, a) ?? users[a]?.name ?? null, rn: nameOf(tok, r) ?? users[r]?.name ?? null, n, ...sparseDays(days) }
  })
}

export function createBucket(name = null) {
  return {
    name,
    n: 0, // messages
    ch: 0, // text characters
    ph: 0, // photos
    vd: 0, // videos/video notes/gifs
    au: 0, // voice messages/audio
    st: 0, // stickers
    hd: Array(168).fill(0),
    days: {},
    rr: 0, // reactions received
    rm: 0, // messages that got at least one reaction
    mon: {},
    dd: {}, // dayNum -> Int32Array(DAY_LEN)
    first: Infinity,
    last: 0,
  }
}

export function createStore() {
  return {
    users: {}, // uid -> bucket
    all: createBucket(null), // display name resolved via i18n ('members.wholeChat')
    seen: new Set(), // dedupe key across files: `${chatId}:${msgId}`
    tok: { users: {}, all: createTok(), pairs: new Map(), names: {} }, // word/emoji/reaction counters (worker only, stripped by `snapshot`)
    files: [], // names of uploaded files
    chats: 0, // number of chats processed
    list: [], // [{ name, first, last, n, days }] — one entry per source chat; `days` is dayNum -> count, for range slicing
  }
}

export class ParseError extends Error {
  constructor(i18nKey, i18nParams = {}) {
    super(i18nKey)
    this.i18nKey = i18nKey
    this.i18nParams = i18nParams
  }
}

function extractLength(text) {
  if (typeof text === 'string') return text.length
  if (Array.isArray(text)) {
    return text.reduce((sum, part) => sum + (typeof part === 'string' ? part.length : (part.text || '').length), 0)
  }
  return 0
}

function ingestChat(store, chat) {
  const chatId = chat.id ?? chat.name
  let count = 0
  let first = Infinity
  let last = 0
  const chatDays = {}

  for (const message of chat.messages || []) {
    if (message.type !== 'message' || !message.date) continue

    const key = `${chatId}:${message.id}`
    if (store.seen.has(key)) continue
    store.seen.add(key)

    const uid = message.from_id ? normId(message.from_id) : message.from || '?'
    const user = store.users[uid] || (store.users[uid] = createBucket(message.from || null))
    const userTok = store.tok.users[uid] || (store.tok.users[uid] = createTok())
    noteName(store.tok, uid, message.from, dayOfDate(message.date), 'm')

    const date = message.date // "YYYY-MM-DDTHH:mm:ss"
    const dayNum = Math.floor(Date.UTC(+date.slice(0, 4), +date.slice(5, 7) - 1, +date.slice(8, 10)) / 864e5)
    const hour = +date.slice(11, 13)
    const monthKey = date.slice(0, 7)
    const len = extractLength(message.text)
    const mediaType = message.media_type
    const isVideo = mediaType === 'video_file' || mediaType === 'video_message' || mediaType === 'animation'
    const isAudio = mediaType === 'voice_message' || mediaType === 'audio_file'

    let rcount = 0
    if (Array.isArray(message.reactions)) for (const r of message.reactions) rcount += r.count || 0

    for (const bucket of [user, store.all]) {
      bucket.n++
      bucket.ch += len
      if (message.photo) bucket.ph++
      if (isVideo) bucket.vd++
      else if (isAudio) bucket.au++
      else if (mediaType === 'sticker') bucket.st++

      const rec = bucket.dd[dayNum] || (bucket.dd[dayNum] = new Int32Array(DAY_LEN))
      rec[0]++
      rec[1] += len
      if (message.photo) rec[2]++
      if (isVideo) rec[3]++
      else if (isAudio) rec[4]++
      else if (mediaType === 'sticker') rec[5]++
      if (rcount) {
        bucket.rr += rcount
        bucket.rm++
        rec[6] += rcount
        rec[7]++
      }
      rec[DAY_HOUR_OFFSET + hour]++

      bucket.hd[((dayNum + 3) % 7) * 24 + hour]++
      bucket.days[dayNum] = (bucket.days[dayNum] || 0) + 1
      bucket.mon[monthKey] = (bucket.mon[monthKey] || 0) + 1
      if (dayNum < bucket.first) bucket.first = dayNum
      if (dayNum > bucket.last) bucket.last = dayNum
    }

    const { words, emoji } = tokenize(extractPlain(message.text))
    if (words.length || emoji.length) {
      for (const tok of [userTok, store.tok.all]) {
        bump(tok.w, dayNum, words)
        bump(tok.e, dayNum, emoji)
      }
    }

    ingestReactions(store, message, dayNum, uid, userTok, rcount)

    count++
    chatDays[dayNum] = (chatDays[dayNum] || 0) + 1
    if (dayNum < first) first = dayNum
    if (dayNum > last) last = dayNum
  }

  store.chats++
  if (count) store.list.push({ name: chat.name || null, first, last, n: count, days: chatDays })
  return count
}

export function ingestText(store, text, fileName) {
  const json = JSON.parse(text)
  const chats = json?.chats?.list || (json?.messages ? [json] : null)
  if (!chats) throw new ParseError('errors.notExport', { name: fileName })

  store.files.push(fileName)
  for (const chat of chats) ingestChat(store, chat)
}

export function assertNotEmpty(store) {
  if (!store.all.n) throw new ParseError('errors.empty')
}

export function snapshot(store) {
  const { seen, tok, ...rest } = store
  if (!tok) return rest

  const users = { ...store.users }
  for (const id in users) {
    const name = nameOf(tok, id)
    if (name && name !== users[id].name) users[id] = { ...users[id], name }
  }
  const busiest = Object.keys(users).sort((a, b) => users[b].n - users[a].n).slice(0, TOP_USERS)
  const sig = buildSignatures(store, tok, busiest)
  for (const id of busiest) users[id] = { ...users[id], top: buildTop(tok.users[id]), sig: sig[id] || null }

  return { ...rest, users, all: { ...store.all, top: buildTop(tok.all) }, pairs: buildPairs(tok, store.users) }
}

const DEMO_WORDS = `coffee weekend movie tonight dinner music sunset project deadline birthday travel airport pizza concert
  beach garden guitar puzzle summer winter market cinema library bicycle mountain holiday kitchen morning journey
  photo weather festival dessert skiing camping recipe podcast museum sandwich`.split(/\s+/)
const DEMO_EMOJI = ['😂', '❤️', '🔥', '👍', '😅', '🙏', '😍', '🎉', '🤔', '😭']

function demoText(target, shift) {
  let text = ''
  while (text.length < target) {
    const i = (Math.floor(Math.random() ** 2.2 * DEMO_WORDS.length) + shift) % DEMO_WORDS.length
    text += (text ? ' ' : '') + DEMO_WORDS[i]
  }
  if (Math.random() < 0.3) text += ' ' + DEMO_EMOJI[Math.floor(Math.random() ** 1.8 * DEMO_EMOJI.length)]
  return text
}

function demoReactions(isA, date, hour) {
  if (Math.random() > 0.2) return {}
  const emoji = new Set()
  const pick = () => DEMO_EMOJI[Math.floor(Math.random() ** 1.8 * DEMO_EMOJI.length)]
  emoji.add(pick())
  if (Math.random() < 0.3) emoji.add(pick())
  const day = date.toISOString().slice(0, 11)
  return {
    reactions: [...emoji].map((e) => ({
      type: 'emoji',
      count: 1,
      emoji: e,
      recent: [{ from: isA ? 'Sam' : 'Alex', from_id: isA ? 'u2' : 'u1', date: `${day}${String(hour).padStart(2, '0')}:59:00` }],
    })),
  }
}

export function ingestDemo(store) {
  const messages = []
  const rnd = Math.random
  const noise = () => rnd() + rnd() + rnd() - 1.5
  const pad = (n) => String(n).padStart(2, '0')

  for (let i = 0; i < 30000; i++) {
    const isA = rnd() < 0.55
    const date = new Date(
      Date.UTC(2019 + Math.floor(rnd() ** 0.75 * 6), Math.floor(rnd() * 12), 1 + Math.floor(rnd() * 28)),
    )
    const hour = Math.floor((((isA ? 22 : 15) + noise() * 5) % 24 + 24) % 24)
    const roll = rnd()

    messages.push({
      id: i,
      type: 'message',
      date: `${date.toISOString().slice(0, 11)}${pad(hour)}:${pad(Math.floor(rnd() * 60))}:00`,
      from: isA ? 'Alex' : 'Sam',
      from_id: isA ? 'u1' : 'u2',
      text: demoText(isA ? 10 + Math.floor(rnd() * 140) : 3 + Math.floor(rnd() * 40), isA ? 0 : 7),
      ...demoReactions(isA, date, hour),
      ...(roll < 0.08 ? { photo: 'p.jpg' } : roll < 0.11 ? { media_type: 'voice_message' } : {}),
    })
  }

  store.files.push('demo.json')
  ingestChat(store, { id: 1, name: 'Demo chat', messages })
}
