<template>
  <v-card variant="flat" border class="tile" style="padding: 24px">
    <div class="k">{{ isAll ? t('titleCard.chatLabel', { chatName }) : t('titleCard.personalLabel') }}</div>
    <div class="status">{{ title }}</div>
    <div class="s">{{ why }}</div>
  </v-card>
</template>

<script setup>
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

defineProps({
  title: { type: String, required: true },
  why: { type: String, required: true },
  isAll: { type: Boolean, default: false },
  chatName: { type: String, default: '' },
})
</script>
