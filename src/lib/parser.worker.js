import { createStore, ingestText, ingestDemo, assertNotEmpty, snapshot } from './parser.core.js'

let store = createStore()

let queue = Promise.resolve()

self.onmessage = ({ data }) => {
  queue = queue.then(() => handle(data))
}

async function handle({ id, type, files }) {
  let error = null
  try {
    if (type === 'reset') {
      store = createStore()
    } else if (type === 'demo') {
      ingestDemo(store)
    } else if (type === 'add') {
      for (const file of files) ingestText(store, await file.text(), file.name)
      assertNotEmpty(store)
    }
  } catch (e) {
    error = { i18nKey: e.i18nKey, i18nParams: e.i18nParams, message: e.message }
  }
  self.postMessage({ id, snapshot: snapshot(store), error })
}
