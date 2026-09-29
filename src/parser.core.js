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
    mon: {},
    first: Infinity,
    last: 0,
  }
}

export function createStore() {
  return {
    users: {}, // uid -> bucket
    all: createBucket(null), // display name resolved via i18n ('members.wholeChat')
    seen: new Set(), // dedupe key across files: `${chatId}:${msgId}`
    files: [], // names of uploaded files
    chats: 0, // number of chats processed
    list: [], // [{ name, first, last, n }] — one entry per source chat, for migrated conversations
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

  for (const message of chat.messages || []) {
    if (message.type !== 'message' || !message.date) continue

    const key = `${chatId}:${message.id}`
    if (store.seen.has(key)) continue
    store.seen.add(key)

    const uid = message.from_id || message.from || '?'
    const user = store.users[uid] || (store.users[uid] = createBucket(message.from || null))

    const date = message.date // "YYYY-MM-DDTHH:mm:ss"
    const dayNum = Math.floor(Date.UTC(+date.slice(0, 4), +date.slice(5, 7) - 1, +date.slice(8, 10)) / 864e5)
    const hour = +date.slice(11, 13)
    const monthKey = date.slice(0, 7)
    const len = extractLength(message.text)
    const mediaType = message.media_type

    for (const bucket of [user, store.all]) {
      bucket.n++
      bucket.ch += len
      if (message.photo) bucket.ph++
      if (mediaType === 'video_file' || mediaType === 'video_message' || mediaType === 'animation') bucket.vd++
      else if (mediaType === 'voice_message' || mediaType === 'audio_file') bucket.au++
      else if (mediaType === 'sticker') bucket.st++

      bucket.hd[((dayNum + 3) % 7) * 24 + hour]++
      bucket.days[dayNum] = (bucket.days[dayNum] || 0) + 1
      bucket.mon[monthKey] = (bucket.mon[monthKey] || 0) + 1
      if (dayNum < bucket.first) bucket.first = dayNum
      if (dayNum > bucket.last) bucket.last = dayNum
    }

    count++
    if (dayNum < first) first = dayNum
    if (dayNum > last) last = dayNum
  }

  store.chats++
  if (count) store.list.push({ name: chat.name || null, first, last, n: count })
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
  const { seen, ...rest } = store
  return rest
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
      text: 'x'.repeat(isA ? 10 + Math.floor(rnd() * 140) : 3 + Math.floor(rnd() * 40)),
      ...(roll < 0.08 ? { photo: 'p.jpg' } : roll < 0.11 ? { media_type: 'voice_message' } : {}),
    })
  }

  store.files.push('demo.json')
  ingestChat(store, { id: 1, name: 'Demo chat', messages })
}
