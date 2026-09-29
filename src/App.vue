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
          <OverviewSection
            v-model="sel"
            :items="items"
            :store="store"
            :stats="stats"
            :bucket="bucket"
            :vol="vol"
            :tm="tm"
            :year-series="yearSeries"
          />

          <MembersSection v-if="isAll" :board="board" :chat-list="chatList" @select="sel = $event" />

          <AchievementsSection
            :num="isAll ? '04' : '03'"
            :is-all="isAll"
            :chat-name="chatName"
            :stats="stats"
            :ach="ach"
            :done="done"
          />

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
import { reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { createStore, addFiles, resetStore, loadDemo } from './parser.js'
import { useAnalytics } from './composables/useAnalytics.js'
import { setLocale } from './i18n/index.js'

import UploadPanel from './components/UploadPanel.vue'
import OverviewSection from './components/OverviewSection.vue'
import MembersSection from './components/MembersSection.vue'
import AchievementsSection from './components/AchievementsSection.vue'
import InfographicPanel from './components/InfographicPanel.vue'

const { t, locale } = useI18n()

const store = reactive(createStore())
const sel = ref('*') // '*' = whole chat, otherwise a member uid
const busy = ref(false)
const error = ref('')
const fileInput = ref(null)

const { has, isAll, bucket, items, board, stats, vol, tm, yearSeries, chatList, chatName, ach, done, displayName } =
  useAnalytics(store, sel)

watch(locale, (l) => { document.documentElement.lang = l }, { immediate: true })

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
