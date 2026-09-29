import { createStore as createCoreStore, snapshot, ParseError } from './parser.core.js'

export { ParseError }

export function createStore() {
  return snapshot(createCoreStore())
}

let worker = null
let nextId = 0
const pending = new Map() // id -> { store, resolve, reject }

function getWorker() {
  if (worker) return worker

  worker = new Worker(new URL('./parser.worker.js', import.meta.url), { type: 'module' })

  worker.onmessage = ({ data }) => {
    const job = pending.get(data.id)
    if (!job) return
    pending.delete(data.id)

    Object.assign(job.store, data.snapshot)
    const { error } = data
    if (!error) return job.resolve()
    job.reject(error.i18nKey ? new ParseError(error.i18nKey, error.i18nParams) : new Error(error.message))
  }

  worker.onerror = (event) => {
    for (const job of pending.values()) job.reject(new Error(event.message || 'Worker failed'))
    pending.clear()
    worker = null // recreate on next request
  }

  return worker
}

function request(store, message) {
  return new Promise((resolve, reject) => {
    const id = nextId++
    pending.set(id, { store, resolve, reject })
    getWorker().postMessage({ id, ...message })
  })
}

export const addFiles = (store, fileList) => request(store, { type: 'add', files: Array.from(fileList) })
export const resetStore = (store) => request(store, { type: 'reset' })
export const loadDemo = (store) => request(store, { type: 'demo' })
