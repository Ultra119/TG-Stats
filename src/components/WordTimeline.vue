<template>
  <div class="wt">
    <svg
      class="chart wt-chart"
      :viewBox="`0 0 ${W} ${chart.height}`"
      width="100%"
      role="img"
      :aria-label="t(trends.unit === 'year' ? 'words.trendYear' : 'words.trendMonth')"
      @mouseleave="active = null"
    >
      <rect x="0.5" y="0.5" :width="W - 1" :height="chart.height - 1" fill="none" class="wt-rule" />
      <line :x1="0" :x2="W" :y1="chart.headH" :y2="chart.headH" class="wt-rule" />
      <line :x1="0" :x2="W" :y1="chart.plotBottom" :y2="chart.plotBottom" class="wt-rule" />
      <line
        v-for="b in chart.bands.filter((b) => b.i > 0)"
        :key="'div' + b.i"
        :x1="b.x"
        :x2="b.x"
        :y1="chart.stagger ? chart.headH : 0"
        :y2="chart.height"
        class="wt-rule"
      />

      <rect
        v-for="b in chart.bands.filter((b) => b.i === active || isSel(b.i))"
        :key="'on' + b.i"
        :x="b.x"
        :y="0"
        :width="b.w"
        :height="chart.height"
        class="wt-on"
        :style="{ fill: b.color, fillOpacity: isSel(b.i) ? 0.11 : 0.07 }"
      />

      <g v-for="c in visibleCurves" :key="'curve' + c.i" :style="{ '--c': c.color }">
        <clipPath :id="c.clipId"><rect :x="c.x" :y="chart.headH" :width="c.w" :height="PLOT_H" /></clipPath>
        <path
          :d="c.line"
          class="wt-tail wt-fade"
          :class="{ 'wt-tail-sel': hasSel }"
          :style="{ opacity: tailOpacity(c.i) }"
        />
        <g :clip-path="`url(#${c.clipId})`" class="wt-fade" :style="{ opacity: focus === null || focus === c.i ? 1 : 0.35 }">
          <path :d="c.area" class="wt-area" />
          <path :d="c.line" class="wt-line" />
        </g>
      </g>

      <g v-for="b in chart.bands.filter((b) => b.leader)" :key="'word' + b.i" class="wt-fade" :style="{ opacity: hasSel && !isSel(b.i) ? 0.45 : 1 }">
        <rect v-if="b.w >= 18" :x="b.x + 9" :y="b.wordY - 9" width="8" height="8" :fill="b.color" />
        <text :x="b.x + 22" :y="b.wordY" class="wt-word" :style="isSel(b.i) ? { fill: b.color } : null">{{ b.word }}</text>
        <text v-if="b.lift" :x="b.x + 22" y="37" class="wt-lift" :style="{ fill: b.color }">{{ b.lift }}</text>
        <rect v-if="isSel(b.i)" :x="b.x" :y="chart.headH - 3" :width="b.w" height="3" :fill="b.color" />
      </g>

      <g v-for="b in chart.bands" :key="'foot' + b.i">
        <text :x="b.x + b.w / 2" :y="chart.plotBottom + 17" text-anchor="middle" class="wt-axis">{{ b.label }}</text>
        <text v-if="b.sub" :x="b.x + b.w / 2" :y="chart.plotBottom + 32" text-anchor="middle" class="wt-axis wt-axis-sub">{{ b.sub }}</text>
      </g>

      <rect
        v-for="b in chart.bands"
        :key="'hit' + b.i"
        :x="b.x"
        :y="0"
        :width="b.w"
        :height="chart.height"
        fill="transparent"
        :class="{ 'wt-hit': b.leader }"
        @mouseenter="b.leader && (active = b.i)"
        @click="b.leader && toggle(b.i)"
      >
        <title>{{ b.tooltip }}</title>
      </rect>
    </svg>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useFormatters } from '../composables/useFormatters.js'

let uid = 0

const props = defineProps({
  trends: { type: Object, required: true },
})

const { t } = useI18n()
const { fmt, rawMessage, locale } = useFormatters()

const instance = `wt${uid++}`
const active = ref(null) // index of the period under the cursor
const selected = ref([]) // indices of the periods picked by click; empty = show everything

const PALETTE = [
  '#b5543c',
  '#4f7a94',
  '#c2993f',
  '#6f8a4e',
  '#8c3b4a',
  '#5b8c85',
  '#9a6f47',
  '#7a5c8a',
  '#8a8f96',
  '#5f6fa0',
]

watch(
  () => props.trends,
  () => {
    selected.value = []
    active.value = null
  },
)

const hasSel = computed(() => selected.value.length > 0)
const isSel = (i) => selected.value.includes(i)
const toggle = (i) => {
  selected.value = isSel(i) ? selected.value.filter((x) => x !== i) : [...selected.value, i]
}
const focus = computed(() => (active.value !== null && (!hasSel.value || isSel(active.value)) ? active.value : null))
const tailOpacity = (i) => {
  if (hasSel.value) return focus.value === null || focus.value === i ? 1 : 0.3
  return focus.value === null ? 0.32 : focus.value === i ? 1 : 0.1
}

