const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])

const normFamily = (s) => String(s || '').replace(/["']/g, '').trim()
const normWeight = (w) => (!w || w === 'normal' ? '400' : w === 'bold' ? '700' : String(w))
const normStyle = (s) => s || 'normal'

function isFontLoaded(rule) {
  if (!document.fonts) return true
  const family = normFamily(rule.style.getPropertyValue('font-family'))
  const weight = normWeight(rule.style.getPropertyValue('font-weight'))
  const style = normStyle(rule.style.getPropertyValue('font-style'))
  for (const f of document.fonts) {
    if (f.status === 'loaded' && normFamily(f.family) === family && normWeight(f.weight) === weight && normStyle(f.style) === style) return true
  }
  return false
}

function toDataUrl(url) {
  return fetch(url)
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return res.blob()
    })
    .then(
      (blob) =>
        new Promise((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result)
          reader.onerror = () => reject(reader.error)
          reader.readAsDataURL(blob)
        }),
    )
}

async function fontFaceText(rule) {
  const src = rule.style.getPropertyValue('src')
  const sources = [...src.matchAll(/url\((["']?)(.*?)\1\)\s*(?:format\((["']?)([\w-]+)\3\))?/g)].map((m) => ({ url: m[2], format: m[4] }))
  const pick = sources.find((s) => s.format === 'woff2') || sources[0]
  if (!pick || pick.url.startsWith('data:')) return pick ? rule.cssText : ''

  try {
    const base = rule.parentStyleSheet?.href || location.href
    const data = await toDataUrl(new URL(pick.url, base).href)
    let css = '@font-face{'
    for (const p of ['font-family', 'font-style', 'font-weight', 'font-stretch', 'font-display', 'unicode-range']) {
      const v = rule.style.getPropertyValue(p)
      if (v) css += `${p}:${v};`
    }
    return `${css}src:url(${data})${pick.format ? ` format("${pick.format}")` : ''}}`
  } catch {
    return '' // the font just falls back to a system one
  }
}

async function sheetRules(sheet) {
  try {
    return [...sheet.cssRules]
  } catch {
    if (!sheet.href) return []
    try {
      const css = await (await fetch(sheet.href)).text()
      const copy = new CSSStyleSheet()
      copy.replaceSync(css.replace(/@import[^;]+;/g, ''))
      return [...copy.cssRules]
    } catch {
      return []
    }
  }
}

async function rulesToCss(rules) {
  const parts = await Promise.all(
    rules.map(async (rule) => {
      if (rule instanceof CSSFontFaceRule) return isFontLoaded(rule) ? fontFaceText(rule) : ''
      if (rule instanceof CSSImportRule) return rule.styleSheet ? rulesToCss(await sheetRules(rule.styleSheet)) : ''
      return rule.cssText
    }),
  )
  return parts.filter(Boolean).join('\n')
}

async function collectCss() {
  const chunks = []
  for (const sheet of document.styleSheets) chunks.push(await rulesToCss(await sheetRules(sheet)))
  return chunks.join('\n').replace(/<\/style/gi, '<\\/style')
}

/**
 * @param {{ title: string, kicker: string, period: string, footer: string, lang: string }} meta
 * @returns {Promise<string>} the complete HTML document
 */
export async function buildPageHtml({ title, kicker, period, footer, lang }) {
  const sections = [...document.querySelectorAll('.export-section')]
  if (!sections.length) throw new Error('Nothing to export')

  const container = sections[0].closest('.wrap') || sections[0].parentElement
  const chain = []
  for (let n = container; n && n !== document.body; n = n.parentElement) chain.unshift(n)
  const open = chain.map((n) => `<${n.tagName.toLowerCase()} class="${esc(n.className)}">`).join('')
  const close = chain.map((n) => `</${n.tagName.toLowerCase()}>`).reverse().join('')

  const body = sections
    .map((el) => {
      const clone = el.cloneNode(true)
      clone.querySelectorAll('[data-export-skip]').forEach((n) => n.remove())
      clone.querySelectorAll('[style*="cursor"]').forEach((n) => (n.style.cursor = ''))
      return clone.outerHTML
    })
    .join('\n')

  const app = document.querySelector('.v-application') || document.body
  const bg = getComputedStyle(app).backgroundColor

  const css = await collectCss()

  return `<!doctype html>
<html lang="${esc(lang)}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<style>${css}</style>
<style>body{margin:0;background:${esc(bg)}}.ep-head{padding:32px 0 8px}.ep-head h1{font-size:30px;font-weight:600;line-height:1.2;margin:6px 0 4px}.ep-foot{padding:32px 0 16px}</style>
</head>
<body>
${open}
<header class="ep-head">
  <div class="label-eyebrow">${esc(kicker)}</div>
  <h1>${esc(title)}</h1>
  <div class="s">${esc(period)}</div>
</header>
${body}
<div class="s ep-foot">${esc(footer)}</div>
${close}
</body>
</html>
`
}

export function savePage(html, name) {
  const fileName = `tg-stats-${name}`.replace(/[^\p{L}\p{N}_-]+/gu, '-').replace(/-+$/g, '').slice(0, 80)
  const url = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url
  a.download = `${fileName}.html`
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
