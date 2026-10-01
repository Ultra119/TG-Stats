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
        <EmojiGrid :rows="emoji" :empty="t('words.noEmoji')" />
      </v-card>
    </div>

    <!-- Word of the year / month: how the leading word rose and faded -->
    <v-card v-if="trends" variant="flat" border class="tile mt-3">
      <div class="k">{{ t(trends.unit === 'year' ? 'words.trendYear' : 'words.trendMonth') }}</div>
      <WordTimeline :trends="trends" />
    </v-card>

    <v-card v-if="isAll ? signature.length : true" variant="flat" border class="tile mt-3">
      <div class="k">{{ isAll ? t('words.signatureHeadingChat') : t('words.signatureHeading') }}</div>

      <template v-if="signature.some((s) => s.words.length)">
        <div v-for="s in signature" :key="s.id" class="wc-sig-row">
          <div v-if="isAll" class="wc-sig-name">{{ s.name || t('members.deletedAccount') }}</div>
          <div class="wc-sig-words">
            <span v-for="w in s.words" :key="w.key" class="wc-chip" :title="t('words.times', { count: fmt(w.n) })">
              {{ w.key }}<small>&times;{{ ratio(w.ratio) }}</small>
            </span>
          </div>
        </div>
      </template>
      <div v-else class="s">{{ t('words.noSignature') }}</div>
    </v-card>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useFormatters } from '../composables/useFormatters.js'
import SectionDownload from './SectionDownload.vue'
import EmojiGrid from './EmojiGrid.vue'
import WordTimeline from './WordTimeline.vue'

const props = defineProps({
  num: { type: String, default: '03' }, // section number
  isAll: { type: Boolean, default: false },
  words: { type: Array, required: true }, // [{ key, n }], sorted desc
  emoji: { type: Array, required: true }, // [{ key, n }], sorted desc
  signature: { type: Array, default: () => [] }, // [{ id, name, words: [{ key, n, ratio }] }]
  trends: { type: Object, default: null }, // buildWordTrends() result, null = not enough history
})

const { t } = useI18n()
const { fmt, locale } = useFormatters()

const cloud = computed(() => {
  const rows = props.words
  if (!rows.length) return []
  const hi = Math.log(rows[0].n)
  const lo = Math.log(rows[rows.length - 1].n)
  const scale = (n) => (hi === lo ? 1 : (Math.log(n) - lo) / (hi - lo))

  const sized = rows.map((w, i) => {
    const s = scale(w.n)
    return { ...w, size: Math.round(13 + s * 31), opacity: +(0.55 + s * 0.45).toFixed(2), accent: i % 3 === 0 }
  })
  // the biggest words end up in the middle: 0 -> [0], 1 -> [0,1], 2 -> [2,0,1], ...
  const out = []
  sized.forEach((w, i) => (i % 2 ? out.push(w) : out.unshift(w)))
  return out
})

const ratio = (r) =>
  new Intl.NumberFormat(locale.value === 'ru' ? 'ru-RU' : 'en-US', { maximumFractionDigits: r >= 10 ? 0 : 1 }).format(r)
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
.wc-sig-row {
  display: flex;
  align-items: baseline;
  gap: 16px;
  margin-top: 12px;
}
.wc-sig-name {
  flex: 0 0 140px;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.wc-sig-words {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.wc-chip {
  display: inline-flex;
  align-items: baseline;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  font-weight: 500;
}
.wc-chip small {
  font-size: 11px;
  font-weight: 400;
  opacity: 0.65;
}
</style>
