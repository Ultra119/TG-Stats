<template>
  <v-btn
    class="export-btn"
    data-export-skip
    icon
    size="x-small"
    density="compact"
    variant="text"
    :loading="busy"
    :title="t('export.section')"
    :aria-label="t('export.section')"
    @click.stop="save"
  >
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path d="M5,20H19V18H5M19,9H15V3H9V9H5L12,16L19,9Z" fill="currentColor" />
    </svg>
  </v-btn>
</template>

<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useTheme } from 'vuetify'
import { renderSectionToBlob } from '../exportSection.js'

const props = defineProps({
  name: { type: String, required: true }, // file name part: tg-stats-<name>.png
  pad: { type: Number, default: 24 }, // breathing room around the block; 0 for blocks that are cards themselves
})

const { t } = useI18n()
const theme = useTheme()
const busy = ref(false)

async function save(event) {
  const el = event.currentTarget.closest('.export-section')
  if (!el || busy.value) return

  busy.value = true
  try {
    const blob = await renderSectionToBlob(el, { pad: props.pad, background: theme.current.value.colors.background })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `tg-stats-${props.name}.png`
    a.click()
    URL.revokeObjectURL(url)
  } catch (e) {
    console.error('PNG export failed', e)
  } finally {
    busy.value = false
  }
}
</script>

<style>
.export-section {
  position: relative;
}
.export-btn {
  position: absolute !important;
  top: 6px;
  right: 6px;
  z-index: 2;
  opacity: 0.3;
  transition: opacity 0.15s;
}
.export-section:hover > .export-btn,
.export-btn:focus-visible {
  opacity: 1;
}
@media (hover: none) {
  .export-btn {
    opacity: 0.6;
  }
}
</style>
