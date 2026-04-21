<script setup lang="ts">
import { computed } from 'vue'
import type { UserSettings } from '../types'
import { CLOCK_SIZES, DATE_SIZES, FONT_STACKS } from '../utils/typography'

const props = defineProps<{
  time: string
  date: string
  visible: boolean
  readability: UserSettings['textReadability']
  fontFamily: UserSettings['fontFamily']
  clockSize: UserSettings['clockSize']
  dateSize: UserSettings['dateSize']
}>()

const fontStack = computed(() => FONT_STACKS[props.fontFamily] || undefined)
const clockSizeClass = computed(() => CLOCK_SIZES[props.clockSize])
const dateSizeClass = computed(() => DATE_SIZES[props.dateSize])

const timeStyle = computed(() => ({
  fontFamily: fontStack.value,
  ...(props.readability === 'strong'
    ? {
        textShadow:
          '0 2px 6px rgba(0,0,0,0.75), 0 0 24px rgba(0,0,0,0.45)',
        paintOrder: 'stroke fill',
        WebkitTextStroke: '1.25px rgba(0,0,0,0.55)',
      }
    : { textShadow: '0 2px 20px rgba(0,0,0,0.55)' }),
}))

const dateStyle = computed(() => ({
  fontFamily: fontStack.value,
  ...(props.readability === 'strong'
    ? {
        textShadow: '0 1px 4px rgba(0,0,0,0.7)',
        paintOrder: 'stroke fill',
        WebkitTextStroke: '0.75px rgba(0,0,0,0.5)',
      }
    : { textShadow: '0 1px 8px rgba(0,0,0,0.45)' }),
}))
</script>

<template>
  <div v-if="visible" class="text-center select-none">
    <div
      class="font-light text-white tracking-tight leading-none"
      :class="clockSizeClass"
      :style="timeStyle"
    >
      {{ time }}
    </div>
    <div
      class="mt-3 font-normal text-white/75 tracking-wide"
      :class="dateSizeClass"
      :style="dateStyle"
    >
      {{ date }}
    </div>
  </div>
</template>
