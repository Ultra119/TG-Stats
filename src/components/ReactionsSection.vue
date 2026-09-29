<template>
  <div class="export-section">
    <SectionDownload name="reactions" />
    <h2 class="sec"><span class="sec-n">{{ num }}</span>{{ t('sections.reactions') }}</h2>

    <!-- Numbers -->
    <div class="grid" style="grid-template-columns: repeat(4, 1fr)">
      <v-card variant="flat" border class="tile">
        <div class="k">{{ isAll ? t('reactions.total') : t('reactions.received') }}</div>
        <div class="v">{{ fmt(data.received) }}</div>
        <div class="s">{{ isAll ? '' : t('reactions.per100Hint', { rate: nf1(data.per100) }) }}</div>
      </v-card>
      <v-card variant="flat" border class="tile">
        <div class="k">{{ t('reactions.reactedShare') }}</div>
        <div class="v">{{ nf2((data.reacted / data.total) * 100) }}%</div>
        <div class="s">{{ t('reactions.reactedShareHint', { count: fmt(data.reacted), total: fmt(data.total) }) }}</div>
      </v-card>
      <v-card variant="flat" border class="tile">
        <template v-if="isAll">
          <div class="k">{{ t('reactions.per100') }}</div>
          <div class="v">{{ nf1(data.per100) }}</div>
          <div class="s">{{ t('reactions.per100All') }}</div>
        </template>
        <template v-else>
          <div class="k">{{ t('reactions.given') }}</div>
          <div class="v">{{ fmt(data.given) }}</div>
          <div class="s">{{ t('reactions.givenHint') }}</div>
        </template>
      </v-card>
      <v-card variant="flat" border class="tile">
        <div class="k">{{ t('reactions.topReaction') }}</div>
        <div class="v">{{ data.emoji.length ? emojiGlyph(data.emoji[0].key) : '\u2014' }}</div>
        <div class="s">{{ data.emoji.length ? t('words.times', { count: fmt(data.emoji[0].n) }) : '' }}</div>
      </v-card>
    </div>

    <!-- Whole chat: standout members -->
    <div
      v-if="isAll && data.roles.length"
      class="grid mt-3"
      :style="{ gridTemplateColumns: `repeat(${data.roles.length}, 1fr)` }"
    >
      <v-card v-for="r in data.roles" :key="r.role" variant="flat" border class="tile">
        <div class="k">{{ t(`reactions.roles.${r.role}`) }}</div>
        <div class="rx-name">{{ r.name || t('members.deletedAccount') }}</div>
        <div class="s">{{ roleHint(r) }}</div>
      </v-card>
    </div>

    <div class="grid mt-3" style="grid-template-columns: 1fr 1fr">
      <v-card variant="flat" border class="tile">
        <div class="k">{{ isAll ? t('reactions.chatEmoji') : t('reactions.receivedEmoji') }}</div>
        <EmojiGrid :rows="data.emoji" :empty="t('reactions.noData')" />
      </v-card>

      <!-- Whole chat: busiest reactor -> author pairs -->
      <v-card v-if="isAll" variant="flat" border class="tile">
        <div class="k">{{ t('reactions.pairs') }}</div>
        <div v-if="data.pairs.length" class="rx-list">
          <div v-for="(p, i) in data.pairs" :key="i" class="rx-row">
            <span class="rx-who">
              {{ p.fromName || t('members.deletedAccount') }} <span class="rx-arrow">&rarr;</span> {{ p.toName || t('members.deletedAccount') }}
            </span>
            <span class="mono">{{ fmt(p.n) }}</span>
          </div>
        </div>
        <div v-else class="s">{{ t('reactions.noData') }}</div>
      </v-card>

      <!-- One member: which reactions they give -->
      <v-card v-else variant="flat" border class="tile">
        <div class="k">{{ t('reactions.gaveEmoji') }}</div>
        <EmojiGrid :rows="data.gaveEmoji" :empty="t('reactions.noData')" />
      </v-card>
    </div>

    <!-- One member: who reacts to them / whom they react to -->
    <div v-if="!isAll" class="grid mt-3" style="grid-template-columns: 1fr 1fr">
      <v-card v-for="list in people" :key="list.key" variant="flat" border class="tile">
        <div class="k">{{ list.title }}</div>
        <div v-if="list.rows.length" class="rx-list">
          <div v-for="p in list.rows" :key="p.id" class="rx-row">
            <span class="rx-who">{{ p.name || t('members.deletedAccount') }}</span>
            <div style="display: flex; align-items: center; gap: 10px">
              <div class="bar"><i :style="{ width: (p.n / list.rows[0].n) * 100 + '%' }" /></div>
              <span class="mono">{{ fmt(p.n) }}</span>
            </div>
          </div>
        </div>
        <div v-else class="s">{{ t('reactions.noData') }}</div>
      </v-card>
    </div>

    <!-- Most-reacted messages -->
    <template v-if="data.messages.length">
      <div class="k rx-heading">{{ t('reactions.topMessages') }}</div>
      <div class="grid" style="grid-template-columns: 1fr">
        <v-card v-for="m in data.messages" :key="m.uid + m.day + m.n + m.text" variant="flat" border class="tile">
          <div class="rx-quote">{{ m.text }}</div>
          <div class="rx-meta">
            <span class="s">{{ isAll ? `${m.name || t('members.deletedAccount')} \u00b7 ` : '' }}{{ dstr(m.day) }}</span>
            <span class="rx-tags">
              <span v-for="[key, count] in m.em" :key="key" class="wc-chip">
                {{ emojiGlyph(key) }}<small>{{ fmt(count) }}</small>
              </span>
              <b class="mono">{{ fmt(m.n) }} {{ pluralize(m.n, rawMessage('units.reactions')) }}</b>
            </span>
          </div>
        </v-card>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { emojiGlyph } from '../lib/analytics.js'
