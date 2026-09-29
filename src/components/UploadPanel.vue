<template>
  <div class="grid g2" style="grid-template-columns: 3fr 2fr">
    <div class="drop" :class="{ on: over }" @dragover.prevent="over = true" @dragleave="over = false" @drop.prevent="onDrop">
      <svg class="drop-icon" viewBox="0 0 24 24" width="48" height="48" aria-hidden="true">
        <path d="M2 12H4V17H20V12H22V17C22 18.11 21.11 19 20 19H4C2.9 19 2 18.11 2 17V12M12 2L6.46 7.46L7.88 8.88L11 5.75V15H13V5.75L16.12 8.88L17.54 7.46L12 2Z" />
      </svg>
      <div class="mono drop-title">{{ t('upload.dropTitle') }}</div>
      <div class="s drop-hint">{{ t('upload.dropHint') }}</div>
      <div class="drop-actions">
        <v-btn color="primary" variant="outlined" @click="input?.click()">{{ t('upload.chooseFiles') }}</v-btn>
        <v-btn variant="text" @click="$emit('demo')">{{ t('upload.demoData') }}</v-btn>
      </div>
      <input ref="input" type="file" accept=".json,application/json" multiple hidden @change="onPick" />
    </div>

    <v-card variant="flat" border class="tile">
      <div class="k">{{ t('upload.howTo') }}</div>
      <ol>
        <li>{{ t('upload.step1') }}</li>
        <li>{{ t('upload.step2') }}</li>
        <li>{{ t('upload.step3') }}</li>
      </ol>
      <div class="s">{{ t('upload.note') }}</div>
    </v-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const over = ref(false)
const input = ref(null)
const emit = defineEmits(['files', 'demo'])

function onPick(e) {
  emit('files', e.target.files)
  e.target.value = ''
}

function onDrop(e) {
  over.value = false
  emit('files', e.dataTransfer.files)
}
</script>
