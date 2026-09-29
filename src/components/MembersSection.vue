<template>
  <div class="export-section">
    <SectionDownload name="members" />
    <h2 class="sec"><span class="sec-n">{{ num }}</span>{{ t('sections.members') }}</h2>

    <v-card variant="flat" border>
      <v-table density="comfortable">
        <thead>
          <tr>
            <th>{{ t('membersTable.rank') }}</th>
            <th>{{ t('membersTable.member') }}</th>
            <th style="width: 22%">{{ t('membersTable.share') }}</th>
            <th class="text-right">{{ t('membersTable.messages') }}</th>
            <th class="text-right">{{ t('membersTable.pages') }}</th>
            <th class="text-right">{{ t('membersTable.avgLength') }}</th>
            <th class="text-right">{{ t('membersTable.peak') }}</th>
            <th class="text-right">{{ t('membersTable.streak') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(r, i) in board" :key="r.id" style="cursor: pointer" @click="$emit('select', r.id)">
            <td class="mono">{{ i + 1 }}</td>
            <td>
              <div style="font-weight: 500">{{ r.name || t('members.deletedAccount') }}</div>
              <div class="roles">
                <span v-for="roleKey in r.roles" :key="roleKey">{{ t(`roles.${roleKey}`) }}</span>
              </div>
            </td>
            <td>
              <div style="display: flex; align-items: center; gap: 10px">
                <div class="bar"><i :style="{ width: r.share * 100 + '%' }" /></div>
                <span class="mono">{{ Math.round(r.share * 100) }}%</span>
              </div>
            </td>
            <td class="text-right mono">{{ fmt(r.n) }}</td>
            <td class="text-right mono">{{ fmt(r.pages) }}</td>
            <td class="text-right mono">{{ fmt(r.avg) }}</td>
            <td class="text-right mono">{{ String(r.ph).padStart(2, '0') }}:00</td>
            <td class="text-right mono">{{ t('membersTable.streakDays', { count: r.best }) }}</td>
          </tr>
        </tbody>
      </v-table>
    </v-card>
    <div class="s">{{ t('membersTable.hint') }}</div>

    <!-- Source files (only when more than one chat) -->
    <div
      v-if="chatList.length > 1"
      class="grid mt-3"
      :style="{ gridTemplateColumns: `repeat(${Math.min(chatList.length, 4)}, 1fr)` }"
    >
      <v-card v-for="(c, i) in chatList" :key="i" variant="flat" border class="tile">
        <div class="k">{{ t('chatFiles.label', { index: i + 1, total: chatList.length }) }}</div>
        <div style="font-weight: 500">{{ c.name || t('chatFiles.untitled') }}</div>
        <div class="s">
          {{ t('chatFiles.range', { from: dstr(c.first), to: dstr(c.last) }) }}<br />
          {{ t('chatFiles.messages', { count: fmt(c.n) }) }}
        </div>
      </v-card>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import { useFormatters } from '../composables/useFormatters.js'
import SectionDownload from './SectionDownload.vue'

defineProps({
  num: { type: String, default: '04' }, // section number
  board: { type: Array, required: true },
  chatList: { type: Array, required: true },
})
defineEmits(['select'])

const { t } = useI18n()
const { fmt, dstr } = useFormatters()
</script>
