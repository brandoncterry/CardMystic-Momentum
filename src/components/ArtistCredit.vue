<script setup lang="ts">
import type { CuratedCard } from '../types'

defineProps<{
  art: CuratedCard | null
  visible: boolean
}>()
</script>

<template>
  <div
    v-if="art"
    class="fixed bottom-4 left-4 z-20 max-w-lg"
    :class="visible ? '' : 'sr-only'"
  >
    <div
      class="rounded-lg bg-black/40 px-3 py-1.5 text-sm text-white/80 backdrop-blur-sm"
    >
      <a
        :href="art.scryfallUri"
        target="_blank"
        rel="noopener noreferrer"
        class="font-medium text-white/90 hover:text-white underline decoration-white/30 hover:decoration-white/60 transition-colors"
      >
        "{{ art.cardName }}"
      </a>
      <span class="mx-1">by</span>
      <span class="font-medium">{{ art.artistName }}</span>
      <span class="mx-1">&middot;</span>
      <span class="text-white/60">&copy; Wizards of the Coast</span>
    </div>
  </div>
</template>