const W = 960
const PLOT_H = 170

const liftText = (n) =>
  new Intl.NumberFormat(locale.value === 'ru' ? 'ru-RU' : 'en-US', { maximumFractionDigits: 1 }).format(n)

const chart = computed(() => {
  const { unit, span, bins, periods } = props.trends
  const months = rawMessage('months')
  const total = span.to - span.from + 1
  const xOf = (day) => ((day - span.from) / total) * W // day = start of that day

  const widths = periods.map((p) => xOf(p.to + 1) - xOf(p.from))
  const inner = widths.length > 2 ? widths.slice(1, -1) : widths
  const stagger = Math.min(...inner) < 84
  const step = stagger ? 2 : 1
  const headH = stagger ? 54 : 48
  const plotBottom = headH + PLOT_H
  const height = plotBottom + (unit === 'month' ? 42 : 28)

  const bands = periods.map((p, k) => {
    const x = xOf(p.from)
    const w = xOf(p.to + 1) - x
    const leader = p.leader
    const reach = periods[k + step] ? xOf(periods[k + step].from) : W
    const avail = reach - x - 29 // room for the word after the swatch
    const maxChars = Math.max(3, Math.floor(avail / 7.8))
    const word = !leader || avail < 24 ? '' : leader.key.length > maxChars ? leader.key.slice(0, maxChars - 1) + '\u2026' : leader.key
    const label = unit === 'year' ? String(p.year) : months[p.month].slice(0, 3).toUpperCase()
    const hint = leader ? t('words.trendTile', { count: fmt(leader.count), lift: liftText(leader.lift) }) : ''
    const row = stagger && k % 2 === 1
    return {
      i: p.i,
      x,
      w,
      leader: !!leader,
      word,
      row,
      wordY: row ? 42 : 20,
      color: PALETTE[p.i % PALETTE.length],
      lift: leader && !stagger && w >= 60 ? `\u00d7${liftText(leader.lift)}` : '',
      label,
      sub: unit === 'month' && (p.i === 0 || p.month === 0) ? String(p.year) : '',
      tooltip: leader ? `${unit === 'year' ? label : `${months[p.month]} ${p.year}`}: ${leader.key} \u00b7 ${hint}` : '',
    }
  })

  const centers = bins.map((b) => xOf((b.from + b.to + 1) / 2))
  const f = (v) => +v.toFixed(1)
  const curves = periods
    .map((p, k) => {
      if (!p.leader) return null
      const ys = p.leader.curve.map((v) => plotBottom - 1 - v * (PLOT_H - 14))
      // run the line out to both edges of the frame
      const pts = [{ x: 0, y: ys[0] }, ...centers.map((x, b) => ({ x, y: ys[b] })), { x: W, y: ys[ys.length - 1] }]
      const line = pts.map((q, n) => `${n ? 'L' : 'M'}${f(q.x)} ${f(q.y)}`).join('')
      return {
        i: p.i,
        clipId: `${instance}-${p.i}`,
        color: bands[k].color,
        x: bands[k].x,
        w: bands[k].w,
        line,
        area: `${line}L${W} ${plotBottom}L0 ${plotBottom}Z`,
      }
    })
    .filter(Boolean)

  return { stagger, headH, plotBottom, height, bands, curves }
})

const visibleCurves = computed(() =>
  hasSel.value ? chart.value.curves.filter((c) => isSel(c.i)) : chart.value.curves,
)
</script>

<style>
.wt {
  margin-top: 14px;
}
.wt-chart {
  display: block;
  overflow: visible;
}
.wt-rule {
  fill: none;
  stroke: var(--hairline);
  stroke-width: 1;
}
.wt-hit {
  cursor: pointer;
}
.wt-tail {
  fill: none;
  stroke: var(--c);
  stroke-width: 1;
  stroke-linejoin: miter;
}
.wt-tail-sel {
  stroke-width: 1.5;
}
.wt-area {
  fill: var(--c);
  fill-opacity: 0.22;
}
.wt-line {
  fill: none;
  stroke: var(--c);
  stroke-width: 2;
  stroke-linejoin: miter;
  stroke-linecap: butt;
}
.wt-fade {
  transition: opacity 0.12s;
}
svg.chart text.wt-word {
  font-size: 13px;
  font-weight: 500;
}
svg.chart text.wt-lift {
  font-size: 11px;
}
svg.chart text.wt-axis {
  font-size: 11px;
  letter-spacing: 0.14em;
  fill: var(--ink-faint);
}
svg.chart text.wt-axis-sub {
  letter-spacing: 0.06em;
  opacity: 0.8;
}
</style>
