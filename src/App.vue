<template>
  <v-app>
    <v-app-bar flat color="background" height="64" class="hairline-b">
      <div class="wrap bar-inner">
        <div>
          <div class="mono brand">{{ t('brand') }}</div>
          <div class="label-eyebrow">{{ t('app.subtitle') }}</div>
        </div>
        <v-spacer />
        <template v-if="has">
          <v-btn variant="outlined" color="primary" size="small" @click="fileInput?.click()">{{ t('app.addExport') }}</v-btn>
          <v-btn variant="text" size="small" @click="onReset">{{ t('app.reset') }}</v-btn>
        </template>
        <v-btn-toggle :model-value="locale" mandatory density="compact" color="primary" class="ml-2" @update:model-value="setLocale">
          <v-btn value="ru" size="small">{{ t('localeName.ru') }}</v-btn>
          <v-btn value="en" size="small">{{ t('localeName.en') }}</v-btn>
        </v-btn-toggle>
      </div>
    </v-app-bar>

    <input
      ref="fileInput"
      type="file"
      accept=".json,application/json"
      multiple
      hidden
      @change="onPick($event.target.files)"
    />

    <v-main>
      <div class="wrap">
        <v-progress-linear v-if="busy" indeterminate height="2" class="mb-4" />
        <v-alert v-if="error" type="error" variant="tonal" density="compact" class="mb-4">{{ error }}</v-alert>

        <DateRangeFilter v-if="has" v-model="range" :bounds="bounds" />
        <v-alert v-if="isEmpty" type="info" variant="tonal" density="compact" class="mb-4">
          {{ t('range.empty') }} &mdash; {{ t('range.emptyHint') }}
        </v-alert>

        <UploadPanel v-if="!has" @files="onPick" @demo="onDemo" />

        <template v-else-if="stats">
          <OverviewSection
            v-model="sel"
            :items="items"
            :store="view"
            :stats="stats"
            :bucket="bucket"
            :vol="vol"
            :tm="tm"
            :year-series="yearSeries"
            :saving="saving"
            @save-page="onSavePage"
          />

          <WordsSection num="03" :words="topWords" :emoji="topEmoji" />

          <MembersSection v-if="isAll" num="04" :board="board" :chat-list="chatList" @select="sel = $event" />

          <AchievementsSection
            :num="isAll ? '05' : '04'"
            :is-all="isAll"
            :chat-name="chatName"
            :stats="stats"
            :ach="ach"
            :done="done"
          />

          <h2 class="sec"><span class="sec-n">{{ isAll ? '06' : '05' }}</span>{{ t('sections.infographic') }}</h2>
          <InfographicPanel
            :is-all="isAll"
            :bucket="bucket"
            :stats="stats"
            :year-series="yearSeries"
            :board="board"
            :chat-name="chatName"
            :ach-total="ach.length"
            :ach-done="done"
            :display-name="displayName"
          />
        </template>
      </div>
    </v-main>
  </v-app>
</template>

<script setup>
import { shallowReactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { createStore, addFiles, resetStore, loadDemo } from './parser.js'
import { useAnalytics } from './composables/useAnalytics.js'
import { setLocale } from './i18n/index.js'
import { useFormatters } from './composables/useFormatters.js'
import { buildPageHtml, savePage } from './exportPage.js'

import UploadPanel from './components/UploadPanel.vue'
import OverviewSection from './components/OverviewSection.vue'
import WordsSection from './components/WordsSection.vue'
import MembersSection from './components/MembersSection.vue'
import AchievementsSection from './components/AchievementsSection.vue'
import InfographicPanel from './components/InfographicPanel.vue'
import DateRangeFilter from './components/DateRangeFilter.vue'

const { t, locale } = useI18n()

const store = shallowReactive(createStore())
const sel = ref('*') // '*' = whole chat, otherwise a member uid
const busy = ref(false)
const error = ref('')
const fileInput = ref(null)
const range = ref({ from: null, to: null }) // day numbers, null = open bound
const saving = ref(false)
const { dstr } = useFormatters()

const {
  has, isEmpty, bounds, view,
  isAll, bucket, items, board, stats, vol, tm, yearSeries, chatList, chatName, ach, done, displayName,
  topWords, topEmoji,
} = useAnalytics(store, sel, range)

watch(locale, (l) => { document.documentElement.lang = l }, { immediate: true })

async function run(task) {
  error.value = ''
  busy.value = true
  try {
    await task()
  } catch (e) {
    error.value = e.i18nKey ? t(e.i18nKey, e.i18nParams || {}) : e.message
  }
  busy.value = false
}

async function onPick(fileList) {
  if (!fileList || !fileList.length) return
  await run(() => addFiles(store, fileList))
  if (fileInput.value) fileInput.value.value = ''
}

async function onReset() {
  await run(() => resetStore(store))
  sel.value = '*'
}

async function onSavePage() {
  saving.value = true
  error.value = ''
  try {
    const name = isAll.value ? chatName.value || t('members.wholeChat') : displayName(bucket.value.name)
    const { from, to } = view.value.range
    const html = await buildPageHtml({
      title: name,
      kicker: t(isAll.value ? 'exportPage.kickerChat' : 'exportPage.kickerPersonal'),
      period: `${dstr(from)} \u2014 ${dstr(to)}`,
      footer: t('exportPage.footer', { date: dstr(Math.floor(Date.now() / 864e5)) }),
      lang: locale.value,
    })
    savePage(html, name)
  } catch (e) {
    error.value = e.message
  }
  saving.value = false
}

function onDemo() {
  return run(() => loadDemo(store))
}
</script>
