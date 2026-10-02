<template>
  <div class="export-section">
    <SectionDownload name="life" />
    <h2 class="sec"><span class="sec-n">{{ num }}</span>{{ t('sections.life') }}</h2>

    <div class="grid g4">
      <v-card v-for="tile in tiles" :key="tile.k" variant="flat" border class="tile">
        <div class="k">{{ tile.k }}</div>
        <div class="v">{{ tile.v }}</div>
        <div class="s">{{ tile.s }}</div>
      </v-card>
    </div>

    <v-card v-if="chart" variant="flat" border class="tile mt-3">
      <div class="lf-head">
        <div class="k">{{ t('life.heading.flow') }}</div>
        <div class="lf-legend">
          <span><i class="lf-up" />{{ t('life.flowUp') }}</span>
          <span><i class="lf-down" />{{ t('life.flowDown') }}</span>
        </div>
      </div>
      <svg class="chart" :viewBox="`0 0 ${chart.W} ${chart.H}`" width="100%" role="img" :aria-label="t('life.heading.flow')">
        <line :x1="0" :x2="chart.W" :y1="chart.mid" :y2="chart.mid" class="lf-rule" />
        <g v-for="(b, i) in chart.bars" :key="i">
          <rect v-if="b.up" :x="b.x" :y="chart.mid - b.up" :width="b.w" :height="b.up" class="lf-bar-up" />
          <rect v-if="b.down" :x="b.x" :y="chart.mid" :width="b.w" :height="b.down" class="lf-bar-down" />
          <text v-if="b.upText" :x="b.cx" :y="chart.mid - b.up - 4" text-anchor="middle" class="lf-num">{{ b.upText }}</text>
          <text v-if="b.downText" :x="b.cx" :y="chart.mid + b.down + 11" text-anchor="middle" class="lf-num">{{ b.downText }}</text>
          <text v-if="b.label" :x="b.cx" :y="chart.H - 6" text-anchor="middle" class="lf-axis">{{ b.label }}</text>
          <rect :x="b.hx" :y="0" :width="b.hw" :height="chart.H" fill="transparent"><title>{{ b.title }}</title></rect>
        </g>
      </svg>
    </v-card>

    <div v-if="showCalls || showPins" class="grid g2 mt-3" :style="{ gridTemplateColumns: showCalls && showPins ? '3fr 2fr' : '1fr' }">
      <v-card v-if="showCalls" variant="flat" border class="tile">
        <div class="k">{{ t('life.heading.calls') }}</div>
        <div class="lf-line" v-for="row in callRows" :key="row[0]">
          <span class="lf-line-k">{{ row[0] }}</span>
          <span class="mono-sm">{{ row[1] }}</span>
          <span v-if="row[2]" class="lf-line-s">{{ row[2] }}</span>
        </div>
        <template v-if="life.calls.by.length > 1">
          <div class="k lf-sub">{{ t('life.callers') }}</div>
          <div v-for="c in life.calls.by" :key="c.id || c.name" class="lf-rank">
            <span class="lf-rank-name">{{ displayName(c.name) }}</span>
            <div class="bar"><i :style="{ width: (c.n / life.calls.by[0].n) * 100 + '%' }" /></div>
            <span class="mono-sm lf-rank-n">{{ fmt(c.n) }}</span>
            <span class="mono-sm lf-rank-s">{{ dur(c.seconds) }}</span>
          </div>
        </template>
      </v-card>

      <v-card v-if="showPins" variant="flat" border class="tile">
        <div class="k">{{ t('life.heading.pins') }}</div>
        <div v-for="p in life.pins.by" :key="p.id || p.name" class="lf-rank">
          <span class="lf-rank-name">{{ displayName(p.name) }}</span>
          <div class="bar"><i :style="{ width: (p.n / life.pins.by[0].n) * 100 + '%' }" /></div>
          <span class="mono-sm lf-rank-n">{{ fmt(p.n) }}</span>
        </div>
      </v-card>
    </div>

    <v-card v-if="life.feed.length" variant="flat" border class="tile mt-3">
      <div class="k">{{ t('life.heading.timeline') }}</div>
      <div v-for="(item, i) in shownFeed" :key="i" class="lf-row">
        <span class="lf-date mono-sm">{{ dstr(item.day) }}</span>
        <span class="lf-dot" :class="'lf-k-' + item.k" />
        <span class="lf-text">
          {{ feedText(item) }}
          <small v-if="item.by">&middot; {{ displayName(item.by) }}</small>
        </span>
      </div>
      <v-btn
        v-if="life.feed.length > FEED_PREVIEW"
        data-export-skip
        class="mt-2"
        size="small"
        variant="text"
        color="primary"
        @click="showAll = !showAll"
      >
        {{ showAll ? t('life.feedLess') : t('life.feedMore', { count: life.feed.length }) }}
      </v-btn>
    </v-card>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useFormatters } from '../composables/useFormatters.js'
