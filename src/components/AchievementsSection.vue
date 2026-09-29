<template>
  <div>
    <h2 class="sec">
      <span class="sec-n">{{ num }}</span>
      {{ isAll ? t('sections.chatCharacter') : t('sections.titleAndAchievements') }}
    </h2>

    <!-- Title -->
    <v-card variant="flat" border class="tile" style="padding: 24px">
      <div class="k">{{ isAll ? t('titleCard.chatLabel', { chatName }) : t('titleCard.personalLabel') }}</div>
      <div class="status">{{ stats.title }}</div>
      <div class="s">{{ stats.why }}</div>
    </v-card>

    <!-- Achievements -->
    <div class="mt-5">
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
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import { useFormatters } from '../composables/useFormatters.js'

defineProps({
  num: { type: String, required: true }, // section number, e.g. '03'
  isAll: { type: Boolean, default: false },
  chatName: { type: String, default: '' },
  stats: { type: Object, required: true }, // needs: title, why
  ach: { type: Array, required: true }, // [{id, c, t}]
  done: { type: Number, required: true },
})

const { t } = useI18n()
const { fmt } = useFormatters()
</script>
