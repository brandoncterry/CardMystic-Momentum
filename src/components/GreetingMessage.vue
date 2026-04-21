<script setup lang="ts">
import { computed } from 'vue'
import type { TimePeriod, UserSettings } from '../types'
import { FONT_STACKS, GREETING_SIZES } from '../utils/typography'

const props = defineProps<{
  period: TimePeriod
  userName: string
  visible: boolean
  readability: UserSettings['textReadability']
  fontFamily: UserSettings['fontFamily']
  greetingSize: UserSettings['greetingSize']
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

const sizeClass = computed(() => GREETING_SIZES[props.greetingSize])

const textStyle = computed(() => ({
  fontFamily: FONT_STACKS[props.fontFamily] || undefined,
  ...(props.readability === 'strong'
    ? {
        textShadow: '0 1px 4px rgba(0,0,0,0.7), 0 0 16px rgba(0,0,0,0.4)',
        paintOrder: 'stroke fill',
        WebkitTextStroke: '0.75px rgba(0,0,0,0.5)',
      }
    : { textShadow: '0 1px 10px rgba(0,0,0,0.45)' }),
}))
</script>

<template>
  <div v-if="visible" class="text-center select-none">
    <div
      class="font-medium text-white tracking-wide"
      :class="sizeClass"
      :style="textStyle"
    >
      {{ greetingText }}
    </div>
  </div>
</template>