import SectionDownload from './SectionDownload.vue'

const FEED_PREVIEW = 12

const props = defineProps({
  num: { type: String, default: '07' }, // section number
  life: { type: Object, required: true }, // buildLife() result
})

const { t } = useI18n()
const { fmt, dstr, pluralize, rawMessage } = useFormatters()

const showAll = ref(false)
watch(() => props.life, () => (showAll.value = false))

const isChat = computed(() => props.life.scope === 'chat')
const displayName = (name) => name || t('members.deletedAccount')

function dur(sec) {
  const s = Math.round(sec || 0)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  if (h) return `${h} ${t('life.dur.h')} ${m} ${t('life.dur.m')}`
  if (m) return s % 60 ? `${m} ${t('life.dur.m')} ${s % 60} ${t('life.dur.s')}` : `${m} ${t('life.dur.m')}`
  return `${s} ${t('life.dur.s')}`
}

const signed = (n) => (n > 0 ? `+${fmt(n)}` : n < 0 ? `\u2212${fmt(-n)}` : '0')
const dot = (parts) => parts.filter(Boolean).join(' \u00b7 ')

const tiles = computed(() => {
  const { people, titles, renames, photos, pins, calls } = props.life
  const lastTitle = titles.length ? titles[titles.length - 1].title : null
  const callsHint = calls.n ? dot([t('life.tile.callsTime', { duration: dur(calls.seconds) }), calls.missed ? t('life.tile.callsMissed', { count: fmt(calls.missed) }) : '']) : ''

  if (isChat.value) {
    return [
      {
        k: t('life.tile.people'),
        v: people.joined || people.left ? t('life.tile.peopleValue', { joined: fmt(people.joined), left: fmt(people.left) }) : '\u2014',
        s: people.joined || people.left ? t('life.tile.peopleHint', { net: signed(people.joined - people.left) }) : '',
      },
      {
        k: t('life.tile.titles'),
        v: fmt(renames),
        s: dot([lastTitle ? t('life.tile.titleNow', { title: lastTitle }) : '', photos ? t('life.tile.photos', { count: fmt(photos) }) : '']),
      },
      {
        k: t('life.tile.pins'),
        v: fmt(pins.n),
        s: pins.by.length ? t('life.tile.pinsTop', { name: displayName(pins.by[0].name), count: fmt(pins.by[0].n) }) : '',
      },
      { k: t('life.tile.calls'), v: fmt(calls.n), s: callsHint },
    ]
  }
  return [
    {
      k: t('life.tile.invitedBy'),
      v: fmt(people.invited),
      s: dot([
        people.joinedDay != null ? t('life.tile.joinedOn', { date: dstr(people.joinedDay) }) : '',
        people.leftDay != null ? t('life.tile.leftOn', { date: dstr(people.leftDay) }) : '',
        people.kicked ? t('life.tile.kicked', { count: fmt(people.kicked) }) : '',
      ]),
    },
    { k: t('life.tile.titlesMine'), v: fmt(renames), s: photos ? t('life.tile.photos', { count: fmt(photos) }) : '' },
    { k: t('life.tile.pinsMine'), v: fmt(pins.n), s: '' },
    { k: t('life.tile.callsMine'), v: fmt(calls.n), s: callsHint },
  ]
})

const chart = computed(() => {
  const f = props.life.flow
  if (!f) return null
  const W = 960
  const mid = 94
  const half = 78
  const H = mid + half + 30
  const months = rawMessage('months')
  const max = Math.max(...f.bins.map((b) => Math.max(b.joined, b.left)), 1)
  const step = W / f.bins.length
  const bw = Math.min(30, step * 0.7)
  const labelEvery = f.unit === 'year' && f.bins.length > 20 ? 2 : 1
  const wide = bw >= 16
  const h = (v) => (v ? Math.max(2, (v / max) * half) : 0)

  const bars = f.bins.map((b, i) => {
    const x = i * step + (step - bw) / 2
    const label =
      f.unit === 'year' ? (i % labelEvery === 0 ? String(b.year) : '') : b.month === 0 || i === 0 ? String(b.year) : ''
    return {
      x,
      w: bw,
      cx: x + bw / 2,
      hx: i * step,
      hw: step,
      up: h(b.joined),
      down: h(b.left),
      upText: wide && b.joined ? fmt(b.joined) : '',
      downText: wide && b.left ? fmt(b.left) : '',
      label,
      title: `${f.unit === 'year' ? b.year : `${months[b.month]} ${b.year}`}: +${fmt(b.joined)} / \u2212${fmt(b.left)}`,
    }
  })
  return { W, H, mid, bars }
})

