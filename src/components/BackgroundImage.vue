<script setup lang="ts">
import { ref, watch } from 'vue'
import type { CuratedCard } from '../types'

const props = withDefaults(
  defineProps<{
    art: CuratedCard | null
    isLoading: boolean
    verticalOffset: number
  }>(),
  { verticalOffset: 50 },
)

// Crossfade: two images, swap which is "front"
const imgA = ref('')
const imgB = ref('')
const offsetA = ref(50)
const offsetB = ref(50)
const showA = ref(true)
const transitioning = ref(false)

let artChanging = false

watch(
  () => props.art?.slug,
  () => {
    if (!props.art) return

    const newUrl = props.art.imageUrl
    const newOffset = props.art.verticalOffset ?? 50
    artChanging = true
    if (showA.value) {
      if (imgB.value === newUrl) {
        offsetB.value = newOffset
        showA.value = false
        return
      }
      imgB.value = newUrl
      offsetB.value = newOffset
    } else {
      if (imgA.value === newUrl) {
        offsetA.value = newOffset
        showA.value = true
        return
      }
      imgA.value = newUrl
      offsetA.value = newOffset
    }
  },
  { immediate: true },
)

// Dev: sync live offset adjustments to the currently visible slot
// Skip when the change is just the art switching (slug watcher handles that)
watch(
  () => props.verticalOffset,
  (v) => {
    if (artChanging) {
      artChanging = false
      return
    }
    if (showA.value) offsetA.value = v
    else offsetB.value = v
  },
)

function onImageLoad(which: 'a' | 'b') {
  // Only crossfade to the image that was just loaded into the "back"
  if (which === 'a' && showA.value) return
  if (which === 'b' && !showA.value) return

  transitioning.value = true
  showA.value = which === 'a'
  setTimeout(() => {
    transitioning.value = false
  }, 500)
}

function onImageError(which: 'a' | 'b') {
  // Clear the broken source so it doesn't show
  if (which === 'a') imgA.value = ''
  else imgB.value = ''
}
</script>

<template>
  <div class="fixed inset-0 bg-black">
    <!-- Image A -->
    <img
      v-if="imgA"
      :src="imgA"
      alt=""
      class="absolute inset-0 h-full w-full transition-opacity duration-500"
      :class="showA ? 'opacity-100' : 'opacity-0'"
      :style="{ objectFit: 'cover', objectPosition: `center ${offsetA}%` }"
      @load="onImageLoad('a')"
      @error="onImageError('a')"
    />

    <!-- Image B -->
    <img
      v-if="imgB"
      :src="imgB"
      alt=""
      class="absolute inset-0 h-full w-full transition-opacity duration-500"
      :class="showA ? 'opacity-0' : 'opacity-100'"
      :style="{ objectFit: 'cover', objectPosition: `center ${offsetB}%` }"
      @load="onImageLoad('b')"
      @error="onImageError('b')"
    />

    <!-- Dark gradient overlay for text readability -->
    <div
      class="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20"
    />

    <!-- Loading state -->
    <div
      v-if="isLoading && !art"
      class="absolute inset-0 flex items-center justify-center"
    >
      <div class="text-center">
        <i class="ms ms-planeswalker ms-4x text-white/60 animate-pulse" />
        <p class="mt-4 text-white/50 text-sm">Loading artwork...</p>
      </div>
    </div>
  </div>
</template>
