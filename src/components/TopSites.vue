<script setup lang="ts">
import { reactive } from 'vue'
import { useTopSites } from '../composables/useTopSites'

defineProps<{
  visible: boolean
}>()

const { sites, isLoading } = useTopSites()
const failedFavicons = reactive(new Set<string>())

function onFaviconError(url: string) {
  failedFavicons.add(url)
}
</script>

<template>
  <div v-if="visible" class="flex items-start justify-center gap-4 mt-6 flex-wrap">
    <!-- Loading skeletons -->
    <template v-if="isLoading">
      <div v-for="i in 6" :key="i" class="flex flex-col items-center gap-1.5 w-16">
        <div class="w-12 h-12 rounded-full bg-white/10 animate-pulse" />
        <div class="w-10 h-2 rounded bg-white/10 animate-pulse" />
      </div>
    </template>

    <!-- Site shortcuts -->
    <template v-else>
      <a
        v-for="site in sites"
        :key="site.url"
        :href="site.url"
        class="flex flex-col items-center gap-1.5 w-16 group"
      >
        <div
          class="w-12 h-12 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center border border-white/10 group-hover:bg-white/20 transition-colors"
        >
          <UIcon
            v-if="failedFavicons.has(site.url)"
            name="i-heroicons-globe-alt"
            class="text-white/60 text-xl"
          />
          <img
            v-else
            :src="site.favicon"
            :alt="site.title"
            class="w-6 h-6 rounded-sm"
            @error="onFaviconError(site.url)"
          />
        </div>
        <span
          class="text-xs text-white/70 truncate w-full text-center select-none"
          style="text-shadow: 0 1px 4px rgba(0, 0, 0, 0.5)"
        >
          {{ site.title }}
        </span>
      </a>

      <!-- Add shortcut placeholder -->
      <button class="flex flex-col items-center gap-1.5 w-16 group">
        <div
          class="w-12 h-12 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center border border-dashed border-white/20 group-hover:bg-white/10 transition-colors"
        >
          <UIcon name="i-heroicons-plus" class="text-white/50 text-lg" />
        </div>
        <span
          class="text-xs text-white/50 select-none"
          style="text-shadow: 0 1px 4px rgba(0, 0, 0, 0.5)"
        >
          Add shortcut
        </span>
      </button>
    </template>
  </div>
</template>