const showCalls = computed(() => props.life.calls.n > 0 || props.life.calls.group.n > 0)
const showPins = computed(() => isChat.value && props.life.pins.by.length > 0)

const callRows = computed(() => {
  const c = props.life.calls
  const rows = []
  if (c.n) {
    rows.push([t('life.calls.answered'), t('life.calls.answeredValue', { answered: fmt(c.answered), total: fmt(c.n) }), ''])
    if (c.answered) rows.push([t('life.calls.avg'), dur(c.avg), ''])
    if (c.longest) rows.push([t('life.calls.longest'), dur(c.longest.s), dot([dstr(c.longest.day), c.longest.by ? displayName(c.longest.by) : ''])])
  }
  if (c.group.n) rows.push([t('life.calls.group'), fmt(c.group.n), c.group.seconds ? dur(c.group.seconds) : ''])
  return rows
})

const shownFeed = computed(() => (showAll.value ? props.life.feed : props.life.feed.slice(0, FEED_PREVIEW)))

function namesOf(item) {
  const shown = item.names.length
  if (!shown) return `${fmt(item.n)} ${pluralize(item.n, rawMessage('life.units.people'))}`
  const list = item.names.join(', ')
  return item.n > shown ? `${list} ${t('life.feed.more', { count: fmt(item.n - shown) })}` : list
}

function feedText(item) {
  switch (item.k) {
    case 'first':
      return t('life.feed.first')
    case 'record':
      return t('life.feed.record', { count: fmt(item.n) })
    case 'create':
      return item.title ? t('life.feed.create', { title: item.title }) : t('life.feed.createUntitled')
    case 'rename':
      return t('life.feed.rename', { title: item.title || '' })
    case 'call':
      return t('life.feed.call', { duration: dur(item.s) })
    default:
      return t(`life.feed.${item.k}`, { names: namesOf(item) }) // join, leave, invite, kick
  }
}
</script>

<style>
.lf-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16px;
}
.lf-head .k {
  margin-bottom: 0;
}
.lf-legend {
  display: flex;
  gap: 14px;
  font-size: 12px;
  color: var(--ink-muted);
}
.lf-legend i {
  display: inline-block;
  width: 8px;
  height: 8px;
  margin-right: 6px;
}
.lf-up {
  background: rgb(var(--v-theme-primary));
}
.lf-down {
  background: rgb(var(--v-theme-error));
}
.lf-rule {
  stroke: var(--hairline);
  stroke-width: 1;
}
.lf-bar-up {
  fill: rgb(var(--v-theme-primary));
  fill-opacity: 0.85;
}
.lf-bar-down {
  fill: rgb(var(--v-theme-error));
  fill-opacity: 0.8;
}
svg.chart text.lf-num {
  font-size: 9px;
  fill-opacity: 0.7;
}
svg.chart text.lf-axis {
  font-size: 10px;
  fill: var(--ink-faint);
}

.lf-line {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-top: 8px;
}
.lf-line-k {
  flex: 0 0 150px;
  font-size: 13px;
  color: var(--ink-muted);
}
.lf-line-s {
  font-size: 12px;
  color: var(--ink-faint);
}
.lf-sub {
  margin-top: 18px;
}
.lf-rank {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 8px;
}
.lf-rank-name {
  flex: 0 0 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 500;
}
.lf-rank-n {
  min-width: 28px;
  text-align: right;
}
.lf-rank-s {
  min-width: 72px;
  text-align: right;
  color: var(--ink-muted);
}

.lf-row {
  display: flex;
  align-items: baseline;
  gap: 12px;
  padding: 7px 0;
  border-top: 1px solid var(--hairline);
}
.k + .lf-row {
  border-top: 0;
}
.lf-date {
  flex: 0 0 150px;
  color: var(--ink-muted);
}
.lf-dot {
  flex: 0 0 8px;
  width: 8px;
  height: 8px;
  background: var(--ink-faint);
}
.lf-text {
  min-width: 0;
  overflow-wrap: anywhere;
}
.lf-text small {
  margin-left: 4px;
  font-size: 12px;
  color: var(--ink-muted);
}
.lf-k-create,
.lf-k-rename {
  background: rgb(var(--v-theme-secondary));
}
.lf-k-join,
.lf-k-invite {
  background: rgb(var(--v-theme-primary));
}
.lf-k-leave,
.lf-k-kick {
  background: rgb(var(--v-theme-error));
}
.lf-k-record {
  background: #c2993f;
}
.lf-k-call {
  background: #4f7a94;
}

@media (max-width: 720px) {
  .lf-date {
    flex-basis: 110px;
  }
  .lf-line-k {
    flex-basis: 110px;
  }
}
</style>
