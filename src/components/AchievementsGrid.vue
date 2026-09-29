<template>
  <div>
    <div class="progress-row">
      <b class="progress-label">{{ t('achievements.progress', { done, total: ach.length }) }}</b>
      <v-progress-linear :model-value="(done / ach.length) * 100" height="4" color="primary" rounded />
    </div>

    <div class="grid g4">
      <v-card v-for="a in ach" :key="a.id" variant="flat" border class="tile ach" :class="{ done: a.c >= a.t }">
        <div style="font-weight: 500">{{ t(`achievements.${a.id}.name`) }}</div>
        <div class="s" style="margin: 4px 0 12px">{{ t(`achievements.${a.id}.description`) }}</div>
        <v-progress-linear :model-value="Math.min(100, (a.c / a.t) * 100)" height="3" color="primary" />
        <div class="s mono-sm">{{ a.c >= a.t ? t('achievements.unlocked') : `${fmt(a.c)} / ${fmt(a.t)}` }}</div>
      </v-card>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import { useFormatters } from '../composables/useFormatters.js'

const { t } = useI18n()
const { fmt } = useFormatters()

defineProps({
  ach: { type: Array, required: true }, // [{id, c, t}]
  done: { type: Number, required: true },
})
</script>
