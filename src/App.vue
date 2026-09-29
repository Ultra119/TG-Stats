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

        <UploadPanel v-if="!has" @files="onPick" @demo="onDemo" />

        <template v-else-if="stats">
          <MemberSelect
            v-model="sel"
            :items="items"
            :first="store.all.first"
            :total="store.all.n"
            :file-count="store.files.length"
            :chats="store.chats"
          />

          <h2 class="sec"><span class="sec-n">01</span>{{ t('sections.volume') }}</h2>
          <StatTiles :items="vol" :cols="5" />

          <h2 class="sec"><span class="sec-n">02</span>{{ t('sections.time') }}</h2>
          <StatTiles :items="tm" :cols="3" />

          <div class="grid g2 mt-3" style="grid-template-columns: 5fr 6fr">
            <v-card variant="flat" border class="tile">
              <div class="k">{{ t('yearChart.heading') }}</div>
              <YearChart :series="yearSeries" :peak-year="stats.peakY[0]" />
              <div class="s">{{ yearSummary }}</div>
            </v-card>
            <v-card variant="flat" border class="tile">
              <div class="k">{{ t('heatmap.heading') }}</div>
              <HeatmapGrid :hd="bucket.hd" />
            </v-card>
          </div>

          <template v-if="isAll">
            <h2 class="sec"><span class="sec-n">03</span>{{ t('sections.members') }}</h2>
            <MembersTable :board="board" @select="sel = $event" />
            <ChatFilesList v-if="chatList.length > 1" :chat-list="chatList" class="mt-3" />
          </template>

          <h2 class="sec">
            <span class="sec-n">{{ isAll ? '04' : '03' }}</span>
            {{ isAll ? t('sections.chatCharacter') : t('sections.titleAndAchievements') }}
          </h2>
          <TitleCard :title="stats.title" :why="stats.why" :is-all="isAll" :chat-name="chatName" />
          <div class="mt-5">
            <AchievementsGrid :ach="ach" :done="done" />
          </div>

          <h2 class="sec"><span class="sec-n">{{ isAll ? '05' : '04' }}</span>{{ t('sections.infographic') }}</h2>
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
import { reactive, ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { createStore, addFiles, resetStore, loadDemo } from './parser.js'
import { useAnalytics } from './composables/useAnalytics.js'
import { useFormatters } from './composables/useFormatters.js'
import { setLocale } from './i18n/index.js'

import UploadPanel from './components/UploadPanel.vue'
import MemberSelect from './components/MemberSelect.vue'
import StatTiles from './components/StatTiles.vue'
import YearChart from './components/YearChart.vue'
import HeatmapGrid from './components/HeatmapGrid.vue'
import TitleCard from './components/TitleCard.vue'
import AchievementsGrid from './components/AchievementsGrid.vue'
import MembersTable from './components/MembersTable.vue'
import ChatFilesList from './components/ChatFilesList.vue'
import InfographicPanel from './components/InfographicPanel.vue'

const { t, locale } = useI18n()
const { fmt, rawMessage } = useFormatters()

const store = reactive(createStore())
const sel = ref('*') // '*' = whole chat, otherwise a member uid
const busy = ref(false)
const error = ref('')
const fileInput = ref(null)

const { has, isAll, bucket, items, board, stats, vol, tm, yearSeries, chatList, chatName, ach, done, displayName } =
  useAnalytics(store, sel)

watch(locale, (l) => { document.documentElement.lang = l }, { immediate: true })

const yearSummary = computed(() => {
  const s = stats.value
  if (!s) return ''
  const monthName = s.peakMonthIndex === null ? '\u2014' : rawMessage('months')[s.peakMonthIndex]
  const month = s.peakMonthIndex === null ? '\u2014' : `${monthName} ${s.peakMonthYear}`
  return t('yearChart.summary', { year: s.peakY[0], count: fmt(s.peakY[1]), month, monthCount: fmt(s.peakMv) })
})

async function onPick(fileList) {
  if (!fileList || !fileList.length) return
  error.value = ''
  busy.value = true
  try {
    await addFiles(store, fileList)
  } catch (e) {
    error.value = e.i18nKey ? t(e.i18nKey, e.i18nParams || {}) : e.message
  }
  busy.value = false
  if (fileInput.value) fileInput.value.value = ''
}

function onReset() {
  resetStore(store)
  sel.value = '*'
}

function onDemo() {
  loadDemo(store)
}
</script>
