<script setup lang="ts">
const settingsOpen = defineModel<boolean>('settingsOpen', { required: true })

defineProps<{ isFavorited: boolean }>()
defineEmits<{ 'toggle-favorite': [] }>()
</script>

<template>
  <div class="fixed bottom-4 right-4 z-40 flex items-center gap-1.5">
    <!-- Favorite -->
    <button
      type="button"
      :aria-label="isFavorited ? 'Unfavorite current art' : 'Favorite current art'"
      class="size-10 rounded-full flex items-center justify-center text-white/75 hover:text-white hover:bg-white/10 backdrop-blur-md transition-colors"
      :class="{ 'bg-white/15 text-white': isFavorited }"
      @click="$emit('toggle-favorite')"
    >
      <UIcon
        :name="isFavorited ? 'i-heroicons-heart-solid' : 'i-heroicons-heart'"
        class="size-[18px]"
      />
    </button>

    <!-- Settings -->
    <button
      type="button"
      aria-label="Settings"
      class="size-10 rounded-full flex items-center justify-center text-white/75 hover:text-white hover:bg-white/10 backdrop-blur-md transition-colors"
      :class="{ 'bg-white/15 text-white': settingsOpen }"
      @click="settingsOpen = !settingsOpen"
    >
      <UIcon name="i-heroicons-cog-6-tooth" class="size-6" />
    </button>
  </div>
</template>
