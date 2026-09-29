<template>
  <div v-if="tiles.length" class="wc-emoji-grid">
    <div v-for="e in tiles" :key="e.key" class="wc-emoji" :title="t('words.times', { count: fmt(e.n) })">
      <span class="wc-emoji-ch" :style="{ fontSize: e.size + 'px' }">{{ e.glyph }}</span>
      <span class="wc-emoji-n">{{ fmt(e.n) }}</span>
    </div>
  </div>
  <div v-else class="s">{{ empty }}</div>
</template>

<script setup>
/** Emoji tiles sized by (log-scaled) count. `rows` — [{ key, n }], sorted desc. */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { emojiGlyph } from '../lib/analytics.js'
import { useFormatters } from '../composables/useFormatters.js'

const props = defineProps({
  rows: { type: Array, required: true },
  empty: { type: String, default: '' },
})

const { t } = useI18n()
const { fmt } = useFormatters()

const tiles = computed(() => {
  const rows = props.rows
  if (!rows.length) return []
  const hi = Math.log(rows[0].n)
  const lo = Math.log(rows[rows.length - 1].n)
  const scale = (n) => (hi === lo ? 1 : (Math.log(n) - lo) / (hi - lo))
  return rows.map((e) => ({ ...e, glyph: emojiGlyph(e.key), size: Math.round(22 + scale(e.n) * 18) }))
})
</script>

<style>
.wc-emoji-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(56px, 1fr));
  gap: 10px 6px;
  margin-top: 14px;
}
.wc-emoji {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}
.wc-emoji-ch {
  line-height: 1.2;
}
.wc-emoji-n {
  font-size: 11px;
  opacity: 0.65;
}
</style>
