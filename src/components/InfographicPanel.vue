<template>
  <div class="infographic">
    <div><canvas ref="canvas" width="1080" height="1920" /></div>
    <v-card variant="flat" border class="tile">
      <div class="k">{{ t('infographic.heading') }}</div>
      <div class="s" style="margin: 0 0 16px">{{ t('infographic.hint') }}</div>
      <v-btn color="primary" variant="flat" @click="save">{{ t('infographic.download') }}</v-btn>
    </v-card>
  </div>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { PAGE_CHARS, computeYearBars } from '../analytics.js'
import { useFormatters } from '../composables/useFormatters.js'

const props = defineProps({
  isAll: { type: Boolean, required: true },
  bucket: { type: Object, required: true },
  stats: { type: Object, required: true },
  yearSeries: { type: Array, required: true },
  board: { type: Array, required: true },
  chatName: { type: String, default: '' },
  achTotal: { type: Number, required: true },
  achDone: { type: Number, required: true },
  displayName: { type: Function, required: true }, // (name) -> resolved string, from useAnalytics
})

const { t } = useI18n()
const { fmt, dstr, hh, formatSpan, rawMessage } = useFormatters()
const canvas = ref(null)

const INK = '#E7E9EE'
const MUTED = 'rgba(231,233,238,0.55)'
const ACCENT = '#5EEAD4'
const PAD = 80
const BG = '#14161B'
const TRACK = '#242833'
const RULE = 'rgba(231,233,238,0.14)'
const MONO = '"IBM Plex Mono",monospace'
const SANS = '"IBM Plex Sans",sans-serif'

async function ensureFonts() {
  try {
    await document.fonts.load('700 40px "IBM Plex Sans"', 'Aa')
    await document.fonts.load('500 40px "IBM Plex Mono"', '0Aa')
  } catch {
  }
}

async function draw() {
  const canvasEl = canvas.value
  if (!canvasEl) return
  await ensureFonts()

  const s = props.stats
  const a = props.bucket
  const name = props.isAll ? props.chatName : props.displayName(a.name)
  const board = props.board.map((u) => ({ ...u, name: props.displayName(u.name) }))
  const dow = rawMessage('dow.short')

  const ctx = canvasEl.getContext('2d')
  const text = (str, x, y, font, color, align = 'left') => {
    ctx.font = font
    ctx.fillStyle = color
    ctx.textAlign = align
    ctx.fillText(str, x, y)
  }
  const rule = (y) => {
    ctx.fillStyle = RULE
    ctx.fillRect(PAD, y, 920, 2)
  }

  ctx.fillStyle = BG
  ctx.fillRect(0, 0, 1080, 1920)

  text(props.isAll ? t('infographic.kickerChat') : t('infographic.kickerPersonal'), PAD, 120, `500 26px ${MONO}`, MUTED)
  text(name.slice(0, 34), PAD, 215, `700 ${name.length > 16 ? 52 : 76}px ${SANS}`, INK)
  text(s.title, PAD, 285, `500 46px ${SANS}`, ACCENT)
  text(`${dstr(a.first)} \u00b7 ${formatSpan(s.days)}`, PAD, 340, `400 30px ${SANS}`, MUTED)
  rule(385)

  text(fmt(a.n), PAD, 560, `500 170px ${MONO}`, INK)
  text(t('infographic.messagesSuffix', { pages: fmt(a.ch / PAGE_CHARS) }), PAD, 615, `400 32px ${SANS}`, MUTED)
  rule(665)

  const kpis = [
    [t('infographic.activeDays'), fmt(s.active)],
    [t('infographic.bestStreak'), t('infographic.streakDaysShort', { count: s.best })],
    [t('infographic.dayRecord'), fmt(s.rec)],
    [t('infographic.favoriteDay'), dow[s.fd]],
    [t('infographic.peakActivity'), hh(s.ph)],
    [t('infographic.media'), fmt(a.ph + a.vd + a.au)],
  ]
  kpis.forEach(([k, v], i) => {
    const cx = PAD + (i % 2) * 470
    const cy = 730 + Math.floor(i / 2) * 145
    text(k, cx, cy, `500 22px ${MONO}`, MUTED)
    text(v, cx, cy + 62, `500 58px ${MONO}`, INK)
  })

  rule(1185)

  if (props.isAll) {
    text(t('infographic.members'), PAD, 1235, `500 22px ${MONO}`, MUTED)
    board.slice(0, 5).forEach((u, i) => {
      const y = 1262 + i * 44
      text(u.name.slice(0, 16), PAD, y + 24, `400 26px ${SANS}`, INK)
      ctx.fillStyle = TRACK
      ctx.fillRect(PAD + 300, y + 6, 470, 22)
      ctx.fillStyle = ACCENT
      ctx.fillRect(PAD + 300, y + 6, 470 * u.share, 22)
      text(`${Math.round(u.share * 100)}%`, PAD + 920, y + 26, `500 26px ${MONO}`, MUTED, 'right')
    })
  } else {
    text(t('infographic.byYear'), PAD, 1235, `500 22px ${MONO}`, MUTED)
    const bars = computeYearBars(props.yearSeries, { containerWidth: 920, maxBarWidth: 70, maxBarHeight: 130 })
    bars.forEach((b) => {
      ctx.fillStyle = ACCENT
      ctx.globalAlpha = b.year === s.peakY[0] ? 1 : 0.4
      ctx.fillRect(PAD + b.x, 1400 - b.h, b.w, b.h)
      ctx.globalAlpha = 1
      text(b.year.slice(props.yearSeries.length > 8 ? 2 : 0), PAD + b.x + b.w / 2, 1435, `400 22px ${MONO}`, MUTED, 'center')
    })
  }

  text(t('infographic.hoursByDay'), PAD, 1500, `500 22px ${MONO}`, MUTED)
  const max = Math.max(...a.hd, 1)
  for (let d = 0; d < 7; d++) {
    text(dow[d], PAD, 1568 + d * 32, `400 20px ${MONO}`, MUTED)
    for (let h = 0; h < 24; h++) {
      const v = a.hd[d * 24 + h]
      ctx.fillStyle = `rgba(94,234,212,${v ? 0.15 + 0.85 * Math.sqrt(v / max) : 0.06})`
      ctx.fillRect(PAD + 56 + h * 36, 1546 + d * 32, 33, 29)
    }
  }
  ;[0, 6, 12, 18].forEach((h) => text(String(h), PAD + 56 + h * 36, 1795, `400 20px ${MONO}`, MUTED))

  text(t('infographic.achievements', { done: props.achDone, total: props.achTotal }), PAD, 1870, `500 32px ${MONO}`, ACCENT)
}

watch(() => [props.bucket, props.stats, props.isAll], () => nextTick(draw), { immediate: true })

function save() {
  canvas.value.toBlob((blob) => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'telegram-stats.png'
    a.click()
    URL.revokeObjectURL(url)
  }, 'image/png')
}
</script>
