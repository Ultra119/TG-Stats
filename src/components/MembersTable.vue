<template>
  <div>
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
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import { useFormatters } from '../composables/useFormatters.js'

const { t } = useI18n()
const { fmt } = useFormatters()

defineProps({ board: { type: Array, required: true } })
defineEmits(['select'])
</script>
