<template>
  <div class="range-filter">
    <div class="range-fields">
      <v-text-field
        type="date"
        :label="t('range.from')"
        :model-value="fromIso"
        :min="minIso"
        :max="maxIso"
        variant="outlined"
        density="comfortable"
        hide-details
        @update:model-value="onFrom"
      />
      <span class="range-dash">&mdash;</span>
      <v-text-field
        type="date"
        :label="t('range.to')"
        :model-value="toIso"
        :min="minIso"
        :max="maxIso"
        variant="outlined"
        density="comfortable"
        hide-details
        @update:model-value="onTo"
      />
    </div>

    <div class="range-presets">
      <v-chip
        v-for="p in presets"
        :key="p.key"
        size="small"
        :variant="p.active ? 'flat' : 'outlined'"
        :color="p.active ? 'primary' : undefined"
        @click="apply(p)"
      >
        {{ p.label }}
      </v-chip>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { dayFromIso, isoFromDay, normalizeRange } from '../lib/analytics.js'

const props = defineProps({
  modelValue: { type: Object, required: true },
  bounds: { type: Object, required: true },
})
const emit = defineEmits(['update:modelValue'])

const { t } = useI18n()

const effective = computed(() => ({
  from: props.modelValue.from ?? props.bounds.min,
  to: props.modelValue.to ?? props.bounds.max,
}))
const minIso = computed(() => isoFromDay(props.bounds.min))
const maxIso = computed(() => isoFromDay(props.bounds.max))
const fromIso = computed(() => isoFromDay(effective.value.from))
const toIso = computed(() => isoFromDay(effective.value.to))

function commit(from, to) {
  const next = normalizeRange(from, to, props.bounds.min, props.bounds.max)
  if (next.from !== props.modelValue.from || next.to !== props.modelValue.to) emit('update:modelValue', next)
}

const onFrom = (iso) => commit(dayFromIso(iso), effective.value.to)
const onTo = (iso) => commit(effective.value.from, dayFromIso(iso))

const presets = computed(() => {
  const { min, max } = props.bounds
  const firstYear = new Date(min * 864e5).getUTCFullYear()
  const lastYear = new Date(max * 864e5).getUTCFullYear()

  const defs = [
    { key: 'all', label: t('range.all'), from: null, to: null },
    { key: 'd30', label: t('range.last30'), from: max - 29, to: max },
    { key: 'd365', label: t('range.lastYear'), from: max - 364, to: max },
  ]
  for (let y = lastYear; y >= firstYear; y--) {
    defs.push({
      key: `y${y}`,
      label: String(y),
      from: Math.floor(Date.UTC(y, 0, 1) / 864e5),
      to: Math.floor(Date.UTC(y, 11, 31) / 864e5),
    })
  }

  // Normalize, then drop presets that collapse into an earlier one
  const seen = new Set()
  return defs
    .map((d) => ({ ...d, ...normalizeRange(d.from, d.to, min, max) }))
    .filter((d) => {
      const id = `${d.from}:${d.to}`
      if (seen.has(id)) return false
      seen.add(id)
      return true
    })
    .map((d) => ({ ...d, active: d.from === props.modelValue.from && d.to === props.modelValue.to }))
})

const apply = (p) => commit(p.from, p.to)
</script>

<style scoped>
.range-filter {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px 20px;
  margin-bottom: 16px;
}
.range-fields {
  display: flex;
  align-items: center;
  gap: 10px;
}
.range-fields :deep(.v-input) {
  width: 170px;
}
.range-presets {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
</style>