import { useFormatters } from '../composables/useFormatters.js'
import SectionDownload from './SectionDownload.vue'
import EmojiGrid from './EmojiGrid.vue'

const props = defineProps({
  num: { type: String, default: '04' }, // section number
  isAll: { type: Boolean, default: false },
  data: { type: Object, required: true }, // `reactions` from useAnalytics
})

const { t } = useI18n()
const { fmt, dstr, pluralize, rawMessage, locale } = useFormatters()

const nf1 = (n) =>
  new Intl.NumberFormat(locale.value === 'ru' ? 'ru-RU' : 'en-US', { maximumFractionDigits: 1 }).format(n)

const nf2 = (n) =>
  new Intl.NumberFormat(locale.value === 'ru' ? 'ru-RU' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)

const roleHint = (r) =>
  r.role === 'mostLoved'
    ? t('reactions.roleRate', { rate: nf1(r.rate) })
    : t(r.role === 'mostGiving' ? 'reactions.roleGiven' : 'reactions.roleReceived', { count: fmt(r.count) })

const people = computed(() => [
  { key: 'fans', title: t('reactions.fans'), rows: props.data.fans || [] },
  { key: 'targets', title: t('reactions.targets'), rows: props.data.targets || [] },
])
</script>

<style>
.rx-name {
  font-size: 20px;
  font-weight: 600;
  line-height: 1.3;
  margin: 4px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.rx-list {
  margin-top: 8px;
}
.rx-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 6px 0;
}
.rx-who {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.rx-arrow {
  opacity: 0.55;
}
.rx-heading {
  margin: 20px 0 8px;
}
.rx-quote {
  font-size: 16px;
  line-height: 1.45;
  word-break: break-word;
}
.rx-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px 16px;
  margin-top: 10px;
}
.rx-meta .s {
  margin: 0;
}
.rx-tags {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}
</style>
