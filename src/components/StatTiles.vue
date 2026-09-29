<template>
  <div class="grid" :style="{ gridTemplateColumns: `repeat(${cols}, 1fr)` }">
    <v-card v-for="row in items" :key="row[0]" variant="flat" border class="tile">
      <div class="k">{{ row[0] }}</div>
      <div class="v">{{ row[1] }}</div>
      <div class="s">{{ row[2] }}</div>
    </v-card>
  </div>
</template>

<script setup>
// items: [[label, value, hint], ...]
defineProps({
  items: { type: Array, required: true },
  cols: { type: Number, default: 5 },
})
</script>
