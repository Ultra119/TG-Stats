<template>
  <svg class="chart" viewBox="0 0 400 210" width="100%">
    <g v-for="b in bars" :key="b.year">
      <rect
        :x="10 + b.x"
        :y="190 - b.h"
        :width="b.w"
        :height="b.h"
        fill="rgb(var(--v-theme-primary))"
        :fill-opacity="b.year === peakYear ? 1 : 0.35"
      />
      <text :x="10 + b.x + b.w / 2" :y="190 - b.h - 6" font-size="9" text-anchor="middle">{{ fmt(b.value) }}</text>
      <text :x="10 + b.x + b.w / 2" y="204" font-size="10" text-anchor="middle" fill-opacity="0.7">{{ b.year }}</text>
    </g>
  </svg>
</template>

<script setup>
import { computed } from 'vue'
import { computeYearBars } from '../analytics.js'
import { useFormatters } from '../composables/useFormatters.js'

const { fmt } = useFormatters()

const props = defineProps({
  series: { type: Array, required: true }, // [{year, value}]
  peakYear: { type: String, default: '' },
})

const bars = computed(() => computeYearBars(props.series, { containerWidth: 380 }))
</script>
