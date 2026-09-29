<template>
  <div class="grid" :style="{ gridTemplateColumns: `repeat(${Math.min(chatList.length, 4)}, 1fr)` }">
    <v-card v-for="(c, i) in chatList" :key="i" variant="flat" border class="tile">
      <div class="k">{{ t('chatFiles.label', { index: i + 1, total: chatList.length }) }}</div>
      <div style="font-weight: 500">{{ c.name || t('chatFiles.untitled') }}</div>
      <div class="s">
        {{ t('chatFiles.range', { from: dstr(c.first), to: dstr(c.last) }) }}<br />
        {{ t('chatFiles.messages', { count: fmt(c.n) }) }}
      </div>
    </v-card>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import { useFormatters } from '../composables/useFormatters.js'

const { t } = useI18n()
const { fmt, dstr } = useFormatters()

defineProps({ chatList: { type: Array, required: true } })
</script>
