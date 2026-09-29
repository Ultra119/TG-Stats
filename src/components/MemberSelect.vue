<template>
  <div class="member-select-row">
    <v-select
      :model-value="modelValue"
      :items="items"
      :label="t('members.label')"
      variant="outlined"
      density="comfortable"
      hide-details
      style="max-width: 340px"
      @update:model-value="$emit('update:modelValue', $event)"
    />
    <div class="s" style="margin: 0">
      {{
        t('members.observed', {
          date: dstr(first),
          count: fmt(total),
          files: fileCount,
          filesWord: pluralize(fileCount, rawMessage('units.files')),
          chats,
          chatsWord: pluralize(chats, rawMessage('units.chats')),
        })
      }}
    </div>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import { useFormatters } from '../composables/useFormatters.js'

const { t } = useI18n()
const { fmt, dstr, pluralize, rawMessage } = useFormatters()

defineProps({
  modelValue: { type: String, required: true },
  items: { type: Array, required: true },
  first: { type: Number, required: true },
  total: { type: Number, required: true },
  fileCount: { type: Number, required: true },
  chats: { type: Number, required: true },
})
defineEmits(['update:modelValue'])
</script>
