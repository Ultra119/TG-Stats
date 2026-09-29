<template>
  <svg class="chart" viewBox="0 0 640 210" width="100%">
    <text v-for="(d, i) in dow" :key="'d' + i" x="0" :y="22 + i * 26" font-size="11" fill-opacity="0.7">{{ d }}</text>
    <text v-for="h in 8" :key="'h' + h" :x="34 + (h - 1) * 75" y="10" font-size="10" fill-opacity="0.7">{{ (h - 1) * 3 }}</text>

    <template v-for="(d, di) in dow" :key="'row' + di">
      <rect
        v-for="hIdx in 24"
        :key="di + '-' + hIdx"
        :x="34 + (hIdx - 1) * 25"
        :y="16 + di * 26"
        width="22"
        height="22"
        fill="rgb(var(--v-theme-primary))"
        :fill-opacity="opacity(hd[di * 24 + hIdx - 1])"
      >
        <title>{{ d }} {{ hIdx - 1 }}:00 — {{ fmt(hd[di * 24 + hIdx - 1]) }}</title>
      </rect>
    </template>
  </svg>
</template>

<script setup>
import { computed } from 'vue'
import { heatmapOpacity } from '../analytics.js'
import { useFormatters } from '../composables/useFormatters.js'

const props = defineProps({ hd: { type: Array, required: true } }) // 168 values: weekday*24+hour

const { fmt, rawMessage } = useFormatters()
const dow = computed(() => rawMessage('dow.short'))
const opacity = computed(() => heatmapOpacity(props.hd))
</script>
