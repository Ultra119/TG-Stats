<template>
  <div class="export-section">
    <SectionDownload name="words" />
    <h2 class="sec"><span class="sec-n">{{ num }}</span>{{ t('sections.words') }}</h2>

    <div class="grid" style="grid-template-columns: 3fr 2fr">
      <!-- Word cloud -->
      <v-card variant="flat" border class="tile">
        <div class="k">{{ t('words.wordsHeading') }}</div>
        <div v-if="cloud.length" class="wc-cloud">
          <span
            v-for="w in cloud"
            :key="w.key"
            class="wc-word"
            :class="{ 'wc-accent': w.accent }"
            :style="{ fontSize: w.size + 'px', opacity: w.opacity }"
            :title="t('words.times', { count: fmt(w.n) })"
          >{{ w.key }}</span>
        </div>
        <div v-else class="s">{{ t('words.noWords') }}</div>
      </v-card>

      <!-- Emoji -->
      <v-card variant="flat" border class="tile">
        <div class="k">{{ t('words.emojiHeading') }}</div>
        <div v-if="emojiTiles.length" class="wc-emoji-grid">
          <div v-for="e in emojiTiles" :key="e.key" class="wc-emoji" :title="t('words.times', { count: fmt(e.n) })">
            <span class="wc-emoji-ch" :style="{ fontSize: e.size + 'px' }">{{ e.glyph }}</span>
            <span class="wc-emoji-n">{{ fmt(e.n) }}</span>
          </div>
        </div>
        <div v-else class="s">{{ t('words.noEmoji') }}</div>
      </v-card>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { emojiGlyph } from '../lib/analytics.js'
import { useFormatters } from '../composables/useFormatters.js'
import SectionDownload from './SectionDownload.vue'

const props = defineProps({
  num: { type: String, default: '03' }, // section number
  words: { type: Array, required: true }, // [{ key, n }], sorted desc
  emoji: { type: Array, required: true }, // [{ key, n }], sorted desc
})

const { t } = useI18n()
const { fmt } = useFormatters()

/** 0..1 log-scaled position of `n` between the smallest and the largest count in `rows`. */
function scaler(rows) {
  const hi = Math.log(rows[0].n)
  const lo = Math.log(rows[rows.length - 1].n)
  return (n) => (hi === lo ? 1 : (Math.log(n) - lo) / (hi - lo))
}

const cloud = computed(() => {
  if (!props.words.length) return []
  const k = scaler(props.words)
  const sized = props.words.map((w, i) => {
    const s = k(w.n)
    return { ...w, size: Math.round(13 + s * 31), opacity: +(0.55 + s * 0.45).toFixed(2), accent: i % 3 === 0 }
  })
  // the biggest words end up in the middle: 0 -> [0], 1 -> [0,1], 2 -> [2,0,1], ...
  const out = []
  sized.forEach((w, i) => (i % 2 ? out.push(w) : out.unshift(w)))
  return out
})

const emojiTiles = computed(() => {
  if (!props.emoji.length) return []
  const k = scaler(props.emoji)
  return props.emoji.map((e) => ({ ...e, glyph: emojiGlyph(e.key), size: Math.round(22 + k(e.n) * 18) }))
})
</script>

<style>
.wc-cloud {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: 4px 14px;
  margin-top: 14px;
  line-height: 1.15;
}
.wc-word {
  font-weight: 500;
  white-space: nowrap;
}
.wc-accent {
  color: rgb(var(--v-theme-primary));
}
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
