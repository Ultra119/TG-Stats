<template>
  <div>
    <!-- Member select + source summary -->
    <div class="member-select-row">
      <v-select
        :model-value="modelValue"
        :items="items"
        :label="t('members.label')"
        variant="outlined"
        density="comfortable"
        hide-details
        style="max-width: 340px"
        @update:model-value="$emit('update:modelValue', $event)"
      />
      <div class="s" style="margin: 0">
        {{
          t('members.observed', {
            date: dstr(store.all.first),
            count: fmt(store.all.n),
            files: store.files.length,
            filesWord: pluralize(store.files.length, rawMessage('units.files')),
            chats: store.chats,
            chatsWord: pluralize(store.chats, rawMessage('units.chats')),
          })
        }}
      </div>
      <v-btn
        class="save-page-btn"
        variant="outlined"
        color="primary"
        size="small"
        :loading="saving"
        style="margin-left: auto"
        @click="$emit('save-page')"
      >
        <template #prepend>
          <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
            <path d="M5,20H19V18H5M19,9H15V3H9V9H5L12,16L19,9Z" fill="currentColor" />
          </svg>
        </template>
        {{ t('exportPage.button') }}
      </v-btn>
    </div>

    <!-- 01 Volume / 02 Time: stat tiles -->
    <div v-for="sec in tileSections" :key="sec.n" class="export-section">
      <SectionDownload :name="sec.key" />
      <h2 class="sec"><span class="sec-n">{{ sec.n }}</span>{{ t(sec.title) }}</h2>
      <div class="grid" :style="{ gridTemplateColumns: `repeat(${sec.cols}, 1fr)` }">
        <v-card v-for="row in sec.items" :key="row[0]" variant="flat" border class="tile">
          <div class="k">{{ row[0] }}</div>
          <div class="v">{{ row[1] }}</div>
          <div class="s">{{ row[2] }}</div>
        </v-card>
      </div>
      <!-- Charts belong to section 02 and are exported together with it -->
      <div v-if="sec.key === 'time'" class="grid g2 mt-3" style="grid-template-columns: 5fr 6fr">
        <v-card variant="flat" border class="tile">
          <div class="k">{{ t('yearChart.heading') }}</div>
          <svg class="chart" viewBox="0 0 400 210" width="100%">
            <g v-for="b in bars" :key="b.year">
              <rect
                :x="10 + b.x"
                :y="190 - b.h"
                :width="b.w"
                :height="b.h"
                fill="rgb(var(--v-theme-primary))"
                :fill-opacity="b.year === stats.peakY[0] ? 1 : 0.35"
              />
              <text :x="10 + b.x + b.w / 2" :y="190 - b.h - 6" font-size="9" text-anchor="middle" fill="currentColor">{{ fmt(b.value) }}</text>
              <text :x="10 + b.x + b.w / 2" y="204" font-size="10" text-anchor="middle" fill="currentColor" fill-opacity="0.7">{{ b.year }}</text>
            </g>
          </svg>
          <div class="s">{{ yearSummary }}</div>
        </v-card>

        <v-card variant="flat" border class="tile">
          <div class="k">{{ t('heatmap.heading') }}</div>
          <svg class="chart" viewBox="0 0 640 210" width="100%">
            <text v-for="(d, i) in dow" :key="'d' + i" x="0" :y="22 + i * 26" font-size="11" fill="currentColor" fill-opacity="0.7">{{ d }}</text>
            <text v-for="h in 8" :key="'h' + h" :x="34 + (h - 1) * 75" y="10" font-size="10" fill="currentColor" fill-opacity="0.7">{{ (h - 1) * 3 }}</text>

            <template v-for="(d, di) in dow" :key="'row' + di">
              <rect
                v-for="hIdx in 24"
                :key="di + '-' + hIdx"
                :x="34 + (hIdx - 1) * 25"
                :y="16 + di * 26"
                width="22"
                height="22"
                fill="rgb(var(--v-theme-primary))"
                :fill-opacity="opacity(bucket.hd[di * 24 + hIdx - 1])"
              >
                <title>{{ d }} {{ hIdx - 1 }}:00 — {{ fmt(bucket.hd[di * 24 + hIdx - 1]) }}</title>
              </rect>
            </template>
          </svg>
        </v-card>
      </div>
    </div>

  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { computeYearBars, heatmapOpacity } from '../lib/analytics.js'
import { useFormatters } from '../composables/useFormatters.js'
import SectionDownload from './SectionDownload.vue'

const props = defineProps({
  modelValue: { type: String, required: true }, // selected member uid or '*'
  items: { type: Array, required: true }, // v-select items
  store: { type: Object, required: true }, // needs: all.first, all.n, files, chats
  stats: { type: Object, required: true },
  bucket: { type: Object, required: true },
  vol: { type: Array, required: true }, // [[label, value, hint], ...]
  tm: { type: Array, required: true },
  yearSeries: { type: Array, required: true }, // [{year, value}]
  saving: { type: Boolean, default: false }, // "save page" in progress
})
defineEmits(['update:modelValue', 'save-page'])

const { t } = useI18n()
const { fmt, dstr, pluralize, rawMessage } = useFormatters()

const tileSections = computed(() => [
  { n: '01', key: 'volume', title: 'sections.volume', items: props.vol, cols: 5 },
  { n: '02', key: 'time', title: 'sections.time', items: props.tm, cols: 3 },
])

const bars = computed(() => computeYearBars(props.yearSeries, { containerWidth: 380 }))

const dow = computed(() => rawMessage('dow.short'))
const opacity = computed(() => heatmapOpacity(props.bucket.hd))

const yearSummary = computed(() => {
  const s = props.stats
  const hasMonth = s.peakMonthIndex !== null
  const month = hasMonth ? `${rawMessage('months')[s.peakMonthIndex]} ${s.peakMonthYear}` : '\u2014'
  return t('yearChart.summary', { year: s.peakY[0], count: fmt(s.peakY[1]), month, monthCount: fmt(s.peakMv) })
})
</script>
