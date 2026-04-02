<script setup lang="ts">
import { computed } from 'vue'
import type { TimePeriod } from '../types'

const props = defineProps<{
  period: TimePeriod
  userName: string
  visible: boolean
}>()

const greetingText = computed(() => {
  const periodMap: Record<TimePeriod, string> = {
    morning: 'Good morning',
    afternoon: 'Good afternoon',
    evening: 'Good evening',
    night: 'Good night',
  }
  const base = periodMap[props.period]
  return props.userName ? `${base}, ${props.userName}` : base
})
</script>

<template>
  <div v-if="visible" class="text-center select-none">
    <div
      class="text-2xl font-light text-white/90"
      style="text-shadow: 0 1px 8px rgba(0, 0, 0, 0.4)"
    >
      {{ greetingText }}
    </div>
  </div>
</template>
