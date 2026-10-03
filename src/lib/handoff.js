export const HANDOFF_HASH = '#import'
export const MSG_READY = 'tg-stats:ready'
export const MSG_DATA = 'tg-stats:data'
export const MSG_DONE = 'tg-stats:done'

const VERSION = 1
const KEYS = ['users', 'all', 'files', 'chats', 'list', 'pairs', 'ev'] // top-level parts of a parsed store
const MAX_UNPACKED = 512 * 1024 * 1024 // bytes; guards against a decompression bomb

async function gzip(bytes) {
  const stream = new Blob([bytes]).stream().pipeThrough(new CompressionStream('gzip'))
  return new Uint8Array(await new Response(stream).arrayBuffer())
}

async function gunzip(bytes) {
  const reader = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip')).getReader()
  const chunks = []
  let size = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    size += value.length
    if (size > MAX_UNPACKED) {
      reader.cancel()
      throw new Error('Data is too large')
    }
    chunks.push(value)
  }
  const out = new Uint8Array(size)
  let at = 0
  for (const c of chunks) {
    out.set(c, at)
    at += c.length
  }
  return out
}

function toBase64(bytes) {
  let s = ''
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000))
  return btoa(s)
}

function fromBase64(b64) {
  const s = atob(b64)
  const out = new Uint8Array(s.length)
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i)
  return out
}

function detach(value, arrays) {
  if (value === null || typeof value !== 'object') return value
  if (ArrayBuffer.isView(value)) {
    if (!(value instanceof Int32Array)) throw new Error('Unsupported typed array in the snapshot')
    const ref = { $i32: [arrays.total, value.length] }
    arrays.list.push(value)
    arrays.total += value.length
    return ref
  }
  if (Array.isArray(value)) return value.map((x) => detach(x, arrays))
  const proto = Object.getPrototypeOf(value)
  if (proto !== Object.prototype && proto !== null) throw new Error('Unsupported value in the snapshot')
  const out = {}
  for (const [k, v] of Object.entries(value)) if (v !== undefined) out[k] = detach(v, arrays)
  return out
}

function attach(value, blob) {
  if (value === null || typeof value !== 'object') return value
  if (Array.isArray(value)) return value.map((x) => attach(x, blob))
  const keys = Object.keys(value)
  if (keys.length === 1 && keys[0] === '$i32') {
    const [off, len] = value.$i32
    if (!Number.isInteger(off) || !Number.isInteger(len) || off < 0 || len < 0 || off + len > blob.length) {
      throw new Error('Corrupted data')
    }
    return blob.subarray(off, off + len)
  }
  const out = {}
  for (const k of keys) out[k] = attach(value[k], blob)
  return out
}

const isObj = (v) => v !== null && typeof v === 'object'

function assertSnapshot(s) {
  const ok =
    isObj(s) &&
    isObj(s.users) &&
    isObj(s.all) &&
    typeof s.all.n === 'number' &&
    s.all.n > 0 &&
    Array.isArray(s.list) &&
    Array.isArray(s.files)
  if (!ok) throw new Error('This is not a tg-stats snapshot')
}

export async function packSnapshot(snapshot, state) {
  const arrays = { list: [], total: 0 }
  const parts = {}
  for (const k of KEYS) if (snapshot[k] !== undefined) parts[k] = detach(snapshot[k], arrays)

  const header = new TextEncoder().encode(JSON.stringify({ v: VERSION, state, snap: parts }))
  const padded = (header.length + 3) & ~3
  const bytes = new Uint8Array(4 + padded + arrays.total * 4)
  new DataView(bytes.buffer).setUint32(0, header.length, true)
  bytes.set(header, 4)
  const blob = new Int32Array(bytes.buffer, 4 + padded, arrays.total)
  let at = 0
  for (const a of arrays.list) {
    blob.set(a, at)
    at += a.length
  }
  return toBase64(await gzip(bytes))
}

export async function unpackSnapshot(b64) {
  let bytes
  try {
    bytes = await gunzip(fromBase64(b64))
  } catch {
    throw new Error('Corrupted data')
  }
  if (bytes.length < 4) throw new Error('Corrupted data')
  const headerLen = new DataView(bytes.buffer, bytes.byteOffset).getUint32(0, true)
  const padded = (headerLen + 3) & ~3
  if (4 + padded > bytes.length) throw new Error('Corrupted data')
  const header = JSON.parse(new TextDecoder().decode(bytes.subarray(4, 4 + headerLen)))
  if (header.v !== VERSION) throw new Error('Unsupported snapshot version')

  const blob = new Int32Array(bytes.slice(4 + padded).buffer) // slice() = copy, so the view is 4-byte aligned
  const snapshot = {}
  for (const k of KEYS) if (header.snap?.[k] !== undefined) snapshot[k] = attach(header.snap[k], blob)
  assertSnapshot(snapshot)

  const st = header.state || {}
  const range = isObj(st.range) ? st.range : {}
  const day = (v) => (Number.isFinite(v) ? v : null)
  return {
    snapshot,
    state: {
      sel: typeof st.sel === 'string' ? st.sel : '*',
      range: { from: day(range.from), to: day(range.to) },
      lang: typeof st.lang === 'string' ? st.lang : null,
    },
  }
}

export function receiveHandoff({ timeout = 20000 } = {}) {
  const opener = typeof window !== 'undefined' ? window.opener : null
  if (!opener || location.hash !== HANDOFF_HASH) return Promise.resolve(null)

  return new Promise((resolve, reject) => {
    const stop = () => {
      clearTimeout(timer)
      window.removeEventListener('message', onMessage)
    }
    const onMessage = (e) => {
      if (e.source !== opener || e.data?.type !== MSG_DATA || typeof e.data.payload !== 'string') return
      stop()
      unpackSnapshot(e.data.payload).then((out) => {
        opener.postMessage({ type: MSG_DONE }, '*')
        resolve(out)
      }, reject)
    }
    const timer = setTimeout(() => {
      stop()
      resolve(null)
    }, timeout)
    window.addEventListener('message', onMessage)
    opener.postMessage({ type: MSG_READY }, '*') // '*': a saved page opened from disk has an opaque origin
  })
}
