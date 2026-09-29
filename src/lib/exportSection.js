import { toCanvas } from 'html-to-image'

const PIXEL_RATIO = 2

const isInFlow = (node) => {
  const cs = getComputedStyle(node)
  return (
    !node.hasAttribute('data-export-skip') &&
    cs.display !== 'none' &&
    cs.position !== 'absolute' &&
    cs.position !== 'fixed' &&
    cs.float === 'none'
  )
}

function collapsedMargin(root, side) {
  const edge = (node) => node.getBoundingClientRect()[side]
  const prop = side === 'top' ? 'marginTop' : 'marginBottom'
  let node = root
  let max = 0

  for (;;) {
    const kids = [...node.children].filter(isInFlow)
    const kid = side === 'top' ? kids[0] : kids[kids.length - 1]
    if (!kid || Math.abs(edge(kid) - edge(node)) > 0.5) break
    max = Math.max(max, parseFloat(getComputedStyle(kid)[prop]) || 0)
    node = kid
  }
  return Math.round(max)
}

export async function renderSectionToBlob(el, { pad = 24, background = '#000' } = {}) {
  await document.fonts?.ready

  const rect = el.getBoundingClientRect()
  const w = Math.ceil(rect.width)
  const h = Math.ceil(rect.height)

  const contain = getComputedStyle(el).display === 'block'
  const mt = contain ? collapsedMargin(el, 'top') : 0
  const mb = contain ? collapsedMargin(el, 'bottom') : 0

  const src = await toCanvas(el, {
    pixelRatio: PIXEL_RATIO,
    width: w,
    height: h + mt + mb,
    style: { margin: '0', boxSizing: 'border-box', ...(contain ? { display: 'flow-root' } : {}) },
    filter: (node) => !(node instanceof Element && node.hasAttribute('data-export-skip')),
  })

  const k = src.width / w // actual scale (html-to-image may downscale huge canvases)
  const out = document.createElement('canvas')
  out.width = Math.round((w + pad * 2) * k)
  out.height = Math.round((h + pad * 2) * k)

  const ctx = out.getContext('2d')
  if (pad) {
    ctx.fillStyle = background
    ctx.fillRect(0, 0, out.width, out.height)
  }
  ctx.drawImage(src, 0, mt * k, w * k, h * k, pad * k, pad * k, w * k, h * k)

  return new Promise((resolve, reject) => out.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/png'))
}
