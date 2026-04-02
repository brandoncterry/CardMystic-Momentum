<script setup lang="ts">
defineProps<{
  time: string
  date: string
  visible: boolean
}>()
</script>

<template>
  <div v-if="visible" class="text-center select-none">
    <div
      class="text-7xl font-semibold text-white tracking-tight"
      style="text-shadow: 0 2px 12px rgba(0, 0, 0, 0.5)"
    >
      {{ time }}
    </div>
    <div
      class="mt-2 text-lg text-white/70 font-light"
      style="text-shadow: 0 1px 6px rgba(0, 0, 0, 0.4)"
    >
      {{ date }}
    </div>
  </div>
</template>
